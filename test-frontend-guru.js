// Test Frontend Guru Integration
import 'dotenv/config';

const testFrontendGuru = async () => {
    try {
        console.log('🧪 Testing frontend guru integration...');
        
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
        
        // Step 2: Test guru endpoint (simulate frontend call)
        const guruResponse = await fetch('http://localhost:3001/api/admin/guru', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const guruData = await guruResponse.json();
        console.log('✅ Guru endpoint successful');
        
        // Simulate frontend data processing
        let teachers;
        if (guruData.success && guruData.data) {
            teachers = guruData.data;
        } else {
            teachers = guruData;
        }
        
        const teachersArray = Array.isArray(teachers) ? teachers : [];
        console.log(`📊 Processed teachers data: ${teachersArray.length} teachers`);
        
        if (teachersArray.length > 0) {
            console.log('✅ Frontend guru integration successful!');
            console.log('\n📋 Table structure preview:');
            console.log('# | NIP | Nama Lengkap | Username | Email | No. Telepon | Jenis Kelamin | Mata Pelajaran | Status');
            console.log('-'.repeat(120));
            
            teachersArray.slice(0, 5).forEach((teacher, index) => {
                const row = [
                    (index + 1).toString().padEnd(2),
                    (teacher.nip || '-').padEnd(15),
                    (teacher.nama || '-').substring(0, 20).padEnd(20),
                    (teacher.username || '-').padEnd(15),
                    (teacher.email || '-').substring(0, 25).padEnd(25),
                    (teacher.no_telp || '-').padEnd(12),
                    (teacher.jenis_kelamin === 'L' ? 'Laki-laki' : teacher.jenis_kelamin === 'P' ? 'Perempuan' : '-').padEnd(12),
                    (teacher.nama_mapel || '-').padEnd(15),
                    (teacher.status || 'aktif')
                ].join(' | ');
                console.log(row);
            });
        } else {
            console.log('❌ No teachers found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testFrontendGuru();
