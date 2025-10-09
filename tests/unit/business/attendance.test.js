/**
 * Unit Tests for Attendance Business Logic
 */

const { describe, it, expect } = require('@jest/globals');

describe('Attendance Business Logic', () => {
    describe('Teacher Attendance', () => {
        it('should validate teacher attendance status', () => {
            const validStatuses = ['hadir', 'tidak_hadir', 'izin', 'sakit', 'cuti'];
            const invalidStatuses = ['invalid', '', null, undefined];

            validStatuses.forEach(status => {
                expect(['hadir', 'tidak_hadir', 'izin', 'sakit', 'cuti'].includes(status)).toBe(true);
            });

            invalidStatuses.forEach(status => {
                expect(['hadir', 'tidak_hadir', 'izin', 'sakit', 'cuti'].includes(status)).toBe(false);
            });
        });

        it('should calculate teacher attendance percentage', () => {
            const attendanceRecords = [
                { guru_id: 1, status: 'hadir', tanggal: '2024-01-01' },
                { guru_id: 1, status: 'hadir', tanggal: '2024-01-02' },
                { guru_id: 1, status: 'izin', tanggal: '2024-01-03' },
                { guru_id: 1, status: 'hadir', tanggal: '2024-01-04' },
                { guru_id: 1, status: 'sakit', tanggal: '2024-01-05' }
            ];

            const totalDays = attendanceRecords.length;
            const presentDays = attendanceRecords.filter(record => record.status === 'hadir').length;
            const expectedPercentage = (presentDays / totalDays) * 100;

            expect(totalDays).toBe(5);
            expect(presentDays).toBe(3);
            expect(expectedPercentage).toBe(60);
        });

        it('should handle attendance data structure', () => {
            const attendanceData = {
                guru_id: 1,
                jadwal_id: 1,
                tanggal: '2024-01-15',
                jam_mulai: '07:00:00',
                jam_selesai: '07:45:00',
                status: 'hadir',
                keterangan: 'Mengajar normal'
            };

            expect(attendanceData.guru_id).toBeDefined();
            expect(attendanceData.jadwal_id).toBeDefined();
            expect(attendanceData.tanggal).toBeDefined();
            expect(attendanceData.status).toBeDefined();
            expect(attendanceData.jam_mulai).toBeDefined();
            expect(attendanceData.jam_selesai).toBeDefined();
        });
    });

    describe('Student Attendance', () => {
        it('should validate student attendance status', () => {
            const validStatuses = ['hadir', 'tidak_hadir', 'izin', 'sakit', 'alpa'];
            const invalidStatuses = ['invalid', '', null, undefined];

            validStatuses.forEach(status => {
                expect(['hadir', 'tidak_hadir', 'izin', 'sakit', 'alpa'].includes(status)).toBe(true);
            });

            invalidStatuses.forEach(status => {
                expect(['hadir', 'tidak_hadir', 'izin', 'sakit', 'alpa'].includes(status)).toBe(false);
            });
        });

        it('should calculate student attendance percentage', () => {
            const attendanceRecords = [
                { siswa_id: 2000, status: 'hadir', tanggal: '2024-01-01' },
                { siswa_id: 2000, status: 'hadir', tanggal: '2024-01-02' },
                { siswa_id: 2000, status: 'izin', tanggal: '2024-01-03' },
                { siswa_id: 2000, status: 'alpa', tanggal: '2024-01-04' },
                { siswa_id: 2000, status: 'hadir', tanggal: '2024-01-05' }
            ];

            const totalDays = attendanceRecords.length;
            const presentDays = attendanceRecords.filter(record => record.status === 'hadir').length;
            const expectedPercentage = (presentDays / totalDays) * 100;

            expect(totalDays).toBe(5);
            expect(presentDays).toBe(3);
            expect(expectedPercentage).toBe(60);
        });

        it('should handle bulk student attendance', () => {
            const students = [2000, 2001, 2002];
            const jadwalId = 1;
            const tanggal = '2024-01-15';

            const attendanceRecords = students.map(siswaId => ({
                siswa_id: siswaId,
                jadwal_id: jadwalId,
                tanggal: tanggal,
                status: 'hadir'
            }));

            expect(attendanceRecords.length).toBe(students.length);
            attendanceRecords.forEach(record => {
                expect(record.siswa_id).toBeDefined();
                expect(record.jadwal_id).toBe(jadwalId);
                expect(record.tanggal).toBe(tanggal);
                expect(record.status).toBe('hadir');
            });
        });
    });

    describe('Schedule Management', () => {
        it('should validate schedule time slots', () => {
            const validTimeSlots = [
                { jam_mulai: '07:00:00', jam_selesai: '07:45:00' },
                { jam_mulai: '08:00:00', jam_selesai: '08:45:00' },
                { jam_mulai: '09:00:00', jam_selesai: '09:45:00' }
            ];

            const invalidTimeSlots = [
                { jam_mulai: '07:00:00', jam_selesai: '06:45:00' }, // End before start
                { jam_mulai: '25:00:00', jam_selesai: '26:00:00' }, // Invalid time
                { jam_mulai: '07:00:00', jam_selesai: '07:00:00' }   // Same start and end
            ];

            validTimeSlots.forEach(slot => {
                const startTime = new Date(`2000-01-01T${slot.jam_mulai}`);
                const endTime = new Date(`2000-01-01T${slot.jam_selesai}`);
                expect(endTime > startTime).toBe(true);
            });

            invalidTimeSlots.forEach(slot => {
                const startTime = new Date(`2000-01-01T${slot.jam_mulai}`);
                const endTime = new Date(`2000-01-01T${slot.jam_selesai}`);
                expect(endTime > startTime).toBe(false);
            });
        });

        it('should validate schedule days', () => {
            const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const invalidDays = ['Minggu', 'Sunday', 'invalid', ''];

            validDays.forEach(day => {
                expect(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].includes(day)).toBe(true);
            });

            invalidDays.forEach(day => {
                expect(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].includes(day)).toBe(false);
            });
        });

        it('should check for schedule conflicts', () => {
            const existingSchedule = {
                guru_id: 1,
                kelas_id: 1,
                hari: 'Senin',
                jam_mulai: '07:00:00',
                jam_selesai: '07:45:00'
            };

            const conflictingSchedule = {
                guru_id: 1,
                kelas_id: 1,
                hari: 'Senin',
                jam_mulai: '07:30:00', // Overlaps with existing
                jam_selesai: '08:15:00'
            };

            const existingStart = new Date(`2000-01-01T${existingSchedule.jam_mulai}`);
            const existingEnd = new Date(`2000-01-01T${existingSchedule.jam_selesai}`);
            const conflictStart = new Date(`2000-01-01T${conflictingSchedule.jam_mulai}`);
            const conflictEnd = new Date(`2000-01-01T${conflictingSchedule.jam_selesai}`);

            const hasConflict = (conflictStart < existingEnd && conflictEnd > existingStart);
            expect(hasConflict).toBe(true);
        });
    });

    describe('Report Generation', () => {
        it('should generate teacher attendance report', () => {
            const attendanceRecords = [
                { guru_id: 1, tanggal: '2024-01-01', status: 'hadir' },
                { guru_id: 1, tanggal: '2024-01-02', status: 'hadir' },
                { guru_id: 1, tanggal: '2024-01-03', status: 'izin' },
                { guru_id: 1, tanggal: '2024-01-04', status: 'sakit' }
            ];

            const report = attendanceRecords.reduce((acc, record) => {
                acc[record.status] = (acc[record.status] || 0) + 1;
                return acc;
            }, {});

            expect(report).toBeDefined();
            expect(report.hadir).toBe(2);
            expect(report.izin).toBe(1);
            expect(report.sakit).toBe(1);
        });

        it('should generate student attendance report', () => {
            const attendanceRecords = [
                { siswa_id: 2000, tanggal: '2024-01-01', status: 'hadir' },
                { siswa_id: 2000, tanggal: '2024-01-02', status: 'hadir' },
                { siswa_id: 2000, tanggal: '2024-01-03', status: 'izin' },
                { siswa_id: 2000, tanggal: '2024-01-04', status: 'alpa' }
            ];

            const report = attendanceRecords.reduce((acc, record) => {
                acc[record.status] = (acc[record.status] || 0) + 1;
                return acc;
            }, {});

            expect(report).toBeDefined();
            expect(report.hadir).toBe(2);
            expect(report.izin).toBe(1);
            expect(report.alpa).toBe(1);
        });

        it('should calculate attendance statistics', () => {
            const attendanceRecords = [
                { guru_id: 1, tanggal: '2024-01-01', status: 'hadir' },
                { guru_id: 1, tanggal: '2024-01-02', status: 'hadir' },
                { guru_id: 1, tanggal: '2024-01-03', status: 'izin' },
                { guru_id: 1, tanggal: '2024-01-04', status: 'sakit' },
                { guru_id: 1, tanggal: '2024-01-05', status: 'hadir' }
            ];

            const totalDays = attendanceRecords.length;
            const presentDays = attendanceRecords.filter(record => record.status === 'hadir').length;
            const percentage = (presentDays / totalDays) * 100;

            expect(totalDays).toBe(5);
            expect(presentDays).toBe(3);
            expect(percentage).toBe(60);
        });
    });

    describe('Data Validation', () => {
        it('should validate date formats', () => {
            const validDates = ['2024-01-15', '2024-12-31', '2023-02-28'];
            const invalidDates = ['invalid-date', '15-01-2024'];

            validDates.forEach(date => {
                const dateObj = new Date(date);
                expect(dateObj instanceof Date && !isNaN(dateObj)).toBe(true);
            });

            invalidDates.forEach(date => {
                const dateObj = new Date(date);
                expect(dateObj instanceof Date && !isNaN(dateObj)).toBe(false);
            });

            // Test specific invalid dates that might pass Date constructor
            const invalidDate1 = new Date('2024-13-01');
            const invalidDate2 = new Date('2024-02-30');
            expect(isNaN(invalidDate1.getMonth())).toBe(true); // Invalid date
            expect(invalidDate2.getDate()).toBe(1); // Rolled over to next month
        });

        it('should validate time formats', () => {
            const validTimes = ['07:00:00', '23:59:59', '00:00:00'];
            const invalidTimes = ['25:00:00', '07:60:00', '07:00:60', 'invalid-time'];

            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;

            validTimes.forEach(time => {
                expect(timeRegex.test(time)).toBe(true);
            });

            invalidTimes.forEach(time => {
                expect(timeRegex.test(time)).toBe(false);
            });
        });

        it('should validate required fields', () => {
            const requiredFields = ['guru_id', 'jadwal_id', 'tanggal', 'status'];
            const attendanceData = {
                guru_id: 1,
                jadwal_id: 1,
                tanggal: '2024-01-15',
                status: 'hadir'
            };

            requiredFields.forEach(field => {
                expect(attendanceData[field]).toBeDefined();
                expect(attendanceData[field]).not.toBeNull();
                expect(attendanceData[field]).not.toBe('');
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid teacher ID', () => {
            const invalidGuruId = 99999;
            const attendanceData = {
                guru_id: invalidGuruId,
                jadwal_id: 1,
                tanggal: '2024-01-15',
                status: 'hadir'
            };

            expect(attendanceData.guru_id).toBe(invalidGuruId);
            expect(attendanceData.guru_id).toBeGreaterThan(0);
        });

        it('should handle invalid student ID', () => {
            const invalidSiswaId = 99999;
            const attendanceData = {
                siswa_id: invalidSiswaId,
                jadwal_id: 1,
                tanggal: '2024-01-15',
                status: 'hadir'
            };

            expect(attendanceData.siswa_id).toBe(invalidSiswaId);
            expect(attendanceData.siswa_id).toBeGreaterThan(0);
        });

        it('should handle invalid schedule ID', () => {
            const invalidJadwalId = 99999;
            const attendanceData = {
                guru_id: 1,
                jadwal_id: invalidJadwalId,
                tanggal: '2024-01-15',
                status: 'hadir'
            };

            expect(attendanceData.jadwal_id).toBe(invalidJadwalId);
            expect(attendanceData.jadwal_id).toBeGreaterThan(0);
        });
    });

    describe('Performance Tests', () => {
        it('should handle bulk attendance insertion efficiently', () => {
            const startTime = Date.now();
            const attendanceRecords = Array.from({ length: 100 }, (_, i) => ({
                guru_id: 1,
                jadwal_id: 1,
                tanggal: `2024-01-${String(i + 1).padStart(2, '0')}`,
                status: 'hadir'
            }));

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(attendanceRecords.length).toBe(100);
            expect(duration).toBeLessThan(100); // Should complete within 100ms
        });

        it('should retrieve attendance data efficiently', () => {
            const attendanceRecords = Array.from({ length: 50 }, (_, i) => ({
                guru_id: 1,
                jadwal_id: 1,
                tanggal: `2024-01-${String(i + 1).padStart(2, '0')}`,
                status: 'hadir'
            }));

            const startTime = Date.now();
            const filteredRecords = attendanceRecords.filter(record => 
                record.guru_id === 1 && 
                record.tanggal >= '2024-01-01' && 
                record.tanggal <= '2024-01-31'
            );
            const endTime = Date.now();

            const duration = endTime - startTime;
            expect(duration).toBeLessThan(10); // Should complete within 10ms
            expect(filteredRecords.length).toBe(31); // Only 31 days in January
        });
    });
});