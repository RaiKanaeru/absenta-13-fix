#!/usr/bin/env node

/**
 * Script untuk memeriksa struktur tabel absensi
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    port: process.env.DB_PORT || 3306
};

async function checkAttendanceStructure() {
    let db;
    try {
        db = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Database connected');
        
        // Check absensi_guru structure
        console.log('\n🔍 absensi_guru table structure:');
        const [guruColumns] = await db.execute('DESCRIBE absensi_guru');
        guruColumns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Check absensi_siswa structure
        console.log('\n🔍 absensi_siswa table structure:');
        const [siswaColumns] = await db.execute('DESCRIBE absensi_siswa');
        siswaColumns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Check sample data
        console.log('\n🔍 Sample absensi_guru data:');
        const [guruData] = await db.execute('SELECT * FROM absensi_guru LIMIT 3');
        guruData.forEach(row => {
            console.log('  ', row);
        });
        
        // Check sample data
        console.log('\n🔍 Sample absensi_siswa data:');
        const [siswaData] = await db.execute('SELECT * FROM absensi_siswa LIMIT 3');
        console.log('Count:', siswaData.length);
        siswaData.forEach(row => {
            console.log('  ', row);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (db) await db.end();
    }
}

checkAttendanceStructure();
