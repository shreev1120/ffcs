/**
 * VIT FFCS Slot Mapping Utilities
 * 
 * This module handles the complex slot mapping system used by VIT's FFCS.
 * 
 * Slot System Overview:
 * - Theory slots: A1, A2, B1, B2, C1, C2, D1, D2, E1, E2, F1, G1, G2
 * - Morning batch uses *1 series (e.g., A1, B1, C1)
 * - Evening batch uses *2 series (e.g., A2, B2, C2)
 * - Lab slots: L1-L60 (each lab slot spans 2 hours)
 * 
 * Each theory slot maps to specific days and time periods.
 */

// Master slot definitions aligned with the VIT template grid.
// A slot can occur in multiple day-time sessions.
const MASTER_SLOTS = {
    // Morning theory (*1)
    A1: { batch: 'Morning', sessions: [{ day: 'Monday', time: '08:00-08:50' }, { day: 'Wednesday', time: '08:55-09:45' }] },
    B1: { batch: 'Morning', sessions: [{ day: 'Tuesday', time: '08:00-08:50' }, { day: 'Thursday', time: '08:55-09:45' }] },
    C1: { batch: 'Morning', sessions: [{ day: 'Wednesday', time: '08:00-08:50' }, { day: 'Friday', time: '08:55-09:45' }] },
    D1: { batch: 'Morning', sessions: [{ day: 'Monday', time: '09:50-10:40' }, { day: 'Thursday', time: '08:00-08:50' }] },
    E1: { batch: 'Morning', sessions: [{ day: 'Tuesday', time: '09:50-10:40' }, { day: 'Friday', time: '08:00-08:50' }] },
    F1: { batch: 'Morning', sessions: [{ day: 'Monday', time: '08:55-09:45' }, { day: 'Wednesday', time: '09:50-10:40' }] },
    G1: { batch: 'Morning', sessions: [{ day: 'Tuesday', time: '08:55-09:45' }, { day: 'Thursday', time: '09:50-10:40' }] },
    TA1: { batch: 'Morning', sessions: [{ day: 'Friday', time: '09:50-10:40' }] },
    TB1: { batch: 'Morning', sessions: [{ day: 'Monday', time: '10:45-11:35' }] },
    TC1: { batch: 'Morning', sessions: [{ day: 'Tuesday', time: '10:45-11:35' }] },
    TD1: { batch: 'Morning', sessions: [{ day: 'Wednesday', time: '10:45-11:35' }] },
    TE1: { batch: 'Morning', sessions: [{ day: 'Thursday', time: '10:45-11:35' }] },
    TF1: { batch: 'Morning', sessions: [{ day: 'Friday', time: '10:45-11:35' }] },
    TG1: { batch: 'Morning', sessions: [{ day: 'Monday', time: '11:40-12:30' }] },
    TAA1: { batch: 'Morning', sessions: [{ day: 'Tuesday', time: '11:40-12:30' }] },
    TCC1: { batch: 'Morning', sessions: [{ day: 'Thursday', time: '11:40-12:30' }] },
    TDD1: { batch: 'Morning', sessions: [{ day: 'Friday', time: '11:40-12:30' }] },

    // Evening theory (*2)
    A2: { batch: 'Evening', sessions: [{ day: 'Monday', time: '14:00-14:50' }, { day: 'Wednesday', time: '14:55-15:45' }] },
    B2: { batch: 'Evening', sessions: [{ day: 'Tuesday', time: '14:00-14:50' }, { day: 'Thursday', time: '14:55-15:45' }] },
    C2: { batch: 'Evening', sessions: [{ day: 'Wednesday', time: '14:00-14:50' }, { day: 'Friday', time: '14:55-15:45' }] },
    D2: { batch: 'Evening', sessions: [{ day: 'Monday', time: '15:50-16:40' }, { day: 'Thursday', time: '14:00-14:50' }] },
    E2: { batch: 'Evening', sessions: [{ day: 'Tuesday', time: '15:50-16:40' }, { day: 'Friday', time: '14:00-14:50' }] },
    F2: { batch: 'Evening', sessions: [{ day: 'Monday', time: '14:55-15:45' }, { day: 'Wednesday', time: '15:50-16:40' }] },
    G2: { batch: 'Evening', sessions: [{ day: 'Tuesday', time: '14:55-15:45' }, { day: 'Thursday', time: '15:50-16:40' }] },
    TA2: { batch: 'Evening', sessions: [{ day: 'Friday', time: '15:50-16:40' }] },
    TB2: { batch: 'Evening', sessions: [{ day: 'Monday', time: '16:45-17:35' }] },
    TC2: { batch: 'Evening', sessions: [{ day: 'Tuesday', time: '16:45-17:35' }] },
    TD2: { batch: 'Evening', sessions: [{ day: 'Wednesday', time: '16:45-17:35' }] },
    TE2: { batch: 'Evening', sessions: [{ day: 'Thursday', time: '16:45-17:35' }] },
    TF2: { batch: 'Evening', sessions: [{ day: 'Friday', time: '16:45-17:35' }] },
    TG2: { batch: 'Evening', sessions: [{ day: 'Monday', time: '17:40-18:30' }] },
    TAA2: { batch: 'Evening', sessions: [{ day: 'Tuesday', time: '17:40-18:30' }] },
    TBB2: { batch: 'Evening', sessions: [{ day: 'Wednesday', time: '17:40-18:30' }] },
    TCC2: { batch: 'Evening', sessions: [{ day: 'Thursday', time: '17:40-18:30' }] },
    TDD2: { batch: 'Evening', sessions: [{ day: 'Friday', time: '17:40-18:30' }] }
};

// Lab slot mappings (L1-L60) aligned with template
const LAB_SLOTS = {};
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const morningLabTimes = ['08:00-08:50', '08:50-09:40', '09:50-10:40', '10:40-11:30', '11:40-12:30', '12:30-13:20'];
const eveningLabTimes = ['14:00-14:50', '14:50-15:40', '15:50-16:40', '16:40-17:30', '17:40-18:30', '18:30-19:20'];

let lCount = 1;
for (const day of weekDays) {
    for (const time of morningLabTimes) {
        LAB_SLOTS[`L${lCount}`] = { batch: 'Morning', sessions: [{ day, time }] };
        lCount++;
    }
}

lCount = 31;
for (const day of weekDays) {
    for (const time of eveningLabTimes) {
        LAB_SLOTS[`L${lCount}`] = { batch: 'Evening', sessions: [{ day, time }] };
        lCount++;
    }
}

/**
 * Get slot information
 * @param {string} slotCode - Slot code (e.g., 'A1', 'L1')
 * @returns {object|null} Slot information or null if not found
 */
function getSlotInfo(slotCode) {
    const slot = MASTER_SLOTS[slotCode] || LAB_SLOTS[slotCode];
    return slot ? { ...slot, code: slotCode } : null;
}

/**
 * Check if two slots clash (occur at the same time)
 * @param {string} slot1 - First slot code
 * @param {string} slot2 - Second slot code
 * @returns {boolean} True if slots clash
 */
function doSlotsClash(slot1, slot2) {
    const info1 = getSlotInfo(slot1);
    const info2 = getSlotInfo(slot2);

    if (!info1 || !info2) return false;

    const sessions1 = info1.sessions || [];
    const sessions2 = info2.sessions || [];

    for (const s1 of sessions1) {
        for (const s2 of sessions2) {
            if (s1.day === s2.day && doTimesOverlap(s1.time, s2.time)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Convert HH:MM to minutes from midnight
 * @param {string} time
 * @returns {number}
 */
function toMinutes(time) {
    const [hour, minute] = time.split(':').map(Number);
    return (hour * 60) + minute;
}

/**
 * Check overlap between two time ranges like "08:00-08:50"
 * @param {string} rangeA
 * @param {string} rangeB
 * @returns {boolean}
 */
function doTimesOverlap(rangeA, rangeB) {
    const [startA, endA] = rangeA.split('-');
    const [startB, endB] = rangeB.split('-');

    if (!startA || !endA || !startB || !endB) {
        return false;
    }

    const aStart = toMinutes(startA);
    const aEnd = toMinutes(endA);
    const bStart = toMinutes(startB);
    const bEnd = toMinutes(endB);

    return aStart < bEnd && bStart < aEnd;
}

/**
 * Parse composite slot strings (e.g., "A1+TA1", "L1+L2")
 * @param {string} slotString - Slot string from Excel
 * @returns {array} Array of individual slot codes
 */
function parseSlotString(slotString) {
    if (!slotString) return [];

    // Remove whitespace and split by + or ,
    return slotString
        .replace(/\s/g, '')
        .split(/[+,]/)
        .filter(s => s.length > 0);
}

/**
 * Check if a course slot clashes with any existing slots
 * @param {string} newSlot - New slot to check
 * @param {array} existingSlots - Array of existing slot strings
 * @returns {boolean} True if there's a clash
 */
function hasClash(newSlot, existingSlots) {
    const newSlotCodes = parseSlotString(newSlot);

    for (const existingSlot of existingSlots) {
        const existingSlotCodes = parseSlotString(existingSlot);

        // Check each combination
        for (const newCode of newSlotCodes) {
            for (const existingCode of existingSlotCodes) {
                if (doSlotsClash(newCode, existingCode)) {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Get batch type for a slot
 * @param {string} slotString - Slot string
 * @returns {string} 'Morning', 'Evening', or 'Both'
 */
function getSlotBatch(slotString) {
    const slotCodes = parseSlotString(slotString);
    if (slotCodes.length === 0) return 'Both';

    const batches = slotCodes.map((code) => {
        const normalized = code.toString().trim().toUpperCase();

        if (/^L\d+$/.test(normalized)) {
            const slotNumber = parseInt(normalized.slice(1), 10);
            if (slotNumber >= 1 && slotNumber <= 30) return 'Morning';
            if (slotNumber >= 31 && slotNumber <= 60) return 'Evening';
            return 'Both';
        }

        if (normalized.endsWith('1')) return 'Morning';
        if (normalized.endsWith('2')) return 'Evening';

        const info = getSlotInfo(normalized);
        return info ? info.batch : 'Both';
    });

    if (batches.every((batch) => batch === 'Morning')) return 'Morning';
    if (batches.every((batch) => batch === 'Evening')) return 'Evening';
    return 'Both';
}

/**
 * Get all time slots for a given slot code
 * @param {string} slotString - Slot string
 * @returns {array} Array of {day, time, slot} objects
 */
function getTimeSlots(slotString) {
    const slotCodes = parseSlotString(slotString);
    const timeSlots = [];

    for (const code of slotCodes) {
        const info = getSlotInfo(code);
        if (info) {
            for (const session of (info.sessions || [])) {
                timeSlots.push({
                    day: session.day,
                    time: session.time,
                    slot: code,
                    batch: info.batch
                });
            }
        }
    }

    return timeSlots;
}

/**
 * Filter courses by batch preference
 * @param {array} courses - Array of course objects
 * @param {string} batchPreference - 'Morning', 'Evening', or 'Both'
 * @returns {array} Filtered courses
 */
function isLabCourse(course) {
    if (!course) return false;
    const slotCodes = parseSlotString(course.slot || '');
    const hasLabSlot = slotCodes.some((code) => /^L\d+$/i.test(code));
    if (hasLabSlot) return true;
    const hasTheorySlot = slotCodes.some((code) => /^[A-G]/i.test(code));
    if (hasTheorySlot) return false;
    const type = (course.courseType || '').toString().toUpperCase();
    if (type.includes('LAB')) return true;
    if (type.includes('THEORY')) return false;
    const code = (course.courseCode || '').toString().toUpperCase();
    return code.endsWith('P');
}

/**
 * Convert a lab slot string to the appropriate shift (batch):
 * - Morning batch: Theory is morning (*1), Labs are evening (L31 to L60).
 * - Evening batch: Theory is evening (*2), Labs are morning (L1 to L30).
 * If a lab slot is in the opposite shift, convert it by adding/subtracting 30:
 * L(n) <-> L(n + 30).
 */
function convertLabSlotForBatch(slotString, targetBatch) {
    if (!slotString || typeof slotString !== 'string') return slotString;
    const codes = parseSlotString(slotString);
    if (codes.length === 0) return slotString;

    const converted = codes.map((code) => {
        const norm = code.toUpperCase();
        const m = norm.match(/^L(\d+)$/i);
        if (!m) return code;
        const num = parseInt(m[1], 10);
        if (targetBatch === 'Morning' && num >= 1 && num <= 30) {
            return `L${num + 30}`;
        }
        if (targetBatch === 'Evening' && num >= 31 && num <= 60) {
            return `L${num - 30}`;
        }
        return code;
    });

    return converted.join('+');
}

function isMorningTheorySlot(slotString) {
    const slotCodes = parseSlotString(slotString);
    if (slotCodes.length === 0) return false;

    return slotCodes.every((code) => {
        const norm = code.toUpperCase();
        if (/^L\d+$/.test(norm)) return false;
        if (norm.endsWith('2')) return false;
        if (norm.endsWith('1')) return true;
        const info = getSlotInfo(norm);
        return info && info.batch === 'Morning';
    });
}

function isEveningTheorySlot(slotString) {
    const slotCodes = parseSlotString(slotString);
    if (slotCodes.length === 0) return false;

    return slotCodes.every((code) => {
        const norm = code.toUpperCase();
        if (/^L\d+$/.test(norm)) return false;
        if (norm.endsWith('1')) return false;
        if (norm.endsWith('2')) return true;
        const info = getSlotInfo(norm);
        return info && info.batch === 'Evening';
    });
}

function isMorningLabSlot(slotString) {
    const slotCodes = parseSlotString(slotString);
    if (slotCodes.length === 0) return false;

    return slotCodes.every((code) => {
        const norm = code.toUpperCase();
        if (/^L\d+$/.test(norm)) {
            const num = parseInt(norm.slice(1), 10);
            return num >= 1 && num <= 30;
        }
        return false;
    });
}

function isEveningLabSlot(slotString) {
    const slotCodes = parseSlotString(slotString);
    if (slotCodes.length === 0) return false;

    return slotCodes.every((code) => {
        const norm = code.toUpperCase();
        if (/^L\d+$/.test(norm)) {
            const num = parseInt(norm.slice(1), 10);
            return num >= 31 && num <= 60;
        }
        return false;
    });
}

/**
 * Filter courses by batch preference according to VIT FFCS shift rules:
 * - Morning Batch: Theory in *1 series (08:00 - 13:00) + Labs in L31-L60 (14:00 - 19:20).
 * - Evening Batch: Theory in *2 series (14:00 - 19:00) + Labs in L1-L30 (08:00 - 13:20).
 * No mixed shifts are allowed in an individual batch!
 * @param {array} courses - Array of course objects
 * @param {string} batchPreference - 'Morning', 'Evening', or 'Both'
 * @returns {array} Filtered courses
 */
function filterCoursesByBatch(courses, batchPreference) {
    if (!Array.isArray(courses)) return [];
    if (batchPreference === 'Both') return courses;

    return courses.filter((course) => {
        if (!course || !course.slot || course.slot === 'NIL') return false;
        const lab = isLabCourse(course);

        if (batchPreference === 'Morning') {
            return lab ? isEveningLabSlot(course.slot) : isMorningTheorySlot(course.slot);
        }

        if (batchPreference === 'Evening') {
            return lab ? isMorningLabSlot(course.slot) : isEveningTheorySlot(course.slot);
        }

        return false;
    });
}

/**
 * Validate that every course in a timetable strictly follows the pure batch shift
 * @param {array} courses
 * @param {string} batchPreference - 'Morning' or 'Evening'
 * @returns {boolean}
 */
function validateTimetableBatchPurity(courses, batchPreference) {
    if (!Array.isArray(courses) || courses.length === 0) return false;
    if (!['Morning', 'Evening'].includes(batchPreference)) return true;

    for (const course of courses) {
        if (!course || !course.slot || course.slot === 'NIL') continue;
        const lab = isLabCourse(course);

        if (batchPreference === 'Morning') {
            if (lab && !isEveningLabSlot(course.slot)) return false;
            if (!lab && !isMorningTheorySlot(course.slot)) return false;
        } else if (batchPreference === 'Evening') {
            if (lab && !isMorningLabSlot(course.slot)) return false;
            if (!lab && !isEveningTheorySlot(course.slot)) return false;
        }
    }

    return true;
}

/**
 * Determine whether a complete timetable is pure Morning, pure Evening, or Mixed
 * @param {array} courses
 * @returns {string} 'Morning', 'Evening', or 'Mixed'
 */
function getTimetableBatch(courses) {
    if (!Array.isArray(courses) || courses.length === 0) return 'Unknown';
    if (validateTimetableBatchPurity(courses, 'Morning')) return 'Morning';
    if (validateTimetableBatchPurity(courses, 'Evening')) return 'Evening';
    return 'Mixed';
}

module.exports = {
    MASTER_SLOTS,
    LAB_SLOTS,
    getSlotInfo,
    doSlotsClash,
    parseSlotString,
    hasClash,
    getSlotBatch,
    getTimeSlots,
    isLabCourse,
    isMorningTheorySlot,
    isEveningTheorySlot,
    isMorningLabSlot,
    isEveningLabSlot,
    filterCoursesByBatch,
    convertLabSlotForBatch,
    validateTimetableBatchPurity,
    getTimetableBatch
};
