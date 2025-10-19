const mysql = require('mysql2/promise');

async function checkUsersStructure() {
    console.log('🔍 Checking users table structure...');
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        console.log('✅ Connected to database');

        // Check users table structure
        console.log('\n📋 Users table structure:');
        const [structure] = await connection.execute('DESCRIBE users');
        structure.forEach(r => console.log(`- ${r.Field}: ${r.Type} ${r.Null === 'NO' ? '(NOT NULL)' : ''}`));

        // Check existing users
        console.log('\n👤 Existing users:');
        const [users] = await connection.execute('SELECT id, username, role, guru_id FROM users LIMIT 10');
        users.forEach(u => console.log(`- ID: ${u.id}, Username: ${u.username}, Role: ${u.role}, Guru ID: ${u.guru_id}`));

        // Check if we need to create teacher accounts
        console.log('\n👨‍🏫 Checking teacher accounts...');
        const [teacherUsers] = await connection.execute(`
            SELECT COUNT(*) as count FROM users WHERE role = 'guru'
        `);
        console.log(`Teacher accounts: ${teacherUsers[0].count}`);

        const [totalGuru] = await connection.execute('SELECT COUNT(*) as count FROM guru');
        console.log(`Total teachers in guru table: ${totalGuru[0].count}`);

        if (teacherUsers[0].count < totalGuru[0].count) {
            console.log('⚠️ Some teachers don\'t have user accounts');
        } else {
            console.log('✅ All teachers have user accounts');
        }

    } catch (error) {
        console.error('❌ Error checking users structure:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkUsersStructure();
