# AI Coding Agent Instructions for WhatsApp FFCS Agent

## Project Overview
This is a WhatsApp-first timetable generation system for VIT students using FFCS data. Architecture: WhatsApp → n8n workflows → Express API → MongoDB. Key components: Excel parsing, backtracking timetable generation, VIT slot mapping.

## Core Architecture
- **Backend**: Express.js with Mongoose ODM in `backend/`
- **Database**: MongoDB with schemas in `backend/models/` (User, Course, SemesterConfig, GeneratedTimetable)
- **Services**: `backend/services/excelParser.js` (xlsx library), `backend/services/timetableGenerator.js` (backtracking algorithm)
- **Frontend**: React/Vite/TypeScript with Tailwind CSS and shadcn/ui in `frontend/`
- **Utils**: `backend/utils/slotMapping.js` - VIT's complex slot system (A1-G2 theory, L1-L60 labs, batch preferences)

## VIT Slot System Essentials
- **Theory slots**: A1-E1 (MWF), F1-G1 (TT), TA1-TF1 (Tue/Thu mornings); *2 series for evenings
- **Lab slots**: L1-L10 mornings, L31-L40 evenings (2-hour blocks)
- **Batch filtering**: Morning (*1/L1-10), Evening (*2/L31-40), Both
- Use `getSlotInfo()`, `doSlotsClash()`, `filterCoursesByBatch()` from `utils/slotMapping.js`

## Development Workflows
- **Start backend**: `cd backend && npm run dev` (nodemon), MongoDB required
- **Start frontend**: `cd frontend && npm run dev`
- **Test**: `npm test` (Jest), integration tests in `test:integration`
- **Excel parsing**: Upload to `/api/timetable/upload-excel`, parsed via `services/excelParser.js`
- **Timetable generation**: POST `/api/timetable/generate` with `semesterConfigId` and preferences

## Key Patterns & Conventions
- **Models**: Use Mongoose schemas with refs (e.g., `semesterConfigId` in Course)
- **API responses**: JSON with `error` field for failures, data object for success
- **File uploads**: Multer with Excel validation, stored in `uploads/` directory
- **Preferences object**: `{batchPreference: 'Morning|Evening|Both', rankingCriteria: 'earliest_finish|no_morning|max_free_days|balanced', maxTimetables: 5}`
- **Timetable structure**: Map of day → array of class objects with `courseCode`, `slot`, `startTime`, `endTime`
- **Error handling**: Try-catch blocks, return 400/500 with descriptive messages

## Common Tasks
- **Add new ranking criteria**: Extend enum in `SemesterConfig.preferences.rankingCriteria` and implement in `timetableGenerator.js`
- **Parse new Excel format**: Update `services/excelParser.js` column mappings
- **Add slot validation**: Use `utils/slotMapping.js` functions for clash detection
- **Extend API**: Add routes in `routes/timetable.js`, import in `server.js`

## Testing Approach
- Unit tests for utilities (slot mapping, clash detection)
- Integration tests for API endpoints with test database
- Mock Excel files in `uploads/` for parsing tests