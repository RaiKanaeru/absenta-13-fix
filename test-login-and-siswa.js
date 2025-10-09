// Test Login and Siswa Endpoint
import 'dotenv/config';

const testLoginAndSiswa = async () => {
    try {
        console.log('🧪 Testing login and siswa endpoint...');
        
        // Step 1: Login
        console.log('🔐 Step 1: Testing login...');
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful:', loginData.user?.username, loginData.user?.role);
        
        const token = loginData.token;
        
        // Step 2: Test siswa-perwakilan endpoint
        console.log('\n👨‍🎓 Step 2: Testing siswa-perwakilan endpoint...');
        const siswaResponse = await fetch('http://localhost:3001/api/admin/siswa-perwakilan', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!siswaResponse.ok) {
            throw new Error(`Siswa endpoint failed: ${siswaResponse.status} ${siswaResponse.statusText}`);
        }
        
        const siswaData = await siswaResponse.json();
        console.log('✅ Siswa endpoint successful');
        console.log(`Found ${siswaData.data?.length || 0} students`);
        
        if (siswaData.data && siswaData.data.length > 0) {
            console.log('Sample student data:');
            siswaData.data.slice(0, 3).forEach((student, index) => {
                console.log(`${index + 1}. ${student.nama} (${student.nis}) - ${student.nama_kelas}`);
            });
        }
        
        // Step 3: Test guru endpoint
        console.log('\n👨‍🏫 Step 3: Testing guru endpoint...');
        const guruResponse = await fetch('http://localhost:3001/api/admin/guru', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!guruResponse.ok) {
            throw new Error(`Guru endpoint failed: ${guruResponse.status} ${guruResponse.statusText}`);
        }
        
        const guruData = await guruResponse.json();
        console.log('✅ Guru endpoint successful');
        console.log(`Found ${guruData.data?.length || 0} teachers`);
        
        console.log('\n🎉 All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testLoginAndSiswa();
