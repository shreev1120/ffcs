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

// Master slot definitions with day and time mappings
const MASTER_SLOTS = {
    // Morning Theory Slots (*1 series)
    A1: { days: ['Monday', 'Wednesday', 'Friday'], time: '08:00-08:50', batch: 'Morning' },
    B1: { days: ['Monday', 'Wednesday', 'Friday'], time: '09:00-09:50', batch: 'Morning' },
    C1: { days: ['Monday', 'Wednesday', 'Friday'], time: '10:00-10:50', batch: 'Morning' },
    D1: { days: ['Monday', 'Wednesday', 'Friday'], time: '11:00-11:50', batch: 'Morning' },
    E1: { days: ['Monday', 'Wednesday', 'Friday'], time: '12:00-12:50', batch: 'Morning' },

    F1: { days: ['Tuesday', 'Thursday'], time: '08:00-08:50', batch: 'Morning' },
    G1: { days: ['Tuesday', 'Thursday'], time: '09:00-09:50', batch: 'Morning' },

    TA1: { days: ['Tuesday'], time: '10:00-10:50', batch: 'Morning' },
    TB1: { days: ['Tuesday'], time: '11:00-11:50', batch: 'Morning' },
    TC1: { days: ['Tuesday'], time: '12:00-12:50', batch: 'Morning' },

    TD1: { days: ['Thursday'], time: '10:00-10:50', batch: 'Morning' },
    TE1: { days: ['Thursday'], time: '11:00-11:50', batch: 'Morning' },
    TF1: { days: ['Thursday'], time: '12:00-12:50', batch: 'Morning' },

    // Evening Theory Slots (*2 series)
    A2: { days: ['Monday', 'Wednesday', 'Friday'], time: '14:00-14:50', batch: 'Evening' },
    B2: { days: ['Monday', 'Wednesday', 'Friday'], time: '15:00-15:50', batch: 'Evening' },
    C2: { days: ['Monday', 'Wednesday', 'Friday'], time: '16:00-16:50', batch: 'Evening' },
    D2: { days: ['Monday', 'Wednesday', 'Friday'], time: '17:00-17:50', batch: 'Evening' },
    E2: { days: ['Monday', 'Wednesday', 'Friday'], time: '18:00-18:50', batch: 'Evening' },

    F2: { days: ['Tuesday', 'Thursday'], time: '14:00-14:50', batch: 'Evening' },
    G2: { days: ['Tuesday', 'Thursday'], time: '15:00-15:50', batch: 'Evening' },

    TA2: { days: ['Tuesday'], time: '16:00-16:50', batch: 'Evening' },
    TB2: { days: ['Tuesday'], time: '17:00-17:50', batch: 'Evening' },
    TC2: { days: ['Tuesday'], time: '18:00-18:50', batch: 'Evening' },

    TD2: { days: ['Thursday'], time: '16:00-16:50', batch: 'Evening' },
    TE2: { days: ['Thursday'], time: '17:00-17:50', batch: 'Evening' },
    TF2: { days: ['Thursday'], time: '18:00-18:50', batch: 'Evening' }
};

// Lab slot mappings (L1-L60)
// Lab slots are 2-hour blocks
const LAB_SLOTS = {
    // Morning labs
    L1: { days: ['Monday'], time: '08:00-09:50', batch: 'Morning' },
    L2: { days: ['Monday'], time: '10:00-11:50', batch: 'Morning' },
    L3: { days: ['Tuesday'], time: '08:00-09:50', batch: 'Morning' },
    L4: { days: ['Tuesday'], time: '10:00-11:50', batch: 'Morning' },
    L5: { days: ['Wednesday'], time: '08:00-09:50', batch: 'Morning' },
    L6: { days: ['Wednesday'], time: '10:00-11:50', batch: 'Morning' },
    L7: { days: ['Thursday'], time: '08:00-09:50', batch: 'Morning' },
    L8: { days: ['Thursday'], time: '10:00-11:50', batch: 'Morning' },
    L9: { days: ['Friday'], time: '08:00-09:50', batch: 'Morning' },
    L10: { days: ['Friday'], time: '10:00-11:50', batch: 'Morning' },

    // Evening labs
    L31: { days: ['Monday'], time: '14:00-15:50', batch: 'Evening' },
    L32: { days: ['Monday'], time: '16:00-17:50', batch: 'Evening' },
    L33: { days: ['Tuesday'], time: '14:00-15:50', batch: 'Evening' },
    L34: { days: ['Tuesday'], time: '16:00-17:50', batch: 'Evening' },
    L35: { days: ['Wednesday'], time: '14:00-15:50', batch: 'Evening' },
    L36: { days: ['Wednesday'], time: '16:00-17:50', batch: 'Evening' },
    L37: { days: ['Thursday'], time: '14:00-15:50', batch: 'Evening' },
    L38: { days: ['Thursday'], time: '16:00-17:50', batch: 'Evening' },
    L39: { days: ['Friday'], time: '14:00-15:50', batch: 'Evening' },
    L40: { days: ['Friday'], time: '16:00-17:50', batch: 'Evening' }

    // Additional lab slots L11-L30, L41-L60 can be added as needed
};

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

    // Check if any days overlap
    const daysOverlap = info1.days.some(day => info2.days.includes(day));

    // Check if times overlap
    const timesMatch = info1.time === info2.time;

    return daysOverlap && timesMatch;
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
    const batches = new Set();

    for (const code of slotCodes) {
        const info = getSlotInfo(code);
        if (info) {
            batches.add(info.batch);
        }
    }

    if (batches.size === 0) return 'Both';
    if (batches.size === 2) return 'Both';
    return Array.from(batches)[0];
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
            for (const day of info.days) {
                timeSlots.push({
                    day,
                    time: info.time,
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
function filterCoursesByBatch(courses, batchPreference) {
    if (batchPreference === 'Both') return courses;

    return courses.filter(course => {
        const batch = getSlotBatch(course.slot);
        return batch === batchPreference || batch === 'Both';
    });
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
    filterCoursesByBatch
};
