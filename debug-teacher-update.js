// Debug Teacher Update Issue
import 'dotenv/config';

const debugTeacherUpdate = async () => {
    try {
        console.log('🔍 Debugging teacher update issue...\n');
        
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
            console.log(`   ID: ${teacher.id}`);
            console.log(`   Nama: ${teacher.nama}`);
            console.log(`   NIP: ${teacher.nip}`);
            console.log(`   Username: ${teacher.username}`);
            console.log(`   User ID: ${teacher.user_id}`);
            console.log(`   Mapel ID: ${teacher.mapel_id}`);
            console.log(`   Email: ${teacher.email}`);
            console.log(`   Status: ${teacher.status}`);
            
            // Step 3: Test update with minimal data
            console.log(`\n🔄 Testing teacher update with minimal data...`);
            
            const updateData = {
                nama: teacher.nama + ' (Test)',
                nip: teacher.nip,
                email: teacher.email || 'test@example.com',
                username: teacher.username,
                mapel_id: teacher.mapel_id,
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
            
            if (!updateResponse.ok) {
                console.log(`   ❌ Update failed: ${updateResult.error}`);
            } else {
                console.log(`   ✅ Update successful`);
            }
        }
        
    } catch (error) {
        console.error('Fatal error during debugging:', error);
    }
};

debugTeacherUpdate();
