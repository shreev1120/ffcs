const xlsx = require('xlsx');
const path = require('path');
const { getSlotBatch } = require('../utils/slotMapping');

/**
 * Parse VIT FFCS Excel file
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<array>} Array of parsed course objects
 */
async function parseExcelFile(filePath) {
    try {
        // Read the Excel file
        const workbook = xlsx.readFile(filePath);

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rawData = xlsx.utils.sheet_to_json(worksheet);

        if (!rawData || rawData.length === 0) {
            throw new Error('Excel file is empty or invalid');
        }

        // Parse and structure the data
        const courses = rawData.map((row, index) => {
            return parseCourseRow(row, index);
        }).filter(course => course !== null);

        return courses;

    } catch (error) {
        console.error('Excel parsing error:', error);
        throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
}

/**
 * Parse a single course row from Excel
 * @param {object} row - Raw row data from Excel
 * @param {number} index - Row index for error reporting
 * @returns {object|null} Parsed course object or null if invalid
 */
function parseCourseRow(row, index) {
    try {
        // Common column name variations in VIT FFCS exports
        const courseCode = row['Course Code'] || row['COURSE CODE'] || row['Code'] || row['code'];
        const courseName = row['Course Title'] || row['COURSE TITLE'] || row['Title'] || row['title'] || row['Course Name'];
        const credits = row['Credits'] || row['CREDITS'] || row['L-T-P-J-C'] || row['Credit'];
        const slot = row['Slot'] || row['SLOT'] || row['slot'];
        const faculty = row['Faculty'] || row['FACULTY'] || row['faculty'] || row['Faculty Name'];
        const venue = row['Venue'] || row['VENUE'] || row['venue'] || row['Room'];
        const courseType = row['Course Type'] || row['COURSE TYPE'] || row['Type'] || row['type'];

        // Validate required fields
        if (!courseCode || !courseName || !slot) {
            console.warn(`Row ${index + 1}: Missing required fields, skipping`);
            return null;
        }

        // Parse credits (handle formats like "3-0-0-0-3" or just "3")
        let parsedCredits = 0;
        if (typeof credits === 'string' && credits.includes('-')) {
            // Format: L-T-P-J-C, take the last number (total credits)
            const parts = credits.split('-');
            parsedCredits = parseInt(parts[parts.length - 1]) || 0;
        } else {
            parsedCredits = parseInt(credits) || 0;
        }

        // Determine batch type from slot
        const batchType = getSlotBatch(slot);

        // Determine course type if not provided
        let determinedType = courseType || 'Theory';
        if (slot.includes('L') && !slot.match(/[A-G]/)) {
            determinedType = 'Lab';
        }

        return {
            courseCode: courseCode.toString().trim().toUpperCase(),
            courseName: courseName.toString().trim(),
            credits: parsedCredits,
            courseType: determinedType,
            slot: slot.toString().trim().toUpperCase(),
            faculty: faculty ? faculty.toString().trim() : 'TBA',
            venue: venue ? venue.toString().trim() : 'TBA',
            batchType
        };

    } catch (error) {
        console.warn(`Row ${index + 1}: Error parsing - ${error.message}`);
        return null;
    }
}

/**
 * Validate parsed courses
 * @param {array} courses - Array of course objects
 * @returns {object} Validation result with errors and warnings
 */
function validateCourses(courses) {
    const errors = [];
    const warnings = [];

    if (courses.length === 0) {
        errors.push('No valid courses found in Excel file');
    }

    // Check for duplicate course codes
    const courseCodes = new Map();
    courses.forEach((course, index) => {
        if (courseCodes.has(course.courseCode)) {
            warnings.push(`Duplicate course code: ${course.courseCode} at rows ${courseCodes.get(course.courseCode)} and ${index + 1}`);
        } else {
            courseCodes.set(course.courseCode, index + 1);
        }
    });

    // Check for courses with zero credits
    courses.forEach((course, index) => {
        if (course.credits === 0) {
            warnings.push(`Course ${course.courseCode} has 0 credits`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        courseCount: courses.length
    };
}

/**
 * Get course statistics
 * @param {array} courses - Array of course objects
 * @returns {object} Statistics object
 */
function getCourseStatistics(courses) {
    const stats = {
        total: courses.length,
        totalCredits: courses.reduce((sum, c) => sum + c.credits, 0),
        byType: {},
        byBatch: {
            Morning: 0,
            Evening: 0,
            Both: 0
        }
    };

    courses.forEach(course => {
        // Count by type
        stats.byType[course.courseType] = (stats.byType[course.courseType] || 0) + 1;

        // Count by batch
        stats.byBatch[course.batchType]++;
    });

    return stats;
}

module.exports = {
    parseExcelFile,
    parseCourseRow,
    validateCourses,
    getCourseStatistics
};
