#!/usr/bin/env node

/**
 * Script untuk memeriksa tabel absensi
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    port: process.env.DB_PORT || 3306
};

async function checkAttendanceTables() {
    let db;
    try {
        db = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Database connected');
        
        // Check if absensi_guru table exists
        console.log('\n🔍 Checking absensi_guru table...');
        try {
            const [guruAbsensi] = await db.execute('SELECT COUNT(*) as count FROM absensi_guru');
            console.log('absensi_guru count:', guruAbsensi[0].count);
        } catch (error) {
            console.log('❌ absensi_guru table error:', error.message);
        }
        
        // Check if absensi_siswa table exists
        console.log('\n🔍 Checking absensi_siswa table...');
        try {
            const [siswaAbsensi] = await db.execute('SELECT COUNT(*) as count FROM absensi_siswa');
            console.log('absensi_siswa count:', siswaAbsensi[0].count);
        } catch (error) {
            console.log('❌ absensi_siswa table error:', error.message);
        }
        
        // List all tables
        console.log('\n🔍 All tables in database:');
        const [tables] = await db.execute('SHOW TABLES');
        tables.forEach(table => {
            console.log('  -', Object.values(table)[0]);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (db) await db.end();
    }
}

checkAttendanceTables();
