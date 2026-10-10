/**
 * Input sanitization middleware for defense against NoSQL injection ($gt, $ne, $where),
 * prototype pollution (__proto__, constructor), and malicious payload structures.
 */

function sanitizeValue(value) {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === 'string') {
        // Strip null bytes and normalize
        return value.replace(/\0/g, '').trim();
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (typeof value === 'object') {
        const cleanObj = {};
        for (const key of Object.keys(value)) {
            // Block prototype pollution
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            // Block MongoDB query operator injection (keys starting with '$' or containing '.')
            if (key.startsWith('$') || key.includes('.')) {
                continue;
            }
            cleanObj[key] = sanitizeValue(value[key]);
        }
        return cleanObj;
    }

    return value;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
function mongoSanitize(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeValue(req.query);
    }
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeValue(req.params);
    }
    next();
}

module.exports = {
    sanitizeValue,
    mongoSanitize
};
