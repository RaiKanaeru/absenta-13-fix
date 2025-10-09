// Check for Dummy Data in Database
import 'dotenv/config';
import mysql from 'mysql2/promise';

const checkDummyData = async () => {
    let connection;
    
    try {
        console.log('🔍 Checking for dummy data in database...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Check Users Table
        console.log('👥 USERS TABLE:');
        const [users] = await connection.execute(`
            SELECT id, username, role, nama, email, status, created_at
            FROM users 
            ORDER BY id
        `);
        
        console.log(`Total users: ${users.length}`);
        users.forEach(user => {
            const isDummy = user.username.includes('test') || 
                           user.username.includes('dummy') || 
                           user.nama.includes('Test') ||
                           user.nama.includes('Dummy') ||
                           user.email?.includes('test') ||
                           user.email?.includes('dummy');
            
            if (isDummy) {
                console.log(`  🚨 DUMMY: ID ${user.id} - ${user.username} (${user.nama}) - ${user.role}`);
            } else {
                console.log(`  ✅ Real: ID ${user.id} - ${user.username} (${user.nama}) - ${user.role}`);
            }
        });
        
        // 2. Check Students Table
        console.log('\n👨‍🎓 STUDENTS TABLE:');
        const [students] = await connection.execute(`
            SELECT id, id_siswa, nama_pengguna, nis, nama, kelas_id, email, status
            FROM siswa 
            ORDER BY id
        `);
        
        console.log(`Total students: ${students.length}`);
        students.forEach(student => {
            const isDummy = student.nama_pengguna.includes('test') || 
                           student.nama_pengguna.includes('dummy') || 
                           student.nama.includes('Test') ||
                           student.nama.includes('Dummy') ||
                           student.nis.includes('test') ||
                           student.nis.includes('dummy') ||
                           student.email?.includes('test') ||
                           student.email?.includes('dummy');
            
            if (isDummy) {
                console.log(`  🚨 DUMMY: ID ${student.id} - ${student.nis} - ${student.nama} (${student.nama_pengguna})`);
            } else {
                console.log(`  ✅ Real: ID ${student.id} - ${student.nis} - ${student.nama} (${student.nama_pengguna})`);
            }
        });
        
        // 3. Check Teachers Table
        console.log('\n👨‍🏫 TEACHERS TABLE:');
        const [teachers] = await connection.execute(`
            SELECT id, id_guru, nip, nama, email, status
            FROM guru 
            ORDER BY id
        `);
        
        console.log(`Total teachers: ${teachers.length}`);
        teachers.forEach(teacher => {
            const isDummy = teacher.nama.includes('Test') || 
                           teacher.nama.includes('Dummy') ||
                           teacher.nip.includes('test') ||
                           teacher.nip.includes('dummy') ||
                           teacher.email?.includes('test') ||
                           teacher.email?.includes('dummy');
            
            if (isDummy) {
                console.log(`  🚨 DUMMY: ID ${teacher.id} - ${teacher.nip} - ${teacher.nama}`);
            } else {
                console.log(`  ✅ Real: ID ${teacher.id} - ${teacher.nip} - ${teacher.nama}`);
            }
        });
        
        // 4. Check Subjects Table
        console.log('\n📚 SUBJECTS TABLE:');
        const [subjects] = await connection.execute(`
            SELECT id_mapel, kode_mapel, nama_mapel, status
            FROM mapel 
            ORDER BY id_mapel
        `);
        
        console.log(`Total subjects: ${subjects.length}`);
        subjects.forEach(subject => {
            const isDummy = subject.nama_mapel.includes('Test') || 
                           subject.nama_mapel.includes('Dummy') ||
                           subject.kode_mapel.includes('test') ||
                           subject.kode_mapel.includes('dummy');
            
            if (isDummy) {
                console.log(`  🚨 DUMMY: ID ${subject.id_mapel} - ${subject.kode_mapel} - ${subject.nama_mapel}`);
            } else {
                console.log(`  ✅ Real: ID ${subject.id_mapel} - ${subject.kode_mapel} - ${subject.nama_mapel}`);
            }
        });
        
        // 5. Check Classes Table
        console.log('\n🏫 CLASSES TABLE:');
        const [classes] = await connection.execute(`
            SELECT id_kelas, nama_kelas, tingkat, status
            FROM kelas 
            ORDER BY id_kelas
        `);
        
        console.log(`Total classes: ${classes.length}`);
        classes.forEach(cls => {
            const isDummy = cls.nama_kelas.includes('Test') || 
                           cls.nama_kelas.includes('Dummy') ||
                           cls.tingkat.includes('test') ||
                           cls.tingkat.includes('dummy');
            
            if (isDummy) {
                console.log(`  🚨 DUMMY: ID ${cls.id_kelas} - ${cls.nama_kelas} (${cls.tingkat})`);
            } else {
                console.log(`  ✅ Real: ID ${cls.id_kelas} - ${cls.nama_kelas} (${cls.tingkat})`);
            }
        });
        
        // 6. Check Schedules Table
        console.log('\n📅 SCHEDULES TABLE:');
        const [schedules] = await connection.execute(`
            SELECT id_jadwal, kelas_id, mapel_id, guru_id, hari, jam_mulai, jam_selesai
            FROM jadwal 
            ORDER BY id_jadwal
        `);
        
        console.log(`Total schedules: ${schedules.length}`);
        if (schedules.length > 0) {
            console.log('  Sample schedules:');
            schedules.slice(0, 5).forEach(schedule => {
                console.log(`    ID ${schedule.id_jadwal} - Kelas ${schedule.kelas_id} - Mapel ${schedule.mapel_id} - Guru ${schedule.guru_id}`);
            });
        }
        
        // 7. Check Attendance Tables
        console.log('\n📊 ATTENDANCE TABLES:');
        
        // Teacher Attendance
        const [teacherAttendance] = await connection.execute(`
            SELECT COUNT(*) as count FROM absensi_guru
        `);
        console.log(`Teacher attendance records: ${teacherAttendance[0].count}`);
        
        // Student Attendance
        const [studentAttendance] = await connection.execute(`
            SELECT COUNT(*) as count FROM absensi_siswa
        `);
        console.log(`Student attendance records: ${studentAttendance[0].count}`);
        
        // 8. Summary
        console.log('\n📋 SUMMARY:');
        console.log(`- Users: ${users.length} total`);
        console.log(`- Students: ${students.length} total`);
        console.log(`- Teachers: ${teachers.length} total`);
        console.log(`- Subjects: ${subjects.length} total`);
        console.log(`- Classes: ${classes.length} total`);
        console.log(`- Schedules: ${schedules.length} total`);
        console.log(`- Teacher Attendance: ${teacherAttendance[0].count} records`);
        console.log(`- Student Attendance: ${studentAttendance[0].count} records`);
        
        // 9. Check for obvious dummy patterns
        console.log('\n🔍 DUMMY DATA PATTERNS DETECTED:');
        
        const dummyUsers = users.filter(user => 
            user.username.includes('test') || 
            user.username.includes('dummy') || 
            user.nama.includes('Test') ||
            user.nama.includes('Dummy')
        );
        
        const dummyStudents = students.filter(student => 
            student.nama_pengguna.includes('test') || 
            student.nama_pengguna.includes('dummy') || 
            student.nama.includes('Test') ||
            student.nama.includes('Dummy')
        );
        
        const dummyTeachers = teachers.filter(teacher => 
            teacher.nama.includes('Test') || 
            teacher.nama.includes('Dummy')
        );
        
        console.log(`- Dummy Users: ${dummyUsers.length}`);
        console.log(`- Dummy Students: ${dummyStudents.length}`);
        console.log(`- Dummy Teachers: ${dummyTeachers.length}`);
        
        if (dummyUsers.length > 0 || dummyStudents.length > 0 || dummyTeachers.length > 0) {
            console.log('\n⚠️  DUMMY DATA FOUND! Consider cleaning up before production.');
        } else {
            console.log('\n✅ No obvious dummy data patterns detected.');
        }
        
    } catch (error) {
        console.error('❌ Error checking dummy data:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

checkDummyData();
