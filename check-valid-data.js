#!/usr/bin/env node

/**
 * Script untuk memeriksa data valid yang ada di database
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    port: process.env.DB_PORT || 3306
};

async function checkValidData() {
    let db;
    try {
        db = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Database connected');
        
        // Check kelas data
        console.log('\n🔍 Checking kelas data...');
        const [kelas] = await db.execute('SELECT id_kelas, nama_kelas FROM kelas LIMIT 5');
        console.log('Sample kelas:', kelas);
        
        // Check mapel data
        console.log('\n🔍 Checking mapel data...');
        const [mapel] = await db.execute('SELECT id_mapel, nama_mapel FROM mapel LIMIT 5');
        console.log('Sample mapel:', mapel);
        
        // Check guru data
        console.log('\n🔍 Checking guru data...');
        const [guru] = await db.execute('SELECT id_guru, nama FROM guru LIMIT 5');
        console.log('Sample guru:', guru);
        
        // Check ruang data
        console.log('\n🔍 Checking ruang_kelas data...');
        const [ruang] = await db.execute('SELECT id, nama_ruang FROM ruang_kelas LIMIT 5');
        console.log('Sample ruang:', ruang);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (db) await db.end();
    }
}

checkValidData();
