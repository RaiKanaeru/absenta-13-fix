const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createGuruLoginAccounts() {
    console.log('👨‍🏫 Creating guru login accounts...');
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        console.log('✅ Connected to database');

        // Get teachers without user accounts
        const [teachersWithoutAccounts] = await connection.execute(`
            SELECT g.id_guru, g.nama, g.email
            FROM guru g
            LEFT JOIN users u ON g.id_guru = u.guru_id
            WHERE u.guru_id IS NULL
            LIMIT 10
        `);

        console.log(`📋 Teachers without accounts: ${teachersWithoutAccounts.length}`);
        
        if (teachersWithoutAccounts.length > 0) {
            console.log('👨‍🏫 Creating accounts for teachers:');
            
            for (const teacher of teachersWithoutAccounts) {
                try {
                    const username = `guru${teacher.id_guru}`;
                    const hashedPassword = await bcrypt.hash('password123', 10);
                    
                    await connection.execute(
                        'INSERT INTO users (username, password, role, nama, email, guru_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [username, hashedPassword, 'GURU', teacher.nama, teacher.email, teacher.id_guru, 'aktif']
                    );
                    
                    console.log(`✅ Created account: ${username} for ${teacher.nama}`);
                } catch (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        console.log(`ℹ️ Account for ${teacher.nama} already exists`);
                    } else {
                        console.log(`❌ Error creating account for ${teacher.nama}:`, error.message);
                    }
                }
            }
        } else {
            console.log('✅ All teachers already have accounts');
        }

        // Create some test teacher accounts with specific credentials
        console.log('\n🧪 Creating test teacher accounts...');
        const testAccounts = [
            { username: 'guru1', password: 'password123', nama: 'Guru Test 1', email: 'guru1@test.com' },
            { username: 'guru2', password: 'password123', nama: 'Guru Test 2', email: 'guru2@test.com' },
            { username: 'guru3', password: 'password123', nama: 'Guru Test 3', email: 'guru3@test.com' }
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
                        'INSERT INTO users (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
                        [account.username, hashedPassword, 'GURU', account.nama, account.email, 'aktif']
                    );
                    console.log(`✅ Created test account: ${account.username} (password: ${account.password})`);
                } else {
                    console.log(`ℹ️ Test account ${account.username} already exists`);
                }
            } catch (error) {
                console.log(`❌ Error creating test account ${account.username}:`, error.message);
            }
        }

        // Show all teacher accounts
        console.log('\n📋 All teacher accounts:');
        const [allTeachers] = await connection.execute(`
            SELECT u.username, u.nama, u.email, g.nama as guru_nama
            FROM users u
            LEFT JOIN guru g ON u.guru_id = g.id_guru
            WHERE u.role = 'GURU'
            ORDER BY u.username
            LIMIT 15
        `);
        
        allTeachers.forEach(teacher => {
            console.log(`- Username: ${teacher.username}, Name: ${teacher.nama || teacher.guru_nama}, Email: ${teacher.email}`);
        });

        console.log('\n🎉 Guru login accounts setup completed!');
        console.log('\n📝 Login credentials for testing:');
        console.log('- Username: guru1, Password: password123');
        console.log('- Username: guru2, Password: password123');
        console.log('- Username: guru3, Password: password123');

    } catch (error) {
        console.error('❌ Error creating guru login accounts:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createGuruLoginAccounts();
