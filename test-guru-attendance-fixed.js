import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test credentials
const GURU_CREDENTIALS = {
    username: 'guru_test',
    password: 'guru123' // Ganti dengan password yang sesuai
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    return {
        status: response.status,
        statusText: response.statusText,
        data
    };
}

// Test 1: Login as guru
async function testGuruLogin() {
    console.log('\n🔐 TEST 1: Login as Guru');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/login', {
        method: 'POST',
        body: JSON.stringify(GURU_CREDENTIALS)
    });
    
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 200 && result.data.token) {
        console.log('✅ Login successful');
        console.log('👤 User data:', result.data.user);
        console.log('🎫 Token received');
        return result.data.token;
    } else {
        console.log('❌ Login failed');
        return null;
    }
}

// Test 2: Get guru schedules
async function testGetSchedules(token) {
    console.log('\n📅 TEST 2: Get Guru Schedules');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/guru/jadwal', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    console.log('Status:', result.status);
    console.log('Schedules found:', result.data?.data?.length || 0);
    
    if (result.status === 200 && result.data.data && result.data.data.length > 0) {
        console.log('✅ Schedules retrieved successfully');
        console.log('📊 First schedule:', JSON.stringify(result.data.data[0], null, 2));
        return result.data.data[0];
    } else {
        console.log('❌ No schedules found or error occurred');
        return null;
    }
}

// Test 3: Get students for a schedule
async function testGetStudents(token, scheduleId) {
    console.log('\n👨‍🎓 TEST 3: Get Students for Schedule');
    console.log('='.repeat(50));
    console.log('Schedule ID:', scheduleId);
    
    const result = await apiCall(`/api/schedules/${scheduleId}/students`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    console.log('Status:', result.status);
    console.log('Students found:', result.data?.length || 0);
    
    if (result.status === 200 && result.data && result.data.length > 0) {
        console.log('✅ Students retrieved successfully');
        console.log('📊 First student:', JSON.stringify(result.data[0], null, 2));
        return result.data;
    } else {
        console.log('❌ No students found or error occurred');
        console.log('Response:', JSON.stringify(result.data, null, 2));
        return [];
    }
}

// Test 4: Submit attendance (the main test)
async function testSubmitAttendance(token, scheduleId, students) {
    console.log('\n✍️ TEST 4: Submit Attendance');
    console.log('='.repeat(50));
    
    if (!students || students.length === 0) {
        console.log('⚠️ No students to submit attendance for');
        return false;
    }
    
    // Prepare attendance data - mark first student as present, second as absent
    const attendanceData = {};
    const notesData = {};
    
    students.forEach((student, index) => {
        if (index === 0) {
            attendanceData[student.id] = 'Hadir';
            notesData[student.id] = 'Test: Siswa hadir tepat waktu';
        } else if (index === 1) {
            attendanceData[student.id] = 'Izin';
            notesData[student.id] = 'Test: Siswa izin sakit';
        } else {
            attendanceData[student.id] = 'Hadir';
            notesData[student.id] = '';
        }
    });
    
    const requestBody = {
        scheduleId: scheduleId,
        attendance: attendanceData,
        notes: notesData
    };
    
    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
    
    const result = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 200) {
        console.log('✅ Attendance submitted successfully');
        return true;
    } else {
        console.log('❌ Attendance submission failed');
        return false;
    }
}

// Test 5: Get attendance history
async function testGetHistory(token) {
    console.log('\n📊 TEST 5: Get Student Attendance History');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/guru/student-attendance-history?page=1&limit=7', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    console.log('Status:', result.status);
    console.log('History records found:', result.data?.data?.length || 0);
    
    if (result.status === 200) {
        console.log('✅ History retrieved successfully');
        if (result.data.data && result.data.data.length > 0) {
            console.log('📊 Sample record:', JSON.stringify(result.data.data[0], null, 2));
        }
        return true;
    } else {
        console.log('❌ History retrieval failed');
        console.log('Error:', JSON.stringify(result.data, null, 2));
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('\n🧪 TESTING GURU ATTENDANCE SYSTEM - COMPREHENSIVE');
    console.log('='.repeat(60));
    console.log('Target:', BASE_URL);
    console.log('Time:', new Date().toLocaleString('id-ID'));
    
    try {
        // Test 1: Login
        const token = await testGuruLogin();
        if (!token) {
            console.log('\n❌ Cannot proceed without valid token');
            return;
        }
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test 2: Get schedules
        const schedule = await testGetSchedules(token);
        if (!schedule) {
            console.log('\n⚠️ No schedules found, skipping attendance tests');
            // But continue to test history
        }
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (schedule) {
            // Test 3: Get students
            const students = await testGetStudents(token, schedule.id);
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Test 4: Submit attendance
            if (students && students.length > 0) {
                await testSubmitAttendance(token, schedule.id, students);
                
                // Wait a bit before fetching history
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Test 5: Get history (should work regardless of previous tests)
        await testGetHistory(token);
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL TESTS COMPLETED');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n❌ TEST ERROR:', error.message);
        console.error(error.stack);
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});



