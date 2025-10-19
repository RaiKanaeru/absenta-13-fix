import mysql from 'mysql2/promise';

async function forceUpdateRoles() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });

        console.log('🔄 Force updating roles...');
        
        // Get all users with empty roles
        const [users] = await connection.execute('SELECT id FROM users WHERE role = ""');
        console.log(`Found ${users.length} users with empty roles`);

        // Update one by one
        for (const user of users.slice(0, 10)) { // Test with first 10
            try {
                await connection.execute('UPDATE users SET role = "perwakilan" WHERE id = ?', [user.id]);
                console.log(`Updated user ${user.id}`);
            } catch (error) {
                console.error(`Failed to update user ${user.id}:`, error.message);
            }
        }

        // Check result
        const [finalRoles] = await connection.execute('SELECT role, COUNT(*) as c FROM users GROUP BY role');
        console.log('Final roles after force update:', finalRoles);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

forceUpdateRoles();
