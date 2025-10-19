const fetch = require('node-fetch');

// Test data untuk endpoint submit-kehadiran-guru
const testData = {
    // Test 1: Normal mode (today's date)
    normal: {
        siswa_id: 1,
        kehadiran_data: {
            "1": {
                status: "Hadir",
                keterangan: "Tepat waktu"
            },
            "2": {
                status: "Tidak Hadir", 
                keterangan: "Sakit"
            }
        }
    },
    
    // Test 2: Edit mode (with tanggal_absen)
    edit: {
        siswa_id: 1,
        kehadiran_data: {
            "1": {
                status: "Hadir",
                keterangan: "Edit: Tepat waktu"
            }
        },
        tanggal_absen: "2025-01-19"
    },
    
    // Test 3: Invalid jadwal_id
    invalid: {
        siswa_id: 1,
        kehadiran_data: {
            "99999": {
                status: "Hadir",
                keterangan: "Invalid jadwal"
            }
        }
    }
};

async function testEndpoint(testName, data, token) {
    console.log(`\n🧪 Testing ${testName}...`);
    console.log('📤 Request data:', JSON.stringify(data, null, 2));
    
    try {
        const response = await fetch('http://localhost:3001/api/siswa/submit-kehadiran-guru', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        console.log(`📊 Response status: ${response.status}`);
        console.log('📥 Response data:', JSON.stringify(result, null, 2));
        
        if (response.ok) {
            console.log('✅ Test passed');
        } else {
            console.log('❌ Test failed');
        }
        
        return { success: response.ok, status: response.status, data: result };
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Starting endpoint tests for /api/siswa/submit-kehadiran-guru');
    
    // Get auth token first (you'll need to replace this with actual token)
    const token = 'your-jwt-token-here'; // Replace with actual token
    
    if (token === 'your-jwt-token-here') {
        console.log('⚠️  Please update the token in the script before running tests');
        console.log('   You can get a token by logging in through the frontend');
        return;
    }
    
    const results = {};
    
    // Test 1: Normal mode
    results.normal = await testEndpoint('Normal Mode', testData.normal, token);
    
    // Test 2: Edit mode
    results.edit = await testEndpoint('Edit Mode', testData.edit, token);
    
    // Test 3: Invalid jadwal_id
    results.invalid = await testEndpoint('Invalid Jadwal', testData.invalid, token);
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log('================');
    
    Object.entries(results).forEach(([testName, result]) => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${testName}: ${status}`);
        if (!result.success && result.error) {
            console.log(`  Error: ${result.error}`);
        }
    });
    
    const passedTests = Object.values(results).filter(r => r.success).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Results: ${passedTests}/${totalTests} tests passed`);
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
