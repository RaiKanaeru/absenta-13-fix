import mysql from 'mysql2/promise';

async function updateEmptyRoles() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });

        console.log('🔄 Updating empty roles to perwakilan...');
        const [result] = await connection.execute(
            'UPDATE users SET role = "perwakilan" WHERE role = ""'
        );
        console.log(`✅ Updated ${result.affectedRows} users`);

        const [roles] = await connection.execute('SELECT role, COUNT(*) as c FROM users GROUP BY role');
        console.log('Final roles:', roles);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

updateEmptyRoles();
