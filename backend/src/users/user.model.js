const mongoose = require('mongoose')

const userSchema =  new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    firebaseId: {
        type: String,
        unique: true,
        sparse: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    avatar: {
        type: String,
        trim: true,
        default: ''
    },
    wishlist: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'book'
        }],
        default: []
    }
}, {
    timestamps: true
})

const User =  mongoose.model('user', userSchema, 'user');

module.exports = User;