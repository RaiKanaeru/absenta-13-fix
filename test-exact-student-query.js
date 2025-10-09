#!/usr/bin/env node

/**
 * Script untuk test query yang persis sama dengan endpoint student attendance
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    port: process.env.DB_PORT || 3306
};

async function testExactStudentQuery() {
    let db;
    try {
        db = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Database connected');
        
        const startDate = '2025-01-01';
        const endDate = '2025-12-31';
        const kelas_id = null; // No filter
        
        // Exact query from endpoint
        let query = `
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
        `;
        
        const params = [startDate, endDate];
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY a.created_at DESC, k.nama_kelas, s.nama';
        
        console.log('🔍 Executing exact query from endpoint...');
        console.log('Query:', query);
        console.log('Params:', params);
        
        const [rows] = await db.execute(query, params, { timeout: 30000 });
        console.log('✅ Query executed successfully');
        console.log('Results count:', rows.length);
        rows.forEach((row, index) => {
            console.log(`  ${index + 1}.`, row);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error code:', error.code);
        console.error('Error sqlState:', error.sqlState);
        console.error('Stack:', error.stack);
    } finally {
        if (db) await db.end();
    }
}

testExactStudentQuery();
