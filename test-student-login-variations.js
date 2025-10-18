// Test script untuk mencoba berbagai variasi login siswa
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testStudentLoginVariations() {
    console.log('🔍 Testing various student login variations...');
    
    const testCredentials = [
        { username: 'perwakilan_x_ipa1', password: 'siswa123' },
        { username: 'perwakilan_x_ipa1', password: 'admin123' },
        { username: 'siswa1', password: 'siswa123' },
        { username: 'siswa1', password: 'admin123' },
        { username: 'eko_wijaya', password: 'siswa123' },
        { username: 'eko_wijaya', password: 'admin123' },
        { username: '2024011060', password: 'siswa123' },
        { username: '2024011060', password: 'admin123' },
        { username: 'admin', password: 'admin123' } // Admin untuk testing
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
                
                // Test student endpoints with this user
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
                        return; // Found working student account
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

testStudentLoginVariations();
