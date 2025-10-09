import axios from 'axios';

async function testJamKeResponse() {
  try {
    console.log('🧪 Testing jam_ke response...\n');

    // 1. Login
    const loginResponse = await axios.post('http://localhost:3001/api/login', {
      username: 'admin',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // 2. Test jadwal endpoint
    const jadwalResponse = await axios.get('http://localhost:3001/api/admin/jadwal', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (jadwalResponse.data.success) {
      const jadwalData = jadwalResponse.data.data;
      console.log(`✅ Jadwal endpoint working - found ${jadwalData.length} schedules`);
      
      if (jadwalData.length > 0) {
        const firstSchedule = jadwalData[0];
        console.log('📋 First schedule structure:');
        console.log(JSON.stringify(firstSchedule, null, 2));
        
        if (firstSchedule.jam_ke !== undefined) {
          console.log(`✅ jam_ke column present: ${firstSchedule.jam_ke}`);
        } else {
          console.log('❌ jam_ke column missing from response');
        }
      }
    } else {
      console.log('❌ Jadwal endpoint failed:', jadwalResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testJamKeResponse();

