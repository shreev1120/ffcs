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
        timetables.forEach(tt => {
            expect(tt.totalCredits).toBeGreaterThanOrEqual(18);
            expect(tt.totalCredits).toBeLessThanOrEqual(27);
        });
    });

    test('strictly enforces maximum 27 credits when provided courses total > 27 credits', () => {
        const excessCourses = [
            { courseCode: 'CSE101', courseName: 'C1', credits: 4, courseType: 'Theory', slot: 'A1', faculty: 'Prof A', venue: 'SJTG01' },
            { courseCode: 'CSE102', courseName: 'C2', credits: 4, courseType: 'Theory', slot: 'B1', faculty: 'Prof B', venue: 'SJTG02' },
            { courseCode: 'CSE103', courseName: 'C3', credits: 4, courseType: 'Theory', slot: 'C1', faculty: 'Prof C', venue: 'SJTG03' },
            { courseCode: 'CSE104', courseName: 'C4', credits: 4, courseType: 'Theory', slot: 'D1', faculty: 'Prof D', venue: 'SJTG04' },
            { courseCode: 'CSE105', courseName: 'C5', credits: 4, courseType: 'Theory', slot: 'E1', faculty: 'Prof E', venue: 'SJTG05' },
            { courseCode: 'CSE106', courseName: 'C6', credits: 4, courseType: 'Theory', slot: 'F1', faculty: 'Prof F', venue: 'SJTG06' },
            { courseCode: 'CSE107', courseName: 'C7', credits: 4, courseType: 'Theory', slot: 'G1', faculty: 'Prof G', venue: 'SJTG07' },
            { courseCode: 'CSE108', courseName: 'C8', credits: 4, courseType: 'Theory', slot: 'TA1', faculty: 'Prof H', venue: 'SJTG08' }
        ]; // Total raw credits = 32

        const timetables = generateWithMetadata(excessCourses, {
            batchPreference: 'Morning',
            maxTimetables: 5,
            minCredits: 18,
            maxCredits: 27
        });

        expect(timetables.length).toBeGreaterThan(0);
        timetables.forEach(tt => {
            expect(tt.totalCredits).toBeGreaterThanOrEqual(18);
            expect(tt.totalCredits).toBeLessThanOrEqual(27);
            expect(tt.totalCredits).toBe(24); // 6 courses * 4 credits = 24 <= 27
        });
    });

    test('strictly rejects timetables when total possible credits is below 18 credits', () => {
        const insufficientCourses = [
            { courseCode: 'CSE101', courseName: 'C1', credits: 4, courseType: 'Theory', slot: 'A1', faculty: 'Prof A', venue: 'SJTG01' },
            { courseCode: 'CSE102', courseName: 'C2', credits: 4, courseType: 'Theory', slot: 'B1', faculty: 'Prof B', venue: 'SJTG02' },
            { courseCode: 'CSE103', courseName: 'C3', credits: 4, courseType: 'Theory', slot: 'C1', faculty: 'Prof C', venue: 'SJTG03' }
        ]; // Total raw credits = 12 (< 18)

        const timetables = generateWithMetadata(insufficientCourses, {
            batchPreference: 'Morning',
            maxTimetables: 5,
            minCredits: 18,
            maxCredits: 27
        });

        expect(timetables.length).toBe(0);
    });
});

