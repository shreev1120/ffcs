const express = require('express');
const router = express.Router();

// Import models
const User = require('../models/User');
const SemesterConfig = require('../models/SemesterConfig');

/**
 * POST /api/webhook/user-state
 * Update user conversation state (called by n8n)
 */
router.post('/user-state', async (req, res) => {
    try {
        const { whatsappNumber, state, vitEmail, name } = req.body;

        if (!whatsappNumber) {
            return res.status(400).json({ error: 'whatsappNumber is required' });
        }

        let user = await User.findOne({ whatsappNumber });

        if (!user) {
            // Create new user
            user = new User({
                whatsappNumber,
                vitEmail: vitEmail || `temp_${Date.now()}@vitstudent.ac.in`,
                name: name || 'Unknown',
                conversationState: state || 'ASK_EMAIL'
            });
        } else {
            // Update existing user
            if (vitEmail) user.vitEmail = vitEmail;
            if (name) user.name = name;
            if (state) user.conversationState = state;
        }

        await user.save();

        res.json({
            message: 'User state updated',
            userId: user._id,
            conversationState: user.conversationState
        });

    } catch (error) {
        console.error('User state update error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/webhook/user/:whatsappNumber
 * Get user information by WhatsApp number (called by n8n)
 */
router.get('/user/:whatsappNumber', async (req, res) => {
    try {
        const { whatsappNumber } = req.params;

        const user = await User.findOne({ whatsappNumber });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);

    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/webhook/timetable-features
 * Receive timetable features from n8n AI agent
 */
router.post('/timetable-features', async (req, res) => {
    try {
        const { timetableId, features, description } = req.body;

        if (!timetableId) {
            return res.status(400).json({ error: 'timetableId is required' });
        }

        // TODO: Update GeneratedTimetable with AI features and description
        // This will be fully implemented in Phase 3

        res.json({
            message: 'Timetable features received',
            timetableId,
            note: 'Full AI integration will be implemented in Phase 3'
        });

    } catch (error) {
        console.error('Features update error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/webhook/timetable-ranking
 * Receive timetable ranking from n8n AI agent
 */
router.post('/timetable-ranking', async (req, res) => {
    try {
        const { rankings } = req.body;

        if (!rankings || !Array.isArray(rankings)) {
            return res.status(400).json({ error: 'rankings array is required' });
        }

        // TODO: Update GeneratedTimetable with rankings
        // This will be fully implemented in Phase 3

        res.json({
            message: 'Rankings received',
            count: rankings.length,
            note: 'Full AI integration will be implemented in Phase 3'
        });

    } catch (error) {
        console.error('Ranking update error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/webhook/health
 * Health check for n8n to verify backend connectivity
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'webhook',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
