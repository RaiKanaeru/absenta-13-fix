const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function setupGuruAccess() {
    console.log('👨‍🏫 Setting up guru access and multi-teacher implementation...');
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        console.log('✅ Connected to database');

        // Check existing teacher accounts
        console.log('\n📋 Checking existing teacher accounts...');
        const [teacherAccounts] = await connection.execute(`
            SELECT u.id, u.username, u.role, g.nama as guru_nama, g.id_guru
            FROM users u
            LEFT JOIN guru g ON u.guru_id = g.id_guru
            WHERE u.role = 'GURU'
            ORDER BY u.id
            LIMIT 10
        `);
        
        console.log('👨‍🏫 Teacher accounts found:');
        teacherAccounts.forEach(acc => console.log(`- ${acc.username}: ${acc.guru_nama} (ID: ${acc.id_guru})`));

        // Create sample multi-teacher schedules
        console.log('\n🔗 Setting up multi-teacher schedules...');
        
        // Check if jadwal_guru table has data
        const [jadwalGuruCount] = await connection.execute('SELECT COUNT(*) as count FROM jadwal_guru');
        console.log(`Current jadwal_guru records: ${jadwalGuruCount[0].count}`);

        if (jadwalGuruCount[0].count === 0) {
            console.log('📝 Creating multi-teacher schedule examples...');
            
            // Get some schedules and teachers
            const [schedules] = await connection.execute('SELECT id_jadwal FROM jadwal WHERE status = "aktif" LIMIT 3');
            const [teachers] = await connection.execute('SELECT id_guru FROM guru LIMIT 5');
            
            // Create multi-teacher assignments
            for (let i = 0; i < Math.min(schedules.length, 2); i++) {
                const jadwalId = schedules[i].id_jadwal;
                const teacherIds = teachers.slice(i * 2, (i + 1) * 2 + 1).map(t => t.id_guru);
                
                for (const teacherId of teacherIds) {
                    try {
                        await connection.execute(
                            'INSERT INTO jadwal_guru (jadwal_id, guru_id, status) VALUES (?, ?, ?)',
                            [jadwalId, teacherId, 'aktif']
                        );
                        console.log(`✅ Added teacher ${teacherId} to schedule ${jadwalId}`);
                    } catch (error) {
                        if (error.code === 'ER_DUP_ENTRY') {
                            console.log(`ℹ️ Teacher ${teacherId} already assigned to schedule ${jadwalId}`);
                        } else {
                            console.log(`❌ Error adding teacher ${teacherId} to schedule ${jadwalId}:`, error.message);
                        }
                    }
                }
            }
        }

        // Verify multi-teacher setup
        console.log('\n✅ Verifying multi-teacher setup...');
        const [multiTeacherSchedules] = await connection.execute(`
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
        
        if (multiTeacherSchedules.length > 0) {
            console.log('🎉 Multi-teacher schedules found:');
            multiTeacherSchedules.forEach(schedule => {
                console.log(`- Schedule ${schedule.id_jadwal} (${schedule.hari} ${schedule.jam_ke}): ${schedule.teachers} (${schedule.teacher_count} teachers)`);
            });
        } else {
            console.log('ℹ️ No multi-teacher schedules found yet');
        }

        // Create test teacher accounts if needed
        console.log('\n👨‍🏫 Creating test teacher accounts...');
        const testTeachers = [
            { username: 'guru1', nama: 'Guru Test 1', email: 'guru1@test.com' },
            { username: 'guru2', nama: 'Guru Test 2', email: 'guru2@test.com' }
        ];

        for (const teacher of testTeachers) {
            try {
                // Check if user already exists
                const [existing] = await connection.execute(
                    'SELECT id FROM users WHERE username = ?',
                    [teacher.username]
                );

                if (existing.length === 0) {
                    const hashedPassword = await bcrypt.hash('password123', 10);
                    await connection.execute(
                        'INSERT INTO users (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
                        [teacher.username, hashedPassword, 'GURU', teacher.nama, teacher.email, 'aktif']
                    );
                    console.log(`✅ Created teacher account: ${teacher.username}`);
                } else {
                    console.log(`ℹ️ Teacher account ${teacher.username} already exists`);
                }
            } catch (error) {
                console.log(`❌ Error creating teacher account ${teacher.username}:`, error.message);
            }
        }

        console.log('\n🎉 Guru access setup completed!');

    } catch (error) {
        console.error('❌ Error setting up guru access:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupGuruAccess();
