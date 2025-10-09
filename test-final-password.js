import { db } from './db.js';

async function testFinalPassword() {
    try {
        console.log('🔍 Testing final password...');
        
        // Get current password from database
        const [userData] = await db.execute('SELECT id, username, password FROM users WHERE id = 2');
        console.log('👤 Current user data:', userData[0]);
        
        // Test password verification with bcrypt
        const bcrypt = await import('bcrypt');
        
        // Test with the exact password that was used in the last update
        const testPassword = 'consoletest123';
        console.log('🔐 Testing with password:', testPassword);
        
        // Test verification
        const isValid = await bcrypt.compare(testPassword, userData[0].password);
        console.log('🔐 Verification result:', isValid);
        
        if (isValid) {
            console.log('✅ Password verification successful!');
        } else {
            console.log('❌ Password verification failed');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testFinalPassword();




