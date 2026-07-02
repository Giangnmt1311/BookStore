const mongoose = require('mongoose');
const Recommendation = require('./recommendation.model');
const Book = require('../books/book.model');
const Review = require('../reviews/review.model');

const enrichBook = async (bookDoc) => {
    if (!bookDoc) return null;

    const book = bookDoc.toObject();
    if (book.authorId && typeof book.authorId === 'object') {
        book.author = book.authorId.name || book.author || '';
        book.authorBio = book.authorId.bio || book.authorBio || '';
    }
    if (book.genreId && typeof book.genreId === 'object') {
        book.genres = book.genreId.name || book.genres || '';
    }

    const reviews = await Review.find({ productId: book._id.toString() });
    const ratings = reviews.map(r => r.rating);
    const averageRating = ratings.length > 0
        ? parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1))
        : (book.averageRating || 5);

    return {
        ...book,
        ratings: ratings.length > 0 ? ratings.map(value => ({ value })) : [],
        averageRating,
        ratingCount: ratings.length
    };
};

const fetchBooksByIds = async (ids = []) => {
    if (!ids.length) return [];
    const books = await Book.find({ _id: { $in: ids } })
        .populate('authorId')
        .populate('genreId');
    const hydrated = await Promise.all(books.map(enrichBook));
    return hydrated.filter(Boolean);
};

const getPopularBooks = async (limit = 12) => {
    const books = await Book.find()
        .sort({ soldQuantity: -1, averageRating: -1, createdAt: -1 })
        .limit(Math.max(limit, 12))
        .populate('authorId')
        .populate('genreId');
    const hydrated = await Promise.all(books.map(enrichBook));
    return hydrated.filter(Boolean).slice(0, limit);
};

const getUserRecommendations = async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = Number(req.query.limit) || 12;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, error: 'Valid userId is required' });
        }

        const normalizedUserId = new mongoose.Types.ObjectId(userId);
        const recommendation = await Recommendation.findOne({ userId: normalizedUserId });
        if (recommendation && recommendation.recommendedProductIds?.length) {
            const orderedIds = recommendation.recommendedProductIds.map(id => id.toString());
            const books = await fetchBooksByIds(recommendation.recommendedProductIds);

            const orderedBooks = books.sort((a, b) => {
                return orderedIds.indexOf(a._id.toString()) - orderedIds.indexOf(b._id.toString());
            }).slice(0, limit);

            return res.status(200).json({
                success: true,
                source: recommendation.recommendationMethod || 'hybrid',
                fallbackReason: recommendation.metadata?.fallbackReason || null,
                metadata: recommendation.metadata || {},
                items: orderedBooks
            });
        }

        const fallbackBooks = await getPopularBooks(limit);
        res.status(200).json({
            success: true,
            source: 'popularity',
            fallbackReason: 'NoRecommendationRecord',
            metadata: { totalSignals: 0 },
            items: fallbackBooks
        });
    } catch (error) {
        console.error('Error fetching user recommendations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recommendations',
            message: error.message
        });
    }
};

const getPopularRecommendations = async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 12;
        const books = await getPopularBooks(limit);
        res.status(200).json({
            success: true,
            source: 'popularity',
            items: books
        });
    } catch (error) {
        console.error('Error fetching popular recommendations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch popular recommendations',
            message: error.message
        });
    }
};

module.exports = {
    getUserRecommendations,
    getPopularRecommendations
};
