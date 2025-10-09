// Migration Runner Script v2
import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';

const runMigration = async () => {
    let connection;
    
    try {
        console.log('🚀 Starting database migration v2...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13',
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Connected to database');
        
        // Read migration file
        const migrationSQL = await fs.readFile('migrations/002_create_users_and_migrate_from_pengguna.sql', 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
                    const [result] = await connection.execute(statement);
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                    
                    // Log result if it's a SELECT statement
                    if (statement.trim().toUpperCase().startsWith('SELECT')) {
                        console.log('📊 Result:', result);
                    }
                } catch (error) {
                    console.error(`❌ Error in statement ${i + 1}:`, error.message);
                    // Continue with next statement for non-critical errors
                    if (error.code === 'ER_DUP_KEYNAME') {
                        console.log('⚠️ Index already exists, continuing...');
                    } else if (error.code === 'ER_DUP_ENTRY') {
                        console.log('⚠️ Duplicate entry, continuing...');
                    } else if (error.code === 'ER_DUP_KEYNAME') {
                        console.log('⚠️ Duplicate key name, continuing...');
                    } else {
                        throw error;
                    }
                }
            }
        }
        
        console.log('🎉 Migration completed successfully!');
        
        // Final verification
        console.log('\n📊 Final verification:');
        const [users] = await connection.execute('SELECT role, COUNT(*) as count FROM users GROUP BY role');
        console.log('Users by role:', users);
        
        const [guruUsers] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM guru g 
            JOIN users u ON g.user_id = u.id
        `);
        console.log('Guru with user accounts:', guruUsers[0].count);
        
        const [siswaUsers] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM siswa s 
            JOIN users u ON s.user_id = u.id
        `);
        console.log('Siswa with user accounts:', siswaUsers[0].count);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
};

runMigration();
