import fetch from 'node-fetch';

async function testMapel() {
    try {
        console.log('🧪 Testing mata pelajaran endpoints...');
        
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
        
        // Test GET mata pelajaran
        console.log('\n📊 Testing GET /api/admin/mapel...');
        const getResponse = await fetch('http://localhost:3001/api/admin/mapel', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const getData = await getResponse.json();
        console.log('📊 GET Response status:', getResponse.status);
        console.log('📊 GET Response data:', JSON.stringify(getData, null, 2));
        
        if (getData.success) {
            console.log('✅ GET mata pelajaran successful!');
            console.log(`📊 Found ${getData.data.subjects ? getData.data.subjects.length : 0} subjects`);
        } else {
            console.log('❌ GET mata pelajaran failed:', getData.message);
        }
        
        // Test POST mata pelajaran
        console.log('\n📊 Testing POST /api/admin/mapel...');
        const postResponse = await fetch('http://localhost:3001/api/admin/mapel', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kode_mapel: 'TEST001',
                nama_mapel: 'Mata Pelajaran Test',
                deskripsi: 'Deskripsi test mata pelajaran',
                status: 'aktif'
            })
        });
        
        const postData = await postResponse.json();
        console.log('📊 POST Response status:', postResponse.status);
        console.log('📊 POST Response data:', JSON.stringify(postData, null, 2));
        
        if (postData.success) {
            console.log('✅ POST mata pelajaran successful!');
        } else {
            console.log('❌ POST mata pelajaran failed:', postData.message);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testMapel();
