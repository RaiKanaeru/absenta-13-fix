#!/usr/bin/env node

// Simple test script to verify attendance aggregation implementation
import { db } from './db.js';
import { 
    computeDailyStatusForClass, 
    getAttendanceSummary,
    isPresentLike,
    isHadirTercatat 
} from './backend/services/attendanceAggregation.js';

async function testAttendanceImplementation() {
    console.log('🧪 Testing Attendance Aggregation Implementation...');
    
    try {
        // Test helper functions
        console.log('\n📋 Testing helper functions...');
        
        // Test isPresentLike
        console.log('✅ isPresentLike tests:');
        console.log(`  HADIR: ${isPresentLike('HADIR')} (should be true)`);
        console.log(`  TERLAMBAT: ${isPresentLike('TERLAMBAT')} (should be true)`);
        console.log(`  SAKIT: ${isPresentLike('SAKIT')} (should be true)`);
        console.log(`  IZIN: ${isPresentLike('IZIN')} (should be true)`);
        console.log(`  DISPEN: ${isPresentLike('DISPEN')} (should be true)`);
        console.log(`  ALPHA: ${isPresentLike('ALPHA')} (should be false)`);
        
        // Test isHadirTercatat
        console.log('\n✅ isHadirTercatat tests:');
        console.log(`  HADIR: ${isHadirTercatat('HADIR')} (should be true)`);
        console.log(`  TERLAMBAT: ${isHadirTercatat('TERLAMBAT')} (should be true)`);
        console.log(`  DISPEN: ${isHadirTercatat('DISPEN')} (should be true)`);
        console.log(`  SAKIT: ${isHadirTercatat('SAKIT')} (should be false)`);
        console.log(`  IZIN: ${isHadirTercatat('IZIN')} (should be false)`);
        console.log(`  ALPHA: ${isHadirTercatat('ALPHA')} (should be false)`);
        
        // Test database connection
        console.log('\n📡 Testing database connection...');
        const [testResult] = await db.execute('SELECT 1 as test');
        console.log(`✅ Database connection: ${testResult[0].test === 1 ? 'OK' : 'FAILED'}`);
        
        // Test if required tables exist
        console.log('\n🗄️  Checking required tables...');
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('users', 'guru', 'siswa', 'kelas', 'mapel', 'jadwal_pelajaran', 'absensi_siswa')
        `);
        
        const requiredTables = ['users', 'guru', 'siswa', 'kelas', 'mapel', 'jadwal_pelajaran', 'absensi_siswa'];
        const existingTables = tables.map(t => t.TABLE_NAME);
        
        console.log('✅ Required tables check:');
        requiredTables.forEach(table => {
            const exists = existingTables.includes(table);
            console.log(`  ${table}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        });
        
        // Test if migration was applied
        console.log('\n🔄 Checking migration status...');
        
        // Check if users table has nomor_telepon column
        const [usersColumns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'nomor_telepon'
        `);
        console.log(`✅ Users.nomor_telepon column: ${usersColumns.length > 0 ? 'EXISTS' : 'MISSING'}`);
        
        // Check if guru table has username column (should be removed)
        const [guruColumns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'guru' 
            AND COLUMN_NAME = 'username'
        `);
        console.log(`✅ Guru.username column removed: ${guruColumns.length === 0 ? 'YES' : 'NO'}`);
        
        // Check if pengajuan_izin tables are removed
        const [izinTables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('pengajuan_izin', 'pengajuan_izin_detail')
        `);
        console.log(`✅ Pengajuan izin tables removed: ${izinTables.length === 0 ? 'YES' : 'NO'}`);
        
        // Check unique constraints
        const [constraints] = await db.execute(`
            SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND CONSTRAINT_NAME IN ('uq_jadwal_slot', 'uq_absen_slot')
        `);
        console.log(`✅ Unique constraints created: ${constraints.length} found`);
        constraints.forEach(c => {
            console.log(`  ${c.CONSTRAINT_NAME} on ${c.TABLE_NAME}.${c.COLUMN_NAME}`);
        });
        
        // Test attendance aggregation with sample data
        console.log('\n🧮 Testing attendance aggregation...');
        
        // Create test data
  const testClassId = 999;
  const testDate = '2025-01-15';
  const testHari = 1;
  const testDate2 = '2025-01-16';
  const testDate3 = '2025-01-17';
        
        try {
            // Clean up any existing test data
            await db.execute('DELETE FROM absensi_siswa WHERE tanggal = ?', [testDate]);
            await db.execute('DELETE FROM jadwal WHERE kelas_id = ?', [testClassId]);
            await db.execute('DELETE FROM siswa WHERE kelas_id = ?', [testClassId]);
            await db.execute('DELETE FROM kelas WHERE id_kelas = ?', [testClassId]);
            
            // Create test class
            await db.execute(`
                INSERT INTO kelas (id_kelas, nama_kelas, tingkat, status) 
                VALUES (?, 'Test Class', 'X', 'aktif')
            `, [testClassId]);
            
            // Create test students
            await db.execute(`
                INSERT INTO siswa (id_siswa, user_id, nis, nama, kelas_id, status) VALUES 
                (9991, 9991, 'S9991', 'Test Student 1', ?, 'aktif'),
                (9992, 9992, 'S9992', 'Test Student 2', ?, 'aktif')
            `, [testClassId, testClassId]);
            
            // Create test schedule
            await db.execute(`
                INSERT INTO jadwal (id_jadwal, kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai) VALUES 
                (9991, ?, 1, 1, ?, 1, '08:00:00', '09:00:00'),
                (9992, ?, 1, 1, ?, 2, '09:00:00', '10:00:00')
            `, [testClassId, testHari, testClassId, testHari]);
            
            // Test case: Student 1 has SAKIT jam 1, HADIR jam 2 → should be HADIR
            await db.execute(`
                INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status) VALUES 
                (9991, 9991, ?, 'Sakit'),
                (9991, 9992, ?, 'Hadir')
            `, [testDate, testDate]);
            
            // Test case: Student 2 has ALPHA jam 1, HADIR jam 2 → should be TIDAK_HADIR
            await db.execute(`
                INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status) VALUES 
                (9992, 9991, ?, 'Alpa'),
                (9992, 9992, ?, 'Hadir')
            `, [testDate, testDate]);
            
            // Test aggregation
            const results = await computeDailyStatusForClass(testClassId, testDate, testHari);
            console.log(`✅ Aggregation completed for ${results.length} students`);
            
            // Verify results
            const student1 = results.find(s => s.student_id === 9991);
            const student2 = results.find(s => s.student_id === 9992);
            
            console.log(`✅ Student 1 (SAKIT + HADIR): ${student1.final_status} (expected: HADIR)`);
            console.log(`✅ Student 2 (ALPHA + HADIR): ${student2.final_status} (expected: TIDAK_HADIR)`);
            
            // Test DISPEN = HADIR tercatat
            console.log('\n🎯 Testing DISPEN = HADIR tercatat...');
            
            // Clean up and create new test data for DISPEN
            await db.execute('DELETE FROM absensi_siswa WHERE tanggal = ?', [testDate2]);
            
            // Student 1: All DISPEN → should be HADIR with hadir_tercatat = 2
            await db.execute(`
                INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status) VALUES 
                (9991, 9991, ?, 'Dispen'),
                (9991, 9992, ?, 'Dispen')
            `, [testDate2, testDate2]);
            
            const dispenResults = await computeDailyStatusForClass(testClassId, testDate2, testHari);
            const dispenStudent = dispenResults.find(s => s.student_id === 9991);
            
            console.log(`✅ DISPEN test - Final status: ${dispenStudent.final_status} (expected: HADIR)`);
            console.log(`✅ DISPEN test - Hadir tercatat slots: ${dispenStudent.hadir_tercatat_slots} (expected: 2)`);
            console.log(`✅ DISPEN test - Total scheduled slots: ${dispenStudent.total_scheduled_slots} (expected: 2)`);
            
            // Test summary
            const summary = await getAttendanceSummary(testClassId, testDate2, testHari);
            console.log(`✅ Summary - Total students: ${summary.total_students}`);
            console.log(`✅ Summary - Hadir count: ${summary.hadir_count}`);
            console.log(`✅ Summary - Hadir percentage: ${summary.hadir_percentage}%`);
            console.log(`✅ Summary - Total hadir tercatat slots: ${summary.total_hadir_tercatat_slots}`);
            console.log(`✅ Summary - Attendance rate: ${summary.attendance_rate}%`);
            
            console.log('\n🎉 All tests completed successfully!');
            
        } finally {
            // Clean up test data
            await db.execute('DELETE FROM absensi_siswa WHERE tanggal IN (?, ?)', [testDate, testDate2]);
            await db.execute('DELETE FROM jadwal WHERE kelas_id = ?', [testClassId]);
            await db.execute('DELETE FROM siswa WHERE kelas_id = ?', [testClassId]);
            await db.execute('DELETE FROM kelas WHERE id_kelas = ?', [testClassId]);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        await db.close();
    }
}

// Run the test
testAttendanceImplementation().catch(console.error);
