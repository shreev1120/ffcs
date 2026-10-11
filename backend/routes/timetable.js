const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const SemesterConfig = require('../models/SemesterConfig');
const GeneratedTimetable = require('../models/GeneratedTimetable');
const Course = require('../models/Course');
const ActivityLog = require('../models/ActivityLog');
const { requireAuth, optionalAuth } = require('../utils/middleware');

// Upload directory resolution (Path traversal prevention - Item 22)
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

function isSafeUploadPath(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') return false;
    const resolvedTarget = path.resolve(targetPath);
    return resolvedTarget.startsWith(uploadDir);
}

function safeUnlink(filePath) {
    try {
        if (filePath && isSafeUploadPath(filePath) && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error('File cleanup error:', err);
    }
}

// Configure multer for file uploads with strict extension, size & sanitized random naming (Items 21, 22)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ['.xlsx', '.xls'].includes(ext) ? ext : '.xlsx';
        const randomId = crypto.randomBytes(8).toString('hex');
        cb(null, `ffcs-${Date.now()}-${randomId}${safeExt}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExts = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream',
        'application/zip'
    ];

    if (allowedExts.includes(ext) && (allowedMimes.includes(file.mimetype) || !file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760 // 10MB default
    }
});

/**
 * Resolve authenticated user ID with dev fallback
 */
async function resolveUserId(req) {
    if (req.user && req.user._id) {
        return req.user._id;
    }
    if (req.body && req.body.userId && mongoose.Types.ObjectId.isValid(req.body.userId)) {
        const existing = await User.findById(req.body.userId);
        if (existing) return existing._id;
    }
    return null;
}

/**
 * POST /api/timetable/upload-excel
 * Upload and parse Excel file containing course data (Items 5, 6, 21, 22, 33)
 */
router.post('/upload-excel', optionalAuth, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No Excel file uploaded' });
        }

        // Validate resolved path
        if (!isSafeUploadPath(req.file.path)) {
            safeUnlink(req.file.path);
            return res.status(400).json({ error: 'Illegal upload destination path' });
        }

        const userId = await resolveUserId(req);
        if (!userId) {
            safeUnlink(req.file.path);
            return res.status(401).json({ error: 'Authentication required. Please sign in.' });
        }

        // Verify user exists in database
        const user = await User.findById(userId);
        if (!user) {
            safeUnlink(req.file.path);
            return res.status(404).json({ error: 'User account not found' });
        }

        const semester = typeof req.body.semester === 'string' && req.body.semester.trim() ? req.body.semester.slice(0, 50) : 'Fall Semester';
        const academicYear = typeof req.body.academicYear === 'string' && req.body.academicYear.trim() ? req.body.academicYear.slice(0, 20) : 'Current';

        // Create semester config
        const semesterConfig = new SemesterConfig({
            userId,
            semester,
            academicYear,
            excelFilePath: req.file.path,
            status: 'pending'
        });

        await semesterConfig.save();

        // Parse Excel file
        const excelParser = require('../services/excelParser');
        const parsedCourses = await excelParser.parseExcelFile(req.file.path);
        const validation = excelParser.validateCourses(parsedCourses);

        if (!validation.isValid) {
            safeUnlink(req.file.path);
            await SemesterConfig.findByIdAndDelete(semesterConfig._id);
            return res.status(400).json({
                error: 'Invalid course data in Excel file',
                details: validation.errors
            });
        }

        // Save courses with semesterConfigId
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
            fileName: path.basename(req.file.originalname),
            coursesFound: parsedCourses.length,
            courses: parsedCourses,
            statistics: stats,
            validation: { warnings: validation.warnings }
        });

    } catch (error) {
        console.error('Upload error:', error);
        if (req.file && req.file.path) {
            safeUnlink(req.file.path);
        }
        res.status(500).json({ error: 'Failed to process course registration Excel file' });
    }
});

/**
 * POST /api/timetable/generate
 * Generate conflict-free timetables based on semester config or direct courses list (Items 5, 6, 16, 33, 49)
 */
router.post('/generate', optionalAuth, async (req, res) => {
    try {
        const { semesterConfigId, courses: directCourses, preferences } = req.body;
        const userId = await resolveUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required. Please sign in.' });
        }

        let coursesData = [];
        let semesterConfig = null;

        if (semesterConfigId) {
            if (!mongoose.Types.ObjectId.isValid(semesterConfigId)) {
                return res.status(400).json({ error: 'Invalid semester configuration ID' });
            }

            semesterConfig = await SemesterConfig.findById(semesterConfigId).populate('courses');
            if (!semesterConfig) {
                return res.status(404).json({ error: 'Semester configuration not found' });
            }

            // Tenant isolation & IDOR check (Items 5, 6, 33, 49)
            const isOwner = semesterConfig.userId.toString() === userId.toString();
            const isAdmin = req.user && req.user.role === 'admin';
            if (!isOwner && !isAdmin) {
                return res.status(403).json({ error: 'Access denied: You do not own this semester configuration' });
            }

            if (preferences) {
                semesterConfig.preferences = { ...semesterConfig.preferences, ...preferences };
            }

            coursesData = semesterConfig.courses.map(c => ({
                courseCode: c.courseCode,
                courseName: c.courseName,
                credits: c.credits,
                courseType: c.courseType,
                slot: c.slot,
                faculty: c.faculty,
                venue: c.venue,
                category: c.category,
                registrationType: c.registrationType,
                slNo: c.slNo,
                batchType: c.batchType
            }));
        } else if (Array.isArray(directCourses) && directCourses.length > 0) {
            // Direct courses submission (e.g. from frontend state)
            if (directCourses.length > 60) {
                return res.status(400).json({ error: 'Too many courses submitted. Maximum is 60.' });
            }

            coursesData = directCourses.map((c, idx) => ({
                courseCode: String(c.code || c.courseCode || `C${idx + 1}`).trim().slice(0, 15),
                courseName: String(c.title || c.courseTitle || c.name || 'Course').trim().slice(0, 100),
                credits: Number(c.credits) || 3,
                courseType: String(c.courseType || c.type || 'Theory').slice(0, 30),
                slot: String(c.slot || (Array.isArray(c.theorySlots) && c.theorySlots.length > 0 ? c.theorySlots.join('+') : (Array.isArray(c.labSlots) && c.labSlots.length > 0 ? c.labSlots.join('+') : 'A1'))).trim(),
                faculty: String(c.faculty || 'Faculty').slice(0, 80),
                venue: String(c.venue || 'TBD').slice(0, 40),
                category: String(c.category || 'PC').slice(0, 10),
                registrationType: 'Regular',
                slNo: idx + 1,
                batchType: c.batchType || 'Regular'
            }));
        } else {
            return res.status(400).json({ error: 'semesterConfigId or valid courses array is required' });
        }

        let userPrefs = {};
        if (req.user && req.user.preferences) {
            userPrefs = req.user.preferences;
        } else if (userId) {
            const userDoc = await User.findById(userId);
            if (userDoc && userDoc.preferences) {
                userPrefs = userDoc.preferences;
            }
        }

        const effectivePreferences = {
            batchPreference: preferences?.batchPreference || semesterConfig?.preferences?.batchPreference || userPrefs.batchPreference || 'Morning',
            rankingCriteria: preferences?.rankingCriteria || semesterConfig?.preferences?.rankingCriteria || userPrefs.rankingCriteria || 'balanced',
            maxTimetables: Number(preferences?.maxTimetables || semesterConfig?.preferences?.maxTimetables || userPrefs.maxTimetables || 20),
            minCredits: preferences?.minCredits !== undefined ? Number(preferences.minCredits) : (semesterConfig?.preferences?.minCredits ?? userPrefs.minCredits ?? 18),
            maxCredits: preferences?.maxCredits !== undefined ? Number(preferences.maxCredits) : (semesterConfig?.preferences?.maxCredits ?? userPrefs.maxCredits ?? 27),
            avoidEarlyMorning: preferences?.avoidEarlyMorning ?? userPrefs.avoidEarlyMorning ?? false,
            freeDayPreferred: preferences?.freeDayPreferred || userPrefs.freeDayPreferred || null,
            preferredTheorySlots: preferences?.preferredTheorySlots || userPrefs.preferredTheorySlots || []
        };

        if (!['Morning', 'Evening', 'Both'].includes(effectivePreferences.batchPreference)) {
            effectivePreferences.batchPreference = 'Morning';
        }

        // Validate that uploaded courses have at least minCredits total across unique subjects
        const uniqueCoursesMap = new Map();
        coursesData.forEach(c => {
            const key = `${c.courseCode}::${c.courseType || 'Theory'}`;
            if (!uniqueCoursesMap.has(key)) {
                uniqueCoursesMap.set(key, Number(c.credits) || 3);
            }
        });
        const totalUniqueCourseCredits = [...uniqueCoursesMap.values()].reduce((sum, cr) => sum + cr, 0);

        if (totalUniqueCourseCredits < effectivePreferences.minCredits) {
            if (semesterConfig) {
                semesterConfig.status = 'failed';
                await semesterConfig.save();
            }
            return res.status(400).json({
                error: 'Insufficient course credits',
                message: `The total available credits for the uploaded courses is only ${totalUniqueCourseCredits}, which is below the minimum required ${effectivePreferences.minCredits} credits for VIT FFCS registration.`
            });
        }

        if (semesterConfig) {
            semesterConfig.status = 'processing';
            semesterConfig.preferences = { ...semesterConfig.preferences, ...effectivePreferences };
            await semesterConfig.save();
        }

        const timetableGenerator = require('../services/timetableGenerator');

        let timetables = timetableGenerator.generateWithMetadata(coursesData, effectivePreferences);

        if (timetables.length === 0) {
            timetables = timetableGenerator.generateWithoutClashConstraint(coursesData, effectivePreferences);
            if (timetables.length === 0) {
                if (semesterConfig) {
                    semesterConfig.status = 'failed';
                    await semesterConfig.save();
                }
                return res.status(400).json({
                    error: 'No valid timetables could be generated',
                    message: `No timetable variants could be created satisfying the ${effectivePreferences.minCredits}–${effectivePreferences.maxCredits} credit range for ${effectivePreferences.batchPreference} preference.`
                });
            }
        }

        const generatedTimetable = new GeneratedTimetable({
            semesterConfigId: semesterConfig ? semesterConfig._id : undefined,
            userId,
            timetables: timetables.map((tt, index) => ({
                timetableId: tt.timetableId,
                schedule: tt.schedule,
                features: tt.features,
                totalCredits: tt.totalCredits,
                totalCourses: tt.totalCourses,
                rank: tt.rank || (index + 1),
                rankingScore: tt.rankingScore || 0
            }))
        });

        await generatedTimetable.save();

        if (semesterConfig) {
            semesterConfig.status = 'completed';
            await semesterConfig.save();
        }

        const usedRelaxedMode = timetables.some((tt) => tt.generationMode === 'relaxed');
        const usedFallbackMode = timetables.some((tt) => tt.generationMode === 'fallback_non_clash_checked');

        // Audit logging (Item 42)
        await ActivityLog.create({
            userId,
            action: 'Schedule Generated',
            details: `${(semesterConfig && semesterConfig.semester) || 'Current Semester'} - ${timetables.length} options generated`,
            metadata: {
                semesterConfigId: semesterConfig ? semesterConfig._id.toString() : 'direct',
                generatedTimetableId: generatedTimetable._id.toString()
            }
        });

        res.json({
            message: 'Timetables generated successfully',
            semesterConfigId: semesterConfig ? semesterConfig._id : null,
            generatedTimetableId: generatedTimetable._id,
            timetablesCount: timetables.length,
            timetables: timetables,
            appliedPreferences: effectivePreferences,
            generationMode: usedFallbackMode ? 'fallback_non_clash_checked' : (usedRelaxedMode ? 'relaxed' : 'strict'),
            warning: usedFallbackMode
                ? 'Returned timetable variants without strict clash checks. Review overlaps before finalizing.'
                : (usedRelaxedMode
                    ? 'Some course groups were skipped due to unavoidable slot clashes. Showing best possible timetable options.'
                    : null)
        });

    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ error: 'Failed to generate timetable' });
    }
});

/**
 * GET /api/timetable/my/latest
 * Get latest saved timetables for the authenticated user
 */
router.get('/my/latest', requireAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        const latestGen = await GeneratedTimetable.findOne({ userId })
            .populate('semesterConfigId')
            .sort({ generatedAt: -1 });

        if (!latestGen || !latestGen.timetables || latestGen.timetables.length === 0) {
            return res.status(404).json({ message: 'No saved timetables found for this student.' });
        }

        res.json({
            count: latestGen.timetables.length,
            timetablesCount: latestGen.timetables.length,
            timetables: latestGen.timetables,
            generatedAt: latestGen.generatedAt,
            semesterConfigId: latestGen.semesterConfigId
        });
    } catch (error) {
        console.error('Fetch latest timetable error:', error);
        res.status(500).json({ error: 'Failed to retrieve saved timetables' });
    }
});

/**
 * GET /api/timetable/:userId
 * Get all generated timetables for a user (Protected against IDOR - Item 33)
 */
router.get('/:userId', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        // IDOR check: students can only fetch their own schedules
        if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: You cannot view timetables for another student' });
        }

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
        res.status(500).json({ error: 'Failed to retrieve timetables' });
    }
});

/**
 * GET /api/timetable/config/:semesterConfigId
 * Get semester configuration details (Protected against IDOR - Item 33)
 */
router.get('/config/:semesterConfigId', requireAuth, async (req, res) => {
    try {
        const { semesterConfigId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(semesterConfigId)) {
            return res.status(400).json({ error: 'Invalid configuration ID format' });
        }

        const config = await SemesterConfig.findById(semesterConfigId)
            .populate('userId', 'name vitEmail')
            .populate('courses');

        if (!config) {
            return res.status(404).json({ error: 'Configuration not found' });
        }

        const ownerId = config.userId?._id ? config.userId._id.toString() : config.userId.toString();
        if (ownerId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: You cannot view configurations belonging to another student' });
        }

        res.json(config);

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to retrieve configuration' });
    }
});

/**
 * DELETE /api/timetable/config/:semesterConfigId
 * Delete a semester configuration and associated data (IDOR and Path Traversal guarded - Items 22, 33)
 */
router.delete('/config/:semesterConfigId', requireAuth, async (req, res) => {
    try {
        const { semesterConfigId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(semesterConfigId)) {
            return res.status(400).json({ error: 'Invalid configuration ID format' });
        }

        const config = await SemesterConfig.findById(semesterConfigId);

        if (!config) {
            return res.status(404).json({ error: 'Configuration not found' });
        }

        const ownerId = config.userId?._id ? config.userId._id.toString() : config.userId.toString();
        if (ownerId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: You cannot delete configurations belonging to another student' });
        }

        // Secure file deletion with path traversal check (Item 22)
        if (config.excelFilePath) {
            safeUnlink(config.excelFilePath);
        }

        // Delete generated timetables
        await GeneratedTimetable.deleteMany({ semesterConfigId });

        // Delete config
        await SemesterConfig.findByIdAndDelete(semesterConfigId);

        res.json({ message: 'Configuration deleted successfully' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete configuration' });
    }
});

/**
 * DELETE /api/timetable/option/:timetableId
 * Delete a specific timetable combination for the authenticated user
 */
router.delete('/option/:timetableId', optionalAuth, async (req, res) => {
    try {
        const { timetableId } = req.params;
        const userId = await resolveUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required. Please sign in.' });
        }

        if (!timetableId) {
            return res.status(400).json({ error: 'Timetable ID is required' });
        }

        // Pull timetable combination from all documents belonging to this user
        const result = await GeneratedTimetable.updateMany(
            { userId, 'timetables.timetableId': timetableId },
            { $pull: { timetables: { timetableId } } }
        );

        // Also check if any GeneratedTimetable is now empty and can be cleaned up
        const emptyDocs = await GeneratedTimetable.find({ userId, timetables: { $size: 0 } });
        if (emptyDocs.length > 0) {
            await GeneratedTimetable.deleteMany({ _id: { $in: emptyDocs.map(d => d._id) } });
        }

        try {
            await ActivityLog.create({
                userId,
                action: 'Timetable Option Deleted',
                details: `Option ${timetableId} deleted by user`,
                metadata: { timetableId: String(timetableId) }
            });
        } catch (logErr) {
            console.warn('Activity log error:', logErr.message);
        }

        res.json({
            message: 'Timetable combination deleted successfully',
            timetableId
        });
    } catch (error) {
        console.error('Delete combination error:', error);
        res.status(500).json({ error: 'Failed to delete timetable combination' });
    }
});

/**
 * DELETE /api/timetable/my/all
 * Clear all generated and saved timetables for the authenticated user
 */
router.delete('/my/all', optionalAuth, async (req, res) => {
    try {
        const userId = await resolveUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required. Please sign in.' });
        }

        const deleteCount = await GeneratedTimetable.deleteMany({ userId });

        try {
            await ActivityLog.create({
                userId,
                action: 'All Timetables Cleared',
                details: `User cleared all saved schedule permutations (${deleteCount.deletedCount || 0} records removed)`,
                metadata: { count: String(deleteCount.deletedCount || 0) }
            });
        } catch (logErr) {
            console.warn('Activity log error:', logErr.message);
        }

        res.json({
            message: 'All timetable combinations cleared successfully',
            deletedCount: deleteCount.deletedCount
        });
    } catch (error) {
        console.error('Clear all schedules error:', error);
        res.status(500).json({ error: 'Failed to clear timetables' });
    }
});

module.exports = router;
