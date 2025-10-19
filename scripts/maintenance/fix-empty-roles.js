import mysql from 'mysql2/promise';

async function fixEmptyRoles() {
    console.log('🔄 Fixing empty roles...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Adjust if needed
            database: 'absenta13'
        });

        console.log('✅ Connected to database');

        // Check users with empty roles
        console.log('📊 Checking users with empty roles...');
        const [emptyRoles] = await connection.execute(
            'SELECT COUNT(*) as count FROM users WHERE role = "" OR role IS NULL'
        );
        console.log(`Found ${emptyRoles[0].count} users with empty roles`);

        if (emptyRoles[0].count > 0) {
            // Update empty roles to perwakilan (assuming they are students)
            console.log('🔄 Updating empty roles to perwakilan...');
            const [result] = await connection.execute(
                'UPDATE users SET role = "perwakilan" WHERE role = "" OR role IS NULL'
            );
            console.log(`✅ Updated ${result.affectedRows} users from empty role to perwakilan`);
        }

        // Verify changes
        console.log('📊 Final role distribution:');
        const [roles] = await connection.execute('SELECT DISTINCT role FROM users');
        console.log('Roles:', roles.map(r => r.role));

        // Count by role
        const [roleCounts] = await connection.execute(
            'SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC'
        );
        console.log('Role distribution:');
        roleCounts.forEach(role => {
            console.log(`  ${role.role}: ${role.count} users`);
        });

        await connection.end();
        console.log('✅ Empty roles fixed successfully');
        
    } catch (error) {
        console.error('❌ Fix failed:', error.message);
        process.exit(1);
    }
}

fixEmptyRoles();
