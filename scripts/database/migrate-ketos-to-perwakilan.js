import mysql from 'mysql2/promise';

async function migrateKetosToPerwakilan() {
    console.log('🔄 Starting KETOS to perwakilan migration...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Adjust if needed
            database: 'absenta13'
        });

        console.log('✅ Connected to database');

        // Check current roles before migration
        console.log('📊 Current roles before migration:');
        const [beforeRoles] = await connection.execute('SELECT DISTINCT role FROM users');
        console.log('Roles:', beforeRoles.map(r => r.role));

        // Count KETOS users
        const [ketosCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM users WHERE role = "KETOS"'
        );
        console.log(`📋 Found ${ketosCount[0].count} users with KETOS role`);

        // Update KETOS to perwakilan
        console.log('🔄 Updating KETOS role to perwakilan...');
        const [result] = await connection.execute(
            'UPDATE users SET role = "perwakilan" WHERE role = "KETOS"'
        );
        console.log(`✅ Updated ${result.affectedRows} users from KETOS to perwakilan`);

        // Verify migration
        console.log('📊 Roles after migration:');
        const [afterRoles] = await connection.execute('SELECT DISTINCT role FROM users');
        console.log('Roles:', afterRoles.map(r => r.role));

        // Check if any KETOS roles remain
        const [remainingKetos] = await connection.execute(
            'SELECT COUNT(*) as count FROM users WHERE role = "KETOS"'
        );
        console.log(`📋 Remaining KETOS roles: ${remainingKetos[0].count}`);

        await connection.end();
        console.log('✅ Migration completed successfully');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrateKetosToPerwakilan();