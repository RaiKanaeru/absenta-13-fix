// Check Correct Database Structure
import 'dotenv/config';
import mysql from 'mysql2/promise';

const checkCorrectStructure = async () => {
    let connection;
    
    try {
        console.log('🔍 Checking correct database structure...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13',
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Connected to database');
        
        // Check pengguna table structure
        const [penggunaStructure] = await connection.execute('DESCRIBE pengguna');
        console.log('\n👤 Pengguna table structure:');
        penggunaStructure.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Check siswa table structure
        const [siswaStructure] = await connection.execute('DESCRIBE siswa');
        console.log('\n👨‍🎓 Siswa table structure:');
        siswaStructure.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Check guru table structure
        const [guruStructure] = await connection.execute('DESCRIBE guru');
        console.log('\n👨‍🏫 Guru table structure:');
        guruStructure.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Check data counts
        const [penggunaCount] = await connection.execute('SELECT COUNT(*) as count FROM pengguna');
        const [siswaCount] = await connection.execute('SELECT COUNT(*) as count FROM siswa');
        const [guruCount] = await connection.execute('SELECT COUNT(*) as count FROM guru');
        
        console.log('\n📊 Data counts:');
        console.log(`- Pengguna: ${penggunaCount[0].count}`);
        console.log(`- Siswa: ${siswaCount[0].count}`);
        console.log(`- Guru: ${guruCount[0].count}`);
        
        // Check pengguna roles
        const [roles] = await connection.execute('SELECT peran, COUNT(*) as count FROM pengguna GROUP BY peran');
        console.log('\n👥 Pengguna by role:');
        roles.forEach(role => {
            console.log(`- ${role.peran}: ${role.count}`);
        });
        
        // Check if siswa is a view or table
        const [siswaType] = await connection.execute(`
            SELECT table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'absenta13' 
            AND table_name = 'siswa'
        `);
        
        console.log(`\n🔍 Siswa table type: ${siswaType[0].table_type}`);
        
        // Check foreign key relationships
        const [foreignKeys] = await connection.execute(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = 'absenta13' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY TABLE_NAME, COLUMN_NAME
        `);
        
        console.log('\n🔗 Foreign key relationships:');
        foreignKeys.forEach(fk => {
            console.log(`- ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
        });
        
    } catch (error) {
        console.error('❌ Error checking database:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
};

checkCorrectStructure();
