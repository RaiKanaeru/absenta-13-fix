// Verify Dummy Data Cleanup
import 'dotenv/config';
import mysql from 'mysql2/promise';

const verifyCleanup = async () => {
    let connection;
    
    try {
        console.log('🔍 Verifying dummy data cleanup...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Check Users Table
        console.log('👥 USERS TABLE VERIFICATION:');
        const [users] = await connection.execute(`
            SELECT id, username, role, nama, email, status
            FROM users 
            ORDER BY id
        `);
        
        console.log(`Total users: ${users.length}`);
        
        const dummyUsers = users.filter(user => 
            user.username.includes('test') || 
            user.username.includes('dummy') || 
            user.nama.includes('Test') ||
            user.nama.includes('Dummy')
        );
        
        if (dummyUsers.length > 0) {
            console.log('  🚨 DUMMY USERS FOUND:');
            dummyUsers.forEach(user => {
                console.log(`    - ID ${user.id}: ${user.username} (${user.nama})`);
            });
        } else {
            console.log('  ✅ No dummy users found');
        }
        
        // 2. Check Students Table
        console.log('\n👨‍🎓 STUDENTS TABLE VERIFICATION:');
        const [students] = await connection.execute(`
            SELECT id, id_siswa, nama_pengguna, nis, nama, email
            FROM siswa 
            ORDER BY id
        `);
        
        console.log(`Total students: ${students.length}`);
        
        const dummyStudents = students.filter(student => 
            student.nama_pengguna.includes('test') || 
            student.nama_pengguna.includes('dummy') || 
            student.nama.includes('Test') ||
            student.nama.includes('Dummy') ||
            student.nis.includes('test') ||
            student.nis.includes('dummy')
        );
        
        if (dummyStudents.length > 0) {
            console.log('  🚨 DUMMY STUDENTS FOUND:');
            dummyStudents.forEach(student => {
                console.log(`    - ID ${student.id}: ${student.nis} - ${student.nama}`);
            });
        } else {
            console.log('  ✅ No dummy students found');
        }
        
        // 3. Check Teachers Table
        console.log('\n👨‍🏫 TEACHERS TABLE VERIFICATION:');
        const [teachers] = await connection.execute(`
            SELECT id, id_guru, nip, nama, email
            FROM guru 
            ORDER BY id
        `);
        
        console.log(`Total teachers: ${teachers.length}`);
        
        const dummyTeachers = teachers.filter(teacher => 
            teacher.nama.includes('Test') || 
            teacher.nama.includes('Dummy') ||
            teacher.nip.includes('test') ||
            teacher.nip.includes('dummy')
        );
        
        if (dummyTeachers.length > 0) {
            console.log('  🚨 DUMMY TEACHERS FOUND:');
            dummyTeachers.forEach(teacher => {
                console.log(`    - ID ${teacher.id}: ${teacher.nip} - ${teacher.nama}`);
            });
        } else {
            console.log('  ✅ No dummy teachers found');
        }
        
        // 4. Check Subjects Table
        console.log('\n📚 SUBJECTS TABLE VERIFICATION:');
        const [subjects] = await connection.execute(`
            SELECT id_mapel, kode_mapel, nama_mapel, status
            FROM mapel 
            ORDER BY id_mapel
        `);
        
        console.log(`Total subjects: ${subjects.length}`);
        
        const dummySubjects = subjects.filter(subject => 
            subject.nama_mapel.includes('Test') || 
            subject.nama_mapel.includes('Dummy') ||
            subject.kode_mapel.includes('test') ||
            subject.kode_mapel.includes('dummy')
        );
        
        if (dummySubjects.length > 0) {
            console.log('  🚨 DUMMY SUBJECTS FOUND:');
            dummySubjects.forEach(subject => {
                console.log(`    - ID ${subject.id_mapel}: ${subject.kode_mapel} - ${subject.nama_mapel}`);
            });
        } else {
            console.log('  ✅ No dummy subjects found');
        }
        
        // 5. Check Classes Table
        console.log('\n🏫 CLASSES TABLE VERIFICATION:');
        const [classes] = await connection.execute(`
            SELECT id_kelas, nama_kelas, tingkat, status
            FROM kelas 
            ORDER BY id_kelas
        `);
        
        console.log(`Total classes: ${classes.length}`);
        
        const dummyClasses = classes.filter(cls => 
            cls.nama_kelas.includes('Test') || 
            cls.nama_kelas.includes('Dummy') ||
            cls.tingkat.includes('test') ||
            cls.tingkat.includes('dummy')
        );
        
        if (dummyClasses.length > 0) {
            console.log('  🚨 DUMMY CLASSES FOUND:');
            dummyClasses.forEach(cls => {
                console.log(`    - ID ${cls.id_kelas}: ${cls.nama_kelas} (${cls.tingkat})`);
            });
        } else {
            console.log('  ✅ No dummy classes found');
        }
        
        // 6. Final Summary
        console.log('\n📊 CLEANUP VERIFICATION SUMMARY:');
        console.log(`- Users: ${users.length} (${dummyUsers.length} dummy)`);
        console.log(`- Students: ${students.length} (${dummyStudents.length} dummy)`);
        console.log(`- Teachers: ${teachers.length} (${dummyTeachers.length} dummy)`);
        console.log(`- Subjects: ${subjects.length} (${dummySubjects.length} dummy)`);
        console.log(`- Classes: ${classes.length} (${dummyClasses.length} dummy)`);
        
        const totalDummy = dummyUsers.length + dummyStudents.length + dummyTeachers.length + dummySubjects.length + dummyClasses.length;
        
        if (totalDummy === 0) {
            console.log('\n🎉 SUCCESS: All dummy data has been cleaned up!');
            console.log('✅ Database is ready for production use.');
        } else {
            console.log(`\n⚠️  WARNING: ${totalDummy} dummy records still found.`);
            console.log('Consider running cleanup again or manual review.');
        }
        
        // 7. Show sample real data
        console.log('\n📋 SAMPLE REAL DATA:');
        console.log('\nUsers (first 5):');
        users.slice(0, 5).forEach(user => {
            console.log(`  - ${user.username} (${user.nama}) - ${user.role}`);
        });
        
        console.log('\nStudents (first 5):');
        students.slice(0, 5).forEach(student => {
            console.log(`  - ${student.nis} - ${student.nama} (${student.nama_pengguna})`);
        });
        
        console.log('\nTeachers (first 5):');
        teachers.slice(0, 5).forEach(teacher => {
            console.log(`  - ${teacher.nip} - ${teacher.nama}`);
        });
        
    } catch (error) {
        console.error('❌ Error during verification:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

verifyCleanup();
