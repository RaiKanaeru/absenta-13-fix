import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function migrateRoles() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13'
  });

  try {
    console.log('🔄 Starting role migration: KETOS → PERWAKILAN');
    
    // Backup
    await connection.execute(
      'CREATE TABLE IF NOT EXISTS users_backup_role_migration AS SELECT * FROM users'
    );
    console.log('✅ Backup created: users_backup_role_migration');

    // Rename role
    const [result] = await connection.execute(
      "UPDATE users SET role = 'perwakilan' WHERE role IN ('ketos', 'KETOS', 'siswa', 'SISWA')"
    );
    console.log(`✅ Updated ${result.affectedRows} rows`);

    // Verify
    const [check] = await connection.execute(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role"
    );
    console.log('📊 Current role distribution:');
    check.forEach(row => {
      console.log(`   ${row.role}: ${row.count} users`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('⚠️  Note: This script is for documentation only.');
    console.log('   Execute manually when ready to migrate production data.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Execute only if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateRoles().catch(console.error);
}

export default migrateRoles;

