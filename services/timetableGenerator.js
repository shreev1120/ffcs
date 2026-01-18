const { hasClash, filterCoursesByBatch, getTimeSlots } = require('../utils/slotMapping');

/**
 * Generate all possible clash-free timetables
 * @param {array} courses - Array of course objects
 * @param {object} preferences - User preferences
 * @returns {array} Array of valid timetable combinations
 */
function generateTimetables(courses, preferences = {}) {
    const {
        batchPreference = 'Both',
        maxTimetables = 5
    } = preferences;

    // Filter courses by batch preference
    const filteredCourses = filterCoursesByBatch(courses, batchPreference);

    if (filteredCourses.length === 0) {
        return [];
    }

    // Separate mandatory and elective courses (if applicable)
    // For now, treat all as mandatory
    const allTimetables = [];

    // Use backtracking to generate combinations
    backtrack(filteredCourses, [], allTimetables, maxTimetables * 3); // Generate more than needed for ranking

    // Limit results
    return allTimetables.slice(0, maxTimetables * 2);
}

/**
 * Backtracking algorithm to find all valid combinations
 * @param {array} remainingCourses - Courses not yet added
 * @param {array} currentTimetable - Current combination being built
 * @param {array} allTimetables - All valid combinations found
 * @param {number} maxResults - Maximum number of results to find
 */
function backtrack(remainingCourses, currentTimetable, allTimetables, maxResults) {
    // Stop if we've found enough timetables
    if (allTimetables.length >= maxResults) {
        return;
    }

    // Base case: all courses processed
    if (remainingCourses.length === 0) {
        if (currentTimetable.length > 0) {
            allTimetables.push([...currentTimetable]);
        }
        return;
    }

    const [currentCourse, ...restCourses] = remainingCourses;

    // Try including the current course
    const currentSlots = currentTimetable.map(c => c.slot);

    if (!hasClash(currentCourse.slot, currentSlots)) {
        // No clash, include this course
        currentTimetable.push(currentCourse);
        backtrack(restCourses, currentTimetable, allTimetables, maxResults);
        currentTimetable.pop(); // Backtrack
    }

    // Try excluding the current course (for electives)
    // For now, we require all courses, so we don't explore this branch
    // Uncomment below to allow optional courses:
    // backtrack(restCourses, currentTimetable, allTimetables, maxResults);
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
        Friday: []
    };

    courses.forEach(course => {
        const timeSlots = getTimeSlots(course.slot);

        timeSlots.forEach(({ day, time, slot }) => {
            if (schedule[day]) {
                schedule[day].push({
                    courseCode: course.courseCode,
                    courseName: course.courseName,
                    slot: slot,
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
    const combinations = generateTimetables(courses, preferences);

    return combinations.map((courseList, index) => {
        const schedule = createSchedule(courseList);
        const features = calculateFeatures(schedule);

        return {
            timetableId: `TT-${Date.now()}-${index}`,
            courses: courseList,
            schedule,
            features,
            totalCourses: courseList.length,
            totalCredits: courseList.reduce((sum, c) => sum + c.credits, 0)
        };
    });
}

module.exports = {
    generateTimetables,
    generateWithMetadata,
    createSchedule,
    calculateFeatures
};
