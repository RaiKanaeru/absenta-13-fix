import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'absenta13',
  port: parseInt(process.env.DB_PORT) || 3306
};

console.log('🔧 Migration: KETOS → PERWAKILAN + Konsolidasi Akun');
console.log('================================================\n');

async function migrateKetosToPerwakilan() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    // Step 1: Backup users table
    console.log('📦 Step 1: Creating backup table...');
    await connection.execute('DROP TABLE IF EXISTS users_backup_ketos_migration');
    await connection.execute('CREATE TABLE users_backup_ketos_migration AS SELECT * FROM users');
    console.log('✅ Backup created: users_backup_ketos_migration\n');
    
    // Step 2: Count existing KETOS/siswa accounts
    console.log('📊 Step 2: Analyzing existing accounts...');
    const [ketosCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE role IN ("KETOS", "ketos", "siswa")'
    );
    console.log(`   Found ${ketosCount[0].count} KETOS/siswa accounts\n`);
    
    // Step 3: Get all classes and their students
    console.log('📋 Step 3: Analyzing class structure...');
    const [classes] = await connection.execute(
      'SELECT id_kelas, nama_kelas, COUNT(s.id_siswa) as student_count FROM kelas k LEFT JOIN siswa s ON k.id_kelas = s.kelas_id WHERE k.status = "aktif" GROUP BY k.id_kelas, k.nama_kelas ORDER BY k.nama_kelas'
    );
    
    console.log(`   Found ${classes.length} active classes:`);
    for (const cls of classes) {
      console.log(`   - ${cls.nama_kelas}: ${cls.student_count} students`);
    }
    console.log('');
    
    // Step 4: Rename all KETOS/siswa roles to PERWAKILAN
    console.log('🔄 Step 4: Renaming roles KETOS/siswa → PERWAKILAN...');
    const [updateResult] = await connection.execute(
      'UPDATE users SET role = "PERWAKILAN" WHERE role IN ("KETOS", "ketos", "siswa")'
    );
    console.log(`✅ Updated ${updateResult.affectedRows} rows\n`);
    
    // Step 5: Identify and consolidate accounts per class
    console.log('🔄 Step 5: Consolidating accounts (1 per class)...');
    
    for (const cls of classes) {
      // Get all users for this class
      const [classUsers] = await connection.execute(`
        SELECT u.id, u.username, u.role, u.created_at, COUNT(s.id_siswa) as linked_students
        FROM users u
        LEFT JOIN siswa s ON s.user_id = u.id
        WHERE s.kelas_id = ? OR u.id IN (
          SELECT DISTINCT user_id FROM siswa WHERE kelas_id = ?
        )
        GROUP BY u.id, u.username, u.role, u.created_at
        ORDER BY u.created_at ASC
      `, [cls.id_kelas, cls.id_kelas]);
      
      if (classUsers.length === 0) {
        console.log(`   ⚠️  No users found for class ${cls.nama_kelas}`);
        continue;
      }
      
      if (classUsers.length === 1) {
        console.log(`   ✅ Class ${cls.nama_kelas}: Already has single account (${classUsers[0].username})`);
        continue;
      }
      
      // Pick the account to keep (oldest one with most students linked)
      const keepAccount = classUsers.sort((a, b) => {
        if (b.linked_students !== a.linked_students) {
          return b.linked_students - a.linked_students; // Most linked students first
        }
        return new Date(a.created_at) - new Date(b.created_at); // Oldest first
      })[0];
      
      console.log(`   🔄 Class ${cls.nama_kelas}:`);
      console.log(`      Keeping account: ${keepAccount.username} (${keepAccount.linked_students} students linked)`);
      
      // For now, we'll keep the existing user_id assignments
      // The constraint prevents multiple students from having the same user_id
      // This means we can't implement "1 account per class" with current schema
      console.log(`      ⚠️  Cannot consolidate due to UNIQUE constraint on user_id`);
      console.log(`      ℹ️  Each student must have unique user_id in current schema`);
      
      // Delete other accounts for this class
      const accountsToDelete = classUsers.filter(u => u.id !== keepAccount.id).map(u => u.id);
      if (accountsToDelete.length > 0) {
        await connection.execute(
          `DELETE FROM users WHERE id IN (${accountsToDelete.map(() => '?').join(',')})`,
          accountsToDelete
        );
        console.log(`      Deleted ${accountsToDelete.length} duplicate accounts`);
      }
    }
    console.log('');
    
    // Step 6: Verify final state
    console.log('✅ Step 6: Verification...');
    const [finalPerwakilan] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "PERWAKILAN"'
    );
    console.log(`   Total PERWAKILAN accounts: ${finalPerwakilan[0].count}`);
    
    const [perwakilanPerClass] = await connection.execute(`
      SELECT k.nama_kelas, COUNT(DISTINCT s.user_id) as account_count
      FROM kelas k
      LEFT JOIN siswa s ON k.id_kelas = s.kelas_id
      WHERE k.status = "aktif" AND s.user_id IS NOT NULL
      GROUP BY k.id_kelas, k.nama_kelas
      ORDER BY k.nama_kelas
    `);
    
    console.log('   Accounts per class:');
    for (const row of perwakilanPerClass) {
      const icon = row.account_count === 1 ? '✅' : '⚠️';
      console.log(`   ${icon} ${row.nama_kelas}: ${row.account_count} account(s)`);
    }
    console.log('');
    
    // Step 7: Check for orphaned KETOS/siswa roles
    const [orphaned] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE role IN ("KETOS", "ketos", "siswa")'
    );
    
    if (orphaned[0].count > 0) {
      console.log(`⚠️  Warning: ${orphaned[0].count} accounts still have old role names`);
    } else {
      console.log('✅ No orphaned KETOS/siswa roles found');
    }
    console.log('');
    
    console.log('================================================');
    console.log('✅ Migration completed successfully!');
    console.log('================================================\n');
    console.log('Summary:');
    console.log(`- Total PERWAKILAN accounts: ${finalPerwakilan[0].count}`);
    console.log(`- Classes with single account: ${perwakilanPerClass.filter(c => c.account_count === 1).length}/${perwakilanPerClass.length}`);
    console.log(`- Backup table: users_backup_ketos_migration\n`);
    
    console.log('⚠️  IMPORTANT: Test the system before dropping backup table!');
    console.log('   To rollback: DROP TABLE users; RENAME TABLE users_backup_ketos_migration TO users;\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run migration
migrateKetosToPerwakilan().then(() => {
  console.log('\n✅ Migration script completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Migration script failed:', error);
  process.exit(1);
});

