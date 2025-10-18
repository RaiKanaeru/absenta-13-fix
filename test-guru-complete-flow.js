// Test script untuk audit lengkap fitur guru
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testGuruCompleteFlow() {
    console.log('🔍 AUDIT REAL-TIME: Testing Complete Guru Flow...');
    
    try {
        // 1. Test login guru
        console.log('\n1. Testing guru login...');
        const loginResponse = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'guru_matematika',
                password: 'guru123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('📊 Login response:', JSON.stringify(loginData, null, 2));
        
        if (!loginData.success) {
            console.log('❌ Guru login failed - trying alternative credentials...');
            
            // Try with different guru credentials
            const altLoginResponse = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'admin',
                    password: 'admin123'
                })
            });
            
            const altLoginData = await altLoginResponse.json();
            console.log('📊 Alternative login response:', JSON.stringify(altLoginData, null, 2));
            
            if (!altLoginData.success) {
                console.log('❌ All login attempts failed');
                return;
            }
            
            var token = altLoginData.token;
            var userData = altLoginData.user;
        } else {
            var token = loginData.token;
            var userData = loginData.user;
        }
        
        console.log('✅ Login successful');
        
        // 2. Test guru info endpoint
        console.log('\n2. Testing guru info endpoint...');
        const infoResponse = await fetch(`${API_BASE}/api/guru/info`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const infoData = await infoResponse.json();
        console.log('📊 Guru info status:', infoResponse.status);
        console.log('📊 Guru info data:', JSON.stringify(infoData, null, 2));
        
        if (infoResponse.status === 200 && infoData.success) {
            console.log('✅ Guru info endpoint working');
        } else {
            console.log('❌ Guru info endpoint failed');
        }
        
        // 3. Test jadwal guru
        console.log('\n3. Testing jadwal guru...');
        const jadwalResponse = await fetch(`${API_BASE}/api/guru/jadwal`, {
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
            console.log('✅ Jadwal guru working');
        } else {
            console.log('❌ Jadwal guru failed');
        }
        
        // 4. Test presensi guru
        console.log('\n4. Testing presensi guru...');
        const presensiResponse = await fetch(`${API_BASE}/api/guru/presensi`, {
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
            console.log('✅ Presensi guru working');
        } else {
            console.log('❌ Presensi guru failed');
        }
        
        // 5. Test submit presensi
        console.log('\n5. Testing submit presensi...');
        const submitResponse = await fetch(`${API_BASE}/api/attendance/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                siswa_id: 1,
                jadwal_id: 1,
                tanggal: '2025-01-17',
                status: 'HADIR',
                keterangan: 'Test presensi'
            })
        });
        
        const submitData = await submitResponse.json();
        console.log('📊 Submit status:', submitResponse.status);
        console.log('📊 Submit data:', JSON.stringify(submitData, null, 2));
        
        if (submitResponse.status === 200) {
            console.log('✅ Submit presensi working');
        } else {
            console.log('❌ Submit presensi failed');
        }
        
        console.log('\n🎉 Guru flow audit completed!');
        
    } catch (error) {
        console.error('❌ Guru flow test failed:', error.message);
    }
}

testGuruCompleteFlow();
