#!/usr/bin/env node

/**
 * Script untuk debug query laporan
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    port: process.env.DB_PORT || 3306
};

async function debugReportsQuery() {
    let db;
    try {
        db = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Database connected');
        
        const startDate = '2025-01-01';
        const endDate = '2025-12-31';
        
        // Test teacher attendance report query
        console.log('\n🔍 Testing teacher attendance report query...');
        try {
            const query = `
                SELECT 
                    DATE_FORMAT(ag.tanggal, '%Y-%m-%d') as tanggal,
                    k.nama_kelas,
                    g.nama as nama_guru,
                    g.nip as nip_guru,
                    m.nama_mapel,
                    CONCAT(j.jam_mulai, ' - ', j.jam_selesai) as jam_hadir,
                    j.jam_mulai,
                    j.jam_selesai,
                    COALESCE(ag.status, 'Tidak Ada Data') as status,
                    COALESCE(ag.keterangan, '-') as keterangan
                FROM jadwal j
                JOIN kelas k ON j.kelas_id = k.id_kelas
                JOIN guru g ON j.guru_id = g.id_guru
                JOIN mapel m ON j.mapel_id = m.id_mapel
                LEFT JOIN absensi_guru ag ON j.id_jadwal = ag.jadwal_id 
                    AND ag.tanggal BETWEEN ? AND ?
                WHERE j.status = 'aktif'
                ORDER BY ag.tanggal DESC, k.nama_kelas, g.nama
                LIMIT 10
            `;
            
            const [results] = await db.execute(query, [startDate, endDate]);
            console.log('✅ Teacher attendance query successful');
            console.log('Results count:', results.length);
            results.forEach((row, index) => {
                console.log(`  ${index + 1}.`, row);
            });
        } catch (error) {
            console.log('❌ Teacher attendance query error:', error.message);
        }
        
        // Test student attendance report query
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
                LIMIT 10
            `;
            
            const [results] = await db.execute(query, [startDate, endDate]);
            console.log('✅ Student attendance query successful');
            console.log('Results count:', results.length);
            results.forEach((row, index) => {
                console.log(`  ${index + 1}.`, row);
            });
        } catch (error) {
            console.log('❌ Student attendance query error:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (db) await db.end();
    }
}

debugReportsQuery();
