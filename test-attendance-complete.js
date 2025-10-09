import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test attendance submission with a hardcoded token
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJndXJ1MDAxIiwibmFtYSI6Ikd1cnUgMSIsInJvbGUiOiJndXJ1IiwiZ3VydV9pZCI6NCwibmlwIjoiMTk3MDAyMTUxOTkwMDMxMDA0IiwibWFwZWwiOiJCYWhhc2EgSW5nZ3JpcyIsImlhdCI6MTc1OTc5OTg1NiwiZXhwIjoxNzU5ODg2MjU2fQ.VjSGaiB8bG7tYC5at8v80rJFHw8-LOZCQWaA18CqaNQ';

async function testAttendanceSubmission() {
    console.log('📤 TEST 1: First Attendance Submission');
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
            console.log('✅ First submission successful');
            return true;
        } else {
            console.log('❌ First submission failed');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testDuplicateSubmission() {
    console.log('\n🔄 TEST 2: Duplicate Submission (Should Update)');
    console.log('='.repeat(50));
    
    const attendanceData = {
        scheduleId: 1022,
        attendance: {
            1: 'Hadir',
            2: 'Sakit', // Changed from 'Hadir' to 'Sakit'
            3: 'Hadir'  // Changed from 'Izin' to 'Hadir'
        },
        notes: {
            1: 'Hadir tepat waktu',
            2: 'Sakit demam', // Changed note
            3: 'Hadir setelah izin' // Changed note
        }
    };
    
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
            console.log('✅ Duplicate submission successful (should have updated existing data)');
            return true;
        } else {
            console.log('❌ Duplicate submission failed');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testEditAttendance() {
    console.log('\n✏️ TEST 3: Edit Attendance (30 Days)');
    console.log('='.repeat(50));
    
    const attendanceData = {
        scheduleId: 1022,
        attendance: {
            1: 'Hadir',
            2: 'Hadir',
            3: 'Hadir'
        },
        notes: {
            1: 'Hadir tepat waktu',
            2: 'Hadir tepat waktu',
            3: 'Hadir tepat waktu'
        },
        isEditMode: true,
        selectedDate: '2025-10-06' // Yesterday
    };
    
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
            console.log('✅ Edit attendance successful');
            return true;
        } else {
            console.log('❌ Edit attendance failed');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testStudentAttendanceHistory() {
    console.log('\n📊 TEST 4: Student Attendance History');
    console.log('='.repeat(50));
    
    try {
        const response = await fetch(`${BASE_URL}/api/guru/student-attendance-history?page=1&limit=10`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        });
        
        const data = await response.json();
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response data:', JSON.stringify(data, null, 2));
        
        if (response.status === 200) {
            console.log('✅ Student attendance history retrieved successfully');
            return true;
        } else {
            console.log('❌ Student attendance history failed');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Complete Attendance Tests');
    console.log('='.repeat(60));
    
    const results = {
        firstSubmission: false,
        duplicateSubmission: false,
        editAttendance: false,
        studentHistory: false
    };
    
    // Test 1: First submission
    results.firstSubmission = await testAttendanceSubmission();
    
    // Test 2: Duplicate submission (should update)
    results.duplicateSubmission = await testDuplicateSubmission();
    
    // Test 3: Edit attendance
    results.editAttendance = await testEditAttendance();
    
    // Test 4: Student attendance history
    results.studentHistory = await testStudentAttendanceHistory();
    
    // Summary
    console.log('\n🎉 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log('1. First Submission:', results.firstSubmission ? '✅ PASS' : '❌ FAIL');
    console.log('2. Duplicate Submission:', results.duplicateSubmission ? '✅ PASS' : '❌ FAIL');
    console.log('3. Edit Attendance:', results.editAttendance ? '✅ PASS' : '❌ FAIL');
    console.log('4. Student History:', results.studentHistory ? '✅ PASS' : '❌ FAIL');
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📊 Overall: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Attendance system is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please check the errors above.');
    }
}

// Run all tests
runAllTests();


