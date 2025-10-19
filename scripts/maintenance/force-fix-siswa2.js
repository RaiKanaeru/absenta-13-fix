import mysql from 'mysql2/promise';

async function forceFixSiswa2() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });

        console.log('🔍 Checking siswa2 current state...');
        const [before] = await connection.execute('SELECT id, username, role FROM users WHERE username = "siswa2"');
        console.log('Before:', before);

        console.log('🔄 Force updating with direct SQL...');
        await connection.execute('UPDATE users SET role = ? WHERE username = ?', ['perwakilan', 'siswa2']);
        
        const [after] = await connection.execute('SELECT id, username, role FROM users WHERE username = "siswa2"');
        console.log('After:', after);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

forceFixSiswa2();
