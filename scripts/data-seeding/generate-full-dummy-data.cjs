/**
 * Script untuk Generate Data Dummy Lengkap - Sistem Absenta
 * 
 * Spesifikasi:
 * - 360 siswa (40 siswa x 9 kelas)
 * - 25 guru dengan berbagai mata pelajaran
 * - Jadwal full day Senin-Jumat (8 jam pelajaran/hari)
 * - Data absensi 1 semester penuh (Juli-Desember 2025)
 * - 50+ pengajuan banding untuk testing
 * 
 * Total Records: ~323,500+ records
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

// ================================================
// CONFIGURATION
// ================================================

const CONFIG = {
  STUDENTS_PER_CLASS: 40,
  TOTAL_TEACHERS: 25,
  SCHEDULE_HOURS: [
    { jam_ke: 1, jam_mulai: '07:00:00', jam_selesai: '07:45:00' },
    { jam_ke: 2, jam_mulai: '07:45:00', jam_selesai: '08:30:00' },
    { jam_ke: 3, jam_mulai: '08:30:00', jam_selesai: '09:15:00' },
    { jam_ke: 4, jam_mulai: '09:15:00', jam_selesai: '10:00:00' },
    { jam_ke: 5, jam_mulai: '10:15:00', jam_selesai: '11:00:00' }, // Break 15 min
    { jam_ke: 6, jam_mulai: '11:00:00', jam_selesai: '11:45:00' },
    { jam_ke: 7, jam_mulai: '12:30:00', jam_selesai: '13:15:00' }, // Break 45 min (lunch)
    { jam_ke: 8, jam_mulai: '13:15:00', jam_selesai: '14:00:00' }
  ],
  SEMESTER_START: '2025-07-01',
  SEMESTER_END: '2025-12-20'
};

// ================================================
// DATA MASTERS
// ================================================

const JURUSAN_DATA = ['RPL', 'TKJ', 'AK'];
const TINGKAT_DATA = ['X', 'XI', 'XII'];
const HARI_SEKOLAH = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

const MAPEL_DATA = {
  umum: [
    { nama: 'Matematika', kode: 'MTK' },
    { nama: 'Bahasa Indonesia', kode: 'BIND' },
    { nama: 'Bahasa Inggris', kode: 'BING' },
    { nama: 'Pendidikan Kewarganegaraan', kode: 'PKN' },
    { nama: 'Pendidikan Agama Islam', kode: 'PAI' },
    { nama: 'Pendidikan Jasmani', kode: 'PJOK' },
    { nama: 'Sejarah Indonesia', kode: 'SEJ' }
  ],
  RPL: [
    { nama: 'Pemrograman Dasar', kode: 'PD' },
    { nama: 'Basis Data', kode: 'BD' },
    { nama: 'Pemrograman Web', kode: 'PW' },
    { nama: 'Pemrograman Mobile', kode: 'PM' }
  ],
  TKJ: [
    { nama: 'Jaringan Dasar', kode: 'JD' },
    { nama: 'Sistem Operasi', kode: 'SO' },
    { nama: 'Administrasi Server', kode: 'AS' },
    { nama: 'Keamanan Jaringan', kode: 'KJ' }
  ],
  AK: [
    { nama: 'Akuntansi Dasar', kode: 'AD' },
    { nama: 'Komputer Akuntansi', kode: 'KA' },
    { nama: 'Administrasi Pajak', kode: 'AP' },
    { nama: 'Akuntansi Keuangan', kode: 'AKU' }
  ]
};

// Indonesian Names - 100+ variations
const NAMA_DEPAN = [
  'Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi', 'Indah', 'Joko',
  'Kartika', 'Lina', 'Made', 'Novi', 'Oka', 'Putri', 'Qori', 'Rina', 'Sari', 'Tari',
  'Umi', 'Vina', 'Wati', 'Yani', 'Zaki', 'Agus', 'Bayu', 'Candra', 'Dani', 'Erlang',
  'Fajar', 'Galih', 'Hendra', 'Irfan', 'Jaya', 'Krisna', 'Lukman', 'Mahendra', 'Nanda', 'Oki',
  'Putra', 'Qomar', 'Reza', 'Sigit', 'Teguh', 'Umar', 'Vino', 'Wahyu', 'Yoga', 'Zainal',
  'Ayu', 'Bella', 'Cindy', 'Diana', 'Elsa', 'Fani', 'Gina', 'Hana', 'Ima', 'Juli',
  'Kiki', 'Lisa', 'Mira', 'Nina', 'Ovi', 'Pita', 'Qori', 'Rini', 'Sinta', 'Tina',
  'Uli', 'Vivi', 'Wulan', 'Yuli', 'Zara', 'Andi', 'Bima', 'Chandra', 'Dimas', 'Efendi',
  'Farhan', 'Gilang', 'Haris', 'Irwan', 'Januar', 'Kemal', 'Lutfi', 'Malik', 'Naufal', 'Omar',
  'Pandu', 'Qais', 'Rafli', 'Satria', 'Taufik', 'Udin', 'Vian', 'Wisnu', 'Yusuf', 'Zaidan'
];

const NAMA_BELAKANG = [
  'Santoso', 'Pratama', 'Kusuma', 'Wijaya', 'Saputra', 'Kurniawan', 'Hidayat', 'Firmansyah', 'Nugroho', 'Wibowo',
  'Sari', 'Lestari', 'Rahayu', 'Wulandari', 'Anggraini', 'Permatasari', 'Novita', 'Susanti', 'Dewi', 'Putri',
  'Setiawan', 'Gunawan', 'Suryanto', 'Purwanto', 'Adi', 'Maulana', 'Rahman', 'Hakim', 'Ramadhan', 'Fadli',
  'Maharani', 'Azzahra', 'Safitri', 'Puspita', 'Aulia', 'Syahputri', 'Utami', 'Andini', 'Fadillah', 'Nurhaliza',
  'Prasetyo', 'Wahyudi', 'Sutanto', 'Hartono', 'Siahaan', 'Pangestu', 'Darmawan', 'Prabowo', 'Saputro', 'Yulianto'
];

// ================================================
// HELPER FUNCTIONS
// ================================================

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateSchoolDays(startDate, endDate) {
  const days = [];
  let current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Skip Sunday (0) and Saturday (6)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function getDayName(dateString) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const date = new Date(dateString);
  return days[date.getDay()];
}

function randomAttendanceStatus(hadirProbability = 0.92) {
  const rand = Math.random();
  if (rand < hadirProbability) return 'Hadir';
  if (rand < hadirProbability + 0.03) return 'Izin';
  if (rand < hadirProbability + 0.04) return 'Sakit';
  if (rand < hadirProbability + 0.005) return 'Dispen';
  return 'Alpa';
}

function generateKeterangan(status) {
  const keterangan = {
    'Izin': ['Keperluan keluarga', 'Acara keluarga', 'Urusan pribadi', 'Izin ke puskesmas'],
    'Sakit': ['Demam', 'Flu', 'Sakit perut', 'Sakit kepala', 'Batuk dan pilek'],
    'Dispen': ['Lomba', 'Kegiatan OSIS', 'Paskibra', 'PMR', 'Kegiatan sekolah', 'Upacara']
  };
  return pickRandom(keterangan[status] || ['']);
}

function randomYear() {
  return String(60 + Math.floor(Math.random() * 30)); // 1960-1989
}

function randomMonth() {
  return String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
}

function randomDay() {
  return String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
}

function progressLog(message, current, total) {
  const percentage = ((current / total) * 100).toFixed(1);
  console.log(`[${percentage}%] ${message}`);
}

// ================================================
// MAIN SEEDING FUNCTIONS
// ================================================

async function clearDataExceptAdmin(db) {
  console.log('\n🗑️  Membersihkan data lama (kecuali admin)...');
  
  await db.execute('SET FOREIGN_KEY_CHECKS = 0');
  
  try {
    // Delete in correct order to respect dependencies
    await db.execute('DELETE FROM banding_absen_detail');
    await db.execute('DELETE FROM pengajuan_banding_absen');
    await db.execute('DELETE FROM absensi_siswa');
    await db.execute('DELETE FROM absensi_guru_mapping');
    await db.execute('DELETE FROM absensi_guru_jadwal');
    await db.execute('DELETE FROM absensi_guru');
    await db.execute('DELETE FROM jadwal_guru');
    await db.execute('DELETE FROM jadwal');
    await db.execute('DELETE FROM siswa');
    await db.execute('DELETE FROM guru');
    await db.execute('DELETE FROM kelas');
    await db.execute('DELETE FROM mapel');
    await db.execute('DELETE FROM ruang_kelas');
    await db.execute('DELETE FROM users WHERE role != "ADMIN"');
    
    console.log('   ✅ Data lama berhasil dihapus');
  } finally {
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');
  }
}

async function seedRuangKelas(db) {
  console.log('\n📦 Seeding Ruang Kelas...');
  
  const ruangData = [];
  for (const tingkat of TINGKAT_DATA) {
    for (const jurusan of JURUSAN_DATA) {
      ruangData.push({
        kode_ruang: `R-${tingkat}-${jurusan}`,
        nama_ruang: jurusan === 'RPL' ? `Lab ${jurusan} ${tingkat}` : 
                    jurusan === 'TKJ' ? `Lab ${jurusan} ${tingkat}` : 
                    `Ruang ${jurusan} ${tingkat}`,
        kapasitas: 40
      });
    }
  }
  
  for (const ruang of ruangData) {
    await db.execute(
      'INSERT INTO ruang_kelas (kode_ruang, nama_ruang, kapasitas) VALUES (?, ?, ?)',
      [ruang.kode_ruang, ruang.nama_ruang, ruang.kapasitas]
    );
  }
  
  console.log(`   ✅ ${ruangData.length} ruang kelas berhasil ditambahkan`);
  return ruangData;
}

async function seedKelas(db, ruangData) {
  console.log('\n📚 Seeding Kelas...');
  
  const kelasIds = [];
  for (const tingkat of TINGKAT_DATA) {
    for (const jurusan of JURUSAN_DATA) {
      const namaKelas = `${tingkat} ${jurusan}`;
      const tingkatNum = tingkat === 'X' ? '10' : tingkat === 'XI' ? '11' : '12';
      const ruangCode = `R-${tingkat}-${jurusan}`;
      
      const [result] = await db.execute(
        'INSERT INTO kelas (nama_kelas, tingkat, ruang, kode_ruang) VALUES (?, ?, ?, ?)',
        [namaKelas, tingkatNum, ruangCode, ruangCode]
      );
      
      kelasIds.push({ id_kelas: result.insertId, nama_kelas: namaKelas, jurusan });
    }
  }
  
  console.log(`   ✅ ${kelasIds.length} kelas berhasil ditambahkan`);
  return kelasIds;
}

async function seedMapel(db) {
  console.log('\n📖 Seeding Mata Pelajaran...');
  
  const mapelIds = { umum: [], RPL: [], TKJ: [], AK: [] };
  
  // Mapel umum
  for (const mapel of MAPEL_DATA.umum) {
    const [result] = await db.execute(
      'INSERT INTO mapel (nama_mapel, kode_mapel) VALUES (?, ?)',
      [mapel.nama, mapel.kode]
    );
    mapelIds.umum.push({ id_mapel: result.insertId, ...mapel });
  }
  
  // Mapel kejuruan per jurusan
  for (const jurusan of JURUSAN_DATA) {
    for (const mapel of MAPEL_DATA[jurusan]) {
      const [result] = await db.execute(
        'INSERT INTO mapel (nama_mapel, kode_mapel) VALUES (?, ?)',
        [mapel.nama, mapel.kode]
      );
      mapelIds[jurusan].push({ id_mapel: result.insertId, ...mapel });
    }
  }
  
  const totalMapel = mapelIds.umum.length + mapelIds.RPL.length + mapelIds.TKJ.length + mapelIds.AK.length;
  console.log(`   ✅ ${totalMapel} mata pelajaran berhasil ditambahkan`);
  return mapelIds;
}

async function seedGuru(db, mapelIds) {
  console.log('\n👨‍🏫 Seeding Guru + Akun...');
  
  const guruData = [];
  const allMapel = [...mapelIds.umum, ...mapelIds.RPL, ...mapelIds.TKJ, ...mapelIds.AK];
  
  for (let i = 1; i <= CONFIG.TOTAL_TEACHERS; i++) {
    const nama = `${pickRandom(NAMA_DEPAN)} ${pickRandom(NAMA_BELAKANG)}`;
    const nip = `196${randomYear()}${randomMonth()}${randomDay()}${String(i).padStart(3, '0')}`;
    const username = `guru_${i}`;
    const password = await bcrypt.hash('guru123', 10);
    const mapel = allMapel[(i - 1) % allMapel.length];
    
    // Insert ke users table
    const [userResult] = await db.execute(
      'INSERT INTO users (username, password, role, email, status) VALUES (?, ?, ?, ?, ?)',
      [username, password, 'GURU', `${username}@smkn13.sch.id`, 'aktif']
    );
    
    // Insert ke guru table
    await db.execute(
      'INSERT INTO guru (id_guru, user_id, nip, nama, email, mapel_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [i, userResult.insertId, nip, nama, `${username}@smkn13.sch.id`, mapel.id_mapel, 'aktif']
    );
    
    guruData.push({ id_guru: i, nama, nip, mapel_id: mapel.id_mapel, username });
    
    if (i % 5 === 0) progressLog('Guru ditambahkan', i, CONFIG.TOTAL_TEACHERS);
  }
  
  console.log(`   ✅ ${guruData.length} guru + akun berhasil ditambahkan`);
  console.log(`   ℹ️  Login: guru_1 / guru123 (semua guru menggunakan password yang sama)`);
  return guruData;
}

async function seedSiswa(db, kelasData) {
  console.log('\n👨‍🎓 Seeding Siswa + Akun...');
  
  const siswaData = [];
  let siswaCounter = 1;
  
  for (const kelas of kelasData) {
    for (let i = 1; i <= CONFIG.STUDENTS_PER_CLASS; i++) {
      const nama = `${pickRandom(NAMA_DEPAN)} ${pickRandom(NAMA_BELAKANG)}`;
      const nis = `2024${String(siswaCounter).padStart(4, '0')}`;
      const username = `siswa_${nis}`;
      const password = await bcrypt.hash(`${nis}@2024`, 10);
      
      // Insert ke users
      const [userResult] = await db.execute(
        'INSERT INTO users (username, password, role, email, status) VALUES (?, ?, ?, ?, ?)',
        [username, password, 'SISWA', `${username}@smkn13.sch.id`, 'aktif']
      );
      
      // Insert ke siswa
      await db.execute(
        'INSERT INTO siswa (id_siswa, user_id, nis, nama, kelas_id, jabatan, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [siswaCounter, userResult.insertId, nis, nama, kelas.id_kelas, 
         i === 1 ? 'Ketua Kelas' : 'Sekretaris Kelas', 'aktif']
      );
      
      siswaData.push({ id_siswa: siswaCounter, nama, nis, kelas_id: kelas.id_kelas, username });
      
      if (siswaCounter % 50 === 0) progressLog('Siswa ditambahkan', siswaCounter, CONFIG.STUDENTS_PER_CLASS * kelasData.length);
      siswaCounter++;
    }
  }
  
  console.log(`   ✅ ${siswaData.length} siswa + akun berhasil ditambahkan`);
  console.log(`   ℹ️  Login: siswa_20240001 / 20240001@2024`);
  return siswaData;
}

async function seedJadwal(db, kelasData, guruData, mapelIds) {
  console.log('\n📅 Seeding Jadwal (Full Day)...');
  
  const jadwalData = [];
  let jadwalCounter = 0;
  
  for (const kelas of kelasData) {
    // Tentukan mapel untuk kelas ini
    const kelasMapel = [...mapelIds.umum, ...mapelIds[kelas.jurusan]];
    
    for (const hari of HARI_SEKOLAH) {
      for (const jam of CONFIG.SCHEDULE_HOURS) {
        // Assign mapel secara round-robin
        const mapel = kelasMapel[jam.jam_ke % kelasMapel.length];
        
        // Cari guru yang mengajar mapel ini
        const guru = guruData.find(g => g.mapel_id === mapel.id_mapel) || guruData[0];
        
        const [result] = await db.execute(
          'INSERT INTO jadwal (kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [kelas.id_kelas, mapel.id_mapel, guru.id_guru, hari, jam.jam_ke, jam.jam_mulai, jam.jam_selesai, 'aktif']
        );
        
        jadwalData.push({
          id_jadwal: result.insertId,
          kelas_id: kelas.id_kelas,
          guru_id: guru.id_guru,
          hari,
          jam_ke: jam.jam_ke,
          mapel_id: mapel.id_mapel
        });
        
        jadwalCounter++;
      }
    }
    
    progressLog('Jadwal kelas ditambahkan', kelasData.indexOf(kelas) + 1, kelasData.length);
  }
  
  console.log(`   ✅ ${jadwalData.length} jadwal berhasil ditambahkan`);
  return jadwalData;
}

async function seedAbsensiGuru(db, jadwalData, schoolDays) {
  console.log('\n✅ Seeding Absensi Guru (1 Semester)...');
  console.log(`   ℹ️  Hari sekolah: ${schoolDays.length} hari`);
  
  let recordCount = 0;
  
  for (let dayIndex = 0; dayIndex < schoolDays.length; dayIndex++) {
    const tanggal = schoolDays[dayIndex];
    const hari = getDayName(tanggal);
    
    // Get all jadwal for this day
    const jadwalHariIni = jadwalData.filter(j => j.hari === hari);
    
    for (const jadwal of jadwalHariIni) {
      const status = randomAttendanceStatus(0.95); // 95% hadir untuk guru
      const waktuCatat = `${tanggal} ${CONFIG.SCHEDULE_HOURS[jadwal.jam_ke - 1].jam_mulai}`;
      
      await db.execute(
        'INSERT INTO absensi_guru (jadwal_id, guru_id, kelas_id, tanggal, jam_ke, status, keterangan, waktu_catat, metode_absen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [jadwal.id_jadwal, jadwal.guru_id, jadwal.kelas_id, tanggal, jadwal.jam_ke, status, 
         status !== 'Hadir' ? generateKeterangan(status) : null, waktuCatat, 'manual']
      );
      
      recordCount++;
    }
    
    if ((dayIndex + 1) % 10 === 0) progressLog('Absensi guru ditambahkan', dayIndex + 1, schoolDays.length);
  }
  
  console.log(`   ✅ ${recordCount} record absensi guru berhasil ditambahkan`);
}

async function seedAbsensiSiswa(db, jadwalData, siswaData, schoolDays) {
  console.log('\n✅ Seeding Absensi Siswa (1 Semester)...');
  console.log(`   ⚠️  WARNING: Ini akan memakan waktu lama (~288,000 records)`);
  
  let recordCount = 0;
  let batchData = [];
  const BATCH_SIZE = 1000;
  
  for (let dayIndex = 0; dayIndex < schoolDays.length; dayIndex++) {
    const tanggal = schoolDays[dayIndex];
    const hari = getDayName(tanggal);
    
    const jadwalHariIni = jadwalData.filter(j => j.hari === hari);
    
    for (const jadwal of jadwalHariIni) {
      const siswaKelas = siswaData.filter(s => s.kelas_id === jadwal.kelas_id);
      
      for (const siswa of siswaKelas) {
        const status = randomAttendanceStatus(0.92); // 92% hadir untuk siswa
        
        batchData.push([
          siswa.id_siswa, jadwal.id_jadwal, tanggal, status,
          status !== 'Hadir' ? generateKeterangan(status) : null
        ]);
        
        recordCount++;
        
        // Batch insert every 1000 records
        if (batchData.length >= BATCH_SIZE) {
          const placeholders = batchData.map(() => '(?, ?, ?, ?, ?)').join(',');
          const values = batchData.flat();
          await db.execute(
            `INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan) VALUES ${placeholders}`,
            values
          );
          batchData = [];
        }
      }
    }
    
    if ((dayIndex + 1) % 5 === 0) progressLog('Absensi siswa ditambahkan', recordCount, schoolDays.length * jadwalData.length / 5);
  }
  
  // Insert remaining batch
  if (batchData.length > 0) {
    const placeholders = batchData.map(() => '(?, ?, ?, ?, ?)').join(',');
    const values = batchData.flat();
    await db.execute(
      `INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan) VALUES ${placeholders}`,
      values
    );
  }
  
  console.log(`   ✅ ${recordCount} record absensi siswa berhasil ditambahkan`);
}

async function seedPengajuanBanding(db, siswaData, jadwalData, schoolDays) {
  console.log('\n📝 Seeding Pengajuan Banding Absen...');
  
  const TOTAL_BANDING = 50;
  
  for (let i = 0; i < TOTAL_BANDING; i++) {
    const siswa = pickRandom(siswaData);
    const tanggal = pickRandom(schoolDays);
    const hari = getDayName(tanggal);
    
    // Get jadwal untuk siswa ini di hari tersebut
    const jadwalSiswa = jadwalData.filter(j => 
      j.kelas_id === siswa.kelas_id && j.hari === hari
    );
    
    if (jadwalSiswa.length > 0) {
      const jadwal = pickRandom(jadwalSiswa);
      const statusBanding = pickRandom(['pending', 'disetujui', 'ditolak']);
      
      await db.execute(`
        INSERT INTO pengajuan_banding_absen 
        (siswa_id, jadwal_id, tanggal_absen, status_asli, status_diajukan, 
         alasan_banding, status_banding, jenis_banding, tanggal_pengajuan) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [siswa.id_siswa, jadwal.id_jadwal, tanggal, 
         'Alpa', pickRandom(['Sakit', 'Izin']), 
         pickRandom([
           'Ada surat keterangan sakit dari puskesmas',
           'Izin keperluan keluarga mendadak',
           'Sakit flu berat',
           'Izin ke dokter gigi'
         ]),
         statusBanding, 'individual', tanggal]
      );
    }
  }
  
  console.log(`   ✅ ${TOTAL_BANDING} pengajuan banding berhasil ditambahkan`);
}

// ================================================
// MAIN EXECUTION
// ================================================

async function main() {
  let connection;
  
  try {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   GENERATE COMPREHENSIVE DUMMY DATA - Sistem Absenta         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📋 Spesifikasi:');
    console.log(`   - 360 siswa (40 x 9 kelas)`);
    console.log(`   - 25 guru`);
    console.log(`   - Jadwal full day (8 jam x 5 hari)`);
    console.log(`   - Absensi 1 semester (${CONFIG.SEMESTER_START} - ${CONFIG.SEMESTER_END})`);
    console.log('');
    
    // Connect to database
    console.log('🔌 Menghubungkan ke database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'absenta13',
      multipleStatements: true
    });
    console.log('   ✅ Koneksi berhasil!\n');
    
    // Generate school days
    const schoolDays = generateSchoolDays(CONFIG.SEMESTER_START, CONFIG.SEMESTER_END);
    console.log(`📅 Hari sekolah yang akan di-generate: ${schoolDays.length} hari\n`);
    
    // Start seeding
    const startTime = Date.now();
    
    // 1. Clear old data
    await clearDataExceptAdmin(connection);
    
    // 2. Seed master data
    const ruangData = await seedRuangKelas(connection);
    const kelasData = await seedKelas(connection, ruangData);
    const mapelIds = await seedMapel(connection);
    
    // 3. Seed users
    const guruData = await seedGuru(connection, mapelIds);
    const siswaData = await seedSiswa(connection, kelasData);
    
    // 4. Seed jadwal
    const jadwalData = await seedJadwal(connection, kelasData, guruData, mapelIds);
    
    // 5. Seed absensi
    await seedAbsensiGuru(connection, jadwalData, schoolDays);
    await seedAbsensiSiswa(connection, jadwalData, siswaData, schoolDays);
    
    // 6. Seed banding
    await seedPengajuanBanding(connection, siswaData, jadwalData, schoolDays);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SEEDING COMPLETE!                        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   ✅ Ruang Kelas: ${ruangData.length}`);
    console.log(`   ✅ Kelas: ${kelasData.length}`);
    console.log(`   ✅ Mata Pelajaran: ${mapelIds.umum.length + mapelIds.RPL.length + mapelIds.TKJ.length + mapelIds.AK.length}`);
    console.log(`   ✅ Guru + Akun: ${guruData.length}`);
    console.log(`   ✅ Siswa + Akun: ${siswaData.length}`);
    console.log(`   ✅ Jadwal: ${jadwalData.length}`);
    console.log(`   ✅ Hari Sekolah: ${schoolDays.length}`);
    console.log('');
    console.log('⏱️  Waktu eksekusi: ' + duration + ' detik');
    console.log('');
    console.log('🔐 Credentials untuk testing:');
    console.log('   Admin: admin / admin123');
    console.log('   Guru:  guru_1 / guru123');
    console.log('   Siswa: siswa_20240001 / 20240001@2024');
    
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

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script selesai dijalankan.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script gagal:', error.message);
    process.exit(1);
  });

