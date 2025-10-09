import fetch from 'node-fetch';

async function testGuruPasswordUpdate() {
    try {
        console.log('🔍 Testing guru password update...');
        
        // First, login as admin to get token
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const loginData = await loginResponse.json();
        if (!loginData.success) {
            throw new Error('Login failed: ' + loginData.message);
        }
        
        const token = loginData.data.token;
        console.log('✅ Admin login successful');
        
        // Test update guru ID 2 with new password
        const updateData = {
            nip: '196502151995555555',
            nama: 'Drs. Budi Santoso, M.M (Password Test)',
            username: 'kepsek',
            password: 'newpassword123', // New password
            mapel_id: 1,
            no_telp: '081234567891313',
            alamat: 'Jl. Test No. 1',
            jenis_kelamin: 'L',
            email: 'wakepsek@smkn13bandung.sch.id',
            status: 'aktif'
        };
        
        console.log('📝 Updating guru with new password...');
        
        const updateResponse = await fetch('http://localhost:3001/api/admin/guru/2', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        const updateResult = await updateResponse.json();
        console.log('📥 Update response:', updateResult);
        
        if (updateResult.success) {
            console.log('✅ Guru update successful');
            
            // Test login with new password
            console.log('🔐 Testing login with new password...');
            const testLoginResponse = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: 'kepsek',
                    password: 'newpassword123'
                })
            });
            
            const testLoginData = await testLoginResponse.json();
            if (testLoginData.success) {
                console.log('✅ Login with new password successful!');
            } else {
                console.log('❌ Login with new password failed:', testLoginData.message);
            }
        } else {
            console.log('❌ Guru update failed:', updateResult.message);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testGuruPasswordUpdate();




