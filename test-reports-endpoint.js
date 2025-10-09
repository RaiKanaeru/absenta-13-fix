#!/usr/bin/env node

/**
 * Script untuk menguji endpoint laporan dengan parameter yang benar
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

async function testReportsEndpoints(token) {
    const baseUrl = `${API_BASE}/api/admin`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Test data
    const startDate = '2025-01-01';
    const endDate = '2025-12-31';

    console.log('\n🔍 Testing reports endpoints with proper parameters...');

    // Test teacher attendance report
    try {
        console.log(`\n📊 Testing GET ${baseUrl}/teacher-attendance-report?startDate=${startDate}&endDate=${endDate}`);
        const response = await fetch(`${baseUrl}/teacher-attendance-report?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET',
            headers
        });
        
        const data = await response.json();
        console.log(`Response status: ${response.status}`);
        console.log(`Response data:`, JSON.stringify(data, null, 2));
        
        if (response.status === 200) {
            console.log('✅ Teacher attendance report endpoint berhasil');
        } else {
            console.log('❌ Teacher attendance report endpoint gagal');
        }
    } catch (error) {
        console.error('❌ Error testing teacher attendance report:', error.message);
    }

    // Test student attendance report
    try {
        console.log(`\n📊 Testing GET ${baseUrl}/student-attendance-report?startDate=${startDate}&endDate=${endDate}`);
        const response = await fetch(`${baseUrl}/student-attendance-report?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET',
            headers
        });
        
        const data = await response.json();
        console.log(`Response status: ${response.status}`);
        console.log(`Response data:`, JSON.stringify(data, null, 2));
        
        if (response.status === 200) {
            console.log('✅ Student attendance report endpoint berhasil');
        } else {
            console.log('❌ Student attendance report endpoint gagal');
        }
    } catch (error) {
        console.error('❌ Error testing student attendance report:', error.message);
    }

    // Test download teacher attendance
    try {
        console.log(`\n📊 Testing GET ${baseUrl}/download-teacher-attendance?startDate=${startDate}&endDate=${endDate}`);
        const response = await fetch(`${baseUrl}/download-teacher-attendance?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET',
            headers
        });
        
        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, response.headers.get('content-type'));
        
        if (response.status === 200) {
            console.log('✅ Download teacher attendance endpoint berhasil');
        } else {
            const data = await response.json();
            console.log('❌ Download teacher attendance endpoint gagal:', data);
        }
    } catch (error) {
        console.error('❌ Error testing download teacher attendance:', error.message);
    }

    // Test download student attendance
    try {
        console.log(`\n📊 Testing GET ${baseUrl}/download-student-attendance?startDate=${startDate}&endDate=${endDate}`);
        const response = await fetch(`${baseUrl}/download-student-attendance?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET',
            headers
        });
        
        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, response.headers.get('content-type'));
        
        if (response.status === 200) {
            console.log('✅ Download student attendance endpoint berhasil');
        } else {
            const data = await response.json();
            console.log('❌ Download student attendance endpoint gagal:', data);
        }
    } catch (error) {
        console.error('❌ Error testing download student attendance:', error.message);
    }
}

async function main() {
    console.log('🔍 Testing reports endpoints...');
    
    const token = await login();
    if (!token) {
        console.log('❌ Tidak dapat login, menghentikan test');
        return;
    }

    await testReportsEndpoints(token);
}

main().catch(console.error);
