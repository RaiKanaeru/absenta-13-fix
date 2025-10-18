// Test script untuk login siswa menggunakan data dari tabel pengguna
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testStudentWithPengguna() {
    console.log('🔍 Testing student login with pengguna table data...');
    
    const testCredentials = [
        { username: 'siswa1', password: 'siswa123' },
        { username: 'siswa2', password: 'siswa123' },
        { username: 'siswa3', password: 'siswa123' },
        { username: 'siswa4', password: 'siswa123' },
        { username: 'siswa5', password: 'siswa123' }
    ];
    
    for (let i = 0; i < testCredentials.length; i++) {
        const cred = testCredentials[i];
        console.log(`\n${i + 1}. Testing: ${cred.username} / ${cred.password}`);
        
        try {
            const loginResponse = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cred)
            });
            
            const loginData = await loginResponse.json();
            console.log('📊 Login response:', JSON.stringify(loginData, null, 2));
            
            if (loginData.success) {
                console.log('✅ LOGIN SUCCESS!');
                console.log('📊 User data:', JSON.stringify(loginData.user, null, 2));
                
                if (loginData.user.role === 'siswa' || loginData.user.role === 'KETOS') {
                    console.log('🎯 This is a student account! Testing student endpoints...');
                    
                    const token = loginData.token;
                    
                    // Test student info
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
                        console.log('\n4. Testing jadwal hari ini...');
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
                        
                        return; // Found working student account
                    } else {
                        console.log('❌ Student info endpoint failed');
                    }
                } else {
                    console.log('ℹ️ This is not a student account (role:', loginData.user.role, ')');
                }
            } else {
                console.log('❌ Login failed:', loginData.error);
            }
        } catch (error) {
            console.log('❌ Request failed:', error.message);
        }
    }
    
    console.log('\n❌ No working student credentials found');
}

testStudentWithPengguna();
