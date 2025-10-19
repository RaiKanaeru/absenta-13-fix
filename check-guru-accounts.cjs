const mysql = require('mysql2/promise');

async function checkGuruAccounts() {
    console.log('👨‍🏫 Checking guru accounts and multi-teacher implementation...');
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        console.log('✅ Connected to database');

        // Check guru accounts
        console.log('\n📋 Guru Accounts:');
        const [guru] = await connection.execute('SELECT id_guru, nama, email FROM guru LIMIT 10');
        guru.forEach(g => console.log(`- ID: ${g.id_guru}, Nama: ${g.nama}, Email: ${g.email}`));

        // Check multi-teacher implementation
        console.log('\n🔗 Multi-Teacher Implementation:');
        const [jadwalGuru] = await connection.execute(`
            SELECT j.id_jadwal, j.hari, j.jam_ke, 
                   GROUP_CONCAT(g.nama ORDER BY g.nama SEPARATOR ', ') as teachers,
                   COUNT(jg.guru_id) as teacher_count
            FROM jadwal j
            LEFT JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id AND jg.status = 'aktif'
            LEFT JOIN guru g ON jg.guru_id = g.id_guru
            WHERE j.status = 'aktif'
            GROUP BY j.id_jadwal
            HAVING teacher_count > 1
            LIMIT 5
        `);
        
        if (jadwalGuru.length > 0) {
            console.log('✅ Multi-teacher schedules found:');
            jadwalGuru.forEach(j => console.log(`- Schedule ${j.id_jadwal}: ${j.teachers} (${j.teacher_count} teachers)`));
        } else {
            console.log('ℹ️ No multi-teacher schedules found');
        }

        // Check user accounts for teachers
        console.log('\n👤 Teacher User Accounts:');
        const [users] = await connection.execute(`
            SELECT u.id, u.username, u.peran, g.nama as guru_nama
            FROM users u
            LEFT JOIN guru g ON u.guru_id = g.id_guru
            WHERE u.peran = 'guru'
            LIMIT 10
        `);
        users.forEach(u => console.log(`- Username: ${u.username}, Role: ${u.peran}, Name: ${u.guru_nama}`));

        // Check attendance records
        console.log('\n📊 Recent Attendance Records:');
        const [attendance] = await connection.execute(`
            SELECT ag.id, ag.guru_id, g.nama, ag.tanggal, ag.status
            FROM absensi_guru ag
            JOIN guru g ON ag.guru_id = g.id_guru
            ORDER BY ag.tanggal DESC
            LIMIT 5
        `);
        attendance.forEach(a => console.log(`- ${a.nama}: ${a.status} on ${a.tanggal}`));

    } catch (error) {
        console.error('❌ Error checking guru accounts:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkGuruAccounts();
