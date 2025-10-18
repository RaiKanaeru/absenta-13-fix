/**
 * Comprehensive Endpoint Testing Script
 * Tests all critical endpoints untuk verify sistem setelah update
 */

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(method, endpoint, data = null, token = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const result = await response.json();
        return {
            success: response.ok,
            status: response.status,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function runTests() {
    console.log('🧪 Starting Comprehensive Endpoint Tests...\n');
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // Test 1: Health Check
    console.log('📋 Test 1: Health Check');
    const healthResult = await testEndpoint('GET', '/api/health');
    if (healthResult.success) {
        console.log('✅ Health check passed');
        results.passed++;
    } else {
        console.log('❌ Health check failed:', healthResult.error || healthResult.data);
        results.failed++;
    }
    results.tests.push({ name: 'Health Check', ...healthResult });

    // Test 2: Login (Admin)
    console.log('\n📋 Test 2: Admin Login');
    const loginResult = await testEndpoint('POST', '/api/login', {
        username: 'admin',
        password: 'admin123'
    });
    
    let adminToken = null;
    if (loginResult.success && loginResult.data.token) {
        console.log('✅ Admin login passed');
        adminToken = loginResult.data.token;
        results.passed++;
    } else {
        console.log('❌ Admin login failed:', loginResult.error || loginResult.data);
        results.failed++;
    }
    results.tests.push({ name: 'Admin Login', ...loginResult });

    if (!adminToken) {
        console.log('\n❌ Cannot continue tests without admin token');
        return results;
    }

    // Test 3: Token Verification
    console.log('\n📋 Test 3: Token Verification');
    const verifyResult = await testEndpoint('GET', '/api/verify', null, adminToken);
    if (verifyResult.success) {
        console.log('✅ Token verification passed');
        results.passed++;
    } else {
        console.log('❌ Token verification failed:', verifyResult.error || verifyResult.data);
        results.failed++;
    }
    results.tests.push({ name: 'Token Verification', ...verifyResult });

    // Test 4: Get Admin Info
    console.log('\n📋 Test 4: Get Admin Info');
    const adminInfoResult = await testEndpoint('GET', '/api/admin/info', null, adminToken);
    if (adminInfoResult.success) {
        console.log('✅ Get admin info passed');
        console.log('   Admin:', adminInfoResult.data.nama);
        results.passed++;
    } else {
        console.log('❌ Get admin info failed:', adminInfoResult.error || adminInfoResult.data);
        results.failed++;
    }
    results.tests.push({ name: 'Get Admin Info', ...adminInfoResult });

    // Test 5: Get Subjects (untuk dropdown)
    console.log('\n📋 Test 5: Get Subjects (Dropdown)');
    const subjectsResult = await testEndpoint('GET', '/v1/subjects', null, adminToken);
    if (subjectsResult.success) {
        console.log('✅ Get subjects passed');
        console.log(`   Found ${subjectsResult.data.data?.length || 0} subjects`);
        results.passed++;
    } else {
        console.log('❌ Get subjects failed:', subjectsResult.error || subjectsResult.data);
        results.failed++;
    }
    results.tests.push({ name: 'Get Subjects', ...subjectsResult });

    // Test 6: Get Teachers (untuk dropdown)
    console.log('\n📋 Test 6: Get Teachers (Dropdown)');
    const teachersResult = await testEndpoint('GET', '/v1/teachers', null, adminToken);
    if (teachersResult.success) {
        console.log('✅ Get teachers passed');
        console.log(`   Found ${teachersResult.data.data?.length || 0} teachers`);
        results.passed++;
    } else {
        console.log('❌ Get teachers failed:', teachersResult.error || teachersResult.data);
        results.failed++;
    }
    results.tests.push({ name: 'Get Teachers', ...teachersResult });

    // Test 7: Get Classes (untuk dropdown)
    console.log('\n📋 Test 7: Get Classes (Dropdown)');
    const classesResult = await testEndpoint('GET', '/v1/classes', null, adminToken);
    if (classesResult.success) {
        console.log('✅ Get classes passed');
        console.log(`   Found ${classesResult.data.data?.length || 0} classes`);
        results.passed++;
    } else {
        console.log('❌ Get classes failed:', classesResult.error || classesResult.data);
        results.failed++;
    }
    results.tests.push({ name: 'Get Classes', ...classesResult });

    // Test 8: Get Guru List
    console.log('\n📋 Test 8: Get Guru List');
    const guruListResult = await testEndpoint('GET', '/api/admin/guru', null, adminToken);
    if (guruListResult.success) {
        console.log('✅ Get guru list passed');
        console.log(`   Found ${guruListResult.data.data?.length || 0} teachers`);
        results.passed++;
    } else {
        console.log('❌ Get guru list failed:', guruListResult.error || guruListResult.data);
        results.failed++;
    }
    results.tests.push({ name: 'Get Guru List', ...guruListResult });

    // Test 9: Get Siswa List
    console.log('\n📋 Test 9: Get Siswa List');
    const siswaListResult = await testEndpoint('GET', '/api/admin/siswa', null, adminToken);
    if (siswaListResult.success) {
        console.log('✅ Get siswa list passed');
        console.log(`   Found ${siswaListResult.data.data?.length || 0} students`);
        results.passed++;
    } else {
        console.log('❌ Get siswa list failed:', siswaListResult.error || siswaListResult.data);
        results.failed++;
    }
    results.tests.push({ name: 'Get Siswa List', ...siswaListResult });

    // Test 10: Check Pengajuan Izin Endpoints (should be removed)
    console.log('\n📋 Test 10: Verify Pengajuan Izin Removed');
    const izinResult = await testEndpoint('GET', '/api/student/pengajuan-izin-kelas', null, adminToken);
    if (izinResult.status === 404 || izinResult.error) {
        console.log('✅ Pengajuan izin endpoints removed (expected 404)');
        results.passed++;
    } else {
        console.log('⚠️  Warning: Pengajuan izin endpoints still exist!');
        results.failed++;
    }
    results.tests.push({ name: 'Verify Izin Removed', ...izinResult });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📋 Total: ${results.passed + results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);
    console.log('='.repeat(60));

    return results;
}

// Run tests
runTests().catch(console.error);


