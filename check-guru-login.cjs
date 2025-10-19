const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function checkGuruLogin() {
    console.log('🔍 Checking guru login issues...');
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        console.log('✅ Connected to database');

        // Check guru1 account
        console.log('\n📋 Checking guru1 account:');
        const [guru1] = await connection.execute(
            'SELECT id, username, role, status, password FROM users WHERE username = ?',
            ['guru1']
        );
        
        if (guru1.length > 0) {
            const account = guru1[0];
            console.log(`- Username: ${account.username}`);
            console.log(`- Role: ${account.role}`);
            console.log(`- Status: ${account.status}`);
            console.log(`- Password hash: ${account.password.substring(0, 20)}...`);
            
            // Test password
            const isPasswordValid = await bcrypt.compare('password123', account.password);
            console.log(`- Password valid: ${isPasswordValid}`);
        } else {
            console.log('❌ guru1 account not found');
        }

        // Check all guru accounts
        console.log('\n👨‍🏫 All guru accounts:');
        const [allGuru] = await connection.execute(
            'SELECT username, role, status FROM users WHERE role = "GURU" ORDER BY username LIMIT 10'
        );
        allGuru.forEach(g => console.log(`- ${g.username}: ${g.role} (${g.status})`));

        // Check if there are any working guru accounts
        console.log('\n🧪 Testing password for guru accounts...');
        const [testAccounts] = await connection.execute(
            'SELECT username, password FROM users WHERE role = "GURU" AND status = "aktif" LIMIT 3'
        );
        
        for (const account of testAccounts) {
            const isPasswordValid = await bcrypt.compare('password123', account.password);
            console.log(`- ${account.username}: password123 valid = ${isPasswordValid}`);
        }

        // Create a working guru account if needed
        console.log('\n🔧 Creating working guru account...');
        try {
            // Check if guru1 exists and fix it
            const [existing] = await connection.execute(
                'SELECT id FROM users WHERE username = ?',
                ['guru1']
            );
            
            if (existing.length > 0) {
                // Update existing account
                const hashedPassword = await bcrypt.hash('password123', 10);
                await connection.execute(
                    'UPDATE users SET password = ?, role = ?, status = ? WHERE username = ?',
                    [hashedPassword, 'GURU', 'aktif', 'guru1']
                );
                console.log('✅ Updated guru1 account');
            } else {
                // Create new account
                const hashedPassword = await bcrypt.hash('password123', 10);
                await connection.execute(
                    'INSERT INTO users (username, password, role, nama, status) VALUES (?, ?, ?, ?, ?)',
                    ['guru1', hashedPassword, 'GURU', 'Guru Test 1', 'aktif']
                );
                console.log('✅ Created guru1 account');
            }
        } catch (error) {
            console.log('❌ Error creating/updating guru1:', error.message);
        }

        // Final verification
        console.log('\n✅ Final verification:');
        const [finalCheck] = await connection.execute(
            'SELECT username, role, status FROM users WHERE username = ?',
            ['guru1']
        );
        
        if (finalCheck.length > 0) {
            const account = finalCheck[0];
            console.log(`- Username: ${account.username}`);
            console.log(`- Role: ${account.role}`);
            console.log(`- Status: ${account.status}`);
            
            // Test password one more time
            const [passwordCheck] = await connection.execute(
                'SELECT password FROM users WHERE username = ?',
                ['guru1']
            );
            const isPasswordValid = await bcrypt.compare('password123', passwordCheck[0].password);
            console.log(`- Password test: ${isPasswordValid}`);
        }

    } catch (error) {
        console.error('❌ Error checking guru login:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkGuruLogin();
