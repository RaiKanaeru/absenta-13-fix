// Test script untuk endpoint siswa setelah perbaikan
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testSiswaEndpoint() {
    console.log('🔍 Testing siswa endpoint after fixes...');
    
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
        console.log('\n2. Testing siswa endpoint...');
        const siswaResponse = await fetch(`${API_BASE}/api/admin/siswa`, {
            headers: {
                'Authorization': `Bearer ${loginData.token}`
            }
        });
        
        const siswaData = await siswaResponse.json();
        console.log('📊 Siswa response status:', siswaResponse.status);
        console.log('📊 Siswa data success:', siswaData.success);
        
        if (siswaData.success) {
            console.log('✅ Siswa endpoint working!');
            console.log('📊 Total students:', siswaData.data?.length || 0);
            console.log('📊 Sample student:', siswaData.data?.[0] || 'No data');
        } else {
            console.log('❌ Siswa endpoint error:', siswaData.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSiswaEndpoint();
