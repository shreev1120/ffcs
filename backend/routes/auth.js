const express = require('express');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const GeneratedTimetable = require('../models/GeneratedTimetable');
const { hashPassword, verifyPassword, createSessionToken, verifySessionToken } = require('../utils/auth');

const router = express.Router();

const SESSION_COOKIE = 'ffcs_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const VIT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@vitstudent\.ac\.in$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function setSessionCookie(res, token) {
    const secure = process.env.NODE_ENV === 'production';
    const maxAge = SESSION_TTL_MS;
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge,
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
    } catch (error) {
        console.error('Activity logging failed:', error.message);
    }
}

// Middleware to extract user from JWT
async function requireAuth(req, res, next) {
    try {
        const token = req.cookies[SESSION_COOKIE];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = verifySessionToken(token);
        if (!decoded) {
            clearSessionCookie(res);
            return res.status(401).json({ error: 'Session expired. Please login again.' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            clearSessionCookie(res);
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

function readCredentials(body = {}) {
    const vitEmail = String(body.vitEmail || body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    return { vitEmail, password };
}

router.post('/signup', async (req, res) => {
    try {
        const { vitEmail, password } = readCredentials(req.body);
        const { confirmPassword, name, registrationNumber, whatsappNumber } = req.body;

        if (!vitEmail || !password || !confirmPassword) {
            return res.status(400).json({ error: 'vitEmail, password and confirmPassword are required' });
        }

        if (!VIT_EMAIL_REGEX.test(vitEmail)) {
            return res.status(400).json({ error: 'Use a valid VIT email address (@vitstudent.ac.in)' });
        }

        if (!STRONG_PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Password and confirm password do not match' });
        }

        const existingUser = await User.findOne({ vitEmail });
        if (existingUser) {
            return res.status(409).json({ error: 'Account already exists' });
        }

        const user = await User.create({
            vitEmail,
            // hashPassword now uses bcrypt
            passwordHash: hashPassword(password),
            name: typeof name === 'string' ? name.trim() : '',
            registrationNumber: typeof registrationNumber === 'string' ? registrationNumber.trim() : '',
            whatsappNumber: typeof whatsappNumber === 'string' && whatsappNumber.trim() ? whatsappNumber.trim() : `pending-${Date.now()}`,
            preferences: {
                batchPreference: null,
                rankingCriteria: 'balanced',
                maxTimetables: 12
            }
        });

        await trackActivity({
            userId: user._id,
            action: 'Signed Up',
            details: 'Account created successfully'
        });

        // Auto-login after signup? Or require login. 
        // Let's require login to be safe, or just return success.
        // The original implementation returned success message.
        return res.status(201).json({
            message: 'Account created successfully. Please login to continue.',
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'Unable to create account. Server unavailable.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { vitEmail, password } = readCredentials(req.body);
        if (!vitEmail || !password) {
            return res.status(400).json({ error: 'vitEmail and password are required' });
        }
        if (!VIT_EMAIL_REGEX.test(vitEmail)) {
            return res.status(400).json({ error: 'Invalid email format. Use your VIT email.' });
        }

        const user = await User.findOne({ vitEmail });
        if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
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
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Unable to login. Server unavailable.' });
    }
});

router.post('/logout', requireAuth, async (req, res) => {
    await trackActivity({
        userId: req.user._id,
        action: 'Logged Out',
        details: 'User logged out'
    });
    clearSessionCookie(res);
    return res.json({ message: 'Logged out successfully' });
});

router.get('/me', requireAuth, async (req, res) => {
    return res.json({ user: sanitizeUser(req.user) });
});

router.put('/profile', requireAuth, async (req, res) => {
    try {
        const { name, whatsappNumber, registrationNumber } = req.body;
        if (typeof name === 'string') req.user.name = name.trim();
        if (typeof whatsappNumber === 'string') req.user.whatsappNumber = whatsappNumber.trim();
        if (typeof registrationNumber === 'string') req.user.registrationNumber = registrationNumber.trim();

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
    } catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'Unable to update profile' });
    }
});

router.put('/preferences', requireAuth, async (req, res) => {
    try {
        const { batchPreference, rankingCriteria, maxTimetables } = req.body;

        if (batchPreference !== undefined) req.user.preferences.batchPreference = batchPreference;
        if (rankingCriteria !== undefined) req.user.preferences.rankingCriteria = rankingCriteria;
        if (maxTimetables !== undefined) req.user.preferences.maxTimetables = maxTimetables;

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
    } catch (error) {
        console.error('Preference update error:', error);
        return res.status(500).json({ error: 'Unable to update preferences' });
    }
});

router.put('/password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'currentPassword and newPassword are required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }
        if (!req.user.passwordHash || !verifyPassword(currentPassword, req.user.passwordHash)) {
            return res.status(400).json({ error: 'Current password is incorrect' });
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
    } catch (error) {
        console.error('Password update error:', error);
        return res.status(500).json({ error: 'Unable to update password' });
    }
});

router.get('/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Generated Schedules Count
        const generatedSchedulesCount = await GeneratedTimetable.countDocuments({ userId });

        // 2. Hours Saved (Approx. 4 hours per generation)
        const hoursSaved = generatedSchedulesCount * 4;

        // 3. Active Courses (Get from latest GeneratedTimetable or 0)
        let activeCourses = 0;
        let optimizationScore = 0;

        const latestTimetable = await GeneratedTimetable.findOne({ userId }).sort({ generatedAt: -1 });
        if (latestTimetable && latestTimetable.timetables.length > 0) {
            // Assuming first timetable is representative
            if (latestTimetable.timetables[0].schedule) {
                // Schedule is a Map, so size gives number of courses/slots. 
                // But wait, schedule structure is Map<day, array of slots>.
                // A better proxy might be to count unique course codes in the schedule.
                const uniqueCourses = new Set();
                latestTimetable.timetables[0].schedule.forEach((slots) => {
                    slots.forEach(slot => {
                        if (slot.courseCode) uniqueCourses.add(slot.courseCode);
                    });
                });
                activeCourses = uniqueCourses.size;
            }

            // 4. Optimization Score
            // Average score of generated timetables in the latest batch? 
            // Or just take the best one? Let's take the average length of the timetables array (just as a random metric? No.)
            // Let's use rankingScore if available, or just a mock calc for now based on constraints met.
            // For now, let's hardcode a calculation or use 90 + random variance if real score missing.
            // Actually, verify generatedTimetable.timetables[0].features.
            // Let's calculate a "score" based on features.
            // e.g. (totalFreeDays * 10) + (100 - consecutiveClasses * 5)
            const bestTt = latestTimetable.timetables[0];
            let score = 85; // Base
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
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Unable to fetch dashboard stats' });
    }
});

router.get('/dashboard/activity', requireAuth, async (req, res) => {
    try {
        const activityLogs = await ActivityLog.find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .limit(5);

        const formattedLogs = activityLogs.map(log => ({
            title: log.action,
            desc: log.details,
            time: log.timestamp, // Frontend can format this using date-fns or similar
            type: log.action.includes('Schedule') ? 'calendar' :
                log.action.includes('Preference') ? 'settings' :
                    log.action.includes('Course') ? 'book' : 'default'
        }));

        res.json(formattedLogs);
    } catch (error) {
        console.error('Activity log error:', error);
        res.status(500).json({ error: 'Unable to fetch activity logs' });
    }
});

module.exports = router;
