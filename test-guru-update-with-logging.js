import fetch from 'node-fetch';

async function testGuruUpdateWithLogging() {
    try {
        console.log('🔍 Testing guru update with detailed logging...');
        
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
            nama: 'Drs. Budi Santoso, M.M (Password Test 2)',
            username: 'kepsek',
            password: 'testpassword456', // New password
            mapel_id: 1,
            no_telp: '081234567891313',
            alamat: 'Jl. Test No. 1',
            jenis_kelamin: 'L',
            email: 'wakepsek@smkn13bandung.sch.id',
            status: 'aktif'
        };
        
        console.log('📝 Update data:', updateData);
        console.log('📝 Password field:', updateData.password);
        console.log('📝 Password type:', typeof updateData.password);
        console.log('📝 Password length:', updateData.password.length);
        console.log('📝 Password trim check:', updateData.password.trim() !== '');
        
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
        
        // Wait a bit for the update to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test login with new password
        console.log('🔐 Testing login with new password...');
        const testLoginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'kepsek',
                password: 'testpassword456'
            })
        });
        
        const testLoginData = await testLoginResponse.json();
        console.log('🔐 Login test result:', testLoginData);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testGuruUpdateWithLogging();




