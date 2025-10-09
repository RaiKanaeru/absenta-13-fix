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

// Test login and token details
async function testLoginAndToken() {
    console.log('🔐 Testing Login and Token Details');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/login', {
        method: 'POST',
        body: JSON.stringify(CREDENTIALS.guru)
    });
    
    console.log('Login Response Status:', result.status);
    console.log('Login Response Data:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 200 && result.data.success) {
        console.log('✅ Login successful');
        
        const token = result.data.data.token;
        console.log('Token:', token);
        
        // Decode token to see payload
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            console.log('Token Payload:', JSON.stringify(payload, null, 2));
            
            if (payload.guru_id) {
                console.log('✅ Token contains guru_id:', payload.guru_id);
            } else {
                console.log('❌ Token missing guru_id');
            }
            
            return { token, payload };
        } catch (error) {
            console.log('❌ Error decoding token:', error.message);
            return { token, payload: null };
        }
    } else {
        console.log('❌ Login failed');
        return null;
    }
}

// Test guru info endpoint
async function testGuruInfo(token) {
    console.log('\n👤 Testing Guru Info Endpoint');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/guru/info', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    console.log('Guru Info Response Status:', result.status);
    console.log('Guru Info Response Data:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 200) {
        console.log('✅ Guru info retrieved successfully');
        return result.data;
    } else {
        console.log('❌ Failed to get guru info');
        return null;
    }
}

// Test different schedule endpoints
async function testScheduleEndpoints(token) {
    console.log('\n📅 Testing Schedule Endpoints');
    console.log('='.repeat(50));
    
    const endpoints = [
        '/api/guru/jadwal',
        '/api/jadwal',
        '/api/schedule'
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n🔍 Testing endpoint: ${endpoint}`);
        const result = await apiCall(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`Status: ${result.status}`);
        console.log(`Data: ${JSON.stringify(result.data, null, 2)}`);
        
        if (result.status === 200) {
            console.log(`✅ ${endpoint} working`);
        } else {
            console.log(`❌ ${endpoint} failed`);
        }
    }
}

// Main test function
async function runSimpleTests() {
    try {
        console.log('🚀 Starting Simple Guru Login Tests');
        console.log('='.repeat(60));
        
        // Test 1: Login and token
        const loginResult = await testLoginAndToken();
        
        if (loginResult && loginResult.token) {
            // Test 2: Guru info
            await testGuruInfo(loginResult.token);
            
            // Test 3: Schedule endpoints
            await testScheduleEndpoints(loginResult.token);
        }
        
        console.log('\n🎉 Simple tests completed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run tests
runSimpleTests();
