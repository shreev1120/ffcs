/**
 * Curriculum Category Rules & Priority Engine for VIT FFCS
 * 
 * Based on the VIT Curriculum Structure (Category Credit Detail):
 * Priority 1: FC   - Foundation Core
 * Priority 2: DLES - Discipline-linked Engineering Sciences
 * Priority 3: DC   - Discipline Core
 * Priority 4: DE   - Discipline Elective
 * 
 * Non-priority / Excluded categories:
 * PI   - Projects and Internship
 * OE   - Open Elective
 * BC   - Bridge Course
 * NGCR - Non-graded Core Requirement
 */

const CURRICULUM_DATA = require('./curriculum_data.json');

const CATEGORY_NAMES = {
    FC: 'Foundation Core',
    DLES: 'Discipline-linked Engineering Sciences',
    DC: 'Discipline Core',
    DE: 'Discipline Elective',
    PI: 'Projects and Internship',
    OE: 'Open Elective',
    BC: 'Bridge Course',
    NGCR: 'Non-graded Core Requirement'
};

const CATEGORY_PRIORITY = {
    FC: 1,
    DLES: 2,
    DC: 3,
    DE: 4,
    OE: 5,
    PI: 5,
    BC: 6,
    NGCR: 6
};

/**
 * Normalize and extract the standard 7-8 char course code (e.g. "ISWE206L")
 * @param {string} codeRaw 
 * @returns {string}
 */
function cleanCourseCode(codeRaw) {
    if (!codeRaw) return '';
    const str = String(codeRaw).trim().toUpperCase();
    const match = str.match(/\b([A-Z]{3,4}\d{3}[A-Z])\b/);
    if (match) return match[1];
    const prefix = str.split(/[-_\s:]/)[0];
    return prefix || str;
}

/**
 * Get curriculum category code for a given course code
 * @param {string} courseCode 
 * @param {string} [fallbackCategory] 
 * @returns {string} 'FC' | 'DLES' | 'DC' | 'DE' | 'OE' | 'PI' | 'BC' | 'NGCR' | 'OTHER'
 */
function getCourseCategory(courseCode, fallbackCategory) {
    const code = cleanCourseCode(courseCode);
    if (CURRICULUM_DATA[code]) {
        return CURRICULUM_DATA[code];
    }

    // Heuristics based on course code prefixes
    if (code.startsWith('ISTS') || code.startsWith('HUM') || code.startsWith('ENG') || code.startsWith('CHY') || code.startsWith('PHY')) {
        return 'FC';
    }

    if (fallbackCategory) {
        const cat = String(fallbackCategory).toLowerCase();
        if (cat.includes('foundation')) return 'FC';
        if (cat.includes('linked') || cat.includes('dles') || cat.includes('engineering science')) return 'DLES';
        if (cat.includes('discipline core') || cat.includes('programme core') || cat === 'dc' || cat === 'pc') return 'DC';
        if (cat.includes('elective') || cat === 'de' || cat === 'pe') return 'DE';
        if (cat.includes('open') || cat === 'oe') return 'OE';
    }

    return 'DE'; // Default assumption for unlisted upper-level subjects
}

/**
 * Get human-readable category name
 * @param {string} catCode 
 * @returns {string}
 */
function getCategoryFullName(catCode) {
    return CATEGORY_NAMES[catCode] || 'Discipline Elective';
}

/**
 * Returns numeric priority rank:
 * 1: FC (Foundation Core)
 * 2: DLES (Discipline-linked Engineering Sciences)
 * 3: DC (Discipline Core)
 * 4: DE (Discipline Elective)
 * 5+: Others
 * @param {string} courseCode 
 * @param {string} [fallbackCategory] 
 * @returns {number}
 */
function getCourseCategoryPriority(courseCode, fallbackCategory) {
    const cat = getCourseCategory(courseCode, fallbackCategory);
    return CATEGORY_PRIORITY[cat] || 4;
}

/**
 * Returns true if the course is a mandatory degree core requirement (FC, DLES, or DC)
 * @param {string} courseCode 
 * @param {string} [fallbackCategory] 
 * @returns {boolean}
 */
function isCoreCourse(courseCode, fallbackCategory) {
    const prio = getCourseCategoryPriority(courseCode, fallbackCategory);
    return prio <= 3; // FC (1), DLES (2), DC (3)
}

module.exports = {
    cleanCourseCode,
    getCourseCategory,
    getCategoryFullName,
    getCourseCategoryPriority,
    isCoreCourse,
    CATEGORY_NAMES,
    CATEGORY_PRIORITY
};
