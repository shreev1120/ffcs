const mongoose = require('mongoose');
const User = require('./models/User');
const GeneratedTimetable = require('./models/GeneratedTimetable');
const ActivityLog = require('./models/ActivityLog');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ffcs-agent';

async function seedData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get or create test user
        let user = await User.findOne({ vitEmail: 'browser.test.user@vitstudent.ac.in' });
        if (!user) {
            console.log('Test user not found, creating...');
            const { hashPassword } = require('./utils/auth');
            user = await User.create({
                vitEmail: 'browser.test.user@vitstudent.ac.in',
                passwordHash: hashPassword('Test@12345'),
                name: 'Browser Test User',
                whatsappNumber: '9999999999',
                registrationNumber: '21BCE0999'
            });
        }

        const userId = user._id;

        // 2. Create Activity Logs
        await ActivityLog.deleteMany({ userId }); // Clean start
        await ActivityLog.create([
            {
                userId,
                action: 'Logged In',
                details: 'Login successful via verification script',
                timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
            },
            {
                userId,
                action: 'Preferences Updated',
                details: 'Set preference to Morning slots',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
            }
        ]);
        console.log('Activity logs seeded');

        // 3. Create Generated Timetable (Mock)
        await GeneratedTimetable.deleteMany({ userId }); // Clean start
        await GeneratedTimetable.create({
            userId,
            semesterConfigId: new mongoose.Types.ObjectId(), // Fake ID
            timetables: [{
                timetableId: 'dummy-1',
                schedule: {},
                features: {
                    totalFreeDays: 2,
                    morningClassCount: 0,
                    eveningClassCount: 5
                },
                rankingScore: 95
            }],
            generatedAt: new Date()
        });
        console.log('Generated mock timetable seeded');

        console.log('✅ Seeding complete');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedData();
