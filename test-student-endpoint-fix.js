// Test script untuk perbaikan endpoint siswa
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testStudentEndpointFix() {
    console.log('🔍 Testing student endpoint fix...');
    
    try {
        // Login siswa
        console.log('\n1. Logging in as student...');
        const loginResponse = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'siswa1',
                password: 'siswa123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('📊 Login response:', JSON.stringify(loginData, null, 2));
        
        if (!loginData.success) {
            console.log('❌ Student login failed');
            return;
        }
        
        const token = loginData.token;
        console.log('✅ Student login successful');
        
        // Test student info endpoint
        console.log('\n2. Testing student info endpoint...');
        const infoResponse = await fetch(`${API_BASE}/api/siswa-perwakilan/info`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const infoData = await infoResponse.json();
        console.log('📊 Student info status:', infoResponse.status);
        console.log('📊 Student info data:', JSON.stringify(infoData, null, 2));
        
        if (infoResponse.status === 200 && infoData.success) {
            console.log('✅ Student info endpoint working!');
        } else {
            console.log('❌ Student info endpoint failed');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testStudentEndpointFix();
