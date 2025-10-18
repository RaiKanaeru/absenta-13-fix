// Script untuk cek kredensial siswa yang ada di database
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function checkStudentCredentials() {
    console.log('🔍 Checking available student credentials...');
    
    try {
        // Login sebagai admin untuk cek data siswa
        console.log('\n1. Logging in as admin...');
        const loginResponse = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('✅ Admin login successful');
        
        if (!loginData.success || !loginData.token) {
            throw new Error('Admin login failed');
        }
        
        const token = loginData.token;
        
        // Cek data siswa
        console.log('\n2. Checking student data...');
        const siswaResponse = await fetch(`${API_BASE}/api/admin/siswa?limit=5`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const siswaData = await siswaResponse.json();
        console.log('📊 Siswa data status:', siswaResponse.status);
        
        if (siswaResponse.status === 200 && siswaData.success) {
            console.log('📋 Available students:');
            siswaData.data.forEach((siswa, index) => {
                console.log(`${index + 1}. ${siswa.nama} (NIS: ${siswa.nis})`);
            });
        } else {
            console.log('❌ Failed to get student data');
        }
        
        // Cek users table untuk siswa
        console.log('\n3. Checking users with role siswa...');
        const usersResponse = await fetch(`${API_BASE}/api/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const usersData = await usersResponse.json();
        console.log('📊 Users data status:', usersResponse.status);
        
        if (usersResponse.status === 200 && usersData.success) {
            console.log('📋 Available users with role siswa:');
            usersData.data.filter(user => user.role === 'siswa').forEach((user, index) => {
                console.log(`${index + 1}. ${user.username} (${user.nama}) - Role: ${user.role}`);
            });
        } else {
            console.log('❌ Failed to get users data');
        }
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    }
}

checkStudentCredentials();
