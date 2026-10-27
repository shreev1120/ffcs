const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const crypto = require('crypto');

// Item 3 & 26: Strong JWT Secret validation - prevent weak or default secrets in production
const FALLBACK_DEV_SECRET = 'ffcs_agent_secure_local_development_jwt_secret_key_2026_9941a8';
let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === FALLBACK_DEV_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ WARNING: JWT_SECRET environment variable is not set in production.');
        console.warn('⚠️ Generating an ephemeral 256-bit cryptographic key for this instance.');
        console.warn('👉 To keep login sessions persistent across redeploys, configure JWT_SECRET in your Render dashboard.');
        JWT_SECRET = crypto.randomBytes(32).toString('hex');
    } else {
        JWT_SECRET = FALLBACK_DEV_SECRET;
    }
}

const JWT_EXPIRES_IN = '7d';

/**
 * Hash password securely with bcrypt salt
 * @param {string} password 
 * @returns {string} bcrypt hash
 */
function hashPassword(password) {
    if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
    }
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

/**
 * Verify password against stored bcrypt hash
 * @param {string} password 
 * @param {string} storedHash 
 * @returns {boolean}
 */
function verifyPassword(password, storedHash) {
    if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
        return false;
    }
    // Reject legacy colon-separated hashes or malformed hashes cleanly
    if (storedHash.includes(':') || !storedHash.startsWith('$2')) {
        return false;
    }
    try {
        return bcrypt.compareSync(password, storedHash);
    } catch {
        return false;
    }
}

/**
 * Create signed JWT session token
 * @param {string} userId 
 * @returns {string} JWT token
 */
function createSessionToken(userId) {
    if (!userId) throw new Error('User ID required for session token creation');
    return jwt.sign({ id: String(userId) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode JWT session token
 * @param {string} token 
 * @returns {object|null} Decoded payload or null
 */
function verifySessionToken(token) {
    if (!token || typeof token !== 'string') return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

module.exports = {
    hashPassword,
    verifyPassword,
    createSessionToken,
    verifySessionToken
};
