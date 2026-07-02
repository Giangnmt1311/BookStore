import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getBaseUrl from '../../../utils/baseURL'

const  baseQuery = fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/books`,
    credentials: 'include',
    prepareHeaders: (headers) => {
        const token =  localStorage.getItem('token');
        if(token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'application/json');
        return headers;
    }
})

const booksApi = createApi({
    reducerPath: 'booksApi',
    baseQuery,
    tagTypes: ['Books'],
    endpoints: (builder) =>({
        fetchAllBooks: builder.query({
            query: () => "/",
            providesTags: ["Books"]
        }),
        fetchBestSellers: builder.query({
            query: () => "/best-sellers",
            providesTags: ["Books"]
        }),
        fetchBookById: builder.query({
            query: (id) => `/${id}`,
            providesTags: (result, error, id) => [{ type: "Books", id }],
        }),
        addBook: builder.mutation({
            query: (newBook) => ({
                url: `/create-book`,
                method: "POST",
                body: newBook
            }),
            invalidatesTags: ["Books"]
        }),
        updateBook: builder.mutation({
            query: ({id, ...rest}) => ({
                url: `/edit/${id}`,
                method: "PUT",
                body: rest
            }),
            invalidatesTags: ["Books"]
        }),
        deleteBook: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Books"]
        }),
        toggleFeatured: builder.mutation({
            query: (id) => ({
                url: `/${id}/toggle-featured`,
                method: 'PATCH'
            }),
            invalidatesTags: ["Books"]
        })
    })
})

export const {useFetchAllBooksQuery, useFetchBestSellersQuery, useFetchBookByIdQuery, useAddBookMutation, useUpdateBookMutation, useDeleteBookMutation, useToggleFeaturedMutation} = booksApi;
export default booksApi;