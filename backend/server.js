require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const { mongoSanitize } = require('./utils/sanitize');

// Import routes
const timetableRoutes = require('./routes/timetable');
const webhookRoutes = require('./routes/webhook');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ffcs-agent';

// Disable fingerprinting header (Item 10 & 29)
app.disable('x-powered-by');

// Enable trust proxy for reverse proxy setups (Nginx, Render, AWS, Heroku)
app.enable('trust proxy');

// 1. HTTP Security Headers with Helmet (Item 19, 20, 46)
const allowedConnectOrigins = [
    "'self'",
    "https://*.onrender.com",
    "https://*.vercel.app",
    "https://*.netlify.app",
    process.env.RENDER_EXTERNAL_URL,
    process.env.FRONTEND_URL,
    "http://127.0.0.1:5000",
    "http://localhost:5000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
].filter(Boolean);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://*.onrender.com"],
            connectSrc: allowedConnectOrigins
        }
    },
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'sameorigin' }
}));

// Additional custom transport headers
app.use((req, res, next) => {
    // In production behind reverse proxies, redirect HTTP traffic to HTTPS (Item 4)
    if (process.env.NODE_ENV === 'production') {
        // Exclude health check endpoints so cloud load balancers and Render health checks succeed without redirect
        if (req.path === '/health' || req.path === '/api/health') {
            return next();
        }
        const proto = req.headers['x-forwarded-proto'];
        if (proto && proto !== 'https') {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
    }

    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');
    next();
});

// 2. Strict CORS Configuration (Item 27: Permissive CORS)
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow mobile or server-side non-browser requests with no origin
        if (!origin) return callback(null, true);
        try {
            const hostname = new URL(origin).hostname;
            if (
                allowedOrigins.includes(origin) ||
                hostname === 'localhost' ||
                hostname === '127.0.0.1' ||
                hostname.endsWith('.onrender.com') ||
                hostname.endsWith('.vercel.app') ||
                hostname.endsWith('.netlify.app')
            ) {
                return callback(null, true);
            }
        } catch {
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
        }
        return callback(null, false);
    },
    credentials: true,
    exposedHeaders: ['set-cookie', 'x-ratelimit-remaining']
}));

// 3. Body Parsing & NoSQL Injection Defense (Item 16, 18, 51)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(mongoSanitize);

// 4. Rate Limiting & Throttling (Item 28: Rate limits & Item 58: Race conditions)
const rateLimitMap = new Map();
const createRateLimiter = (options = { windowMs: 60 * 1000, max: 60, message: 'Too many requests' }) => {
    return (req, res, next) => {
        // Skip rate limiting in automated test runs
        if (process.env.NODE_ENV === 'test') return next();

        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const clientRecord = rateLimitMap.get(ip) || { count: 0, resetTime: now + options.windowMs };

        if (now > clientRecord.resetTime) {
            clientRecord.count = 0;
            clientRecord.resetTime = now + options.windowMs;
        }

        clientRecord.count += 1;
        rateLimitMap.set(ip, clientRecord);

        res.setHeader('X-RateLimit-Limit', options.max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - clientRecord.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(clientRecord.resetTime / 1000));

        if (clientRecord.count > options.max) {
            res.setHeader('Retry-After', Math.ceil((clientRecord.resetTime - now) / 1000));
            return res.status(429).json({
                error: {
                    message: options.message,
                    status: 429
                }
            });
        }
        next();
    };
};

// Specialized limiters for sensitive actions
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

const uploadLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 20,
    message: 'Timetable generation request limit reached. Please wait a few minutes before submitting another file.'
});

const generalApiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 200,
    message: 'API rate limit exceeded. Please throttle your requests.'
});

// Ensure sanitized uploads directory exists
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// MongoDB Connection with graceful fallback
const connectDB = async () => {
    if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ WARNING: MONGODB_URI environment variable is not configured in Render.');
        console.warn('👉 Web service will run in stateless mode to serve frontend and public endpoints.');
        console.warn('👉 To enable database features (auth, saved schedules), configure MONGODB_URI in your Render Dashboard.');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.warn('⚠️ Server will remain running to serve frontend and static assets.');
        console.warn('👉 If using MongoDB Atlas, make sure Network Access allows connections from 0.0.0.0/0.');
    }
};

connectDB();

// Safe health check (Item 10 & 65: No sensitive info leakage)
const handleHealth = (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
};
app.get('/health', handleHealth);
app.get('/api/health', handleHealth);

// Database availability middleware for routes requiring MongoDB
const requireDbConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            error: {
                message: 'Database is currently offline or connecting. If deploying on Render, please configure the MONGODB_URI environment variable (MongoDB Atlas) and whitelist 0.0.0.0/0 in Atlas Network Access.',
                status: 503
            }
        });
    }
    next();
};

// General rate limiter on all API endpoints
app.use('/api', generalApiLimiter);

// Protected & Rate-limited API Routes
app.use('/api/timetable/upload-excel', requireDbConnection, uploadLimiter);
app.use('/api/timetable/generate', uploadLimiter);
app.use('/api/timetable', timetableRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/auth', requireDbConnection, authLimiter, authRoutes);
app.use('/api', authRoutes);

// Serve static frontend in production
const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));

    app.get('*', (req, res, next) => {
        if (!req.path.startsWith('/api/')) {
            return res.sendFile(path.join(clientBuildPath, 'index.html'));
        }
        next();
    });
} else {
    // Helpful guidance page if frontend build has not been generated yet
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        res.status(503).type('html').send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>VIT FFCS Agent - Build Notice</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                    .card { max-width: 520px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); text-align: center; }
                    h1 { font-size: 20px; color: #38bdf8; margin-bottom: 12px; }
                    p { font-size: 14px; color: #94a3b8; line-height: 1.6; }
                    code { background: #0f172a; color: #38bdf8; padding: 3px 6px; border-radius: 4px; font-size: 13px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>🚀 VIT FFCS Agent Web Service</h1>
                    <p>The backend server is active on Render, but the frontend production bundle was not found at <code>frontend/dist</code>.</p>
                    <p>Please ensure your Render <strong>Build Command</strong> is set to:<br><code>npm run build</code></p>
                </div>
            </body>
            </html>
        `);
    });
}

// 404 handler for API routes
app.use((req, res, next) => {
    res.status(404).json({
        error: {
            message: 'Resource not found',
            status: 404
        }
    });
});

// Centralized error handling (Item 12: Verbose prod errors)
app.use((err, req, res, next) => {
    const isProd = process.env.NODE_ENV === 'production';
    const status = err.status || 500;

    if (status >= 500) {
        console.error('Internal Error:', err.message);
    }

    res.status(status).json({
        error: {
            message: isProd && status >= 500
                ? 'An internal error occurred. Please try again later.'
                : (err.message || 'Internal Server Error'),
            status
        }
    });
});

// Start server listening on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏳ Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

module.exports = app;
