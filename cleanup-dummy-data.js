// Cleanup Dummy Data from Database
import 'dotenv/config';
import mysql from 'mysql2/promise';

const cleanupDummyData = async () => {
    let connection;
    
    try {
        console.log('🧹 Starting dummy data cleanup...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // Start transaction
        await connection.beginTransaction();
        
        try {
            // 1. Clean up dummy users
            console.log('👥 Cleaning up dummy users...');
            
            // Delete test_guru user (ID 1) - but keep admin
            const [deleteTestGuru] = await connection.execute(
                'DELETE FROM users WHERE id = 1 AND username = "test_guru"'
            );
            console.log(`  Deleted test_guru user: ${deleteTestGuru.affectedRows} row(s)`);
            
            // Delete test student user (ID 202) - Citra Wulandari Test Update 3
            const [deleteTestStudent1] = await connection.execute(
                'DELETE FROM users WHERE id = 202 AND username = "perwakilan2002"'
            );
            console.log(`  Deleted test student user (perwakilan2002): ${deleteTestStudent1.affectedRows} row(s)`);
            
            // Delete test student user (ID 238) - Siswa Test
            const [deleteTestStudent2] = await connection.execute(
                'DELETE FROM users WHERE id = 238 AND username LIKE "siswa_test_%"'
            );
            console.log(`  Deleted test student user (siswa_test_*): ${deleteTestStudent2.affectedRows} row(s)`);
            
            // 2. Clean up dummy students
            console.log('\n👨‍🎓 Cleaning up dummy students...');
            
            // Delete test student record (ID 3) - Citra Wulandari Test Update 3
            const [deleteTestStudentRecord1] = await connection.execute(
                'DELETE FROM siswa WHERE id = 3 AND nama LIKE "%Test Update%"'
            );
            console.log(`  Deleted test student record (Citra Wulandari Test Update 3): ${deleteTestStudentRecord1.affectedRows} row(s)`);
            
            // 3. Clean up dummy subjects
            console.log('\n📚 Cleaning up dummy subjects...');
            
            // Delete test subjects
            const [deleteTestSubjects] = await connection.execute(
                'DELETE FROM mapel WHERE kode_mapel LIKE "TEST%" OR nama_mapel LIKE "%Test%"'
            );
            console.log(`  Deleted test subjects: ${deleteTestSubjects.affectedRows} row(s)`);
            
            // 4. Clean up dummy teachers (if any)
            console.log('\n👨‍🏫 Checking for dummy teachers...');
            
            // Check if there are any test teachers
            const [testTeachers] = await connection.execute(
                'SELECT id, nama FROM guru WHERE nama LIKE "%Test%" OR nama LIKE "%Dummy%"'
            );
            
            if (testTeachers.length > 0) {
                console.log(`  Found ${testTeachers.length} test teachers:`);
                testTeachers.forEach(teacher => {
                    console.log(`    - ID ${teacher.id}: ${teacher.nama}`);
                });
                
                const [deleteTestTeachers] = await connection.execute(
                    'DELETE FROM guru WHERE nama LIKE "%Test%" OR nama LIKE "%Dummy%"'
                );
                console.log(`  Deleted test teachers: ${deleteTestTeachers.affectedRows} row(s)`);
            } else {
                console.log('  No test teachers found');
            }
            
            // 5. Clean up any orphaned records
            console.log('\n🔗 Cleaning up orphaned records...');
            
            // Delete students without corresponding users
            const [orphanedStudents] = await connection.execute(`
                DELETE FROM siswa 
                WHERE user_id NOT IN (SELECT id FROM users)
            `);
            console.log(`  Deleted orphaned student records: ${orphanedStudents.affectedRows} row(s)`);
            
            // Delete teachers without corresponding users
            const [orphanedTeachers] = await connection.execute(`
                DELETE FROM guru 
                WHERE user_id NOT IN (SELECT id FROM users)
            `);
            console.log(`  Deleted orphaned teacher records: ${orphanedTeachers.affectedRows} row(s)`);
            
            // 6. Reset auto-increment values for clean IDs
            console.log('\n🔄 Resetting auto-increment values...');
            
            // Reset users table auto-increment
            const [maxUserId] = await connection.execute('SELECT MAX(id) as max_id FROM users');
            const nextUserId = (maxUserId[0].max_id || 0) + 1;
            await connection.execute(`ALTER TABLE users AUTO_INCREMENT = ${nextUserId}`);
            console.log(`  Reset users auto-increment to ${nextUserId}`);
            
            // Reset siswa table auto-increment
            const [maxSiswaId] = await connection.execute('SELECT MAX(id) as max_id FROM siswa');
            const nextSiswaId = (maxSiswaId[0].max_id || 0) + 1;
            await connection.execute(`ALTER TABLE siswa AUTO_INCREMENT = ${nextSiswaId}`);
            console.log(`  Reset siswa auto-increment to ${nextSiswaId}`);
            
            // Reset guru table auto-increment
            const [maxGuruId] = await connection.execute('SELECT MAX(id) as max_id FROM guru');
            const nextGuruId = (maxGuruId[0].max_id || 0) + 1;
            await connection.execute(`ALTER TABLE guru AUTO_INCREMENT = ${nextGuruId}`);
            console.log(`  Reset guru auto-increment to ${nextGuruId}`);
            
            // Reset mapel table auto-increment
            const [maxMapelId] = await connection.execute('SELECT MAX(id_mapel) as max_id FROM mapel');
            const nextMapelId = (maxMapelId[0].max_id || 0) + 1;
            await connection.execute(`ALTER TABLE mapel AUTO_INCREMENT = ${nextMapelId}`);
            console.log(`  Reset mapel auto-increment to ${nextMapelId}`);
            
            // Commit transaction
            await connection.commit();
            console.log('\n✅ Cleanup completed successfully!');
            
            // 7. Show final summary
            console.log('\n📊 FINAL SUMMARY:');
            
            const [finalUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
            const [finalStudents] = await connection.execute('SELECT COUNT(*) as count FROM siswa');
            const [finalTeachers] = await connection.execute('SELECT COUNT(*) as count FROM guru');
            const [finalSubjects] = await connection.execute('SELECT COUNT(*) as count FROM mapel');
            const [finalClasses] = await connection.execute('SELECT COUNT(*) as count FROM kelas');
            
            console.log(`- Users: ${finalUsers[0].count} (cleaned)`);
            console.log(`- Students: ${finalStudents[0].count} (cleaned)`);
            console.log(`- Teachers: ${finalTeachers[0].count} (cleaned)`);
            console.log(`- Subjects: ${finalSubjects[0].count} (cleaned)`);
            console.log(`- Classes: ${finalClasses[0].count} (unchanged)`);
            
            console.log('\n🎉 Database cleanup completed successfully!');
            console.log('⚠️  Remember to restart the server to clear any cached data.');
            
        } catch (error) {
            await connection.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

cleanupDummyData();
