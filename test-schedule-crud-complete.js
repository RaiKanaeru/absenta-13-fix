// Test script untuk complete schedule CRUD flow
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testScheduleCRUD() {
    console.log('🔍 Testing complete schedule CRUD flow...');
    
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
        
        // 2. Test GET schedules
        console.log('\n2. Testing GET schedules...');
        const getResponse = await fetch(`${API_BASE}/api/admin/jadwal`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const schedulesData = await getResponse.json();
        console.log('📊 Schedules response status:', getResponse.status);
        console.log('📊 Schedules data success:', schedulesData.success);
        console.log('📊 Total schedules:', schedulesData.data?.length || 0);
        
        // 3. Test POST schedule (create new)
        console.log('\n3. Testing POST schedule (create new)...');
        const newSchedule = {
            kelas_id: 1,
            mapel_id: 1,
            guru_id: 8,
            ruang_id: 17,
            hari: 'Senin',
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
            
            // 4. Test PUT schedule (update)
            console.log('\n4. Testing PUT schedule (update)...');
            const updatedSchedule = {
                ...newSchedule,
                jam_mulai: '07:15:00',
                jam_selesai: '08:00:00'
            };
            
            const putResponse = await fetch(`${API_BASE}/api/admin/jadwal/${scheduleId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedSchedule)
            });
            
            const putData = await putResponse.json();
            console.log('📊 PUT response status:', putResponse.status);
            console.log('📊 PUT response:', putData);
            
            if (putData.message) {
                console.log('✅ Schedule updated successfully');
                
                // 5. Test DELETE schedule
                console.log('\n5. Testing DELETE schedule...');
                const deleteResponse = await fetch(`${API_BASE}/api/admin/jadwal/${scheduleId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const deleteData = await deleteResponse.json();
                console.log('📊 DELETE response status:', deleteResponse.status);
                console.log('📊 DELETE response:', deleteData);
                
                if (deleteData.message) {
                    console.log('✅ Schedule deleted successfully');
                } else {
                    console.log('❌ Schedule deletion failed:', deleteData.error);
                }
            } else {
                console.log('❌ Schedule update failed:', putData.error);
            }
        } else {
            console.log('❌ Schedule creation failed:', postData.error);
        }
        
        // 6. Test conflict validation
        console.log('\n6. Testing conflict validation...');
        const conflictSchedule = {
            kelas_id: 1,
            mapel_id: 1,
            guru_id: 8,
            ruang_id: 17,
            hari: 'Senin',
            jam_ke: 1,
            jam_mulai: '07:00:00',
            jam_selesai: '07:45:00'
        };
        
        const conflictResponse = await fetch(`${API_BASE}/api/admin/jadwal`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(conflictSchedule)
        });
        
        const conflictData = await conflictResponse.json();
        console.log('📊 Conflict response status:', conflictResponse.status);
        console.log('📊 Conflict response:', conflictData);
        
        if (conflictData.error) {
            console.log('✅ Conflict validation working:', conflictData.error);
            console.log('📋 Details:', conflictData.details);
        } else {
            console.log('❌ Conflict validation not working');
        }
        
        console.log('\n🎉 Complete schedule CRUD flow test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testScheduleCRUD();
