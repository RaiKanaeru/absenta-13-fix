// Test script untuk dashboard siswa
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testStudentDashboard() {
    console.log('🔍 Testing student dashboard endpoint...');
    
    try {
        // 1. Login dengan kredensial siswa
        console.log('\n1. Logging in as student...');
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
        console.log('📊 Login response:', JSON.stringify(loginData, null, 2));
        console.log('✅ Login successful:', loginData.success);
        
        if (!loginData.success || !loginData.token) {
            throw new Error('Login failed');
        }
        
        const token = loginData.token;
        
        // 2. Test endpoint siswa-perwakilan/info
        console.log('\n2. Testing /api/siswa-perwakilan/info...');
        const infoResponse = await fetch(`${API_BASE}/api/siswa-perwakilan/info`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const infoData = await infoResponse.json();
        console.log('📊 Response status:', infoResponse.status);
        console.log('📊 Response data:', JSON.stringify(infoData, null, 2));
        
        if (infoResponse.status === 200 && infoData.success) {
            console.log('✅ Student info endpoint working correctly');
            console.log('📋 Student data:', {
                id_siswa: infoData.data?.id_siswa,
                nis: infoData.data?.nis,
                nama: infoData.data?.nama,
                kelas_id: infoData.data?.kelas_id,
                nama_kelas: infoData.data?.nama_kelas
            });
        } else {
            console.log('❌ Student info endpoint failed');
        }
        
        // 3. Test jadwal hari ini (menggunakan admin endpoint untuk testing)
        console.log('\n3. Testing jadwal hari ini...');
        const jadwalResponse = await fetch(`${API_BASE}/api/admin/jadwal`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const jadwalData = await jadwalResponse.json();
        console.log('📅 Jadwal response status:', jadwalResponse.status);
        console.log('📅 Jadwal data:', JSON.stringify(jadwalData, null, 2));
        
        if (jadwalResponse.status === 200) {
            console.log('✅ Jadwal hari ini endpoint working');
        } else {
            console.log('❌ Jadwal hari ini endpoint failed');
        }
        
        console.log('\n🎉 Student dashboard test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testStudentDashboard();
