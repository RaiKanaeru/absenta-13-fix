/**
 * Script untuk menghapus semua data dari database kecuali akun ADMIN
 * 
 * ⚠️ WARNING: Script ini akan menghapus SEMUA data kecuali admin!
 * - Semua siswa dan data siswa
 * - Semua guru dan data guru  
 * - Semua jadwal
 * - Semua absensi
 * - Semua kelas, mapel, jurusan
 * - HANYA akun dengan role 'ADMIN' yang akan dipertahankan
 * 
 * Gunakan dengan hati-hati!
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'absenta13',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function deleteAllDataExceptAdmin() {
  let connection;
  
  try {
    console.log('🔌 Menghubungkan ke database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Koneksi berhasil!\n');
    
    // Konfirmasi
    console.log('⚠️  WARNING: Script ini akan menghapus SEMUA data kecuali akun ADMIN!');
    console.log('📋 Data yang akan dihapus:');
    console.log('   - Semua siswa dan data terkait');
    console.log('   - Semua guru dan data terkait');
    console.log('   - Semua jadwal dan absensi');
    console.log('   - Semua kelas, mapel, jurusan');
    console.log('   - Semua pengajuan banding');
    console.log('   - HANYA users dengan role = "ADMIN" yang dipertahankan\n');
    
    // Cek jumlah admin
    const [adminCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "ADMIN"'
    );
    
    if (adminCheck[0].count === 0) {
      console.error('❌ ERROR: Tidak ada akun ADMIN yang ditemukan!');
      console.error('   Operasi dibatalkan untuk keamanan.');
      return;
    }
    
    console.log(`✅ Ditemukan ${adminCheck[0].count} akun ADMIN yang akan dipertahankan\n`);
    
    // Mulai transaction
    console.log('🔄 Memulai transaction...\n');
    await connection.beginTransaction();
    
    // Nonaktifkan foreign key checks sementara
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    try {
      // 1. Hapus banding absen details
      console.log('🗑️  [1/12] Menghapus banding_absen_detail...');
      const [result1] = await connection.execute('DELETE FROM banding_absen_detail');
      console.log(`   ✅ ${result1.affectedRows} rows dihapus`);
      
      // 2. Hapus pengajuan banding absen
      console.log('🗑️  [2/12] Menghapus pengajuan_banding_absen...');
      const [result2] = await connection.execute('DELETE FROM pengajuan_banding_absen');
      console.log(`   ✅ ${result2.affectedRows} rows dihapus`);
      
      // 3. Hapus absensi siswa
      console.log('🗑️  [3/12] Menghapus absensi_siswa...');
      const [result3] = await connection.execute('DELETE FROM absensi_siswa');
      console.log(`   ✅ ${result3.affectedRows} rows dihapus`);
      
      // 4. Hapus absensi guru mapping
      console.log('🗑️  [4/12] Menghapus absensi_guru_mapping...');
      const [result4] = await connection.execute('DELETE FROM absensi_guru_mapping');
      console.log(`   ✅ ${result4.affectedRows} rows dihapus`);
      
      // 5. Hapus absensi guru jadwal
      console.log('🗑️  [5/12] Menghapus absensi_guru_jadwal...');
      const [result5] = await connection.execute('DELETE FROM absensi_guru_jadwal');
      console.log(`   ✅ ${result5.affectedRows} rows dihapus`);
      
      // 6. Hapus absensi guru
      console.log('🗑️  [6/12] Menghapus absensi_guru...');
      const [result6] = await connection.execute('DELETE FROM absensi_guru');
      console.log(`   ✅ ${result6.affectedRows} rows dihapus`);
      
      // 7. Hapus jadwal guru
      console.log('🗑️  [7/12] Menghapus jadwal_guru...');
      const [result7] = await connection.execute('DELETE FROM jadwal_guru');
      console.log(`   ✅ ${result7.affectedRows} rows dihapus`);
      
      // 8. Hapus jadwal
      console.log('🗑️  [8/12] Menghapus jadwal...');
      const [result8] = await connection.execute('DELETE FROM jadwal');
      console.log(`   ✅ ${result8.affectedRows} rows dihapus`);
      
      // 9. Hapus siswa
      console.log('🗑️  [9/12] Menghapus siswa...');
      const [result9] = await connection.execute('DELETE FROM siswa');
      console.log(`   ✅ ${result9.affectedRows} rows dihapus`);
      
      // 10. Hapus guru
      console.log('🗑️  [10/12] Menghapus guru...');
      const [result10] = await connection.execute('DELETE FROM guru');
      console.log(`   ✅ ${result10.affectedRows} rows dihapus`);
      
      // 11. Hapus kelas dan mapel
      console.log('🗑️  [11/12] Menghapus kelas, mapel, ruang_kelas...');
      await connection.execute('DELETE FROM kelas');
      await connection.execute('DELETE FROM mapel');
      await connection.execute('DELETE FROM ruang_kelas');
      console.log(`   ✅ Selesai`);
      
      // 12. Hapus users KECUALI admin
      console.log('🗑️  [12/12] Menghapus users (kecuali ADMIN)...');
      const [result12] = await connection.execute('DELETE FROM users WHERE role != "ADMIN"');
      console.log(`   ✅ ${result12.affectedRows} rows dihapus`);
      
      // Aktifkan kembali foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      // Commit transaction
      console.log('\n✅ Semua data berhasil dihapus!');
      console.log('💾 Melakukan commit transaction...');
      await connection.commit();
      
      // Verifikasi
      console.log('\n📊 Verifikasi data yang tersisa:');
      const [adminCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "ADMIN"');
      const [totalUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
      const [siswaCount] = await connection.execute('SELECT COUNT(*) as count FROM siswa');
      const [guruCount] = await connection.execute('SELECT COUNT(*) as count FROM guru');
      const [jadwalCount] = await connection.execute('SELECT COUNT(*) as count FROM jadwal');
      
      console.log(`   ✅ Admin: ${adminCount[0].count}`);
      console.log(`   ✅ Total Users: ${totalUsers[0].count} (seharusnya = jumlah admin)`);
      console.log(`   ✅ Siswa: ${siswaCount[0].count} (seharusnya = 0)`);
      console.log(`   ✅ Guru: ${guruCount[0].count} (seharusnya = 0)`);
      console.log(`   ✅ Jadwal: ${jadwalCount[0].count} (seharusnya = 0)`);
      
      console.log('\n🎉 Database berhasil dibersihkan!');
      console.log('✅ Hanya akun ADMIN yang tersisa.');
      
    } catch (error) {
      // Rollback jika ada error
      console.error('\n❌ ERROR saat menghapus data!');
      console.error('🔄 Melakukan rollback...');
      await connection.rollback();
      
      // Aktifkan kembali foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      throw error;
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Koneksi database ditutup.');
    }
  }
}

// Jalankan script
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║   DELETE ALL DATA EXCEPT ADMIN - Absenta Database Cleanup     ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

deleteAllDataExceptAdmin()
  .then(() => {
    console.log('\n✅ Script selesai dijalankan.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script gagal:', error.message);
    process.exit(1);
  });

