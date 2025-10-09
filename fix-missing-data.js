// Fix Missing Data Issues
import 'dotenv/config';
import mysql from 'mysql2/promise';

const fixMissingData = async () => {
    let connection;
    
    try {
        console.log('🔧 Fixing missing data issues...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Fix Subjects (Mata Pelajaran)
        console.log('📚 FIXING SUBJECTS (MATA PELAJARAN):');
        const [subjects] = await connection.execute(`
            SELECT id_mapel, kode_mapel, nama_mapel, status
            FROM mapel 
            ORDER BY id_mapel
        `);
        
        console.log(`Current subjects: ${subjects.length}`);
        if (subjects.length === 0) {
            console.log('🔧 Adding basic subjects...');
            await connection.execute(`
                INSERT INTO mapel (kode_mapel, nama_mapel, status) VALUES 
                ('MTK', 'Matematika', 'aktif'),
                ('BHS', 'Bahasa Indonesia', 'aktif'),
                ('ING', 'Bahasa Inggris', 'aktif'),
                ('PKN', 'Pendidikan Kewarganegaraan', 'aktif'),
                ('FIS', 'Fisika', 'aktif'),
                ('KIM', 'Kimia', 'aktif'),
                ('BIO', 'Biologi', 'aktif'),
                ('SEJ', 'Sejarah', 'aktif'),
                ('GEO', 'Geografi', 'aktif'),
                ('SOS', 'Sosiologi', 'aktif'),
                ('EKO', 'Ekonomi', 'aktif'),
                ('SEN', 'Seni Budaya', 'aktif'),
                ('PJOK', 'Pendidikan Jasmani', 'aktif'),
                ('PAI', 'Pendidikan Agama Islam', 'aktif'),
                ('RPL', 'Rekayasa Perangkat Lunak', 'aktif'),
                ('TKJ', 'Teknik Komputer dan Jaringan', 'aktif'),
                ('AK', 'Akuntansi', 'aktif')
            `);
            console.log('✅ Basic subjects added');
        } else {
            console.log('✅ Subjects already exist');
        }
        
        // 2. Fix Rooms (Ruang Kelas)
        console.log('\n🏫 FIXING ROOMS (RUANG KELAS):');
        const [rooms] = await connection.execute(`
            SELECT id, nama_ruang, kode_ruang, kapasitas, status
            FROM ruang_kelas 
            ORDER BY id
        `);
        
        console.log(`Current rooms: ${rooms.length}`);
        if (rooms.length === 0) {
            console.log('🔧 Adding basic rooms...');
            await connection.execute(`
                INSERT INTO ruang_kelas (nama_ruang, kode_ruang, kapasitas, lokasi, status) VALUES 
                ('Ruang 101', 'R101', 30, 'Lantai 1', 'aktif'),
                ('Ruang 102', 'R102', 30, 'Lantai 1', 'aktif'),
                ('Ruang 103', 'R103', 30, 'Lantai 1', 'aktif'),
                ('Ruang 104', 'R104', 30, 'Lantai 1', 'aktif'),
                ('Ruang 105', 'R105', 30, 'Lantai 1', 'aktif'),
                ('Lab Komputer 1', 'LK1', 25, 'Lantai 2', 'aktif'),
                ('Lab Komputer 2', 'LK2', 25, 'Lantai 2', 'aktif'),
                ('Lab Akuntansi', 'LA', 30, 'Lantai 2', 'aktif'),
                ('Aula', 'AULA', 100, 'Lantai 1', 'aktif'),
                ('Perpustakaan', 'PERPUS', 50, 'Lantai 2', 'aktif')
            `);
            console.log('✅ Basic rooms added');
        } else {
            console.log('✅ Rooms already exist');
        }
        
        // 3. Create Jadwal Table
        console.log('\n📅 CREATING JADWAL TABLE:');
        
        // Check if jadwal table exists
        const [jadwalExists] = await connection.execute(`
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'absenta13' 
            AND TABLE_NAME = 'jadwal'
        `);
        
        if (jadwalExists[0].count === 0) {
            console.log('🔧 Creating jadwal table...');
            await connection.execute(`
                CREATE TABLE jadwal (
                    id_jadwal INT AUTO_INCREMENT PRIMARY KEY,
                    kelas_id INT NOT NULL,
                    mapel_id INT NOT NULL,
                    guru_id INT NOT NULL,
                    ruang_id INT DEFAULT NULL,
                    hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat') NOT NULL,
                    jam_mulai TIME NOT NULL,
                    jam_selesai TIME NOT NULL,
                    status ENUM('aktif', 'tidak_aktif') DEFAULT 'aktif',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (kelas_id) REFERENCES kelas(id_kelas) ON DELETE CASCADE,
                    FOREIGN KEY (mapel_id) REFERENCES mapel(id_mapel) ON DELETE CASCADE,
                    FOREIGN KEY (guru_id) REFERENCES guru(id_guru) ON DELETE CASCADE,
                    FOREIGN KEY (ruang_id) REFERENCES ruang_kelas(id) ON DELETE SET NULL
                )
            `);
            console.log('✅ Jadwal table created');
            
            // Add some sample schedules
            console.log('🔧 Adding sample schedules...');
            
            // Get some sample data
            const [sampleKelas] = await connection.execute('SELECT id_kelas FROM kelas LIMIT 5');
            const [sampleMapel] = await connection.execute('SELECT id_mapel FROM mapel LIMIT 5');
            const [sampleGuru] = await connection.execute('SELECT id_guru FROM guru LIMIT 5');
            const [sampleRuang] = await connection.execute('SELECT id FROM ruang_kelas LIMIT 5');
            
            if (sampleKelas.length > 0 && sampleMapel.length > 0 && sampleGuru.length > 0) {
                await connection.execute(`
                    INSERT INTO jadwal (kelas_id, mapel_id, guru_id, ruang_id, hari, jam_mulai, jam_selesai) VALUES 
                    (?, ?, ?, ?, 'Senin', '07:00:00', '08:30:00'),
                    (?, ?, ?, ?, 'Senin', '08:30:00', '10:00:00'),
                    (?, ?, ?, ?, 'Senin', '10:00:00', '11:30:00'),
                    (?, ?, ?, ?, 'Selasa', '07:00:00', '08:30:00'),
                    (?, ?, ?, ?, 'Selasa', '08:30:00', '10:00:00'),
                    (?, ?, ?, ?, 'Rabu', '07:00:00', '08:30:00'),
                    (?, ?, ?, ?, 'Rabu', '08:30:00', '10:00:00')
                `, [
                    sampleKelas[0].id_kelas, sampleMapel[0].id_mapel, sampleGuru[0].id_guru, sampleRuang[0]?.id || null,
                    sampleKelas[1]?.id_kelas || sampleKelas[0].id_kelas, sampleMapel[1]?.id_mapel || sampleMapel[0].id_mapel, sampleGuru[1]?.id_guru || sampleGuru[0].id_guru, sampleRuang[1]?.id || null,
                    sampleKelas[2]?.id_kelas || sampleKelas[0].id_kelas, sampleMapel[2]?.id_mapel || sampleMapel[0].id_mapel, sampleGuru[2]?.id_guru || sampleGuru[0].id_guru, sampleRuang[2]?.id || null,
                    sampleKelas[3]?.id_kelas || sampleKelas[0].id_kelas, sampleMapel[3]?.id_mapel || sampleMapel[0].id_mapel, sampleGuru[3]?.id_guru || sampleGuru[0].id_guru, sampleRuang[3]?.id || null,
                    sampleKelas[4]?.id_kelas || sampleKelas[0].id_kelas, sampleMapel[4]?.id_mapel || sampleMapel[0].id_mapel, sampleGuru[4]?.id_guru || sampleGuru[0].id_guru, sampleRuang[4]?.id || null,
                    sampleKelas[0].id_kelas, sampleMapel[0].id_mapel, sampleGuru[0].id_guru, sampleRuang[0]?.id || null,
                    sampleKelas[1]?.id_kelas || sampleKelas[0].id_kelas, sampleMapel[1]?.id_mapel || sampleMapel[0].id_mapel, sampleGuru[1]?.id_guru || sampleGuru[0].id_guru, sampleRuang[1]?.id || null
                ]);
                console.log('✅ Sample schedules added');
            }
        } else {
            console.log('✅ Jadwal table already exists');
        }
        
        // 4. Check final status
        console.log('\n📊 FINAL STATUS:');
        
        const [finalSubjects] = await connection.execute('SELECT COUNT(*) as count FROM mapel');
        const [finalRooms] = await connection.execute('SELECT COUNT(*) as count FROM ruang_kelas');
        const [finalSchedules] = await connection.execute('SELECT COUNT(*) as count FROM jadwal');
        
        console.log(`- Subjects: ${finalSubjects[0].count}`);
        console.log(`- Rooms: ${finalRooms[0].count}`);
        console.log(`- Schedules: ${finalSchedules[0].count}`);
        
        console.log('\n🎉 All missing data issues have been fixed!');
        console.log('⚠️  Please restart the server to see the changes.');
        
    } catch (error) {
        console.error('❌ Error fixing missing data:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

fixMissingData();
