#!/usr/bin/env node

/**
 * Script untuk test endpoint laporan secara langsung
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

async function testTeacherReport(token) {
    try {
        console.log('\n🔍 Testing teacher attendance report...');
        const response = await fetch(`${API_BASE}/api/admin/teacher-attendance-report?startDate=2025-01-01&endDate=2025-12-31`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
        
        const text = await response.text();
        console.log(`Raw response:`, text.substring(0, 500) + '...');
        
        try {
            const data = JSON.parse(text);
            console.log(`Parsed data type:`, typeof data);
            if (Array.isArray(data)) {
                console.log(`Array length:`, data.length);
                if (data.length > 0) {
                    console.log(`First item:`, data[0]);
                }
            } else {
                console.log(`Data:`, data);
            }
        } catch (parseError) {
            console.log('❌ JSON parse error:', parseError.message);
        }
        
    } catch (error) {
        console.error('❌ Error testing teacher report:', error.message);
    }
}

async function testStudentReport(token) {
    try {
        console.log('\n🔍 Testing student attendance report...');
        const response = await fetch(`${API_BASE}/api/admin/student-attendance-report?startDate=2025-01-01&endDate=2025-12-31`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
        
        const text = await response.text();
        console.log(`Raw response:`, text.substring(0, 500) + '...');
        
        try {
            const data = JSON.parse(text);
            console.log(`Parsed data type:`, typeof data);
            if (Array.isArray(data)) {
                console.log(`Array length:`, data.length);
                if (data.length > 0) {
                    console.log(`First item:`, data[0]);
                }
            } else {
                console.log(`Data:`, data);
            }
        } catch (parseError) {
            console.log('❌ JSON parse error:', parseError.message);
        }
        
    } catch (error) {
        console.error('❌ Error testing student report:', error.message);
    }
}

async function main() {
    console.log('🔍 Testing reports endpoints directly...');
    
    const token = await login();
    if (!token) {
        console.log('❌ Tidak dapat login, menghentikan test');
        return;
    }

    await testTeacherReport(token);
    await testStudentReport(token);
}

main().catch(console.error);
