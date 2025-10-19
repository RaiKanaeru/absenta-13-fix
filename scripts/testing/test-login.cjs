import { db } from './db.js';

async function testLogin() {
    try {
        console.log('🔍 Checking users in database...');
        
        // Check users
        const [users] = await db.execute(`
            SELECT username, peran, id 
            FROM pengguna 
            WHERE username IN ('siswa2', 'guru001')
        `);
        
        console.log('📋 Users found:', users);
        
        // Check if users exist
        if (users.length === 0) {
            console.log('❌ No users found with username siswa2 or guru001');
            return;
        }
        
        // Test login for each user
        for (const user of users) {
            console.log(`\n🧪 Testing login for: ${user.username} (role: ${user.peran})`);
            
            // Simulate login request
            const bcrypt = require('bcrypt');
            
            // Try common passwords
            const passwords = ['123456', 'password', 'siswa2', 'guru001'];
            
            for (const password of passwords) {
                try {
                    const [userData] = await db.execute(
                        'SELECT * FROM pengguna WHERE username = ?',
                        [user.username]
                    );
                    
                    if (userData.length > 0) {
                        const userRecord = userData[0];
                        const isValidPassword = await bcrypt.compare(password, userRecord.password);
                        
                        if (isValidPassword) {
                            console.log(`✅ Valid password found: ${password}`);
                            console.log(`   User ID: ${userRecord.id}`);
                            console.log(`   Role: ${userRecord.peran}`);
                            break;
                        }
                    }
                } catch (err) {
                    console.log(`❌ Password ${password} failed: ${err.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

testLogin();
