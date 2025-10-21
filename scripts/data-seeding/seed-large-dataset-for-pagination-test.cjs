/**
 * Seed Large Dataset for Pagination Testing
 * 
 * This script creates:
 * - 100 guru accounts
 * - 1250 siswa accounts (to test pagination with 63 pages at 20 items/page)
 * 
 * Run: node scripts/data-seeding/seed-large-dataset-for-pagination-test.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'absenta13',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Helper function to generate random name
const generateName = (prefix, index) => {
  const firstNames = [
    'Ahmad', 'Siti', 'Budi', 'Dewi', 'Eko', 'Fatimah', 'Gita', 'Hendra',
    'Indah', 'Joko', 'Kartika', 'Lukman', 'Maya', 'Nurul', 'Oki', 'Putri',
    'Rani', 'Satria', 'Tari', 'Umar', 'Vina', 'Wawan', 'Yanti', 'Zainal'
  ];
  const lastNames = [
    'Pratama', 'Putri', 'Santoso', 'Wijaya', 'Kusuma', 'Permana', 'Saputra',
    'Sari', 'Hidayat', 'Rahayu', 'Setiawan', 'Lestari', 'Wibowo', 'Andini',
    'Nugroho', 'Safitri', 'Hartono', 'Anggraini', 'Hakim', 'Maharani'
  ];
  
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  
  return `${firstName} ${lastName} ${prefix}${index + 1}`;
};

// Main seeding function
async function seedLargeDataset() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get existing kelas for siswa
    const [kelasData] = await connection.execute('SELECT id_kelas FROM kelas LIMIT 10');
    if (kelasData.length === 0) {
      throw new Error('No kelas found! Please seed kelas data first.');
    }
    
    // Get existing mapel for guru
    const [mapelData] = await connection.execute('SELECT id_mapel FROM mapel LIMIT 20');
    if (mapelData.length === 0) {
      throw new Error('No mapel found! Please seed mapel data first.');
    }
    
    console.log('\n📊 Starting data seeding...\n');
    
    // ========================================
    // PART 1: Seed 100 Guru
    // ========================================
    console.log('👨‍🏫 Seeding 100 Guru accounts...');
    
    const guruStartTime = Date.now();
    let guruCreated = 0;
    let guruSkipped = 0;
    
    for (let i = 0; i < 100; i++) {
      const nip = `1967${String(i + 1).padStart(6, '0')}`; // 196700001 - 196700100
      const nama = generateName('Guru', i);
      const username = `guru_${nip}`;
      const password = await bcrypt.hash('guru123', 10);
      const email = `${username}@smkn13.sch.id`;
      const mapel_id = mapelData[i % mapelData.length].id_mapel;
      const jenis_kelamin = i % 2 === 0 ? 'L' : 'P';
      const no_telp = `08${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`;
      
      try {
        await connection.beginTransaction();
        
        // Check if guru already exists
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE username = ?',
          [username]
        );
        
        if (existing.length > 0) {
          guruSkipped++;
          await connection.rollback();
          continue;
        }
        
        // Insert into users table
        const [userResult] = await connection.execute(
          `INSERT INTO users (username, password, role, email, nomor_telepon, status)
           VALUES (?, ?, 'GURU', ?, ?, 'aktif')`,
          [username, password, email, no_telp]
        );
        
        const userId = userResult.insertId;
        
        // Get next id_guru
        const [maxIdGuru] = await connection.execute(
          'SELECT MAX(id_guru) as max_id FROM guru'
        );
        const nextIdGuru = (maxIdGuru[0].max_id || 0) + 1;
        
        // Insert into guru table (removed deprecated nama_pengguna column)
        await connection.execute(
          `INSERT INTO guru (id_guru, user_id, nip, nama, email, mapel_id, no_telp, jenis_kelamin, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktif')`,
          [nextIdGuru, userId, nip, nama, email, mapel_id, no_telp, jenis_kelamin]
        );
        
        await connection.commit();
        guruCreated++;
        
        if ((i + 1) % 10 === 0) {
          console.log(`   ✓ Created ${i + 1}/100 guru...`);
        }
      } catch (error) {
        await connection.rollback();
        console.error(`   ✗ Error creating guru ${i + 1}:`, error.message);
        guruSkipped++;
      }
    }
    
    const guruTime = ((Date.now() - guruStartTime) / 1000).toFixed(2);
    console.log(`✅ Guru seeding complete!`);
    console.log(`   Created: ${guruCreated}, Skipped: ${guruSkipped}, Time: ${guruTime}s\n`);
    
    // ========================================
    // PART 2: Seed 1250 Siswa
    // ========================================
    console.log('👨‍🎓 Seeding 1250 Siswa accounts...');
    
    const siswaStartTime = Date.now();
    let siswaCreated = 0;
    let siswaSkipped = 0;
    
    for (let i = 0; i < 1250; i++) {
      const nis = `2024${String(i + 1).padStart(4, '0')}`; // 20240001 - 20241250
      const nama = generateName('Siswa', i);
      const username = `siswa_${nis}`;
      const password = await bcrypt.hash(`${nis}@2024`, 10);
      const email = `${username}@student.smkn13.sch.id`;
      const kelas_id = kelasData[i % kelasData.length].id_kelas;
      const jenis_kelamin = i % 2 === 0 ? 'L' : 'P';
      const jabatan = i % 10 === 0 ? 'Ketua Kelas' : i % 10 === 1 ? 'Wakil Ketua Kelas' : 'Sekretaris Kelas';
      const telepon_siswa = `08${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`;
      const telepon_orangtua = `08${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`;
      
      try {
        await connection.beginTransaction();
        
        // Check if siswa already exists
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE username = ?',
          [username]
        );
        
        if (existing.length > 0) {
          siswaSkipped++;
          await connection.rollback();
          continue;
        }
        
        // Insert into users table
        const [userResult] = await connection.execute(
          `INSERT INTO users (username, password, role, email, status)
           VALUES (?, ?, 'SISWA', ?, 'aktif')`,
          [username, password, email]
        );
        
        const userId = userResult.insertId;
        
        // Get next id_siswa
        const [maxIdSiswa] = await connection.execute(
          'SELECT MAX(id_siswa) as max_id FROM siswa'
        );
        const nextIdSiswa = (maxIdSiswa[0].max_id || 0) + 1;
        
        // Insert into siswa table
        await connection.execute(
          `INSERT INTO siswa (id_siswa, user_id, nis, nama, kelas_id, jabatan, jenis_kelamin, email, telepon_siswa, telepon_orangtua, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif')`,
          [nextIdSiswa, userId, nis, nama, kelas_id, jabatan, jenis_kelamin, email, telepon_siswa, telepon_orangtua]
        );
        
        await connection.commit();
        siswaCreated++;
        
        if ((i + 1) % 50 === 0) {
          console.log(`   ✓ Created ${i + 1}/1250 siswa...`);
        }
      } catch (error) {
        await connection.rollback();
        console.error(`   ✗ Error creating siswa ${i + 1}:`, error.message);
        siswaSkipped++;
      }
    }
    
    const siswaTime = ((Date.now() - siswaStartTime) / 1000).toFixed(2);
    console.log(`✅ Siswa seeding complete!`);
    console.log(`   Created: ${siswaCreated}, Skipped: ${siswaSkipped}, Time: ${siswaTime}s\n`);
    
    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n📊 SEEDING SUMMARY:');
    console.log('='.repeat(50));
    console.log(`👨‍🏫 Guru:`);
    console.log(`   - Created: ${guruCreated}`);
    console.log(`   - Skipped: ${guruSkipped}`);
    console.log(`   - Time: ${guruTime}s`);
    console.log('');
    console.log(`👨‍🎓 Siswa:`);
    console.log(`   - Created: ${siswaCreated}`);
    console.log(`   - Skipped: ${siswaSkipped}`);
    console.log(`   - Time: ${siswaTime}s`);
    console.log('='.repeat(50));
    console.log('');
    
    // Verify counts
    const [guruCount] = await connection.execute('SELECT COUNT(*) as count FROM guru WHERE status = "aktif"');
    const [siswaCount] = await connection.execute('SELECT COUNT(*) as count FROM siswa WHERE status = "aktif"');
    
    console.log('✅ VERIFICATION:');
    console.log(`   Total Guru (aktif): ${guruCount[0].count}`);
    console.log(`   Total Siswa (aktif): ${siswaCount[0].count}`);
    console.log('');
    console.log('🎉 Data seeding complete!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Restart your server (npm run server)');
    console.log('   2. Login as admin');
    console.log('   3. Test pagination on:');
    console.log('      - Kelola Akun Siswa (should have 63 pages at 20 items/page)');
    console.log('      - Data Guru (should have 5+ pages at 20 items/page)');
    console.log('      - Data Siswa (should have 63 pages at 20 items/page)');
    console.log('      - Daftar Akun Guru (should have 5+ pages at 20 items/page)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seeding
seedLargeDataset()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

