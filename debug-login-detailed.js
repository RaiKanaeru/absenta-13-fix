// Debug Login Detailed
import 'dotenv/config';

const debugLoginDetailed = async () => {
    try {
        console.log('🔍 Debugging login in detail...');
        
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        console.log('Response status:', loginResponse.status);
        console.log('Response headers:', Object.fromEntries(loginResponse.headers.entries()));
        
        const responseText = await loginResponse.text();
        console.log('Raw response text:', responseText);
        
        try {
            const responseData = JSON.parse(responseText);
            console.log('Parsed response data:');
            console.log(JSON.stringify(responseData, null, 2));
            
            // Check specific fields
            console.log('\nField analysis:');
            console.log('- success:', responseData.success);
            console.log('- data:', responseData.data);
            console.log('- data.user:', responseData.data?.user);
            console.log('- data.token:', responseData.data?.token);
            console.log('- token length:', responseData.data?.token?.length);
            
        } catch (parseError) {
            console.log('Failed to parse JSON:', parseError.message);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
};

debugLoginDetailed();
