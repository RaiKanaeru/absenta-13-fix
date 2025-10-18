// Test script untuk schedule tanpa konflik
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testScheduleNoConflict() {
    console.log('🔍 Testing schedule creation without conflicts...');
    
    try {
        // 1. Login first
        console.log('\n1. Logging in...');
        const loginResponse = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful:', loginData.success);
        
        if (!loginData.success || !loginData.token) {
            throw new Error('Login failed');
        }
        
        const token = loginData.token;
        
        // 2. Test POST schedule dengan data yang tidak konflik
        console.log('\n2. Testing POST schedule (no conflict)...');
        const newSchedule = {
            kelas_id: 2, // Kelas berbeda
            mapel_id: 2, // Mapel berbeda
            guru_id: 9, // Guru berbeda
            ruang_id: 18, // Ruang berbeda
            hari: 'Selasa', // Hari berbeda
            jam_ke: 1,
            jam_mulai: '07:00:00',
            jam_selesai: '07:45:00'
        };
        
        const postResponse = await fetch(`${API_BASE}/api/admin/jadwal`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newSchedule)
        });
        
        const postData = await postResponse.json();
        console.log('📊 POST response status:', postResponse.status);
        console.log('📊 POST response:', postData);
        
        if (postData.message) {
            console.log('✅ Schedule created successfully');
            const scheduleId = postData.id;
            
            // 3. Test GET schedules untuk memverifikasi
            console.log('\n3. Verifying schedule creation...');
            const getResponse = await fetch(`${API_BASE}/api/admin/jadwal`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const schedulesData = await getResponse.json();
            console.log('📊 Total schedules after creation:', schedulesData.data?.length || 0);
            
            // 4. Clean up - delete the test schedule
            console.log('\n4. Cleaning up test schedule...');
            const deleteResponse = await fetch(`${API_BASE}/api/admin/jadwal/${scheduleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const deleteData = await deleteResponse.json();
            console.log('📊 DELETE response:', deleteData);
            
            if (deleteData.message) {
                console.log('✅ Test schedule cleaned up successfully');
            }
            
        } else {
            console.log('❌ Schedule creation failed:', postData.error);
            if (postData.details) {
                console.log('📋 Details:', postData.details);
            }
        }
        
        console.log('\n🎉 Schedule creation test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testScheduleNoConflict();
