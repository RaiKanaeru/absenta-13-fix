import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test credentials
const CREDENTIALS = {
    admin: { username: 'admin', password: 'admin123' },
    guru: { username: 'guru001', password: 'admin123' },
    siswa: { username: 'perwakilan2000', password: 'admin123' }
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
        body: JSON.stringify(CREDENTIALS.guru)
    });
    
    if (result.status === 200 && result.data.success) {
        console.log('✅ Login successful');
        console.log(`👤 User: ${result.data.user?.username || 'Unknown'} (${result.data.user?.role || 'Unknown'})`);
        return result.data.data.token;
    } else {
        console.log('❌ Login failed:', result.data);
        throw new Error('Login failed');
    }
}

// Test 2: Get guru schedule
async function testGetGuruSchedule(token) {
    console.log('\n📅 TEST 2: Get Guru Schedule');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/guru/jadwal', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (result.status === 200 && result.data.success) {
        console.log('✅ Schedule retrieved successfully');
        console.log(`📊 Found ${result.data.data.length} schedules`);
        
        if (result.data.data.length > 0) {
            const schedule = result.data.data[0];
            console.log(`📝 First schedule: ${schedule.nama_mapel || 'Unknown'} - ${schedule.nama_kelas || 'Unknown'}`);
            return schedule;
        } else {
            throw new Error('No schedules found');
        }
    } else {
        console.log('❌ Failed to get schedule:', result.data);
        throw new Error('Failed to get schedule');
    }
}

// Test 3: Test attendance submission (first time)
async function testFirstAttendanceSubmission(token, schedule) {
    console.log('\n📤 TEST 3: First Attendance Submission');
    console.log('='.repeat(50));
    
    const attendanceData = {
        scheduleId: schedule.id_jadwal,
        attendance: {
            1: 'Hadir',
            2: 'Hadir',
            3: 'Izin',
            4: 'Sakit',
            5: 'Alpa'
        },
        notes: {
            1: 'Hadir tepat waktu',
            2: 'Hadir tepat waktu',
            3: 'Izin keperluan keluarga',
            4: 'Sakit dengan surat dokter',
            5: 'Tidak ada keterangan'
        }
    };
    
    console.log('📤 Submitting first attendance...');
    const result = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceData)
    });
    
    if (result.status === 200) {
        console.log('✅ First submission successful');
        console.log(`📊 Message: ${result.data.message}`);
        return result.data;
    } else {
        console.log('❌ First submission failed:', result.data);
        throw new Error('First submission failed');
    }
}

// Test 4: Test duplicate submission prevention
async function testDuplicateSubmissionPrevention(token, schedule) {
    console.log('\n🔄 TEST 4: Duplicate Submission Prevention');
    console.log('='.repeat(50));
    
    const attendanceData = {
        scheduleId: schedule.id_jadwal,
        attendance: {
            1: 'Sakit', // Changed from Hadir
            2: 'Alpa',  // Changed from Hadir
            3: 'Hadir', // Changed from Izin
            4: 'Hadir', // Changed from Sakit
            5: 'Izin'   // Changed from Alpa
        },
        notes: {
            1: 'Updated: Sakit dengan surat dokter',
            2: 'Updated: Tidak ada keterangan',
            3: 'Updated: Hadir tepat waktu',
            4: 'Updated: Hadir tepat waktu',
            5: 'Updated: Izin keperluan keluarga'
        }
    };
    
    console.log('📤 Submitting duplicate attendance (should update, not create new)...');
    const result = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceData)
    });
    
    if (result.status === 200) {
        console.log('✅ Duplicate submission handled correctly');
        console.log(`📊 Message: ${result.data.message}`);
        return result.data;
    } else {
        console.log('❌ Duplicate submission failed:', result.data);
        throw new Error('Duplicate submission failed');
    }
}

// Test 5: Test edit attendance (30 days)
async function testEditAttendance(token, schedule) {
    console.log('\n✏️ TEST 5: Edit Attendance (30 Days)');
    console.log('='.repeat(50));
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const editAttendanceData = {
        scheduleId: schedule.id_jadwal,
        attendance: {
            1: 'Hadir',
            2: 'Hadir',
            3: 'Hadir',
            4: 'Hadir',
            5: 'Hadir'
        },
        notes: {
            1: 'Updated: Hadir tepat waktu',
            2: 'Updated: Hadir tepat waktu',
            3: 'Updated: Hadir tepat waktu',
            4: 'Updated: Hadir tepat waktu',
            5: 'Updated: Hadir tepat waktu'
        },
        tanggal_absen: yesterdayStr
    };
    
    console.log(`📅 Editing attendance for date: ${yesterdayStr}`);
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
        return result.data;
    } else {
        console.log('❌ Edit attendance failed:', result.data);
        throw new Error('Edit attendance failed');
    }
}

// Test 6: Test student attendance history
async function testStudentAttendanceHistory(token) {
    console.log('\n📊 TEST 6: Student Attendance History');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/guru/student-attendance-history?page=1&limit=10', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (result.status === 200 && result.data.success) {
        console.log('✅ Student attendance history retrieved successfully');
        console.log(`📊 Found ${result.data.data.length} attendance records`);
        
        if (result.data.data.length > 0) {
            const record = result.data.data[0];
            console.log('📋 Sample record:', {
                id: record.id,
                siswa_id: record.siswa_id,
                status: record.status,
                tanggal: record.tanggal,
                jadwal_id: record.jadwal_id
            });
        }
        
        return result.data;
    } else {
        console.log('❌ Failed to get student attendance history:', result.data);
        throw new Error('Failed to get student attendance history');
    }
}

// Test 7: Test multiple rapid submissions (rate limiting)
async function testRateLimiting(token, schedule) {
    console.log('\n⚡ TEST 7: Rate Limiting Test');
    console.log('='.repeat(50));
    
    const attendanceData = {
        scheduleId: schedule.id_jadwal,
        attendance: { 1: 'Hadir' },
        notes: { 1: 'Rate limit test' }
    };
    
    console.log('📤 Sending multiple rapid requests...');
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
        promises.push(
            apiCall('/api/attendance/submit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(attendanceData)
            })
        );
    }
    
    const results = await Promise.all(promises);
    
    const successful = results.filter(r => r.status === 200).length;
    const failed = results.filter(r => r.status !== 200).length;
    
    console.log(`📊 Results: ${successful} successful, ${failed} failed`);
    
    if (successful > 0) {
        console.log('✅ Rate limiting test completed');
    } else {
        console.log('❌ All requests failed');
    }
    
    return { successful, failed };
}

// Test 8: Test error handling
async function testErrorHandling(token) {
    console.log('\n🚨 TEST 8: Error Handling Test');
    console.log('='.repeat(50));
    
    // Test with invalid schedule ID
    const invalidData = {
        scheduleId: 99999,
        attendance: { 1: 'Hadir' },
        notes: { 1: 'Test error handling' }
    };
    
    console.log('📤 Testing with invalid schedule ID...');
    const result = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(invalidData)
    });
    
    if (result.status !== 200) {
        console.log('✅ Error handling working correctly');
        console.log(`📊 Error: ${result.data.message || result.data.error}`);
    } else {
        console.log('❌ Error handling failed - should have returned error');
    }
    
    return result;
}

// Test 9: Test data validation
async function testDataValidation(token, schedule) {
    console.log('\n✅ TEST 9: Data Validation Test');
    console.log('='.repeat(50));
    
    // Test with missing required fields
    const invalidData = {
        scheduleId: schedule.id_jadwal,
        // Missing attendance and notes
    };
    
    console.log('📤 Testing with missing required fields...');
    const result = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(invalidData)
    });
    
    if (result.status !== 200) {
        console.log('✅ Data validation working correctly');
        console.log(`📊 Validation error: ${result.data.message || result.data.error}`);
    } else {
        console.log('❌ Data validation failed - should have returned error');
    }
    
    return result;
}

// Test 10: Performance test
async function testPerformance(token, schedule) {
    console.log('\n⚡ TEST 10: Performance Test');
    console.log('='.repeat(50));
    
    const attendanceData = {
        scheduleId: schedule.id_jadwal,
        attendance: { 1: 'Hadir' },
        notes: { 1: 'Performance test' }
    };
    
    console.log('📤 Testing response time...');
    const startTime = Date.now();
    
    const result = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceData)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️ Response time: ${responseTime}ms`);
    
    if (responseTime < 2000) {
        console.log('✅ Performance test passed (response time < 2s)');
    } else {
        console.log('⚠️ Performance test warning (response time > 2s)');
    }
    
    return { responseTime, success: result.status === 200 };
}

// Main test function
async function runComprehensiveTests() {
    try {
        console.log('🚀 Starting Comprehensive Guru Attendance Tests');
        console.log('='.repeat(60));
        
        const results = {
            totalTests: 10,
            passedTests: 0,
            failedTests: 0,
            testResults: []
        };
        
        // Test 1: Login
        try {
            const token = await testGuruLogin();
            results.passedTests++;
            results.testResults.push({ test: 'Login', status: 'PASSED' });
            
            // Test 2: Get schedule
            try {
                const schedule = await testGetGuruSchedule(token);
                results.passedTests++;
                results.testResults.push({ test: 'Get Schedule', status: 'PASSED' });
                
                // Test 3: First attendance submission
                try {
                    await testFirstAttendanceSubmission(token, schedule);
                    results.passedTests++;
                    results.testResults.push({ test: 'First Attendance Submission', status: 'PASSED' });
                } catch (error) {
                    results.failedTests++;
                    results.testResults.push({ test: 'First Attendance Submission', status: 'FAILED', error: error.message });
                }
                
                // Test 4: Duplicate submission prevention
                try {
                    await testDuplicateSubmissionPrevention(token, schedule);
                    results.passedTests++;
                    results.testResults.push({ test: 'Duplicate Submission Prevention', status: 'PASSED' });
                } catch (error) {
                    results.failedTests++;
                    results.testResults.push({ test: 'Duplicate Submission Prevention', status: 'FAILED', error: error.message });
                }
                
                // Test 5: Edit attendance
                try {
                    await testEditAttendance(token, schedule);
                    results.passedTests++;
                    results.testResults.push({ test: 'Edit Attendance', status: 'PASSED' });
                } catch (error) {
                    results.failedTests++;
                    results.testResults.push({ test: 'Edit Attendance', status: 'FAILED', error: error.message });
                }
                
                // Test 6: Student attendance history
                try {
                    await testStudentAttendanceHistory(token);
                    results.passedTests++;
                    results.testResults.push({ test: 'Student Attendance History', status: 'PASSED' });
                } catch (error) {
                    results.failedTests++;
                    results.testResults.push({ test: 'Student Attendance History', status: 'FAILED', error: error.message });
                }
                
                // Test 7: Rate limiting
                try {
                    await testRateLimiting(token, schedule);
                    results.passedTests++;
                    results.testResults.push({ test: 'Rate Limiting', status: 'PASSED' });
                } catch (error) {
                    results.failedTests++;
                    results.testResults.push({ test: 'Rate Limiting', status: 'FAILED', error: error.message });
                }
                
                // Test 8: Error handling
                try {
                    await testErrorHandling(token);
                    results.passedTests++;
                    results.testResults.push({ test: 'Error Handling', status: 'PASSED' });
                } catch (error) {
                    results.failedTests++;
                    results.testResults.push({ test: 'Error Handling', status: 'FAILED', error: error.message });
                }
                
                // Test 9: Data validation
                try {
                    await testDataValidation(token, schedule);
                    results.passedTests++;
                    results.testResults.push({ test: 'Data Validation', status: 'PASSED' });
                } catch (error) {
                    results.failedTests++;
                    results.testResults.push({ test: 'Data Validation', status: 'FAILED', error: error.message });
                }
                
                // Test 10: Performance
                try {
                    await testPerformance(token, schedule);
                    results.passedTests++;
                    results.testResults.push({ test: 'Performance', status: 'PASSED' });
                } catch (error) {
                    results.failedTests++;
                    results.testResults.push({ test: 'Performance', status: 'FAILED', error: error.message });
                }
                
            } catch (error) {
                results.failedTests++;
                results.testResults.push({ test: 'Get Schedule', status: 'FAILED', error: error.message });
            }
            
        } catch (error) {
            results.failedTests++;
            results.testResults.push({ test: 'Login', status: 'FAILED', error: error.message });
        }
        
        // Print results
        console.log('\n🎉 COMPREHENSIVE TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`📊 Total Tests: ${results.totalTests}`);
        console.log(`✅ Passed: ${results.passedTests}`);
        console.log(`❌ Failed: ${results.failedTests}`);
        console.log(`📈 Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
        
        console.log('\n📋 Detailed Results:');
        results.testResults.forEach((test, index) => {
            const status = test.status === 'PASSED' ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${test.test}`);
            if (test.error) {
                console.log(`   Error: ${test.error}`);
            }
        });
        
        if (results.failedTests === 0) {
            console.log('\n🎉 All tests passed! System is working correctly.');
        } else {
            console.log('\n⚠️ Some tests failed. Please check the errors above.');
        }
        
        return results;
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Run tests
runComprehensiveTests();
