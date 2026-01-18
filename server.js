require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import routes
const timetableRoutes = require('./routes/timetable');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected successfully');

        // Seed default demo user for frontend
        const User = require('./models/User');
        const demoUserId = '65a0b1c2d3e4f5a6b7c8d9e0';
        const demoUser = await User.findById(demoUserId);

        if (!demoUser) {
            await User.create({
                _id: demoUserId,
                vitEmail: 'demo.student@vitstudent.ac.in',
                whatsappNumber: '1234567890',
                name: 'Demo Student',
                registrationNumber: '21BCE0000'
            });
            console.log('✨ Demo user created for frontend');
        }
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// API Routes
app.use('/api/timetable', timetableRoutes);
app.use('/api/webhook', webhookRoutes);

// Serve static files from the React app
const clientBuildPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));

    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(clientBuildPath, 'index.html'));
        }
    });
}


// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            status: 404
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Upload directory: ${uploadDir}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏳ Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

module.exports = app;
