const mongoose = require('mongoose');

const semesterConfigSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    semester: {
        type: String,
        required: true,
        trim: true
    },
    academicYear: {
        type: String,
        required: true,
        trim: true
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    preferences: {
        batchPreference: {
            type: String,
            enum: ['Morning', 'Evening', 'Both'],
            default: 'Both'
        },
        rankingCriteria: {
            type: String,
            enum: ['earliest_finish', 'no_morning', 'max_free_days', 'balanced'],
            default: 'balanced'
        },
        maxTimetables: {
            type: Number,
            default: 5,
            min: 1,
            max: 20
        }
    },
    excelFilePath: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
semesterConfigSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for efficient user queries
semesterConfigSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SemesterConfig', semesterConfigSchema);
