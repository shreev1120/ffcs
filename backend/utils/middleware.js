const crypto = require('crypto');
const User = require('../models/User');
const { verifySessionToken } = require('./auth');

const SESSION_COOKIE = 'ffcs_session';

/**
 * Safely extract session token from HTTP-only cookie or Bearer Authorization header
 */
function extractToken(req) {
    if (req.cookies && req.cookies[SESSION_COOKIE]) {
        return req.cookies[SESSION_COOKIE];
    }
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }
    return null;
}

/**
 * Require valid authenticated student session
 * Blocks unauthenticated access and attaches req.user (Items 4, 5, 6, 49)
 */
async function requireAuth(req, res, next) {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ error: 'Authentication required. Please sign in.' });
        }

        const decoded = verifySessionToken(token);
        if (!decoded || !decoded.id) {
            res.clearCookie(SESSION_COOKIE, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            return res.status(401).json({ error: 'Session expired. Please sign in again.' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            res.clearCookie(SESSION_COOKIE, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            return res.status(401).json({ error: 'User account not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Optional authentication: attaches req.user if session exists, but doesn't block unauthenticated guests
 */
async function optionalAuth(req, res, next) {
    try {
        const token = extractToken(req);
        if (token) {
            const decoded = verifySessionToken(token);
            if (decoded && decoded.id) {
                const user = await User.findById(decoded.id);
                if (user) {
                    req.user = user;
                }
            }
        }
        next();
    } catch {
        next();
    }
}

/**
 * Role-Based Access Control (RBAC) middleware (Items 5, 9)
 */
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
        }
        next();
    };
}

/**
 * Webhook signature verification middleware (Items 9, 31, 59)
 * Uses constant-time comparison to prevent timing attacks
 */
function verifyWebhookSecret(req, res, next) {
    const configuredSecret = process.env.WEBHOOK_SECRET || 'vit-ffcs-webhook-phase2-secure-token';
    const providedSecret = req.headers['x-webhook-secret'] ||
        (req.headers.authorization && typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
            ? req.headers.authorization.slice(7).trim()
            : null);

    if (!providedSecret) {
        return res.status(401).json({ error: 'Webhook access denied: missing X-Webhook-Secret.' });
    }

    try {
        const providedBuf = Buffer.from(String(providedSecret));
        const configuredBuf = Buffer.from(String(configuredSecret));

        if (providedBuf.length !== configuredBuf.length || !crypto.timingSafeEqual(providedBuf, configuredBuf)) {
            return res.status(403).json({ error: 'Webhook access denied: invalid secret signature.' });
        }
    } catch {
        return res.status(403).json({ error: 'Webhook access denied: invalid secret verification.' });
    }

    next();
}

module.exports = {
    requireAuth,
    optionalAuth,
    requireRole,
    verifyWebhookSecret,
    SESSION_COOKIE
};
