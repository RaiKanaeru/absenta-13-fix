const mysql = require('mysql2/promise');

async function createMultiTeacherSchedules() {
    console.log('🔗 Creating multi-teacher schedules...');
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        console.log('✅ Connected to database');

        // Get some schedules to work with
        const [schedules] = await connection.execute(`
            SELECT j.id_jadwal, j.hari, j.jam_ke, j.kelas_id, j.mapel_id, k.nama_kelas, m.nama_mapel
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel
            WHERE j.status = 'aktif'
            ORDER BY j.id_jadwal
            LIMIT 5
        `);

        console.log('📋 Available schedules:');
        schedules.forEach(s => console.log(`- ${s.id_jadwal}: ${s.nama_mapel} - ${s.nama_kelas} (${s.hari} ${s.jam_ke})`));

        // Get teachers
        const [teachers] = await connection.execute('SELECT id_guru, nama FROM guru LIMIT 10');
        console.log('\n👨‍🏫 Available teachers:');
        teachers.forEach(t => console.log(`- ${t.id_guru}: ${t.nama}`));

        // Create multi-teacher assignments
        console.log('\n🔗 Creating multi-teacher assignments...');
        
        // Assign multiple teachers to first 3 schedules
        for (let i = 0; i < Math.min(schedules.length, 3); i++) {
            const schedule = schedules[i];
            const teacherIds = teachers.slice(i * 2, (i + 1) * 2 + 1).map(t => t.id_guru);
            
            console.log(`\n📝 Schedule ${schedule.id_jadwal}: ${schedule.nama_mapel} - ${schedule.nama_kelas}`);
            
            for (const teacherId of teacherIds) {
                try {
                    // Check if assignment already exists
                    const [existing] = await connection.execute(
                        'SELECT id FROM jadwal_guru WHERE jadwal_id = ? AND guru_id = ?',
                        [schedule.id_jadwal, teacherId]
                    );

                    if (existing.length === 0) {
                        await connection.execute(
                            'INSERT INTO jadwal_guru (jadwal_id, guru_id, status) VALUES (?, ?, ?)',
                            [schedule.id_jadwal, teacherId, 'aktif']
                        );
                        const teacherName = teachers.find(t => t.id_guru === teacherId)?.nama || 'Unknown';
                        console.log(`  ✅ Added teacher: ${teacherName} (ID: ${teacherId})`);
                    } else {
                        console.log(`  ℹ️ Teacher ${teacherId} already assigned`);
                    }
                } catch (error) {
                    console.log(`  ❌ Error adding teacher ${teacherId}:`, error.message);
                }
            }
        }

        // Verify multi-teacher setup
        console.log('\n✅ Verifying multi-teacher setup...');
        const [multiTeacherSchedules] = await connection.execute(`
            SELECT j.id_jadwal, j.hari, j.jam_ke, k.nama_kelas, m.nama_mapel,
                   GROUP_CONCAT(g.nama ORDER BY g.nama SEPARATOR ', ') as teachers,
                   COUNT(jg.guru_id) as teacher_count
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id AND jg.status = 'aktif'
            LEFT JOIN guru g ON jg.guru_id = g.id_guru
            WHERE j.status = 'aktif'
            GROUP BY j.id_jadwal
            HAVING teacher_count > 1
            ORDER BY j.id_jadwal
        `);
        
        if (multiTeacherSchedules.length > 0) {
            console.log('🎉 Multi-teacher schedules created:');
            multiTeacherSchedules.forEach(schedule => {
                console.log(`- Schedule ${schedule.id_jadwal}: ${schedule.nama_mapel} - ${schedule.nama_kelas}`);
                console.log(`  ${schedule.hari} ${schedule.jam_ke}: ${schedule.teachers} (${schedule.teacher_count} teachers)`);
            });
        } else {
            console.log('ℹ️ No multi-teacher schedules found');
        }

        console.log('\n🎉 Multi-teacher setup completed!');

    } catch (error) {
        console.error('❌ Error creating multi-teacher schedules:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createMultiTeacherSchedules();
