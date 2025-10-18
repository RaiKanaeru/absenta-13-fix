// Test script untuk login guru dengan berbagai kredensial
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testGuruLoginVariations() {
    console.log('🔍 Testing guru login variations...');
    
    const testCredentials = [
        { username: 'guru1', password: 'guru123' },
        { username: 'guru1', password: 'admin123' },
        { username: 'guru1', password: 'password' },
        { username: 'guru1', password: '123456' },
        { username: 'guru2', password: 'guru123' },
        { username: 'guru2', password: 'admin123' },
        { username: 'guru_matematika', password: 'guru123' },
        { username: 'guru_matematika', password: 'admin123' }
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
            
            if (loginData.success) {
                console.log('✅ LOGIN SUCCESS!');
                console.log('📊 User data:', JSON.stringify(loginData.user, null, 2));
                
                if (loginData.user.role === 'guru') {
                    console.log('🎯 This is a guru account! Testing guru endpoints...');
                    
                    const token = loginData.token;
                    
                    // Test guru jadwal
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
                        return; // Found working guru account
                    }
                } else {
                    console.log('ℹ️ This is not a guru account (role:', loginData.user.role, ')');
                }
            } else {
                console.log('❌ Login failed:', loginData.error);
            }
        } catch (error) {
            console.log('❌ Request failed:', error.message);
        }
    }
    
    console.log('\n❌ No working guru credentials found');
}

testGuruLoginVariations();
