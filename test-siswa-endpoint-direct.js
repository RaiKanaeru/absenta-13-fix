// Test Siswa Endpoint Direct
import 'dotenv/config';

const testSiswaEndpointDirect = async () => {
    try {
        console.log('🧪 Testing siswa endpoint directly...');
        
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
        
        console.log('✅ Login successful, token received');
        
        // Step 2: Test siswa-perwakilan endpoint
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
            throw new Error(`Siswa endpoint failed: ${siswaResponse.status}`);
        }
        
        const siswaData = await siswaResponse.json();
        console.log('✅ Siswa endpoint successful');
        console.log('Response structure:', Object.keys(siswaData));
        console.log('Data type:', typeof siswaData.data);
        console.log('Data length:', Array.isArray(siswaData.data) ? siswaData.data.length : 'Not an array');
        
        if (siswaData.data && Array.isArray(siswaData.data)) {
            console.log(`Found ${siswaData.data.length} students`);
            if (siswaData.data.length > 0) {
                console.log('Sample student data:');
                console.log(JSON.stringify(siswaData.data[0], null, 2));
            }
        } else {
            console.log('No students found or data is not an array');
            console.log('Full response:', JSON.stringify(siswaData, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testSiswaEndpointDirect();
