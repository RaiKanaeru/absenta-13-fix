// Test script untuk login siswa dengan password yang sudah diperbaiki
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testStudentLoginFixed() {
    console.log('🔍 Testing student login with fixed password...');
    
    try {
        // Test login siswa1
        console.log('\n1. Testing login: siswa1 / siswa123');
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
        
        if (loginData.success) {
            console.log('✅ LOGIN SUCCESS!');
            console.log('📊 User data:', JSON.stringify(loginData.user, null, 2));
            
            const token = loginData.token;
            
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
                
                // Test jadwal hari ini
                console.log('\n3. Testing jadwal hari ini...');
                const jadwalResponse = await fetch(`${API_BASE}/api/siswa/${loginData.user.id}/jadwal-hari-ini`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const jadwalData = await jadwalResponse.json();
                console.log('📊 Jadwal status:', jadwalResponse.status);
                console.log('📊 Jadwal data:', JSON.stringify(jadwalData, null, 2));
                
                if (jadwalResponse.status === 200) {
                    console.log('✅ Jadwal hari ini working!');
                } else {
                    console.log('❌ Jadwal hari ini failed');
                }
                
                // Test presensi siswa
                console.log('\n4. Testing presensi siswa...');
                const presensiResponse = await fetch(`${API_BASE}/api/siswa/${loginData.user.id}/presensi`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const presensiData = await presensiResponse.json();
                console.log('📊 Presensi status:', presensiResponse.status);
                console.log('📊 Presensi data:', JSON.stringify(presensiData, null, 2));
                
                if (presensiResponse.status === 200) {
                    console.log('✅ Presensi siswa working!');
                } else {
                    console.log('❌ Presensi siswa failed');
                }
                
                console.log('\n🎉 Student flow audit completed successfully!');
                
            } else {
                console.log('❌ Student info endpoint failed');
            }
            
        } else {
            console.log('❌ Login failed:', loginData.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testStudentLoginFixed();
