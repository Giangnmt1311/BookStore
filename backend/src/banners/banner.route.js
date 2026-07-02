const express = require('express');
const { createBanner, getBanners, getBannerById, updateBanner, deleteBanner } = require('./banner.controller');
const router = express.Router();
const verifyAdminToken = require('../middleware/verifyAdminToken');

router.post('/', verifyAdminToken, createBanner);
router.get('/', getBanners);
router.get('/:id', getBannerById);
router.put('/:id', verifyAdminToken, updateBanner);
router.delete('/:id', verifyAdminToken, deleteBanner);

module.exports = router;
