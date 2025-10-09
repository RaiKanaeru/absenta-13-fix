import axios from 'axios';

const API_BASE = 'http://localhost:3001';

async function testJamKeIntegration() {
  try {
    console.log('🧪 Testing jam_ke integration...\n');

    // 1. Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/api/login`, {
      username: 'admin',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // 2. Test jadwal endpoint with jam_ke
    console.log('\n2. Testing jadwal endpoint...');
    const jadwalResponse = await axios.get(`${API_BASE}/api/admin/jadwal`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (jadwalResponse.data.success) {
      const jadwalData = jadwalResponse.data.data;
      console.log(`✅ Jadwal endpoint working - found ${jadwalData.length} schedules`);
      
      // Check if jam_ke is present in response
      if (jadwalData.length > 0) {
        const firstSchedule = jadwalData[0];
        if (firstSchedule.jam_ke !== undefined) {
          console.log(`✅ jam_ke column present: ${firstSchedule.jam_ke}`);
        } else {
          console.log('❌ jam_ke column missing from response');
        }
      }
    } else {
      console.log('❌ Jadwal endpoint failed:', jadwalResponse.data.message);
    }

    // 3. Test creating new schedule with jam_ke
    console.log('\n3. Testing schedule creation with jam_ke...');
    const newSchedule = {
      kelas_id: 349,
      mapel_id: 1,
      guru_id: 2,
      ruang_id: 189, // Valid ruang_id from database
      hari: 'Jumat',
      jam_ke: 4,
      jam_mulai: '15:00:00',
      jam_selesai: '16:30:00'
    };

    const createResponse = await axios.post(`${API_BASE}/api/admin/jadwal`, newSchedule, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (createResponse.data.success || createResponse.data.message === 'Jadwal berhasil ditambahkan') {
      console.log('✅ Schedule created successfully with jam_ke');
    } else {
      console.log('❌ Schedule creation failed:', createResponse.data.message);
    }

    // 4. Test teacher attendance with jam_ke
    console.log('\n4. Testing teacher attendance with jam_ke...');
    const attendanceResponse = await axios.get(`${API_BASE}/api/guru/jadwal`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (attendanceResponse.data.success) {
      const schedules = attendanceResponse.data.data;
      console.log(`✅ Teacher schedules retrieved - found ${schedules.length} schedules`);
      
      if (schedules.length > 0) {
        const firstSchedule = schedules[0];
        if (firstSchedule.jam_ke !== undefined) {
          console.log(`✅ jam_ke present in teacher schedule: ${firstSchedule.jam_ke}`);
        } else {
          console.log('❌ jam_ke missing from teacher schedule');
        }
      }
    } else {
      console.log('❌ Teacher schedules failed:', attendanceResponse.data.message);
    }

    // 5. Test student schedule with jam_ke
    console.log('\n5. Testing student schedule with jam_ke...');
    const studentLoginResponse = await axios.post(`${API_BASE}/api/login`, {
      username: 'perwakilan2000',
      password: 'admin123'
    });

    if (studentLoginResponse.data.success) {
      const studentToken = studentLoginResponse.data.data.token;
      
      const studentScheduleResponse = await axios.get(`${API_BASE}/api/siswa/jadwal`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      if (studentScheduleResponse.data.success) {
        const studentSchedules = studentScheduleResponse.data.data;
        console.log(`✅ Student schedules retrieved - found ${studentSchedules.length} schedules`);
        
        if (studentSchedules.length > 0) {
          const firstSchedule = studentSchedules[0];
          if (firstSchedule.jam_ke !== undefined) {
            console.log(`✅ jam_ke present in student schedule: ${firstSchedule.jam_ke}`);
          } else {
            console.log('❌ jam_ke missing from student schedule');
          }
        }
      } else {
        console.log('❌ Student schedules failed:', studentScheduleResponse.data.message);
      }
    } else {
      console.log('❌ Student login failed');
    }

    console.log('\n🎉 jam_ke integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testJamKeIntegration();
