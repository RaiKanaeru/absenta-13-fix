// Test Update Endpoints
import 'dotenv/config';

const testUpdateEndpoints = async () => {
    try {
        console.log('🧪 Testing update endpoints...\n');
        
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
        
        // Step 2: Get existing data first
        console.log('\n📊 Getting existing data...');
        
        // Get teachers
        const teachersResponse = await fetch('http://localhost:3001/api/admin/guru', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const teachersData = await teachersResponse.json();
        console.log(`📚 Found ${teachersData.data?.length || 0} teachers`);
        
        // Get students
        const studentsResponse = await fetch('http://localhost:3001/api/admin/siswa-perwakilan', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const studentsData = await studentsResponse.json();
        console.log(`👨‍🎓 Found ${studentsData.data?.length || 0} students`);
        
        // Step 3: Test teacher update
        if (teachersData.data && teachersData.data.length > 0) {
            const teacher = teachersData.data[0];
            console.log(`\n🔄 Testing teacher update for ID: ${teacher.id}`);
            console.log(`   Current data: ${teacher.nama} (${teacher.nip})`);
            
            const updateTeacherResponse = await fetch(`http://localhost:3001/api/admin/guru/${teacher.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nama: teacher.nama + ' (Updated)',
                    nip: teacher.nip,
                    email: teacher.email || 'test@example.com',
                    username: teacher.username,
                    mapel_id: teacher.mapel_id,
                    no_telp: teacher.no_telp || '08123456789',
                    alamat: teacher.alamat || 'Jl. Test No. 1',
                    jenis_kelamin: teacher.jenis_kelamin || 'L',
                    status: 'aktif'
                })
            });
            
            const updateTeacherData = await updateTeacherResponse.json();
            console.log(`   Update response: ${updateTeacherResponse.status} - ${JSON.stringify(updateTeacherData)}`);
            
            if (updateTeacherResponse.ok) {
                console.log('   ✅ Teacher update successful');
            } else {
                console.log('   ❌ Teacher update failed');
            }
        }
        
        // Step 4: Test student update
        if (studentsData.data && studentsData.data.length > 0) {
            const student = studentsData.data[0];
            console.log(`\n🔄 Testing student update for ID: ${student.id}`);
            console.log(`   Current data: ${student.nama} (${student.nis})`);
            
            const updateStudentResponse = await fetch(`http://localhost:3001/api/admin/siswa-perwakilan/${student.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nama: student.nama + ' (Updated)',
                    nis: student.nis,
                    username: student.username,
                    kelas_id: student.kelas_id,
                    jabatan: student.jabatan || 'Siswa',
                    jenis_kelamin: student.jenis_kelamin || 'L',
                    email: student.email || 'student@example.com',
                    alamat: student.alamat || 'Jl. Test No. 1',
                    telepon_orangtua: student.telepon_orangtua || '08123456789',
                    telepon_siswa: student.telepon_siswa || '08123456788',
                    status: 'aktif'
                })
            });
            
            const updateStudentData = await updateStudentResponse.json();
            console.log(`   Update response: ${updateStudentResponse.status} - ${JSON.stringify(updateStudentData)}`);
            
            if (updateStudentResponse.ok) {
                console.log('   ✅ Student update successful');
            } else {
                console.log('   ❌ Student update failed');
            }
        }
        
        console.log('\n🎉 Update endpoint testing completed!');
        
    } catch (error) {
        console.error('Fatal error during update testing:', error);
    }
};

testUpdateEndpoints();
