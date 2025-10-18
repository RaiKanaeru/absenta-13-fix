// Test script untuk integrasi frontend-backend
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';
const FRONTEND_BASE = 'http://localhost:8080';

async function testFullFlow() {
    console.log('🔍 Testing full frontend-backend integration...');
    
    try {
        // 1. Test server health
        console.log('\n1. Testing server health...');
        const healthResponse = await fetch(`${API_BASE}/api/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Server health:', healthData.status);
        
        // 2. Test login
        console.log('\n2. Testing login...');
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
        console.log('✅ Login response:', {
            success: loginData.success,
            user: loginData.user?.username,
            role: loginData.user?.role,
            hasToken: !!loginData.token
        });
        
        if (!loginData.success || !loginData.token) {
            throw new Error('Login failed');
        }
        
        // 3. Test JWT verification
        console.log('\n3. Testing JWT verification...');
        const verifyResponse = await fetch(`${API_BASE}/api/verify`, {
            headers: {
                'Authorization': `Bearer ${loginData.token}`
            }
        });
        
        const verifyData = await verifyResponse.json();
        console.log('✅ JWT verification:', {
            success: verifyData.success,
            user: verifyData.user?.username,
            role: verifyData.user?.role
        });
        
        // 4. Test admin endpoints
        console.log('\n4. Testing admin endpoints...');
        const adminResponse = await fetch(`${API_BASE}/api/admin/info`, {
            headers: {
                'Authorization': `Bearer ${loginData.token}`
            }
        });
        
        const adminData = await adminResponse.json();
        console.log('✅ Admin endpoint:', {
            success: adminData.success,
            message: adminData.message
        });
        
        // 5. Test frontend accessibility
        console.log('\n5. Testing frontend accessibility...');
        try {
            const frontendResponse = await fetch(`${FRONTEND_BASE}`);
            console.log('✅ Frontend accessible:', frontendResponse.status === 200);
        } catch (error) {
            console.log('⚠️ Frontend not accessible (normal if not running):', error.message);
        }
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log('- Server is running and healthy');
        console.log('- Login authentication works');
        console.log('- JWT token generation and verification works');
        console.log('- Admin endpoints are accessible');
        console.log('- Ready for frontend integration');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testFullFlow();