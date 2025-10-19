import mysql from 'mysql2/promise';

async function debugRoles() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });

        console.log('🔍 Debugging roles...');
        
        // Check empty roles
        const [emptyRoles] = await connection.execute('SELECT id, role FROM users WHERE role = "" LIMIT 5');
        console.log('Empty roles (first 5):', emptyRoles);

        // Check NULL roles
        const [nullRoles] = await connection.execute('SELECT id, role FROM users WHERE role IS NULL LIMIT 5');
        console.log('NULL roles (first 5):', nullRoles);

        // Check all role types
        const [allRoles] = await connection.execute('SELECT DISTINCT role, LENGTH(role) as len FROM users ORDER BY len');
        console.log('All role types:', allRoles);

        // Try different update approach
        console.log('🔄 Trying different update approach...');
        const [result1] = await connection.execute('UPDATE users SET role = "perwakilan" WHERE role = "" OR role IS NULL');
        console.log(`Updated ${result1.affectedRows} users`);

        // Check again
        const [finalRoles] = await connection.execute('SELECT role, COUNT(*) as c FROM users GROUP BY role');
        console.log('Final roles:', finalRoles);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugRoles();
