import axios from 'axios';
import mysql from 'mysql2/promise';

const API_BASE = 'http://localhost:3001';

async function comprehensiveCRUDTest() {
  try {
    console.log('🧪 Comprehensive CRUD Test...\n');

    // 1. Admin Login
    console.log('1. Testing admin login...');
    const adminLoginResponse = await axios.post(`${API_BASE}/api/login`, {
      username: 'admin',
      password: 'admin123'
    });

    if (!adminLoginResponse.data.success) {
      throw new Error('Admin login failed');
    }

    const adminToken = adminLoginResponse.data.data.token;
    console.log('✅ Admin login successful');

    // 2. Test CRUD for Subjects (Mapel)
    console.log('\n2. Testing Subjects CRUD...');
    
    // GET subjects
    const getSubjectsResponse = await axios.get(`${API_BASE}/api/admin/mapel`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ GET subjects: ${getSubjectsResponse.data.success ? 'Success' : 'Failed'}`);

    // POST new subject
    const newSubject = {
      kode_mapel: 'TEST001',
      nama_mapel: 'Test Subject',
      deskripsi: 'Test Description'
    };
    
    try {
      const createSubjectResponse = await axios.post(`${API_BASE}/api/admin/mapel`, newSubject, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ POST subject: ${createSubjectResponse.data.success ? 'Success' : 'Failed'}`);
      
      if (createSubjectResponse.data.success) {
        const subjectId = createSubjectResponse.data.data.id;
        
        // PUT subject
        const updateSubject = {
          kode_mapel: 'TEST001UPD',
          nama_mapel: 'Test Subject Updated',
          deskripsi: 'Test Description Updated'
        };
        
        const updateSubjectResponse = await axios.put(`${API_BASE}/api/admin/mapel/${subjectId}`, updateSubject, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ PUT subject: ${updateSubjectResponse.data.success ? 'Success' : 'Failed'}`);
        
        // DELETE subject
        const deleteSubjectResponse = await axios.delete(`${API_BASE}/api/admin/mapel/${subjectId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ DELETE subject: ${deleteSubjectResponse.data.success ? 'Success' : 'Failed'}`);
      }
    } catch (error) {
      console.log(`❌ Subject CRUD error: ${error.response?.data?.error || error.message}`);
    }

    // 3. Test CRUD for Classes (Kelas)
    console.log('\n3. Testing Classes CRUD...');
    
    // GET classes
    const getClassesResponse = await axios.get(`${API_BASE}/api/admin/kelas`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ GET classes: ${getClassesResponse.data.success ? 'Success' : 'Failed'}`);

    // POST new class
    const newClass = {
      nama_kelas: 'Test Class',
      tingkat: 'X',
      ruang: 'Test Room',
      kode_ruang: 'TR001',
      jumlah_siswa: 25
    };
    
    try {
      const createClassResponse = await axios.post(`${API_BASE}/api/admin/kelas`, newClass, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ POST class: ${createClassResponse.data.success ? 'Success' : 'Failed'}`);
      
      if (createClassResponse.data.success) {
        const classId = createClassResponse.data.data.id;
        
        // PUT class
        const updateClass = {
          nama_kelas: 'Test Class Updated',
          tingkat: 'XI',
          ruang: 'Test Room Updated',
          kode_ruang: 'TR001UPD',
          jumlah_siswa: 30
        };
        
        const updateClassResponse = await axios.put(`${API_BASE}/api/admin/kelas/${classId}`, updateClass, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ PUT class: ${updateClassResponse.data.success ? 'Success' : 'Failed'}`);
        
        // DELETE class
        const deleteClassResponse = await axios.delete(`${API_BASE}/api/admin/kelas/${classId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ DELETE class: ${deleteClassResponse.data.success ? 'Success' : 'Failed'}`);
      }
    } catch (error) {
      console.log(`❌ Class CRUD error: ${error.response?.data?.error || error.message}`);
    }

    // 4. Test CRUD for Teachers (Guru)
    console.log('\n4. Testing Teachers CRUD...');
    
    // GET teachers
    const getTeachersResponse = await axios.get(`${API_BASE}/api/admin/guru`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ GET teachers: ${getTeachersResponse.data.success ? 'Success' : 'Failed'}`);

    // POST new teacher
    const newTeacher = {
      nip: 'TEST123456789',
      nama: 'Test Teacher',
      email: 'testteacher@example.com',
      no_telp: '08123456789',
      alamat: 'Test Address',
      jenis_kelamin: 'L',
      mata_pelajaran: 'Test Subject'
    };
    
    try {
      const createTeacherResponse = await axios.post(`${API_BASE}/api/admin/guru`, newTeacher, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ POST teacher: ${createTeacherResponse.data.success ? 'Success' : 'Failed'}`);
      
      if (createTeacherResponse.data.success) {
        const teacherId = createTeacherResponse.data.data.id;
        
        // PUT teacher
        const updateTeacher = {
          nip: 'TEST123456789UPD',
          nama: 'Test Teacher Updated',
          email: 'testteacherupdated@example.com',
          no_telp: '08123456789',
          alamat: 'Test Address Updated',
          jenis_kelamin: 'L',
          mata_pelajaran: 'Test Subject Updated'
        };
        
        const updateTeacherResponse = await axios.put(`${API_BASE}/api/admin/guru/${teacherId}`, updateTeacher, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ PUT teacher: ${updateTeacherResponse.data.success ? 'Success' : 'Failed'}`);
        
        // DELETE teacher
        const deleteTeacherResponse = await axios.delete(`${API_BASE}/api/admin/guru/${teacherId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ DELETE teacher: ${deleteTeacherResponse.data.success ? 'Success' : 'Failed'}`);
      }
    } catch (error) {
      console.log(`❌ Teacher CRUD error: ${error.response?.data?.error || error.message}`);
    }

    // 5. Test CRUD for Students (Siswa)
    console.log('\n5. Testing Students CRUD...');
    
    // GET students
    const getStudentsResponse = await axios.get(`${API_BASE}/api/admin/siswa-perwakilan`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ GET students: ${getStudentsResponse.data.success ? 'Success' : 'Failed'}`);

    // POST new student
    const newStudent = {
      nama: 'Test Student',
      nis: 'TEST123456',
      kelas_id: 349, // Using existing class
      jenis_kelamin: 'L',
      alamat: 'Test Address',
      no_telp: '08123456789',
      username: 'teststudent123',
      password: 'admin123'
    };
    
    try {
      const createStudentResponse = await axios.post(`${API_BASE}/api/admin/siswa-perwakilan`, newStudent, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ POST student: ${createStudentResponse.data.success ? 'Success' : 'Failed'}`);
      
      if (createStudentResponse.data.success) {
        const studentId = createStudentResponse.data.data.id;
        
        // PUT student
        const updateStudent = {
          nama: 'Test Student Updated',
          nis: 'TEST123456UPD',
          kelas_id: 349,
          jenis_kelamin: 'L',
          alamat: 'Test Address Updated',
          no_telp: '08123456789',
          username: 'teststudent123upd',
          password: 'admin123'
        };
        
        const updateStudentResponse = await axios.put(`${API_BASE}/api/admin/siswa-perwakilan/${studentId}`, updateStudent, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ PUT student: ${updateStudentResponse.data.success ? 'Success' : 'Failed'}`);
        
        // DELETE student
        const deleteStudentResponse = await axios.delete(`${API_BASE}/api/admin/siswa-perwakilan/${studentId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ DELETE student: ${deleteStudentResponse.data.success ? 'Success' : 'Failed'}`);
      }
    } catch (error) {
      console.log(`❌ Student CRUD error: ${error.response?.data?.error || error.message}`);
    }

    // 6. Test CRUD for Schedules (Jadwal)
    console.log('\n6. Testing Schedules CRUD...');
    
    // GET schedules
    const getSchedulesResponse = await axios.get(`${API_BASE}/api/admin/jadwal`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ GET schedules: ${getSchedulesResponse.data.success ? 'Success' : 'Failed'}`);

    // POST new schedule
    const newSchedule = {
      kelas_id: 349,
      mapel_id: 1,
      guru_id: 2,
      ruang_id: 189,
      hari: 'Senin',
      jam_ke: 1,
      jam_mulai: '07:00:00',
      jam_selesai: '08:30:00'
    };
    
    try {
      const createScheduleResponse = await axios.post(`${API_BASE}/api/admin/jadwal`, newSchedule, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ POST schedule: ${createScheduleResponse.data.success ? 'Success' : 'Failed'}`);
      
      if (createScheduleResponse.data.success) {
        const scheduleId = createScheduleResponse.data.id;
        
        // PUT schedule
        const updateSchedule = {
          kelas_id: 349,
          mapel_id: 1,
          guru_id: 2,
          ruang_id: 189,
          hari: 'Selasa',
          jam_ke: 2,
          jam_mulai: '08:30:00',
          jam_selesai: '10:00:00'
        };
        
        const updateScheduleResponse = await axios.put(`${API_BASE}/api/admin/jadwal/${scheduleId}`, updateSchedule, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ PUT schedule: ${updateScheduleResponse.data.success ? 'Success' : 'Failed'}`);
        
        // DELETE schedule
        const deleteScheduleResponse = await axios.delete(`${API_BASE}/api/admin/jadwal/${scheduleId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ DELETE schedule: ${deleteScheduleResponse.data.success ? 'Success' : 'Failed'}`);
      }
    } catch (error) {
      console.log(`❌ Schedule CRUD error: ${error.response?.data?.error || error.message}`);
    }

    // 7. Test CRUD for Rooms (Ruang Kelas)
    console.log('\n7. Testing Rooms CRUD...');
    
    // GET rooms
    const getRoomsResponse = await axios.get(`${API_BASE}/api/admin/ruang-kelas`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ GET rooms: ${getRoomsResponse.data.success ? 'Success' : 'Failed'}`);

    // POST new room
    const newRoom = {
      nama_ruang: 'Test Room',
      kode_ruang: 'TR001',
      kapasitas: 30,
      lokasi: 'Test Location'
    };
    
    try {
      const createRoomResponse = await axios.post(`${API_BASE}/api/admin/ruang-kelas`, newRoom, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ POST room: ${createRoomResponse.data.success ? 'Success' : 'Failed'}`);
      
      if (createRoomResponse.data.success) {
        const roomId = createRoomResponse.data.data.id;
        
        // PUT room
        const updateRoom = {
          nama_ruang: 'Test Room Updated',
          kode_ruang: 'TR001UPD',
          kapasitas: 35,
          lokasi: 'Test Location Updated'
        };
        
        const updateRoomResponse = await axios.put(`${API_BASE}/api/admin/ruang-kelas/${roomId}`, updateRoom, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ PUT room: ${updateRoomResponse.data.success ? 'Success' : 'Failed'}`);
        
        // DELETE room
        const deleteRoomResponse = await axios.delete(`${API_BASE}/api/admin/ruang-kelas/${roomId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ DELETE room: ${deleteRoomResponse.data.success ? 'Success' : 'Failed'}`);
      }
    } catch (error) {
      console.log(`❌ Room CRUD error: ${error.response?.data?.error || error.message}`);
    }

    console.log('\n🎉 Comprehensive CRUD test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

comprehensiveCRUDTest();

