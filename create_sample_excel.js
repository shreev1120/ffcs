const xlsx = require('xlsx');
const path = require('path');

const sampleData = [
    {
        'Course Code': 'CSE1001',
        'Course Title': 'Problem Solving and Object Oriented Programming',
        'Credits': '3-0-0-0-3',
        'Slot': 'A1+TA1',
        'Faculty': 'Dr. Alice Smith',
        'Venue': 'SJT101',
        'Course Type': 'Theory'
    },
    {
        'Course Code': 'CSE1002',
        'Course Title': 'Data Structures and Algorithms',
        'Credits': '3-0-2-0-4',
        'Slot': 'B1+TB1',
        'Faculty': 'Dr. Bob Johnson',
        'Venue': 'SJT102',
        'Course Type': 'Theory'
    },
    {
        'Course Code': 'CSE1003',
        'Course Title': 'Database Management Systems',
        'Credits': '3-0-0-0-3',
        'Slot': 'C1+TC1',
        'Faculty': 'Dr. Charlie Brown',
        'Venue': 'SJT103',
        'Course Type': 'Theory'
    },
    {
        'Course Code': 'CSE1004',
        'Course Title': 'Operating Systems',
        'Credits': '3-0-2-0-4',
        'Slot': 'D1+TD1',
        'Faculty': 'Dr. David Wilson',
        'Venue': 'SJT104',
        'Course Type': 'Theory'
    },
    {
        'Course Code': 'CSE1005',
        'Course Title': 'Computer Networks',
        'Credits': '3-0-0-0-3',
        'Slot': 'E1+TE1',
        'Faculty': 'Dr. Eve Adams',
        'Venue': 'SJT105',
        'Course Type': 'Theory'
    },
    {
        'Course Code': 'CSE1006',
        'Course Title': 'Digital Logic and Design',
        'Credits': '3-0-2-0-4',
        'Slot': 'F1+TF1',
        'Faculty': 'Dr. Frank Miller',
        'Venue': 'SJT106',
        'Course Type': 'Theory'
    },
    {
        'Course Code': 'CSE1007',
        'Course Title': 'Software Engineering',
        'Credits': '3-0-0-0-3',
        'Slot': 'G1+TG1',
        'Faculty': 'Dr. Grace Hopper',
        'Venue': 'SJT107',
        'Course Type': 'Theory'
    },
    {
        'Course Code': 'CSE1001L',
        'Course Title': 'Problem Solving Lab',
        'Credits': '0-0-2-0-1',
        'Slot': 'L1+L2',
        'Faculty': 'Dr. Alice Smith',
        'Venue': 'TT201',
        'Course Type': 'Lab'
    },
    {
        'Course Code': 'CSE1002L',
        'Course Title': 'Data Structures Lab',
        'Credits': '0-0-2-0-1',
        'Slot': 'L3+L4',
        'Faculty': 'Dr. Bob Johnson',
        'Venue': 'TT202',
        'Course Type': 'Lab'
    }
];

function createSampleExcel() {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(sampleData);
    xlsx.utils.book_append_sheet(wb, ws, 'Courses');

    const outputPath = path.join(process.cwd(), 'sample_courses.xlsx');
    xlsx.writeFile(wb, outputPath);
    console.log(`✅ Sample Excel file created at: ${outputPath}`);
}

createSampleExcel();
