import fetch from 'node-fetch';

const testJadwalEndpoint = async () => {
  try {
    console.log('🧪 Testing jadwal endpoint...');
    
    const response = await fetch('http://localhost:3001/api/admin/jadwal');
    const data = await response.json();
    
    console.log('✅ Jadwal endpoint response:');
    console.log('Success:', data.success);
    console.log('Total schedules:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📋 Sample schedules:');
      data.data.slice(0, 5).forEach((schedule, index) => {
        console.log(`${index + 1}. ${schedule.hari} - Jam ${schedule.jam_ke} (${schedule.jam_mulai} - ${schedule.jam_selesai}) | ${schedule.nama_kelas} | ${schedule.nama_mapel} | ${schedule.nama_guru} | ${schedule.nama_ruang}`);
      });
    }
    
    // Test by day
    const schedulesByDay = {};
    data.data?.forEach(schedule => {
      if (!schedulesByDay[schedule.hari]) {
        schedulesByDay[schedule.hari] = 0;
      }
      schedulesByDay[schedule.hari]++;
    });
    
    console.log('\n📊 Schedules by day:');
    Object.entries(schedulesByDay).forEach(([day, count]) => {
      console.log(`${day}: ${count} schedules`);
    });
    
  } catch (error) {
    console.error('❌ Error testing jadwal endpoint:', error.message);
  }
};

testJadwalEndpoint();