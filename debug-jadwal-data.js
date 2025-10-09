// Debug Jadwal Data
import 'dotenv/config';
import mysql from 'mysql2/promise';

const debugJadwalData = async () => {
    let connection;
    
    try {
        console.log('🔍 Debugging jadwal data...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Check jadwal table data
        console.log('📅 JADWAL TABLE DATA:');
        const [schedules] = await connection.execute(`
            SELECT id_jadwal, kelas_id, mapel_id, guru_id, hari, jam_mulai, jam_selesai, status
            FROM jadwal
            ORDER BY id_jadwal
        `);
        
        console.log(`Total schedules: ${schedules.length}`);
        schedules.forEach(schedule => {
            console.log(`  - ID ${schedule.id_jadwal}: ${schedule.hari} ${schedule.jam_mulai}-${schedule.jam_selesai} (Kelas: ${schedule.kelas_id}, Mapel: ${schedule.mapel_id}, Guru: ${schedule.guru_id}, Status: ${schedule.status})`);
        });
        
        // 2. Check if the data exists in related tables
        console.log('\n🔗 CHECKING RELATED TABLES:');
        
        // Check classes
        const [classes] = await connection.execute('SELECT id_kelas, nama_kelas FROM kelas LIMIT 5');
        console.log(`Classes: ${classes.length}`);
        classes.forEach(cls => {
            console.log(`  - ID ${cls.id_kelas}: ${cls.nama_kelas}`);
        });
        
        // Check subjects
        const [subjects] = await connection.execute('SELECT id_mapel, nama_mapel FROM mapel LIMIT 5');
        console.log(`Subjects: ${subjects.length}`);
        subjects.forEach(subject => {
            console.log(`  - ID ${subject.id_mapel}: ${subject.nama_mapel}`);
        });
        
        // Check teachers
        const [teachers] = await connection.execute('SELECT id_guru, nama FROM guru LIMIT 5');
        console.log(`Teachers: ${teachers.length}`);
        teachers.forEach(teacher => {
            console.log(`  - ID ${teacher.id_guru}: ${teacher.nama}`);
        });
        
        // 3. Test the exact query from the API
        console.log('\n🌐 TESTING API QUERY:');
        const [apiResult] = await connection.execute(`
            SELECT 
                j.id_jadwal as id,
                j.kelas_id,
                j.mapel_id, 
                j.guru_id,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                k.nama_kelas,
                m.nama_mapel,
                g.nama as nama_guru
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel  
            JOIN guru g ON j.guru_id = g.id_guru
            WHERE j.status = 'aktif'
            ORDER BY 
                FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'),
                j.jam_ke, 
                k.nama_kelas
        `);
        
        console.log(`API query result: ${apiResult.length} schedules`);
        if (apiResult.length > 0) {
            console.log('Sample API result:');
            apiResult.slice(0, 3).forEach(schedule => {
                console.log(`  - ${schedule.hari} ${schedule.jam_mulai}-${schedule.jam_selesai}: ${schedule.nama_kelas} - ${schedule.nama_mapel} (${schedule.nama_guru})`);
            });
        }
        
        // 4. Check if there are any missing fields
        console.log('\n🔍 CHECKING MISSING FIELDS:');
        
        // Check if jam_ke field exists
        const [jamKeCheck] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'absenta13' 
            AND TABLE_NAME = 'jadwal' 
            AND COLUMN_NAME = 'jam_ke'
        `);
        
        if (jamKeCheck.length === 0) {
            console.log('❌ jam_ke field does not exist in jadwal table');
            
            // Add jam_ke field
            console.log('🔧 Adding jam_ke field...');
            await connection.execute(`
                ALTER TABLE jadwal 
                ADD COLUMN jam_ke INT DEFAULT 1 AFTER jam_selesai
            `);
            
            // Update existing records with jam_ke values
            await connection.execute(`
                UPDATE jadwal 
                SET jam_ke = 1 
                WHERE jam_ke IS NULL
            `);
            
            console.log('✅ jam_ke field added and updated');
        } else {
            console.log('✅ jam_ke field exists');
        }
        
        // 5. Test the query again after adding jam_ke
        console.log('\n🔄 TESTING QUERY AFTER FIX:');
        const [finalResult] = await connection.execute(`
            SELECT 
                j.id_jadwal as id,
                j.kelas_id,
                j.mapel_id, 
                j.guru_id,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                k.nama_kelas,
                m.nama_mapel,
                g.nama as nama_guru
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel  
            JOIN guru g ON j.guru_id = g.id_guru
            WHERE j.status = 'aktif'
            ORDER BY 
                FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'),
                j.jam_ke, 
                k.nama_kelas
        `);
        
        console.log(`Final query result: ${finalResult.length} schedules`);
        if (finalResult.length > 0) {
            console.log('✅ Query is working! Sample results:');
            finalResult.slice(0, 3).forEach(schedule => {
                console.log(`  - ${schedule.hari} ${schedule.jam_mulai}-${schedule.jam_selesai}: ${schedule.nama_kelas} - ${schedule.nama_mapel} (${schedule.nama_guru})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error debugging jadwal data:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

debugJadwalData();
