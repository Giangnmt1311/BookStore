import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseURL";


const ordersApi = createApi({
    reducerPath: 'ordersApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${getBaseUrl()}/api/orders`,
        credentials: 'include'
    }),
    tagTypes: ['Orders', 'Books'],
    endpoints: (builder) => ({
        createOrder: (builder.mutation) ({
            query: (newOrder) => ({
                url: "/",
                method: "POST",
                body: newOrder,
                credentials: 'include',
            })
        }),
        getOrderByEmail: (builder.query) ({
            query: (email) => ({
                url: `/email/${email}`
            }),
            providesTags: ['Orders']
        }),
        getAllOrders: (builder.query) ({
            query: () => ({
                url: `/`
            }),
            providesTags: ['Orders']
        }),
        updateOrderStatus: (builder.mutation) ({
            query: ({id, completed}) => ({
                url: `/${id}/status`,
                method: 'PATCH',
                body: {completed}
            }),
            invalidatesTags: ['Orders', 'Books']
        }),
        confirmOrderReceipt: (builder.mutation) ({
            query: ({id, email}) => ({
                url: `/${id}/confirm-receipt`,
                method: 'PATCH',
                body: { email }
            }),
            invalidatesTags: ['Orders']
        }),
        deleteOrder: (builder.mutation) ({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Orders', 'Books']
        })
    })
})

export const {useCreateOrderMutation, useGetOrderByEmailQuery, useGetAllOrdersQuery, useUpdateOrderStatusMutation, useDeleteOrderMutation, useConfirmOrderReceiptMutation} = ordersApi;

export default ordersApi;