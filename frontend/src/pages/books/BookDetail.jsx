import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { FiShoppingCart, FiStar, FiCalendar, FiBook, FiUser, FiGlobe, FiTag, FiHeart } from "react-icons/fi"
import { useParams, Link, useNavigate } from "react-router-dom"

import { getImgUrl } from '../../utils/getImgUrl';
import { getAudioUrl } from '../../utils/getAudioUrl';
import { getSampleUrl } from '../../utils/getSampleUrl';
import { getAuthorUrl } from '../../utils/getAuthorUrl';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/features/cart/cartSlice';
import { useFetchBookByIdQuery, useFetchAllBooksQuery } from '../../redux/features/books/booksApi';
import { useFetchReviewsByProductIdQuery, useAddReviewMutation, useUpdateReviewMutation, useDeleteReviewMutation } from '../../redux/features/reviews/reviewsApi';
import { useFetchAllAuthorsQuery } from '../../redux/features/authors/authorsApi';
import { useAuth } from '../../context/AuthContext';
import { useGetUserByEmailQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation } from '../../redux/features/users/usersApi';
import getBaseUrl from '../../utils/baseURL';

const BookDetail = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const {data: book, isLoading, isError, refetch} = useFetchBookByIdQuery(id);
    const {data: allBooks} = useFetchAllBooksQuery();
    const {data: reviews = [], refetch: refetchReviews} = useFetchReviewsByProductIdQuery(id);
    const {data: authors} = useFetchAllAuthorsQuery();
    const { currentUser } = useAuth();
    const {
        data: userData,
        refetch: refetchUserProfile
    } = useGetUserByEmailQuery(currentUser?.email || '', {
        skip: !currentUser?.email,
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true
    });
    const resolvedUserId = userData?.id || null;
    const getFallbackUsername = () => {
        if (currentUser?.displayName) return currentUser.displayName;
        if (currentUser?.email) return currentUser.email.split('@')[0];
        return 'User';
    };

    const getDisplayUsername = () => {
        if (userData?.username) return userData.username;
        return getFallbackUsername();
    };

    const resolveLatestUsername = async () => {
        if (currentUser?.email && refetchUserProfile) {
            try {
                const result = await refetchUserProfile();
                if (result?.data?.username) {
                    return result.data.username;
                }
            } catch (error) {
                console.error('Failed to refetch user profile:', error);
            }
        }
        return getDisplayUsername();
    };

    const formatReviewerName = (name) => {
        if (!name) return 'User';
        if (name.includes('@')) return name.split('@')[0];
        return name;
    };
    const [reviewText, setReviewText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [selectedRating, setSelectedRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [editingRating, setEditingRating] = useState(0);
    const [editingHoverRating, setEditingHoverRating] = useState(0);
    const [isAuthorBioExpanded, setIsAuthorBioExpanded] = useState(false);
    const [expandedReview, setExpandedReview] = useState(new Set());
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistActionPending, setWishlistActionPending] = useState(false);
    const [addReview] = useAddReviewMutation();
    const [updateReview] = useUpdateReviewMutation();
    const [deleteReview] = useDeleteReviewMutation();
    const [addToWishlist] = useAddToWishlistMutation();
    const [removeFromWishlist] = useRemoveFromWishlistMutation();
    const logInteraction = useCallback(async ({ bookId, interactionType }) => {
        if (!bookId || !interactionType || !resolvedUserId) return;
        try {
            await fetch(`${getBaseUrl()}/api/interactions/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: resolvedUserId,
                    bookId,
                    interactionType
                })
            });
        } catch (error) {
            console.error(`Failed to log ${interactionType} interaction:`, error);
        }
    }, [resolvedUserId]);

    const getAuthorName = (bookData) => {
        if (!bookData) return 'Unknown Author';
        if (bookData.authorId && typeof bookData.authorId === 'object' && bookData.authorId.name) {
            return bookData.authorId.name;
        }
        return bookData.author || 'Unknown Author';
    };

    const recentlyViewedKey = `recentlyViewed_${currentUser?.email || 'anyone'}`

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (book) {
            const viewedBooks = JSON.parse(localStorage.getItem(recentlyViewedKey) || '[]');
            const bookData = {
                _id: book._id,
                title: book.title,
                author: getAuthorName(book),
                coverImage: book.coverImage,
                newPrice: book.newPrice,
                oldPrice: book.oldPrice,
                genres: book.genres,
                description: book.description,
                viewedAt: new Date().toISOString()
            };

            const filteredBooks = viewedBooks.filter(b => b._id !== book._id);
            const updatedBooks = [bookData, ...filteredBooks].slice(0, 6); // recent books

            localStorage.setItem(recentlyViewedKey, JSON.stringify(updatedBooks));
            window.dispatchEvent(new Event('recentlyViewedUpdated'));
            logInteraction({ bookId: book._id, interactionType: 'view' });
        }
    }, [book, logInteraction, recentlyViewedKey]);
    
    const averageRating = useMemo(() => {
        if(!reviews || reviews.length === 0) return '5.0';
        const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        return (sum / reviews.length).toFixed(1);
    }, [reviews]);

    const ratingDistribution = useMemo(() => {
        if(!reviews || reviews.length === 0) return {1:0, 2:0, 3:0, 4:0, 5:0};
        const distribution = {1:0, 2:0, 3:0, 4:0, 5:0};
        reviews.forEach(review => {
            const rating = Math.round(review.rating);
            if (rating >= 1 && rating <= 5) {
                distribution[rating]++;
            }
        });
        return distribution;
    }, [reviews]);

    const relatedBooks = useMemo(() => {
        if (!allBooks || !book) return [];
        return allBooks
            .filter(b => b._id !== book._id && b.genres === book.genres)
            .slice(0, 4);
    }, [allBooks, book]);

    const dispatch = useDispatch();

    const handleAddToCart = (product) => {
        if ((product?.stock || 0) <= 0) return;
        dispatch(addToCart(product))
    }
    
    const isOutOfStock = (book?.stock || 0) <= 0;

    useEffect(() => {
        if (!book || !userData?.wishlist) {
            setIsWishlisted(false);
            return;
        }
        setIsWishlisted(userData.wishlist.some((id) => id === book._id));
    }, [book, userData]);

    const handleWishlistToggle = async () => {
        if (!currentUser?.email || !book?._id) {
            navigate('/login');
            return;
        }
        if (wishlistActionPending) return;
        setWishlistActionPending(true);
        try {
            if (isWishlisted) {
                await removeFromWishlist({ email: currentUser.email, bookId: book._id }).unwrap();
            } else {
                await addToWishlist({ email: currentUser.email, bookId: book._id }).unwrap();
                if (resolvedUserId) {
                    logInteraction({ bookId: book._id, interactionType: 'wishlist' });
                }
            }
            await refetchUserProfile();
        } catch (error) {
            console.error('Failed to update wishlist:', error);
            alert(error?.data?.message || 'Failed to update wishlist. Please try again.');
        } finally {
            setWishlistActionPending(false);
        }
    };

    const renderStars = (rating, size = 'w-5 h-5') => {
        const numRating = Number(rating) || 0;
        return (
            <div className="flex items-center">
                {[1,2,3,4,5].map(n => {
                    const isFull = n <= Math.floor(numRating);
                    const isHalf = !isFull && n - 0.5 <= numRating;
                    
                    return (
                        <div key={n} className="relative inline-block">
                            <FiStar 
                                className={`${size} text-gray-300`}
                            />
                            {isFull && (
                                <FiStar 
                                    className={`${size} text-yellow-400 fill-current absolute top-0 left-0`}
                                />
                            )}
                            {isHalf && (
                                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                                    <FiStar 
                                        className={`${size} text-yellow-400 fill-current`}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const formatDate = (date) => {
        if (!date) return 'Not specified';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatPublicationDate = (date) => {
        if (!date) return 'Not specified';
        const dateObj = new Date(date);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    };

    if(isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    );
    
    if(isError) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Book</h2>
                <p className="text-gray-600">There was an error loading the book information. Please try again later.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Book Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Side - Book Cover */}
                    <div className="flex-shrink-0 mx-auto lg:mx-0 lg:sticky lg:top-24 lg:self-start">
                        <div className="relative">
                            <img
                                src={`${getImgUrl(book.coverImage)}`}
                                alt={book.title}
                                className="w-80 h-96 object-cover rounded-lg shadow-lg"
                            />
                            {isOutOfStock && (
                                <div className="absolute top-2 right-2 bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                                    <FiTag className="w-4 h-4 mr-1" />
                                    Out of Stock
                                </div>
                            )}
                            {/* Trending badge removed */}
                        </div>
                        
                        {/* Action Buttons - Sticky on scroll */}
                        <div className="mt-8 space-y-3">
                            <button 
                                onClick={() => handleAddToCart(book)} 
                                disabled={isOutOfStock}
                                className={`w-full px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg ${
                                    isOutOfStock 
                                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                                }`}
                            >
                                <FiShoppingCart className="w-6 h-6" />
                                <span className="text-lg">Add to Cart</span>
                            </button>
                            <button
                                onClick={handleWishlistToggle}
                                disabled={wishlistActionPending}
                                className={`w-full border px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow hover:shadow-md ${
                                    isWishlisted
                                        ? 'bg-red-50 border-red-200 text-red-600'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                } ${wishlistActionPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <FiHeart className={`w-6 h-6 ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
                                <span className="text-lg">{isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}</span>
                            </button>
                            {book.sampleFile && (
                                <button 
                                    onClick={() => {
                                        const fileUrl = getSampleUrl(book.sampleFile);
                                        if (fileUrl) {
                                            navigate(`/reader?url=${encodeURIComponent(fileUrl)}&fileName=${encodeURIComponent(book.sampleFile)}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(getAuthorName(book))}`);
                                        } else {
                                            alert(`Sample file not found. File name: "${book.sampleFile}"`);
                                        }
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <FiBook className="w-6 h-6" />
                                    <span className="text-lg">Read Sample</span>
                                </button>
                            )}
                            {book.audioFile && (
                                <button 
                                    onClick={() => {
                                        const audioUrl = getAudioUrl(book.audioFile);
                                        if (audioUrl) {
                                            navigate(`/audio-player?url=${encodeURIComponent(audioUrl)}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(getAuthorName(book))}`);
                                        } else {
                                            alert(`Audio file not found. File name: "${book.audioFile}". Please check if the file exists in the assets folder.`);
                                        }
                                    }}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <FiBook className="w-6 h-6" />
                                    <span className="text-lg">Listen to Sample</span>
                                </button>
                            )}
                            
                            <button 
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: book.title,
                                            text: `Check out "${book.title}" by ${getAuthorName(book)}`,
                                            url: window.location.href
                                        });
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Link copied to clipboard!');
                                    }
                                }}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <FiGlobe className="w-6 h-6" />
                                <span className="text-lg">Share</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Side - All Book Information */}
                    <div className="flex-1 space-y-8">
                        {/* Book Header */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                                <div className="flex-1">
                                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{book.title}</h1>
                                    <p className="text-xl text-gray-600 mb-4">by {getAuthorName(book)}</p>
                                    
                                    {/* Quick Stats */}
                                    <div className="flex flex-wrap gap-4 mb-4">
                                        {book.publicationDate && (
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <FiCalendar className="w-4 h-4" />
                                                <span>{formatPublicationDate(book.publicationDate)}</span>
                                            </div>
                                        )}
                                        {book.pages > 0 && (
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <FiBook className="w-4 h-4" />
                                                <span>{book.pages.toLocaleString()} pages</span>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <FiTag className="w-4 h-4" />
                                            <span className="capitalize">{book.genres}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Quick Rating & Price */}
                                <div className="lg:text-right">
                                    <div className="flex items-center space-x-2 mb-2 lg:justify-end">
                                        {renderStars(Number(averageRating))}
                                        <span className="text-xl font-bold text-gray-900">{averageRating}</span>
                                        <span className="text-gray-500">({reviews?.length || 0})</span>
                                    </div>
                                    <div className="mb-4">
                                        <span className="text-3xl font-bold text-green-600">${book.newPrice}</span>
                                        {book.oldPrice > book.newPrice && (
                                            <span className="text-lg text-gray-500 line-through ml-2">${book.oldPrice}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mt-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this</h2>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {book?.description || 'No description available.'}
                                </p>
                            </div>
                        </div>

                        {/* Book Details Grid */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {book.isbn && (
                                    <div className="flex items-center space-x-3">
                                        <FiTag className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <span className="text-sm text-gray-500">ISBN</span>
                                            <p className="font-semibold">{book.isbn}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center space-x-3">
                                    <FiCalendar className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <span className="text-sm text-gray-500">Publication Date</span>
                                        <p className="font-semibold">{formatPublicationDate(book.publicationDate)}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <FiBook className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <span className="text-sm text-gray-500">Pages</span>
                                        <p className="font-semibold">{book.pages ? book.pages.toLocaleString() : 'Not specified'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <FiGlobe className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <span className="text-sm text-gray-500">Publisher</span>
                                        <p className="font-semibold">{book.publisher || 'Not specified'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <FiGlobe className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <span className="text-sm text-gray-500">Language</span>
                                        <p className="font-semibold">{book.language || 'Not specified'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <FiTag className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <span className="text-sm text-gray-500">Genre</span>
                                        <p className="font-semibold capitalize">{book.genres}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <FiTag className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <span className="text-sm text-gray-500">Age Rating</span>
                                        <p className="font-semibold">{book.ageRating || 'Not specified'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Author Information */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Author</h2>
                            <div className="flex items-start space-x-4">
                                {(() => {
                                    const authorData = book.authorId && typeof book.authorId === 'object' 
                                        ? book.authorId 
                                        : (authors?.find(a => a._id === book.authorId || a.name === book.author) || null);
                                    
                                    const authorName = authorData?.name || book.author || 'Unknown Author';
                                    const authorBio = authorData?.bio || book.authorBio || '';
                                    const shortenBio = authorBio && authorBio.length > 200 && !isAuthorBioExpanded;
                                    const authorPhotoUrl = authorData?.photo ? getAuthorUrl(authorData.photo) : null;
                                    
                                    return (
                                        <>
                                            {authorPhotoUrl ? (
                                                <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
                                                    <img 
                                                        src={authorPhotoUrl} 
                                                        alt={authorName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<div class="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0"><svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FiUser className="w-8 h-8 text-gray-600" />
                                </div>
                                            )}
                                <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-2">{authorName}</h3>
                                                {authorBio ? (
                                                    <div>
                                                        <p 
                                                            className={`text-gray-700 leading-relaxed whitespace-pre-line ${shortenBio ? 'max-h-32 overflow-hidden relative' : ''}`}
                                                        >
                                                            {authorBio}
                                                            {shortenBio && (
                                                                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                                                            )}
                                                        </p>
                                                        {authorBio.length > 200 && (
                                                            <button
                                                                onClick={() => setIsAuthorBioExpanded(!isAuthorBioExpanded)}
                                                                className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                                                            >
                                                                {isAuthorBioExpanded ? 'Read less' : 'Read more...'}
                                                            </button>
                                                        )}
                                                    </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No biography available for this author.</p>
                                    )}
                                </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Book Statistics */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Book Statistics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{averageRating}</div>
                                    <div className="text-sm text-gray-600">Average Rating</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{reviews?.length || 0}</div>
                                    <div className="text-sm text-gray-600">Total Reviews</div>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Reviews</h2>
                            
                            {/* Rating Distribution */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
                                <div className="space-y-2">
                                    {[5,4,3,2,1].map(rating => (
                                        <div key={rating} className="flex items-center space-x-3">
                                            <span className="w-8 text-sm font-medium">{rating}</span>
                                            <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-yellow-400 h-2 rounded-full" 
                                                    style={{ 
                                                        width: `${reviews?.length > 0 ? (ratingDistribution[rating] / reviews.length) * 100 : 0}%` 
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="w-12 text-sm text-gray-600">
                                                {reviews?.length > 0 ? Math.round((ratingDistribution[rating] / reviews.length) * 100) : 0}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Add Review */}
                            {currentUser && (
                                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4">Write a Review & Rate this Book</h3>
                                    <div className="space-y-4">
                                        {/* Rating Section - Always visible */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Rate this book:
                                            </label>
                                            <div className="flex items-center space-x-1">
                                                {[1,2,3,4,5].map(n => (
                                                    <button 
                                                        key={n} 
                                                        type="button"
                                                        onClick={() => setSelectedRating(n)}
                                                        onMouseEnter={() => setHoverRating(n)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        className="focus:outline-none transition-colors"
                                                    >
                                                        <FiStar 
                                                            className={`w-8 h-8 ${
                                                                n <= (hoverRating || selectedRating) 
                                                                    ? 'text-yellow-400 fill-current' 
                                                                    : 'text-gray-300 hover:text-yellow-200'
                                                            }`} 
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedRating > 0 && (
                                                <p className="text-sm text-gray-600">
                                                    You rated this book {selectedRating} star{selectedRating !== 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Write your review:
                                            </label>
                                            <textarea 
                                                value={reviewText} 
                                                onChange={(e) => setReviewText(e.target.value)} 
                                                placeholder="Share your thoughts about this book..." 
                                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                rows="4"
                                            />
                                        </div>
                                        
                                        <button 
                                            onClick={async () => {
                                                if(!reviewText.trim()) {
                                                    alert('Please write a review');
                                                    return;
                                                }
                                                if(selectedRating === 0) {
                                                    alert('Please rate the book');
                                                    return;
                                                }
                                                if (!resolvedUserId) {
                                                    alert('Unable to resolve your profile. Please try again.');
                                                    return;
                                                }
                                                try {
                                                    const usernameForReview = await resolveLatestUsername();
                                                    await addReview({
                                                        productId: id, 
                                                        userId: resolvedUserId, 
                                                        username: usernameForReview, 
                                                        content: reviewText,
                                                        rating: selectedRating
                                                    }).unwrap();
                                                    
                                                    setReviewText('');
                                                    setSelectedRating(0);
                                                    setHoverRating(0);
                                                    await refetchReviews();
                                                logInteraction({ bookId: id, interactionType: 'rating' });
                                                } catch {
                                                    alert('Failed to add review and rating');
                                                }
                                            }} 
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            disabled={!reviewText.trim() || selectedRating === 0}
                                        >
                                            Post Review & Rating
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Reviews List */}
                            <div className="space-y-6">
                                {reviews?.map(review => {
                                    const ratingValue = review.rating || 0;
                                    const isReviewExpanded = expandedReview.has(review._id);
                                    const shortenReview = review.content && review.content.length > 200 && !isReviewExpanded;
                                    
                                    const toggleReviewExpansion = () => {
                                        const newExpanded = new Set(expandedReview);
                                        if (isReviewExpanded) {
                                            newExpanded.delete(review._id);
                                        } else {
                                            newExpanded.add(review._id);
                                        }
                                        setExpandedReview(newExpanded);
                                    };
                                    
                                    return (
                                        <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center space-x-3 mb-1">
                                                                <h4 className="font-semibold text-gray-900">{formatReviewerName(review.username)}</h4>
                                                        {ratingValue > 0 && (
                                                            <div className="flex items-center space-x-1">
                                                                {renderStars(ratingValue, 'w-4 h-4')}
                                                                <span className="text-sm text-gray-600">({ratingValue}/5)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            {review.userId === resolvedUserId && (
                                                <div className="flex space-x-2">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingId(review._id);
                                                            setEditingText(review.content);
                                                            setEditingRating(ratingValue);
                                                            setEditingHoverRating(0);
                                                        }} 
                                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            if (!resolvedUserId) {
                                                                alert('Unable to resolve your profile. Please try again.');
                                                                return;
                                                            }
                                                            try {
                                                                await deleteReview({
                                                                    id: review._id, 
                                                                    userId: resolvedUserId
                                                                }).unwrap();
                                                                await refetchReviews();
                                                            } catch {
                                                                alert('Failed to delete');
                                                            }
                                                        }} 
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {editingId === review._id ? (
                                            <div className="space-y-3">
                                                {/* Edit Rating */}
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Update your rating:
                                                    </label>
                                                    <div className="flex items-center space-x-1">
                                                        {[1,2,3,4,5].map(n => (
                                                            <button 
                                                                key={n} 
                                                                type="button"
                                                                onClick={() => setEditingRating(n)}
                                                                onMouseEnter={() => setEditingHoverRating(n)}
                                                                onMouseLeave={() => setEditingHoverRating(0)}
                                                                className="focus:outline-none transition-colors"
                                                            >
                                                                <FiStar 
                                                                    className={`w-6 h-6 ${
                                                                        n <= (editingHoverRating || editingRating) 
                                                                            ? 'text-yellow-400 fill-current' 
                                                                            : 'text-gray-300 hover:text-yellow-200'
                                                                    }`} 
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {editingRating > 0 && (
                                                        <p className="text-sm text-gray-600">
                                                            Rating: {editingRating} star{editingRating !== 1 ? 's' : ''}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {/* Edit Review Text */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Update your review:
                                                    </label>
                                                    <textarea 
                                                        value={editingText} 
                                                        onChange={(e) => setEditingText(e.target.value)} 
                                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        rows="3"
                                                    />
                                                </div>
                                                
                                                <div className="flex space-x-2">
                                                    <button 
                                                        onClick={async () => {
                                                            if(!editingText.trim()) {
                                                                alert('Please write a review');
                                                                return;
                                                            }
                                                            if(editingRating === 0) {
                                                                alert('Please provide a rating');
                                                                return;
                                                            }
                                                            if (!resolvedUserId) {
                                                                alert('Unable to resolve your profile. Please try again.');
                                                                return;
                                                            }
                                                            try {
                                                                await updateReview({
                                                                    id: review._id, 
                                                                    userId: resolvedUserId, 
                                                                    content: editingText,
                                                                    rating: editingRating
                                                                }).unwrap();
                                                                
                                                                await refetchReviews();
                                                                setEditingId(null);
                                                                setEditingRating(0);
                                                                setEditingHoverRating(0);
                                                            } catch {
                                                                alert('Failed to update review and rating');
                                                            }
                                                        }} 
                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                        disabled={!editingText.trim() || editingRating === 0}
                                                    >
                                                        Save Changes
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditingRating(0);
                                                            setEditingHoverRating(0);
                                                        }} 
                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p 
                                                    className={`text-gray-700 text-xs md:text-sm leading-relaxed whitespace-pre-line ${shortenReview ? 'max-h-32 overflow-hidden relative' : ''}`}
                                                >
                                                    {review.content}
                                                    {shortenReview && (
                                                        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                                                    )}
                                                </p>
                                                {review.content && review.content.length > 200 && (
                                                    <button
                                                        onClick={toggleReviewExpansion}
                                                        className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                                                    >
                                                        {isReviewExpanded ? 'Read less' : 'Read more...'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Related Books Suggestions */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Products related to this item</h2>
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    Books in {book.genres}
                                </span>
                            </div>
                            
                            {relatedBooks.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {relatedBooks.map(relatedBook => (
                                        <Link key={relatedBook._id} to={`/books/${relatedBook._id}`} className="group cursor-pointer">
                                            <div className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300">
                                                <img
                                                    src={`${getImgUrl(relatedBook.coverImage)}`}
                                                    alt={relatedBook.title}
                                                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                {/* Trending badge removed */}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                                            </div>
                                            <div className="mt-3">
                                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                    {relatedBook.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">{getAuthorName(relatedBook)}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-lg font-bold text-green-600">${relatedBook.newPrice}</span>
                                                    {relatedBook.oldPrice > relatedBook.newPrice && (
                                                        <span className="text-sm text-gray-500 line-through">${relatedBook.oldPrice}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FiBook className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">No other books found in this genre yet.</p>
                                    <p className="text-sm text-gray-400 mt-1">Check back later for more recommendations!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
  )
}

export default BookDetail