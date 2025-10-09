// Test Login with Fixed JWT Handling
import 'dotenv/config';

const testLoginFixed = async () => {
    try {
        console.log('🧪 Testing login with fixed JWT handling...');
        
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
            const errorText = await loginResponse.text();
            throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText} - ${errorText}`);
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log('User:', loginData.data?.user?.username, loginData.data?.user?.role);
        console.log('Token length:', loginData.data?.token?.length);
        console.log('Token preview:', loginData.data?.token?.substring(0, 20) + '...');
        
        const token = loginData.data?.token;
        
        if (!token) {
            throw new Error('No token received from login');
        }
        
        // Step 2: Test siswa-perwakilan endpoint with proper token
        console.log('\n👨‍🎓 Step 2: Testing siswa-perwakilan endpoint...');
        const siswaResponse = await fetch('http://localhost:3001/api/admin/siswa-perwakilan', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Siswa response status:', siswaResponse.status);
        
        if (!siswaResponse.ok) {
            const errorText = await siswaResponse.text();
            console.log('Error response:', errorText);
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
        
        console.log('\n🎉 All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testLoginFixed();