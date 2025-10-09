#!/usr/bin/env node

/**
 * Script untuk menguji endpoint POST guru
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

async function testGuruEndpoint(token) {
    try {
        const guruData = {
            nip: '12345678901234567890',
            nama: 'Test Guru Baru',
            username: 'testguru123',
            password: 'password123',
            mapel_id: 1,
            no_telp: '08123456789',
            alamat: 'Jl. Test No. 123',
            email: 'testguru@example.com',
            jenis_kelamin: 'L'
        };

        console.log('🔍 Testing POST /api/admin/guru with data:', guruData);

        const response = await fetch(`${API_BASE}/api/admin/guru`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(guruData)
        });

        const data = await response.json();
        console.log(`Response status: ${response.status}`);
        console.log('Response data:', data);

        if (response.status === 200) {
            console.log('✅ POST guru endpoint berhasil');
        } else {
            console.log('❌ POST guru endpoint gagal');
        }

    } catch (error) {
        console.error('❌ Error testing guru endpoint:', error.message);
    }
}

async function testJadwalEndpoint(token) {
    try {
        const jadwalData = {
            kelas_id: 1,
            mapel_id: 1,
            guru_id: 1,
            ruang_id: 1,
            hari: 'Senin',
            jam_ke: 1,
            jam_mulai: '07:00:00',
            jam_selesai: '08:00:00'
        };

        console.log('\n🔍 Testing POST /api/admin/jadwal with data:', jadwalData);

        const response = await fetch(`${API_BASE}/api/admin/jadwal`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jadwalData)
        });

        const data = await response.json();
        console.log(`Response status: ${response.status}`);
        console.log('Response data:', data);

        if (response.status === 200) {
            console.log('✅ POST jadwal endpoint berhasil');
        } else {
            console.log('❌ POST jadwal endpoint gagal');
        }

    } catch (error) {
        console.error('❌ Error testing jadwal endpoint:', error.message);
    }
}

async function testReportEndpoints(token) {
    const reportEndpoints = [
        '/api/admin/teacher-attendance-report',
        '/api/admin/student-attendance-report',
        '/api/admin/download-teacher-attendance',
        '/api/admin/download-student-attendance'
    ];

    for (const endpoint of reportEndpoints) {
        try {
            console.log(`\n🔍 Testing GET ${endpoint}`);

            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log(`Response status: ${response.status}`);
            console.log('Response data:', data);

            if (response.status === 200) {
                console.log(`✅ ${endpoint} berhasil`);
            } else {
                console.log(`❌ ${endpoint} gagal`);
            }

        } catch (error) {
            console.error(`❌ Error testing ${endpoint}:`, error.message);
        }
    }
}

async function main() {
    console.log('🔍 Testing problematic endpoints...\n');
    
    const token = await login();
    if (!token) {
        console.log('❌ Cannot proceed without token');
        return;
    }

    await testGuruEndpoint(token);
    await testJadwalEndpoint(token);
    await testReportEndpoints(token);
}

main().catch(console.error);
