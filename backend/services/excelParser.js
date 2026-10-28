const xlsx = require('xlsx');
const path = require('path');
const { getSlotBatch } = require('../utils/slotMapping');
const curriculumRules = require('./curriculumRules');

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
function findRowValue(row, possibleKeys) {
    const rowKeys = Object.keys(row);
    for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return String(row[key]).trim();
        }
        const matchingKey = rowKeys.find(k => k.trim().toLowerCase() === key.toLowerCase());
        if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && String(row[matchingKey]).trim() !== '') {
            return String(row[matchingKey]).trim();
        }
    }
    return undefined;
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
        const slNo = findRowValue(row, ['Sl. No', 'Sl.No', 'S.No', 'Serial No', 'Sl No', 'SL NO']) || (index + 1);
        const courseCodeTitle = findRowValue(row, [
            'Course Code & Title',
            'Course Code & Course Title',
            'Course Code &',
            'Course Code & ',
            'Course Code and Title',
            'COURSE CODE & TITLE',
            'COURSE CODE & COURSE TITLE'
        ]);
        const credits = findRowValue(row, ['Credits', 'CREDITS', 'L-T-P-J-C', 'Credit', 'L T P J C', 'Cr']) || 3;
        const category = findRowValue(row, ['Category', 'CATEGORY']) || 'General';
        const regType = findRowValue(row, ['Reg Type', 'REG TYPE', 'Registration Type', 'Type of Reg']) || 'Regular';
        const slot = findRowValue(row, ['Slot', 'SLOT', 'slot', 'Slots']) || '';
        const faculty = findRowValue(row, ['Faculty', 'FACULTY', 'faculty', 'Faculty Name', 'Staff']) || 'TBA';
        const venue = findRowValue(row, ['Venue', 'VENUE', 'venue', 'Room', 'Class Room', 'Classroom']) || 'TBA';
        const courseType = findRowValue(row, ['Course Type', 'COURSE TYPE', 'Type', 'type']);

        let courseCode = findRowValue(row, ['Course Code', 'COURSE CODE', 'Code', 'code']);
        let courseName = findRowValue(row, ['Course Title', 'COURSE TITLE', 'Title', 'title', 'Course Name']);

        // If code and name aren't separate, try to parse from combined field
        if (courseCodeTitle && (!courseCode || !courseName)) {
            const trimmed = courseCodeTitle.trim();
            const match = trimmed.match(/^([A-Z]{2,5}\d{2,4}[A-Z]?)\s*[-–—:]?\s*(.+)$/i);
            if (match) {
                courseCode = match[1].trim().toUpperCase();
                courseName = match[2].trim();
            } else {
                const splitPos = trimmed.indexOf(' - ');
                if (splitPos !== -1) {
                    courseCode = trimmed.substring(0, splitPos).trim().toUpperCase();
                    courseName = trimmed.substring(splitPos + 3).trim();
                } else {
                    const firstSpace = trimmed.indexOf(' ');
                    if (firstSpace !== -1 && /^[A-Z]{3,4}[0-9]/i.test(trimmed)) {
                        courseCode = trimmed.substring(0, firstSpace).trim().toUpperCase();
                        courseName = trimmed.substring(firstSpace + 1).trim();
                    } else {
                        courseCode = trimmed;
                        courseName = trimmed;
                    }
                }
            }
        }

        // Validate required fields
        if (!courseCode || !slot) {
            console.warn(`Row ${index + 1}: Missing required code or slot (Code: ${courseCode}, Slot: ${slot}), skipping`);
            return null;
        }

        if (!courseName) {
            courseName = courseCode;
        }

        // Parse credits (handle formats like "3-0-0-0-3", "3 0 0 3.0", or just "3")
        let parsedCredits = 0;
        if (typeof credits === 'string') {
            if (credits.includes('-')) {
                const parts = credits.split('-');
                parsedCredits = parseFloat(parts[parts.length - 1]) || 0;
            } else if (credits.includes(' ')) {
                const parts = credits.trim().split(/\s+/);
                parsedCredits = parseFloat(parts[parts.length - 1]) || 0;
            } else {
                parsedCredits = parseFloat(credits) || 0;
            }
        } else {
            parsedCredits = parseFloat(credits) || 0;
        }

        // Determine batch type from slot
        const batchType = getSlotBatch(slot.toString());

        // Determine course type accurately
        let determinedType = courseType;
        const slotStr = slot.toString().trim().toUpperCase();
        if (!determinedType) {
            if (slotStr === 'NIL' || slotStr === 'N/A' || slotStr === '-' || slotStr === 'NONE') {
                determinedType = 'Non-graded';
            } else if (/\bL\d+/i.test(slotStr) && !slotStr.match(/[A-G]\d+/i)) {
                determinedType = 'Lab';
            } else if (courseCode.endsWith('P') && (slotStr.includes('L') || !slotStr.match(/[A-G]\d+/i))) {
                determinedType = 'Lab';
            } else {
                determinedType = 'Theory';
            }
        }

        const catCode = curriculumRules.getCourseCategory(courseCode, category);
        const catName = curriculumRules.getCategoryFullName(catCode);
        const catPrio = curriculumRules.getCourseCategoryPriority(courseCode, category);

        return {
            slNo: parseInt(slNo) || (index + 1),
            courseCode: courseCode.toString().trim().toUpperCase(),
            courseName: courseName.toString().trim(),
            credits: parsedCredits,
            category: catName,
            curriculumCategory: catCode,
            categoryPriority: catPrio,
            registrationType: regType ? regType.toString().trim() : 'Regular',
            courseType: determinedType,
            slot: slotStr.trim(),
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
