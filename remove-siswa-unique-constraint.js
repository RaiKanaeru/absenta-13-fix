import mysql from 'mysql2/promise';

async function removeSiswaUniqueConstraint() {
    console.log('🔄 Starting removal of UNIQUE constraint idx_siswa_user_id...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Adjust if needed
            database: 'absenta13'
        });

        console.log('✅ Connected to database');

        // Check current constraint
        console.log('📋 Checking current constraint...');
        const [constraints] = await connection.execute(
            `SHOW INDEX FROM siswa WHERE Key_name = 'idx_siswa_user_id'`
        );
        console.log(`Found ${constraints.length} constraint(s) with name idx_siswa_user_id`);

        if (constraints.length > 0) {
            // Remove UNIQUE constraint
            console.log('🔄 Removing UNIQUE constraint idx_siswa_user_id...');
            await connection.execute('ALTER TABLE siswa DROP INDEX idx_siswa_user_id');
            console.log('✅ UNIQUE constraint idx_siswa_user_id removed successfully');
        } else {
            console.log('ℹ️ No constraint found with name idx_siswa_user_id');
        }

        // Verify constraint is removed
        console.log('📋 Verifying constraint removal...');
        const [remainingConstraints] = await connection.execute(
            `SHOW INDEX FROM siswa WHERE Key_name = 'idx_siswa_user_id'`
        );
        console.log(`Remaining constraints: ${remainingConstraints.length}`);

        // Optional: Add regular index for performance
        console.log('🔄 Adding regular index for performance...');
        try {
            await connection.execute('CREATE INDEX idx_siswa_user_id_lookup ON siswa(user_id)');
            console.log('✅ Regular index added successfully');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️ Index already exists, skipping...');
            } else {
                throw error;
            }
        }

        // Test that multiple siswa can now share same user_id
        console.log('📋 Testing multiple siswa per user_id...');
        const [testResult] = await connection.execute(
            `SELECT user_id, COUNT(*) as siswa_count 
             FROM siswa 
             GROUP BY user_id 
             HAVING siswa_count > 1`
        );
        console.log(`Found ${testResult.length} user_id(s) with multiple siswa`);

        await connection.end();
        console.log('✅ Constraint removal completed successfully');
        
    } catch (error) {
        console.error('❌ Constraint removal failed:', error.message);
        process.exit(1);
    }
}

removeSiswaUniqueConstraint();
