// Test Teacher Update Fixed
import 'dotenv/config';

const testTeacherUpdateFixed = async () => {
    try {
        console.log('🧪 Testing teacher update with correct ID...\n');
        
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
        
        // Step 2: Get teacher data
        const teachersResponse = await fetch('http://localhost:3001/api/admin/guru', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const teachersData = await teachersResponse.json();
        console.log(`📚 Found ${teachersData.data?.length || 0} teachers`);
        
        if (teachersData.data && teachersData.data.length > 0) {
            const teacher = teachersData.data[0];
            console.log(`\n📋 Teacher details:`);
            console.log(`   ID (id_guru): ${teacher.id}`);
            console.log(`   Nama: ${teacher.nama}`);
            console.log(`   NIP: ${teacher.nip}`);
            console.log(`   Username: ${teacher.username}`);
            console.log(`   User ID: ${teacher.user_id}`);
            console.log(`   Mapel ID: ${teacher.mapel_id}`);
            console.log(`   Email: ${teacher.email}`);
            console.log(`   Status: ${teacher.status}`);
            
            // Step 3: Test update with correct data
            console.log(`\n🔄 Testing teacher update...`);
            
            const updateData = {
                nama: teacher.nama + ' (Updated)',
                nip: teacher.nip,
                email: teacher.email || 'test@example.com',
                username: teacher.username,
                mapel_id: teacher.mapel_id,
                no_telp: '08123456789',
                alamat: 'Jl. Test No. 1',
                jenis_kelamin: 'L',
                status: 'aktif'
            };
            
            console.log(`   Update data:`, updateData);
            
            const updateResponse = await fetch(`http://localhost:3001/api/admin/guru/${teacher.id}`, {
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
                const verifyResponse = await fetch('http://localhost:3001/api/admin/guru', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const verifyData = await verifyResponse.json();
                const updatedTeacher = verifyData.data.find(t => t.id === teacher.id);
                
                if (updatedTeacher) {
                    console.log(`   Updated name: ${updatedTeacher.nama}`);
                    console.log(`   Update verified: ${updatedTeacher.nama.includes('(Updated)') ? 'Yes' : 'No'}`);
                }
            } else {
                console.log(`   ❌ Update failed: ${updateResult.error}`);
            }
        }
        
    } catch (error) {
        console.error('Fatal error during testing:', error);
    }
};

testTeacherUpdateFixed();
