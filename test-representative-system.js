import axios from 'axios';
import mysql from 'mysql2/promise';

const API_BASE = 'http://localhost:3001';

async function testRepresentativeSystem() {
  try {
    console.log('🧪 Testing representative system...\n');

    // 1. Login as student representative
    console.log('1. Testing student login...');
    const loginResponse = await axios.post(`${API_BASE}/api/login`, {
      username: 'testperwakilan',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Student login failed');
    }

    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    console.log('✅ Student login successful, user_id:', userId);
    console.log('📋 Login response:', JSON.stringify(loginResponse.data.data, null, 2));
    
    // Get siswa_id from database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });
    
    const [siswaData] = await connection.execute(
      'SELECT id_siswa FROM siswa WHERE id_siswa = ?',
      [userId]
    );
    
    if (siswaData.length === 0) {
      throw new Error('Siswa record not found');
    }
    
    const siswaId = siswaData[0].id_siswa;
    console.log('✅ Siswa ID found:', siswaId);
    
    await connection.end();

    // 2. Test getting class students list
    console.log('\n2. Testing class students list...');
    const studentsResponse = await axios.get(`${API_BASE}/api/siswa/${siswaId}/daftar-siswa`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (studentsResponse.data.success) {
      const students = studentsResponse.data.data;
      console.log(`✅ Class students retrieved - found ${students.length} students`);
      if (students.length > 0) {
        console.log('📋 Sample students:', students.slice(0, 3).map(s => ({ id: s.id, nama: s.nama })));
      }
    } else {
      console.log('❌ Failed to get class students:', studentsResponse.data.message);
    }

    // 3. Test pengajuan izin kelas
    console.log('\n3. Testing pengajuan izin kelas...');
    const izinKelasData = {
      jadwal_id: 1, // Assuming jadwal exists
      tanggal_izin: '2025-01-15',
      siswa_izin: [
        {
          id: 1, // Assuming student exists
          nama: 'Test Student 1',
          jenis_izin: 'sakit',
          alasan: 'Sakit demam'
        },
        {
          id: 2, // Assuming student exists
          nama: 'Test Student 2',
          jenis_izin: 'izin',
          alasan: 'Urusan keluarga'
        }
      ]
    };

    try {
      const izinKelasResponse = await axios.post(`${API_BASE}/api/siswa/${siswaId}/pengajuan-izin-kelas`, izinKelasData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (izinKelasResponse.data.success || izinKelasResponse.data.message) {
        console.log('✅ Pengajuan izin kelas successful');
      } else {
        console.log('❌ Pengajuan izin kelas failed:', izinKelasResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Pengajuan izin kelas error:', error.response?.data?.error || error.message);
    }

    // 4. Test banding absen kelas
    console.log('\n4. Testing banding absen kelas...');
    const bandingKelasData = {
      jadwal_id: 1, // Assuming jadwal exists
      tanggal_absen: '2025-01-15',
      siswa_banding: [
        {
          id: 1, // Assuming student exists
          nama: 'Test Student 1',
          status_asli: 'alpa',
          status_diajukan: 'hadir',
          alasan_banding: 'Saya hadir tapi tidak terdata'
        },
        {
          id: 2, // Assuming student exists
          nama: 'Test Student 2',
          status_asli: 'alpa',
          status_diajukan: 'izin',
          alasan_banding: 'Saya izin sakit'
        }
      ]
    };

    try {
      const bandingKelasResponse = await axios.post(`${API_BASE}/api/siswa/${siswaId}/banding-absen-kelas`, bandingKelasData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (bandingKelasResponse.data.success || bandingKelasResponse.data.message) {
        console.log('✅ Banding absen kelas successful');
      } else {
        console.log('❌ Banding absen kelas failed:', bandingKelasResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Banding absen kelas error:', error.response?.data?.error || error.message);
    }

    // 5. Test getting pengajuan izin data
    console.log('\n5. Testing pengajuan izin data retrieval...');
    try {
      const pengajuanResponse = await axios.get(`${API_BASE}/api/siswa/${siswaId}/pengajuan-izin`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (pengajuanResponse.data.success) {
        const pengajuan = pengajuanResponse.data.data;
        console.log(`✅ Pengajuan izin retrieved - found ${pengajuan.length} records`);
      } else {
        console.log('❌ Failed to get pengajuan izin:', pengajuanResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Pengajuan izin retrieval error:', error.response?.data?.error || error.message);
    }

    // 6. Test getting banding absen data
    console.log('\n6. Testing banding absen data retrieval...');
    try {
      const bandingResponse = await axios.get(`${API_BASE}/api/siswa/${siswaId}/banding-absen`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (bandingResponse.data.success) {
        const banding = bandingResponse.data.data;
        console.log(`✅ Banding absen retrieved - found ${banding.length} records`);
      } else {
        console.log('❌ Failed to get banding absen:', bandingResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Banding absen retrieval error:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 Representative system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testRepresentativeSystem();
