const mongoose = require('mongoose');
const Review = require('./review.model');
const Book = require('../books/book.model');
const { triggerRecommendationRebuild } = require('../recommendations/recommendation.update');

const updateBookRatingAndCount = async (productId) => {
    try {
        const reviews = await Review.find({ productId });
        const reviewsCount = reviews.length;
        
        if (reviewsCount === 0) {
            await Book.findByIdAndUpdate(productId, { 
                averageRating: 5,
                reviewsCount: 0
            });
            return;
        }
        
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = (totalRating / reviewsCount).toFixed(1);
        
        await Book.findByIdAndUpdate(productId, { 
            averageRating: parseFloat(averageRating),
            reviewsCount: reviewsCount
        });
    } catch (error) {
        console.error('Error updating book average rating and reviews count', error);
    }
};

const createReview = async (req, res) => {
    try {
        const { userId, username, content, rating, productId } = req.body;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send({ message: 'Valid userId is required' });
        }
        const normalizedUserId = new mongoose.Types.ObjectId(userId);
        const book = await Book.findById(productId);
        if (!book) {
            return res.status(404).send({ message: 'Book not found' });
        }
        const existingReview = await Review.findOne({ userId: normalizedUserId, productId });
        if (existingReview) {
            existingReview.content = content;
            existingReview.rating = rating;
            if (username) existingReview.username = username;
            await existingReview.save();            
            await updateBookRatingAndCount(productId);
            // trigger recommendation rebuild after review update
            setImmediate(() => triggerRecommendationRebuild("review-updated"));
            
            return res.status(200).send({ message: 'Review updated successfully', review: existingReview });
        }

        const newReview = new Review({
            userId: normalizedUserId,
            username,
            content,
            rating,
            productId
        });

        await newReview.save();        
        await updateBookRatingAndCount(productId);       
        setImmediate(() => triggerRecommendationRebuild("review-created"));       
        res.status(201).send({ message: 'Review created successfully', review: newReview });
    } catch (error) {
        console.error('Error creating review', error);
        res.status(500).send({ message: 'Failed to create review', error: error.message });
    }
};

const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.status(200).send(reviews);
    } catch (error) {
        console.error('Error fetching reviews', error);
        res.status(500).send({ message: 'Failed to fetch reviews' });
    }
};

const getReviewsByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
        res.status(200).send(reviews);
    } catch (error) {
        console.error('Error fetching reviews by product', error);
        res.status(500).send({ message: 'Failed to fetch reviews' });
    }
};

const getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).send({ message: 'Review not found' });
        }
        res.status(200).send(review);
    } catch (error) {
        console.error('Error fetching review', error);
        res.status(500).send({ message: 'Failed to fetch review' });
    }
};

const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, content, rating, username } = req.body;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send({ message: 'Valid userId is required' });
        }
        const normalizedUserId = new mongoose.Types.ObjectId(userId);

        const existingReview = await Review.findById(id);
        if (!existingReview) {
            return res.status(404).send({ message: 'Review not found' });
        }
        if (!existingReview.userId.equals(normalizedUserId)) {
            return res.status(403).send({ message: 'Not allowed to update this review' });
        }
        if (content !== undefined) existingReview.content = content;
        if (rating !== undefined) existingReview.rating = rating;
        if (username !== undefined) existingReview.username = username;
        await existingReview.save();        
        if (rating !== undefined) {
            await updateBookRatingAndCount(existingReview.productId);
        }
        
        res.status(200).send({ message: 'Review updated successfully', review: existingReview });
    } catch (error) {
        console.error('Error updating review', error);
        res.status(500).send({ message: 'Failed to update review', error: error.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send({ message: 'Valid userId is required' });
        }
        const normalizedUserId = new mongoose.Types.ObjectId(userId);

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).send({ message: 'Review not found' });
        }
        if (!review.userId.equals(normalizedUserId)) {
            return res.status(403).send({ message: 'Not allowed to delete this review' });
        }

        const productId = review.productId;
        await Review.findByIdAndDelete(id);        
        await updateBookRatingAndCount(productId);
        
        res.status(200).send({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review', error);
        res.status(500).send({ message: 'Failed to delete review', error: error.message });
    }
};

const getReviewsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send({ message: 'Invalid userId' });
        }
        const reviews = await Review.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
        res.status(200).send(reviews);
    } catch (error) {
        console.error('Error fetching user reviews', error);
        res.status(500).send({ message: 'Failed to fetch user reviews' });
    }
};

module.exports = {
    createReview,
    getAllReviews,
    getReviewsByProductId,
    getReviewById,
    updateReview,
    deleteReview,
    getReviewsByUserId
};

