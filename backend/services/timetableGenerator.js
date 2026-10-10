const { hasClash, filterCoursesByBatch, getTimeSlots, validateTimetableBatchPurity, getTimetableBatch } = require('../utils/slotMapping');

function normalizeFacultyName(faculty) {
    return (faculty || '').toString().trim().toUpperCase();
}

function getCourseComponentKind(course) {
    const courseType = (course.courseType || '').toString().trim().toUpperCase();
    const code = (course.courseCode || '').toString().trim().toUpperCase();

    if (courseType.includes('LAB')) return 'LAB';
    if (courseType.includes('THEORY')) return 'THEORY';
    if (code.endsWith('P')) return 'LAB';
    if (code.endsWith('L')) return 'THEORY';
    return 'OTHER';
}

function getCourseFamilyKey(courseCode) {
    const code = (courseCode || '').toString().trim().toUpperCase();
    const match = code.match(/^([A-Z]{2,}\d{3,4})[A-Z]$/);
    return match ? match[1] : code;
}

function buildFacultyConstraintFamilies(optionGroups) {
    const familyKinds = new Map();

    optionGroups.forEach((group) => {
        const sample = group.options && group.options.length > 0 ? group.options[0] : null;
        if (!sample) return;

        const familyKey = getCourseFamilyKey(sample.courseCode);
        const kind = getCourseComponentKind(sample);
        if (kind === 'OTHER') return;

        if (!familyKinds.has(familyKey)) {
            familyKinds.set(familyKey, new Set());
        }
        familyKinds.get(familyKey).add(kind);
    });

    const constrained = new Set();
    familyKinds.forEach((kinds, familyKey) => {
        if (kinds.has('THEORY') && kinds.has('LAB')) {
            constrained.add(familyKey);
        }
    });

    return constrained;
}

function tryAssignFacultyConstraint(option, constrainedFamilies, selectedFacultyByFamily) {
    const familyKey = getCourseFamilyKey(option.courseCode);
    if (!constrainedFamilies.has(familyKey)) {
        return { ok: true, assigned: false, familyKey: null };
    }

    const faculty = normalizeFacultyName(option.faculty);
    if (!faculty) {
        return { ok: true, assigned: false, familyKey: null };
    }

    const existing = selectedFacultyByFamily.get(familyKey);
    if (existing && existing !== faculty) {
        return { ok: false, assigned: false, familyKey: null };
    }

    if (!existing) {
        selectedFacultyByFamily.set(familyKey, faculty);
        return { ok: true, assigned: true, familyKey };
    }

    return { ok: true, assigned: false, familyKey: null };
}

function undoFacultyAssignment(assignment, selectedFacultyByFamily) {
    if (assignment.assigned && assignment.familyKey) {
        selectedFacultyByFamily.delete(assignment.familyKey);
    }
}

function passesFacultyConsistency(selectedCourses, constrainedFamilies) {
    const facultyByFamily = new Map();

    for (const course of selectedCourses) {
        const familyKey = getCourseFamilyKey(course.courseCode);
        if (!constrainedFamilies.has(familyKey)) continue;

        const faculty = normalizeFacultyName(course.faculty);
        if (!faculty) continue;

        const existing = facultyByFamily.get(familyKey);
        if (existing && existing !== faculty) {
            return false;
        }
        if (!existing) {
            facultyByFamily.set(familyKey, faculty);
        }
    }

    return true;
}

/**
 * Generate all possible clash-free timetables
 * @param {array} courses - Array of course objects
 * @param {object} preferences - User preferences
 * @returns {array} Array of valid timetable combinations
 */
function generateTimetables(courses, preferences = {}) {
    const combinations = generateCombinations(courses, preferences);
    return combinations.map((combo) => combo.courses);
}

/**
 * Generate timetable combinations with graceful fallback.
 * Strict mode requires selecting one option from every course group.
 * Relaxed mode skips only unavoidable conflicting groups and maximizes coverage.
 * @param {array} courses
 * @param {object} preferences
 * @returns {array} Array of { courses, excludedGroupKeys, generationMode }
 */
function generateCombinations(courses, preferences = {}) {
    const {
        batchPreference = 'Morning',
        maxTimetables = 50
    } = preferences;

    if (!Array.isArray(courses) || courses.length === 0) {
        return [];
    }

    // VIT FFCS strictly separates Morning and Evening batches:
    // Morning: Theory in *1 series (08:00 - 13:00) + Labs in L31-L60 (14:00 - 19:20).
    // Evening: Theory in *2 series (14:00 - 19:00) + Labs in L1-L30 (08:00 - 13:20).
    // An individual schedule NEVER mixes morning (*1) and evening (*2) shifts.
    // When 'Both' is requested, pure Morning and pure Evening timetables are generated separately.
    if (batchPreference === 'Both') {
        const half = Math.ceil(maxTimetables / 2);
        const morningCombos = generateCombinations(courses, {
            ...preferences,
            batchPreference: 'Morning',
            maxTimetables: half
        });
        const eveningCombos = generateCombinations(courses, {
            ...preferences,
            batchPreference: 'Evening',
            maxTimetables: half
        });
        return [...morningCombos, ...eveningCombos];
    }

    const optionGroups = buildCourseOptionGroups(courses, batchPreference);
    if (optionGroups.length === 0) {
        return [];
    }
    const constrainedFamilies = buildFacultyConstraintFamilies(optionGroups);

    const strictCombinations = [];
    backtrackOptionGroups(
        optionGroups,
        0,
        [],
        strictCombinations,
        maxTimetables,
        constrainedFamilies,
        new Map(),
        batchPreference
    );
    if (strictCombinations.length > 0) {
        return strictCombinations.map((courses) => ({
            courses,
            excludedGroupKeys: [],
            generationMode: 'strict'
        }));
    }

    const relaxedCombinations = [];
    const tracker = {
        bestSelectedGroups: -1,
        seen: new Set()
    };
    backtrackOptionGroupsRelaxed(
        optionGroups,
        0,
        [],
        [],
        0,
        relaxedCombinations,
        tracker,
        maxTimetables,
        constrainedFamilies,
        new Map(),
        batchPreference
    );

    return relaxedCombinations.map((combo) => ({
        courses: combo.courses,
        excludedGroupKeys: combo.excludedGroupKeys,
        generationMode: 'relaxed'
    }));
}

/**
 * Build grouped course options from flat rows.
 * Exactly one option is chosen per group (courseCode + courseType).
 * @param {array} courses
 * @param {string} batchPreference
 * @returns {array}
 */
function buildCourseOptionGroups(courses, batchPreference) {
    const groups = new Map();

    courses.forEach((course) => {
        const courseType = (course.courseType || 'Theory').toString().trim().toUpperCase();
        const groupKey = `${course.courseCode}::${courseType}`;
        const existing = groups.get(groupKey) || [];
        existing.push(course);
        groups.set(groupKey, existing);
    });

    const optionGroups = [];

    for (const options of groups.values()) {
        const preferredBatchOptions =
            batchPreference === 'Both'
                ? options
                : filterCoursesByBatch(options, batchPreference);

        const candidateOptions = preferredBatchOptions;

        const seen = new Set();
        const uniqueOptions = [];
        candidateOptions.forEach((option) => {
            const optionKey = [
                option.courseCode,
                option.courseType,
                option.slot,
                option.faculty,
                option.venue
            ].join('|');
            if (!seen.has(optionKey)) {
                seen.add(optionKey);
                uniqueOptions.push(option);
            }
        });

        optionGroups.push({
            groupKey: options[0] ? `${options[0].courseCode}::${(options[0].courseType || 'Theory').toString().trim().toUpperCase()}` : `GROUP_${optionGroups.length + 1}`,
            options: uniqueOptions
        });
    }

    return optionGroups;
}

/**
 * Backtracking algorithm to find all valid combinations
 * @param {array} optionGroups - Array of mandatory option groups
 * @param {number} groupIndex - Current group index
 * @param {array} currentTimetable - Current combination being built
 * @param {array} allTimetables - All valid combinations found
 * @param {number} maxResults - Maximum number of results to find
 */
function backtrackOptionGroups(
    optionGroups,
    groupIndex,
    currentTimetable,
    allTimetables,
    maxResults,
    constrainedFamilies,
    selectedFacultyByFamily,
    batchPreference
) {
    // Stop if we've found enough timetables
    if (allTimetables.length >= maxResults) {
        return;
    }

    // Base case: all groups processed
    if (groupIndex >= optionGroups.length) {
        if (currentTimetable.length > 0) {
            allTimetables.push([...currentTimetable]);
        }
        return;
    }

    const currentGroupOptions = optionGroups[groupIndex].options;
    const currentSlots = currentTimetable.map(c => c.slot);

    for (const option of currentGroupOptions) {
        const facultyAssignment = tryAssignFacultyConstraint(option, constrainedFamilies, selectedFacultyByFamily);
        if (!facultyAssignment.ok) {
            continue;
        }

        if (hasClash(option.slot, currentSlots)) {
            undoFacultyAssignment(facultyAssignment, selectedFacultyByFamily);
            continue;
        }

        currentTimetable.push(option);
        backtrackOptionGroups(
            optionGroups,
            groupIndex + 1,
            currentTimetable,
            allTimetables,
            maxResults,
            constrainedFamilies,
            selectedFacultyByFamily,
            batchPreference
        );
        currentTimetable.pop();
        undoFacultyAssignment(facultyAssignment, selectedFacultyByFamily);

        if (allTimetables.length >= maxResults) {
            return;
        }
    }
}

/**
 * Relaxed backtracking:
 * choose one option from a group when possible, or skip group if unavoidable,
 * while maximizing total selected groups.
 */
function backtrackOptionGroupsRelaxed(
    optionGroups,
    groupIndex,
    currentTimetable,
    excludedGroupKeys,
    selectedGroupsCount,
    allTimetables,
    tracker,
    maxResults,
    constrainedFamilies,
    selectedFacultyByFamily,
    batchPreference
) {
    const remainingGroups = optionGroups.length - groupIndex;
    if (selectedGroupsCount + remainingGroups < tracker.bestSelectedGroups) {
        return;
    }

    if (groupIndex >= optionGroups.length) {
        if (selectedGroupsCount <= 0) {
            return;
        }

        if (selectedGroupsCount > tracker.bestSelectedGroups) {
            tracker.bestSelectedGroups = selectedGroupsCount;
            allTimetables.length = 0;
            tracker.seen.clear();
        }

        if (selectedGroupsCount === tracker.bestSelectedGroups && allTimetables.length < maxResults) {
            if (validateTimetableBatchPurity(currentTimetable, batchPreference)) {
                const courseSignature = currentTimetable
                    .map((course) => [course.courseCode, course.courseType, course.slot, course.faculty, course.venue].join('|'))
                    .sort()
                    .join('||');
                const excludedSignature = [...excludedGroupKeys].sort().join('|');
                const signature = `${courseSignature}##${excludedSignature}`;
                if (!tracker.seen.has(signature)) {
                    tracker.seen.add(signature);
                    allTimetables.push({
                        courses: [...currentTimetable],
                        excludedGroupKeys: [...excludedGroupKeys]
                    });
                }
            }
        }
        return;
    }

    const currentGroup = optionGroups[groupIndex];
    const currentSlots = currentTimetable.map((c) => c.slot);

    for (const option of currentGroup.options) {
        const facultyAssignment = tryAssignFacultyConstraint(option, constrainedFamilies, selectedFacultyByFamily);
        if (!facultyAssignment.ok) {
            continue;
        }

        if (hasClash(option.slot, currentSlots)) {
            undoFacultyAssignment(facultyAssignment, selectedFacultyByFamily);
            continue;
        }

        currentTimetable.push(option);
        backtrackOptionGroupsRelaxed(
            optionGroups,
            groupIndex + 1,
            currentTimetable,
            excludedGroupKeys,
            selectedGroupsCount + 1,
            allTimetables,
            tracker,
            maxResults,
            constrainedFamilies,
            selectedFacultyByFamily,
            batchPreference
        );
        currentTimetable.pop();
        undoFacultyAssignment(facultyAssignment, selectedFacultyByFamily);
    }

    backtrackOptionGroupsRelaxed(
        optionGroups,
        groupIndex + 1,
        currentTimetable,
        [...excludedGroupKeys, currentGroup.groupKey],
        selectedGroupsCount,
        allTimetables,
        tracker,
        maxResults,
        constrainedFamilies,
        selectedFacultyByFamily,
        batchPreference
    );
}

/**
 * Convert course list to structured timetable schedule
 * @param {array} courses - Array of courses in the timetable
 * @returns {object} Schedule organized by day
 */
function createSchedule(courses) {
    const schedule = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: []
    };

    courses.forEach(course => {
        const timeSlots = getTimeSlots(course.slot);

        timeSlots.forEach(({ day, time, slot }) => {
            if (schedule[day]) {
                schedule[day].push({
                    courseCode: course.courseCode,
                    courseName: course.courseName,
                    category: course.category,
                    registrationType: course.registrationType,
                    slot: slot,
                    courseType: course.courseType,
                    faculty: course.faculty,
                    venue: course.venue,
                    startTime: time.split('-')[0],
                    endTime: time.split('-')[1]
                });
            }
        });
    });

    // Sort each day by start time
    Object.keys(schedule).forEach(day => {
        schedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return schedule;
}

/**
 * Calculate timetable features for AI ranking
 * @param {object} schedule - Timetable schedule
 * @returns {object} Features object
 */
function calculateFeatures(schedule) {
    const features = {
        earliestFinishTime: '00:00',
        latestStartTime: '23:59',
        totalFreeDays: 0,
        consecutiveClasses: 0,
        morningClassCount: 0,
        eveningClassCount: 0
    };

    let maxConsecutive = 0;
    let currentConsecutive = 0;

    Object.keys(schedule).forEach(day => {
        const classes = schedule[day];

        if (classes.length === 0) {
            features.totalFreeDays++;
            currentConsecutive = 0;
        } else {
            // Find earliest start and latest finish for the day
            const dayStart = classes[0].startTime;
            const dayEnd = classes[classes.length - 1].endTime;

            if (dayStart < features.latestStartTime) {
                features.latestStartTime = dayStart;
            }

            if (dayEnd > features.earliestFinishTime) {
                features.earliestFinishTime = dayEnd;
            }

            // Count morning vs evening classes
            classes.forEach(cls => {
                const hour = parseInt(cls.startTime.split(':')[0]);
                if (hour < 12) {
                    features.morningClassCount++;
                } else {
                    features.eveningClassCount++;
                }
            });

            // Track consecutive class days
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        }
    });

    features.consecutiveClasses = maxConsecutive;

    return features;
}

/**
 * Generate timetables with full metadata
 * @param {array} courses - Array of course objects
 * @param {object} preferences - User preferences
 * @returns {array} Array of timetable objects with schedules and features
 */
function generateWithMetadata(courses, preferences = {}) {
    const combinations = generateCombinations(courses, preferences);

    return combinations.map((combo, index) => {
        const courseList = combo.courses;
        const schedule = createSchedule(courseList);
        const features = calculateFeatures(schedule);

        const ttBatch = getTimetableBatch(courseList);
        return {
            timetableId: `TT-${Date.now()}-${index}`,
            batch: ttBatch,
            courses: courseList,
            schedule,
            features: {
                ...features,
                batchShift: ttBatch
            },
            generationMode: combo.generationMode,
            excludedCourseGroups: combo.excludedGroupKeys,
            totalCourses: courseList.length,
            totalCredits: courseList.reduce((sum, c) => sum + (c.credits || 0), 0)
        };
    });
}

/**
 * Generate timetable variants without enforcing clash checks.
 * This is a last-resort fallback to still provide options for manual review.
 * @param {array} courses
 * @param {object} preferences
 * @returns {array}
 */
function generateWithoutClashConstraint(courses, preferences = {}) {
    const {
        batchPreference = 'Morning',
        maxTimetables = 50
    } = preferences;

    if (!Array.isArray(courses) || courses.length === 0) {
        return [];
    }

    if (batchPreference === 'Both') {
        const half = Math.ceil(maxTimetables / 2);
        const m = generateWithoutClashConstraint(courses, { ...preferences, batchPreference: 'Morning', maxTimetables: half });
        const e = generateWithoutClashConstraint(courses, { ...preferences, batchPreference: 'Evening', maxTimetables: half });
        return [...m, ...e];
    }

    const optionGroups = buildCourseOptionGroups(courses, batchPreference);
    if (optionGroups.length === 0) {
        return [];
    }

    if (optionGroups.some((group) => !group.options || group.options.length === 0)) {
        return [];
    }

    const radices = optionGroups.map((group) => group.options.length);
    const constrainedFamilies = buildFacultyConstraintFamilies(optionGroups);
    const maxCombinations = radices.reduce((acc, radix) => acc * radix, 1);
    const limit = Math.min(maxTimetables, maxCombinations);
    const variants = [];
    const seen = new Set();

    for (let seed = 0; variants.length < limit && seed < maxCombinations; seed++) {
        let quotient = seed;
        const selected = [];

        for (let i = 0; i < optionGroups.length; i++) {
            const group = optionGroups[i];
            const radix = radices[i];
            const choiceIndex = quotient % radix;
            quotient = Math.floor(quotient / radix);
            selected.push(group.options[choiceIndex]);
        }

        const signature = selected
            .map((course) => [course.courseCode, course.courseType, course.slot, course.faculty, course.venue].join('|'))
            .sort()
            .join('||');

        if (!passesFacultyConsistency(selected, constrainedFamilies)) {
            continue;
        }

        if (seen.has(signature)) {
            continue;
        }

        seen.add(signature);
        const schedule = createSchedule(selected);
        const features = calculateFeatures(schedule);
        variants.push({
            timetableId: `TT-FALLBACK-${Date.now()}-${variants.length}`,
            courses: selected,
            schedule,
            features,
            generationMode: 'fallback_non_clash_checked',
            excludedCourseGroups: [],
            totalCourses: selected.length,
            totalCredits: selected.reduce((sum, c) => sum + (c.credits || 0), 0)
        });
    }

    return variants;
}

module.exports = {
    generateTimetables,
    generateWithMetadata,
    generateWithoutClashConstraint,
    createSchedule,
    calculateFeatures
};
