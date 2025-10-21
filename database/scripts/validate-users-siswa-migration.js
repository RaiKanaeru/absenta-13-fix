import db from '../../db.js';

async function validateMigration() {
  console.log('🔍 Starting migration validation...\n');

  let allPassed = true;

  try {
    // ==============================
    // 1. Check broken relationships
    // ==============================
    console.log('1️⃣ Checking for broken relationships...');
    const [brokenRels] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM siswa s
      WHERE s.user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)
    `);
    
    if (brokenRels[0].count === 0) {
      console.log(`   ✅ No broken relationships (Expected: 0, Actual: ${brokenRels[0].count})`);
    } else {
      console.log(`   ❌ Broken relationships found: ${brokenRels[0].count}`);
      allPassed = false;
    }

    // ==============================
    // 2. Check role consistency
    // ==============================
    console.log('\n2️⃣ Checking role consistency...');
    const [roleCheck] = await db.execute(`
      SELECT s.id_siswa, s.nama, u.role
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      WHERE u.role <> 'SISWA'
    `);
    
    if (roleCheck.length === 0) {
      console.log(`   ✅ All siswa have correct role (Expected: 0, Actual: ${roleCheck.length})`);
    } else {
      console.log(`   ❌ Users dengan role tidak sesuai: ${roleCheck.length}`);
      roleCheck.slice(0, 5).forEach(row => {
        console.log(`      - Siswa ${row.id_siswa} (${row.nama}) has role: ${row.role}`);
      });
      allPassed = false;
    }

    // ==============================
    // 3. Check duplicate users
    // ==============================
    console.log('\n3️⃣ Checking for duplicate usernames...');
    const [dupUsers] = await db.execute(`
      SELECT username, COUNT(*) as count
      FROM users
      GROUP BY username
      HAVING count > 1
    `);
    
    if (dupUsers.length === 0) {
      console.log(`   ✅ No duplicate usernames (Expected: 0, Actual: ${dupUsers.length})`);
    } else {
      console.log(`   ❌ Duplicate usernames found: ${dupUsers.length}`);
      dupUsers.forEach(dup => {
        console.log(`      - Username: ${dup.username} (${dup.count} occurrences)`);
      });
      allPassed = false;
    }

    // ==============================
    // 4. Check siswa statistics
    // ==============================
    console.log('\n4️⃣ Checking siswa statistics...');
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_siswa,
        SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as dengan_akun,
        SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as tanpa_akun
      FROM siswa
    `);
    
    console.log(`   📊 Statistik Siswa:`);
    console.log(`      Total: ${stats[0].total_siswa}`);
    console.log(`      Dengan akun: ${stats[0].dengan_akun}`);
    console.log(`      Tanpa akun: ${stats[0].tanpa_akun}`);
    
    if (stats[0].dengan_akun > 0) {
      console.log(`   ✅ At least some siswa have accounts`);
    } else {
      console.log(`   ⚠️ Warning: No siswa have user accounts`);
    }

    // ==============================
    // 5. Check users with SISWA role
    // ==============================
    console.log('\n5️⃣ Checking users with SISWA role...');
    const [siswaUsers] = await db.execute(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'SISWA'
    `);
    
    console.log(`   📊 Total users with SISWA role: ${siswaUsers[0].count}`);
    
    if (siswaUsers[0].count > 0) {
      console.log(`   ✅ SISWA role is being used`);
    } else {
      console.log(`   ⚠️ Warning: No users with SISWA role`);
    }

    // ==============================
    // 6. Check orphaned users
    // ==============================
    console.log('\n6️⃣ Checking for orphaned users...');
    const [orphanedUsers] = await db.execute(`
      SELECT COUNT(*) as count
      FROM users u
      WHERE u.role = 'SISWA' 
        AND NOT EXISTS (SELECT 1 FROM siswa s WHERE s.user_id = u.id)
    `);
    
    if (orphanedUsers[0].count === 0) {
      console.log(`   ✅ No orphaned SISWA users (Expected: 0, Actual: ${orphanedUsers[0].count})`);
    } else {
      console.log(`   ⚠️ Orphaned SISWA users found: ${orphanedUsers[0].count}`);
    }

    // ==============================
    // 7. Check foreign key constraint
    // ==============================
    console.log('\n7️⃣ Checking foreign key constraint...');
    const [fkCheck] = await db.execute(`
      SELECT 
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'absenta13'
        AND TABLE_NAME = 'siswa'
        AND COLUMN_NAME = 'user_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (fkCheck.length > 0) {
      console.log(`   ✅ Foreign key constraint exists: ${fkCheck[0].CONSTRAINT_NAME}`);
      console.log(`      References: ${fkCheck[0].REFERENCED_TABLE_NAME}.${fkCheck[0].REFERENCED_COLUMN_NAME}`);
    } else {
      console.log(`   ⚠️ Warning: No foreign key constraint found`);
    }

    // ==============================
    // 8. Check indexes
    // ==============================
    console.log('\n8️⃣ Checking indexes...');
    const [indexes] = await db.execute(`
      SELECT 
        INDEX_NAME,
        COLUMN_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = 'absenta13'
        AND TABLE_NAME IN ('users', 'siswa')
        AND INDEX_NAME IN ('idx_users_role_status', 'idx_siswa_user_id', 'idx_siswa_kelas_status')
    `);
    
    const expectedIndexes = ['idx_users_role_status', 'idx_siswa_user_id', 'idx_siswa_kelas_status'];
    const foundIndexes = [...new Set(indexes.map(idx => idx.INDEX_NAME))];
    
    expectedIndexes.forEach(expected => {
      if (foundIndexes.includes(expected)) {
        console.log(`   ✅ Index exists: ${expected}`);
      } else {
        console.log(`   ⚠️ Index missing: ${expected}`);
      }
    });

    // ==============================
    // 9. Check validation view
    // ==============================
    console.log('\n9️⃣ Checking validation view...');
    try {
      const [viewCheck] = await db.execute(`
        SELECT COUNT(*) as count
        FROM v_siswa_with_users
        LIMIT 1
      `);
      console.log(`   ✅ Validation view v_siswa_with_users exists and accessible`);
      
      const [viewStats] = await db.execute(`
        SELECT 
          validation_status,
          COUNT(*) as count
        FROM v_siswa_with_users
        GROUP BY validation_status
      `);
      
      console.log(`   📊 Validation status breakdown:`);
      viewStats.forEach(stat => {
        console.log(`      ${stat.validation_status}: ${stat.count}`);
      });
    } catch (error) {
      console.log(`   ❌ Validation view error: ${error.message}`);
      allPassed = false;
    }

    // ==============================
    // 10. Validation summary
    // ==============================
    console.log('\n' + '='.repeat(60));
    console.log('📋 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    if (allPassed) {
      console.log('✅ MIGRATION VALIDATION: PASSED');
      console.log('All critical checks passed successfully.');
    } else {
      console.log('❌ MIGRATION VALIDATION: FAILED');
      console.log('Please fix the issues above before proceeding.');
    }
    console.log('='.repeat(60));

    return allPassed;

  } catch (error) {
    console.error('\n❌ Validation error:', error);
    return false;
  }
}

// Export for testing
export { validateMigration };

// Run if called directly
const isMainModule = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMainModule || process.argv[1].includes('validate-users-siswa-migration')) {
  validateMigration()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

