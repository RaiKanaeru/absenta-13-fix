import { db } from './db.js';

async function testPasswordVerification() {
    try {
        console.log('🔍 Testing password verification...');
        
        // Get current password from database
        const [userData] = await db.execute('SELECT id, username, password FROM users WHERE id = 2');
        console.log('👤 Current user data:', userData[0]);
        
        // Test password verification with bcrypt
        const bcrypt = await import('bcrypt');
        
        // Test with different passwords
        const passwords = [
            'consoletest123',
            'directtest123', 
            'logtest123',
            'simplepass123',
            'testpassword456',
            'newpassword123',
            'admin123'
        ];
        
        for (const password of passwords) {
            const isValid = await bcrypt.compare(password, userData[0].password);
            console.log(`🔐 Password "${password}": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testPasswordVerification();




