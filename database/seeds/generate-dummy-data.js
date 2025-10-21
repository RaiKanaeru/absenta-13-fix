/**
 * Generate Dummy Data untuk Testing Export Endpoints
 * Generates realistic test data untuk semua tabel
 */

import { db } from '../../db.js';
import bcrypt from 'bcrypt';

// Configuration
const CONFIG = {
    KELAS_COUNT: 9, // Total kelas yang akan dibuat
    SISWA_PER_KELAS: 30,
    GURU_COUNT: 20,
    MAPEL_COUNT: 12,
    JADWAL_PER_KELAS: 8,
    DAYS_TO_GENERATE: 30, // Generate absensi untuk 30 hari terakhir
    BANDING_PERCENTAGE: 0.05 // 5% absensi akan ada banding
};

// Data Master
const KELAS_DATA = [
    { nama: 'PPLG 10', tingkat: '10', ruang: 'R101', kode: 'PPLG-10-1' },
    { nama: 'PPLG 11', tingkat: '11', ruang: 'R102', kode: 'PPLG-11-1' },
    { nama: 'PPLG 12', tingkat: '12', ruang: 'R103', kode: 'PPLG-12-1' },
    { nama: 'TKJ 10', tingkat: '10', ruang: 'R201', kode: 'TKJ-10-1' },
    { nama: 'TKJ 11', tingkat: '11', ruang: 'R202', kode: 'TKJ-11-1' },
    { nama: 'TKJ 12', tingkat: '12', ruang: 'R203', kode: 'TKJ-12-1' },
    { nama: 'RPL 10', tingkat: '10', ruang: 'R301', kode: 'RPL-10-1' },
    { nama: 'RPL 11', tingkat: '11', ruang: 'R302', kode: 'RPL-11-1' },
    { nama: 'RPL 12', tingkat: '12', ruang: 'R303', kode: 'RPL-12-1' }
];

const MAPEL_DATA = [
    { kode: 'MTK', nama: 'Matematika' },
    { kode: 'IPA', nama: 'Ilmu Pengetahuan Alam' },
    { kode: 'IPS', nama: 'Ilmu Pengetahuan Sosial' },
    { kode: 'BIN', nama: 'Bahasa Indonesia' },
    { kode: 'BING', nama: 'Bahasa Inggris' },
    { kode: 'PBO', nama: 'Pemrograman Berorientasi Objek' },
    { kode: 'WEB', nama: 'Pemrograman Web' },
    { kode: 'DB', nama: 'Basis Data' },
    { kode: 'JARKOM', nama: 'Jaringan Komputer' },
    { kode: 'SIJA', nama: 'Sistem Jaringan dan Aplikasi' },
    { kode: 'PKK', nama: 'Produk Kreatif dan Kewirausahaan' },
    { kode: 'PPKN', nama: 'Pendidikan Pancasila dan Kewarganegaraan' }
];

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

const NAMA_DEPAN = [
    'Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Huda',
    'Indra', 'Joko', 'Kartika', 'Lina', 'Maya', 'Nurul', 'Omar', 'Putri',
    'Qori', 'Raihan', 'Siti', 'Taufik', 'Umar', 'Vina', 'Wulan', 'Xavier',
    'Yuni', 'Zahra', 'Andi', 'Bella', 'Candra', 'Dian', 'Elsa', 'Firman',
    'Galih', 'Hani', 'Ilham', 'Jasmine', 'Kevin', 'Laila', 'Mira', 'Nabil'
];

const NAMA_BELAKANG = [
    'Pratama', 'Kurniawan', 'Saputra', 'Wijaya', 'Santoso', 'Hidayat',
    'Firmansyah', 'Permana', 'Setiawan', 'Ramadan', 'Hakim', 'Nugroho',
    'Putra', 'Sari', 'Lestari', 'Maharani', 'Rahman', 'Yusuf', 'Ibrahim',
    'Fahmi', 'Nadia', 'Aisyah', 'Rizki', 'Surya', 'Cahaya', 'Bintang'
];

// Utility Functions
function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNama() {
    return `${randomElement(NAMA_DEPAN)} ${randomElement(NAMA_BELAKANG)}`;
}

function generateNIP() {
    return `19${randomInt(70, 99)}${randomInt(10, 12)}${randomInt(10, 28)}${randomInt(100000, 999999)}`;
}

function generateNIS(year, index) {
    return `${year}${String(index).padStart(4, '0')}`;
}

function generateEmail(nama) {
    return nama.toLowerCase().replace(/\s+/g, '.') + '@smkn13jakarta.sch.id';
}

function getDateRange(days) {
    const dates = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Skip weekends
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            dates.push(date.toISOString().split('T')[0]);
        }
    }
    
    return dates;
}

function randomStatus(weights = { Hadir: 0.8, Izin: 0.1, Sakit: 0.05, Alpa: 0.03, Dispen: 0.02 }) {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [status, weight] of Object.entries(weights)) {
        cumulative += weight;
        if (rand <= cumulative) return status;
    }
    
    return 'Hadir';
}

// Main Seeding Functions
async function seedKelas() {
    console.log('\n🏫 Seeding Kelas...');
    
    const kelasList = [];
    
    for (const kelas of KELAS_DATA) {
        try {
            const [result] = await db.execute(
                'INSERT INTO kelas (nama_kelas, ruang, kode_ruang) VALUES (?, ?, ?)',
                [kelas.nama, kelas.ruang, kelas.kode]
            );
            
            kelasList.push({
                id_kelas: result.insertId,
                nama_kelas: kelas.nama,
                tingkat: kelas.tingkat
            });
        } catch (error) {
            // Jika sudah ada, ambil yang existing
            if (error.code === 'ER_DUP_ENTRY') {
                const [existing] = await db.execute(
                    'SELECT id_kelas, nama_kelas FROM kelas WHERE nama_kelas = ?',
                    [kelas.nama]
                );
                if (existing.length > 0) {
                    kelasList.push({
                        id_kelas: existing[0].id_kelas,
                        nama_kelas: existing[0].nama_kelas,
                        tingkat: kelas.tingkat
                    });
                }
            } else {
                throw error;
            }
        }
    }
    
    console.log(`✅ Created/Found ${kelasList.length} kelas`);
    return kelasList;
}

async function seedMapel() {
    console.log('\n📖 Seeding Mata Pelajaran...');
    
    const mapelList = [];
    
    for (const mapel of MAPEL_DATA) {
        const [result] = await db.execute(
            'INSERT INTO mapel (kode_mapel, nama_mapel) VALUES (?, ?) ON DUPLICATE KEY UPDATE id_mapel = LAST_INSERT_ID(id_mapel)',
            [mapel.kode, mapel.nama]
        );
        
        mapelList.push({
            id_mapel: result.insertId,
            nama_mapel: mapel.nama,
            kode_mapel: mapel.kode
        });
    }
    
    console.log(`✅ Created ${mapelList.length} mata pelajaran`);
    return mapelList;
}

async function seedGuru(mapelList) {
    console.log('\n👨‍🏫 Seeding Guru...');
    
    const guruList = [];
    const password = await bcrypt.hash('guru123', 10);
    
    for (let i = 1; i <= CONFIG.GURU_COUNT; i++) {
        const nama = generateNama();
        const username = `guru_${i}`;
        const nip = generateNIP();
        const email = generateEmail(nama);
        const mapel = randomElement(mapelList);
        
        // Create user account
        const [userResult] = await db.execute(
            'INSERT INTO users (username, password, role, email, status) VALUES (?, ?, "GURU", ?, "aktif")',
            [username, password, email]
        );
        
        // Create guru record
        const [guruResult] = await db.execute(
            'INSERT INTO guru (id_guru, user_id, nip, nama, email, mata_pelajaran, mapel_id, status, jenis_kelamin) VALUES (?, ?, ?, ?, ?, ?, ?, "aktif", ?)',
            [i, userResult.insertId, nip, nama, email, mapel.nama_mapel, mapel.id_mapel, randomElement(['L', 'P'])]
        );
        
        guruList.push({
            id_guru: i,
            user_id: userResult.insertId,
            nama: nama,
            mapel_id: mapel.id_mapel
        });
    }
    
    console.log(`✅ Created ${guruList.length} guru`);
    return guruList;
}

async function seedSiswa(kelasList) {
    console.log('\n👨‍🎓 Seeding Siswa...');
    
    const siswaList = [];
    const password = await bcrypt.hash('siswa123', 10);
    let globalIndex = 1;
    
    for (const kelas of kelasList) {
        console.log(`   Seeding kelas ${kelas.nama_kelas}...`);
        
        for (let i = 1; i <= CONFIG.SISWA_PER_KELAS; i++) {
            const nama = generateNama();
            const nis = generateNIS(2024, globalIndex);
            const username = `siswa_${nis}`;
            const email = generateEmail(nama);
            const jabatan = i === 1 ? 'Ketua Kelas' : (i === 2 ? 'Wakil Ketua' : 'Sekretaris Kelas');
            
            // Create user account
            const [userResult] = await db.execute(
                'INSERT INTO users (username, password, role, email, status) VALUES (?, ?, "SISWA", ?, "aktif")',
                [username, password, email]
            );
            
            // Create siswa record
            const [siswaResult] = await db.execute(
                'INSERT INTO siswa (id_siswa, user_id, nis, nama, kelas_id, jabatan, jenis_kelamin, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "aktif")',
                [globalIndex, userResult.insertId, nis, nama, kelas.id_kelas, jabatan, randomElement(['L', 'P']), email]
            );
            
            siswaList.push({
                id_siswa: globalIndex,
                user_id: userResult.insertId,
                nis: nis,
                nama: nama,
                kelas_id: kelas.id_kelas
            });
            
            globalIndex++;
        }
    }
    
    console.log(`✅ Created ${siswaList.length} siswa`);
    return siswaList;
}

async function seedJadwal(kelasList, mapelList, guruList) {
    console.log('\n📅 Seeding Jadwal...');
    
    const jadwalList = [];
    
    for (const kelas of kelasList) {
        let jamKe = 1;
        
        for (let i = 0; i < CONFIG.JADWAL_PER_KELAS; i++) {
            const hari = HARI[i % HARI.length];
            const mapel = randomElement(mapelList);
            const guru = guruList.find(g => g.mapel_id === mapel.id_mapel) || randomElement(guruList);
            
            const jamMulai = `${7 + Math.floor(jamKe / 2)}:00:00`;
            const jamSelesai = `${7 + Math.floor(jamKe / 2) + 1}:00:00`;
            
            const [result] = await db.execute(
                'INSERT INTO jadwal (kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai, status) VALUES (?, ?, ?, ?, ?, ?, ?, "aktif")',
                [kelas.id_kelas, mapel.id_mapel, guru.id_guru, hari, jamKe, jamMulai, jamSelesai]
            );
            
            jadwalList.push({
                id_jadwal: result.insertId,
                kelas_id: kelas.id_kelas,
                mapel_id: mapel.id_mapel,
                guru_id: guru.id_guru,
                hari: hari,
                jam_ke: jamKe
            });
            
            jamKe++;
        }
    }
    
    console.log(`✅ Created ${jadwalList.length} jadwal`);
    return jadwalList;
}

async function seedAbsensiSiswa(siswaList, jadwalList) {
    console.log('\n📝 Seeding Absensi Siswa...');
    
    const dates = getDateRange(CONFIG.DAYS_TO_GENERATE);
    let count = 0;
    
    console.log(`   Generating absensi for ${dates.length} days...`);
    
    for (const date of dates) {
        const dayOfWeek = new Date(date).toLocaleDateString('id-ID', { weekday: 'long' });
        const jadwalHariIni = jadwalList.filter(j => j.hari === dayOfWeek);
        
        for (const jadwal of jadwalHariIni) {
            const siswaKelas = siswaList.filter(s => s.kelas_id === jadwal.kelas_id);
            
            for (const siswa of siswaKelas) {
                const status = randomStatus();
                const keterangan = status === 'Izin' ? 'Izin keperluan keluarga' :
                                 status === 'Sakit' ? 'Sakit demam' :
                                 status === 'Dispen' ? 'Mengikuti lomba' : null;
                
                await db.execute(
                    'INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan) VALUES (?, ?, ?, ?, ?)',
                    [siswa.id_siswa, jadwal.id_jadwal, date, status, keterangan]
                );
                
                count++;
            }
        }
        
        if (count % 1000 === 0) {
            console.log(`   Progress: ${count} records...`);
        }
    }
    
    console.log(`✅ Created ${count} absensi siswa records`);
    return count;
}

async function seedAbsensiGuru(guruList, jadwalList) {
    console.log('\n📝 Seeding Absensi Guru...');
    
    const dates = getDateRange(CONFIG.DAYS_TO_GENERATE);
    let count = 0;
    
    for (const date of dates) {
        const dayOfWeek = new Date(date).toLocaleDateString('id-ID', { weekday: 'long' });
        const jadwalHariIni = jadwalList.filter(j => j.hari === dayOfWeek);
        
        // Group by guru
        const guruJadwal = {};
        for (const jadwal of jadwalHariIni) {
            if (!guruJadwal[jadwal.guru_id]) {
                guruJadwal[jadwal.guru_id] = [];
            }
            guruJadwal[jadwal.guru_id].push(jadwal);
        }
        
        for (const [guruId, jadwals] of Object.entries(guruJadwal)) {
            // Pick one jadwal representative for this guru on this day
            const jadwal = jadwals[0];
            const status = randomStatus({ Hadir: 0.85, Izin: 0.08, Sakit: 0.05, 'Tidak Hadir': 0.02 });
            const keterangan = status === 'Izin' ? 'Izin keperluan keluarga' :
                             status === 'Sakit' ? 'Sakit' : null;
            
            await db.execute(
                'INSERT INTO absensi_guru (jadwal_id, guru_id, tanggal, status, keterangan) VALUES (?, ?, ?, ?, ?)',
                [jadwal.id_jadwal, guruId, date, status, keterangan]
            );
            
            count++;
        }
    }
    
    console.log(`✅ Created ${count} absensi guru records`);
    return count;
}

async function seedBandingAbsen(siswaList, jadwalList) {
    console.log('\n⚖️ Seeding Pengajuan Banding Absen...');
    
    // Get some absensi siswa records to create banding
    const [absensiRecords] = await db.execute(`
        SELECT ase.*, s.id_siswa, j.id_jadwal, s.kelas_id 
        FROM absensi_siswa ase
        JOIN siswa s ON ase.siswa_id = s.id_siswa
        JOIN jadwal j ON ase.jadwal_id = j.id_jadwal
        WHERE ase.status IN ('Alpa', 'Izin')
        ORDER BY RAND()
        LIMIT ?
    `, [Math.floor(siswaList.length * CONFIG.BANDING_PERCENTAGE)]);
    
    let count = 0;
    
    for (const record of absensiRecords) {
        const statusBanding = randomElement(['pending', 'disetujui', 'ditolak']);
        const statusDiajukan = record.status === 'Alpa' ? 'Izin' : 'Hadir';
        const alasan = 'Saya sebenarnya ada keterangan tapi belum sempat menyampaikan ke guru';
        const catatanGuru = statusBanding !== 'pending' ? 
            (statusBanding === 'disetujui' ? 'Disetujui, bukti valid' : 'Ditolak, tidak ada bukti') : null;
        
        const tanggalKeputusan = statusBanding !== 'pending' ? new Date().toISOString().split('T')[0] : null;
        
        await db.execute(
            `INSERT INTO pengajuan_banding_absen 
            (siswa_id, jadwal_id, tanggal_absen, status_asli, status_diajukan, alasan_banding, 
             status_banding, catatan_guru, tanggal_keputusan, kelas_id, jenis_banding) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'individual')`,
            [record.id_siswa, record.id_jadwal, record.tanggal, record.status, statusDiajukan, 
             alasan, statusBanding, catatanGuru, tanggalKeputusan, record.kelas_id]
        );
        
        count++;
    }
    
    console.log(`✅ Created ${count} banding absen records`);
    return count;
}

async function seedSystemConfig() {
    console.log('\n⚙️ Seeding System Config (Letterhead)...');
    
    const defaultLetterhead = {
        enabled: true,
        logoLeftUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        logoRightUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        lines: [
            "PEMERINTAH PROVINSI DKI JAKARTA",
            "DINAS PENDIDIKAN",
            "SMK NEGERI 13 JAKARTA",
            "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
            "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
        ],
        alignment: "center"
    };
    
    const reportTypes = [
        'teacher-summary',
        'student-summary',
        'presensi-siswa',
        'rekap-ketidakhadiran',
        'rekap-ketidakhadiran-guru',
        'banding-absen'
    ];
    
    for (const reportType of reportTypes) {
        await db.execute(
            `INSERT INTO system_config (config_key, config_value, description) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE config_value = config_value`,
            [
                `letterhead_${reportType}`,
                JSON.stringify(defaultLetterhead),
                `Letterhead configuration for ${reportType} report`
            ]
        );
    }
    
    console.log(`✅ Created ${reportTypes.length} letterhead configs`);
}

// Main Execution
async function main() {
    console.log('🚀 Starting Dummy Data Generation...');
    console.log('=' .repeat(60));
    console.log(`📊 Configuration:`);
    console.log(`   - Kelas: ${CONFIG.KELAS_COUNT}`);
    console.log(`   - Siswa per Kelas: ${CONFIG.SISWA_PER_KELAS}`);
    console.log(`   - Guru: ${CONFIG.GURU_COUNT}`);
    console.log(`   - Mata Pelajaran: ${CONFIG.MAPEL_COUNT}`);
    console.log(`   - Days of Attendance: ${CONFIG.DAYS_TO_GENERATE}`);
    console.log('=' .repeat(60));
    
    try {
        const kelasList = await seedKelas();
        const mapelList = await seedMapel();
        const guruList = await seedGuru(mapelList);
        const siswaList = await seedSiswa(kelasList);
        const jadwalList = await seedJadwal(kelasList, mapelList, guruList);
        
        await seedAbsensiSiswa(siswaList, jadwalList);
        await seedAbsensiGuru(guruList, jadwalList);
        await seedBandingAbsen(siswaList, jadwalList);
        await seedSystemConfig();
        
        console.log('\n' + '=' .repeat(60));
        console.log('🎉 Data Generation Complete!');
        console.log('=' .repeat(60));
        console.log('📊 Summary:');
        console.log(`   - Kelas: ${kelasList.length}`);
        console.log(`   - Mata Pelajaran: ${mapelList.length}`);
        console.log(`   - Guru: ${guruList.length}`);
        console.log(`   - Siswa: ${siswaList.length}`);
        console.log(`   - Jadwal: ${jadwalList.length}`);
        console.log(`   - Estimated Absensi Siswa: ${siswaList.length * jadwalList.length / kelasList.length * getDateRange(CONFIG.DAYS_TO_GENERATE).length}`);
        console.log(`   - Estimated Absensi Guru: ${guruList.length * getDateRange(CONFIG.DAYS_TO_GENERATE).length}`);
        console.log('=' .repeat(60));
        
        console.log('\n✅ Login Credentials:');
        console.log('   Admin: admin / admin123');
        console.log('   Guru: guru_1 / guru123 (atau guru_2, guru_3, dst)');
        console.log('   Siswa: siswa_20240001 / siswa123 (atau siswa lainnya)');
        console.log('=' .repeat(60));
        
    } catch (error) {
        console.error('❌ Error generating data:', error);
        throw error;
    } finally {
        console.log('\n👋 Done - Database connections managed by pool');
        process.exit(0);
    }
}

// Run
main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});

