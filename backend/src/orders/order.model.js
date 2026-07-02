const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
        ref: 'user'
    },
    name: {
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    shippingAddress: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'book',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: 1
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    totalPrice: {
        type: Number,
        required: true,
    },
    buyerConfirmed: {
        type: Boolean,
        default: false,
    },
    completed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
})

const Order =  mongoose.model('order', orderSchema, 'order');

module.exports = Order;