import fetch from 'node-fetch';

async function testSimpleGuruUpdate() {
    try {
        console.log('🔍 Testing simple guru update...');
        
        // Login as admin
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        const loginData = await loginResponse.json();
        const token = loginData.data.token;
        console.log('✅ Admin login successful');
        
        // Update guru with minimal data + password
        const updateData = {
            nip: '196502151995555555',
            nama: 'Drs. Budi Santoso, M.M (Simple Test)',
            username: 'kepsek',
            password: 'simplepass123',
            mapel_id: 1,
            status: 'aktif'
        };
        
        console.log('📝 Sending update request...');
        
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
        
        // Wait and test login
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const testLoginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'kepsek', password: 'simplepass123' })
        });
        
        const testLoginData = await testLoginResponse.json();
        console.log('🔐 Login test result:', testLoginData);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testSimpleGuruUpdate();




