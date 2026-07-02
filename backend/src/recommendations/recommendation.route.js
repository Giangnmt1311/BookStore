const express = require('express');
const { getUserRecommendations, getPopularRecommendations } = require('./recommendation.controller');
const router = express.Router();

router.get('/user/:userId', getUserRecommendations);
router.get('/popular', getPopularRecommendations);

module.exports = router;

