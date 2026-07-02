import importlib
import logging
import os
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from bson import ObjectId
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from pymongo import MongoClient, UpdateOne
from scipy import sparse
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler, minmax_scale

tabulate_spec = importlib.util.find_spec("tabulate")
tabulate = None
if tabulate_spec:
    tabulate = importlib.import_module("tabulate").tabulate

load_dotenv()
BACKEND_ENV_PATH = Path(__file__).resolve().parents[1] / "backend" / ".env"
if BACKEND_ENV_PATH.exists():
    load_dotenv(BACKEND_ENV_PATH)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
LOGGER = logging.getLogger("recommendation")

INTERACTION_WEIGHTS = {
    "view": 1.0,
    "wishlist": 2.0,
    "rating": 4.0,
    "order": 5.0,
}


def _normalize_user_identifier(value):
    if value is None:
        return None
    if isinstance(value, ObjectId):
        return str(value)
    value = str(value).strip()
    return value or None


def _attempt_object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return None


def get_database():
    uri = os.getenv("DB_URL") or os.getenv("MONGO_URI")
    if not uri:
        raise RuntimeError("DB_URL or MONGO_URI must be set in environment")

    client = MongoClient(uri)
    db_name = os.getenv("MONGO_DB_NAME")
    if db_name:
        return client[db_name]

    try:
        return client.get_default_database()
    except Exception as exc:
        raise RuntimeError("MONGO_DB_NAME is required when URI has no default database") from exc


def fetch_collections(db):
    LOGGER.info("Fetching collections from MongoDB...")
    books = list(db.book.find({}))
    interactions = list(db.interaction.find({}))
    reviews = list(db.review.find({}))
    users = list(db.user.find({}))
    authors = list(db.author.find({}))
    genres = list(db.genre.find({}))
    orders = list(db.order.find({}))
    LOGGER.info(
        "Fetched %s books, %s interactions, %s reviews, %s users",
        len(books),
        len(interactions),
        len(reviews),
        len(users)
    )
    LOGGER.info("Fetched %s orders", len(orders))
    return books, interactions, reviews, users, authors, genres, orders


def prepare_books_dataframe(books, authors, genres, reviews):
    if not books:
        return pd.DataFrame()

    author_map = {str(a["_id"]): a for a in authors}
    genre_map = {str(g["_id"]): g for g in genres}
    reviews_map = defaultdict(list)
    for review in reviews or []:
        product_id = review.get("productId")
        if not product_id:
            continue
        text = review.get("content") or review.get("review") or ""
        if text:
            reviews_map[str(product_id)].append(str(text))

    prepared = []
    for book in books:
        book_id = str(book["_id"])
        author_id = book.get("authorId")
        genre_id = book.get("genreId")
        author = author_map.get(str(author_id)) if author_id else {}
        genre = genre_map.get(str(genre_id)) if genre_id else {}

        text_parts = [
            book.get("title", ""),
            book.get("description", ""),
            author.get("name", ""),
            author.get("bio", ""),
            genre.get("name", ""),
            book.get("publisher", ""),
            book.get("language", ""),
        ]
        attributes = book.get("attributes")
        if isinstance(attributes, list):
            text_parts.extend([str(attr) for attr in attributes])
        review_texts = reviews_map.get(book_id, [])
        if review_texts:
            text_parts.append(" ".join(review_texts))

        text_blob = " ".join(filter(None, text_parts))
        prepared.append({
            "bookId": book_id,
            "title": book.get("title", ""),
            "raw": book,
            "authorName": author.get("name"),
            "genreName": genre.get("name"),
            "text": text_blob,
            "soldQuantity": book.get("soldQuantity", 0) or 0,
            "reviewsCount": book.get("reviewsCount", 0) or 0,
            "averageRating": book.get("averageRating", 0) or 0,
        })

    return pd.DataFrame(prepared)


def build_interaction_frame(interactions, reviews, orders, user_profiles, email_lookup):
    records = []

    for interaction in interactions:
        user_id = _normalize_user_identifier(interaction.get("userId"))
        book_id = interaction.get("bookId")
        if not user_id or not book_id:
            continue
        interaction_type = (interaction.get("interactionType") or "").lower()
        if interaction_type == "order":
            weight = _extract_purchase_weight(interaction)
            if weight <= 0:
                weight = INTERACTION_WEIGHTS.get("order", 5.0)
        else:
            weight = INTERACTION_WEIGHTS.get(interaction_type, 0)
        if weight <= 0:
            continue
        records.append({
            "userId": user_id,
            "productId": str(book_id),
            "weight": float(weight),
            "source": "interaction",
        })

    for review in reviews:
        user_id = _normalize_user_identifier(review.get("userId"))
        product_id = review.get("productId")
        rating = review.get("rating")
        if not user_id or not product_id or rating is None:
            continue
        records.append({
            "userId": user_id,
            "productId": str(product_id),
            "weight": float(rating),
            "source": "review",
        })

    for order in orders or []:
        if order is None or not order.get("products"):
            continue
        if order.get("completed") is False:
            continue
        user_id = _resolve_order_user(order, user_profiles, email_lookup)
        if not user_id:
            continue
        for product in order.get("products", []):
            book_id = product.get("productId")
            if not book_id:
                continue
            weight = _extract_purchase_weight(product)
            if weight <= 0:
                continue
            records.append({
                "userId": user_id,
                "productId": str(book_id),
                "weight": float(weight),
                "source": "order",
            })

    if not records:
        empty = pd.DataFrame(columns=["userId", "productId", "raw_value", "interaction_strength"])
        return empty, empty

    df = pd.DataFrame(records)
    df = df.groupby(["userId", "productId"], as_index=False)["weight"].sum()
    df = df.rename(columns={"weight": "raw_value"})

    normalized = df.copy()
    values = normalized["raw_value"].to_numpy(dtype=float)
    if np.allclose(values.max(), values.min()):
        normalized["interaction_strength"] = np.where(values > 0, 5.0, 0.0)
    else:
        scaler = MinMaxScaler(feature_range=(1, 5))
        normalized["interaction_strength"] = scaler.fit_transform(values.reshape(-1, 1)).ravel()

    return df, normalized


def normalize_rows(df):
    if df is None or df.empty:
        return df
    normalized = df.copy()
    for idx in normalized.index:
        values = normalized.loc[idx].to_numpy(dtype=float)
        if np.allclose(values.max(), values.min()):
            normalized.loc[idx] = 0.0
        else:
            normalized.loc[idx] = minmax_scale(values, feature_range=(0, 1))
    return normalized


def compute_content_scores(books_df, interaction_df):
    if books_df.empty or interaction_df.empty:
        return pd.DataFrame(), {}

    tfidf = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        stop_words="english"
    )
    book_matrix = tfidf.fit_transform(books_df["text"])
    book_matrix = book_matrix.tocsr()
    book_ids = books_df["bookId"].tolist()
    book_index = {book_id: idx for idx, book_id in enumerate(book_ids)}

    user_scores = {}
    user_consumed = defaultdict(set)
    for _, row in interaction_df.iterrows():
        user_consumed[row["userId"]].add(row["productId"])

    grouped = interaction_df.groupby("userId")
    for user_id, group in grouped:
        weight_row = sparse.lil_matrix((1, len(book_ids)))
        for _, interaction in group.iterrows():
            idx = book_index.get(interaction["productId"])
            if idx is not None:
                weight_row[0, idx] += interaction["weight"]

        if weight_row.nnz == 0:
            continue

        user_vector = weight_row.dot(book_matrix)
        if user_vector.nnz == 0:
            continue

        dense_vector = user_vector.toarray().ravel()
        norm = np.linalg.norm(dense_vector)
        if norm == 0:
            continue

        dense_vector /= norm
        scores = np.asarray(book_matrix.dot(dense_vector.reshape(-1, 1))).ravel()
        user_scores[user_id] = scores

    if not user_scores:
        return pd.DataFrame(), user_consumed

    cb_df = pd.DataFrame.from_dict(user_scores, orient="index", columns=book_ids)
    cb_df = normalize_rows(cb_df)

    for user_id, consumed in user_consumed.items():
        if user_id in cb_df.index and consumed:
            cb_df.loc[user_id, list(consumed)] = 0.0

    return cb_df, user_consumed


def compute_collaborative_scores(interaction_df, book_ids):
    if interaction_df.empty:
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

    interaction_matrix = interaction_df.pivot_table(
        index="userId",
        columns="productId",
        values="weight",
        aggfunc="sum",
        fill_value=0.0
    )

    missing_cols = [bid for bid in book_ids if bid not in interaction_matrix.columns]
    for col in missing_cols:
        interaction_matrix[col] = 0.0
    interaction_matrix = interaction_matrix[book_ids]

    if interaction_matrix.shape[0] < 2 or interaction_matrix.shape[1] < 2:
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

    n_components = min(
        50,
        interaction_matrix.shape[0] - 1,
        interaction_matrix.shape[1] - 1
    )
    if n_components < 1:
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

    svd = TruncatedSVD(n_components=n_components, random_state=42)
    user_features = svd.fit_transform(interaction_matrix)
    item_features = svd.components_.T

    cf_scores = np.dot(user_features, item_features.T)
    cf_df = pd.DataFrame(
        cf_scores,
        index=interaction_matrix.index,
        columns=interaction_matrix.columns
    )

    # zero out items the user has already consumed, normalize so that remaining items get a full 0–1 spread of CF scores
    for user_id in cf_df.index:
        consumed = interaction_df[interaction_df["userId"] == user_id]["productId"].tolist()
        if consumed:
            cf_df.loc[user_id, consumed] = 0.0

    cf_df = normalize_rows(cf_df)

    factor_columns = [f"factor_{i}" for i in range(user_features.shape[1])]
    user_factors_df = pd.DataFrame(user_features, index=interaction_matrix.index, columns=factor_columns)
    item_factors_df = pd.DataFrame(item_features, index=interaction_matrix.columns, columns=factor_columns)

    return cf_df, interaction_matrix, user_factors_df, item_factors_df


def build_popularity_ranking(books_df):
    if books_df.empty:
        return []
    temp = books_df.copy()
    temp["popularityScore"] = (
        temp["soldQuantity"].astype(float) * 1.5
        + temp["reviewsCount"].astype(float)
        + temp["averageRating"].astype(float) * 2.0
    )
    temp = temp.sort_values(by="popularityScore", ascending=False)
    return temp["bookId"].tolist()


def round_score(value):
    if value is None or np.isnan(value):
        return None
    return float(round(float(value), 6))


def scale_to_5(value):
    if value is None or np.isnan(value):
        return None
    return float(round(1.0 + 4.0 * float(value), 6))


def build_user_profiles(users):
    profiles = {}
    for user in users:
        if user.get("role") != "user":
            continue
        user_ref = user.get("_id")
        if not user_ref:
            continue
        primary_identifier = str(user_ref)
        identifiers = [primary_identifier]
        firebase_id = user.get("firebaseId")
        if firebase_id:
            identifiers.append(firebase_id)
        for identifier in identifiers:
            normalized = _normalize_user_identifier(identifier)
            if normalized and normalized not in profiles:
                profiles[normalized] = {
                    "userRef": user_ref,
                    "raw": user,
                    "primaryId": primary_identifier
                }
    return profiles


def build_email_lookup(user_profiles):
    lookup = {}
    for payload in user_profiles.values():
        raw_user = payload.get("raw") or {}
        email = (raw_user.get("email") or "").strip().lower()
        primary_id = payload.get("primaryId")
        if email and primary_id and email not in lookup:
            lookup[email] = primary_id
    return lookup


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _extract_purchase_weight(source):
    metadata = source.get("metadata", {}) if isinstance(source.get("metadata"), dict) else {}
    quantity = (
        source.get("quantity")
        or source.get("qty")
        or source.get("count")
        or metadata.get("quantity")
        or 1.0
    )
    price = source.get("price") or metadata.get("price") or 0.0
    qty_val = max(_safe_float(quantity, 1.0), 0.0)
    price_val = max(_safe_float(price, 0.0), 0.0)
    return qty_val * price_val


def _resolve_order_user(order, user_profiles, email_lookup):
    candidates = [
        _normalize_user_identifier(order.get("userId")),
        _normalize_user_identifier(order.get("firebaseId")),
        _normalize_user_identifier(order.get("customerId")),
    ]
    for candidate in candidates:
        if candidate and candidate in user_profiles:
            return user_profiles[candidate].get("primaryId") or candidate
    email = (order.get("email") or "").strip().lower()
    if email and email in email_lookup:
        return email_lookup[email]
    return None


def _truncate(text, limit=200):
    if not text:
        return ""
    text = str(text).strip()
    return text if len(text) <= limit else f"{text[:limit-3]}..."


def _print_header(title):
    print(f"\n========== {title} ==========")


def _print_table(df, title, max_rows=None, max_cols=None, include_index=False, floatfmt=".4f"):
    if df is None or df.empty:
        return
    table_df = df.copy()
    if max_rows is not None:
        table_df = table_df.head(max_rows)
    if max_cols is not None and max_cols < len(table_df.columns):
        keep_cols = list(table_df.columns[:max_cols])
        table_df = table_df[keep_cols]
    if include_index:
        table_df = table_df.reset_index()
    _print_header(title)
    if tabulate:
        print(tabulate(table_df, headers="keys", tablefmt="github", showindex=False, floatfmt=floatfmt))
    else:
        print(table_df.to_string(index=False))


def print_product_feature_profiles(books_df, limit=5):
    if books_df.empty:
        return
    _print_header("HỒ SƠ ĐẶC TRƯNG SẢN PHẨM")
    for idx, row in books_df.head(limit).iterrows():
        print(f"Sản phẩm {idx + 1}:")
        print(f"ID: {row['bookId']}")
        print(f"Chuỗi đặc trưng: {_truncate(row.get('text', ''), 220)}\n")


def print_content_based_examples(cb_scores, books_df, limit=5):
    if cb_scores.empty:
        return
    user_id = cb_scores.index[0]
    row = cb_scores.loc[user_id]
    ranked = row[row > 0].sort_values(ascending=False).head(limit)
    if ranked.empty:
        return
    book_lookup = books_df.set_index("bookId")["title"].to_dict()
    _print_header(f"GỢI Ý CHO USER: {user_id}")
    print("Gợi ý sản phẩm:")
    for bid, score in ranked.items():
        title = book_lookup.get(bid, bid)
        print(f"{bid} | {title} | Cosine Similarity: {round(score, 3)}")


def print_interaction_matrix(interaction_matrix, title, max_rows=5, max_cols=8):
    if interaction_matrix.empty:
        return
    preview = interaction_matrix.iloc[:max_rows, :max_cols].copy()

    preview.index = [f"User{i+1}" for i in range(len(preview.index))]
    preview.columns = [f"Book{i+1}" for i in range(len(preview.columns))]

    preview = preview.reset_index()
    _print_table(preview, title, include_index=False, floatfmt=".2f")


def print_normalized_interactions(normalized_df, limit=10):
    if normalized_df.empty:
        return
    preview = normalized_df[["userId", "productId", "interaction_strength"]].copy()
    preview = preview.sort_values("interaction_strength", ascending=False).head(limit)
    _print_table(preview, "BẢNG ĐIỂM TƯƠNG TÁC ĐÃ CHUẨN HÓA")


def print_user_factors(user_factors_df, max_rows=5):
    if user_factors_df.empty:
        return
    _print_table(
        user_factors_df,
        "USER FACTORS",
        max_rows=max_rows,
        include_index=True
    )


def print_item_factors(item_factors_df, max_rows=5):
    if item_factors_df.empty:
        return
    _print_table(
        item_factors_df,
        "ITEM FACTORS",
        max_rows=max_rows,
        include_index=True
    )


def print_cf_predictions(cf_scores, books_df, limit=7):
    if cf_scores.empty:
        return
    user_id = cf_scores.index[0]
    row = cf_scores.loc[user_id]
    ranked = row[row > 0].sort_values(ascending=False).head(limit)
    if ranked.empty:
        return
    book_lookup = books_df.set_index("bookId")["title"].to_dict()
    prediction_rows = []
    for bid, score in ranked.items():
        prediction_rows.append({
            "userId": user_id,
            "productId": bid,
            "title": book_lookup.get(bid, bid),
            "predicted_score": scale_to_5(score)
        })
    df = pd.DataFrame(prediction_rows)
    _print_table(df, "DỰ ĐOÁN VÀ ĐỀ XUẤT SẢN PHẨM CHO USER")


def print_hybrid_scores_table(hybrid_df):
    if hybrid_df.empty:
        return
    _print_table(hybrid_df, "BẢNG ĐIỂM GỢI Ý HYBRID")


def build_hybrid_debug_table(user_id, cf_scores, cb_scores, cf_weight, cb_weight, limit=10):
    if user_id is None:
        return pd.DataFrame()
    cf_row = cf_scores.loc[user_id] if not cf_scores.empty and user_id in cf_scores.index else None
    cb_row = cb_scores.loc[user_id] if not cb_scores.empty and user_id in cb_scores.index else None
    if cf_row is None and cb_row is None:
        return pd.DataFrame()
    combined = pd.Series(dtype=float)
    if cf_row is not None:
        combined = cf_weight * cf_row
    if cb_row is not None:
        combined = combined.add(cb_weight * cb_row, fill_value=0.0)
    combined = combined[combined > 0].sort_values(ascending=False).head(limit)
    rows = []
    for product_id, hybrid_value in combined.items():
        rows.append({
            "product_id": product_id,
            "CF_Score": round(float(cf_row.get(product_id, 0.0)) if cf_row is not None else 0.0, 6),
            "CB_Score": round(float(cb_row.get(product_id, 0.0)) if cb_row is not None else 0.0, 6),
            "Hybrid_Score": round(float(hybrid_value), 6),
        })
    return pd.DataFrame(rows)


def build_interaction_matrix_from_long(df, value_column):
    if df is None or df.empty or value_column not in df:
        return pd.DataFrame()
    matrix = df.pivot_table(
        index="userId",
        columns="productId",
        values=value_column,
        aggfunc="sum",
        fill_value=0.0
    )
    return matrix


def generate_console_report(
    books_df,
    cb_scores,
    cf_scores,
    raw_interaction_matrix,
    normalized_interactions,
    interaction_matrix,
    user_factors_df,
    item_factors_df,
    cf_weight,
    cb_weight
):
    print_product_feature_profiles(books_df)
    print_content_based_examples(cb_scores, books_df)
    print_interaction_matrix(raw_interaction_matrix, "MA TRẬN TƯƠNG TÁC USER-ITEM", max_rows=5, max_cols=8)
    print_normalized_interactions(normalized_interactions)
    print_user_factors(user_factors_df)
    print_item_factors(item_factors_df)
    print_cf_predictions(cf_scores, books_df)
    report_user_id = None
    if not cf_scores.empty:
        report_user_id = cf_scores.index[0]
    elif not cb_scores.empty:
        report_user_id = cb_scores.index[0]
    hybrid_df = build_hybrid_debug_table(report_user_id, cf_scores, cb_scores, cf_weight, cb_weight)
    print_hybrid_scores_table(hybrid_df)


def upsert_recommendations(
    db,
    top_n,
    cf_weight,
    cb_weight,
    books_df,
    cf_scores,
    cb_scores,
    user_consumed_map,
    user_profiles,
    user_signal_counts,
    popularity_ids
):
    rec_collection = db.recommendation
    now = datetime.now(timezone.utc)

    candidate_users = set(
        profile.get("primaryId")
        for profile in user_profiles.values()
        if profile.get("primaryId")
    )
    candidate_users.update(cf_scores.index if not cf_scores.empty else [])
    candidate_users.update(cb_scores.index if not cb_scores.empty else [])
    candidate_users.discard(None)
    LOGGER.info("Preparing recommendations for %s users", len(candidate_users))

    updates = []
    for user_id in candidate_users:
        if not user_id:
            continue
        cf_row = cf_scores.loc[user_id] if not cf_scores.empty and user_id in cf_scores.index else None
        cb_row = cb_scores.loc[user_id] if not cb_scores.empty and user_id in cb_scores.index else None
        chosen_ids = []
        recommendation_method = "popularity"
        fallback_reason = None
        score_rows = []

        if cf_row is not None and cb_row is not None:
            combined = cf_weight * cf_row.values + cb_weight * cb_row.values
            combined_series = pd.Series(combined, index=cf_row.index)
            consumed = user_consumed_map.get(user_id, set())
            if consumed:
                combined_series.loc[list(consumed)] = 0.0
            combined_series = combined_series[combined_series > 0]
            ranked = combined_series.sort_values(ascending=False).head(top_n)
            if not ranked.empty:
                recommendation_method = "hybrid"
                chosen_ids = ranked.index.tolist()
                for bid in chosen_ids:
                    score_rows.append({
                        "productId": ObjectId(bid),
                        "hybridScore": round_score(ranked.loc[bid]),
                        "cfScore": round_score(cf_row.loc[bid]),
                        "cbScore": round_score(cb_row.loc[bid])
                    })
            else:
                fallback_reason = "NoPositiveHybridScores"

        elif cf_row is not None:
            ranked = cf_row[cf_row > 0].sort_values(ascending=False).head(top_n)
            if not ranked.empty:
                recommendation_method = "collaborative"
                chosen_ids = ranked.index.tolist()
                for bid in chosen_ids:
                    score_rows.append({
                        "productId": ObjectId(bid),
                        "hybridScore": round_score(ranked.loc[bid]),
                        "cfScore": round_score(ranked.loc[bid]),
                        "cbScore": None
                    })
            else:
                fallback_reason = "NoCollaborativeScores"

        elif cb_row is not None:
            ranked = cb_row[cb_row > 0].sort_values(ascending=False).head(top_n)
            if not ranked.empty:
                recommendation_method = "content_based"
                chosen_ids = ranked.index.tolist()
                for bid in chosen_ids:
                    score_rows.append({
                        "productId": ObjectId(bid),
                        "hybridScore": round_score(ranked.loc[bid]),
                        "cfScore": None,
                        "cbScore": round_score(ranked.loc[bid])
                    })
            else:
                fallback_reason = "NoContentScores"

        if not chosen_ids:
            recommendation_method = "popularity"
            fallback_reason = fallback_reason or "InsufficientSignals"
            chosen_ids = popularity_ids[:top_n]
            score_rows = [{
                "productId": ObjectId(bid),
                "hybridScore": None,
                "cfScore": None,
                "cbScore": None
            } for bid in chosen_ids]

        profile_payload = user_profiles.get(user_id, {})
        mongo_user_id = profile_payload.get("userRef") or _attempt_object_id(user_id)
        if mongo_user_id is None:
            LOGGER.warning("Skipping user %s due to missing ObjectId reference", user_id)
            continue

        doc = {
            "userId": mongo_user_id,
            "userRef": mongo_user_id,
            "recommendedProductIds": [ObjectId(bid) for bid in chosen_ids],
            "recommendationMethod": recommendation_method,
            "scores": score_rows,
            "metadata": {
                "totalSignals": int(user_signal_counts.get(user_id, 0)),
                "generatedAt": now,
                "fallbackReason": fallback_reason
            },
            "updatedAt": now
        }

        updates.append(
            UpdateOne(
                {"userId": mongo_user_id},
                {"$set": doc},
                upsert=True
            )
        )

    if updates:
        LOGGER.info("Writing %s recommendation documents...", len(updates))
        rec_collection.bulk_write(updates)
    else:
        LOGGER.warning("No recommendation updates were generated.")


def run_pipeline(top_n, cf_weight, cb_weight, report=False):
    db = get_database()
    books, interactions, reviews, users, authors, genres, orders = fetch_collections(db)
    books_df = prepare_books_dataframe(books, authors, genres, reviews)
    user_profiles = build_user_profiles(users)
    email_lookup = build_email_lookup(user_profiles)
    raw_interactions_df, normalized_interactions_df = build_interaction_frame(
        interactions,
        reviews,
        orders,
        user_profiles,
        email_lookup
    )
    if not normalized_interactions_df.empty:
        interaction_df = normalized_interactions_df.rename(columns={"interaction_strength": "weight"})
    else:
        interaction_df = pd.DataFrame(columns=["userId", "productId", "weight"])
    user_signal_counts = (
        raw_interactions_df.groupby("userId")["raw_value"].count().to_dict()
        if not raw_interactions_df.empty else {}
    )

    cb_scores, user_consumed_map = compute_content_scores(books_df, interaction_df)
    cf_scores, interaction_matrix, user_factors_df, item_factors_df = compute_collaborative_scores(
        interaction_df,
        books_df["bookId"].tolist()
    )
    popularity_ids = build_popularity_ranking(books_df)
    raw_interaction_matrix = build_interaction_matrix_from_long(raw_interactions_df, "raw_value")

    if books_df.empty or not popularity_ids:
        raise RuntimeError("No books/popularity data available; cannot generate recommendations.")

    upsert_recommendations(
        db=db,
        top_n=top_n,
        cf_weight=cf_weight,
        cb_weight=cb_weight,
        books_df=books_df,
        cf_scores=cf_scores,
        cb_scores=cb_scores,
        user_consumed_map=user_consumed_map,
        user_profiles=user_profiles,
        user_signal_counts=user_signal_counts,
        popularity_ids=popularity_ids
    )

    if report:
        generate_console_report(
            books_df=books_df,
            cb_scores=cb_scores,
            cf_scores=cf_scores,
            raw_interaction_matrix=raw_interaction_matrix,
            normalized_interactions=normalized_interactions_df,
            interaction_matrix=interaction_matrix,
            user_factors_df=user_factors_df,
            item_factors_df=item_factors_df,
            cf_weight=cf_weight,
            cb_weight=cb_weight
        )

    LOGGER.info("Recommendation pipeline completed successfully.")


app = Flask(__name__)


@app.get("/health")
def health_check():
    return jsonify(
        {
            "status": "ok",
            "service": "recommendation-microservice",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.post("/api/recommendations/build")
def build_recommendation():
    payload = request.get_json(silent=True) or {}

    try:
        top_n = int(payload.get("top_n", 12))
    except (TypeError, ValueError):
        top_n = 12

    try:
        cf_weight = float(payload.get("cf_weight", 0.6))
    except (TypeError, ValueError):
        cf_weight = 0.6

    try:
        cb_weight = float(payload.get("cb_weight", 0.4))
    except (TypeError, ValueError):
        cb_weight = 0.4

    report = bool(payload.get("report", False))

    try:
        run_pipeline(top_n=top_n, cf_weight=cf_weight, cb_weight=cb_weight, report=report)
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Recommendation pipeline executed and recommendation collection updated.",
                    "params": {
                        "top_n": top_n,
                        "cf_weight": cf_weight,
                        "cb_weight": cb_weight,
                        "report": report,
                    },
                }
            ),
            200,
        )
    except Exception as exc:
        app.logger.exception("Error while running recommendation pipeline")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Failed to rebuild recommendations",
                    "message": str(exc),
                }
            ),
            500,
        )


if __name__ == "__main__":
    port = int(os.getenv("RECOMMENDATION_PORT", 8000))
    app.run(host="0.0.0.0", port=port)



