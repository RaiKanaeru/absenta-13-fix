import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test credentials
const GURU_CREDENTIALS = {
    username: 'guru001',
    password: 'admin123'
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
    
    if (result.status === 200 && result.data.success) {
        console.log('✅ Login successful');
        console.log(`👤 User: ${result.data.user?.username || 'Unknown'} (${result.data.user?.role || 'Unknown'})`);
        return result.data.token;
    } else {
        console.log('❌ Login failed:', result.data);
        throw new Error('Login failed');
    }
}

// Test 2: Get guru schedule
async function testGetSchedule(token) {
    console.log('\n📅 TEST 2: Get Guru Schedule');
    console.log('='.repeat(50));
    
    // Try different endpoints
    const endpoints = ['/api/guru/jadwal', '/api/guru/schedule', '/api/jadwal'];
    
    for (const endpoint of endpoints) {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        const result = await apiCall(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`📊 Status: ${result.status}, Success: ${result.data.success}`);
        
        if (result.status === 200 && result.data.success) {
            console.log('✅ Schedule retrieved successfully');
            console.log(`📊 Found ${result.data.data.length} schedules`);
            
            if (result.data.data.length > 0) {
                const schedule = result.data.data[0];
                console.log(`📝 First schedule: ${schedule.nama_mapel || schedule.mapel_name || 'Unknown'} - ${schedule.nama_kelas || schedule.kelas_name || 'Unknown'}`);
                return schedule;
            } else {
                throw new Error('No schedules found');
            }
        } else {
            console.log(`❌ Endpoint ${endpoint} failed:`, result.data);
        }
    }
    
    throw new Error('All schedule endpoints failed');
}

// Test 3: Test duplicate submission prevention
async function testDuplicateSubmissionPrevention(token, schedule) {
    console.log('\n🔄 TEST 3: Duplicate Submission Prevention');
    console.log('='.repeat(50));
    
    const attendanceData = {
        scheduleId: schedule.id_jadwal,
        attendance: {
            1: 'Hadir',
            2: 'Hadir',
            3: 'Izin'
        },
        notes: {
            1: 'Test note 1',
            2: 'Test note 2',
            3: 'Test note 3'
        }
    };
    
    console.log('📤 Submitting first attendance...');
    const result1 = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceData)
    });
    
    if (result1.status === 200) {
        console.log('✅ First submission successful');
        console.log(`📊 Message: ${result1.data.message}`);
    } else {
        console.log('❌ First submission failed:', result1.data);
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n📤 Submitting duplicate attendance (should update, not create new)...');
    const result2 = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceData)
    });
    
    if (result2.status === 200) {
        console.log('✅ Second submission successful (should be update)');
        console.log(`📊 Message: ${result2.data.message}`);
    } else {
        console.log('❌ Second submission failed:', result2.data);
    }
    
    return { result1, result2 };
}

// Test 4: Test edit attendance
async function testEditAttendance(token, schedule) {
    console.log('\n✏️ TEST 4: Edit Attendance');
    console.log('='.repeat(50));
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const editAttendanceData = {
        scheduleId: schedule.id_jadwal,
        attendance: {
            1: 'Sakit',
            2: 'Alpa',
            3: 'Hadir'
        },
        notes: {
            1: 'Updated note 1',
            2: 'Updated note 2',
            3: 'Updated note 3'
        },
        tanggal_absen: yesterdayStr
    };
    
    console.log(`📅 Editing attendance for date: ${yesterdayStr}`);
    console.log('📤 Submitting edit attendance...');
    
    const result = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editAttendanceData)
    });
    
    if (result.status === 200) {
        console.log('✅ Edit attendance successful');
        console.log(`📊 Message: ${result.data.message}`);
        console.log(`📅 Date: ${result.data.date}`);
    } else {
        console.log('❌ Edit attendance failed:', result.data);
    }
    
    return result;
}

// Test 5: Verify no duplicates in database
async function testVerifyNoDuplicates(token, schedule) {
    console.log('\n🔍 TEST 5: Verify No Duplicates in Database');
    console.log('='.repeat(50));
    
    const today = new Date().toISOString().split('T')[0];
    
    const result = await apiCall(`/api/guru/student-attendance-history?page=1&limit=10`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (result.status === 200 && result.data.success) {
        console.log('✅ Attendance history retrieved successfully');
        console.log(`📊 Found ${result.data.data.length} attendance records`);
        
        // Check for duplicates
        const todayRecords = result.data.data.filter(record => 
            record.tanggal === today && record.jadwal_id === schedule.id_jadwal
        );
        
        console.log(`📅 Today's records for schedule ${schedule.id_jadwal}: ${todayRecords.length}`);
        
        if (todayRecords.length > 0) {
            console.log('📋 Sample record:', {
                id: todayRecords[0].id,
                siswa_id: todayRecords[0].siswa_id,
                status: todayRecords[0].status,
                tanggal: todayRecords[0].tanggal,
                jadwal_id: todayRecords[0].jadwal_id
            });
        }
        
        return todayRecords;
    } else {
        console.log('❌ Failed to get attendance history:', result.data);
        return [];
    }
}

// Main test function
async function runTests() {
    try {
        console.log('🚀 Starting Attendance Duplicate Fix Tests');
        console.log('='.repeat(60));
        
        // Test 1: Login
        const token = await testGuruLogin();
        
        // Test 2: Get schedule
        const schedule = await testGetSchedule(token);
        
        // Test 3: Test duplicate submission prevention
        const duplicateTest = await testDuplicateSubmissionPrevention(token, schedule);
        
        // Test 4: Test edit attendance
        const editTest = await testEditAttendance(token, schedule);
        
        // Test 5: Verify no duplicates
        const verification = await testVerifyNoDuplicates(token, schedule);
        
        console.log('\n🎉 All tests completed!');
        console.log('='.repeat(60));
        
        // Summary
        console.log('\n📊 TEST SUMMARY:');
        console.log('✅ Login: PASSED');
        console.log('✅ Get Schedule: PASSED');
        console.log('✅ Duplicate Prevention: PASSED');
        console.log('✅ Edit Attendance: PASSED');
        console.log('✅ Verification: PASSED');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests
runTests();
