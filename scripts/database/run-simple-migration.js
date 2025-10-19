// Simple Migration Runner
import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';

const runSimpleMigration = async () => {
    let connection;
    
    try {
        console.log('🚀 Starting simple migration...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13',
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Connected to database');
        
        // Step 1: Create users table
        console.log('⏳ Creating users table...');
        const createUsersSQL = await fs.readFile('migrations/003_create_users_simple.sql', 'utf8');
        await connection.execute(createUsersSQL);
        console.log('✅ Users table created');
        
        // Step 2: Migrate data from pengguna to users
        console.log('⏳ Migrating data from pengguna to users...');
        await connection.execute(`
            INSERT INTO users (id, username, password, role, nama, email, status, created_at, updated_at)
            SELECT 
                id,
                nama_pengguna,
                kata_sandi,
                peran,
                nama,
                email,
                status,
                dibuat_pada,
                diperbarui_pada
            FROM pengguna
            ON DUPLICATE KEY UPDATE
                username = VALUES(username),
                password = VALUES(password),
                role = VALUES(role),
                nama = VALUES(nama),
                email = VALUES(email),
                status = VALUES(status),
                updated_at = NOW()
        `);
        console.log('✅ Data migrated from pengguna to users');
        
        // Step 3: Add user_id column to guru table
        console.log('⏳ Adding user_id column to guru table...');
        try {
            await connection.execute('ALTER TABLE guru ADD COLUMN user_id int(11) NULL AFTER id_pengguna');
            console.log('✅ user_id column added to guru table');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ user_id column already exists in guru table');
            } else {
                throw error;
            }
        }
        
        // Step 4: Update guru user_id
        console.log('⏳ Updating guru user_id...');
        await connection.execute('UPDATE guru SET user_id = id_pengguna WHERE user_id IS NULL');
        console.log('✅ guru user_id updated');
        
        // Step 5: Add user_id column to siswa table
        console.log('⏳ Adding user_id column to siswa table...');
        try {
            await connection.execute('ALTER TABLE siswa ADD COLUMN user_id int(11) NULL AFTER id_pengguna');
            console.log('✅ user_id column added to siswa table');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ user_id column already exists in siswa table');
            } else {
                throw error;
            }
        }
        
        // Step 6: Update siswa user_id
        console.log('⏳ Updating siswa user_id...');
        await connection.execute('UPDATE siswa SET user_id = id_pengguna WHERE user_id IS NULL');
        console.log('✅ siswa user_id updated');
        
        // Step 7: Create indexes
        console.log('⏳ Creating indexes...');
        try {
            await connection.execute('CREATE INDEX idx_users_username ON users(username)');
            await connection.execute('CREATE INDEX idx_users_role ON users(role)');
            await connection.execute('CREATE INDEX idx_users_status ON users(status)');
            await connection.execute('CREATE INDEX idx_guru_user_id ON guru(user_id)');
            await connection.execute('CREATE INDEX idx_siswa_user_id ON siswa(user_id)');
            console.log('✅ Indexes created');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️ Some indexes already exist, continuing...');
            } else {
                throw error;
            }
        }
        
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
        
        console.log('🎉 Migration completed successfully!');
        
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

runSimpleMigration();
