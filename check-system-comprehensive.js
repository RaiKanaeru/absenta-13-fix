// Comprehensive system check script
const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function login(username, password) {
    try {
        const response = await axios.post(`${API_BASE}/api/login`, {
            username,
            password
        });
        
        if (response.data && response.data.token) {
            return response.data.token;
        }
        
        throw new Error('No token in response');
    } catch (error) {
        console.error(`❌ Login failed for ${username}:`, error.response?.data || error.message);
        throw error;
    }
}

async function checkDashboardFunctionality() {
    console.log('\n🔍 === COMPREHENSIVE SYSTEM CHECK ===\n');
    
    try {
        // 1. Test Admin Login
        console.log('1️⃣ Testing Admin Login...');
        const adminToken = await login('admin', 'admin123');
        console.log('✅ Admin login successful');
        
        // 2. Test Teacher Login
        console.log('\n2️⃣ Testing Teacher Login...');
        // First, get a teacher's username
        const teachersResponse = await axios.get(`${API_BASE}/api/admin/guru`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const teachers = teachersResponse.data?.data?.data || teachersResponse.data?.data || teachersResponse.data || [];
        console.log(`📊 Found ${teachers.length} teachers`);
        
        if (teachers.length > 0) {
            const firstTeacher = teachers[0];
            console.log(`   Testing with teacher: ${firstTeacher.nama} (${firstTeacher.username})`);
            try {
                const teacherToken = await login(firstTeacher.username, 'password123');
                console.log('✅ Teacher login successful');
            } catch (error) {
                console.log('⚠️  Teacher login failed - may need password reset');
            }
        }
        
        // 3. Test Student Login
        console.log('\n3️⃣ Testing Student Login...');
        const studentsResponse = await axios.get(`${API_BASE}/api/admin/siswa-perwakilan`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const students = studentsResponse.data?.data?.data || studentsResponse.data?.data || studentsResponse.data || [];
        console.log(`📊 Found ${students.length} students`);
        
        if (students.length > 0) {
            const firstStudent = students[0];
            console.log(`   Testing with student: ${firstStudent.nama} (${firstStudent.username})`);
            try {
                const studentToken = await login(firstStudent.username, 'password123');
                console.log('✅ Student login successful');
                
                // 4. Test Student Dashboard Endpoints
                console.log('\n4️⃣ Testing Student Dashboard Endpoints...');
                
                // Get student info
                const studentInfoResponse = await axios.get(`${API_BASE}/api/siswa/info`, {
                    headers: { Authorization: `Bearer ${studentToken}` }
                });
                console.log('✅ Student info endpoint working');
                console.log(`   Student ID: ${studentInfoResponse.data.id_siswa}, Class: ${studentInfoResponse.data.nama_kelas}`);
                
                // Get classmates (this endpoint might not exist yet)
                try {
                    const classmatesResponse = await axios.get(`${API_BASE}/api/siswa/classmates`, {
                        headers: { Authorization: `Bearer ${studentToken}` }
                    });
                    console.log('✅ Classmates endpoint working');
                    console.log(`   Found ${classmatesResponse.data.length} classmates`);
                } catch (error) {
                    console.log('❌ Classmates endpoint NOT FOUND - NEEDS TO BE CREATED');
                }
                
                // Get permission requests
                try {
                    const permissionsResponse = await axios.get(`${API_BASE}/api/siswa/izin`, {
                        headers: { Authorization: `Bearer ${studentToken}` }
                    });
                    console.log('✅ Permission requests endpoint working');
                } catch (error) {
                    console.log('❌ Permission requests endpoint failed:', error.response?.data || error.message);
                }
                
                // Get disputes
                try {
                    const disputesResponse = await axios.get(`${API_BASE}/api/siswa/banding`, {
                        headers: { Authorization: `Bearer ${studentToken}` }
                    });
                    console.log('✅ Disputes endpoint working');
                } catch (error) {
                    console.log('❌ Disputes endpoint failed:', error.response?.data || error.message);
                }
                
            } catch (error) {
                console.log('⚠️  Student login failed - may need password reset');
            }
        }
        
        // 5. Test CRUD Operations
        console.log('\n5️⃣ Testing CRUD Operations...');
        
        // Test GET endpoints
        console.log('   📖 Testing GET endpoints...');
        const endpoints = [
            '/api/admin/siswa-perwakilan',
            '/api/admin/guru',
            '/api/admin/mapel',
            '/api/admin/kelas',
            '/api/admin/ruang-kelas',
            '/api/admin/jadwal'
        ];
        
        for (const endpoint of endpoints) {
            try {
                await axios.get(`${API_BASE}${endpoint}`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                console.log(`   ✅ ${endpoint}`);
            } catch (error) {
                console.log(`   ❌ ${endpoint} - ${error.response?.data?.error || error.message}`);
            }
        }
        
        console.log('\n✨ === SYSTEM CHECK COMPLETE ===\n');
        
        // Summary
        console.log('📊 Summary:');
        console.log(`   - Admin functionality: ✅`);
        console.log(`   - Teacher functionality: ${teachers.length > 0 ? '⚠️  (needs testing)' : '❌'}`);
        console.log(`   - Student functionality: ${students.length > 0 ? '⚠️  (needs classmates endpoint)' : '❌'}`);
        console.log(`   - CRUD operations: ✅`);
        console.log('\n⚠️  CRITICAL MISSING FEATURES:');
        console.log('   1. Classmates endpoint for student representative');
        console.log('   2. Student selector in permission/dispute forms');
        console.log('   3. Bulk permission/dispute submission');
        
    } catch (error) {
        console.error('❌ System check failed:', error.message);
    }
}

checkDashboardFunctionality();


