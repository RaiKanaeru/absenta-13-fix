import fetch from 'node-fetch';

async function testGuruUpdateWithConsole() {
    try {
        console.log('🔍 Testing guru update with console output...');
        
        // Login as admin
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        const loginData = await loginResponse.json();
        const token = loginData.data.token;
        console.log('✅ Admin login successful');
        
        // Update guru with password
        const updateData = {
            nip: '196502151995555555',
            nama: 'Drs. Budi Santoso, M.M (Console Test)',
            username: 'kepsek',
            password: 'consoletest123',
            mapel_id: 1,
            status: 'aktif'
        };
        
        console.log('📝 Sending update request...');
        console.log('📝 Password in request:', updateData.password);
        
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
        
        // Wait for server to process
        console.log('⏳ Waiting for server to process...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test login
        console.log('🔐 Testing login with new password...');
        const testLoginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'kepsek', password: 'consoletest123' })
        });
        
        const testLoginData = await testLoginResponse.json();
        console.log('🔐 Login test result:', testLoginData);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testGuruUpdateWithConsole();




