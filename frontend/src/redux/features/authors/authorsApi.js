import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getBaseUrl from '../../../utils/baseURL'

const baseQuery = fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/authors`,
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

const authorsApi = createApi({
    reducerPath: 'authorsApi',
    baseQuery,
    tagTypes: ['Authors'],
    endpoints: (builder) => ({
        fetchAllAuthors: builder.query({
            query: () => "/",
            providesTags: ["Authors"]
        }),
        fetchAuthorById: builder.query({
            query: (id) => `/${id}`,
            providesTags: (result, error, id) => [{ type: "Authors", id }],
        }),
        addAuthor: builder.mutation({
            query: (newAuthor) => ({
                url: `/create-author`,
                method: "POST",
                body: newAuthor
            }),
            invalidatesTags: ["Authors"]
        }),
        updateAuthor: builder.mutation({
            query: ({id, ...rest}) => ({
                url: `/edit/${id}`,
                method: "PUT",
                body: rest
            }),
            invalidatesTags: ["Authors"]
        }),
        deleteAuthor: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Authors"]
        })
    })
})

export const {
    useFetchAllAuthorsQuery, 
    useFetchAuthorByIdQuery, 
    useAddAuthorMutation, 
    useUpdateAuthorMutation, 
    useDeleteAuthorMutation
} = authorsApi;
export default authorsApi;

