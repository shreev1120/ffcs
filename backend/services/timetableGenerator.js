const {
    hasClash,
    filterCoursesByBatch,
    convertLabSlotForBatch,
    isLabCourse,
    getTimeSlots,
    validateTimetableBatchPurity,
    getTimetableBatch
} = require('../utils/slotMapping');

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
    const familyTheoryFaculties = new Map();
    const familyLabFaculties = new Map();

    optionGroups.forEach((group) => {
        (group.options || []).forEach((opt) => {
            const familyKey = getCourseFamilyKey(opt.courseCode);
            const kind = getCourseComponentKind(opt);
            const faculty = normalizeFacultyName(opt.faculty);
            if (!faculty || kind === 'OTHER') return;

            if (kind === 'THEORY') {
                if (!familyTheoryFaculties.has(familyKey)) familyTheoryFaculties.set(familyKey, new Set());
                familyTheoryFaculties.get(familyKey).add(faculty);
            } else if (kind === 'LAB') {
                if (!familyLabFaculties.has(familyKey)) familyLabFaculties.set(familyKey, new Set());
                familyLabFaculties.get(familyKey).add(faculty);
            }
        });
    });

    const constrained = new Set();
    familyTheoryFaculties.forEach((theoryFaculties, familyKey) => {
        const labFaculties = familyLabFaculties.get(familyKey);
        if (labFaculties && labFaculties.size > 0) {
            // Only constrain if there is at least one common faculty between Theory and Lab options!
            const hasCommonFaculty = [...theoryFaculties].some((f) => labFaculties.has(f));
            if (hasCommonFaculty) {
                constrained.add(familyKey);
            }
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
        maxTimetables = 50,
        minCredits = 18,
        maxCredits = 27
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
            maxTimetables: half,
            minCredits,
            maxCredits
        });
        const eveningCombos = generateCombinations(courses, {
            ...preferences,
            batchPreference: 'Evening',
            maxTimetables: half,
            minCredits,
            maxCredits
        });
        return [...morningCombos, ...eveningCombos];
    }

    const optionGroups = buildCourseOptionGroups(courses, batchPreference);
    if (optionGroups.length === 0) {
        return [];
    }

    // Branch & Bound precomputations for credit limits:
    const groupMaxCredits = optionGroups.map((g) =>
        Math.max(0, ...(g.options || []).map((o) => (o.credits !== undefined && !isNaN(Number(o.credits)) ? Number(o.credits) : 3)))
    );
    const suffixMaxCredits = new Array(optionGroups.length + 1).fill(0);
    for (let i = optionGroups.length - 1; i >= 0; i--) {
        suffixMaxCredits[i] = suffixMaxCredits[i + 1] + groupMaxCredits[i];
    }

    // If total possible credits across all available courses is less than minimum credits,
    // no combination can ever reach minCredits.
    if (suffixMaxCredits[0] < minCredits) {
        return [];
    }

    const constrainedFamilies = buildFacultyConstraintFamilies(optionGroups);

    // Strict mode: requires picking one option from every course group
    const strictCombinations = [];
    backtrackOptionGroups(
        optionGroups,
        0,
        [],
        0,
        strictCombinations,
        maxTimetables,
        constrainedFamilies,
        new Map(),
        batchPreference,
        minCredits,
        maxCredits
    );
    if (strictCombinations.length > 0) {
        return strictCombinations.map((courses) => ({
            courses,
            excludedGroupKeys: [],
            generationMode: 'strict'
        }));
    }

    // Relaxed mode: skips unavoidable clashes and/or selects valid subsets within [minCredits, maxCredits]
    const relaxedCombinations = [];
    const tracker = {
        bestSelectedGroups: -1,
        seen: new Set()
    };
    backtrackOptionGroupsRelaxed(
        optionGroups,
        0,
        [],
        0,
        [],
        0,
        relaxedCombinations,
        tracker,
        maxTimetables,
        constrainedFamilies,
        new Map(),
        batchPreference,
        minCredits,
        maxCredits,
        suffixMaxCredits
    );

    // Sort relaxed combinations to prioritize higher course counts and higher credits within [minCredits, maxCredits]
    relaxedCombinations.sort((a, b) => {
        const diffCount = b.courses.length - a.courses.length;
        if (diffCount !== 0) return diffCount;
        const bCr = b.courses.reduce((sum, c) => sum + (c.credits || 0), 0);
        const aCr = a.courses.reduce((sum, c) => sum + (c.credits || 0), 0);
        return bCr - aCr;
    });

    const finalCombos = relaxedCombinations.slice(0, maxTimetables);

    return finalCombos.map((combo) => ({
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
        let candidateOptions = options;

        if (batchPreference !== 'Both') {
            let preferred = filterCoursesByBatch(options, batchPreference);

            // If a lab course has no options matching the batch shift directly,
            // adapt its lab slot to the target batch shift (L(n) <-> L(n + 30))!
            // Morning batch gets Evening labs (L31 to L60).
            // Evening batch gets Morning labs (L1 to L30).
            if (preferred.length === 0 && options.some(isLabCourse)) {
                const adapted = options.map((opt) => {
                    if (isLabCourse(opt)) {
                        const newSlot = convertLabSlotForBatch(opt.slot, batchPreference);
                        return { ...opt, slot: newSlot };
                    }
                    return opt;
                });
                preferred = filterCoursesByBatch(adapted, batchPreference);
            }

            candidateOptions = preferred;
        }

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
 * @param {number} currentCredits - Accumulated credits in current combination
 * @param {array} allTimetables - All valid combinations found
 * @param {number} maxResults - Maximum number of results to find
 * @param {Set} constrainedFamilies
 * @param {Map} selectedFacultyByFamily
 * @param {string} batchPreference
 * @param {number} minCredits - Minimum credit boundary (default 18)
 * @param {number} maxCredits - Maximum credit boundary (default 27)
 */
function backtrackOptionGroups(
    optionGroups,
    groupIndex,
    currentTimetable,
    currentCredits,
    allTimetables,
    maxResults,
    constrainedFamilies,
    selectedFacultyByFamily,
    batchPreference,
    minCredits,
    maxCredits
) {
    // Stop if we've found enough timetables
    if (allTimetables.length >= maxResults) {
        return;
    }

    // Base case: all groups processed
    if (groupIndex >= optionGroups.length) {
        if (currentTimetable.length > 0 && currentCredits >= minCredits && currentCredits <= maxCredits) {
            allTimetables.push([...currentTimetable]);
        }
        return;
    }

    const currentGroupOptions = optionGroups[groupIndex].options;
    const currentSlots = currentTimetable.map(c => c.slot);

    for (const option of currentGroupOptions) {
        const optCredits = option.credits !== undefined && !isNaN(Number(option.credits)) ? Number(option.credits) : 3;
        if (currentCredits + optCredits > maxCredits) {
            continue; // Prune: cannot exceed maxCredits (27)
        }

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
            currentCredits + optCredits,
            allTimetables,
            maxResults,
            constrainedFamilies,
            selectedFacultyByFamily,
            batchPreference,
            minCredits,
            maxCredits
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
 * selecting clash-free subsets within [minCredits, maxCredits].
 */
function backtrackOptionGroupsRelaxed(
    optionGroups,
    groupIndex,
    currentTimetable,
    currentCredits,
    excludedGroupKeys,
    selectedGroupsCount,
    allTimetables,
    tracker,
    maxResults,
    constrainedFamilies,
    selectedFacultyByFamily,
    batchPreference,
    minCredits,
    maxCredits,
    suffixMaxCredits
) {
    const remainingGroups = optionGroups.length - groupIndex;

    // Prune branches that cannot reach within 1 group of current best known solution
    if (tracker.bestSelectedGroups > 0 && selectedGroupsCount + remainingGroups < tracker.bestSelectedGroups - 1) {
        return;
    }

    // Branch & Bound: Prune branches that cannot reach minCredits (18) even with all remaining groups
    if (currentCredits + suffixMaxCredits[groupIndex] < minCredits) {
        return;
    }

    // Base case: all groups evaluated
    if (groupIndex >= optionGroups.length) {
        if (selectedGroupsCount <= 0 || currentCredits < minCredits || currentCredits > maxCredits) {
            return;
        }

        if (selectedGroupsCount > tracker.bestSelectedGroups) {
            tracker.bestSelectedGroups = selectedGroupsCount;
            // Retain combinations within 1 group count of new best
            const retained = allTimetables.filter((t) => t.courses.length >= tracker.bestSelectedGroups - 1);
            allTimetables.length = 0;
            tracker.seen.clear();
            retained.forEach((t) => {
                allTimetables.push(t);
                const sig = t.courses
                    .map((c) => [c.courseCode, c.courseType, c.slot, c.faculty, c.venue].join('|'))
                    .sort()
                    .join('||') + '##' + [...t.excludedGroupKeys].sort().join('|');
                tracker.seen.add(sig);
            });
        }

        if (selectedGroupsCount >= tracker.bestSelectedGroups - 1 && allTimetables.length < maxResults * 2) {
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

    // Branch 1: Try selecting options from currentGroup
    for (const option of currentGroup.options) {
        const optCredits = option.credits !== undefined && !isNaN(Number(option.credits)) ? Number(option.credits) : 3;
        if (currentCredits + optCredits > maxCredits) {
            continue; // Prune: cannot exceed maxCredits (27)
        }

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
            currentCredits + optCredits,
            excludedGroupKeys,
            selectedGroupsCount + 1,
            allTimetables,
            tracker,
            maxResults,
            constrainedFamilies,
            selectedFacultyByFamily,
            batchPreference,
            minCredits,
            maxCredits,
            suffixMaxCredits
        );
        currentTimetable.pop();
        undoFacultyAssignment(facultyAssignment, selectedFacultyByFamily);
    }

    // Branch 2: Skip this group
    backtrackOptionGroupsRelaxed(
        optionGroups,
        groupIndex + 1,
        currentTimetable,
        currentCredits,
        [...excludedGroupKeys, currentGroup.groupKey],
        selectedGroupsCount,
        allTimetables,
        tracker,
        maxResults,
        constrainedFamilies,
        selectedFacultyByFamily,
        batchPreference,
        minCredits,
        maxCredits,
        suffixMaxCredits
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
 * Convert HH:MM time string to minutes since midnight
 * @param {string} timeStr
 * @returns {number}
 */
function timeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
}

/**
 * Calculate timetable features for AI ranking
 * @param {object} schedule - Timetable schedule
 * @returns {object} Features object
 */
function calculateFeatures(schedule) {
    const features = {
        earliestFinishTime: '23:59',
        latestFinishTime: '00:00',
        earliestStartTime: '23:59',
        latestStartTime: '00:00',
        totalFreeDays: 0,
        consecutiveClasses: 0,
        morningClassCount: 0,
        eveningClassCount: 0
    };

    let maxConsecutive = 0;
    let currentConsecutive = 0;
    let hasClasses = false;

    Object.keys(schedule).forEach(day => {
        const classes = schedule[day];

        if (!classes || classes.length === 0) {
            features.totalFreeDays++;
            currentConsecutive = 0;
        } else {
            hasClasses = true;
            const dayStart = classes[0].startTime;
            const dayEnd = classes[classes.length - 1].endTime;

            if (dayStart < features.earliestStartTime) {
                features.earliestStartTime = dayStart;
            }
            if (dayStart > features.latestStartTime) {
                features.latestStartTime = dayStart;
            }

            if (dayEnd > features.latestFinishTime) {
                features.latestFinishTime = dayEnd;
            }
            if (dayEnd < features.earliestFinishTime) {
                features.earliestFinishTime = dayEnd;
            }

            // Count morning vs evening classes
            classes.forEach(cls => {
                const hour = parseInt(cls.startTime.split(':')[0], 10);
                if (hour < 12) {
                    features.morningClassCount++;
                } else {
                    features.eveningClassCount++;
                }
            });

            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        }
    });

    if (!hasClasses) {
        features.earliestStartTime = '--';
        features.latestStartTime = '--';
        features.earliestFinishTime = '--';
        features.latestFinishTime = '--';
    }

    features.consecutiveClasses = maxConsecutive;

    return features;
}

/**
 * Compute legitimate heuristic ranking score (0-100) based on selected criteria
 * @param {object} schedule - Organized weekly schedule
 * @param {object} features - Calculated timetable features
 * @param {string} rankingCriteria - 'balanced' | 'earliest_finish' | 'no_morning' | 'max_free_days'
 * @returns {{ score: number, rankingCriteria: string, summary: string }}
 */
function computeHeuristicScore(schedule, features, rankingCriteria = 'balanced') {
    const activeDays = Object.keys(schedule).filter(day => schedule[day] && schedule[day].length > 0);
    const freeDays = features.totalFreeDays || 0;

    let rawScore = 50;
    let heuristicSummary = '';

    switch (rankingCriteria) {
        case 'earliest_finish': {
            // Prioritize schedules where daily finish times are as early as possible
            let totalEndMinutes = 0;
            activeDays.forEach(day => {
                const classes = schedule[day];
                const lastClass = classes[classes.length - 1];
                totalEndMinutes += timeToMinutes(lastClass.endTime);
            });

            const avgEndMinutes = activeDays.length > 0 ? totalEndMinutes / activeDays.length : 1140;
            // Benchmark: 13:00 (780m) = 100pts, 19:30 (1170m) = 25pts (spread = 390m)
            const finishScore = Math.max(20, Math.min(100, Math.round(100 - ((avgEndMinutes - 780) / 390) * 75)));
            const freeDayBonus = freeDays * 5;
            rawScore = Math.min(100, finishScore + freeDayBonus);

            const avgH = Math.floor(avgEndMinutes / 60);
            const avgM = Math.round(avgEndMinutes % 60);
            heuristicSummary = `Average day finishes by ${String(avgH).padStart(2, '0')}:${String(avgM).padStart(2, '0')} (${freeDays} free days)`;
            break;
        }

        case 'no_morning': {
            // Prioritize avoiding 08:00 AM periods (A1/L1/L31 slots)
            let earlyStartDays = 0;
            let lateStartDays = 0;
            activeDays.forEach(day => {
                const classes = schedule[day];
                const firstStart = timeToMinutes(classes[0].startTime);
                if (firstStart <= 480) { // 08:00 AM
                    earlyStartDays++;
                } else if (firstStart >= 590) { // 09:50 AM or later
                    lateStartDays++;
                }
            });

            // 0 early morning starts = 95+ points; -20 per 8:00 AM start
            const baseLateScore = 100 - (earlyStartDays * 22) + (lateStartDays * 6);
            rawScore = Math.max(20, Math.min(100, baseLateScore));
            heuristicSummary = earlyStartDays === 0
                ? `Zero 08:00 AM classes (${lateStartDays} days starting 09:50 AM or later)`
                : `${earlyStartDays} days starting at 08:00 AM; ${lateStartDays} days with late starts`;
            break;
        }

        case 'max_free_days': {
            // Maximize days with 0 scheduled classes
            // 2+ free days = 95+ pts; 1 free day = 80 pts; 0 free days = 50 pts
            const freeScore = Math.min(100, 48 + (freeDays * 26));
            rawScore = freeScore;
            heuristicSummary = `${freeDays} complete free days; classes concentrated on ${activeDays.length} weekdays`;
            break;
        }

        case 'balanced':
        default: {
            // Optimal gaps between classes: penalize >75 min dead hours and uneven day loads
            let deadHourGaps = 0;
            let dayLoadDeviations = 0;
            const avgDailyClasses = activeDays.length > 0
                ? (features.morningClassCount + features.eveningClassCount) / activeDays.length
                : 3;

            activeDays.forEach(day => {
                const classes = schedule[day];
                dayLoadDeviations += Math.abs(classes.length - avgDailyClasses);

                for (let i = 0; i < classes.length - 1; i++) {
                    const c1 = classes[i];
                    const c2 = classes[i + 1];
                    const gap = timeToMinutes(c2.startTime) - timeToMinutes(c1.endTime);
                    if (gap > 75) {
                        deadHourGaps++;
                    }
                }
            });

            const penalty = (deadHourGaps * 12) + Math.min(25, dayLoadDeviations * 3);
            rawScore = Math.max(30, Math.min(100, 95 - penalty));
            heuristicSummary = deadHourGaps === 0
                ? `Optimal transitions between classes with minimal dead hours (${freeDays} free days)`
                : `Balanced daily distribution with ${deadHourGaps} study gap windows`;
            break;
        }
    }

    return {
        score: Math.round(rawScore),
        rankingCriteria,
        summary: heuristicSummary
    };
}

/**
 * Generate timetables with full metadata and heuristic scoring
 * @param {array} courses - Array of course objects
 * @param {object} preferences - User preferences
 * @returns {array} Array of timetable objects with schedules and features
 */
function generateWithMetadata(courses, preferences = {}) {
    const minCredits = preferences.minCredits !== undefined ? Number(preferences.minCredits) : 18;
    const maxCredits = preferences.maxCredits !== undefined ? Number(preferences.maxCredits) : 27;
    const effectivePreferences = {
        ...preferences,
        minCredits,
        maxCredits
    };

    const combinations = generateCombinations(courses, effectivePreferences);
    const rankingCriteria = effectivePreferences.rankingCriteria || 'balanced';

    const scored = combinations
        .map((combo, index) => {
            const courseList = combo.courses;
            const schedule = createSchedule(courseList);
            const features = calculateFeatures(schedule);
            const heuristic = computeHeuristicScore(schedule, features, rankingCriteria);
            const ttBatch = getTimetableBatch(courseList);
            const totalCredits = courseList.reduce((sum, c) => sum + (c.credits || 0), 0);

            return {
                timetableId: `TT-${Date.now()}-${index}`,
                batch: ttBatch,
                courses: courseList,
                schedule,
                rankingScore: heuristic.score,
                rankingCriteria: heuristic.rankingCriteria,
                heuristicSummary: heuristic.summary,
                features: {
                    ...features,
                    batchShift: ttBatch,
                    rankingScore: heuristic.score,
                    rankingCriteria: heuristic.rankingCriteria,
                    heuristicSummary: heuristic.summary
                },
                generationMode: combo.generationMode,
                excludedCourseGroups: combo.excludedGroupKeys,
                totalCourses: courseList.length,
                totalCredits
            };
        })
        .filter((tt) => tt.totalCredits >= minCredits && tt.totalCredits <= maxCredits);

    // Legitimate sorting: rank combinations highest score first!
    scored.sort((a, b) => b.rankingScore - a.rankingScore);

    // Assign rank 1..N
    scored.forEach((tt, idx) => {
        tt.rank = idx + 1;
        if (tt.features) {
            tt.features.rank = idx + 1;
        }
    });

    return scored;
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
        maxTimetables = 50,
        minCredits = 18,
        maxCredits = 27
    } = preferences;

    if (!Array.isArray(courses) || courses.length === 0) {
        return [];
    }

    if (batchPreference === 'Both') {
        const half = Math.ceil(maxTimetables / 2);
        const m = generateWithoutClashConstraint(courses, { ...preferences, batchPreference: 'Morning', maxTimetables: half, minCredits, maxCredits });
        const e = generateWithoutClashConstraint(courses, { ...preferences, batchPreference: 'Evening', maxTimetables: half, minCredits, maxCredits });
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

        if (!passesFacultyConsistency(selected, constrainedFamilies)) {
            continue;
        }

        // Ensure fallback variant strictly adheres to [minCredits, maxCredits]
        let candidateCourses = selected;
        let candidateCredits = selected.reduce((sum, c) => sum + (c.credits || 0), 0);
        if (candidateCredits > maxCredits) {
            candidateCourses = [];
            let accCredits = 0;
            for (const c of selected) {
                const cr = c.credits !== undefined && !isNaN(Number(c.credits)) ? Number(c.credits) : 3;
                if (accCredits + cr <= maxCredits) {
                    candidateCourses.push(c);
                    accCredits += cr;
                }
            }
            candidateCredits = accCredits;
        }

        if (candidateCredits < minCredits || candidateCredits > maxCredits) {
            continue;
        }

        const signature = candidateCourses
            .map((course) => [course.courseCode, course.courseType, course.slot, course.faculty, course.venue].join('|'))
            .sort()
            .join('||');

        if (seen.has(signature)) {
            continue;
        }

        seen.add(signature);
        const schedule = createSchedule(candidateCourses);
        const features = calculateFeatures(schedule);
        variants.push({
            timetableId: `TT-FALLBACK-${Date.now()}-${variants.length}`,
            courses: candidateCourses,
            schedule,
            features,
            generationMode: 'fallback_non_clash_checked',
            excludedCourseGroups: [],
            totalCourses: candidateCourses.length,
            totalCredits: candidateCredits
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
