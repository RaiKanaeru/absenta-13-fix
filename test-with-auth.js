// Script untuk test endpoint dengan authentication
import 'dotenv/config';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Login credentials
const loginData = {
    username: 'admin',
    password: 'admin123'
};

async function login() {
    try {
        console.log('🔐 Logging in...');
        const response = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        console.log('📊 Login response:', result);
        
        if (result.success && result.data && result.data.token) {
            return result.data.token;
        } else {
            throw new Error('Login failed: ' + JSON.stringify(result));
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return null;
    }
}

async function testEndpoint(method, url, data = null, token = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        console.log(`🧪 Testing ${method} ${url}`);
        const response = await fetch(`${BASE_URL}${url}`, options);
        const result = await response.json();
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`📊 Response:`, JSON.stringify(result, null, 2));
        
        return { success: response.ok, data: result, status: response.status };
    } catch (error) {
        console.error(`❌ Error testing ${method} ${url}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Starting authenticated endpoint tests...\n');
    
    // Login first
    const token = await login();
    if (!token) {
        console.log('❌ Cannot proceed without authentication token');
        return;
    }
    
    console.log('✅ Authentication successful\n');
    
    // Test data
    const testMapel = {
        kode_mapel: 'TEST',
        nama_mapel: 'Mata Pelajaran Test',
        deskripsi: 'Deskripsi test mata pelajaran',
        status: 'aktif'
    };
    
    // Test 1: Get mata pelajaran
    console.log('=== TEST 1: GET Mata Pelajaran ===');
    const mapelResult = await testEndpoint('GET', '/api/admin/mapel', null, token);
    
    // Test 2: Add mata pelajaran
    console.log('\n=== TEST 2: POST Mata Pelajaran ===');
    const addMapelResult = await testEndpoint('POST', '/api/admin/mapel', testMapel, token);
    
    // Test 3: Get mata pelajaran again
    console.log('\n=== TEST 3: GET Mata Pelajaran (after add) ===');
    const mapelResult2 = await testEndpoint('GET', '/api/admin/mapel', null, token);
    
    // Test 4: Get siswa perwakilan
    console.log('\n=== TEST 4: GET Siswa Perwakilan ===');
    const siswaResult = await testEndpoint('GET', '/api/admin/siswa-perwakilan', null, token);
    
    // Summary
    console.log('\n📋 TEST SUMMARY:');
    console.log(`✅ Mata Pelajaran GET: ${mapelResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Mata Pelajaran POST: ${addMapelResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Siswa Perwakilan GET: ${siswaResult.success ? 'PASS' : 'FAIL'}`);
    
    if (mapelResult.success && mapelResult.data && mapelResult.data.data) {
        console.log(`📊 Mata Pelajaran count: ${mapelResult.data.data.length}`);
    }
    
    if (siswaResult.success && siswaResult.data && siswaResult.data.data) {
        console.log(`📊 Siswa Perwakilan count: ${siswaResult.data.data.length}`);
    }
}

runTests().catch(console.error);
