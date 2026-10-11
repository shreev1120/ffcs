const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['Signed Up', 'Logged In', 'Schedule Generated', 'Preferences Updated', 'Course Added', 'Profile Updated', 'Password Updated', 'Logged Out', 'Timetable Option Deleted', 'All Timetables Cleared']
    },
    details: {
        type: String,
        trim: true
    },
    metadata: {
        type: Map,
        of: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient retrieval of recent activities
activityLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
