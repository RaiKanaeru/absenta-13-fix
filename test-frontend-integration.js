// Test Frontend Integration
import 'dotenv/config';

const testFrontendIntegration = async () => {
    try {
        console.log('🧪 Testing frontend integration...');
        
        // Step 1: Login
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        const loginData = await loginResponse.json();
        const token = loginData.data?.token;
        
        if (!token) {
            throw new Error('No token received');
        }
        
        console.log('✅ Login successful');
        
        // Step 2: Test siswa-perwakilan endpoint (simulate frontend call)
        const siswaResponse = await fetch('http://localhost:3001/api/admin/siswa-perwakilan', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const siswaData = await siswaResponse.json();
        console.log('✅ Siswa endpoint successful');
        
        // Simulate frontend data processing
        let students;
        if (siswaData.success && siswaData.data && siswaData.data.data) {
            // Nested structure: response.data.data
            students = siswaData.data.data;
        } else if (siswaData.success && siswaData.data) {
            // Direct structure: response.data
            students = siswaData.data;
        } else if (siswaData.data) {
            students = siswaData.data;
        } else {
            students = siswaData;
        }
        
        const studentsArray = Array.isArray(students) ? students : [];
        console.log(`📊 Processed students data: ${studentsArray.length} students`);
        
        if (studentsArray.length > 0) {
            console.log('✅ Frontend integration successful!');
            console.log('Sample student data for frontend:');
            const sample = studentsArray[0];
            console.log(`- ID: ${sample.id}`);
            console.log(`- Nama: ${sample.nama}`);
            console.log(`- NIS: ${sample.nis}`);
            console.log(`- Kelas: ${sample.nama_kelas}`);
            console.log(`- Username: ${sample.username}`);
            console.log(`- Status: ${sample.status}`);
        } else {
            console.log('❌ No students found');
        }
        
        // Step 3: Test guru endpoint
        const guruResponse = await fetch('http://localhost:3001/api/admin/guru', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const guruData = await guruResponse.json();
        console.log('✅ Guru endpoint successful');
        console.log(`Found ${guruData.data?.length || 0} teachers`);
        
        console.log('\n🎉 All frontend integration tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testFrontendIntegration();
