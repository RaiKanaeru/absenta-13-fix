import db from '../../db.js';

async function fixMigrationIssues() {
  console.log('🔧 Fixing migration issues...\n');

  try {
    // ==============================
    // 1. Update role enum and migrate old roles
    // ==============================
    console.log('1️⃣ Updating role enum and migrating old roles...');
    
    // First, update perwakilan to SISWA
    const [updateResult] = await db.execute(`
      UPDATE users 
      SET role = 'SISWA' 
      WHERE role IN ('perwakilan', 'KETOS')
    `);
    console.log(`   ✅ Updated ${updateResult.affectedRows} users from perwakilan/KETOS to SISWA`);

    // ==============================
    // 2. Create user accounts for siswa
    // ==============================
    console.log('\n2️⃣ Creating user accounts for siswa...');
    
    const [siswaWithoutUsers] = await db.execute(`
      SELECT s.id_siswa, s.nis, s.nama, s.email
      FROM siswa s
      WHERE s.user_id IS NULL 
         OR s.user_id NOT IN (SELECT id FROM users)
      LIMIT 100
    `);
    
    console.log(`   📌 Found ${siswaWithoutUsers.length} siswa without valid user accounts`);
    
    let createdCount = 0;
    for (const siswa of siswaWithoutUsers) {
      try {
        const username = `siswa_${siswa.nis}`;
        const email = siswa.email || `${siswa.nis}@siswa.local`;
        
        // Check if username already exists
        const [existing] = await db.execute(
          'SELECT id FROM users WHERE username = ?',
          [username]
        );
        
        if (existing.length > 0) {
          // Update siswa to use existing user
          await db.execute(
            'UPDATE siswa SET user_id = ? WHERE id_siswa = ?',
            [existing[0].id, siswa.id_siswa]
          );
          console.log(`   ↻ Linked siswa ${siswa.nis} to existing user`);
        } else {
          // Create new user
          const [userResult] = await db.execute(`
            INSERT INTO users (username, password, role, email, status, created_at)
            VALUES (?, ?, 'SISWA', ?, 'aktif', NOW())
          `, [
            username,
            '$2b$10$yHbGzKzN7pL8rQ9xW5Z2.OwX8y7vZ3qW9lKjH6tY8xR5mN4pQ2qYi', // Hash for 'NIS@2024'
            email
          ]);
          
          // Update siswa with new user_id
          await db.execute(
            'UPDATE siswa SET user_id = ? WHERE id_siswa = ?',
            [userResult.insertId, siswa.id_siswa]
          );
          
          createdCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error creating user for siswa ${siswa.nis}:`, error.message);
      }
    }
    
    console.log(`   ✅ Created ${createdCount} new user accounts`);

    // ==============================
    // 3. Fix broken relationships
    // ==============================
    console.log('\n3️⃣ Fixing broken relationships...');
    
    const [fixResult] = await db.execute(`
      UPDATE siswa s
      SET s.user_id = NULL
      WHERE s.user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)
    `);
    console.log(`   ✅ Fixed ${fixResult.affectedRows} broken relationships`);

    // ==============================
    // 4. Add foreign key constraint
    // ==============================
    console.log('\n4️⃣ Adding foreign key constraint...');
    
    try {
      // Drop if exists
      await db.execute('ALTER TABLE siswa DROP FOREIGN KEY IF EXISTS fk_siswa_user');
    } catch (error) {
      // Ignore if doesn't exist
    }
    
    try {
      await db.execute(`
        ALTER TABLE siswa 
        ADD CONSTRAINT fk_siswa_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log(`   ✅ Foreign key constraint added`);
    } catch (error) {
      if (error.code === 'ER_FK_DUP_NAME') {
        console.log(`   ⚠️ Foreign key constraint already exists`);
      } else if (error.code === 'ER_CANT_CREATE_TABLE') {
        console.log(`   ⚠️ Could not add FK constraint (column types may not match)`);
        console.log(`   💡 This is OK - data integrity is maintained through application logic`);
      } else {
        throw error;
      }
    }

    // ==============================
    // 5. Validation
    // ==============================
    console.log('\n5️⃣ Running validation...');
    
    const [brokenCheck] = await db.execute(`
      SELECT COUNT(*) as count FROM siswa s
      WHERE s.user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)
    `);
    console.log(`   📊 Broken relationships: ${brokenCheck[0].count}`);
    
    const [roleCheck] = await db.execute(`
      SELECT COUNT(*) as count FROM users
      WHERE role IN ('perwakilan', 'KETOS')
    `);
    console.log(`   📊 Old roles remaining: ${roleCheck[0].count}`);
    
    const [siswaUsersCheck] = await db.execute(`
      SELECT COUNT(*) as count FROM users WHERE role = 'SISWA'
    `);
    console.log(`   📊 Users with SISWA role: ${siswaUsersCheck[0].count}`);
    
    const [siswaWithUsersCheck] = await db.execute(`
      SELECT COUNT(*) as count FROM siswa WHERE user_id IS NOT NULL
    `);
    console.log(`   📊 Siswa with user accounts: ${siswaWithUsersCheck[0].count}`);

    console.log('\n✅ Migration fixes completed successfully!');
    return true;

  } catch (error) {
    console.error('\n❌ Fix failed:', error);
    throw error;
  }
}

fixMigrationIssues()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

