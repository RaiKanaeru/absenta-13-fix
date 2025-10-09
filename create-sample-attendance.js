#!/usr/bin/env node

/**
 * Script untuk membuat data sample absensi untuk testing
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    port: process.env.DB_PORT || 3306
};

async function createSampleAttendance() {
    let db;
    try {
        db = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Database connected');
        
        // Get sample data
        const [jadwal] = await db.execute('SELECT id_jadwal, kelas_id, guru_id FROM jadwal LIMIT 1');
        const [siswa] = await db.execute('SELECT id_siswa FROM siswa LIMIT 1');
        
        if (jadwal.length === 0) {
            console.log('❌ Tidak ada jadwal untuk testing');
            return;
        }
        
        if (siswa.length === 0) {
            console.log('❌ Tidak ada siswa untuk testing');
            return;
        }
        
        const jadwalId = jadwal[0].id_jadwal;
        const kelasId = jadwal[0].kelas_id;
        const guruId = jadwal[0].guru_id;
        const siswaId = siswa[0].id_siswa;
        
        console.log('📊 Using data:', { jadwalId, kelasId, guruId, siswaId });
        
        // Get correct IDs
        const [siswaData] = await db.execute('SELECT id FROM siswa WHERE id_siswa = ?', [siswaId]);
        const [jadwalPelajaran] = await db.execute('SELECT id_jadwal FROM jadwal_pelajaran LIMIT 1');
        
        if (siswaData.length === 0) {
            console.log('❌ Tidak ada siswa dengan id_siswa:', siswaId);
            return;
        }
        
        if (jadwalPelajaran.length === 0) {
            console.log('❌ Tidak ada jadwal_pelajaran untuk testing');
            return;
        }
        
        const siswaIdCorrect = siswaData[0].id;
        const jadwalPelajaranId = jadwalPelajaran[0].id_jadwal;
        
        console.log('📊 Using correct IDs:', { siswaIdCorrect, jadwalPelajaranId });
        
        // Create sample absensi_siswa
        console.log('\n➕ Creating sample absensi_siswa...');
        try {
            await db.execute(`
                INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan, created_at)
                VALUES (?, ?, CURDATE(), 'hadir', 'Sample data for testing', NOW())
            `, [siswaIdCorrect, jadwalPelajaranId]);
            console.log('✅ Sample absensi_siswa created');
        } catch (error) {
            console.log('❌ Error creating absensi_siswa:', error.message);
        }
        
        // Check if absensi_guru already exists for this jadwal
        const [existingGuru] = await db.execute(`
            SELECT COUNT(*) as count FROM absensi_guru 
            WHERE jadwal_id = ? AND tanggal = CURDATE()
        `, [jadwalId]);
        
        if (existingGuru[0].count === 0) {
            console.log('\n➕ Creating sample absensi_guru...');
            try {
                await db.execute(`
                    INSERT INTO absensi_guru (jadwal_id, guru_id, kelas_id, siswa_pencatat_id, tanggal, jam_ke, status, keterangan, waktu_catat, metode_absen)
                    VALUES (?, ?, ?, ?, CURDATE(), 1, 'Hadir', 'Sample data for testing', NOW(), 'manual')
                `, [jadwalId, guruId, kelasId, siswaId]);
                console.log('✅ Sample absensi_guru created');
            } catch (error) {
                console.log('❌ Error creating absensi_guru:', error.message);
            }
        } else {
            console.log('✅ Sample absensi_guru already exists');
        }
        
        // Verify data
        console.log('\n🔍 Verifying created data...');
        const [guruCount] = await db.execute('SELECT COUNT(*) as count FROM absensi_guru');
        const [siswaCount] = await db.execute('SELECT COUNT(*) as count FROM absensi_siswa');
        console.log('absensi_guru count:', guruCount[0].count);
        console.log('absensi_siswa count:', siswaCount[0].count);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (db) await db.end();
    }
}

createSampleAttendance();
