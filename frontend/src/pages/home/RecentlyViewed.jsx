import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiClock, FiShoppingCart, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { addToCart } from '../../redux/features/cart/cartSlice'
import { getImgUrl } from '../../utils/getImgUrl'
import { useFetchAllBooksQuery } from '../../redux/features/books/booksApi'
import { useAuth } from '../../context/AuthContext'

const RECENTLY_VIEWED_BASE_KEY = 'recentlyViewed'

const RecentlyViewed = () => {
    const [recentlyViewed, setRecentlyViewed] = useState([])
    const [booksWithRatings, setBooksWithRatings] = useState([])
    const dispatch = useDispatch()
    const { data: allBooks = [] } = useFetchAllBooksQuery()
    const { currentUser } = useAuth()

    const storageSuffix = currentUser?.email || 'anyone'
    const recentlyViewedKey = `${RECENTLY_VIEWED_BASE_KEY}_${storageSuffix}`

    // Load recently viewed books from localStorage when user changes
    useEffect(() => {
        try {
            const viewedBooks = JSON.parse(localStorage.getItem(recentlyViewedKey) || '[]')
            setRecentlyViewed(Array.isArray(viewedBooks) ? viewedBooks : [])
        } catch {
            setRecentlyViewed([])
        }
    }, [recentlyViewedKey])

    useEffect(() => {
        if (recentlyViewed.length > 0 && allBooks.length > 0) {
            const merged = recentlyViewed.map(viewedBook => {
                const fullBook = allBooks.find(b => b._id === viewedBook._id)
                return fullBook ? { ...viewedBook, ...fullBook } : viewedBook
            })
            setBooksWithRatings(merged)
        } else {
            setBooksWithRatings(recentlyViewed)
        }
    }, [recentlyViewed, allBooks])

    const handleAddToCart = (book) => {
        if ((book?.stock || 0) <= 0) return; // Prevent adding out of stock items
        dispatch(addToCart(book))
    }

    const calculateAverageRating = (book) => {
        if (book?.averageRating !== undefined && book.averageRating > 0) {
            return book.averageRating.toFixed(1);
        }
        if (!book?.ratings || book.ratings.length === 0) return '5.0';
        const sum = book.ratings.reduce((acc, r) => acc + (r.value || 0), 0);
        return (sum / book.ratings.length).toFixed(1);
    }

    const getDisplayRating = (book) => {
        if (book?.ratingCount !== undefined && book.ratingCount > 0 && book?.averageRating !== undefined) {
            return book.averageRating;
        }
        if (book?.ratings && book.ratings.length > 0) {
            const sum = book.ratings.reduce((acc, r) => acc + (r.value || 0), 0);
            return sum / book.ratings.length;
        }
        return 5;
    }

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
        )
    }

    const formatTimeAgo = (dateString) => {
        const now = new Date()
        const viewedAt = new Date(dateString)
        const diffInMinutes = Math.floor((now - viewedAt) / (1000 * 60))
        
        if (diffInMinutes < 1) return 'Just now'
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`
        
        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours}h ago`
        
        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays}d ago`
    }

    if (booksWithRatings.length === 0) {
        return null
    }

    return (
        <div className="py-6 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <FiClock className="w-6 h-6 text-blue-600" />
                        <h2 className="text-3xl font-bold text-gray-900">Recently Viewed</h2>
                    </div>
                </div>

                <Swiper
                    modules={[Navigation]}
                    spaceBetween={24}
                    slidesPerView={6}
                    navigation={{
                        nextEl: '.swiper-button-next-recently',
                        prevEl: '.swiper-button-prev-recently',
                    }}
                    breakpoints={{
                        320: {
                            slidesPerView: 1,
                            spaceBetween: 10
                        },
                        640: {
                            slidesPerView: 2,
                            spaceBetween: 20
                        },
                        1024: {
                            slidesPerView: 4,
                            spaceBetween: 24
                        },
                        1280: {
                            slidesPerView: 6,
                            spaceBetween: 24
                        }
                    }}
                    className="!pb-2"
                >
                    {booksWithRatings.slice(0, 10).map((book, index) => (
                        <SwiperSlide key={`${book._id}-${index}`} className="h-full">
                            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col">
                                <Link to={`/books/${book._id}`}>
                                    <div className="relative h-64">
                                        <img
                                            src={`${getImgUrl(book.coverImage)}`}
                                            alt={book.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                            Viewed {formatTimeAgo(book.viewedAt)}
                                        </div>
                                    </div>
                                </Link>
                                
                                <div className="p-4 flex flex-col flex-grow">
                                    <div className="min-h-24">
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
                
                {booksWithRatings.length > 6 && (
                    <>
                        <div className="swiper-button-prev-recently absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full bg-white shadow-md cursor-pointer hover:bg-gray-100 transition-colors z-10">
                            <FiChevronLeft className="w-6 h-6 text-gray-700" />
                        </div>
                        <div className="swiper-button-next-recently absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full bg-white shadow-md cursor-pointer hover:bg-gray-100 transition-colors z-10">
                            <FiChevronRight className="w-6 h-6 text-gray-700" />
                        </div>
                    </>
                )}

            </div>
        </div>
    )
}

export default RecentlyViewed
