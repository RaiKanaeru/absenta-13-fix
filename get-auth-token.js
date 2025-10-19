const fetch = require('node-fetch');

async function getAuthToken() {
    console.log('🔐 Getting authentication token...');
    
    try {
        // Login dengan kredensial siswa
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'siswa1', // Ganti dengan username siswa yang valid
                password: 'password123' // Ganti dengan password yang valid
            })
        });
        
        if (!loginResponse.ok) {
            console.error('❌ Login failed:', loginResponse.status);
            const errorData = await loginResponse.json();
            console.error('Error details:', errorData);
            return null;
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log('👤 User:', loginData.user);
        console.log('🔑 Token:', loginData.token);
        
        return loginData.token;
        
    } catch (error) {
        console.error('❌ Error getting token:', error.message);
        return null;
    }
}

// Test endpoint dengan token yang valid
async function testWithToken() {
    const token = await getAuthToken();
    
    if (!token) {
        console.log('❌ Cannot proceed without valid token');
        return;
    }
    
    console.log('\n🧪 Testing endpoint with valid token...');
    
    const testData = {
        siswa_id: 1,
        kehadiran_data: {
            "1": {
                status: "Hadir",
                keterangan: "Test dari script"
            }
        }
    };
    
    try {
        const response = await fetch('http://localhost:3001/api/siswa/submit-kehadiran-guru', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        console.log(`📊 Response status: ${response.status}`);
        console.log('📥 Response data:', JSON.stringify(result, null, 2));
        
        if (response.ok) {
            console.log('✅ Endpoint test successful!');
        } else {
            console.log('❌ Endpoint test failed');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

// Run if executed directly
if (require.main === module) {
    testWithToken().catch(console.error);
}

module.exports = { getAuthToken, testWithToken };
