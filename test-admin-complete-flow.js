// Test script untuk audit lengkap fitur admin
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testAdminCompleteFlow() {
    console.log('🔍 AUDIT REAL-TIME: Testing Complete Admin Flow...');
    
    try {
        // 1. Test login admin
        console.log('\n1. Testing admin login...');
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
        
        if (!loginData.success) {
            console.log('❌ Admin login failed');
            return;
        }
        
        const token = loginData.token;
        console.log('✅ Admin login successful');
        
        // 2. Test admin dashboard endpoints
        console.log('\n2. Testing admin dashboard endpoints...');
        
        // Test siswa endpoint
        const siswaResponse = await fetch(`${API_BASE}/api/admin/siswa`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const siswaData = await siswaResponse.json();
        console.log('📊 Siswa endpoint status:', siswaResponse.status);
        if (siswaResponse.status === 200 && siswaData.success) {
            console.log('✅ Siswa endpoint working');
        } else {
            console.log('❌ Siswa endpoint failed');
        }
        
        // Test guru endpoint
        const guruResponse = await fetch(`${API_BASE}/api/admin/guru`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const guruData = await guruResponse.json();
        console.log('📊 Guru endpoint status:', guruResponse.status);
        if (guruResponse.status === 200 && guruData.success) {
            console.log('✅ Guru endpoint working');
        } else {
            console.log('❌ Guru endpoint failed');
        }
        
        // Test kelas endpoint
        const kelasResponse = await fetch(`${API_BASE}/api/admin/kelas`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const kelasData = await kelasResponse.json();
        console.log('📊 Kelas endpoint status:', kelasResponse.status);
        if (kelasResponse.status === 200 && kelasData.success) {
            console.log('✅ Kelas endpoint working');
        } else {
            console.log('❌ Kelas endpoint failed');
        }
        
        // Test jadwal endpoint
        const jadwalResponse = await fetch(`${API_BASE}/api/admin/jadwal`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const jadwalData = await jadwalResponse.json();
        console.log('📊 Jadwal endpoint status:', jadwalResponse.status);
        if (jadwalResponse.status === 200 && jadwalData.success) {
            console.log('✅ Jadwal endpoint working');
        } else {
            console.log('❌ Jadwal endpoint failed');
        }
        
        // Test mapel endpoint
        const mapelResponse = await fetch(`${API_BASE}/api/admin/mapel`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const mapelData = await mapelResponse.json();
        console.log('📊 Mapel endpoint status:', mapelResponse.status);
        if (mapelResponse.status === 200 && mapelData.success) {
            console.log('✅ Mapel endpoint working');
        } else {
            console.log('❌ Mapel endpoint failed');
        }
        
        // 3. Test CRUD operations
        console.log('\n3. Testing CRUD operations...');
        
        // Test create jadwal
        const createJadwalResponse = await fetch(`${API_BASE}/api/admin/jadwal`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kelas_id: 1,
                mapel_id: 1,
                guru_id: 1,
                hari: 'Senin',
                jam_ke: 1,
                jam_mulai: '07:00:00',
                jam_selesai: '07:45:00'
            })
        });
        
        const createJadwalData = await createJadwalResponse.json();
        console.log('📊 Create jadwal status:', createJadwalResponse.status);
        if (createJadwalResponse.status === 200) {
            console.log('✅ Create jadwal working');
        } else if (createJadwalResponse.status === 400) {
            console.log('✅ Create jadwal validation working (conflict detected)');
        } else {
            console.log('❌ Create jadwal failed');
        }
        
        // Test health endpoint
        console.log('\n4. Testing health endpoint...');
        const healthResponse = await fetch(`${API_BASE}/api/health`);
        const healthData = await healthResponse.json();
        console.log('📊 Health status:', healthResponse.status);
        if (healthResponse.status === 200) {
            console.log('✅ Health endpoint working');
        } else {
            console.log('❌ Health endpoint failed');
        }
        
        console.log('\n🎉 Admin flow audit completed!');
        
    } catch (error) {
        console.error('❌ Admin flow test failed:', error.message);
    }
}

testAdminCompleteFlow();
