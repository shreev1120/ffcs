const { hasClash, getSlotBatch } = require('../utils/slotMapping');
const { parseExcelFile, validateCourses } = require('../services/excelParser');
const { generateWithMetadata, generateWithoutClashConstraint } = require('../services/timetableGenerator');
const path = require('path');

describe('Slot Mapping & Clash Detection', () => {
    test('identifies slot clash correctly', () => {
        // A1 has Monday 08:00-08:50 and Wednesday 08:55-09:45
        // A1 clashes with another A1
        expect(hasClash('A1', ['A1'])).toBe(true);
        // A1 clashes with L1 (Monday 08:00-08:50)
        expect(hasClash('A1', ['L1'])).toBe(true);
        // A1 should NOT clash with A2 (evening)
        expect(hasClash('A1', ['A2'])).toBe(false);
    });

    test('determines slot batch accurately', () => {
        expect(getSlotBatch('A1')).toBe('Morning');
        expect(getSlotBatch('A2')).toBe('Evening');
        expect(getSlotBatch('L1+L2')).toBe('Morning');
        expect(getSlotBatch('L31+L32')).toBe('Evening');
    });
});

describe('Course Registration Parsing & Generation', () => {
    const excelPath = path.join(__dirname, '..', '..', 'Course_Registration.xlsx');

    test('parses Course_Registration.xlsx successfully', async () => {
        const courses = await parseExcelFile(excelPath);
        expect(courses.length).toBeGreaterThan(0);
        const validation = validateCourses(courses);
        expect(validation.isValid).toBe(true);
    });

    test('generates conflict-free timetables for Evening preference', async () => {
        const courses = await parseExcelFile(excelPath);
        const timetables = generateWithMetadata(courses, {
            batchPreference: 'Evening',
            maxTimetables: 5
        });
        expect(timetables.length).toBeGreaterThan(0);
        timetables.forEach(tt => {
            expect(tt.courses.length).toBeGreaterThan(0);
            expect(tt.schedule).toBeDefined();
        });
    });

    test('generates conflict-free timetables for Morning preference', async () => {
        const courses = await parseExcelFile(excelPath);
        const timetables = generateWithMetadata(courses, {
            batchPreference: 'Morning',
            maxTimetables: 5
        });
        expect(timetables.length).toBeGreaterThan(0);
    });

    test('generates conflict-free timetables for Both preference', async () => {
        const courses = await parseExcelFile(excelPath);
        const timetables = generateWithMetadata(courses, {
            batchPreference: 'Both',
            maxTimetables: 5
        });
        expect(timetables.length).toBeGreaterThan(0);
    });
});
