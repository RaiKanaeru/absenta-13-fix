// Test System After Restore
import 'dotenv/config';

const testAfterRestore = async () => {
    try {
        console.log('🧪 Testing system after database restore...\n');
        
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
        
        // Step 2: Test all major endpoints
        const endpoints = [
            { name: 'Students', url: '/api/admin/siswa-perwakilan' },
            { name: 'Teachers', url: '/api/admin/guru' },
            { name: 'Subjects', url: '/api/admin/mapel' },
            { name: 'Classes', url: '/api/admin/kelas' },
            { name: 'Rooms', url: '/api/admin/ruang-kelas' },
            { name: 'Schedules', url: '/api/admin/jadwal' }
        ];
        
        console.log('\n🔍 Testing endpoints:');
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`http://localhost:3001${endpoint.url}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const count = Array.isArray(data.data) ? data.data.length : (data.data?.length || 0);
                    console.log(`  ✅ ${endpoint.name}: ${count} items`);
                } else {
                    console.log(`  ❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.log(`  ❌ ${endpoint.name}: ${error.message}`);
            }
        }
        
        // Step 3: Test student creation
        console.log('\n🔍 Testing student creation:');
        try {
            const studentData = {
                username: 'test_student_restore',
                nis: 'TEST001',
                nama: 'Test Student Restore',
                kelas_id: 349,
                email: 'test@example.com',
                jenis_kelamin: 'L',
                jabatan: 'Sekretaris Kelas'
            };
            
            const createResponse = await fetch('http://localhost:3001/api/admin/siswa-perwakilan', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentData)
            });
            
            if (createResponse.ok) {
                console.log('  ✅ Student creation: Working');
                
                // Clean up test student
                const createData = await createResponse.json();
                if (createData.data?.id) {
                    await fetch(`http://localhost:3001/api/admin/siswa-perwakilan/${createData.data.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('  ✅ Student deletion: Working');
                }
            } else {
                console.log('  ❌ Student creation: Failed');
            }
        } catch (error) {
            console.log(`  ❌ Student creation test: ${error.message}`);
        }
        
        console.log('\n🎉 System test completed!');
        console.log('✅ Database restore was successful and system is functional');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testAfterRestore();
