// Debug Login Response
import 'dotenv/config';

const debugLoginResponse = async () => {
    try {
        console.log('🔍 Debugging login response...');
        
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        console.log('Response status:', loginResponse.status);
        console.log('Response headers:', Object.fromEntries(loginResponse.headers.entries()));
        
        const responseText = await loginResponse.text();
        console.log('Raw response text:', responseText);
        
        try {
            const responseData = JSON.parse(responseText);
            console.log('Parsed response data:', JSON.stringify(responseData, null, 2));
        } catch (parseError) {
            console.log('Failed to parse JSON:', parseError.message);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
};

debugLoginResponse();
