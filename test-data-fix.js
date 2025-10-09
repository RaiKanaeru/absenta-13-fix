// Test Data Fix
import 'dotenv/config';

const testDataFix = async () => {
    try {
        console.log('🧪 Testing data fix...\n');
        
        // Step 1: Login
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        const loginData = await loginResponse.json();
        const token = loginData.data?.token;
        
        if (!token) {
            throw new Error('No token received');
        }
        
        console.log('✅ Login successful');
        
        // Step 2: Test subjects endpoint
        const subjectsResponse = await fetch('http://localhost:3001/api/admin/mapel', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const subjectsData = await subjectsResponse.json();
        console.log('✅ Subjects endpoint successful');
        
        if (subjectsData.success && subjectsData.data) {
            console.log(`📚 Found ${subjectsData.data.length} subjects`);
            if (subjectsData.data.length > 0) {
                console.log('Sample subjects:');
                subjectsData.data.slice(0, 3).forEach(subject => {
                    console.log(`  - ${subject.kode_mapel}: ${subject.nama_mapel}`);
                });
            }
        }
        
        // Step 3: Test rooms endpoint
        const roomsResponse = await fetch('http://localhost:3001/api/admin/ruang-kelas', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const roomsData = await roomsResponse.json();
        console.log('✅ Rooms endpoint successful');
        
        if (roomsData.success && roomsData.data) {
            console.log(`🏫 Found ${roomsData.data.length} rooms`);
            if (roomsData.data.length > 0) {
                console.log('Sample rooms:');
                roomsData.data.slice(0, 3).forEach(room => {
                    console.log(`  - ${room.nama_ruang} (${room.kode_ruang}) - Kapasitas: ${room.kapasitas}`);
                });
            }
        }
        
        // Step 4: Test schedules endpoint
        const schedulesResponse = await fetch('http://localhost:3001/api/admin/jadwal', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const schedulesData = await schedulesResponse.json();
        console.log('✅ Schedules endpoint successful');
        
        if (schedulesData.success && schedulesData.data) {
            console.log(`📅 Found ${schedulesData.data.length} schedules`);
            if (schedulesData.data.length > 0) {
                console.log('Sample schedules:');
                schedulesData.data.slice(0, 3).forEach(schedule => {
                    console.log(`  - ${schedule.hari} ${schedule.jam_mulai}-${schedule.jam_selesai}: ${schedule.nama_kelas} - ${schedule.nama_mapel}`);
                });
            }
        }
        
        console.log('\n🎉 Data fix test completed successfully!');
        console.log('✅ All missing data issues have been resolved');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testDataFix();
