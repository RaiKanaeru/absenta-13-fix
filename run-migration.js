// Migration Runner Script
import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';

const runMigration = async () => {
    let connection;
    
    try {
        console.log('🚀 Starting database migration...');
        
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
        const migrationSQL = await fs.readFile('migrations/001_restore_users_and_migrate_students.sql', 'utf8');
        
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
        
        const [students] = await connection.execute('SELECT COUNT(*) as count FROM siswa_perwakilan');
        console.log('Students in siswa_perwakilan:', students[0].count);
        
        const [integrity] = await connection.execute(`
            SELECT COUNT(*) as missing_users
            FROM siswa_perwakilan sp
            LEFT JOIN users u ON u.id = sp.user_id
            WHERE u.id IS NULL
        `);
        console.log('Missing user accounts:', integrity[0].missing_users);
        
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
