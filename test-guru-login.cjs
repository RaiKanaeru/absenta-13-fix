const fetch = require('node-fetch');

async function testGuruLogin() {
    console.log('🧪 Testing guru login...');
    
    const testAccounts = [
        { username: 'guru1', password: 'password123' },
        { username: 'guru2', password: 'password123' },
        { username: 'guru3', password: 'password123' }
    ];

    for (const account of testAccounts) {
        try {
            console.log(`\n🔐 Testing login for ${account.username}...`);
            
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: account.username,
                    password: account.password
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Login successful for ${account.username}`);
                console.log(`   Token: ${result.token ? result.token.substring(0, 20) + '...' : 'No token'}`);
                console.log(`   Role: ${result.role || 'No role'}`);
            } else {
                console.log(`❌ Login failed for ${account.username}`);
                console.log(`   Error: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.log(`❌ Network error for ${account.username}:`, error.message);
        }
    }

    console.log('\n🎉 Login testing completed!');
}

// Wait a bit for server to start
setTimeout(() => {
    testGuruLogin();
}, 3000);
