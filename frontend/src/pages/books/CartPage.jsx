import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getImgUrl } from '../../utils/getImgUrl';
import { clearCart, removeFromCart, incrementQuantity, decrementQuantity, updateQuantity } from '../../redux/features/cart/cartSlice';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';

const CartPage = () => {
    const cartItems = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch()

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const totalPrice = cartItems.reduce((acc, item) => acc + (item.newPrice * (item.quantity || 1)), 0).toFixed(2);

    const handleRemoveFromCart = (product) => {
        dispatch(removeFromCart(product))
    }

    const handleClearCart = () => {
        dispatch(clearCart())
    }

    const handleIncrementQuantity = (product) => {
        if (product.quantity < product.stock) {
            dispatch(incrementQuantity(product))
        } else {
            alert(`Sorry, only ${product.stock} items available in stock.`);
        }
    }

    const handleDecrementQuantity = (product) => {
        dispatch(decrementQuantity(product))
    }

    const handleQuantityChange = (product, newQuantity) => {
        const quantity = parseInt(newQuantity);    
        if (quantity > 0 && quantity <= product.stock) {
            dispatch(updateQuantity({ _id: product._id, quantity }))
        } else if (quantity > product.stock) {
            alert(`Only ${product.stock} items in stock`);
            dispatch(updateQuantity({ _id: product._id, quantity: product.stock }))
        }
    }

    return (
        <div className="bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                    <p className="mt-2 text-gray-600">
                        {cartItems.length > 0 
                            ? `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in your cart`
                            : 'Your cart is empty'}
                    </p>
                </div>

                {cartItems.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Items</h2>
                                    {cartItems.length > 0 && (
                                        <button
                                            onClick={handleClearCart}
                                            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                            <span>Clear Cart</span>
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {cartItems.map((product) => (
                                        <div key={product._id} className="flex gap-4 pb-6 border-b border-gray-200 last:border-0 last:pb-0">
                                            <Link to={`/books/${product._id}`} className="flex-shrink-0">
                                                <img
                                                    src={getImgUrl(product?.coverImage)}
                                                    alt={product?.title}
                                                    className="w-24 h-32 object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                                />
                                            </Link>

                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <Link to={`/books/${product._id}`}>
                                                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                                            {product?.title}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-sm text-gray-600 mt-1">by {product?.author}</p>
                                                    <p className="text-xs text-gray-500 mt-1 capitalize">{product?.genres}</p>
                                                </div>

                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-sm text-gray-600">Quantity:</span>
                                                        <div className="flex items-center border border-gray-300 rounded-lg">
                                                            <button
                                                                onClick={() => handleDecrementQuantity(product)}
                                                                disabled={(product?.quantity || 1) <= 1}
                                                                className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                                                            >
                                                                <FiMinus className="w-4 h-4" />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={product?.stock}
                                                                value={product?.quantity || 1}
                                                                onChange={(e) => handleQuantityChange(product, e.target.value)}
                                                                className="w-16 px-3 py-2 text-center border-0 focus:ring-0 text-gray-900 font-medium [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                                            />
                                                            <button
                                                                onClick={() => handleIncrementQuantity(product)}
                                                                disabled={(product?.quantity || 1) >= product?.stock}
                                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
                                                            >
                                                                <FiPlus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-6">
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-gray-900">
                                                                ${(product?.newPrice * (product?.quantity || 1)).toFixed(2)}
                                                            </p>
                                                            {product?.oldPrice > product?.newPrice && (
                                                                <p className="text-sm text-gray-500 line-through">
                                                                    ${(product?.oldPrice * (product?.quantity || 1)).toFixed(2)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveFromCart(product)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Remove item"
                                                        >
                                                            <FiTrash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Link
                                to="/"
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                            >
                                ← Continue Shopping
                            </Link>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                                
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Total ({cartItems.length} items)</span>
                                        <span className="font-medium">${totalPrice}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span className="font-medium text-green-600">Free</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="flex justify-between text-lg font-bold text-gray-900">
                                            <span>Total</span>
                                            <span>${totalPrice}</span>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    to="/checkout/address"
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                                >
                                    <FiShoppingBag className="w-5 h-5" />
                                    <span>Proceed</span>
                                </Link>

                                <p className="text-xs text-gray-500 text-center mt-4">
                                    Shipping and taxes calculated at checkout
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <FiShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                        <p className="text-gray-600 mb-6">Start adding some books to your cart!</p>
                        <Link
                            to="/"
                            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                            Browse Books
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CartPage