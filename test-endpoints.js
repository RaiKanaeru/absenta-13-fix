// Script untuk test endpoint yang sudah diperbaiki
import 'dotenv/config';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test data
const testMapel = {
    kode_mapel: 'TEST',
    nama_mapel: 'Mata Pelajaran Test',
    deskripsi: 'Deskripsi test mata pelajaran',
    status: 'aktif'
};

const testSiswa = {
    username: 'test_siswa',
    nis: '87654321',
    nama: 'Siswa Test',
    kelas_id: 353, // X AK 1
    jabatan: 'Anggota Kelas',
    jenis_kelamin: 'P',
    email: 'test_siswa@smkn13bandung.sch.id',
    alamat: 'Alamat test',
    telepon_orangtua: '08123456789',
    telepon_siswa: '08123456788',
    status: 'aktif'
};

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
    console.log('🚀 Starting endpoint tests...\n');
    
    // Test 1: Get mata pelajaran
    console.log('=== TEST 1: GET Mata Pelajaran ===');
    const mapelResult = await testEndpoint('GET', '/api/admin/mapel');
    
    // Test 2: Add mata pelajaran
    console.log('\n=== TEST 2: POST Mata Pelajaran ===');
    const addMapelResult = await testEndpoint('POST', '/api/admin/mapel', testMapel);
    
    // Test 3: Get mata pelajaran again
    console.log('\n=== TEST 3: GET Mata Pelajaran (after add) ===');
    const mapelResult2 = await testEndpoint('GET', '/api/admin/mapel');
    
    // Test 4: Get siswa perwakilan
    console.log('\n=== TEST 4: GET Siswa Perwakilan ===');
    const siswaResult = await testEndpoint('GET', '/api/admin/siswa-perwakilan');
    
    // Test 5: Add siswa perwakilan
    console.log('\n=== TEST 5: POST Siswa Perwakilan ===');
    const addSiswaResult = await testEndpoint('POST', '/api/admin/siswa-perwakilan', testSiswa);
    
    // Test 6: Get siswa perwakilan again
    console.log('\n=== TEST 6: GET Siswa Perwakilan (after add) ===');
    const siswaResult2 = await testEndpoint('GET', '/api/admin/siswa-perwakilan');
    
    // Summary
    console.log('\n📋 TEST SUMMARY:');
    console.log(`✅ Mata Pelajaran GET: ${mapelResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Mata Pelajaran POST: ${addMapelResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Siswa Perwakilan GET: ${siswaResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Siswa Perwakilan POST: ${addSiswaResult.success ? 'PASS' : 'FAIL'}`);
    
    if (mapelResult.success && mapelResult.data && mapelResult.data.data) {
        console.log(`📊 Mata Pelajaran count: ${mapelResult.data.data.length}`);
    }
    
    if (siswaResult.success && siswaResult.data && siswaResult.data.data) {
        console.log(`📊 Siswa Perwakilan count: ${siswaResult.data.data.length}`);
    }
}

runTests().catch(console.error);

