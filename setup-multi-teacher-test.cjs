const mysql = require('mysql2/promise');

async function setupMultiTeacherTest() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    console.log('🔧 Setting up Multi-Teacher schedules for testing...\n');

    await connection.beginTransaction();

    // Get sample schedule
    const [schedules] = await connection.execute(`
      SELECT 
        j.id_jadwal,
        j.guru_id as primary_guru_id,
        k.nama_kelas,
        m.nama_mapel,
        j.hari,
        j.jam_ke,
        g.nama as guru_utama
      FROM jadwal j
      JOIN kelas k ON j.kelas_id = k.id_kelas
      JOIN mapel m ON j.mapel_id = m.id_mapel
      JOIN guru g ON j.guru_id = g.id_guru
      WHERE j.status = 'aktif'
      ORDER BY RAND()
      LIMIT 3
    `);

    if (schedules.length === 0) {
      console.log('❌ No active schedules found');
      await connection.end();
      return;
    }

    // Get available teachers for assignment
    const [teachers] = await connection.execute(`
      SELECT id_guru, nama, nip
      FROM guru
      WHERE status = 'aktif'
      ORDER BY nama
      LIMIT 10
    `);

    console.log('📅 Creating Multi-Teacher Assignments:\n');

    for (const schedule of schedules) {
      // Get random teachers (not the primary teacher)
      const availableTeachers = teachers.filter(t => t.id_guru !== schedule.primary_guru_id);
      const additionalTeachers = availableTeachers.slice(0, 2); // Get 2 additional teachers

      console.log(`Schedule: ${schedule.nama_kelas} - ${schedule.nama_mapel}`);
      console.log(`  Hari: ${schedule.hari} (Jam ke-${schedule.jam_ke})`);
      console.log(`  Guru Utama: ${schedule.guru_utama}`);

      // Check if already has multi-teacher setup
      const [existing] = await connection.execute(
        'SELECT COUNT(*) as count FROM jadwal_guru WHERE jadwal_id = ?',
        [schedule.id_jadwal]
      );

      if (existing[0].count > 0) {
        console.log(`  ⚠️  Already has multi-teacher setup (skipping)`);
        console.log('');
        continue;
      }

      // Add additional teachers
      for (let i = 0; i < additionalTeachers.length; i++) {
        const teacher = additionalTeachers[i];
        const role = i === 0 ? 'secondary' : 'assistant';

        await connection.execute(
          `INSERT INTO jadwal_guru (jadwal_id, guru_id, status, dibuat_pada)
           VALUES (?, ?, 'aktif', NOW())
           ON DUPLICATE KEY UPDATE status = 'aktif'`,
          [schedule.id_jadwal, teacher.id_guru]
        );

        console.log(`  ✅ Added: ${teacher.nama} (${role})`);
      }

      console.log('');
    }

    await connection.commit();

    // Verify setup
    console.log('\n🔍 Verifying Multi-Teacher Schedules:\n');
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
        COUNT(DISTINCT jg.guru_id) as jumlah_guru_tambahan,
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
    `);

    if (multiTeacherSchedules.length > 0) {
      multiTeacherSchedules.forEach((sch, i) => {
        console.log(`${i + 1}. ${sch.nama_kelas} - ${sch.nama_mapel}`);
        console.log(`   Hari              : ${sch.hari} (Jam ke-${sch.jam_ke})`);
        console.log(`   Waktu             : ${sch.jam_mulai} - ${sch.jam_selesai}`);
        console.log(`   Guru Utama        : ${sch.guru_utama}`);
        console.log(`   Guru Tambahan     : ${sch.guru_tambahan}`);
        console.log(`   Total Guru        : ${parseInt(sch.jumlah_guru_tambahan) + 1}`);
        console.log('');
      });
    }

    console.log('✅ Multi-Teacher setup complete!\n');

    console.log('📝 CARA TESTING:');
    console.log('═'.repeat(80));
    console.log('1. Login sebagai Siswa: siswa_20240118 / 20240118@2024');
    console.log('2. Pilih "Jadwal Hari Ini"');
    console.log('3. Jika jadwal multi-guru aktif hari ini → semua guru akan muncul');
    console.log('4. Submit kehadiran untuk setiap guru');
    console.log('');
    console.log('5. Login sebagai Guru: guru_17 / guru123');
    console.log('6. Cek "Jadwal Mengajar" → jadwal tambahan akan muncul');
    console.log('7. Submit absensi siswa');
    console.log('');

    await connection.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

setupMultiTeacherTest();

