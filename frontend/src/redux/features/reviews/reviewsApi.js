import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getBaseUrl from '../../../utils/baseURL'

const baseQuery = fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/reviews`,
    credentials: 'include',
    prepareHeaders: (headers) => {
        const token = localStorage.getItem('token');
        if(token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'application/json');
        return headers;
    }
})

const reviewsApi = createApi({
    reducerPath: 'reviewsApi',
    baseQuery,
    tagTypes: ['Reviews'],
    endpoints: (builder) => ({
        fetchReviewsByProductId: builder.query({
            query: (productId) => `/product/${productId}`,
            providesTags: (result, error, productId) => [{ type: 'Reviews', id: productId }]
        }),
        fetchAllReviews: builder.query({
            query: () => '/',
            providesTags: ['Reviews']
        }),
        fetchReviewById: builder.query({
            query: (id) => `/${id}`,
            providesTags: (result, error, id) => [{ type: 'Reviews', id }]
        }),
        fetchReviewsByUserId: builder.query({
            query: (userId) => `/user/${userId}`,
            providesTags: (result, error, userId) => [{ type: 'Reviews', id: userId }]
        }),
        addReview: builder.mutation({
            query: ({ productId, userId, username, content, rating }) => ({
                url: '/',
                method: 'POST',
                body: { productId, userId, username, content, rating }
            }),
            invalidatesTags: (result, error, { productId }) => [
                { type: 'Reviews', id: productId },
                { type: 'Books', id: productId }
            ]
        }),
        updateReview: builder.mutation({
            query: ({ id, userId, content, rating, username }) => ({
                url: `/${id}`,
                method: 'PUT',
                body: { userId, content, rating, username }
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Reviews', id }]
        }),
        deleteReview: builder.mutation({
            query: ({ id, userId }) => ({
                url: `/${id}`,
                method: 'DELETE',
                body: { userId }
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Reviews', id }]
        })
    })
})

export const {
    useFetchReviewsByProductIdQuery,
    useFetchAllReviewsQuery,
    useFetchReviewByIdQuery,
    useFetchReviewsByUserIdQuery,
    useAddReviewMutation,
    useUpdateReviewMutation,
    useDeleteReviewMutation
} = reviewsApi;

export default reviewsApi;

