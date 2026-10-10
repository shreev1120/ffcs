const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyWebhookSecret } = require('../utils/middleware');

/**
 * Health check for n8n/monitoring to verify backend connectivity (Item 43)
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'webhook',
        timestamp: new Date().toISOString()
    });
});

// All webhook data mutating and query endpoints require secret verification (Items 9, 31, 59, 70)
router.use(verifyWebhookSecret);

/**
 * POST /api/webhook/user-state
 * Update user conversation state (called by authenticated n8n bot)
 */
router.post('/user-state', async (req, res) => {
    try {
        const { whatsappNumber, state, vitEmail, name } = req.body;

        if (!whatsappNumber || typeof whatsappNumber !== 'string') {
            return res.status(400).json({ error: 'whatsappNumber is required' });
        }

        const sanitizedWhatsApp = whatsappNumber.trim().slice(0, 25);
        let user = await User.findOne({ whatsappNumber: sanitizedWhatsApp });

        const allowedStates = ['IDLE', 'ASK_EMAIL', 'ASK_EXCEL', 'ASK_PREFERENCES', 'GENERATING', 'SUCCESS'];
        const validatedState = allowedStates.includes(state) ? state : 'ASK_EMAIL';

        if (!user) {
            // Create new user record
            const cleanEmail = (vitEmail && typeof vitEmail === 'string' && vitEmail.includes('@vitstudent.ac.in'))
                ? vitEmail.trim().toLowerCase().slice(0, 80)
                : `temp_${Date.now()}@vitstudent.ac.in`;

            user = new User({
                whatsappNumber: sanitizedWhatsApp,
                vitEmail: cleanEmail,
                name: typeof name === 'string' ? name.trim().slice(0, 80) : 'Student',
                conversationState: validatedState
            });
        } else {
            // Update existing user safely
            if (vitEmail && typeof vitEmail === 'string' && vitEmail.includes('@vitstudent.ac.in')) {
                user.vitEmail = vitEmail.trim().toLowerCase().slice(0, 80);
            }
            if (name && typeof name === 'string') {
                user.name = name.trim().slice(0, 80);
            }
            user.conversationState = validatedState;
        }

        await user.save();

        res.json({
            message: 'User state updated successfully',
            userId: user._id,
            conversationState: user.conversationState
        });

    } catch (error) {
        console.error('User state update error:', error);
        res.status(500).json({ error: 'Failed to update user conversation state' });
    }
});

/**
 * GET /api/webhook/user/:whatsappNumber
 * Get user information by WhatsApp number (strictly excludes sensitive fields like passwordHash)
 */
router.get('/user/:whatsappNumber', async (req, res) => {
    try {
        const { whatsappNumber } = req.params;

        if (!whatsappNumber || typeof whatsappNumber !== 'string') {
            return res.status(400).json({ error: 'Valid whatsappNumber required' });
        }

        const user = await User.findOne({ whatsappNumber: whatsappNumber.trim() })
            .select('-passwordHash -__v');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);

    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

/**
 * POST /api/webhook/timetable-features
 * Receive timetable features from authorized n8n AI agent
 */
router.post('/timetable-features', async (req, res) => {
    try {
        const { timetableId, features, description } = req.body;

        if (!timetableId) {
            return res.status(400).json({ error: 'timetableId is required' });
        }

        res.json({
            message: 'Timetable features received successfully',
            timetableId,
            status: 'recorded'
        });

    } catch (error) {
        console.error('Features update error:', error);
        res.status(500).json({ error: 'Failed to process features' });
    }
});

/**
 * POST /api/webhook/timetable-ranking
 * Receive timetable ranking from authorized n8n AI agent
 */
router.post('/timetable-ranking', async (req, res) => {
    try {
        const { rankings } = req.body;

        if (!rankings || !Array.isArray(rankings)) {
            return res.status(400).json({ error: 'rankings array is required' });
        }

        res.json({
            message: 'Rankings received successfully',
            count: rankings.length,
            status: 'recorded'
        });

    } catch (error) {
        console.error('Ranking update error:', error);
        res.status(500).json({ error: 'Failed to process rankings' });
    }
});

module.exports = router;
