import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'absenta13',
    port: 3306
};

async function migrateSiswaPerwakilan() {
    let connection;
    
    try {
        console.log('🔄 Starting migration of siswa_perwakilan to pengguna...');
        connection = await mysql.createConnection(dbConfig);
        
        // 1. Check current data in siswa_perwakilan
        console.log('\n📊 Checking current data in siswa_perwakilan...');
        const [siswaData] = await connection.execute('SELECT * FROM siswa_perwakilan');
        console.log(`Found ${siswaData.length} records in siswa_perwakilan`);
        
        if (siswaData.length === 0) {
            console.log('✅ No data to migrate');
            return;
        }
        
        // 2. Check current data in pengguna
        console.log('\n📊 Checking current data in pengguna...');
        const [penggunaData] = await connection.execute('SELECT * FROM pengguna WHERE peran = "siswa"');
        console.log(`Found ${penggunaData.length} existing siswa records in pengguna`);
        
        // 3. Migrate data
        console.log('\n🔄 Starting migration...');
        let migratedCount = 0;
        let skippedCount = 0;
        
        for (const siswa of siswaData) {
            try {
                // Check if user already exists
                const [existingUser] = await connection.execute(
                    'SELECT id FROM pengguna WHERE nama_pengguna = ?',
                    [siswa.username]
                );
                
                if (existingUser.length > 0) {
                    console.log(`⚠️ User ${siswa.username} already exists, skipping...`);
                    skippedCount++;
                    continue;
                }
                
                // Insert into pengguna table
                await connection.execute(
                    `INSERT INTO pengguna (nama_pengguna, kata_sandi, peran, nama, email, status, dibuat_pada, diperbarui_pada) 
                     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                    [
                        siswa.username,
                        '$2b$10$example', // Default password, will be updated on first login
                        'siswa',
                        siswa.nama,
                        siswa.email || `${siswa.username}@smkn13bandung.sch.id`,
                        siswa.status || 'aktif'
                    ]
                );
                
                console.log(`✅ Migrated: ${siswa.username} (${siswa.nama})`);
                migratedCount++;
                
            } catch (error) {
                console.error(`❌ Error migrating ${siswa.username}:`, error.message);
            }
        }
        
        console.log(`\n📊 Migration Summary:`);
        console.log(`✅ Migrated: ${migratedCount} records`);
        console.log(`⚠️ Skipped: ${skippedCount} records`);
        console.log(`📋 Total processed: ${migratedCount + skippedCount} records`);
        
        // 4. Verify migration
        console.log('\n🔍 Verifying migration...');
        const [newPenggunaData] = await connection.execute('SELECT * FROM pengguna WHERE peran = "siswa"');
        console.log(`Total siswa records in pengguna after migration: ${newPenggunaData.length}`);
        
        // 5. Show sample migrated data
        if (newPenggunaData.length > 0) {
            console.log('\n📋 Sample migrated data:');
            newPenggunaData.slice(0, 3).forEach(user => {
                console.log(`  - ${user.nama_pengguna}: ${user.nama} (${user.peran})`);
            });
        }
        
        console.log('\n✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

migrateSiswaPerwakilan();
