const mysql = require('mysql2/promise');

async function getTestAccounts() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    console.log('🔍 Getting test accounts for Siswa and Guru...\n');

    // Get student accounts
    console.log('👨‍🎓 AKUN SISWA (Student Accounts):');
    console.log('═'.repeat(80));
    
    const [students] = await connection.execute(`
      SELECT 
        s.id_siswa,
        s.nis,
        s.nama,
        u.username,
        s.jabatan,
        k.nama_kelas,
        u.status
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id_kelas
      WHERE u.status = 'aktif' AND s.status = 'aktif'
      ORDER BY k.nama_kelas, s.nama
      LIMIT 10
    `);

    if (students.length > 0) {
      students.forEach((s, i) => {
        console.log(`${i + 1}. ${s.nama}`);
        console.log(`   Username: ${s.username}`);
        console.log(`   Password: ${s.nis}@2024`);
        console.log(`   Kelas   : ${s.nama_kelas}`);
        console.log(`   Jabatan : ${s.jabatan}`);
        console.log(`   Status  : ${s.status}`);
        console.log('');
      });
    } else {
      console.log('❌ No student accounts found');
    }

    // Get teacher accounts
    console.log('\n👨‍🏫 AKUN GURU (Teacher Accounts):');
    console.log('═'.repeat(80));
    
    const [teachers] = await connection.execute(`
      SELECT 
        g.id_guru,
        g.nip,
        g.nama,
        u.username,
        m.nama_mapel,
        g.no_telp,
        u.status
      FROM guru g
      JOIN users u ON g.user_id = u.id
      LEFT JOIN mapel m ON g.mapel_id = m.id_mapel
      WHERE u.status = 'aktif' AND g.status = 'aktif'
      ORDER BY g.nama
      LIMIT 10
    `);

    if (teachers.length > 0) {
      teachers.forEach((t, i) => {
        console.log(`${i + 1}. ${t.nama}`);
        console.log(`   Username: ${t.username}`);
        console.log(`   Password: guru123`);
        console.log(`   NIP     : ${t.nip || '-'}`);
        console.log(`   Mapel   : ${t.nama_mapel || '-'}`);
        console.log(`   Status  : ${t.status}`);
        console.log('');
      });
    } else {
      console.log('❌ No teacher accounts found');
    }

    // Check for multi-teacher schedules
    console.log('\n📅 JADWAL DENGAN MULTI-GURU (Schedules with Multiple Teachers):');
    console.log('═'.repeat(80));
    
    const [multiTeacherSchedules] = await connection.execute(`
      SELECT 
        j.id_jadwal,
        k.nama_kelas,
        m.nama_mapel,
        j.hari,
        j.jam_ke,
        j.jam_mulai,
        j.jam_selesai,
        g_primary.nama as guru_utama,
        GROUP_CONCAT(g_additional.nama SEPARATOR ', ') as guru_tambahan
      FROM jadwal j
      JOIN kelas k ON j.kelas_id = k.id_kelas
      JOIN mapel m ON j.mapel_id = m.id_mapel
      JOIN guru g_primary ON j.guru_id = g_primary.id_guru
      LEFT JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id AND jg.status = 'aktif'
      LEFT JOIN guru g_additional ON jg.guru_id = g_additional.id_guru
      WHERE j.status = 'aktif'
      GROUP BY j.id_jadwal
      HAVING COUNT(DISTINCT jg.guru_id) > 0
      ORDER BY k.nama_kelas, j.hari, j.jam_ke
      LIMIT 5
    `);

    if (multiTeacherSchedules.length > 0) {
      multiTeacherSchedules.forEach((sch, i) => {
        console.log(`${i + 1}. ${sch.nama_kelas} - ${sch.nama_mapel}`);
        console.log(`   Hari          : ${sch.hari} (Jam ke-${sch.jam_ke})`);
        console.log(`   Waktu         : ${sch.jam_mulai} - ${sch.jam_selesai}`);
        console.log(`   Guru Utama    : ${sch.guru_utama}`);
        console.log(`   Guru Tambahan : ${sch.guru_tambahan || 'Tidak ada'}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  Belum ada jadwal dengan multi-guru');
      console.log('   Anda bisa menambahkan guru tambahan via Admin Dashboard > Kelola Jadwal');
    }

    // Quick login guide
    console.log('\n📝 CARA LOGIN:');
    console.log('═'.repeat(80));
    console.log('1. Buka browser dan akses: http://localhost:3000');
    console.log('2. Pilih role yang sesuai (Siswa/Guru)');
    console.log('3. Masukkan username dan password dari daftar di atas');
    console.log('4. Klik "Masuk"');
    console.log('');
    console.log('💡 TIPS:');
    console.log('   - Password Siswa: [NIS]@2024 (contoh: 20240001@2024)');
    console.log('   - Password Guru : guru123 (untuk semua guru)');
    console.log('   - Password Admin: admin123 (username: admin)');

    await connection.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getTestAccounts();




