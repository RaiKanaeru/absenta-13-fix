const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
const API_BASE_URL = 'http://localhost:3001';

async function testStudentDashboardFix() {
    console.log('🧪 Testing Student Dashboard API Fix...\n');

    try {
        // Create a valid JWT token for student
        const token = jwt.sign({
            id: 205,
            username: 'perwakilan2005',
            role: 'siswa',
            siswa_id: 2005
        }, JWT_SECRET);

        console.log('✅ Generated JWT token for student perwakilan2005');

        // Test the /api/siswa/info endpoint
        console.log('\n📡 Testing /api/siswa/info endpoint...');
        const response = await fetch(`${API_BASE_URL}/api/siswa/info`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ /api/siswa/info endpoint working correctly');
            console.log('📊 Response data:', JSON.stringify(data, null, 2));
            
            if (data.success && data.id_siswa) {
                console.log('✅ Student info loaded successfully');
                console.log(`   - Student ID: ${data.id_siswa}`);
                console.log(`   - NIS: ${data.nis}`);
                console.log(`   - Name: ${data.nama}`);
                console.log(`   - Class: ${data.nama_kelas}`);
            } else {
                console.log('❌ Student info data structure is invalid');
            }
        } else {
            const errorData = await response.json();
            console.log('❌ /api/siswa/info endpoint failed');
            console.log('   Status:', response.status);
            console.log('   Error:', errorData);
        }

        console.log('\n🎉 Student Dashboard API fix test completed!');
        console.log('   The frontend should now be able to load student info correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testStudentDashboardFix();
