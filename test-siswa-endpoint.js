// Test script untuk endpoint siswa
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testSiswaEndpoint() {
    console.log('🔍 Testing siswa endpoint...');
    
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
        
        // 2. Test siswa endpoint
        console.log('\n2. Testing /api/admin/siswa...');
        const siswaResponse = await fetch(`${API_BASE}/api/admin/siswa`, {
            headers: {
                'Authorization': `Bearer ${loginData.token}`
            }
        });
        
        const siswaData = await siswaResponse.json();
        console.log('✅ Siswa endpoint response:', {
            success: siswaData.success,
            dataLength: siswaData.data?.length || 0,
            error: siswaData.error
        });
        
        if (siswaData.success && siswaData.data) {
            console.log('📊 Sample siswa data:', siswaData.data[0]);
        }
        
        // 3. Test with search
        console.log('\n3. Testing siswa endpoint with search...');
        const searchResponse = await fetch(`${API_BASE}/api/admin/siswa?search=test`, {
            headers: {
                'Authorization': `Bearer ${loginData.token}`
            }
        });
        
        const searchData = await searchResponse.json();
        console.log('✅ Search response:', {
            success: searchData.success,
            dataLength: searchData.data?.length || 0
        });
        
        console.log('\n🎉 Siswa endpoint test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSiswaEndpoint();