const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testGuruLogin() {
    try {
        console.log('🔐 Testing guru login...');
        
        // Try different guru credentials
        const credentials = [
            { username: 'guru001', password: 'password123' },
            { username: 'guru001', password: 'guru001' },
            { username: 'guru001', password: 'admin123' },
            { username: 'guru', password: 'password123' },
            { username: 'guru', password: 'guru' }
        ];
        
        for (const cred of credentials) {
            try {
                console.log(`\n🔍 Trying: ${cred.username} / ${cred.password}`);
                const loginResponse = await axios.post(`${BASE_URL}/api/login`, cred);
                
                if (loginResponse.data.success) {
                    console.log('✅ Login success!');
                    console.log('📊 User data:', JSON.stringify(loginResponse.data.data || loginResponse.data, null, 2));
                    return;
                }
            } catch (error) {
                console.log('❌ Failed:', error.response?.data?.error || error.message);
            }
        }
        
        console.log('\n❌ All login attempts failed');
        
    } catch (error) {
        console.error('❌ Test error:', error.response?.data || error.message);
    }
}

testGuruLogin();






