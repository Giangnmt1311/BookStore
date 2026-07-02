const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    username: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    productId: {
        type: String,
        required: true,
        ref: 'book'
    }
}, {
    timestamps: true
});

const Review = mongoose.model('review', reviewSchema, 'review');

module.exports = Review;

