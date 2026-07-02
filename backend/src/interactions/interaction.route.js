const express = require('express');
const { logInteraction } = require('./interaction.controller');
const router = express.Router();

router.post('/log', logInteraction);

module.exports = router;
