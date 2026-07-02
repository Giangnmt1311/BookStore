import React from 'react'
import { useFetchAllBooksQuery } from '../../redux/features/books/booksApi';
import { getImgUrl } from '../../utils/getImgUrl';
import { Link } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiBookmark, FiChevronLeft, FiChevronRight, FiTag } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { addToCart } from '../../redux/features/cart/cartSlice';

const FeaturedBooks = () => {
    const { data: books = [] } = useFetchAllBooksQuery();
    const dispatch = useDispatch();
    
    const featuredBooks = books.filter(book => book.featured);

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

    return (
        <div className="py-6 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <FiBookmark className="w-6 h-6 text-red-600" />
                        <h2 className="text-3xl font-bold text-gray-900">Featured Books</h2>
                    </div>
                </div>

                <Swiper
                    modules={[Navigation]}
                    spaceBetween={24}
                    slidesPerView={6}
                    navigation={{
                        nextEl: '.swiper-button-next-featured',
                        prevEl: '.swiper-button-prev-featured',
                    }}
                    breakpoints={{
                        320: { slidesPerView: 1, spaceBetween: 10 },
                        640: { slidesPerView: 2, spaceBetween: 20 },
                        1024: { slidesPerView: 4, spaceBetween: 24 },
                        1280: { slidesPerView: 6, spaceBetween: 24 }
                    }}
                    className="!pb-2"
                >
                    {featuredBooks.map((book) => (
                        <SwiperSlide key={book._id} className="h-full">
                            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col">
                                <Link to={`/books/${book._id}`}>
                                    <div className="relative h-64">
                                        <img
                                            src={getImgUrl(book.coverImage)}
                                            alt={book.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 left-2 flex flex-row gap-2 flex-wrap">
                                            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                                Featured
                                            </div>
                                            {(book?.stock || 0) <= 0 && (
                                                <div className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                                    <FiTag className="w-3 h-3 mr-1" />
                                                    Out of Stock
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                
                                <div className="p-4 flex flex-col flex-grow">
                                    <div className='min-h-24'>
                                        <Link to={`/books/${book._id}`}>
                                            <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                                                {book.title}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                                    </div>
                                    
                                    <div className="mt-auto">
                                        {/* Rating */}
                                        <div className="flex items-center mb-3">
                                            {renderStars(getDisplayRating(book))}
                                            <span className="ml-2 text-sm text-gray-600">({calculateAverageRating(book)})</span>
                                        </div>

                                        {/* Price and Add to Cart */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-lg font-bold text-green-600">${book.newPrice}</span>
                                                {book.oldPrice > book.newPrice && (
                                                    <span className="ml-2 text-sm text-gray-500 line-through">${book.oldPrice}</span>
                                                )}
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    handleAddToCart(book)
                                                }}
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
                        </SwiperSlide>
                    ))}
                </Swiper>

                {featuredBooks.length > 6 && (
                    <>
                        <div className="swiper-button-prev-featured absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full bg-white shadow-md cursor-pointer hover:bg-gray-100 transition-colors z-10">
                            <FiChevronLeft className="w-6 h-6 text-gray-700" />
                        </div>
                        <div className="swiper-button-next-featured absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full bg-white shadow-md cursor-pointer hover:bg-gray-100 transition-colors z-10">
                            <FiChevronRight className="w-6 h-6 text-gray-700" />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeaturedBooks;
