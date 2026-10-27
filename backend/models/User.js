const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    vitEmail: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@vitstudent\.ac\.in$/, 'Please provide a valid VIT email address']
    },
    whatsappNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    registrationNumber: {
        type: String,
        trim: true
    },
    passwordHash: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    preferences: {
        batchPreference: {
            type: String,
            enum: ['Morning', 'Evening', 'Both'],
            default: null
        },
        rankingCriteria: {
            type: String,
            enum: ['earliest_finish', 'no_morning', 'max_free_days', 'balanced'],
            default: 'balanced'
        },
        maxTimetables: {
            type: Number,
            default: 50,
            min: 1,
            max: 150
        }
    },
    conversationState: {
        type: String,
        enum: ['IDLE', 'ASK_EMAIL', 'ASK_EXCEL', 'ASK_PREFERENCES', 'GENERATING', 'SUCCESS'],
        default: 'IDLE'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastInteraction: {
        type: Date,
        default: Date.now
    }
});

// Update last interaction timestamp on save
userSchema.pre('save', function (next) {
    this.lastInteraction = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema);
