import db from '../../db.js';

async function fixRoleEnum() {
  console.log('🔧 Fixing role enum...\n');

  try {
    // Step 1: Add SISWA to enum (keep old values for backward compatibility during migration)
    console.log('1️⃣ Adding SISWA to role enum...');
    await db.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('ADMIN','GURU','SISWA','KETOS','perwakilan') NOT NULL DEFAULT 'SISWA'
    `);
    console.log('   ✅ Added SISWA to enum');

    // Step 2: Update all users with empty role to SISWA
    console.log('\n2️⃣ Updating users with empty role to SISWA...');
    const [updateEmpty] = await db.execute(`
      UPDATE users 
      SET role = 'SISWA' 
      WHERE role = '' OR role IS NULL
    `);
    console.log(`   ✅ Updated ${updateEmpty.affectedRows} users with empty role`);

    // Step 3: Migrate old roles to SISWA
    console.log('\n3️⃣ Migrating KETOS and perwakilan to SISWA...');
    const [updateOld] = await db.execute(`
      UPDATE users 
      SET role = 'SISWA' 
      WHERE role IN ('KETOS', 'perwakilan')
    `);
    console.log(`   ✅ Updated ${updateOld.affectedRows} users from old roles`);

    // Step 4: Remove old enum values
    console.log('\n4️⃣ Removing old enum values...');
    await db.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('ADMIN','GURU','SISWA') NOT NULL DEFAULT 'SISWA'
    `);
    console.log('   ✅ Removed old enum values');

    // Step 5: Validation
    console.log('\n5️⃣ Validation...');
    
    const [enumCheck] = await db.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'absenta13' 
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'role'
    `);
    console.log(`   📋 New enum definition: ${enumCheck[0].COLUMN_TYPE}`);

    const [roleStats] = await db.execute(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);
    console.log('\n   📊 Role distribution:');
    roleStats.forEach(stat => {
      console.log(`      ${stat.role}: ${stat.count}`);
    });

    const [invalidRoles] = await db.execute(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role NOT IN ('ADMIN', 'GURU', 'SISWA')
    `);
    console.log(`\n   📊 Invalid roles: ${invalidRoles[0].count}`);

    console.log('\n✅ Role enum fix completed successfully!');
    return true;

  } catch (error) {
    console.error('\n❌ Fix failed:', error);
    throw error;
  }
}

fixRoleEnum()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });


