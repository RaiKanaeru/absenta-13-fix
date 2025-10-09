import { spawn } from 'child_process';
import axios from 'axios';

// Start server
console.log('🚀 Starting server...');
const server = spawn('node', ['server_modern.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Log server output
server.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data.toString()}`);
});

server.stderr.on('data', (data) => {
  console.error(`[SERVER ERROR] ${data.toString()}`);
});

// Wait for server to start
setTimeout(async () => {
  try {
    console.log('\n🧪 Testing schedule creation...\n');

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

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    // Kill server
    server.kill();
    process.exit(0);
  }
}, 5000); // Wait 5 seconds for server to start

