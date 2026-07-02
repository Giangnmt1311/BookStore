import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './features/cart/cartSlice'
import booksApi from './features/books/booksApi'
import ordersApi from './features/orders/ordersApi'
import reviewsApi from './features/reviews/reviewsApi'
import bannersApi from './features/banners/bannersApi'
import usersApi from './features/users/usersApi'
import authorsApi from './features/authors/authorsApi'
import genresApi from './features/genres/genresApi'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    [booksApi.reducerPath]: booksApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [bannersApi.reducerPath]: bannersApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [authorsApi.reducerPath]: authorsApi.reducer,
    [genresApi.reducerPath]: genresApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(booksApi.middleware, ordersApi.middleware, reviewsApi.middleware, bannersApi.middleware, usersApi.middleware, authorsApi.middleware, genresApi.middleware),
})