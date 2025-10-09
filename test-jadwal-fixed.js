#!/usr/bin/env node

/**
 * Script untuk menguji endpoint jadwal yang sudah diperbaiki
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

async function testJadwalEndpoint(token) {
    try {
        const jadwalData = {
            kelas_id: 353,
            mapel_id: 1,
            guru_id: 2,
            ruang_id: 189,
            hari: 'Senin',
            jam_mulai: '09:00:00',
            jam_selesai: '10:30:00'
        };

        console.log('🔍 Testing POST /api/admin/jadwal with data:', jadwalData);
        
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
        console.log(`Response data:`, JSON.stringify(data, null, 2));
        
        if (response.status === 200 && data.message) {
            console.log('✅ POST jadwal endpoint berhasil');
        } else {
            console.log('❌ POST jadwal endpoint gagal');
        }
    } catch (error) {
        console.error('❌ Error testing jadwal endpoint:', error.message);
    }
}

async function main() {
    console.log('🔍 Testing fixed jadwal endpoint...');
    
    const token = await login();
    if (!token) {
        console.log('❌ Tidak dapat login, menghentikan test');
        return;
    }

    await testJadwalEndpoint(token);
}

main().catch(console.error);
