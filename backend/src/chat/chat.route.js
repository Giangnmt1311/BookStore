const express = require('express');
const { chatWithGemini, chatWithGeminiAdmin, healthCheck } = require('./chat.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');

const router = express.Router();

router.post('/', chatWithGemini);
router.post('/admin', verifyAdminToken, chatWithGeminiAdmin);
router.get('/health', healthCheck);

module.exports = router;


