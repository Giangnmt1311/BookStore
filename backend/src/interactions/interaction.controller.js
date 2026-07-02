const mongoose = require('mongoose');
const Interaction = require('./interaction.model');
const { triggerRecommendationRebuild } = require('../recommendations/recommendation.update');

// track view counts per user to trigger recommendations after multiple views
const viewCounts = new Map();
const VIEW_THRESHOLD = 5;
const VIEW_WINDOW_MS = 60 * 60 * 1000;

const checkAndTriggerForViews = (userId) => {
    const userIdStr = userId.toString();
    const now = new Date();
    
    if (!viewCounts.has(userIdStr)) {
        viewCounts.set(userIdStr, { count: 0, lastReset: now });
    }
    
    const userData = viewCounts.get(userIdStr);
    
    if (now - userData.lastReset > VIEW_WINDOW_MS) {
        userData.count = 0;
        userData.lastReset = now;
    }
    
    userData.count++;
    
    if (userData.count >= VIEW_THRESHOLD) {
        userData.count = 0;
        userData.lastReset = now;
        setImmediate(() => triggerRecommendationRebuild(`multiple-views-${userIdStr}`));
    }
    
    for (const [key, data] of viewCounts.entries()) {
        if (now - data.lastReset > 2 * VIEW_WINDOW_MS) {
            viewCounts.delete(key);
        }
    }
};

const logInteraction = async (req, res) => {
    try {
        const { userId, bookId, interactionType } = req.body;

        if (!bookId || !interactionType) {
            return res.status(400).json({ error: 'bookId and interactionType are required' });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Valid userId is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ error: 'Invalid bookId' });
        }

        const interaction = new Interaction({
            userId: new mongoose.Types.ObjectId(userId),
            bookId: new mongoose.Types.ObjectId(bookId),
            interactionType
        });

        await interaction.save();

        if (interactionType.toLowerCase() === 'view') {
            checkAndTriggerForViews(userId);
        }

        res.status(201).json({ success: true, message: 'Interaction logged' });
    } catch (error) {
        console.error('Error logging interaction:', error);
        res.status(500).json({ error: 'Failed to log interaction', message: error.message });
    }
};

module.exports = {
    logInteraction
};
