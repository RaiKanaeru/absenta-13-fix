import fetch from 'node-fetch';

async function testFinalGuruUpdate() {
    try {
        console.log('🔍 Testing final guru update...');
        
        // Login as admin
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        const loginData = await loginResponse.json();
        const token = loginData.data.token;
        console.log('✅ Admin login successful');
        
        // Update guru with new password
        const updateData = {
            nip: '196502151995555555',
            nama: 'Drs. Budi Santoso, M.M (Final Test)',
            username: 'kepsek',
            password: 'finaltest123',
            mapel_id: 1,
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
        console.log('📥 Update result:', updateResult);
        
        if (updateResult.success) {
            console.log('✅ Guru update successful');
            
            // Wait for server to process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test login with new password
            console.log('🔐 Testing login with new password...');
            const testLoginResponse = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'kepsek', password: 'finaltest123' })
            });
            
            const testLoginData = await testLoginResponse.json();
            
            if (testLoginData.success) {
                console.log('✅ Login with new password successful!');
                console.log('🎉 All tests passed! Password update is working correctly.');
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

testFinalGuruUpdate();




