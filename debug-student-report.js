#!/usr/bin/env node

/**
 * Script untuk debug student attendance report query
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    port: process.env.DB_PORT || 3306
};

async function debugStudentReport() {
    let db;
    try {
        db = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Database connected');
        
        const startDate = '2025-01-01';
        const endDate = '2025-12-31';
        
        // Test the exact query from the endpoint
        console.log('\n🔍 Testing student attendance report query...');
        try {
            const query = `
                SELECT 
                    DATE_FORMAT(a.tanggal, '%Y-%m-%d') as tanggal,
                    k.nama_kelas,
                    s.nama as nama_siswa,
                    s.nis as nis_siswa,
                    'Absensi Harian' as nama_mapel,
                    'Siswa Perwakilan' as nama_guru,
                    DATE_FORMAT(a.created_at, '%H:%i:%s') as waktu_absen,
                    '07:00' as jam_mulai,
                    '17:00' as jam_selesai,
                    COALESCE(a.status, 'Tidak Hadir') as status,
                    COALESCE(a.keterangan, '-') as keterangan
                FROM absensi_siswa a
                JOIN siswa s ON a.siswa_id = s.id
                JOIN kelas k ON s.kelas_id = k.id_kelas
                WHERE DATE(a.tanggal) BETWEEN ? AND ?
                ORDER BY a.created_at DESC, k.nama_kelas, s.nama
            `;
            
            const [results] = await db.execute(query, [startDate, endDate]);
            console.log('✅ Student attendance query successful');
            console.log('Results count:', results.length);
            results.forEach((row, index) => {
                console.log(`  ${index + 1}.`, row);
            });
        } catch (error) {
            console.log('❌ Student attendance query error:', error.message);
            console.log('Error code:', error.code);
            console.log('Error sqlState:', error.sqlState);
        }
        
        // Test individual table joins
        console.log('\n🔍 Testing individual table joins...');
        
        // Test absensi_siswa table
        try {
            const [absensi] = await db.execute('SELECT * FROM absensi_siswa LIMIT 3');
            console.log('absensi_siswa data:', absensi);
        } catch (error) {
            console.log('❌ absensi_siswa error:', error.message);
        }
        
        // Test siswa table
        try {
            const [siswa] = await db.execute('SELECT id, id_siswa, nama, kelas_id FROM siswa LIMIT 3');
            console.log('siswa data:', siswa);
        } catch (error) {
            console.log('❌ siswa error:', error.message);
        }
        
        // Test kelas table
        try {
            const [kelas] = await db.execute('SELECT id_kelas, nama_kelas FROM kelas LIMIT 3');
            console.log('kelas data:', kelas);
        } catch (error) {
            console.log('❌ kelas error:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (db) await db.end();
    }
}

debugStudentReport();
