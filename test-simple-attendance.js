import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test credentials
const GURU_CREDENTIALS = {
    username: 'guru002',
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

// Test login
async function testLogin() {
    console.log('🔐 Testing login...');
    
    const result = await apiCall('/api/login', {
        method: 'POST',
        body: JSON.stringify(GURU_CREDENTIALS)
    });
    
    console.log('Login result:', {
        status: result.status,
        success: result.data.success,
        error: result.data.error
    });
    
    if (result.status === 200 && result.data.success) {
        console.log('✅ Login successful');
        return result.data.token;
    } else {
        console.log('❌ Login failed');
        return null;
    }
}

// Test attendance submission
async function testAttendanceSubmission(token) {
    console.log('\n📤 Testing attendance submission...');
    
    const attendanceData = {
        scheduleId: 1, // Use a test schedule ID
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
    
    console.log('Submitting attendance data:', attendanceData);
    
    const result = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceData)
    });
    
    console.log('Submission result:', {
        status: result.status,
        success: result.data.success,
        message: result.data.message,
        error: result.data.error
    });
    
    return result;
}

// Test duplicate submission
async function testDuplicateSubmission(token) {
    console.log('\n🔄 Testing duplicate submission...');
    
    const attendanceData = {
        scheduleId: 1, // Use same schedule ID
        attendance: {
            1: 'Sakit', // Changed status
            2: 'Alpa',  // Changed status
            3: 'Hadir'  // Changed status
        },
        notes: {
            1: 'Updated note 1',
            2: 'Updated note 2',
            3: 'Updated note 3'
        }
    };
    
    console.log('Submitting duplicate attendance data:', attendanceData);
    
    const result = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceData)
    });
    
    console.log('Duplicate submission result:', {
        status: result.status,
        success: result.data.success,
        message: result.data.message,
        error: result.data.error
    });
    
    return result;
}

// Main test
async function runTest() {
    try {
        console.log('🚀 Starting Simple Attendance Test');
        console.log('='.repeat(50));
        
        // Test login
        const token = await testLogin();
        
        if (!token) {
            console.log('❌ Cannot proceed without token');
            return;
        }
        
        // Test first submission
        const result1 = await testAttendanceSubmission(token);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test duplicate submission
        const result2 = await testDuplicateSubmission(token);
        
        console.log('\n📊 TEST SUMMARY:');
        console.log('='.repeat(50));
        console.log(`First submission: ${result1.status === 200 ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Duplicate submission: ${result2.status === 200 ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        if (result1.status === 200 && result2.status === 200) {
            console.log('\n🎉 All tests passed! Duplicate prevention is working.');
        } else {
            console.log('\n⚠️ Some tests failed. Check the logs above.');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

// Run test
runTest();


