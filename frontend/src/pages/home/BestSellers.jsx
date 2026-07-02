import React from 'react'
import { useFetchBestSellersQuery } from '../../redux/features/books/booksApi';
import { getImgUrl } from '../../utils/getImgUrl';
import { Link } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiTrendingUp, FiTag } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/features/cart/cartSlice';

const BestSellers = () => {
    const { data: bestSellersData = [], isLoading, isError } = useFetchBestSellersQuery();
    const dispatch = useDispatch();
    
    const bestSellers = bestSellersData.slice(0, 8);

    const handleAddToCart = (book) => {
        if ((book?.stock || 0) <= 0) return; // Prevent adding out of stock items
        dispatch(addToCart(book));
    };

    const calculateAverageRating = (book) => {
        if (book?.averageRating !== undefined && book.averageRating > 0) {
            return book.averageRating.toFixed(1);
        }
        if (!book?.ratings || book.ratings.length === 0) return '5.0';
        const sum = book.ratings.reduce((acc, r) => acc + (r.value || 0), 0);
        return (sum / book.ratings.length).toFixed(1);
    };

    const getDisplayRating = (book) => {
        if (book?.ratingCount !== undefined && book.ratingCount > 0 && book?.averageRating !== undefined) {
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

    if (isLoading) {
        return (
            <div className="bg-white py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading best sellers...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-white py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-red-600">Failed to load best sellers</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Best Sellers</h2>
                        <p className="text-lg text-gray-600">The most popular books based on sales</p>
                    </div>
                    <div className="flex items-center text-orange-500">
                        <FiTrendingUp className="w-6 h-6 mr-2" />
                        <span className="font-semibold">Trending Now</span>
                    </div>
                </div>

                {bestSellers.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Best Sellers Yet</h3>
                        <p className="text-gray-600">Best sellers will appear here once customers start making purchases.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {bestSellers.map((book, index) => (
                        <div key={book._id} className="group h-full">
                            <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 h-full flex flex-col">
                                <div className="relative">
                                    <Link to={`/books/${book._id}`}>
                                        <img
                                            src={getImgUrl(book.coverImage)}
                                            alt={book.title}
                                            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </Link>
                                    <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                        <FiTrendingUp className="w-3 h-3 mr-1" />
                                        #{index + 1}
                                    </div>
                                    {(book?.stock || 0) <= 0 && (
                                        <div className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                            <FiTag className="w-3 h-3 mr-1" />
                                            Out of Stock
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-4 flex flex-col flex-grow">
                                    <Link to={`/books/${book._id}`}>
                                        <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2 group-hover:text-blue-600">
                                            {book.title}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-gray-600 mb-3">by {book.author}</p>
                                    
                                    <div className="flex items-center mb-3">
                                        {renderStars(getDisplayRating(book))}
                                        <span className="ml-2 text-sm text-gray-600">({calculateAverageRating(book)})</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                        <div>
                                            <span className="text-lg font-bold text-green-600">${book.newPrice}</span>
                                            {book.oldPrice > book.newPrice && (
                                                <span className="ml-2 text-sm text-gray-500 line-through">${book.oldPrice}</span>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => handleAddToCart(book)}
                                            disabled={(book?.stock || 0) <= 0}
                                            className={`p-2 rounded-full transition-colors ${
                                                (book?.stock || 0) <= 0
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
                    ))}
                    </div>
                )}

                <div className="text-center mt-12">
                    <Link 
                        to="/books?genre=best-sellers" 
                        className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        View All Best Sellers
                        <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BestSellers;
