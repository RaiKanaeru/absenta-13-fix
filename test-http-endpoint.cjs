/**
 * Test HTTP Endpoint: Test /api/attendance/submit via HTTP
 * 
 * Test endpoint dengan HTTP request untuk memastikan server berjalan dan endpoint berfungsi
 */

const http = require('http');

async function testHttpEndpoint() {
    try {
        console.log('🌐 Testing /api/attendance/submit via HTTP...');
        
        // Test data
        const testData = {
            scheduleId: 1020,
            attendance: {
                2004: 'Hadir'  // Eko Nugroho
            },
            notes: {
                2004: 'Test HTTP submission'
            },
            guruId: 2,
            tanggal_absen: '2025-10-07'
        };
        
        const postData = JSON.stringify(testData);
        
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/api/attendance/submit',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': 'Bearer test-token' // This will fail auth, but we can see if endpoint is reachable
            }
        };
        
        console.log('📤 Sending HTTP request...');
        console.log('   URL: http://localhost:8080/api/attendance/submit');
        console.log('   Data:', testData);
        
        const req = http.request(options, (res) => {
            console.log(`📥 Response status: ${res.statusCode}`);
            console.log(`📥 Response headers:`, res.headers);
            
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log('📥 Response body:', responseData);
                
                if (res.statusCode === 401) {
                    console.log('✅ Endpoint is reachable (401 Unauthorized expected due to test token)');
                } else if (res.statusCode === 200) {
                    console.log('✅ Endpoint working correctly!');
                } else {
                    console.log(`⚠️  Unexpected status code: ${res.statusCode}`);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ HTTP request failed:', error.message);
            
            if (error.code === 'ECONNREFUSED') {
                console.log('💡 Server is not running. Please start the server first with:');
                console.log('   npm start');
                console.log('   or');
                console.log('   node server_modern.js');
            }
        });
        
        req.write(postData);
        req.end();
        
    } catch (error) {
        console.error('❌ HTTP test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run test
if (require.main === module) {
    testHttpEndpoint()
        .then(() => {
            console.log('\n✅ HTTP endpoint test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ HTTP endpoint test failed:', error);
            process.exit(1);
        });
}

module.exports = { testHttpEndpoint };










