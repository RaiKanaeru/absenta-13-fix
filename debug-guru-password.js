import { db } from './db.js';

async function debugGuruPassword() {
    try {
        console.log('🔍 Debugging guru password update...');
        
        // Check current password for user ID 2
        const [userData] = await db.execute('SELECT id, username, password FROM users WHERE id = 2');
        console.log('👤 Current user data:', userData[0]);
        
        // Test password hashing
        const bcrypt = await import('bcrypt');
        const testPassword = 'newpassword123';
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        console.log('🔐 Test password:', testPassword);
        console.log('🔐 Hashed password:', hashedPassword);
        
        // Test password verification
        const isValid = await bcrypt.compare(testPassword, hashedPassword);
        console.log('✅ Password verification test:', isValid);
        
        // Check if current password can be verified
        const currentPasswordValid = await bcrypt.compare('newpassword123', userData[0].password);
        console.log('✅ Current password verification:', currentPasswordValid);
        
        // Check if old password still works
        const oldPasswordValid = await bcrypt.compare('admin123', userData[0].password);
        console.log('✅ Old password verification:', oldPasswordValid);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugGuruPassword();




