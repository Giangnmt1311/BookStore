const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'book', required: true },
    interactionType: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const Interaction = mongoose.model('interaction', interactionSchema, 'interaction');

module.exports = Interaction;
