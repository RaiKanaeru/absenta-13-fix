import { db } from './db.js';

async function testDirectDatabaseUpdate() {
    try {
        console.log('🔍 Testing direct database password update...');
        
        // Check current password
        const [currentUser] = await db.execute('SELECT id, username, password FROM users WHERE id = 2');
        console.log('👤 Current user data:', currentUser[0]);
        
        // Test password hashing
        const bcrypt = await import('bcrypt');
        const newPassword = 'directtest123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log('🔐 New password:', newPassword);
        console.log('🔐 Hashed password:', hashedPassword);
        
        // Update password directly
        console.log('📝 Updating password directly in database...');
        await db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, 2]
        );
        
        console.log('✅ Password updated in database');
        
        // Verify the update
        const [updatedUser] = await db.execute('SELECT id, username, password FROM users WHERE id = 2');
        console.log('👤 Updated user data:', updatedUser[0]);
        
        // Test password verification
        const isValid = await bcrypt.compare(newPassword, updatedUser[0].password);
        console.log('✅ Password verification:', isValid);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testDirectDatabaseUpdate();




