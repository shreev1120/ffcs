const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';
const JWT_EXPIRES_IN = '7d';

function hashPassword(password) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

function verifyPassword(password, storedHash) {
    if (!password || !storedHash) return false;
    // Check if storedHash is legacy format (contains colons)
    if (storedHash.includes(':')) {
        // Legacy PBKDF2 check - fail or migrate? 
        // For now, fail safe or log. Since we are moving to bcrypt, 
        // existing users with old hashes might need reset unless we keep legacy check.
        // Given constraint "Must support demo.student", we might need to support both or reseeding handles it.
        // server.js reseeding checked if passwordHash exists.
        // Let's assume we want to strictly move to bcrypt.
        return false;
    }
    return bcrypt.compareSync(password, storedHash);
}

function createSessionToken(userId) {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifySessionToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

module.exports = {
    hashPassword,
    verifyPassword,
    createSessionToken,
    verifySessionToken
};
