// Test Guru Username Display
import 'dotenv/config';

const testGuruUsername = async () => {
    try {
        console.log('🧪 Testing guru username display...');
        
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
        
        // Step 2: Test guru endpoint
        const guruResponse = await fetch('http://localhost:3001/api/admin/guru', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const guruData = await guruResponse.json();
        console.log('✅ Guru endpoint successful');
        
        if (guruData.data && Array.isArray(guruData.data)) {
            console.log(`Found ${guruData.data.length} teachers`);
            
            if (guruData.data.length > 0) {
                console.log('\n📊 Sample teacher data:');
                guruData.data.slice(0, 3).forEach((teacher, index) => {
                    console.log(`${index + 1}. ${teacher.nama} (${teacher.nip})`);
                    console.log(`   - Username: ${teacher.username || 'NOT FOUND'}`);
                    console.log(`   - Email: ${teacher.email || '-'}`);
                    console.log(`   - Mata Pelajaran: ${teacher.nama_mapel || '-'}`);
                    console.log(`   - Status: ${teacher.status || '-'}`);
                    console.log('');
                });
            }
        } else {
            console.log('❌ No teachers found or data is not an array');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testGuruUsername();
