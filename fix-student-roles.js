// Script untuk memperbaiki role siswa di tabel users
import mysql from 'mysql2/promise';

async function fixStudentRoles() {
    console.log('🔍 Fixing student roles in users table...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Update role for students in users table
        console.log('\n1. Updating student roles in users table...');
        const [updateResult] = await connection.execute(
            'UPDATE users SET role = "KETOS" WHERE username LIKE "siswa%" AND role = ""'
        );
        console.log(`✅ Updated ${updateResult.affectedRows} student records`);
        
        // Verify the update
        console.log('\n2. Verifying updated roles...');
        const [updatedUsers] = await connection.execute(
            'SELECT id, username, role FROM users WHERE username LIKE "siswa%" LIMIT 5'
        );
        console.log('📊 Updated users:');
        updatedUsers.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
        });
        
        await connection.end();
        
        console.log('\n✅ Student roles fixed successfully!');
        
    } catch (error) {
        console.error('❌ Fix failed:', error.message);
    }
}

fixStudentRoles();
