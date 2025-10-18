// Check kolom siswa table
import mysql from 'mysql2/promise';

async function checkColumns() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('🔍 Checking siswa table columns...');
        
        const [columns] = await connection.execute("DESCRIBE siswa");
        console.log('📋 Siswa columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        
        // Test different ORDER BY options
        console.log('\n🔍 Testing ORDER BY options...');
        
        try {
            const [test1] = await connection.execute("SELECT * FROM siswa ORDER BY created_at DESC LIMIT 1");
            console.log('✅ ORDER BY created_at works');
        } catch (e) {
            console.log('❌ ORDER BY created_at failed:', e.message);
        }
        
        try {
            const [test2] = await connection.execute("SELECT * FROM siswa ORDER BY dibuat_pada DESC LIMIT 1");
            console.log('✅ ORDER BY dibuat_pada works');
        } catch (e) {
            console.log('❌ ORDER BY dibuat_pada failed:', e.message);
        }
        
        try {
            const [test3] = await connection.execute("SELECT * FROM siswa ORDER BY id DESC LIMIT 1");
            console.log('✅ ORDER BY id works');
        } catch (e) {
            console.log('❌ ORDER BY id failed:', e.message);
        }
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkColumns();
