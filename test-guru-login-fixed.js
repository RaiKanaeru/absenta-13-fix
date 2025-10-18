// Test script untuk login guru dengan password yang sudah diperbaiki
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testGuruLoginFixed() {
    console.log('🔍 Testing guru login with fixed password...');
    
    try {
        // Test login guru1
        console.log('\n1. Testing login: guru1 / guru123');
        const loginResponse = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'guru1',
                password: 'guru123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('📊 Login response:', JSON.stringify(loginData, null, 2));
        
        if (loginData.success) {
            console.log('✅ LOGIN SUCCESS!');
            console.log('📊 User data:', JSON.stringify(loginData.user, null, 2));
            
            const token = loginData.token;
            
            // Test guru jadwal endpoint
            console.log('\n2. Testing guru jadwal endpoint...');
            const jadwalResponse = await fetch(`${API_BASE}/api/guru/jadwal`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const jadwalData = await jadwalResponse.json();
            console.log('📊 Guru jadwal status:', jadwalResponse.status);
            console.log('📊 Guru jadwal data:', JSON.stringify(jadwalData, null, 2));
            
            if (jadwalResponse.status === 200) {
                console.log('✅ Guru jadwal working!');
                
                // Test submit presensi
                console.log('\n3. Testing submit presensi...');
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
                        keterangan: 'Test presensi guru'
                    })
                });
                
                const submitData = await submitResponse.json();
                console.log('📊 Submit status:', submitResponse.status);
                console.log('📊 Submit data:', JSON.stringify(submitData, null, 2));
                
                if (submitResponse.status === 200) {
                    console.log('✅ Submit presensi working!');
                } else {
                    console.log('❌ Submit presensi failed');
                }
                
                console.log('\n🎉 Guru flow audit completed successfully!');
                
            } else {
                console.log('❌ Guru jadwal endpoint failed');
            }
            
        } else {
            console.log('❌ Login failed:', loginData.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testGuruLoginFixed();
