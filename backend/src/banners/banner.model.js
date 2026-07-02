const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
});

const Banner = mongoose.model('banner', bannerSchema, 'banner');

module.exports = Banner;
