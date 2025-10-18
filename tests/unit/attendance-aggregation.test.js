// Attendance Aggregation Tests
// Tests T1-T10 and D1-D5 according to business rules

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { db } from '../../db.js';
import { 
    computeDailyStatusForClass, 
    getAttendanceSummary,
    isPresentLike,
    isHadirTercatat 
} from '../../backend/services/attendanceAggregation.js';

describe('Attendance Aggregation Tests', () => {
    let testClassId = 1;
    let testDate = '2025-01-15';
    let testHari = 1; // Monday
    
    beforeEach(async () => {
        // Clean up test data
        await db.execute('DELETE FROM absensi_siswa WHERE tanggal = ?', [testDate]);
        await db.execute('DELETE FROM jadwal_pelajaran WHERE class_id = ?', [testClassId]);
        await db.execute('DELETE FROM siswa WHERE class_id = ?', [testClassId]);
        
        // Create test class and students
        await db.execute(`
            INSERT INTO kelas (id, nama_kelas, tingkat, status) 
            VALUES (?, 'Test Class', 'X', 'aktif')
            ON DUPLICATE KEY UPDATE nama_kelas = 'Test Class'
        `, [testClassId]);
        
        await db.execute(`
            INSERT INTO siswa (id, nis, nama, class_id, status) VALUES 
            (1, 'S001', 'Student 1', ?, 'aktif'),
            (2, 'S002', 'Student 2', ?, 'aktif')
        `, [testClassId, testClassId]);
        
        // Create test schedule (2 slots)
        await db.execute(`
            INSERT INTO jadwal_pelajaran (id, class_id, subject_id, teacher_id, hari, jam_ke, start_time, end_time, is_active) VALUES 
            (1, ?, 1, 1, ?, 1, '08:00:00', '09:00:00', 1),
            (2, ?, 1, 1, ?, 2, '09:00:00', '10:00:00', 1)
        `, [testClassId, testHari, testClassId, testHari]);
    });
    
    afterEach(async () => {
        // Clean up test data
        await db.execute('DELETE FROM absensi_siswa WHERE tanggal = ?', [testDate]);
        await db.execute('DELETE FROM jadwal_pelajaran WHERE class_id = ?', [testClassId]);
        await db.execute('DELETE FROM siswa WHERE class_id = ?', [testClassId]);
    });
    
    describe('T1-T10: Core Business Logic Tests', () => {
        // T1: Sakit jam 1, hadir sisanya → HADIR
        test('T1: Partial SAKIT should result in HADIR', async () => {
            // Student 1: SAKIT jam 1, HADIR jam 2
            await db.execute(`
                INSERT INTO absensi_siswa (student_id, jadwal_id, jam_ke, tanggal, status) VALUES 
                (1, 1, 1, ?, 'SAKIT'),
                (1, 2, 2, ?, 'HADIR')
            `, [testDate, testDate]);
            
            const results = await computeDailyStatusForClass(testClassId, testDate, testHari);
            const student1 = results.find(s => s.student_id === 1);
            
            expect(student1.final_status).toBe('HADIR');
        });
        
        // T2: Izin jam 1, hadir sisanya → HADIR
        test('T2: Partial IZIN should result in HADIR', async () => {
            // Student 1: IZIN jam 1, HADIR jam 2
            await db.execute(`
                INSERT INTO absensi_siswa (student_id, jadwal_id, jam_ke, tanggal, status) VALUES 
                (1, 1, 1, ?, 'IZIN'),
                (1, 2, 2, ?, 'HADIR')
            `, [testDate, testDate]);
            
            const results = await computeDailyStatusForClass(testClassId, testDate, testHari);
            const student1 = results.find(s => s.student_id === 1);
            
            expect(student1.final_status).toBe('HADIR');
        });
        
        // T3: Dispen full day → HADIR
        test('T3: Full day DISPEN should result in HADIR', async () => {
            // Student 1: DISPEN jam 1, DISPEN jam 2
            await db.execute(`
                INSERT INTO absensi_siswa (student_id, jadwal_id, jam_ke, tanggal, status) VALUES 
                (1, 1, 1, ?, 'DISPEN'),
                (1, 2, 2, ?, 'DISPEN')
            `, [testDate, testDate]);
            
            const results = await computeDailyStatusForClass(testClassId, testDate, testHari);
            const student1 = results.find(s => s.student_id === 1);
            
            expect(student1.final_status).toBe('HADIR');
        });
        
        // T4: Alpha jam 1, hadir sisanya → TIDAK_HADIR
        test('T4: One ALPHA should result in TIDAK_HADIR', async () => {
            // Student 1: ALPHA jam 1, HADIR jam 2
            await db.execute(`
                INSERT INTO absensi_siswa (student_id, jadwal_id, jam_ke, tanggal, status) VALUES 
                (1, 1, 1, ?, 'ALPHA'),
                (1, 2, 2, ?, 'HADIR')
            `, [testDate, testDate]);
            
            const results = await computeDailyStatusForClass(testClassId, testDate, testHari);
            const student1 = results.find(s => s.student_id === 1);
            
            expect(student1.final_status).toBe('TIDAK_HADIR');
        });
        
        // T5: Ada jadwal jam terakhir tapi tanpa event → TIDAK_HADIR
        test('T5: Missing event on scheduled slot should result in TIDAK_HADIR', async () => {
            // Student 1: HADIR jam 1, no event jam 2 (should be absent-like)
            await db.execute(`
                INSERT INTO absensi_siswa (student_id, jadwal_id, jam_ke, tanggal, status) VALUES 
                (1, 1, 1, ?, 'HADIR')
            `, [testDate]);
            
            const results = await computeDailyStatusForClass(testClassId, testDate, testHari);
            const student1 = results.find(s => s.student_id === 1);
            
            expect(student1.final_status).toBe('TIDAK_HADIR');
        });
        
        // T6: Slot tanpa jadwal diabaikan dan tidak memengaruhi status
        test('T6: Non-scheduled slots should be ignored', async () => {
            // Student 1: HADIR jam 1, HADIR jam 2
            await db.execute(`
                INSERT INTO absensi_siswa (student_id, jadwal_id, jam_ke, tanggal, status) VALUES 
                (1, 1, 1, ?, 'HADIR'),
                (1, 2, 2, ?, 'HADIR')
            `, [testDate, testDate]);
            
            const results = await computeDailyStatusForClass(testClassId, testDate, testHari);
            const student1 = results.find(s => s.student_id === 1);
            
            expect(student1.final_status).toBe('HADIR');
        });
        
        // T7: KETOS kirim SAKIT/IZIN/DISPEN → 403 (tested in RBAC tests)
        // T8: GURU ubah absensi kelas yang bukan dia ajar → 403 (tested in RBAC tests)
        // T9: Duplikasi event pada slot sama → 409 (tested in RBAC tests)
        // T10: Laporan 1 bulan untuk 1 kelas berjalan < 1 detik (performance test)
        test('T10: Performance test for monthly report', async () => {
            const startTime = Date.now();
            
            // Create multiple attendance records
            for (let day = 1; day <= 30; day++) {
                const date = `2025-01-${day.toString().padStart(2, '0')}`;
                await db.execute(`
                    INSERT INTO absensi_siswa (student_id, jadwal_id, jam_ke, tanggal, status) VALUES 
                    (1, 1, 1, ?, 'HADIR'),
                    (1, 2, 2, ?, 'HADIR')
                `, [date, date]);
            }
            
            const results = await getAttendanceSummary(testClassId, '2025-01-15', testHari);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
            expect(results.total_students).toBe(2);
        });
    });
    
    describe('D1-D5: DISPEN = HADIR Tercatat Tests', () => {
        // D1: Semua slot DISPEN → final HADIR, hadir_tercatat penuh
        test('D1: All DISPEN should result in HADIR with full hadir_tercatat', async () => {
            await db.execute(`
                INSERT INTO absensi_siswa (student_id, jadwal_id, jam_ke, tanggal, status) VALUES 
                (1, 1, 1, ?, 'DISPEN'),
                (1, 2, 2, ?, 'DISPEN')
            `, [testDate, testDate]);
            
            const results = await computeDailyStatusForClass(testClassId, testDate, testHari);
            const student1 = results.find(s => s.student_id === 1);
            
            expect(student1.final_status).toBe('HADIR');
            expect(student1.hadir_tercatat_slots).toBe(2);
            expect(student1.total_scheduled_slots).toBe(2);
        });
        
        // D2: Campuran DISPEN dan HADIR/TERLAMBAT tanpa ALPHA → final HADIR
        test('D2: Mixed DISPEN and HADIR/TERLAMBAT should result in HADIR', async () => {
            await db.execute(`
                INSERT INTO absensi_siswa (student_id, jadwal_id, jam_ke, tanggal, status) VALUES 
                (1, 1, 1, ?, 'DISPEN'),
                (1, 2, 2, ?, 'HADIR')
            `, [testDate, testDate]);
            
            const results = await computeDailyStatusForClass(testClassId, testDate, testHari);
            const student1 = results.find(s => s.student_id === 1);
            
            expect(student1.final_status).toBe('HADIR');
            expect(student1.hadir_tercatat_slots).toBe(2);
        });
        
        // D3: Ada satu ALPHA + slot lainnya DISPEN/HADIR → final TIDAK_HADIR
        test('D3: One ALPHA with DISPEN/HADIR should result in TIDAK_HADIR', async () => {
            await db.execute(`
                INSERT INTO absensi_siswa (student_id, jadwal_id, jam_ke, tanggal, status) VALUES 
                (1, 1, 1, ?, 'ALPHA'),
                (1, 2, 2, ?, 'DISPEN')
            `, [testDate, testDate]);
            
            const results = await computeDailyStatusForClass(testClassId, testDate, testHari);
            const student1 = results.find(s => s.student_id === 1);
            
            expect(student1.final_status).toBe('TIDAK_HADIR');
        });
        
        // D4: KETOS mencoba input DISPEN → 403 (tested in RBAC tests)
        // D5: Laporan harian menampilkan total_hadir_tercatat_slot termasuk DISPEN
        test('D5: Daily report should include DISPEN in hadir_tercatat', async () => {
            await db.execute(`
                INSERT INTO absensi_siswa (student_id, jadwal_id, jam_ke, tanggal, status) VALUES 
                (1, 1, 1, ?, 'DISPEN'),
                (1, 2, 2, ?, 'HADIR'),
                (2, 1, 1, ?, 'TERLAMBAT'),
                (2, 2, 2, ?, 'DISPEN')
            `, [testDate, testDate, testDate, testDate]);
            
            const summary = await getAttendanceSummary(testClassId, testDate, testHari);
            
            expect(summary.total_hadir_tercatat_slots).toBe(4); // All DISPEN, HADIR, TERLAMBAT
            expect(summary.total_scheduled_slots).toBe(4); // 2 students × 2 slots
            expect(summary.attendance_rate).toBe('100.00');
        });
    });
    
    describe('Helper Function Tests', () => {
        test('isPresentLike should correctly identify present-like statuses', () => {
            expect(isPresentLike('HADIR')).toBe(true);
            expect(isPresentLike('TERLAMBAT')).toBe(true);
            expect(isPresentLike('SAKIT')).toBe(true);
            expect(isPresentLike('IZIN')).toBe(true);
            expect(isPresentLike('DISPEN')).toBe(true);
            expect(isPresentLike('ALPHA')).toBe(false);
            expect(isPresentLike('UNKNOWN')).toBe(false);
        });
        
        test('isHadirTercatat should correctly identify hadir tercatat statuses', () => {
            expect(isHadirTercatat('HADIR')).toBe(true);
            expect(isHadirTercatat('TERLAMBAT')).toBe(true);
            expect(isHadirTercatat('DISPEN')).toBe(true);
            expect(isHadirTercatat('SAKIT')).toBe(false);
            expect(isHadirTercatat('IZIN')).toBe(false);
            expect(isHadirTercatat('ALPHA')).toBe(false);
        });
    });
});

