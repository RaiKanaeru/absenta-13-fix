// Test script untuk audit lengkap fitur siswa
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testStudentCompleteFlow() {
    console.log('🔍 AUDIT REAL-TIME: Testing Complete Student Flow...');
    
    try {
        // 1. Test login siswa
        console.log('\n1. Testing student login...');
        const loginResponse = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'perwakilan_x_ipa1',
                password: 'siswa123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('📊 Login response:', JSON.stringify(loginData, null, 2));
        
        if (!loginData.success) {
            console.log('❌ Student login failed - checking alternative credentials...');
            
            // Try with different student credentials
            const altLoginResponse = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'siswa1',
                    password: 'siswa123'
                })
            });
            
            const altLoginData = await altLoginResponse.json();
            console.log('📊 Alternative login response:', JSON.stringify(altLoginData, null, 2));
            
            if (!altLoginData.success) {
                console.log('❌ All student login attempts failed');
                return;
            }
            
            var token = altLoginData.token;
            var userData = altLoginData.user;
        } else {
            var token = loginData.token;
            var userData = loginData.user;
        }
        
        console.log('✅ Student login successful');
        
        // 2. Test student info endpoint
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
            console.log('✅ Student info endpoint working');
        } else {
            console.log('❌ Student info endpoint failed');
        }
        
        // 3. Test jadwal hari ini
        console.log('\n3. Testing jadwal hari ini...');
        const jadwalResponse = await fetch(`${API_BASE}/api/siswa/${userData.id}/jadwal-hari-ini`, {
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
            console.log('✅ Jadwal hari ini working');
        } else {
            console.log('❌ Jadwal hari ini failed');
        }
        
        // 4. Test presensi siswa
        console.log('\n4. Testing presensi siswa...');
        const presensiResponse = await fetch(`${API_BASE}/api/siswa/${userData.id}/presensi`, {
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
            console.log('✅ Presensi siswa working');
        } else {
            console.log('❌ Presensi siswa failed');
        }
        
        console.log('\n🎉 Student flow audit completed!');
        
    } catch (error) {
        console.error('❌ Student flow test failed:', error.message);
    }
}

testStudentCompleteFlow();
