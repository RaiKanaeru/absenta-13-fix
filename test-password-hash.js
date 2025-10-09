import { db } from './db.js';

async function testPasswordHash() {
    try {
        console.log('🔍 Testing password hash...');
        
        // Get current password from database
        const [userData] = await db.execute('SELECT id, username, password FROM users WHERE id = 2');
        console.log('👤 Current user data:', userData[0]);
        
        // Test password verification with bcrypt
        const bcrypt = await import('bcrypt');
        
        // Test with the exact password that was used in the last update
        const testPassword = 'consoletest123';
        console.log('🔐 Testing with password:', testPassword);
        
        // Hash the password to see what it should look like
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        console.log('🔐 Expected hash:', hashedPassword);
        console.log('🔐 Stored hash:', userData[0].password);
        
        // Test verification
        const isValid = await bcrypt.compare(testPassword, userData[0].password);
        console.log('🔐 Verification result:', isValid);
        
        // Test with the stored hash
        const isValidWithStored = await bcrypt.compare(testPassword, hashedPassword);
        console.log('🔐 Verification with expected hash:', isValidWithStored);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testPasswordHash();




