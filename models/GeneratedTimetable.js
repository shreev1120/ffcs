const mongoose = require('mongoose');

const generatedTimetableSchema = new mongoose.Schema({
    semesterConfigId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SemesterConfig',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timetables: [{
        timetableId: {
            type: String,
            required: true
        },
        schedule: {
            type: Map,
            of: [{
                courseCode: String,
                courseName: String,
                slot: String,
                faculty: String,
                venue: String,
                startTime: String,
                endTime: String
            }]
        },
        features: {
            earliestFinishTime: String,
            latestStartTime: String,
            totalFreeDays: Number,
            consecutiveClasses: Number,
            morningClassCount: Number,
            eveningClassCount: Number
        },
        aiDescription: {
            type: String,
            trim: true
        },
        rankingScore: {
            type: Number,
            default: 0
        },
        rank: {
            type: Number
        }
    }],
    selectedTimetableId: {
        type: String
    },
    pdfPath: {
        type: String,
        trim: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
generatedTimetableSchema.index({ userId: 1, generatedAt: -1 });
generatedTimetableSchema.index({ semesterConfigId: 1 });

module.exports = mongoose.model('GeneratedTimetable', generatedTimetableSchema);
