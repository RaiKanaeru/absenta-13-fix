const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
  });
  
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║               VERIFIKASI DATA SEEDING                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Count users
  const [users] = await connection.execute('SELECT role, COUNT(*) as count FROM users GROUP BY role');
  console.log('👥 Users:');
  users.forEach(u => console.log(`   - ${u.role}: ${u.count}`));
  
  // Count guru
  const [guru] = await connection.execute('SELECT COUNT(*) as count FROM guru WHERE status = "aktif"');
  console.log(`\n👨‍🏫 Guru Aktif: ${guru[0].count}`);
  
  // Count siswa
  const [siswa] = await connection.execute('SELECT COUNT(*) as count FROM siswa WHERE status = "aktif"');
  console.log(`👨‍🎓 Siswa Aktif: ${siswa[0].count}`);
  
  // Count kelas
  const [kelas] = await connection.execute('SELECT nama_kelas, COUNT(*) as siswa_count FROM kelas k LEFT JOIN siswa s ON k.id_kelas = s.kelas_id GROUP BY k.id_kelas ORDER BY k.nama_kelas');
  console.log('\n📚 Kelas & Jumlah Siswa:');
  kelas.forEach(k => console.log(`   - ${k.nama_kelas}: ${k.siswa_count || 0} siswa`));
  
  // Count mapel
  const [mapel] = await connection.execute('SELECT COUNT(*) as count FROM mapel');
  console.log(`\n📖 Mata Pelajaran: ${mapel[0].count}`);
  
  // Count jadwal
  const [jadwal] = await connection.execute('SELECT hari, COUNT(*) as count FROM jadwal GROUP BY hari ORDER BY FIELD(hari, "Senin", "Selasa", "Rabu", "Kamis", "Jumat")');
  console.log('\n📅 Jadwal per Hari:');
  jadwal.forEach(j => console.log(`   - ${j.hari}: ${j.count} jadwal`));
  
  // Count absensi guru
  const [absensiGuru] = await connection.execute('SELECT status, COUNT(*) as count FROM absensi_guru GROUP BY status');
  console.log('\n✅ Absensi Guru:');
  let totalAbsensiGuru = 0;
  absensiGuru.forEach(a => {
    console.log(`   - ${a.status}: ${a.count}`);
    totalAbsensiGuru += a.count;
  });
  console.log(`   TOTAL: ${totalAbsensiGuru}`);
  
  // Count absensi siswa
  const [absensiSiswa] = await connection.execute('SELECT status, COUNT(*) as count FROM absensi_siswa GROUP BY status');
  console.log('\n✅ Absensi Siswa:');
  let totalAbsensiSiswa = 0;
  absensiSiswa.forEach(a => {
    console.log(`   - ${a.status}: ${a.count}`);
    totalAbsensiSiswa += a.count;
  });
  console.log(`   TOTAL: ${totalAbsensiSiswa}`);
  
  // Count banding
  const [banding] = await connection.execute('SELECT status_banding, COUNT(*) as count FROM pengajuan_banding_absen GROUP BY status_banding');
  console.log('\n📝 Pengajuan Banding:');
  banding.forEach(b => console.log(`   - ${b.status_banding}: ${b.count}`));
  
  // Sample logins
  const [sampleGuru] = await connection.execute('SELECT u.username, g.nama FROM users u JOIN guru g ON u.id = g.user_id LIMIT 3');
  console.log('\n🔐 Sample Login Guru:');
  sampleGuru.forEach(g => console.log(`   - ${g.username} (${g.nama}) / guru123`));
  
  const [sampleSiswa] = await connection.execute('SELECT u.username, s.nama, s.nis FROM users u JOIN siswa s ON u.id = s.user_id LIMIT 3');
  console.log('\n🔐 Sample Login Siswa:');
  sampleSiswa.forEach(s => console.log(`   - ${s.username} (${s.nama}) / ${s.nis}@2024`));
  
  await connection.end();
  
  console.log('\n✅ Verifikasi selesai!\n');
}

verifyData().catch(console.error);


