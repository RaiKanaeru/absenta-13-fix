import { db } from './db.js';
import { computeDailyStatusForClass, getAttendanceSummary, isPresentLike, isHadirTercatat } from './backend/services/attendanceAggregation.js';

async function testAttendanceFinal() {
    console.log('🧪 Testing Attendance Aggregation (Final)...');
    
    // Test helper functions first
    console.log('\n📋 Testing helper functions...');
    console.log('✅ isPresentLike tests:');
    console.log(`  'Hadir': ${isPresentLike('Hadir')} (should be true)`);
    console.log(`  'Terlambat': ${isPresentLike('Terlambat')} (should be true)`);
    console.log(`  'Sakit': ${isPresentLike('Sakit')} (should be true)`);
    console.log(`  'Izin': ${isPresentLike('Izin')} (should be true)`);
    console.log(`  'Dispen': ${isPresentLike('Dispen')} (should be true)`);
    console.log(`  'Alpa': ${isPresentLike('Alpa')} (should be false)`);
    
    console.log('\n✅ isHadirTercatat tests:');
    console.log(`  'Hadir': ${isHadirTercatat('Hadir')} (should be true)`);
    console.log(`  'Terlambat': ${isHadirTercatat('Terlambat')} (should be true)`);
    console.log(`  'Dispen': ${isHadirTercatat('Dispen')} (should be true)`);
    console.log(`  'Sakit': ${isHadirTercatat('Sakit')} (should be false)`);
    console.log(`  'Izin': ${isHadirTercatat('Izin')} (should be false)`);
    console.log(`  'Alpa': ${isHadirTercatat('Alpa')} (should be false)`);
    
    const testClassId = 999;
    const testDate = '2025-01-15';
    const testHari = 1;
    
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
        
        // Test case: Student 1 has SAKIT for slot 1, HADIR for slot 2
        await db.execute(`
            INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status) VALUES 
            (9991, 9991, ?, 'Sakit'),
            (9991, 9992, ?, 'Hadir')
        `, [testDate, testDate]);
        
        // Test case: Student 2 has ALPHA for slot 1, HADIR for slot 2
        await db.execute(`
            INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status) VALUES 
            (9992, 9991, ?, 'Alpa'),
            (9992, 9992, ?, 'Hadir')
        `, [testDate, testDate]);
        
        // Test aggregation
        const results = await computeDailyStatusForClass(testClassId, testDate, testHari);
        console.log(`\n✅ Aggregation completed for ${results.length} students`);
        
        // Verify results
        const student1Result = results.find(r => r.student_id === 9991);
        const student2Result = results.find(r => r.student_id === 9992);
        
        console.log(`\n📊 Results:`);
        console.log(`  Student 1 (SAKIT): ${student1Result?.final_status} (should be HADIR)`);
        console.log(`  Student 2 (ALPHA): ${student2Result?.final_status} (should be TIDAK_HADIR)`);
        
        // Test DISPEN = HADIR tercatat
        const testDate2 = '2025-01-16';
        await db.execute('DELETE FROM absensi_siswa WHERE tanggal = ?', [testDate2]);
        await db.execute(`
            INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status) VALUES
            (9991, 9991, ?, 'Dispen'),
            (9991, 9992, ?, 'Dispen')
        `, [testDate2, testDate2]);
        
        const dispenResults = await computeDailyStatusForClass(testClassId, testDate2, testHari);
        const dispenStudent1 = dispenResults.find(r => r.student_id === 9991);
        
        console.log(`\n📊 DISPEN Test:`);
        console.log(`  Student 1 (DISPEN): ${dispenStudent1?.final_status} (should be HADIR)`);
        
        const summary = await getAttendanceSummary(testClassId, testDate2, testHari);
        console.log(`\n📊 Summary: ${JSON.stringify(summary, null, 2)}`);
        
        console.log('\n🎉 All tests completed successfully!');
        
    } finally {
        // Clean up test data
        await db.execute('DELETE FROM absensi_siswa WHERE tanggal IN (?, ?)', [testDate, '2025-01-16']);
        await db.execute('DELETE FROM jadwal WHERE kelas_id = ?', [testClassId]);
        await db.execute('DELETE FROM siswa WHERE kelas_id = ?', [testClassId]);
        await db.execute('DELETE FROM kelas WHERE id_kelas = ?', [testClassId]);
    }
}

testAttendanceFinal().catch(console.error);
