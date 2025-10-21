import db from '../../db.js';

async function checkUsersRole() {
  console.log('🔍 Checking users role...\n');

  // Check role enum definition
  const [enumDef] = await db.execute(`
    SELECT COLUMN_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'absenta13' 
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role'
  `);
  
  console.log('📋 Role enum definition:');
  console.log(`   ${enumDef[0].COLUMN_TYPE}\n`);

  // Check users with empty or invalid role
  const [users] = await db.execute(`
    SELECT id, username, role, email
    FROM users
    WHERE role = '' OR role IS NULL OR role NOT IN ('ADMIN', 'GURU', 'SISWA')
    LIMIT 10
  `);
  
  console.log(`📊 Users with empty/invalid role: ${users.length}`);
  users.forEach(u => {
    console.log(`   - ID: ${u.id}, Username: ${u.username}, Role: "${u.role}"`);
  });

  // Check siswa user_ids
  console.log('\n📊 Checking siswa user_ids...');
  const [siswaUsers] = await db.execute(`
    SELECT s.id_siswa, s.nis, s.user_id, u.username, u.role
    FROM siswa s
    LEFT JOIN users u ON s.user_id = u.id
    LIMIT 10
  `);
  
  siswaUsers.forEach(su => {
    console.log(`   - Siswa ${su.nis}: user_id=${su.user_id}, username=${su.username}, role="${su.role}"`);
  });

  process.exit(0);
}

checkUsersRole().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});


