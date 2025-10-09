import mysql from 'mysql2/promise';

async function fixTestPerwakilanUser() {
  try {
    console.log('🔧 Fixing testperwakilan user linkage...\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    // Get user_id from users table
    const [users] = await connection.execute(
      'SELECT id, username FROM users WHERE username = ? AND role = "siswa"',
      ['testperwakilan']
    );

    if (users.length === 0) {
      console.log('❌ User testperwakilan not found in users table');
      await connection.end();
      return;
    }

    const userId = users[0].id;
    console.log('👤 Found user ID:', userId);

    // Ensure siswa row exists; if not, create minimal row
    const [siswaRows] = await connection.execute(
      'SELECT id_siswa, user_id, nama, nama_pengguna, kelas_id FROM siswa WHERE id_siswa = ? OR user_id = ?',
      [userId, userId]
    );

    if (siswaRows.length === 0) {
      console.log('ℹ️ No siswa row found; creating one...');
      await connection.execute(
        'INSERT INTO siswa (id_siswa, user_id, nama_pengguna, nama, kelas_id, nis, jabatan, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, userId, 'testperwakilan', 'Test Perwakilan', 349, '99999999', 'Sekretaris Kelas', 'aktif']
      );
    } else {
      console.log('📋 Current siswa record:', siswaRows[0]);
      // Update siswa table to set correct user_id and username if missing
      await connection.execute(
        'UPDATE siswa SET user_id = ?, nama_pengguna = COALESCE(NULLIF(nama_pengguna, ''), ?), kelas_id = IFNULL(kelas_id, ?), status = IFNULL(status, ''aktif'') WHERE id_siswa = ? OR user_id IS NULL AND nama_pengguna = ? LIMIT 1',
        [userId, 'testperwakilan', 349, userId, 'testperwakilan']
      );
    }

    console.log('✅ Fixed testperwakilan user_id linkage');

    // Verify the fix
    const [updated] = await connection.execute(
      'SELECT id_siswa, user_id, nama_pengguna, nama, kelas_id, status FROM siswa WHERE id_siswa = ?',
      [userId]
    );

    console.log('📋 Updated siswa record:', updated[0]);

    await connection.end();
    console.log('\n🎉 Fix completed successfully! You can now test login with: testperwakilan / admin123');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixTestPerwakilanUser(); 