// Test Jadwal Direct
import 'dotenv/config';

const testJadwalDirect = async () => {
    try {
        console.log('🧪 Testing jadwal endpoint directly...\n');
        
        // Step 1: Login
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        const loginData = await loginResponse.json();
        const token = loginData.data?.token;
        
        if (!token) {
            throw new Error('No token received');
        }
        
        console.log('✅ Login successful');
        
        // Step 2: Test jadwal endpoint with detailed logging
        console.log('\n📅 Testing jadwal endpoint...');
        const jadwalResponse = await fetch('http://localhost:3001/api/admin/jadwal', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Response status: ${jadwalResponse.status}`);
        console.log(`Response headers:`, Object.fromEntries(jadwalResponse.headers.entries()));
        
        const responseText = await jadwalResponse.text();
        console.log(`Raw response: ${responseText}`);
        
        try {
            const jadwalData = JSON.parse(responseText);
            console.log('Parsed response:', JSON.stringify(jadwalData, null, 2));
            
            if (jadwalData.success !== undefined) {
                console.log('✅ Response has success field');
            } else {
                console.log('❌ Response missing success field');
            }
            
            if (jadwalData.data !== undefined) {
                console.log('✅ Response has data field');
                if (Array.isArray(jadwalData.data)) {
                    console.log(`✅ Data is array with ${jadwalData.data.length} items`);
                } else {
                    console.log(`❌ Data is not array: ${typeof jadwalData.data}`);
                }
            } else {
                console.log('❌ Response missing data field');
            }
            
        } catch (parseError) {
            console.log('❌ Failed to parse JSON response:', parseError.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testJadwalDirect();
