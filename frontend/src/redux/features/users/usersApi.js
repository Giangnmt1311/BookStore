import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getBaseUrl from '../../../utils/baseURL'

const baseQuery = fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/auth`,
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

const usersApi = createApi({
    reducerPath: 'usersApi',
    baseQuery,
    tagTypes: ['User'],
    endpoints: (builder) => ({
        getUserByEmail: builder.query({
            query: (email) => `/customers/${encodeURIComponent(email)}`,
            providesTags: (result, error, email) => [{ type: 'User', id: email }],
        }),
        updateUsername: builder.mutation({
            query: ({ email, username }) => ({
                url: `/customers/${encodeURIComponent(email)}/username`,
                method: 'PUT',
                body: { username }
            }),
            invalidatesTags: (result, error, { email }) => [{ type: 'User', id: email }],
        }),
        updatePhoneNumber: builder.mutation({
            query: ({ email, phoneNumber }) => ({
                url: `/customers/${encodeURIComponent(email)}/phone`,
                method: 'PUT',
                body: { phoneNumber }
            }),
            invalidatesTags: (result, error, { email }) => [{ type: 'User', id: email }],
        }),
        syncCustomer: builder.mutation({
            query: ({ email, username }) => ({
                url: '/customers/sync',
                method: 'POST',
                body: { email, username }
            }),
            invalidatesTags: (result, error, { email }) => [{ type: 'User', id: email }],
        }),
        addToWishlist: builder.mutation({
            query: ({ email, bookId }) => ({
                url: `/customers/${encodeURIComponent(email)}/wishlist`,
                method: 'POST',
                body: { bookId }
            }),
            invalidatesTags: (result, error, { email }) => [{ type: 'User', id: email }],
        }),
        removeFromWishlist: builder.mutation({
            query: ({ email, bookId }) => ({
                url: `/customers/${encodeURIComponent(email)}/wishlist/${bookId}`,
                method: 'DELETE'
            }),
            invalidatesTags: (result, error, { email }) => [{ type: 'User', id: email }],
        }),
        addAddress: builder.mutation({
            query: ({ email, address }) => ({
                url: `/customers/${encodeURIComponent(email)}/addresses`,
                method: 'POST',
                body: address
            }),
            invalidatesTags: (result, error, { email }) => [{ type: 'User', id: email }],
        }),
        updateAddress: builder.mutation({
            query: ({ email, addressId, address }) => ({
                url: `/customers/${encodeURIComponent(email)}/addresses/${addressId}`,
                method: 'PUT',
                body: address
            }),
            invalidatesTags: (result, error, { email }) => [{ type: 'User', id: email }],
        }),
        deleteAddress: builder.mutation({
            query: ({ email, addressId }) => ({
                url: `/customers/${encodeURIComponent(email)}/addresses/${addressId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { email }) => [{ type: 'User', id: email }],
        }),
        getAllUsers: builder.query({
            query: () => '/admin/users',
            providesTags: ['User'],
        }),
    })
})

export const { 
    useGetUserByEmailQuery, 
    useUpdateUsernameMutation,
    useUpdatePhoneNumberMutation,
    useSyncCustomerMutation,
    useAddToWishlistMutation,
    useRemoveFromWishlistMutation,
    useAddAddressMutation,
    useUpdateAddressMutation,
    useDeleteAddressMutation,
    useGetAllUsersQuery
} = usersApi;
export default usersApi;

