import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test credentials
const CREDENTIALS = {
    guru: { username: 'guru001', password: 'admin123' }
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
    console.log('🔐 Testing Login');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/login', {
        method: 'POST',
        body: JSON.stringify(CREDENTIALS.guru)
    });
    
    if (result.status === 200 && result.data.success) {
        console.log('✅ Login successful');
        return result.data.data.token;
    } else {
        console.log('❌ Login failed:', result.data);
        throw new Error('Login failed');
    }
}

// Test attendance submission with detailed debugging
async function testAttendanceSubmission(token) {
    console.log('\n📤 Testing Attendance Submission');
    console.log('='.repeat(50));
    
    const attendanceData = {
        scheduleId: 1022, // Use first schedule from previous test
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
    console.log('📤 Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });
    
    const result = await apiCall('/api/attendance/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceData)
    });
    
    console.log('📤 Response status:', result.status);
    console.log('📤 Response data:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 200) {
        console.log('✅ Attendance submission successful');
        return result.data;
    } else {
        console.log('❌ Attendance submission failed');
        return null;
    }
}

// Test with different Content-Type
async function testAttendanceWithDifferentContentType(token) {
    console.log('\n📤 Testing with different Content-Type');
    console.log('='.repeat(50));
    
    const attendanceData = {
        scheduleId: 1022,
        attendance: { 1: 'Hadir' },
        notes: { 1: 'Test' }
    };
    
    // Test with application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('scheduleId', '1022');
    formData.append('attendance', JSON.stringify({ 1: 'Hadir' }));
    formData.append('notes', JSON.stringify({ 1: 'Test' }));
    
    const result = await fetch(`${BASE_URL}/api/attendance/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    const data = await result.json();
    
    console.log('📤 Form data response status:', result.status);
    console.log('📤 Form data response:', JSON.stringify(data, null, 2));
    
    return { status: result.status, data };
}

// Test with raw JSON string
async function testAttendanceWithRawJSON(token) {
    console.log('\n📤 Testing with raw JSON string');
    console.log('='.repeat(50));
    
    const attendanceData = {
        scheduleId: 1022,
        attendance: { 1: 'Hadir' },
        notes: { 1: 'Test' }
    };
    
    const result = await fetch(`${BASE_URL}/api/attendance/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceData)
    });
    
    const data = await result.json();
    
    console.log('📤 Raw JSON response status:', result.status);
    console.log('📤 Raw JSON response:', JSON.stringify(data, null, 2));
    
    return { status: result.status, data };
}

// Main test function
async function runDebugTests() {
    try {
        console.log('🚀 Starting Attendance Debug Tests');
        console.log('='.repeat(60));
        
        // Test 1: Login
        const token = await testLogin();
        
        if (token) {
            // Test 2: Attendance submission
            await testAttendanceSubmission(token);
            
            // Test 3: Different Content-Type
            await testAttendanceWithDifferentContentType(token);
            
            // Test 4: Raw JSON
            await testAttendanceWithRawJSON(token);
        }
        
        console.log('\n🎉 Debug tests completed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run tests
runDebugTests();


