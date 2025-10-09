import fetch from 'node-fetch';

const testJadwalWithAuth = async () => {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login first
    const loginResponse = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData.success ? 'Success' : 'Failed');
    
    if (!loginData.success) {
      console.error('Login failed:', loginData);
      return;
    }
    
    const token = loginData.data.token;
    console.log('Token received:', token ? 'Yes' : 'No');
    
    // Test jadwal endpoint with auth
    console.log('\n🧪 Testing jadwal endpoint with authentication...');
    
    const response = await fetch('http://localhost:3001/api/admin/jadwal', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('✅ Jadwal endpoint response:');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Total schedules:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📋 Sample schedules:');
      data.data.slice(0, 5).forEach((schedule, index) => {
        console.log(`${index + 1}. ${schedule.hari} - Jam ${schedule.jam_ke} (${schedule.jam_mulai} - ${schedule.jam_selesai}) | ${schedule.nama_kelas} | ${schedule.nama_mapel} | ${schedule.nama_guru} | ${schedule.nama_ruang}`);
      });
      
      // Test by day
      const schedulesByDay = {};
      data.data.forEach(schedule => {
        if (!schedulesByDay[schedule.hari]) {
          schedulesByDay[schedule.hari] = 0;
        }
        schedulesByDay[schedule.hari]++;
      });
      
      console.log('\n📊 Schedules by day:');
      Object.entries(schedulesByDay).forEach(([day, count]) => {
        console.log(`${day}: ${count} schedules`);
      });
    } else {
      console.log('❌ No schedules found in response');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing jadwal endpoint:', error.message);
  }
};

testJadwalWithAuth();

