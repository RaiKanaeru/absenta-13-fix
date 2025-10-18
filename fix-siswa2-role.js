import mysql from 'mysql2/promise';

async function fixSiswa2Role() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });

        console.log('🔄 Updating siswa2 role to perwakilan...');
        await connection.execute('UPDATE users SET role = "perwakilan" WHERE username = "siswa2"');
        
        const [result] = await connection.execute('SELECT username, role FROM users WHERE username = "siswa2"');
        console.log('Updated siswa2:', result);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

fixSiswa2Role();
