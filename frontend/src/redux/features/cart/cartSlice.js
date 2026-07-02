import { createSlice } from "@reduxjs/toolkit";
import Swal  from "sweetalert2";

// load cart items from local storage
const loadCartFromLocalStorage = () => {
    try {
        const serializedCart = localStorage.getItem('cartItems');
        if (serializedCart === null) {
            return [];
        }
        return JSON.parse(serializedCart);
    } catch (error) {
        console.error("Could not load cart from local storage", error);
        return [];
    }
};

// save cart items to local storage
const saveCartToLocalStorage = (cartItems) => {
    try {
        const serializedCart = JSON.stringify(cartItems);
        localStorage.setItem('cartItems', serializedCart);
    } catch (error) {
        console.error("Could not save cart to local storage", error);
    }
};


const initialState = {
    cartItems: loadCartFromLocalStorage()
}

const cartSlice = createSlice({
    name: 'cart',
    initialState: initialState,
    reducers:{
        addToCart: (state, action) => {
            const existingItem = state.cartItems.find(item => item._id === action.payload._id);
            if(!existingItem) {
                state.cartItems.push({...action.payload, quantity: 1})
                Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "Product Added to the Cart",
                    showConfirmButton: false,
                    timer: 1500
                  });
            } else {
                existingItem.quantity += 1;
                Swal.fire({
                    position: "center",
                    icon: "success",
                    title: `Quantity Updated (${existingItem.quantity})`,
                    showConfirmButton: false,
                    timer: 1500
                  });
            }
            saveCartToLocalStorage(state.cartItems);
        },
        removeFromCart: (state, action) => {
            state.cartItems =  state.cartItems.filter(item => item._id !== action.payload._id)
            saveCartToLocalStorage(state.cartItems);
        },
        updateQuantity: (state, action) => {
            const { _id, quantity } = action.payload;
            const existingItem = state.cartItems.find(item => item._id === _id);
            if (existingItem && quantity > 0 && quantity <= existingItem.stock) {
                existingItem.quantity = quantity;
            }
            saveCartToLocalStorage(state.cartItems);
        },
        incrementQuantity: (state, action) => {
            const existingItem = state.cartItems.find(item => item._id === action.payload._id);
            if (existingItem && existingItem.quantity < existingItem.stock) {
                existingItem.quantity += 1;
            }
            saveCartToLocalStorage(state.cartItems);
        },
        decrementQuantity: (state, action) => {
            const existingItem = state.cartItems.find(item => item._id === action.payload._id);
            if (existingItem && existingItem.quantity > 1) {
                existingItem.quantity -= 1;
            }
            saveCartToLocalStorage(state.cartItems);
        },
        clearCart: (state) => {
            state.cartItems = []
            saveCartToLocalStorage(state.cartItems);
        }
    }
})

export const  {addToCart, removeFromCart, updateQuantity, incrementQuantity, decrementQuantity, clearCart} = cartSlice.actions;
export default cartSlice.reducer;