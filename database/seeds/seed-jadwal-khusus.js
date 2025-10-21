import { db } from '../../db.js';

async function seedJadwalKhusus() {
  let connection;
  
  try {
    console.log('🚀 Starting jadwal_khusus seeding...');
    
    connection = await db.getConnection();
    
    // Get all kelas
    const [kelasList] = await connection.execute(
      'SELECT id_kelas, nama_kelas FROM kelas WHERE status = "aktif" ORDER BY nama_kelas'
    );
    
    console.log(`📚 Found ${kelasList.length} active classes`);
    
    // Get all guru (for perwalian assignment)
    const [guruList] = await connection.execute(
      'SELECT id_guru, nama FROM guru WHERE status = "aktif" ORDER BY id_guru'
    );
    
    console.log(`👨‍🏫 Found ${guruList.length} active teachers`);
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    // 1. UPACARA SENIN (untuk semua kelas - kelas_id = NULL)
    console.log('\n📢 Creating Upacara Senin (all classes)...');
    
    try {
      await connection.execute(
        `INSERT INTO jadwal_khusus 
         (kelas_id, jenis_kegiatan, nama_kegiatan, hari, jam_mulai, jam_selesai, guru_id, keterangan, status)
         VALUES (NULL, 'upacara', 'Upacara Bendera', 'Senin', '07:00:00', '07:30:00', NULL, 'Upacara bendera setiap hari Senin', 'aktif')`
      );
      insertedCount++;
      console.log('  ✅ Upacara Senin created');
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        skippedCount++;
        console.log('  ⏭️  Upacara Senin already exists');
      } else {
        throw error;
      }
    }
    
    // 2. PERWALIAN SENIN (untuk setiap kelas dengan wali kelas)
    console.log('\n👥 Creating Perwalian Senin for each class...');
    
    for (let i = 0; i < kelasList.length; i++) {
      const kelas = kelasList[i];
      const guru = guruList[i % guruList.length]; // Assign guru secara round-robin
      
      try {
        await connection.execute(
          `INSERT INTO jadwal_khusus 
           (kelas_id, jenis_kegiatan, nama_kegiatan, hari, jam_mulai, jam_selesai, guru_id, keterangan, status)
           VALUES (?, 'perwalian', ?, 'Senin', '07:30:00', '08:00:00', ?, 'Perwalian kelas setelah upacara', 'aktif')`,
          [kelas.id_kelas, `Perwalian ${kelas.nama_kelas}`, guru.id_guru]
        );
        insertedCount++;
        console.log(`  ✅ Perwalian created for ${kelas.nama_kelas} (Wali: ${guru.nama})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          skippedCount++;
          console.log(`  ⏭️  Perwalian for ${kelas.nama_kelas} already exists`);
        } else {
          console.error(`  ❌ Error creating perwalian for ${kelas.nama_kelas}:`, error.message);
        }
      }
    }
    
    // 3. ISTIRAHAT 1 (berbeda per kelas)
    console.log('\n☕ Creating Istirahat 1 (different time per class)...');
    
    const istirahatSchedules = [
      { time: '09:30:00', end: '09:45:00', description: 'Istirahat pagi' },
      { time: '10:00:00', end: '10:15:00', description: 'Istirahat pagi' },
      { time: '09:45:00', end: '10:00:00', description: 'Istirahat pagi' }
    ];
    
    const hariSekolah = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    
    for (let i = 0; i < kelasList.length; i++) {
      const kelas = kelasList[i];
      const schedule = istirahatSchedules[i % istirahatSchedules.length];
      
      for (const hari of hariSekolah) {
        try {
          await connection.execute(
            `INSERT INTO jadwal_khusus 
             (kelas_id, jenis_kegiatan, nama_kegiatan, hari, jam_mulai, jam_selesai, guru_id, keterangan, status)
             VALUES (?, 'istirahat', 'Istirahat 1', ?, ?, ?, NULL, ?, 'aktif')`,
            [kelas.id_kelas, hari, schedule.time, schedule.end, schedule.description]
          );
          insertedCount++;
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            skippedCount++;
          } else {
            console.error(`  ❌ Error creating istirahat for ${kelas.nama_kelas} on ${hari}:`, error.message);
          }
        }
      }
      
      console.log(`  ✅ Istirahat 1 created for ${kelas.nama_kelas} (${schedule.time} - ${schedule.end})`);
    }
    
    // 4. ISTIRAHAT 2 / SHOLAT DZUHUR (untuk semua kelas di hari Senin-Kamis)
    console.log('\n🕌 Creating Istirahat 2 / Sholat Dzuhur (all classes)...');
    
    const hariDzuhur = ['Senin', 'Selasa', 'Rabu', 'Kamis'];
    
    for (const hari of hariDzuhur) {
      for (const kelas of kelasList) {
        try {
          await connection.execute(
            `INSERT INTO jadwal_khusus 
             (kelas_id, jenis_kegiatan, nama_kegiatan, hari, jam_mulai, jam_selesai, guru_id, keterangan, status)
             VALUES (?, 'istirahat', 'Istirahat 2 / Sholat Dzuhur', ?, '12:00:00', '13:00:00', NULL, 'Waktu sholat Dzuhur dan makan siang', 'aktif')`,
            [kelas.id_kelas, hari]
          );
          insertedCount++;
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            skippedCount++;
          } else {
            console.error(`  ❌ Error creating istirahat 2 for ${kelas.nama_kelas} on ${hari}:`, error.message);
          }
        }
      }
    }
    
    console.log(`  ✅ Istirahat 2 / Sholat Dzuhur created for all classes on Senin-Kamis`);
    
    // 5. ISTIRAHAT JUMAT (lebih panjang untuk Sholat Jumat)
    console.log('\n🕌 Creating Istirahat Jumat / Sholat Jumat (all classes)...');
    
    for (const kelas of kelasList) {
      try {
        await connection.execute(
          `INSERT INTO jadwal_khusus 
           (kelas_id, jenis_kegiatan, nama_kegiatan, hari, jam_mulai, jam_selesai, guru_id, keterangan, status)
           VALUES (?, 'istirahat', 'Istirahat / Sholat Jumat', 'Jumat', '11:30:00', '13:00:00', NULL, 'Waktu sholat Jumat dan makan siang (lebih panjang)', 'aktif')`,
          [kelas.id_kelas]
        );
        insertedCount++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          skippedCount++;
        } else {
          console.error(`  ❌ Error creating istirahat Jumat for ${kelas.nama_kelas}:`, error.message);
        }
      }
    }
    
    console.log(`  ✅ Istirahat Jumat created for all classes`);
    
    // Summary
    console.log('\n✨ Seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Inserted: ${insertedCount} records`);
    console.log(`   - Skipped (duplicates): ${skippedCount} records`);
    console.log(`   - Total: ${insertedCount + skippedCount} records processed`);
    
    // Verify data
    const [jadwalKhususCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM jadwal_khusus WHERE status = "aktif"'
    );
    
    console.log(`\n✅ Current active jadwal_khusus in database: ${jadwalKhususCount[0].count}`);
    
    // Show sample data
    const [samples] = await connection.execute(
      `SELECT jk.*, k.nama_kelas, g.nama as nama_guru 
       FROM jadwal_khusus jk
       LEFT JOIN kelas k ON jk.kelas_id = k.id_kelas
       LEFT JOIN guru g ON jk.guru_id = g.id_guru
       WHERE jk.status = 'aktif'
       ORDER BY jk.jenis_kegiatan, jk.hari, jk.jam_mulai
       LIMIT 10`
    );
    
    console.log('\n📋 Sample jadwal_khusus data:');
    console.table(samples.map(s => ({
      ID: s.id,
      Jenis: s.jenis_kegiatan,
      Nama: s.nama_kegiatan,
      Kelas: s.nama_kelas || 'SEMUA KELAS',
      Hari: s.hari,
      Jam: `${s.jam_mulai.substring(0, 5)} - ${s.jam_selesai.substring(0, 5)}`,
      Guru: s.nama_guru || '-'
    })));
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

// Run seeding
seedJadwalKhusus();

