# WhatsApp-first FFCS Agent

An AI-driven automation system that helps VIT students generate optimized, clash-free academic timetables through WhatsApp. Built with n8n workflow orchestration, Node.js/Express backend, and MongoDB.

## 🎯 Features

- **WhatsApp-First Interface**: Interact entirely through WhatsApp - no app installation needed
- **Intelligent Parsing**: Automatically extracts course data from VIT FFCS Excel exports
- **Clash-Free Generation**: Advanced backtracking algorithm ensures no slot conflicts
- **Batch Filtering**: Choose Morning, Evening, or Both batches
- **AI Ranking**: Smart ranking based on preferences (earliest finish, no mornings, max free days)
- **PDF Delivery**: Receive beautifully formatted timetables directly in WhatsApp

## 🏗️ Architecture

```
┌─────────────┐
│  WhatsApp   │ ◄─── User Interface
└──────┬──────┘
       │
┌──────▼──────┐
│     n8n     │ ◄─── Workflow Orchestration & AI Agents
└──────┬──────┘
       │
┌──────▼──────┐
│   Express   │ ◄─── Backend API & Timetable Engine
└──────┬──────┘
       │
┌──────▼──────┐
│   MongoDB   │ ◄─── Data Storage
└─────────────┘
```

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **MongoDB** (local or MongoDB Atlas)
- **n8n** (for workflow automation)
- **WhatsApp Business API** access (for Phase 4)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/shreev1120/ffcs.git
cd ffcs

# Install root, frontend and backend dependencies
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure Environment

Copy backend template to `.env` and update values:

```bash
cp backend/.env.example backend/.env
```

Default local development settings:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ffcs-agent
JWT_SECRET=your_development_jwt_secret_key
WEBHOOK_SECRET=your_development_webhook_secret_key
```

### 3. Start MongoDB

```bash
# If using local MongoDB
mongod
```

### 4. Start the Application

```bash
# Start backend server
cd backend && npm run dev

# In another terminal, start frontend
cd frontend && npm run dev
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```http
GET /health
```

### Upload Excel File
```http
POST /api/timetable/upload-excel
Content-Type: multipart/form-data

{
  "excelFile": <file>,
  "userId": "user_id",
  "semester": "Fall 2024",
  "academicYear": "2024-2025"
}
```

### Generate Timetables
```http
POST /api/timetable/generate
Content-Type: application/json

{
  "semesterConfigId": "config_id",
  "preferences": {
    "batchPreference": "Morning|Evening|Both",
    "rankingCriteria": "earliest_finish|no_morning|max_free_days|balanced",
    "maxTimetables": 5
  }
}
```

### Get User Timetables
```http
GET /api/timetable/:userId
```

### Get Semester Configuration
```http
GET /api/timetable/config/:semesterConfigId
```

## 🗂️ Project Structure

```
ffcs/
├── backend/
│   ├── models/                 # MongoDB schemas (User, Course, Timetable)
│   ├── routes/                 # API routes (auth, timetable, webhook)
│   ├── services/               # Core engine (excelParser, timetableGenerator)
│   ├── utils/                  # Auth, security middleware, slot mappings
│   ├── server.js               # Express application entrypoint
│   ├── package.json
│   └── .env.example            # Environment configuration template
├── frontend/
│   ├── src/                    # React 18, TypeScript, Tailwind, Lucide UI
│   │   ├── components/         # Accessible, responsive UI components
│   │   ├── pages/              # Portal pages (Upload, Results, Dashboard)
│   │   ├── context/            # AuthContext, ThemeContext
│   │   └── lib/                # API helpers and utilities
│   ├── package.json
│   └── vite.config.ts
├── .gitignore                  # Comprehensive secret and build exclusion rules
└── README.md
```

## 🔧 VIT Slot System

The system understands VIT's complex slot mapping:

- **Theory Slots**: A1, A2, B1, B2, C1, C2, D1, D2, E1, E2, F1, F2, G1, G2, TA1, TA2, etc.
  - *1 series = Morning batch
  - *2 series = Evening batch
- **Lab Slots**: L1-L60 (2-hour blocks)

### Slot Mapping Example
- **A1**: Monday, Wednesday, Friday @ 08:00-08:50 (Morning)
- **A2**: Monday, Wednesday, Friday @ 14:00-14:50 (Evening)
- **L1**: Monday @ 08:00-09:50 (Morning Lab)

## 🧪 Testing

### Manual Testing

1. **Create a test user**:
```bash
# Use MongoDB Compass or mongosh
use ffcs-agent
db.users.insertOne({
  vitEmail: "test@vitstudent.ac.in",
  whatsappNumber: "+1234567890",
  name: "Test User",
  conversationState: "IDLE"
})
```

2. **Upload a sample Excel file** using Postman or curl:
```bash
curl -X POST http://localhost:5000/api/timetable/upload-excel \
  -F "excelFile=@path/to/ffcs.xlsx" \
  -F "userId=<user_id>"
```

3. **Generate timetables**:
```bash
curl -X POST http://localhost:5000/api/timetable/generate \
  -H "Content-Type: application/json" \
  -d '{"semesterConfigId": "<config_id>", "preferences": {"batchPreference": "Morning"}}'
```

## 📊 Excel File Format

Your VIT FFCS Excel export should have columns:
- **Course Code** (e.g., CSE2001)
- **Course Title** (e.g., Computer Networks)
- **Credits** (e.g., 3 or 3-0-0-0-3)
- **Slot** (e.g., A1+TA1, L1+L2)
- **Faculty** (optional)
- **Venue** (optional)
- **Course Type** (optional)

## 🔄 Current Status

### ✅ Completed
- **Phase 1**: Backend scaffold with Express, MongoDB, and file upload
- **Phase 2**: Timetable generation engine with clash detection

### 🚧 In Progress
- **Phase 3**: n8n AI agents for ranking
- **Phase 4**: WhatsApp integration
- **Phase 5**: Web dashboard (optional)

## 🛣️ Roadmap

### Phase 3: n8n AI Agents
- Set up n8n instance
- Create AI description agent
- Create AI ranking agent
- Test agent workflows

### Phase 4: WhatsApp Integration
- Configure WhatsApp Business API
- Build conversation state machine
- Implement PDF generation
- End-to-end testing

### Phase 5: Web Dashboard (Optional)
- React frontend
- Upload interface
- Timetable visualization

## 🤝 Contributing

This is a VIT student project. Contributions welcome!

## 📝 License

MIT License

## 🆘 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running (`mongod` command)

### File Upload Error
```
Error: Only Excel files (.xlsx, .xls) are allowed
```
**Solution**: Ensure you're uploading a valid Excel file from VIT FFCS

### No Timetables Generated
```
Error: No valid timetables could be generated
```
**Solution**: Check for:
- All courses having slot clashes
- Batch preference too restrictive
- Invalid slot codes in Excel file

## 📧 Support

For issues or questions, please check the documentation or create an issue.

---

**Made with ❤️ for VIT Students**
