// Test script untuk endpoint siswa setelah restart
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testSiswaEndpointFixed() {
    console.log('🔍 Testing siswa endpoint after server restart...');
    
    try {
        // 1. Login first
        console.log('\n1. Logging in...');
        const loginResponse = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful:', loginData.success);
        
        if (!loginData.success || !loginData.token) {
            throw new Error('Login failed');
        }
        
        const token = loginData.token;
        
        // 2. Test siswa endpoint
        console.log('\n2. Testing /api/admin/siswa...');
        const siswaResponse = await fetch(`${API_BASE}/api/admin/siswa`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const siswaData = await siswaResponse.json();
        console.log('📊 Response status:', siswaResponse.status);
        console.log('📊 Response data:', JSON.stringify(siswaData, null, 2));
        
        if (siswaResponse.status === 200 && siswaData.success) {
            console.log('✅ Siswa endpoint working correctly');
            console.log('📋 Siswa data count:', siswaData.data?.length || 0);
        } else {
            console.log('❌ Siswa endpoint failed');
        }
        
        console.log('\n🎉 Siswa endpoint test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSiswaEndpointFixed();
