#!/usr/bin/env node

/**
 * Script untuk debug masalah login guru dan siswa
 */

import fetch from 'node-fetch';
import mysql from 'mysql2/promise';

const API_BASE = 'http://localhost:3001';
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    port: process.env.DB_PORT || 3306
};

let db;

async function connectDatabase() {
    try {
        db = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

async function checkUsers() {
    try {
        console.log('\n🔍 Checking users table...');
        const [users] = await db.execute('SELECT * FROM users LIMIT 10');
        console.log('Sample users:', users);
        
        console.log('\n🔍 Checking guru table...');
        const [guru] = await db.execute('SELECT * FROM guru LIMIT 5');
        console.log('Sample guru:', guru);
        
        console.log('\n🔍 Checking siswa table...');
        const [siswa] = await db.execute('SELECT * FROM siswa LIMIT 5');
        console.log('Sample siswa:', siswa);
        
        // Check for specific test users
        console.log('\n🔍 Looking for test users...');
        const [testUsers] = await db.execute(`
            SELECT u.*, g.nama as guru_nama, s.nama as siswa_nama
            FROM users u
            LEFT JOIN guru g ON u.id = g.user_id
            LEFT JOIN siswa s ON u.id = s.user_id
            WHERE u.username IN ('guru001', 'perwakilan2000', 'admin')
        `);
        console.log('Test users found:', testUsers);
        
    } catch (error) {
        console.error('❌ Error checking users:', error.message);
    }
}

async function testLogin(username, password) {
    try {
        console.log(`\n🔐 Testing login for: ${username}`);
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        console.log(`Response status: ${response.status}`);
        console.log(`Response data:`, data);
        
        return data;
    } catch (error) {
        console.error(`❌ Error testing login for ${username}:`, error.message);
        return null;
    }
}

async function debugLoginIssues() {
    console.log('🔍 Debugging login issues...\n');
    
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
        console.log('❌ Cannot proceed without database connection');
        return;
    }
    
    await checkUsers();
    
    // Test login with different credentials
    await testLogin('admin', 'admin123');
    await testLogin('guru001', 'admin123');
    await testLogin('perwakilan2000', 'admin123');
    
    // Try to find actual usernames
    console.log('\n🔍 Searching for actual usernames...');
    const [allUsers] = await db.execute('SELECT username, role FROM users ORDER BY role, username');
    console.log('All usernames by role:');
    allUsers.forEach(user => {
        console.log(`  ${user.role}: ${user.username}`);
    });
    
    // Test login with first few usernames
    console.log('\n🔐 Testing login with actual usernames...');
    for (const user of allUsers.slice(0, 5)) {
        await testLogin(user.username, 'admin123');
    }
    
    if (db) {
        await db.end();
    }
}

debugLoginIssues().catch(console.error);
