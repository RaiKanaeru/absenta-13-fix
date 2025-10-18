// Script untuk mengecek tabel database
import mysql from 'mysql2/promise';

async function checkDatabase() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('🔍 Checking database tables...');
        
        // 1. Check if siswa table exists
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'siswa'"
        );
        console.log('📋 Siswa table exists:', tables.length > 0);
        
        // 2. Check siswa table structure
        const [columns] = await connection.execute(
            "DESCRIBE siswa"
        );
        console.log('📋 Siswa table columns:', columns.map(c => c.Field));
        
        // 3. Check siswa data count
        const [count] = await connection.execute(
            "SELECT COUNT(*) as total FROM siswa"
        );
        console.log('📊 Total siswa records:', count[0].total);
        
        // 4. Check sample siswa data
        const [sample] = await connection.execute(
            "SELECT * FROM siswa LIMIT 3"
        );
        console.log('📊 Sample siswa data:', sample);
        
        // 5. Check if users table exists
        const [usersTables] = await connection.execute(
            "SHOW TABLES LIKE 'users'"
        );
        console.log('📋 Users table exists:', usersTables.length > 0);
        
        // 6. Check users data count
        const [usersCount] = await connection.execute(
            "SELECT COUNT(*) as total FROM users"
        );
        console.log('📊 Total users records:', usersCount[0].total);
        
        // 7. Check kelas table
        const [kelasCount] = await connection.execute(
            "SELECT COUNT(*) as total FROM kelas"
        );
        console.log('📊 Total kelas records:', kelasCount[0].total);
        
        // 8. Test join query
        console.log('\n🔍 Testing join query...');
        const [joinTest] = await connection.execute(`
            SELECT s.*, k.nama_kelas, u.username, u.status as user_status
            FROM siswa s
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN users u ON s.id_pengguna = u.id
            LIMIT 3
        `);
        console.log('📊 Join test result:', joinTest);
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkDatabase();
