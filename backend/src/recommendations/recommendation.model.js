const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'book', required: true },
    hybridScore: { type: Number, default: null },
    cfScore: { type: Number, default: null },
    cbScore: { type: Number, default: null }
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    recommendedProductIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'book'
    }],
    recommendationMethod: {
        type: String,
        enum: ['hybrid', 'collaborative', 'content_based', 'popularity'],
        default: 'hybrid'
    },
    scores: [scoreSchema],
    metadata: {
        totalSignals: { type: Number, default: 0 },
        generatedAt: { type: Date },
        fallbackReason: { type: String, default: null }
    }
}, {
    timestamps: true
});

const Recommendation = mongoose.model('recommendation', recommendationSchema, 'recommendation');

module.exports = Recommendation;

