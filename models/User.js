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
