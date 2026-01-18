const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import models
const User = require('../models/User');
const SemesterConfig = require('../models/SemesterConfig');
const GeneratedTimetable = require('../models/GeneratedTimetable');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'ffcs-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
    }
});

/**
 * POST /api/timetable/upload-excel
 * Upload and parse Excel file containing course data
 */
router.post('/upload-excel', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { userId, semester, academicYear } = req.body;

        if (!userId) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'userId is required' });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'User not found' });
        }

        // Create semester config
        const semesterConfig = new SemesterConfig({
            userId,
            semester: semester || 'Fall 2024',
            academicYear: academicYear || '2024-2025',
            excelFilePath: req.file.path,
            status: 'pending'
        });

        await semesterConfig.save();

        // Parse Excel file
        const excelParser = require('../services/excelParser');
        const Course = require('../models/Course');

        const parsedCourses = await excelParser.parseExcelFile(req.file.path);
        const validation = excelParser.validateCourses(parsedCourses);

        if (!validation.isValid) {
            fs.unlinkSync(req.file.path);
            await SemesterConfig.findByIdAndDelete(semesterConfig._id);
            return res.status(400).json({
                error: 'Invalid course data',
                details: validation.errors
            });
        }

        // Save courses
        const savedCourses = [];
        for (const courseData of parsedCourses) {
            const course = new Course({
                ...courseData,
                semesterConfigId: semesterConfig._id
            });
            await course.save();
            savedCourses.push(course._id);
        }

        semesterConfig.courses = savedCourses;
        semesterConfig.status = 'completed';
        await semesterConfig.save();

        const stats = excelParser.getCourseStatistics(parsedCourses);

        res.json({
            message: 'File uploaded and parsed successfully',
            semesterConfigId: semesterConfig._id,
            fileName: req.file.originalname,
            coursesFound: parsedCourses.length,
            statistics: stats,
            validation: { warnings: validation.warnings }
        });

    } catch (error) {
        console.error('Upload error:', error);

        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/timetable/generate
 * Generate timetables based on semester config and preferences
 */
router.post('/generate', async (req, res) => {
    try {
        const { semesterConfigId, preferences } = req.body;

        if (!semesterConfigId) {
            return res.status(400).json({ error: 'semesterConfigId is required' });
        }

        const semesterConfig = await SemesterConfig.findById(semesterConfigId).populate('courses');

        if (!semesterConfig) {
            return res.status(404).json({ error: 'Semester configuration not found' });
        }

        // Update preferences if provided
        if (preferences) {
            semesterConfig.preferences = { ...semesterConfig.preferences, ...preferences };
            semesterConfig.status = 'processing';
            await semesterConfig.save();
        }

        // Generate timetables
        const timetableGenerator = require('../services/timetableGenerator');

        const coursesData = semesterConfig.courses.map(c => ({
            courseCode: c.courseCode,
            courseName: c.courseName,
            credits: c.credits,
            courseType: c.courseType,
            slot: c.slot,
            faculty: c.faculty,
            venue: c.venue,
            batchType: c.batchType
        }));

        const timetables = timetableGenerator.generateWithMetadata(
            coursesData,
            semesterConfig.preferences
        );

        if (timetables.length === 0) {
            return res.status(400).json({
                error: 'No valid timetables could be generated',
                message: 'Check for slot clashes or batch preference restrictions'
            });
        }

        const generatedTimetable = new GeneratedTimetable({
            semesterConfigId: semesterConfig._id,
            userId: semesterConfig.userId,
            timetables: timetables.map((tt, index) => ({
                timetableId: tt.timetableId,
                schedule: tt.schedule,
                features: tt.features,
                rank: index + 1,
                rankingScore: 0
            }))
        });

        await generatedTimetable.save();
        semesterConfig.status = 'completed';
        await semesterConfig.save();

        res.json({
            message: 'Timetables generated successfully',
            semesterConfigId: semesterConfig._id,
            generatedTimetableId: generatedTimetable._id,
            timetablesCount: timetables.length,
            timetables: timetables.slice(0, semesterConfig.preferences.maxTimetables)
        });

    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/timetable/:userId
 * Get all generated timetables for a user
 */
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const timetables = await GeneratedTimetable.find({ userId })
            .populate('semesterConfigId')
            .sort({ generatedAt: -1 })
            .limit(10);

        res.json({
            count: timetables.length,
            timetables
        });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/timetable/config/:semesterConfigId
 * Get semester configuration details
 */
router.get('/config/:semesterConfigId', async (req, res) => {
    try {
        const { semesterConfigId } = req.params;

        const config = await SemesterConfig.findById(semesterConfigId)
            .populate('userId')
            .populate('courses');

        if (!config) {
            return res.status(404).json({ error: 'Configuration not found' });
        }

        res.json(config);

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/timetable/config/:semesterConfigId
 * Delete a semester configuration and associated data
 */
router.delete('/config/:semesterConfigId', async (req, res) => {
    try {
        const { semesterConfigId } = req.params;

        const config = await SemesterConfig.findById(semesterConfigId);

        if (!config) {
            return res.status(404).json({ error: 'Configuration not found' });
        }

        // Delete associated file
        if (config.excelFilePath && fs.existsSync(config.excelFilePath)) {
            fs.unlinkSync(config.excelFilePath);
        }

        // Delete generated timetables
        await GeneratedTimetable.deleteMany({ semesterConfigId });

        // Delete config
        await SemesterConfig.findByIdAndDelete(semesterConfigId);

        res.json({ message: 'Configuration deleted successfully' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
