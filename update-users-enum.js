import mysql from 'mysql2/promise';

async function updateUsersEnum() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });

        console.log('🔄 Updating users table ENUM constraint...');
        
        // Update ENUM to include 'perwakilan'
        await connection.execute(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('ADMIN','GURU','KETOS','perwakilan') NOT NULL
        `);
        
        console.log('✅ ENUM constraint updated successfully');
        
        // Now update siswa2 role
        console.log('🔄 Updating siswa2 role...');
        await connection.execute('UPDATE users SET role = "perwakilan" WHERE username = "siswa2"');
        
        const [result] = await connection.execute('SELECT username, role FROM users WHERE username = "siswa2"');
        console.log('Updated siswa2:', result);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

updateUsersEnum();
