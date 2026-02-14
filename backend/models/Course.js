const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    courseName: {
        type: String,
        required: true,
        trim: true
    },
    credits: {
        type: Number,
        required: true,
        min: 0
    },
    courseType: {
        type: String,
        enum: ['Theory', 'Lab', 'Project', 'Embedded Theory', 'Embedded Lab', 'Soft Skill'],
        required: true
    },
    slot: {
        type: String,
        required: true,
        trim: true
    },
    faculty: {
        type: String,
        trim: true
    },
    venue: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    registrationType: {
        type: String,
        trim: true
    },
    slNo: {
        type: Number
    },
    batchType: {
        type: String,
        enum: ['Morning', 'Evening', 'Both'],
        required: true
    },
    // For tracking which semester config this belongs to
    semesterConfigId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SemesterConfig'
    }
});

// Compound index for efficient queries
courseSchema.index({ courseCode: 1, slot: 1 });

module.exports = mongoose.model('Course', courseSchema);
