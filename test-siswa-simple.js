import fetch from 'node-fetch';

async function testSiswaSimple() {
    try {
        console.log('🧪 Testing siswa endpoints...');
        
        // First login to get token
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'test_guru',
                password: 'admin123'
            })
        });
        
        const loginData = await loginResponse.json();
        
        if (!loginData.success) {
            console.log('❌ Login failed:', loginData.message);
            return;
        }
        
        const token = loginData.data.token;
        console.log('✅ Login successful, token obtained');
        
        // Test GET siswa perwakilan
        console.log('\n📊 Testing GET /api/admin/siswa-perwakilan...');
        const getResponse = await fetch('http://localhost:3001/api/admin/siswa-perwakilan', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const getData = await getResponse.json();
        console.log('📊 GET Response status:', getResponse.status);
        console.log('📊 GET Response data:', JSON.stringify(getData, null, 2));
        
        if (getData.success) {
            console.log('✅ GET siswa perwakilan successful!');
            console.log(`📊 Found ${getData.data ? getData.data.length : 0} students`);
        } else {
            console.log('❌ GET siswa perwakilan failed:', getData.message);
        }
        
        // Test POST siswa perwakilan
        console.log('\n📊 Testing POST /api/admin/siswa-perwakilan...');
        const postResponse = await fetch('http://localhost:3001/api/admin/siswa-perwakilan', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'siswa_test_' + Date.now(),
                nama: 'Siswa Test',
                email: 'siswa_test@smkn13bandung.sch.id'
            })
        });
        
        const postData = await postResponse.json();
        console.log('📊 POST Response status:', postResponse.status);
        console.log('📊 POST Response data:', JSON.stringify(postData, null, 2));
        
        if (postData.success) {
            console.log('✅ POST siswa perwakilan successful!');
        } else {
            console.log('❌ POST siswa perwakilan failed:', postData.message);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testSiswaSimple();
