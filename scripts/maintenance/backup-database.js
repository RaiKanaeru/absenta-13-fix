import mysql from 'mysql2/promise';
import fs from 'fs';

async function backupDatabase() {
    console.log('🔄 Starting database backup...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Adjust if needed
            database: 'absenta13'
        });

        console.log('✅ Connected to database');

        // Backup users table
        console.log('📋 Backing up users table...');
        const [users] = await connection.execute('SELECT * FROM users');
        fs.writeFileSync('backup_users.json', JSON.stringify(users, null, 2));
        console.log(`✅ Users table backed up: ${users.length} records`);

        // Backup siswa table
        console.log('📋 Backing up siswa table...');
        const [siswa] = await connection.execute('SELECT * FROM siswa');
        fs.writeFileSync('backup_siswa.json', JSON.stringify(siswa, null, 2));
        console.log(`✅ Siswa table backed up: ${siswa.length} records`);

        // Show current roles
        console.log('\n📊 Current roles in database:');
        const [roles] = await connection.execute('SELECT DISTINCT role FROM users');
        console.log('Roles:', roles.map(r => r.role));

        await connection.end();
        console.log('✅ Database backup completed successfully');
        
    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        process.exit(1);
    }
}

backupDatabase();
