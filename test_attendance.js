import fetch from 'node-fetch';

async function testAttendanceSubmission() {
    try {
        // First, login to get a token
        console.log('🔐 Logging in...');
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'kepsek', // Use the default teacher username
                password: 'password123' // Default password
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login successful:', loginData);

        const token = loginData.token;
        if (!token) {
            throw new Error('No token received from login');
        }

        // Test attendance submission
        console.log('📤 Testing attendance submission...');
        const attendanceData = {
            scheduleId: 1120, // Use a valid schedule ID
            attendance: {
                249: 'Hadir',
                2004: 'Hadir'
            },
            notes: {
                249: 'Test note',
                2004: ''
            },
            tanggal_absen: undefined
        };

        console.log('📊 Sending data:', JSON.stringify(attendanceData, null, 2));

        const attendanceResponse = await fetch('http://localhost:3001/api/attendance/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(attendanceData)
        });

        console.log('📊 Response status:', attendanceResponse.status);
        console.log('📊 Response headers:', Object.fromEntries(attendanceResponse.headers.entries()));

        const responseText = await attendanceResponse.text();
        console.log('📊 Response body:', responseText);

        if (attendanceResponse.ok) {
            console.log('✅ Attendance submission successful!');
        } else {
            console.log('❌ Attendance submission failed!');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testAttendanceSubmission();
