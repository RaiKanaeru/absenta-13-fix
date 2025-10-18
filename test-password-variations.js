// Test script untuk mencoba berbagai password
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testPasswordVariations() {
    console.log('🔍 Testing password variations for siswa1...');
    
    const passwordVariations = [
        'siswa123',
        'admin123',
        'password',
        '123456',
        'siswa1',
        'qori123',
        'qori.sari',
        'Qori123',
        'Qori Sari',
        'qori.sari@student.smkn13bandung.sch.id'
    ];
    
    for (let i = 0; i < passwordVariations.length; i++) {
        const password = passwordVariations[i];
        console.log(`\n${i + 1}. Testing: siswa1 / ${password}`);
        
        try {
            const loginResponse = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'siswa1',
                    password: password
                })
            });
            
            const loginData = await loginResponse.json();
            
            if (loginData.success) {
                console.log('✅ LOGIN SUCCESS!');
                console.log('📊 User data:', JSON.stringify(loginData.user, null, 2));
                return;
            } else {
                console.log('❌ Login failed:', loginData.error);
            }
        } catch (error) {
            console.log('❌ Request failed:', error.message);
        }
    }
    
    console.log('\n❌ No working password found');
}

testPasswordVariations();
