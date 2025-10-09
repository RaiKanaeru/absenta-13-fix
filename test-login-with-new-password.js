import fetch from 'node-fetch';

async function testLoginWithNewPassword() {
    try {
        console.log('🔍 Testing login with new password...');
        
        // Test login with the new password
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: 'kepsek', 
                password: 'directtest123' 
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('🔐 Login result:', loginData);
        
        if (loginData.success) {
            console.log('✅ Login successful with new password!');
        } else {
            console.log('❌ Login failed:', loginData.message);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testLoginWithNewPassword();




