// Debug script untuk test login dan JWT
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testLogin() {
    console.log('🔍 Testing login...');
    
    try {
        // Test login
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
        console.log('📡 Login response:', loginData);
        
        if (loginData.success && loginData.token) {
            console.log('✅ Login successful, testing JWT...');
            
            // Test JWT verification
            const verifyResponse = await fetch(`${API_BASE}/api/verify`, {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`
                }
            });
            
            const verifyData = await verifyResponse.json();
            console.log('🔐 JWT verification response:', verifyData);
            
            // Test debug JWT
            const debugResponse = await fetch(`${API_BASE}/api/debug-jwt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: loginData.token
                })
            });
            
            const debugData = await debugResponse.json();
            console.log('🐛 JWT debug response:', debugData);
            
        } else {
            console.log('❌ Login failed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testLogin();