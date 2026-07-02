const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    bio: {
        type: String,
        default: '',
    },
    photo: {
        type: String,
        default: '',
    },
});

const Author = mongoose.model('author', authorSchema, 'author');

module.exports = Author;

