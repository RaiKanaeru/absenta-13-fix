const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function fixAllGuruAccounts() {
    console.log('🔧 Fixing all guru accounts...');
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        console.log('✅ Connected to database');

        // Get all guru accounts
        const [guruAccounts] = await connection.execute(
            'SELECT username, password FROM users WHERE role = "GURU" AND status = "aktif"'
        );
        
        console.log(`📋 Found ${guruAccounts.length} guru accounts to fix`);

        // Fix password for all guru accounts
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        for (const account of guruAccounts) {
            try {
                await connection.execute(
                    'UPDATE users SET password = ? WHERE username = ?',
                    [hashedPassword, account.username]
                );
                console.log(`✅ Fixed password for ${account.username}`);
            } catch (error) {
                console.log(`❌ Error fixing ${account.username}:`, error.message);
            }
        }

        // Create additional test accounts
        console.log('\n🧪 Creating additional test accounts...');
        const testAccounts = [
            { username: 'guru1', password: 'password123', nama: 'Guru Test 1' },
            { username: 'guru2', password: 'password123', nama: 'Guru Test 2' },
            { username: 'guru3', password: 'password123', nama: 'Guru Test 3' },
            { username: 'guru4', password: 'password123', nama: 'Guru Test 4' },
            { username: 'guru5', password: 'password123', nama: 'Guru Test 5' }
        ];

        for (const account of testAccounts) {
            try {
                // Check if account exists
                const [existing] = await connection.execute(
                    'SELECT id FROM users WHERE username = ?',
                    [account.username]
                );

                if (existing.length === 0) {
                    const hashedPassword = await bcrypt.hash(account.password, 10);
                    await connection.execute(
                        'INSERT INTO users (username, password, role, nama, status) VALUES (?, ?, ?, ?, ?)',
                        [account.username, hashedPassword, 'GURU', account.nama, 'aktif']
                    );
                    console.log(`✅ Created ${account.username}`);
                } else {
                    // Update existing account
                    const hashedPassword = await bcrypt.hash(account.password, 10);
                    await connection.execute(
                        'UPDATE users SET password = ?, role = ?, status = ? WHERE username = ?',
                        [hashedPassword, 'GURU', 'aktif', account.username]
                    );
                    console.log(`✅ Updated ${account.username}`);
                }
            } catch (error) {
                console.log(`❌ Error with ${account.username}:`, error.message);
            }
        }

        // Final verification
        console.log('\n✅ Final verification:');
        const [finalCheck] = await connection.execute(
            'SELECT username, role, status FROM users WHERE role = "GURU" AND status = "aktif" ORDER BY username LIMIT 10'
        );
        
        console.log('📋 Working guru accounts:');
        finalCheck.forEach(account => {
            console.log(`- ${account.username}: ${account.role} (${account.status})`);
        });

        // Test password for test accounts
        console.log('\n🧪 Testing passwords:');
        for (const account of testAccounts) {
            try {
                const [passwordCheck] = await connection.execute(
                    'SELECT password FROM users WHERE username = ?',
                    [account.username]
                );
                if (passwordCheck.length > 0) {
                    const isPasswordValid = await bcrypt.compare(account.password, passwordCheck[0].password);
                    console.log(`- ${account.username}: ${account.password} valid = ${isPasswordValid}`);
                }
            } catch (error) {
                console.log(`❌ Error testing ${account.username}:`, error.message);
            }
        }

        console.log('\n🎉 All guru accounts fixed!');
        console.log('\n📝 Login credentials:');
        testAccounts.forEach(acc => console.log(`- Username: ${acc.username} | Password: ${acc.password}`));

    } catch (error) {
        console.error('❌ Error fixing guru accounts:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixAllGuruAccounts();
