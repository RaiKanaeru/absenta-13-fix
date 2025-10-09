#!/usr/bin/env node

/**
 * Script final untuk menguji semua endpoint yang sudah diperbaiki
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function login() {
    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Login berhasil');
            return data.data.token;
        } else {
            console.log('❌ Login gagal:', data.message);
            return null;
        }
    } catch (error) {
        console.error('❌ Error login:', error.message);
        return null;
    }
}

async function testEndpoint(method, url, token, body = null, expectedStatus = 200) {
    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        const status = response.status === expectedStatus ? '✅' : '❌';
        console.log(`${status} ${method} ${url} - Status: ${response.status} (Expected: ${expectedStatus})`);
        
        if (response.status !== expectedStatus) {
            console.log(`   Error:`, data);
        }
        
        return response.status === expectedStatus;
    } catch (error) {
        console.log(`❌ ${method} ${url} - Error:`, error.message);
        return false;
    }
}

async function runComprehensiveTest() {
    console.log('🔍 Running comprehensive endpoint test...\n');
    
    const token = await login();
    if (!token) {
        console.log('❌ Tidak dapat login, menghentikan test');
        return;
    }

    let passed = 0;
    let total = 0;

    // Test Authentication & User Management
    console.log('📋 Testing Authentication & User Management...');
    total += 2;
    if (await testEndpoint('GET', `${API_BASE}/api/admin/siswa-perwakilan`, token)) passed++;
    if (await testEndpoint('GET', `${API_BASE}/api/admin/guru`, token)) passed++;

    // Test CRUD Operations
    console.log('\n📋 Testing CRUD Operations...');
    total += 4;
    if (await testEndpoint('GET', `${API_BASE}/api/admin/mapel`, token)) passed++;
    if (await testEndpoint('GET', `${API_BASE}/api/admin/kelas`, token)) passed++;
    if (await testEndpoint('GET', `${API_BASE}/api/admin/ruang-kelas`, token)) passed++;
    if (await testEndpoint('GET', `${API_BASE}/api/admin/jadwal`, token)) passed++;

    // Test Schedule Creation (POST)
    console.log('\n📋 Testing Schedule Creation...');
    total += 1;
    const jadwalData = {
        kelas_id: 353,
        mapel_id: 1,
        guru_id: 2,
        ruang_id: 189,
        hari: 'Selasa',
        jam_mulai: '10:00:00',
        jam_selesai: '11:30:00'
    };
    if (await testEndpoint('POST', `${API_BASE}/api/admin/jadwal`, token, jadwalData)) passed++;

    // Test Reports
    console.log('\n📋 Testing Reports...');
    total += 4;
    if (await testEndpoint('GET', `${API_BASE}/api/admin/teacher-attendance-report?startDate=2025-01-01&endDate=2025-12-31`, token)) passed++;
    if (await testEndpoint('GET', `${API_BASE}/api/admin/student-attendance-report?startDate=2025-01-01&endDate=2025-12-31`, token)) passed++;
    if (await testEndpoint('GET', `${API_BASE}/api/admin/download-teacher-attendance?startDate=2025-01-01&endDate=2025-12-31`, token)) passed++;
    if (await testEndpoint('GET', `${API_BASE}/api/admin/download-student-attendance?startDate=2025-01-01&endDate=2025-12-31`, token)) passed++;

    // Test Saturday Holiday (should fail)
    console.log('\n📋 Testing Saturday Holiday (should fail)...');
    total += 1;
    const saturdayJadwal = {
        kelas_id: 353,
        mapel_id: 1,
        guru_id: 2,
        ruang_id: 189,
        hari: 'Sabtu',
        jam_mulai: '10:00:00',
        jam_selesai: '11:30:00'
    };
    if (await testEndpoint('POST', `${API_BASE}/api/admin/jadwal`, token, saturdayJadwal, 400)) passed++;

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
    
    if (passed === total) {
        console.log('🎉 All endpoints are working correctly!');
    } else {
        console.log('⚠️  Some endpoints need attention');
    }
}

runComprehensiveTest().catch(console.error);
