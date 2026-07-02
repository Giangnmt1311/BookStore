const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
});

const Genre = mongoose.model('genre', genreSchema, 'genre');

module.exports = Genre;

