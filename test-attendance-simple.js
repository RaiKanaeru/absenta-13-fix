import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test attendance submission with a hardcoded token (from previous successful login)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJndXJ1MDAxIiwibmFtYSI6Ikd1cnUgMSIsInJvbGUiOiJndXJ1IiwiZ3VydV9pZCI6NCwibmlwIjoiMTk3MDAyMTUxOTkwMDMxMDA0IiwibWFwZWwiOiJCYWhhc2EgSW5nZ3JpcyIsImlhdCI6MTc1OTc5OTg1NiwiZXhwIjoxNzU5ODg2MjU2fQ.VjSGaiB8bG7tYC5at8v80rJFHw8-LOZCQWaA18CqaNQ';

async function testAttendanceSubmission() {
    console.log('📤 Testing Attendance Submission');
    console.log('='.repeat(50));
    
    const attendanceData = {
        scheduleId: 1022,
        attendance: {
            1: 'Hadir',
            2: 'Hadir',
            3: 'Izin'
        },
        notes: {
            1: 'Hadir tepat waktu',
            2: 'Hadir tepat waktu',
            3: 'Izin keperluan keluarga'
        }
    };
    
    console.log('📤 Request data:', JSON.stringify(attendanceData, null, 2));
    
    try {
        const response = await fetch(`${BASE_URL}/api/attendance/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_TOKEN}`
            },
            body: JSON.stringify(attendanceData)
        });
        
        const data = await response.json();
        
        console.log('📤 Response status:', response.status);
        console.log('📤 Response data:', JSON.stringify(data, null, 2));
        
        if (response.status === 200) {
            console.log('✅ Attendance submission successful');
        } else {
            console.log('❌ Attendance submission failed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run test
testAttendanceSubmission();


