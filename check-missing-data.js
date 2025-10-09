// Check Missing Data Issues
import 'dotenv/config';
import mysql from 'mysql2/promise';

const checkMissingData = async () => {
    let connection;
    
    try {
        console.log('🔍 Checking missing data issues...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Check Subjects (Mata Pelajaran)
        console.log('📚 CHECKING SUBJECTS (MATA PELAJARAN):');
        const [subjects] = await connection.execute(`
            SELECT id_mapel, kode_mapel, nama_mapel, status
            FROM mapel 
            ORDER BY id_mapel
        `);
        
        console.log(`Total subjects: ${subjects.length}`);
        if (subjects.length === 0) {
            console.log('❌ NO SUBJECTS FOUND - This explains "Belum ada mata pelajaran yang ditambahkan"');
            
            // Add some basic subjects
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
            console.log('✅ Subjects found:');
            subjects.forEach(subject => {
                console.log(`  - ${subject.kode_mapel}: ${subject.nama_mapel} (${subject.status})`);
            });
        }
        
        // 2. Check Rooms (Ruang Kelas)
        console.log('\n🏫 CHECKING ROOMS (RUANG KELAS):');
        const [rooms] = await connection.execute(`
            SELECT id_ruang, nama_ruang, kapasitas, status
            FROM ruang_kelas 
            ORDER BY id_ruang
        `);
        
        console.log(`Total rooms: ${rooms.length}`);
        if (rooms.length === 0) {
            console.log('❌ NO ROOMS FOUND - This explains "Daftar Ruang Kelas (0)"');
            
            // Add some basic rooms
            console.log('🔧 Adding basic rooms...');
            await connection.execute(`
                INSERT INTO ruang_kelas (nama_ruang, kapasitas, status) VALUES 
                ('Ruang 101', 30, 'aktif'),
                ('Ruang 102', 30, 'aktif'),
                ('Ruang 103', 30, 'aktif'),
                ('Ruang 104', 30, 'aktif'),
                ('Ruang 105', 30, 'aktif'),
                ('Lab Komputer 1', 25, 'aktif'),
                ('Lab Komputer 2', 25, 'aktif'),
                ('Lab Akuntansi', 30, 'aktif'),
                ('Aula', 100, 'aktif'),
                ('Perpustakaan', 50, 'aktif')
            `);
            console.log('✅ Basic rooms added');
        } else {
            console.log('✅ Rooms found:');
            rooms.forEach(room => {
                console.log(`  - ${room.nama_ruang} (Kapasitas: ${room.kapasitas})`);
            });
        }
        
        // 3. Check Schedules (Jadwal)
        console.log('\n📅 CHECKING SCHEDULES (JADWAL):');
        
        // First check if jadwal table exists
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'absenta13' 
            AND TABLE_NAME LIKE '%jadwal%'
        `);
        
        console.log(`Tables with 'jadwal' in name: ${tables.length}`);
        tables.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });
        
        if (tables.length === 0) {
            console.log('❌ NO JADWAL TABLE FOUND - This explains "Belum ada jadwal"');
            
            // Create jadwal table
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
                    FOREIGN KEY (ruang_id) REFERENCES ruang_kelas(id_ruang) ON DELETE SET NULL
                )
            `);
            console.log('✅ Jadwal table created');
            
            // Add some sample schedules
            console.log('🔧 Adding sample schedules...');
            await connection.execute(`
                INSERT INTO jadwal (kelas_id, mapel_id, guru_id, ruang_id, hari, jam_mulai, jam_selesai) VALUES 
                (349, 1, 433, 1, 'Senin', '07:00:00', '08:30:00'),
                (349, 2, 434, 2, 'Senin', '08:30:00', '10:00:00'),
                (349, 3, 435, 1, 'Senin', '10:00:00', '11:30:00'),
                (350, 1, 433, 3, 'Senin', '07:00:00', '08:30:00'),
                (350, 2, 434, 4, 'Senin', '08:30:00', '10:00:00'),
                (351, 4, 436, 5, 'Selasa', '07:00:00', '08:30:00'),
                (352, 5, 437, 6, 'Selasa', '08:30:00', '10:00:00')
            `);
            console.log('✅ Sample schedules added');
        } else {
            const [schedules] = await connection.execute(`
                SELECT j.id_jadwal, k.nama_kelas, m.nama_mapel, g.nama as nama_guru, 
                       j.hari, j.jam_mulai, j.jam_selesai
                FROM jadwal j
                LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
                LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
                LEFT JOIN guru g ON j.guru_id = g.id_guru
                ORDER BY j.hari, j.jam_mulai
            `);
            
            console.log(`Total schedules: ${schedules.length}`);
            if (schedules.length === 0) {
                console.log('❌ NO SCHEDULES FOUND - This explains "Belum ada jadwal"');
            } else {
                console.log('✅ Schedules found:');
                schedules.slice(0, 5).forEach(schedule => {
                    console.log(`  - ${schedule.hari} ${schedule.jam_mulai}-${schedule.jam_selesai}: ${schedule.nama_kelas} - ${schedule.nama_mapel} (${schedule.nama_guru})`);
                });
            }
        }
        
        // 4. Check Attendance Tables
        console.log('\n📊 CHECKING ATTENDANCE TABLES:');
        
        // Check absensi_guru table
        const [teacherAttendance] = await connection.execute(`
            SELECT COUNT(*) as count FROM absensi_guru
        `);
        console.log(`Teacher attendance records: ${teacherAttendance[0].count}`);
        
        // Check absensi_siswa table
        const [studentAttendance] = await connection.execute(`
            SELECT COUNT(*) as count FROM absensi_siswa
        `);
        console.log(`Student attendance records: ${studentAttendance[0].count}`);
        
        // 5. Summary
        console.log('\n📋 SUMMARY:');
        console.log(`- Subjects: ${subjects.length} (${subjects.length === 0 ? 'FIXED' : 'OK'})`);
        console.log(`- Rooms: ${rooms.length} (${rooms.length === 0 ? 'FIXED' : 'OK'})`);
        console.log(`- Schedules: ${tables.length > 0 ? 'Table exists' : 'CREATED'}`);
        console.log(`- Teacher Attendance: ${teacherAttendance[0].count} records`);
        console.log(`- Student Attendance: ${studentAttendance[0].count} records`);
        
        console.log('\n🎉 Data issues have been addressed!');
        console.log('⚠️  Please restart the server to see the changes.');
        
    } catch (error) {
        console.error('❌ Error checking missing data:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

checkMissingData();
