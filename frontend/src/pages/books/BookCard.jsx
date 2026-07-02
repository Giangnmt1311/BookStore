import React, { useCallback } from 'react'
import { FiShoppingCart, FiStar, FiTag } from 'react-icons/fi'
import { getImgUrl } from '../../utils/getImgUrl'
import { Link } from'react-router-dom'
import { useDispatch } from'react-redux'
import { addToCart } from '../../redux/features/cart/cartSlice'
import { useAuth } from '../../context/AuthContext'
import { useGetUserByEmailQuery } from '../../redux/features/users/usersApi'
import getBaseUrl from '../../utils/baseURL'

const BookCard = ({book, viewMode = 'grid'}) => {
    const dispatch =  useDispatch();
    const handleAddToCart = (product) => {
        if ((product?.stock || 0) <= 0) return; // Prevent adding out of stock items
        dispatch(addToCart(product))
    }
    
    const isOutOfStock = (book?.stock || 0) <= 0;

    const handleBookClick = () => {
        // book click for recommendations
        if (window.handleBookClick) {
            window.handleBookClick(book);
        }
    }

    const calculateAverageRating = (book) => {
        if (book?.averageRating !== undefined) {
            return book.averageRating.toFixed(1);
        }
        if (!book?.ratings || book.ratings.length === 0) return '5.0';
        const sum = book.ratings.reduce((acc, r) => acc + (r.value || 0), 0);
        return (sum / book.ratings.length).toFixed(1);
    };

    const getDisplayRating = (book) => {
        if (book?.averageRating !== undefined) {
            return book.averageRating;
        }
        if (book?.ratings && book.ratings.length > 0) {
            const sum = book.ratings.reduce((acc, r) => acc + (r.value || 0), 0);
            return sum / book.ratings.length;
        }
        return 5;
    };

    const renderStars = (rating) => {
        const numRating = Number(rating) || 0;
        return (
            <div className="flex items-center">
                {[1,2,3,4,5].map(n => {
                    const isFull = n <= Math.floor(numRating);
                    const isHalf = !isFull && n - 0.5 <= numRating;
                    
                    return (
                        <div key={n} className="relative inline-block">
                            <FiStar 
                                className="w-4 h-4 text-gray-300"
                            />
                            {isFull && (
                                <FiStar 
                                    className="w-4 h-4 text-yellow-400 fill-current absolute top-0 left-0"
                                />
                            )}
                            {isHalf && (
                                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                                    <FiStar 
                                        className="w-4 h-4 text-yellow-400 fill-current"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Grid view (default)
    if (viewMode === 'grid') {
        return (
            <div className="group h-full">
                <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 h-full flex flex-col">
                    <div className="relative">
                        <Link to={`/books/${book._id}`} onClick={handleBookClick}>
                            <img
                                src={`${getImgUrl(book?.coverImage)}`}
                                alt={book?.title}
                                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        </Link>
                        {isOutOfStock && (
                            <div className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                <FiTag className="w-3 h-3 mr-1" />
                                Out of Stock
                            </div>
                        )}
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                        <div className="min-h-[72px]">
                            <Link to={`/books/${book._id}`} onClick={handleBookClick}>
                                <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2 group-hover:text-blue-600">
                                    {book?.title}
                                </h3>
                            </Link>
                            <p className="text-sm text-gray-600">by {book?.author}</p>
                        </div>

                        <div className="mt-3 space-y-2">
                            <div className="flex items-center">
                                {renderStars(getDisplayRating(book))}
                                <span className="ml-2 text-sm text-gray-600">({calculateAverageRating(book)})</span>
                            </div>
                            <p className="text-sm text-gray-500">
                                <span className="font-semibold text-gray-700">Genre:</span> {book?.genres || 'N/A'}
                            </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-3">
                            <div>
                                <span className="text-lg font-bold text-green-600">${book?.newPrice}</span>
                                {book?.oldPrice && parseFloat(book.oldPrice) > parseFloat(book.newPrice) && (
                                    <span className="ml-2 text-sm text-gray-500 line-through">${book?.oldPrice}</span>
                                )}
                            </div>
                            <button 
                                onClick={() => handleAddToCart(book)}
                                disabled={isOutOfStock}
                                className={`p-2 rounded-full transition-colors ${
                                    isOutOfStock 
                                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                <FiShoppingCart className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // List view
    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div className="flex">
                <div className="w-40 flex-shrink-0 relative">
                    <Link to={`/books/${book._id}`} onClick={handleBookClick} className="block h-full">
                        <img
                            src={`${getImgUrl(book?.coverImage)}`}
                            alt={book?.title}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-all duration-200"
                        />
                    </Link>
                    {isOutOfStock && (
                        <div className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                            <FiTag className="w-3 h-3 mr-1" />
                            Out of Stock
                        </div>
                    )}
                </div>

                <div className="p-4 flex-grow flex flex-col">
                    <div className="flex-grow">
                        <Link to={`/books/${book._id}`} onClick={handleBookClick}>
                            <h3 className="text-lg font-semibold hover:text-blue-600 mb-2 line-clamp-2">
                                {book?.title}
                            </h3>
                        </Link>
                        <p className="text-sm text-gray-600 mb-1">by {book?.author}</p>
                        <p className="text-sm text-gray-500 mb-2 capitalize italic">
                            <span className="font-semibold text-gray-700">Genre:</span> {book?.genres || 'N/A'}
                        </p>
                        <p className="text-gray-600 mb-3 text-sm">
                            {(book?.description?.length || 0) > 200 
                                ? `${book.description.slice(0, 200)}...` 
                                : (book?.description || '')}
                        </p>
                        
                        <div className="flex items-center mb-3">
                            {renderStars(getDisplayRating(book))}
                            <span className="ml-2 text-sm text-gray-600">({calculateAverageRating(book)})</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-lg">
                                ${book?.newPrice} 
                                {book?.oldPrice && parseFloat(book.oldPrice) > parseFloat(book.newPrice) && (
                                    <span className="line-through font-normal ml-2 text-gray-500 text-sm">${book?.oldPrice}</span>
                                )}
                            </p>
                        </div>
                        <button 
                            onClick={() => handleAddToCart(book)}
                            disabled={isOutOfStock}
                            className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-lg transition-colors ${
                                isOutOfStock 
                                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                                    : 'btn-primary'
                            }`}
                        >
                            <FiShoppingCart />
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BookCard