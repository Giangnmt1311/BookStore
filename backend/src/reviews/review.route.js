const express = require('express');
const {
    createReview,
    getAllReviews,
    getReviewsByProductId,
    getReviewById,
    updateReview,
    deleteReview,
    getReviewsByUserId
} = require('./review.controller');

const router = express.Router();

router.post('/', createReview);
router.get('/', getAllReviews);
router.get('/product/:productId', getReviewsByProductId);
router.get('/user/:userId', getReviewsByUserId);
router.get('/:id', getReviewById);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;

