/**
 * Test All Export Endpoints
 * Tests semua 6 endpoint export dengan letterhead integration
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = 'http://localhost:5000';
const DOWNLOAD_DIR = path.join(__dirname, '../../downloads/test-exports');

// Create download directory if not exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Test credentials - update dengan credentials yang valid
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

let authToken = null;

/**
 * Login sebagai admin untuk mendapatkan token
 */
async function login() {
    console.log('🔐 Logging in as admin...');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/login`, {
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD
        });
        
        if (response.data.success && response.data.token) {
            authToken = response.data.token;
            console.log('✅ Login successful');
            return true;
        } else {
            console.error('❌ Login failed:', response.data);
            return false;
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return false;
    }
}

/**
 * Test export endpoint
 */
async function testExportEndpoint(endpoint, queryParams, filename) {
    console.log(`\n📊 Testing ${endpoint}...`);
    console.log(`   Params: ${JSON.stringify(queryParams)}`);
    
    try {
        const response = await axios.get(`${BASE_URL}/api/export/${endpoint}`, {
            params: queryParams,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            responseType: 'arraybuffer'
        });
        
        // Save file
        const filePath = path.join(DOWNLOAD_DIR, filename);
        fs.writeFileSync(filePath, response.data);
        
        const fileSize = (response.data.length / 1024).toFixed(2);
        console.log(`   ✅ Success! File saved: ${filename} (${fileSize} KB)`);
        console.log(`   📁 Path: ${filePath}`);
        
        return true;
    } catch (error) {
        console.error(`   ❌ Failed:`, error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.error('   🔒 Authorization failed. Token might be invalid.');
        }
        return false;
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log('🚀 Starting Export Endpoints Testing...\n');
    console.log('=' .repeat(60));
    
    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.error('\n❌ Cannot proceed without authentication');
        process.exit(1);
    }
    
    console.log('\n' + '=' .repeat(60));
    
    // Test date range - adjust as needed
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    console.log(`\n📅 Test Period: ${startDate} to ${endDate}`);
    console.log('=' .repeat(60));
    
    const tests = [
        {
            name: 'Teacher Summary',
            endpoint: 'teacher-summary',
            params: { startDate, endDate },
            filename: `test-teacher-summary-${Date.now()}.xlsx`
        },
        {
            name: 'Student Summary',
            endpoint: 'student-summary',
            params: { startDate, endDate },
            filename: `test-student-summary-${Date.now()}.xlsx`
        },
        {
            name: 'Presensi Siswa',
            endpoint: 'presensi-siswa',
            params: { startDate, endDate },
            filename: `test-presensi-siswa-${Date.now()}.xlsx`
        },
        {
            name: 'Rekap Ketidakhadiran',
            endpoint: 'rekap-ketidakhadiran',
            params: { startDate, endDate },
            filename: `test-rekap-ketidakhadiran-${Date.now()}.xlsx`
        },
        {
            name: 'Rekap Ketidakhadiran Guru',
            endpoint: 'rekap-ketidakhadiran-guru',
            params: { startDate, endDate },
            filename: `test-rekap-ketidakhadiran-guru-${Date.now()}.xlsx`
        },
        {
            name: 'Banding Absen',
            endpoint: 'banding-absen',
            params: { startDate, endDate },
            filename: `test-banding-absen-${Date.now()}.xlsx`
        }
    ];
    
    const results = {
        passed: 0,
        failed: 0,
        total: tests.length
    };
    
    // Run tests
    for (const test of tests) {
        const success = await testExportEndpoint(test.endpoint, test.params, test.filename);
        if (success) {
            results.passed++;
        } else {
            results.failed++;
        }
        
        // Wait a bit between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Print summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
    console.log(`\n📁 Download Directory: ${DOWNLOAD_DIR}`);
    console.log('=' .repeat(60));
    
    if (results.failed === 0) {
        console.log('\n🎉 All tests passed! Semua export berhasil!');
    } else {
        console.log('\n⚠️ Some tests failed. Check the errors above.');
    }
}

// Run tests
runTests().catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
});


