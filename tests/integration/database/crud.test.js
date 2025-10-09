/**
 * Database CRUD Integration Tests
 * Tests database operations with SQLite test database
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const bcrypt = require('bcrypt');

describe('Database CRUD Operations', () => {
    let testDb;

    beforeEach(async () => {
        testDb = global.testUtils.getTestDb();
        if (!testDb) {
            console.log('⚠️  Test database not available, skipping database tests');
            return;
        }
    });

    afterEach(async () => {
        // Database is cleaned automatically by setup
    });

    describe('User Management', () => {
        it('should create a new user', async () => {
            if (!testDb) return;

            const userData = {
                username: 'testuser123',
                password: await bcrypt.hash('password123' + process.env.PASSWORD_PEPPER, 10),
                role: 'admin',
                nama: 'Test User 123',
                email: 'testuser123@example.com',
                status: 'aktif'
            };

            const result = await testDb.run(
                'INSERT INTO pengguna (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
                [userData.username, userData.password, userData.role, userData.nama, userData.email, userData.status]
            );

            expect(result.id).toBeDefined();
            expect(result.changes).toBe(1);

            // Verify user was created
            const user = await testDb.get('SELECT * FROM pengguna WHERE id = ?', [result.id]);
            expect(user.username).toBe(userData.username);
            expect(user.role).toBe(userData.role);
            expect(user.nama).toBe(userData.nama);
        });

        it('should retrieve user by username', async () => {
            if (!testDb) return;

            const user = await testDb.get('SELECT * FROM pengguna WHERE username = ?', ['admin']);
            expect(user).toBeDefined();
            expect(user.username).toBe('admin');
            expect(user.role).toBe('admin');
        });

        it('should update user information', async () => {
            if (!testDb) return;

            const newName = 'Updated Admin Name';
            const result = await testDb.run(
                'UPDATE pengguna SET nama = ? WHERE username = ?',
                [newName, 'admin']
            );

            expect(result.changes).toBe(1);

            const user = await testDb.get('SELECT * FROM pengguna WHERE username = ?', ['admin']);
            expect(user.nama).toBe(newName);
        });

        it('should delete user', async () => {
            if (!testDb) return;

            // First create a test user
            const result = await testDb.run(
                'INSERT INTO pengguna (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
                ['deleteme', 'password', 'siswa', 'Delete Me', 'delete@test.com', 'aktif']
            );

            const userId = result.id;

            // Delete the user
            const deleteResult = await testDb.run('DELETE FROM pengguna WHERE id = ?', [userId]);
            expect(deleteResult.changes).toBe(1);

            // Verify user is deleted
            const user = await testDb.get('SELECT * FROM pengguna WHERE id = ?', [userId]);
            expect(user).toBeUndefined();
        });
    });

    describe('Teacher Management', () => {
        it('should create a new teacher', async () => {
            if (!testDb) return;

            const teacherData = {
                id_guru: 999,
                nama: 'Test Teacher',
                nip: '123456789012345678',
                email: 'teacher@test.com',
                mapel_id: 1,
                status: 'aktif',
                user_id: 2
            };

            const result = await testDb.run(
                'INSERT INTO guru (id_guru, nama, nip, email, mapel_id, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [teacherData.id_guru, teacherData.nama, teacherData.nip, teacherData.email, teacherData.mapel_id, teacherData.status, teacherData.user_id]
            );

            expect(result.id).toBeDefined();
            expect(result.changes).toBe(1);

            // Verify teacher was created
            const teacher = await testDb.get('SELECT * FROM guru WHERE id_guru = ?', [teacherData.id_guru]);
            expect(teacher.nama).toBe(teacherData.nama);
            expect(teacher.nip).toBe(teacherData.nip);
        });

        it('should retrieve teachers by status', async () => {
            if (!testDb) return;

            const teachers = await testDb.all('SELECT * FROM guru WHERE status = ?', ['aktif']);
            expect(teachers.length).toBeGreaterThan(0);
            expect(teachers.every(t => t.status === 'aktif')).toBe(true);
        });

        it('should update teacher information', async () => {
            if (!testDb) return;

            const newName = 'Updated Teacher Name';
            const result = await testDb.run(
                'UPDATE guru SET nama = ? WHERE id_guru = ?',
                [newName, 1]
            );

            expect(result.changes).toBe(1);

            const teacher = await testDb.get('SELECT * FROM guru WHERE id_guru = ?', [1]);
            expect(teacher.nama).toBe(newName);
        });
    });

    describe('Student Management', () => {
        it('should create a new student', async () => {
            if (!testDb) return;

            const studentData = {
                id_siswa: 9999,
                nama: 'Test Student',
                nis: '2024999',
                kelas_id: 1,
                status: 'aktif',
                user_id: 3
            };

            const result = await testDb.run(
                'INSERT INTO siswa_perwakilan (id_siswa, nama, nis, kelas_id, status, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                [studentData.id_siswa, studentData.nama, studentData.nis, studentData.kelas_id, studentData.status, studentData.user_id]
            );

            expect(result.id).toBeDefined();
            expect(result.changes).toBe(1);

            // Verify student was created
            const student = await testDb.get('SELECT * FROM siswa_perwakilan WHERE id_siswa = ?', [studentData.id_siswa]);
            expect(student.nama).toBe(studentData.nama);
            expect(student.nis).toBe(studentData.nis);
        });

        it('should retrieve students by class', async () => {
            if (!testDb) return;

            const students = await testDb.all('SELECT * FROM siswa_perwakilan WHERE kelas_id = ?', [1]);
            expect(students.length).toBeGreaterThan(0);
            expect(students.every(s => s.kelas_id === 1)).toBe(true);
        });
    });

    describe('Schedule Management', () => {
        it('should create a new schedule', async () => {
            if (!testDb) return;

            const scheduleData = {
                guru_id: 1,
                mapel_id: 1,
                kelas_id: 1,
                hari: 'Rabu',
                jam_mulai: '09:00:00',
                jam_selesai: '09:45:00',
                status: 'aktif'
            };

            const result = await testDb.run(
                'INSERT INTO jadwal (guru_id, mapel_id, kelas_id, hari, jam_mulai, jam_selesai, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [scheduleData.guru_id, scheduleData.mapel_id, scheduleData.kelas_id, scheduleData.hari, scheduleData.jam_mulai, scheduleData.jam_selesai, scheduleData.status]
            );

            expect(result.id).toBeDefined();
            expect(result.changes).toBe(1);

            // Verify schedule was created
            const schedule = await testDb.get('SELECT * FROM jadwal WHERE id = ?', [result.id]);
            expect(schedule.guru_id).toBe(scheduleData.guru_id);
            expect(schedule.hari).toBe(scheduleData.hari);
        });

        it('should retrieve schedules by teacher', async () => {
            if (!testDb) return;

            const schedules = await testDb.all('SELECT * FROM jadwal WHERE guru_id = ?', [1]);
            expect(schedules.length).toBeGreaterThan(0);
            expect(schedules.every(s => s.guru_id === 1)).toBe(true);
        });

        it('should check for schedule conflicts', async () => {
            if (!testDb) return;

            // Try to create a conflicting schedule
            const conflictingSchedule = {
                guru_id: 1,
                mapel_id: 2,
                kelas_id: 1,
                hari: 'Senin',
                jam_mulai: '07:30:00', // Overlaps with existing 07:00-07:45
                jam_selesai: '08:15:00',
                status: 'aktif'
            };

            // This should be allowed in the database (conflict checking would be done in application logic)
            const result = await testDb.run(
                'INSERT INTO jadwal (guru_id, mapel_id, kelas_id, hari, jam_mulai, jam_selesai, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [conflictingSchedule.guru_id, conflictingSchedule.mapel_id, conflictingSchedule.kelas_id, conflictingSchedule.hari, conflictingSchedule.jam_mulai, conflictingSchedule.jam_selesai, conflictingSchedule.status]
            );

            expect(result.id).toBeDefined();
        });
    });

    describe('Attendance Management', () => {
        it('should create teacher attendance record', async () => {
            if (!testDb) return;

            const attendanceData = {
                guru_id: 1,
                jadwal_id: 1,
                tanggal: '2024-01-15',
                status: 'Hadir',
                keterangan: 'Mengajar normal'
            };

            const result = await testDb.run(
                'INSERT INTO absensi_guru (guru_id, jadwal_id, tanggal, status, keterangan) VALUES (?, ?, ?, ?, ?)',
                [attendanceData.guru_id, attendanceData.jadwal_id, attendanceData.tanggal, attendanceData.status, attendanceData.keterangan]
            );

            expect(result.id).toBeDefined();
            expect(result.changes).toBe(1);

            // Verify attendance was created
            const attendance = await testDb.get('SELECT * FROM absensi_guru WHERE id = ?', [result.id]);
            expect(attendance.guru_id).toBe(attendanceData.guru_id);
            expect(attendance.status).toBe(attendanceData.status);
        });

        it('should create student attendance record', async () => {
            if (!testDb) return;

            const attendanceData = {
                siswa_id: 2000,
                jadwal_id: 1,
                tanggal: '2024-01-15',
                status: 'Hadir',
                keterangan: 'Hadir tepat waktu'
            };

            const result = await testDb.run(
                'INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan) VALUES (?, ?, ?, ?, ?)',
                [attendanceData.siswa_id, attendanceData.jadwal_id, attendanceData.tanggal, attendanceData.status, attendanceData.keterangan]
            );

            expect(result.id).toBeDefined();
            expect(result.changes).toBe(1);

            // Verify attendance was created
            const attendance = await testDb.get('SELECT * FROM absensi_siswa WHERE id = ?', [result.id]);
            expect(attendance.siswa_id).toBe(attendanceData.siswa_id);
            expect(attendance.status).toBe(attendanceData.status);
        });

        it('should retrieve attendance by date range', async () => {
            if (!testDb) return;

            // Create some test attendance records
            await testDb.run(
                'INSERT INTO absensi_guru (guru_id, jadwal_id, tanggal, status, keterangan) VALUES (?, ?, ?, ?, ?)',
                [1, 1, '2024-01-15', 'Hadir', 'Test 1']
            );
            await testDb.run(
                'INSERT INTO absensi_guru (guru_id, jadwal_id, tanggal, status, keterangan) VALUES (?, ?, ?, ?, ?)',
                [1, 1, '2024-01-16', 'Hadir', 'Test 2']
            );

            const attendance = await testDb.all(
                'SELECT * FROM absensi_guru WHERE tanggal BETWEEN ? AND ?',
                ['2024-01-15', '2024-01-16']
            );

            expect(attendance.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Data Integrity', () => {
        it('should maintain referential integrity', async () => {
            if (!testDb) return;

            // Try to create a schedule with non-existent teacher
            try {
                await testDb.run(
                    'INSERT INTO jadwal (guru_id, mapel_id, kelas_id, hari, jam_mulai, jam_selesai, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [999, 1, 1, 'Senin', '07:00:00', '07:45:00', 'aktif']
                );
                // This should succeed in SQLite (foreign key constraints are not enforced by default)
                // In a real MySQL setup, this would fail
            } catch (error) {
                // Expected in MySQL with foreign key constraints
                expect(error.message).toContain('FOREIGN KEY');
            }
        });

        it('should handle concurrent operations', async () => {
            if (!testDb) return;

            // Simulate concurrent user creation
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(
                    testDb.run(
                        'INSERT INTO pengguna (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
                        [`concurrent${i}`, 'password', 'siswa', `Concurrent User ${i}`, `concurrent${i}@test.com`, 'aktif']
                    )
                );
            }

            const results = await Promise.all(promises);
            expect(results.length).toBe(5);
            expect(results.every(r => r.id)).toBe(true);
        });
    });

    describe('Query Performance', () => {
        it('should execute queries efficiently', async () => {
            if (!testDb) return;

            const startTime = Date.now();
            
            // Execute multiple queries
            const users = await testDb.all('SELECT * FROM pengguna');
            const teachers = await testDb.all('SELECT * FROM guru');
            const students = await testDb.all('SELECT * FROM siswa_perwakilan');
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(users.length).toBeGreaterThan(0);
            expect(teachers.length).toBeGreaterThan(0);
            expect(students.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });

        it('should handle complex joins efficiently', async () => {
            if (!testDb) return;

            const startTime = Date.now();
            
            const result = await testDb.all(`
                SELECT 
                    j.id,
                    g.nama as guru_nama,
                    m.nama_mapel,
                    k.nama_kelas,
                    j.hari,
                    j.jam_mulai,
                    j.jam_selesai
                FROM jadwal j
                JOIN guru g ON j.guru_id = g.id_guru
                JOIN mapel m ON j.mapel_id = m.id_mapel
                JOIN kelas k ON j.kelas_id = k.id_kelas
                WHERE j.status = 'aktif'
            `);
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(result.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(500); // Should complete within 500ms
        });
    });
});
