import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getBaseUrl from '../../../utils/baseURL'

const baseQuery = fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/banners`,
    credentials: 'include',
    prepareHeaders: (headers) => {
        const token = localStorage.getItem('token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'application/json');
        return headers;
    }
})

const bannersApi = createApi({
    reducerPath: 'bannersApi',
    baseQuery,
    tagTypes: ['Banners'],
    endpoints: (builder) => ({
        fetchAllBanners: builder.query({
            query: () => "/",
            providesTags: ["Banners"]
        }),
        addBanner: builder.mutation({
            query: (newBanner) => ({
                url: "/",
                method: "POST",
                body: newBanner
            }),
            invalidatesTags: ["Banners"]
        }),
        updateBanner: builder.mutation({
            query: ({ id, ...rest }) => ({
                url: `/${id}`,
                method: "PUT",
                body: rest
            }),
            invalidatesTags: ["Banners"]
        }),
        deleteBanner: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Banners"]
        }),
    })
})

export const { useFetchAllBannersQuery, useAddBannerMutation, useUpdateBannerMutation, useDeleteBannerMutation } = bannersApi;
export default bannersApi;
