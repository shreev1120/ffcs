const express = require('express');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const GeneratedTimetable = require('../models/GeneratedTimetable');
const { hashPassword, verifyPassword, createSessionToken } = require('../utils/auth');
const { requireAuth, SESSION_COOKIE } = require('../utils/middleware');

const router = express.Router();

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const VIT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@vitstudent\.ac\.in$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function setSessionCookie(res, token) {
    const secure = process.env.NODE_ENV === 'production';
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge: SESSION_TTL_MS,
        path: '/'
    });
}

function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
}

function sanitizeUser(user) {
    return {
        id: user._id,
        vitEmail: user.vitEmail,
        name: user.name,
        whatsappNumber: user.whatsappNumber,
        registrationNumber: user.registrationNumber,
        preferences: user.preferences
    };
}

async function trackActivity({ userId, action, details, metadata }) {
    try {
        await ActivityLog.create({
            userId,
            action,
            details,
            metadata
        });
    } catch {
        // Silently handle audit log errors to avoid blocking core user flow
    }
}

function readCredentials(body = {}) {
    const vitEmail = String(body.vitEmail || body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    return { vitEmail, password };
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { vitEmail, password } = readCredentials(req.body);
        const { confirmPassword, name, registrationNumber, whatsappNumber, website_hp } = req.body;

        // Bot honeypot spam trap (Item 18 & 28)
        if (website_hp && String(website_hp).trim().length > 0) {
            return res.status(400).json({ error: 'Automated bot submission rejected.' });
        }

        if (!vitEmail || !password) {
            return res.status(400).json({ error: 'vitEmail and password are required.' });
        }

        if (!VIT_EMAIL_REGEX.test(vitEmail)) {
            return res.status(400).json({ error: 'Use a valid VIT email address (@vitstudent.ac.in).' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long.'
            });
        }

        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({ error: 'Password and confirm password do not match.' });
        }

        const existingUser = await User.findOne({ vitEmail });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email address already exists.' });
        }

        const user = await User.create({
            vitEmail,
            passwordHash: hashPassword(password),
            name: typeof name === 'string' ? name.trim().slice(0, 80) : '',
            registrationNumber: typeof registrationNumber === 'string' ? registrationNumber.trim().toUpperCase().slice(0, 20) : '',
            whatsappNumber: typeof whatsappNumber === 'string' && whatsappNumber.trim() ? whatsappNumber.trim().slice(0, 25) : `pending-${Date.now()}`,
            preferences: {
                batchPreference: null,
                rankingCriteria: 'balanced',
                maxTimetables: 12
            }
        });

        // Set authenticated session cookie upon signup
        const token = createSessionToken(user._id);
        setSessionCookie(res, token);

        await trackActivity({
            userId: user._id,
            action: 'Signed Up',
            details: 'Account created successfully'
        });

        return res.status(201).json({
            message: 'Account created successfully.',
            user: sanitizeUser(user)
        });
    } catch (error) {
        return res.status(500).json({ error: 'Unable to create account. Server unavailable.' });
    }
});

// POST /api/auth/login (Item 24 & 56: Generic credentials check against account enumeration)
router.post('/login', async (req, res) => {
    try {
        const { vitEmail, password } = readCredentials(req.body);
        if (!vitEmail || !password) {
            return res.status(400).json({ error: 'vitEmail and password are required.' });
        }
        if (!VIT_EMAIL_REGEX.test(vitEmail)) {
            return res.status(400).json({ error: 'Invalid email format. Use your VIT email.' });
        }

        const user = await User.findOne({ vitEmail });
        // Generic error message to prevent account enumeration
        if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
            return res.status(401).json({ error: 'Invalid credentials. Check your email or password.' });
        }

        const token = createSessionToken(user._id);
        setSessionCookie(res, token);

        await trackActivity({
            userId: user._id,
            action: 'Logged In',
            details: 'User signed in successfully'
        });

        return res.json({
            message: 'Login successful',
            user: sanitizeUser(user)
        });
    } catch {
        return res.status(500).json({ error: 'Unable to login. Server unavailable.' });
    }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
    await trackActivity({
        userId: req.user._id,
        action: 'Logged Out',
        details: 'User logged out'
    });
    clearSessionCookie(res);
    return res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
    return res.json({ user: sanitizeUser(req.user) });
});

// PUT /api/auth/profile (Item 51: Prevent Mass Assignment)
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const { name, whatsappNumber, registrationNumber } = req.body;
        if (typeof name === 'string') req.user.name = name.trim().slice(0, 80);
        if (typeof whatsappNumber === 'string') req.user.whatsappNumber = whatsappNumber.trim().slice(0, 25);
        if (typeof registrationNumber === 'string') req.user.registrationNumber = registrationNumber.trim().toUpperCase().slice(0, 20);

        await req.user.save();
        await trackActivity({
            userId: req.user._id,
            action: 'Profile Updated',
            details: 'Student account details updated'
        });
        return res.json({
            message: 'Profile updated successfully',
            user: sanitizeUser(req.user)
        });
    } catch {
        return res.status(500).json({ error: 'Unable to update profile' });
    }
});

// PUT /api/auth/preferences
router.put('/preferences', requireAuth, async (req, res) => {
    try {
        const { batchPreference, rankingCriteria, maxTimetables } = req.body;

        const allowedBatch = ['Morning', 'Evening', 'Both', null];
        const allowedRanking = ['balanced', 'earliest_finish', 'no_morning', 'max_free_days'];

        if (batchPreference !== undefined && allowedBatch.includes(batchPreference)) {
            req.user.preferences.batchPreference = batchPreference;
        }
        if (rankingCriteria !== undefined && allowedRanking.includes(rankingCriteria)) {
            req.user.preferences.rankingCriteria = rankingCriteria;
        }
        if (typeof maxTimetables === 'number' && maxTimetables >= 1 && maxTimetables <= 60) {
            req.user.preferences.maxTimetables = Math.round(maxTimetables);
        }

        await req.user.save();
        await trackActivity({
            userId: req.user._id,
            action: 'Preferences Updated',
            details: 'Global scheduling preferences updated'
        });

        return res.json({
            message: 'Preferences updated successfully',
            user: sanitizeUser(req.user)
        });
    } catch {
        return res.status(500).json({ error: 'Unable to update preferences' });
    }
});

// PUT /api/auth/password
router.put('/password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'currentPassword and newPassword are required' });
        }
        if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
            return res.status(400).json({
                error: 'New password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
            });
        }
        if (!req.user.passwordHash || !verifyPassword(currentPassword, req.user.passwordHash)) {
            return res.status(400).json({ error: 'Current password is incorrect.' });
        }

        req.user.passwordHash = hashPassword(newPassword);
        await req.user.save();

        await trackActivity({
            userId: req.user._id,
            action: 'Password Updated',
            details: 'Password changed successfully'
        });

        clearSessionCookie(res);

        return res.json({ message: 'Password updated. Please login again.' });
    } catch {
        return res.status(500).json({ error: 'Unable to update password' });
    }
});

// GET /api/auth/dashboard/stats
router.get('/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        const generatedSchedulesCount = await GeneratedTimetable.countDocuments({ userId });
        const hoursSaved = generatedSchedulesCount * 4;

        let activeCourses = 0;
        let optimizationScore = 0;

        const latestTimetable = await GeneratedTimetable.findOne({ userId }).sort({ generatedAt: -1 });
        if (latestTimetable && latestTimetable.timetables.length > 0) {
            if (latestTimetable.timetables[0].schedule) {
                const uniqueCourses = new Set();
                const sched = latestTimetable.timetables[0].schedule;
                const slotLists = sched instanceof Map ? Array.from(sched.values()) : Object.values(sched);
                slotLists.forEach(slots => {
                    if (Array.isArray(slots)) {
                        slots.forEach(slot => {
                            if (slot && slot.courseCode) uniqueCourses.add(slot.courseCode);
                        });
                    }
                });
                activeCourses = uniqueCourses.size;
            }

            const bestTt = latestTimetable.timetables[0];
            let score = 85;
            if (bestTt.features) {
                if (bestTt.features.totalFreeDays) score += (bestTt.features.totalFreeDays * 5);
                if (bestTt.features.morningClassCount === 0) score += 5;
            }
            if (score > 100) score = 100;
            optimizationScore = Math.round(score);
        }

        res.json({
            generatedSchedules: generatedSchedulesCount,
            hoursSaved,
            activeCourses,
            optimizationScore
        });
    } catch {
        res.status(500).json({ error: 'Unable to fetch dashboard stats' });
    }
});

// GET /api/auth/dashboard/activity
router.get('/dashboard/activity', requireAuth, async (req, res) => {
    try {
        const activityLogs = await ActivityLog.find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .limit(5);

        const formattedLogs = activityLogs.map(log => ({
            title: log.action,
            desc: log.details,
            time: log.timestamp,
            type: log.action.includes('Schedule') ? 'calendar' :
                log.action.includes('Preference') ? 'settings' :
                    log.action.includes('Course') ? 'book' : 'default'
        }));

        res.json(formattedLogs);
    } catch {
        res.status(500).json({ error: 'Unable to fetch activity logs' });
    }
});

module.exports = router;
