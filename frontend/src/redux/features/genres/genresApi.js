import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getBaseUrl from '../../../utils/baseURL'

const baseQuery = fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/genres`,
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

const genresApi = createApi({
    reducerPath: 'genresApi',
    baseQuery,
    tagTypes: ['Genres'],
    endpoints: (builder) => ({
        fetchAllGenres: builder.query({
            query: () => "/",
            providesTags: ["Genres"]
        }),
        fetchGenreById: builder.query({
            query: (id) => `/${id}`,
            providesTags: (result, error, id) => [{ type: "Genres", id }],
        }),
        addGenre: builder.mutation({
            query: (newGenre) => ({
                url: `/create-genre`,
                method: "POST",
                body: newGenre
            }),
            invalidatesTags: ["Genres"]
        }),
        updateGenre: builder.mutation({
            query: ({id, ...rest}) => ({
                url: `/edit/${id}`,
                method: "PUT",
                body: rest
            }),
            invalidatesTags: ["Genres"]
        }),
        deleteGenre: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Genres"]
        })
    })
})

export const {
    useFetchAllGenresQuery, 
    useFetchGenreByIdQuery, 
    useAddGenreMutation, 
    useUpdateGenreMutation, 
    useDeleteGenreMutation
} = genresApi;
export default genresApi;

