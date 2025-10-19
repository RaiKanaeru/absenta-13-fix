#!/usr/bin/env node

/**
 * Script untuk mengaudit semua endpoint di server_modern.js
 * Memverifikasi koneksi database dan memastikan tidak ada data dummy
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

// Test credentials
const TEST_CREDENTIALS = {
    admin: { username: 'admin', password: 'admin123' },
    guru: { username: 'guru001', password: 'admin123' },
    siswa: { username: 'perwakilan2000', password: 'admin123' }
};

let db;
let tokens = {};

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

async function login(role) {
    try {
        const credentials = TEST_CREDENTIALS[role];
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        if (data.success) {
            tokens[role] = data.data.token;
            console.log(`✅ Login berhasil untuk ${role}: ${credentials.username}`);
            return true;
        } else {
            console.log(`❌ Login gagal untuk ${role}: ${data.message}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error login ${role}:`, error.message);
        return false;
    }
}

async function testEndpoint(method, endpoint, role, expectedStatus = 200) {
    try {
        const token = tokens[role];
        if (!token) {
            console.log(`❌ No token for ${role} - skipping ${method} ${endpoint}`);
            return false;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        const status = response.status;
        
        if (status === expectedStatus) {
            console.log(`✅ ${method} ${endpoint} - Status: ${status} - Role: ${role}`);
            return { success: true, data, status };
        } else {
            console.log(`❌ ${method} ${endpoint} - Expected: ${expectedStatus}, Got: ${status} - Role: ${role}`);
            console.log(`   Error: ${data.message || 'Unknown error'}`);
            return { success: false, data, status };
        }
    } catch (error) {
        console.error(`❌ Error testing ${method} ${endpoint}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function verifyDatabaseData(table, description) {
    try {
        const [rows] = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        
        if (count > 0) {
            console.log(`✅ ${description}: ${count} records found`);
            
            // Check for dummy data patterns
            const [sampleRows] = await db.execute(`SELECT * FROM ${table} LIMIT 3`);
            const hasDummyData = sampleRows.some(row => 
                JSON.stringify(row).toLowerCase().includes('test') ||
                JSON.stringify(row).toLowerCase().includes('dummy') ||
                JSON.stringify(row).toLowerCase().includes('sample')
            );
            
            if (hasDummyData) {
                console.log(`⚠️  ${description}: Possible dummy data detected`);
            }
            
            return { success: true, count, hasDummyData };
        } else {
            console.log(`❌ ${description}: No data found`);
            return { success: false, count: 0 };
        }
    } catch (error) {
        console.error(`❌ Error checking ${table}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function auditEndpoints() {
    console.log('🔍 Starting comprehensive endpoint audit...\n');
    
    // Connect to database
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
        console.log('❌ Cannot proceed without database connection');
        return;
    }
    
    // Login for all roles
    console.log('\n🔐 Testing authentication...');
    await login('admin');
    await login('guru');
    await login('siswa');
    
    // Verify database tables have real data
    console.log('\n📊 Verifying database data...');
    await verifyDatabaseData('users', 'Users table');
    await verifyDatabaseData('guru', 'Guru table');
    await verifyDatabaseData('siswa', 'Siswa table');
    await verifyDatabaseData('mapel', 'Mapel table');
    await verifyDatabaseData('kelas', 'Kelas table');
    await verifyDatabaseData('jadwal', 'Jadwal table');
    
    // Test authentication endpoints
    console.log('\n🔐 Testing authentication endpoints...');
    await testEndpoint('POST', '/api/login', 'admin', 200);
    await testEndpoint('GET', '/api/verify', 'admin', 200);
    await testEndpoint('GET', '/api/verify-token', 'admin', 200);
    
    // Test admin endpoints
    console.log('\n👑 Testing admin endpoints...');
    await testEndpoint('GET', '/api/admin/info', 'admin', 200);
    await testEndpoint('GET', '/api/dashboard/stats', 'admin', 200);
    await testEndpoint('GET', '/api/dashboard/chart', 'admin', 200);
    
    // Test CRUD endpoints for students
    console.log('\n👥 Testing student management endpoints...');
    await testEndpoint('GET', '/api/admin/siswa', 'admin', 200);
    await testEndpoint('GET', '/api/admin/siswa-perwakilan', 'admin', 200);
    await testEndpoint('POST', '/api/admin/siswa', 'admin', 200);
    await testEndpoint('POST', '/api/admin/siswa-perwakilan', 'admin', 200);
    
    // Test CRUD endpoints for teachers
    console.log('\n👨‍🏫 Testing teacher management endpoints...');
    await testEndpoint('GET', '/api/admin/guru', 'admin', 200);
    await testEndpoint('POST', '/api/admin/guru', 'admin', 200);
    
    // Test CRUD endpoints for subjects
    console.log('\n📚 Testing subject management endpoints...');
    await testEndpoint('GET', '/api/admin/mapel', 'admin', 200);
    await testEndpoint('POST', '/api/admin/mapel', 'admin', 200);
    
    // Test CRUD endpoints for classes
    console.log('\n🏫 Testing class management endpoints...');
    await testEndpoint('GET', '/api/kelas', 'admin', 200);
    await testEndpoint('GET', '/api/admin/kelas', 'admin', 200);
    await testEndpoint('POST', '/api/admin/kelas', 'admin', 200);
    
    // Test schedule endpoints
    console.log('\n📅 Testing schedule endpoints...');
    await testEndpoint('GET', '/api/admin/jadwal', 'admin', 200);
    await testEndpoint('POST', '/api/admin/jadwal', 'admin', 200);
    await testEndpoint('GET', '/api/admin/jadwal/conflicts', 'admin', 200);
    await testEndpoint('GET', '/api/admin/jadwal/export', 'admin', 200);
    
    // Test attendance endpoints
    console.log('\n📊 Testing attendance endpoints...');
    await testEndpoint('GET', '/api/schedule/1/students', 'guru', 200);
    await testEndpoint('POST', '/api/attendance/submit', 'guru', 200);
    
    // Test analytics endpoints
    console.log('\n📈 Testing analytics endpoints...');
    await testEndpoint('GET', '/api/admin/analytics', 'admin', 200);
    await testEndpoint('GET', '/api/admin/live-teacher-attendance', 'admin', 200);
    await testEndpoint('GET', '/api/admin/live-student-attendance', 'admin', 200);
    
    // Test report endpoints
    console.log('\n📋 Testing report endpoints...');
    await testEndpoint('GET', '/api/admin/teacher-attendance-report', 'admin', 200);
    await testEndpoint('GET', '/api/admin/student-attendance-report', 'admin', 200);
    await testEndpoint('GET', '/api/admin/download-teacher-attendance', 'admin', 200);
    await testEndpoint('GET', '/api/admin/download-student-attendance', 'admin', 200);
    
    console.log('\n✅ Endpoint audit completed!');
    
    // Close database connection
    if (db) {
        await db.end();
    }
}

// Run the audit
auditEndpoints().catch(console.error);
