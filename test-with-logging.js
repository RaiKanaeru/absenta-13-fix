import axios from 'axios';

async function testWithLogging() {
  try {
    console.log('🔍 Testing with detailed logging...\n');

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

    // 2. Test creating new schedule with jam_ke
    console.log('\n📅 Testing schedule creation with jam_ke...');
    const newSchedule = {
      kelas_id: 349,
      mapel_id: 1,
      guru_id: 2,
      ruang_id: 1,
      hari: 'Jumat',
      jam_ke: 3,
      jam_mulai: '13:00:00',
      jam_selesai: '14:30:00'
    };

    console.log('📋 Schedule data to create:');
    console.log(JSON.stringify(newSchedule, null, 2));

    try {
      const createResponse = await axios.post('http://localhost:3001/api/admin/jadwal', newSchedule, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('\n📡 Create response status:', createResponse.status);
      console.log('📡 Create response data:');
      console.log(JSON.stringify(createResponse.data, null, 2));

      if (createResponse.data.success) {
        console.log('✅ Schedule created successfully with jam_ke');
      } else {
        console.log('❌ Schedule creation failed:', createResponse.data.message);
      }
    } catch (createError) {
      console.error('❌ Create request failed:', createError.message);
      if (createError.response) {
        console.error('Response status:', createError.response.status);
        console.error('Response data:', createError.response.data);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testWithLogging();

