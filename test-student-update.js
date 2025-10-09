// Test Student Update
import 'dotenv/config';

const testStudentUpdate = async () => {
    try {
        console.log('🧪 Testing student update...\n');
        
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
        
        // Step 2: Get student data
        const studentsResponse = await fetch('http://localhost:3001/api/admin/siswa-perwakilan', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const studentsData = await studentsResponse.json();
        console.log(`👨‍🎓 Found ${studentsData.data?.length || 0} students`);
        
        if (studentsData.data && studentsData.data.length > 0) {
            const student = studentsData.data[0];
            console.log(`\n📋 Student details:`);
            console.log(`   ID: ${student.id}`);
            console.log(`   Nama: ${student.nama}`);
            console.log(`   NIS: ${student.nis}`);
            console.log(`   Username: ${student.username}`);
            console.log(`   User ID: ${student.user_id}`);
            console.log(`   Kelas ID: ${student.kelas_id}`);
            console.log(`   Email: ${student.email}`);
            console.log(`   Status: ${student.status}`);
            
            // Step 3: Test update
            console.log(`\n🔄 Testing student update...`);
            
            const updateData = {
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
            };
            
            console.log(`   Update data:`, updateData);
            
            const updateResponse = await fetch(`http://localhost:3001/api/admin/siswa-perwakilan/${student.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });
            
            const updateResult = await updateResponse.json();
            console.log(`   Response status: ${updateResponse.status}`);
            console.log(`   Response data:`, JSON.stringify(updateResult, null, 2));
            
            if (updateResponse.ok && updateResult.success) {
                console.log(`   ✅ Update successful!`);
                
                // Verify the update
                console.log(`\n🔍 Verifying update...`);
                const verifyResponse = await fetch('http://localhost:3001/api/admin/siswa-perwakilan', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const verifyData = await verifyResponse.json();
                const updatedStudent = verifyData.data.find(s => s.id === student.id);
                
                if (updatedStudent) {
                    console.log(`   Updated name: ${updatedStudent.nama}`);
                    console.log(`   Update verified: ${updatedStudent.nama.includes('(Updated)') ? 'Yes' : 'No'}`);
                }
            } else {
                console.log(`   ❌ Update failed: ${updateResult.error}`);
            }
        } else {
            console.log('   ⚠️ No students found to test update');
        }
        
    } catch (error) {
        console.error('Fatal error during testing:', error);
    }
};

testStudentUpdate();
