import fetch from 'node-fetch';

async function testLogin() {
    try {
        console.log('🧪 Testing login with existing user...');
        
        // Test with user from database: test_guru
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'test_guru',
                password: 'admin123'  // Try common password
            })
        });
        
        const data = await response.json();
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('✅ Login successful!');
            console.log('🔑 Token:', data.token ? 'Present' : 'Missing');
            console.log('👤 User:', data.user ? data.user.username : 'Missing');
        } else {
            console.log('❌ Login failed:', data.message);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testLogin();
