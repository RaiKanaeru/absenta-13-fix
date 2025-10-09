/**
 * Check Existing Data
 * 
 * Cek data yang sudah ada di database untuk testing
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    port: process.env.DB_PORT || 3306
};

async function checkExistingData() {
    let connection;
    
    try {
        console.log('🔍 Checking existing data in database...');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');
        
        // Check existing teachers
        const [teachers] = await connection.execute('SELECT id_guru, nama_pengguna, nama FROM guru LIMIT 5');
        console.log('\n👨‍🏫 Existing teachers:');
        teachers.forEach(teacher => {
            console.log(`   ID: ${teacher.id_guru}, Username: ${teacher.nama_pengguna}, Name: ${teacher.nama}`);
        });
        
        // Check existing students
        const [students] = await connection.execute('SELECT id_siswa, nis, nama FROM siswa LIMIT 5');
        console.log('\n👨‍🎓 Existing students:');
        students.forEach(student => {
            console.log(`   ID: ${student.id_siswa}, NIS: ${student.nis}, Name: ${student.nama}`);
        });
        
        // Check existing schedules
        const [schedules] = await connection.execute('SELECT id_jadwal, kelas_id, mapel_id, guru_id FROM jadwal LIMIT 5');
        console.log('\n📅 Existing schedules:');
        schedules.forEach(schedule => {
            console.log(`   ID: ${schedule.id_jadwal}, Class: ${schedule.kelas_id}, Subject: ${schedule.mapel_id}, Teacher: ${schedule.guru_id}`);
        });
        
        // Check existing classes
        const [classes] = await connection.execute('SELECT id_kelas, nama_kelas FROM kelas LIMIT 5');
        console.log('\n🏫 Existing classes:');
        classes.forEach(cls => {
            console.log(`   ID: ${cls.id_kelas}, Name: ${cls.nama_kelas}`);
        });
        
        // Check existing subjects
        const [subjects] = await connection.execute('SELECT id_mapel, nama_mapel FROM mapel LIMIT 5');
        console.log('\n📚 Existing subjects:');
        subjects.forEach(subject => {
            console.log(`   ID: ${subject.id_mapel}, Name: ${subject.nama_mapel}`);
        });
        
        // Check existing attendance records
        const [attendance] = await connection.execute('SELECT id, siswa_id, jadwal_id, tanggal, status FROM absensi_siswa LIMIT 5');
        console.log('\n📝 Existing attendance records:');
        attendance.forEach(record => {
            console.log(`   ID: ${record.id}, Student: ${record.siswa_id}, Schedule: ${record.jadwal_id}, Date: ${record.tanggal}, Status: ${record.status}`);
        });
        
    } catch (error) {
        console.error('❌ Check failed:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run check
if (require.main === module) {
    checkExistingData()
        .then(() => {
            console.log('\n✅ Data check completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Data check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkExistingData };










