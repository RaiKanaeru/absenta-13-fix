import fetch from 'node-fetch';

async function testLoginWithCorrectPassword() {
    try {
        console.log('🔍 Testing login with correct password...');
        
        // Test login with the correct password (consoletest123)
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: 'kepsek', 
                password: 'consoletest123' 
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('🔐 Login result:', loginData);
        
        if (loginData.success) {
            console.log('✅ Login successful with correct password!');
        } else {
            console.log('❌ Login failed:', loginData.message);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testLoginWithCorrectPassword();




