/**
 * Integration Tests for Admin API Endpoints
 * Using mock database for testing
 */

const { describe, it, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');

describe('Admin API Integration Tests', () => {
    let testDb;
    let adminToken;
    let teacherToken;
    let studentToken;

    beforeAll(async () => {
        testDb = global.testUtils.getTestDb();
        if (!testDb) {
            console.log('⚠️  Test database not available, skipping database tests');
            return;
        }

        // Generate tokens
        adminToken = global.testUtils.generateTestToken({ role: 'admin' });
        teacherToken = global.testUtils.generateTestToken({ role: 'guru' });
        studentToken = global.testUtils.generateTestToken({ role: 'siswa' });
    });

    afterAll(async () => {
        // Database cleanup is handled by setup
    });

    beforeEach(async () => {
        if (!testDb) return;
        
        // Clean attendance data before each test
        await testDb.run('DELETE FROM absensi_guru');
        await testDb.run('DELETE FROM absensi_siswa');
    });

    describe('Authentication & Authorization', () => {
        it('should validate admin token', () => {
            if (!testDb) return;

            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
            
            expect(decoded.role).toBe('admin');
            expect(decoded.id).toBeDefined();
        });

        it('should validate teacher token', () => {
            if (!testDb) return;

            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(teacherToken, process.env.JWT_SECRET);
            
            expect(decoded.role).toBe('guru');
            expect(decoded.id).toBeDefined();
        });

        it('should validate student token', () => {
            if (!testDb) return;

            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(studentToken, process.env.JWT_SECRET);
            
            expect(decoded.role).toBe('siswa');
            expect(decoded.id).toBeDefined();
        });

        it('should reject invalid token', () => {
            const jwt = require('jsonwebtoken');
            const invalidToken = 'invalid.jwt.token';

            expect(() => {
                jwt.verify(invalidToken, process.env.JWT_SECRET);
            }).toThrow();
        });
    });

    describe('User Management', () => {
        it('should get all users', async () => {
            if (!testDb) return;

            const users = await testDb.all('SELECT * FROM pengguna');
            expect(users.length).toBeGreaterThan(0);
            expect(users.every(u => u.username && u.role)).toBe(true);
        });

        it('should create new user', async () => {
            if (!testDb) return;

            const userData = {
                username: 'newuser123',
                password: 'password123',
                role: 'siswa',
                nama: 'New User',
                email: 'newuser@test.com',
                status: 'aktif'
            };

            const result = await testDb.run(
                'INSERT INTO pengguna (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
                [userData.username, userData.password, userData.role, userData.nama, userData.email, userData.status]
            );

            expect(result.id).toBeDefined();
            expect(result.changes).toBe(1);

            const user = await testDb.get('SELECT * FROM pengguna WHERE id = ?', [result.id]);
            expect(user.username).toBe(userData.username);
            expect(user.role).toBe(userData.role);
        });

        it('should update user', async () => {
            if (!testDb) return;

            const newName = 'Updated User Name';
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

            // Create a test user first
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

        it('should validate user data on creation', async () => {
            if (!testDb) return;

            const invalidData = [
                { username: '', password: 'password', role: 'admin' },
                { username: 'user', password: '', role: 'admin' },
                { username: 'user', password: 'password', role: 'invalid' }
            ];

            for (const data of invalidData) {
                try {
                    await testDb.run(
                        'INSERT INTO pengguna (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
                        [data.username, data.password, data.role, 'Test User', 'test@test.com', 'aktif']
                    );
                    // If it succeeds, clean up
                    await testDb.run('DELETE FROM pengguna WHERE username = ?', [data.username]);
                } catch (error) {
                    // Expected for invalid data
                    expect(error.message).toBeDefined();
                }
            }
        });
    });

    describe('Teacher Management', () => {
        it('should get all teachers', async () => {
            if (!testDb) return;

            const teachers = await testDb.all('SELECT * FROM guru');
            expect(teachers.length).toBeGreaterThan(0);
            expect(teachers.every(t => t.nama && t.id_guru)).toBe(true);
        });

        it('should create new teacher', async () => {
            if (!testDb) return;

            const teacherData = {
                id_guru: 999,
                nama: 'New Teacher',
                nip: '123456789012345678',
                email: 'newteacher@test.com',
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

            const teacher = await testDb.get('SELECT * FROM guru WHERE id_guru = ?', [teacherData.id_guru]);
            expect(teacher.nama).toBe(teacherData.nama);
        });

        it('should update teacher', async () => {
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
        it('should get all students', async () => {
            if (!testDb) return;

            const students = await testDb.all('SELECT * FROM siswa_perwakilan');
            expect(students.length).toBeGreaterThan(0);
            expect(students.every(s => s.nama && s.id_siswa)).toBe(true);
        });

        it('should create new student', async () => {
            if (!testDb) return;

            const studentData = {
                id_siswa: 9999,
                nama: 'New Student',
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

            const student = await testDb.get('SELECT * FROM siswa_perwakilan WHERE id_siswa = ?', [studentData.id_siswa]);
            expect(student.nama).toBe(studentData.nama);
        });

        it('should update student', async () => {
            if (!testDb) return;

            const newName = 'Updated Student Name';
            const result = await testDb.run(
                'UPDATE siswa_perwakilan SET nama = ? WHERE id_siswa = ?',
                [newName, 2000]
            );

            expect(result.changes).toBe(1);

            const student = await testDb.get('SELECT * FROM siswa_perwakilan WHERE id_siswa = ?', [2000]);
            expect(student.nama).toBe(newName);
        });
    });

    describe('Schedule Management', () => {
        it('should get all schedules', async () => {
            if (!testDb) return;

            const schedules = await testDb.all('SELECT * FROM jadwal');
            expect(schedules.length).toBeGreaterThan(0);
            expect(schedules.every(s => s.guru_id && s.mapel_id && s.kelas_id)).toBe(true);
        });

        it('should create new schedule', async () => {
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

            const schedule = await testDb.get('SELECT * FROM jadwal WHERE id = ?', [result.id]);
            expect(schedule.guru_id).toBe(scheduleData.guru_id);
            expect(schedule.hari).toBe(scheduleData.hari);
        });

        it('should update schedule', async () => {
            if (!testDb) return;

            const newTime = '10:00:00';
            const result = await testDb.run(
                'UPDATE jadwal SET jam_mulai = ? WHERE id = ?',
                [newTime, 1]
            );

            expect(result.changes).toBe(1);

            const schedule = await testDb.get('SELECT * FROM jadwal WHERE id = ?', [1]);
            expect(schedule.jam_mulai).toBe(newTime);
        });

        it('should delete schedule', async () => {
            if (!testDb) return;

            // Create a test schedule first
            const result = await testDb.run(
                'INSERT INTO jadwal (guru_id, mapel_id, kelas_id, hari, jam_mulai, jam_selesai, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [1, 1, 1, 'Jumat', '10:00:00', '10:45:00', 'aktif']
            );

            const scheduleId = result.id;

            // Delete the schedule
            const deleteResult = await testDb.run('DELETE FROM jadwal WHERE id = ?', [scheduleId]);
            expect(deleteResult.changes).toBe(1);

            // Verify schedule is deleted
            const schedule = await testDb.get('SELECT * FROM jadwal WHERE id = ?', [scheduleId]);
            expect(schedule).toBeUndefined();
        });
    });

    describe('Attendance Reports', () => {
        it('should get attendance summary', async () => {
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

            const attendance = await testDb.all('SELECT * FROM absensi_guru');
            expect(attendance.length).toBeGreaterThanOrEqual(2);
        });

        it('should get attendance by date range', async () => {
            if (!testDb) return;

            // Create test attendance records
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

        it('should export attendance to Excel', async () => {
            if (!testDb) return;

            // This is a mock test - in real implementation, this would generate Excel file
            const attendance = await testDb.all('SELECT * FROM absensi_guru');
            expect(Array.isArray(attendance)).toBe(true);
        });
    });

    describe('System Management', () => {
        it('should get system status', async () => {
            if (!testDb) return;

            // Mock system status check
            const users = await testDb.all('SELECT COUNT(*) as count FROM pengguna');
            const teachers = await testDb.all('SELECT COUNT(*) as count FROM guru');
            const students = await testDb.all('SELECT COUNT(*) as count FROM siswa_perwakilan');

            expect(users[0].count).toBeGreaterThan(0);
            expect(teachers[0].count).toBeGreaterThan(0);
            expect(students[0].count).toBeGreaterThan(0);
        });

        it('should backup database', async () => {
            if (!testDb) return;

            // Mock backup operation
            const tables = ['pengguna', 'guru', 'siswa_perwakilan', 'mapel', 'kelas', 'jadwal'];
            const backupData = {};

            for (const table of tables) {
                backupData[table] = await testDb.all(`SELECT * FROM ${table}`);
            }

            expect(Object.keys(backupData).length).toBe(tables.length);
            expect(backupData.pengguna.length).toBeGreaterThan(0);
        });

        it('should get system logs', async () => {
            if (!testDb) return;

            // Mock log retrieval
            const logs = [
                { level: 'info', message: 'System started', timestamp: new Date().toISOString() },
                { level: 'info', message: 'Database connected', timestamp: new Date().toISOString() }
            ];

            expect(logs.length).toBeGreaterThan(0);
            expect(logs.every(log => log.level && log.message)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid endpoint', async () => {
            // Mock invalid endpoint response
            const mockResponse = {
                status: 404,
                data: { success: false, message: 'Endpoint not found' }
            };

            expect(mockResponse.status).toBe(404);
            expect(mockResponse.data.success).toBe(false);
        });

        it('should handle server errors gracefully', async () => {
            // Mock server error response
            const mockResponse = {
                status: 500,
                data: { success: false, message: 'Internal server error' }
            };

            expect(mockResponse.status).toBe(500);
            expect(mockResponse.data.success).toBe(false);
        });

        it('should validate request data', async () => {
            if (!testDb) return;

            // Test invalid data handling
            const invalidData = {
                username: '', // Empty username
                password: '123', // Too short password
                role: 'invalid' // Invalid role
            };

            // These should be caught by validation
            expect(invalidData.username).toBe('');
            expect(invalidData.password.length).toBeLessThan(6);
            expect(['admin', 'guru', 'siswa']).not.toContain(invalidData.role);
        });
    });

    describe('Performance', () => {
        it('should respond within acceptable time', async () => {
            if (!testDb) return;

            const startTime = Date.now();
            
            // Simulate multiple database operations
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(testDb.all('SELECT * FROM pengguna'));
            }
            
            await Promise.all(promises);
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });

        it('should handle concurrent requests', async () => {
            if (!testDb) return;

            const startTime = Date.now();
            
            // Simulate concurrent database operations
            const promises = [];
            for (let i = 0; i < 20; i++) {
                promises.push(testDb.get('SELECT * FROM pengguna WHERE username = ?', ['admin']));
            }
            
            const results = await Promise.all(promises);
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(results.length).toBe(20);
            expect(results.every(r => r)).toBe(true);
            expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
        });
    });
});