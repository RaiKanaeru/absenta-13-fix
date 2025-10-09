// Debug Jadwal Issue
import 'dotenv/config';
import mysql from 'mysql2/promise';

const debugJadwalIssue = async () => {
    let connection;
    
    try {
        console.log('🔍 Debugging jadwal issue...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Check jadwal table
        console.log('📅 CHECKING JADWAL TABLE:');
        const [schedules] = await connection.execute(`
            SELECT j.id_jadwal, j.kelas_id, j.mapel_id, j.guru_id, j.ruang_id, 
                   j.hari, j.jam_mulai, j.jam_selesai, j.status
            FROM jadwal j
            ORDER BY j.id_jadwal
        `);
        
        console.log(`Total schedules in database: ${schedules.length}`);
        if (schedules.length > 0) {
            console.log('Sample schedules:');
            schedules.slice(0, 3).forEach(schedule => {
                console.log(`  - ID ${schedule.id_jadwal}: ${schedule.hari} ${schedule.jam_mulai}-${schedule.jam_selesai}`);
            });
        }
        
        // 2. Check if jadwal table has proper joins
        console.log('\n🔗 CHECKING JADWAL JOINS:');
        const [joinedSchedules] = await connection.execute(`
            SELECT 
                j.id_jadwal,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                k.nama_kelas,
                m.nama_mapel,
                g.nama as nama_guru,
                r.nama_ruang
            FROM jadwal j
            LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN ruang_kelas r ON j.ruang_id = r.id
            ORDER BY j.id_jadwal
        `);
        
        console.log(`Joined schedules: ${joinedSchedules.length}`);
        if (joinedSchedules.length > 0) {
            console.log('Sample joined data:');
            joinedSchedules.slice(0, 3).forEach(schedule => {
                console.log(`  - ${schedule.hari} ${schedule.jam_mulai}-${schedule.jam_selesai}: ${schedule.nama_kelas} - ${schedule.nama_mapel} (${schedule.nama_guru})`);
            });
        }
        
        // 3. Check if there are any issues with the data
        console.log('\n🔍 CHECKING DATA INTEGRITY:');
        
        // Check for orphaned schedules
        const [orphanedSchedules] = await connection.execute(`
            SELECT j.id_jadwal, j.kelas_id, j.mapel_id, j.guru_id
            FROM jadwal j
            LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            WHERE k.id_kelas IS NULL OR m.id_mapel IS NULL OR g.id_guru IS NULL
        `);
        
        console.log(`Orphaned schedules: ${orphanedSchedules.length}`);
        if (orphanedSchedules.length > 0) {
            console.log('Orphaned schedule IDs:', orphanedSchedules.map(s => s.id_jadwal));
        }
        
        // 4. Check if the issue is with the API endpoint
        console.log('\n🌐 CHECKING API ENDPOINT:');
        
        // Test the exact query that the API should be using
        const [apiQueryResult] = await connection.execute(`
            SELECT 
                j.id_jadwal,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                k.nama_kelas,
                m.nama_mapel,
                g.nama as nama_guru,
                r.nama_ruang,
                j.status
            FROM jadwal j
            LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN ruang_kelas r ON j.ruang_id = r.id
            WHERE j.status = 'aktif'
            ORDER BY j.hari, j.jam_mulai
        `);
        
        console.log(`API query result: ${apiQueryResult.length} schedules`);
        
        // 5. Check if there are any issues with the server endpoint
        console.log('\n🔧 CHECKING SERVER ENDPOINT:');
        
        // Look for the jadwal endpoint in server_modern.js
        const fs = await import('fs');
        const serverContent = fs.readFileSync('server_modern.js', 'utf8');
        
        const jadwalEndpointMatch = serverContent.match(/app\.get\(['"]\/api\/admin\/jadwal['"]/);
        if (jadwalEndpointMatch) {
            console.log('✅ Jadwal endpoint found in server_modern.js');
        } else {
            console.log('❌ Jadwal endpoint NOT found in server_modern.js');
        }
        
        // Check if there are any jadwal-related queries
        const jadwalQueryMatch = serverContent.match(/FROM jadwal/);
        if (jadwalQueryMatch) {
            console.log('✅ Jadwal queries found in server_modern.js');
        } else {
            console.log('❌ Jadwal queries NOT found in server_modern.js');
        }
        
    } catch (error) {
        console.error('❌ Error debugging jadwal issue:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

debugJadwalIssue();
