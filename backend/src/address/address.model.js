const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true,
        index: true
    },
    firstName: {
        type: String,
        trim: true,
        required: true
    },
    lastName: {
        type: String,
        trim: true
    },
    street: {
        type: String,
        trim: true,
        required: true
    },
    city: {
        type: String,
        trim: true,
        required: true
    },
    state: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        trim: true,
        required: true
    },
    zipcode: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'address'
});

const Address = mongoose.model('address', addressSchema, 'address');

module.exports = Address;

