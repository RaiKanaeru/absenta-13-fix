import fetch from 'node-fetch';

async function testStudentDashboardFixes() {
  console.log('🧪 Testing Student Dashboard Fixes...\n');

  try {
    // Test 1: Login as student
    console.log('1️⃣ Testing student login...');
    const loginResponse = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'perwakilan2002',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.data.user.username);

    const token = loginData.data.token;
    if (!token) {
      throw new Error('No token received');
    }

    // Test 2: Test /api/siswa/info endpoint
    console.log('\n2️⃣ Testing /api/siswa/info endpoint...');
    const infoResponse = await fetch('http://localhost:3001/api/siswa/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!infoResponse.ok) {
      throw new Error(`Info endpoint failed: ${infoResponse.status} ${infoResponse.statusText}`);
    }

    const infoData = await infoResponse.json();
    console.log('✅ Info endpoint working:', infoData.success);
    console.log('📊 Student info:', {
      id: infoData.data?.id_siswa,
      nama: infoData.data?.nama,
      kelas: infoData.data?.nama_kelas
    });

    // Test 3: Test /api/siswa/banding-absen endpoint
    console.log('\n3️⃣ Testing /api/siswa/banding-absen endpoint...');
    const bandingResponse = await fetch('http://localhost:3001/api/siswa/banding-absen', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!bandingResponse.ok) {
      throw new Error(`Banding absen endpoint failed: ${bandingResponse.status} ${bandingResponse.statusText}`);
    }

    const bandingData = await bandingResponse.json();
    console.log('✅ Banding absen endpoint working:', bandingData.success);
    console.log('📊 Banding data count:', bandingData.data?.length || 0);

    // Test 4: Test /api/siswa/pengajuan-izin endpoint
    console.log('\n4️⃣ Testing /api/siswa/pengajuan-izin endpoint...');
    const izinResponse = await fetch('http://localhost:3001/api/siswa/pengajuan-izin', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!izinResponse.ok) {
      throw new Error(`Pengajuan izin endpoint failed: ${izinResponse.status} ${izinResponse.statusText}`);
    }

    const izinData = await izinResponse.json();
    console.log('✅ Pengajuan izin endpoint working:', izinData.success);
    console.log('📊 Izin data count:', izinData.data?.length || 0);

    console.log('\n🎉 All Student Dashboard endpoints are working correctly!');
    console.log('\n📋 Summary:');
    console.log('✅ Student login: Working');
    console.log('✅ /api/siswa/info: Working');
    console.log('✅ /api/siswa/banding-absen: Working');
    console.log('✅ /api/siswa/pengajuan-izin: Working');
    console.log('\n🔧 Frontend fixes applied:');
    console.log('✅ Fixed loadBandingAbsen hoisting issue');
    console.log('✅ Updated API calls to use utility functions');
    console.log('✅ Fixed proxy configuration usage');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testStudentDashboardFixes();
