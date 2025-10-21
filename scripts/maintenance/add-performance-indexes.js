import mysql from 'mysql2/promise';

async function addPerformanceIndexes() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });

        console.log('🔗 Connected to database');
        console.log('🔧 Adding performance indexes...\n');

        const indexes = [
            {
                name: 'idx_absensi_siswa_waktu_absen',
                table: 'absensi_siswa',
                column: 'waktu_absen',
                sql: 'CREATE INDEX idx_absensi_siswa_waktu_absen ON absensi_siswa(waktu_absen)'
            },
            {
                name: 'idx_absensi_siswa_jadwal_waktu',
                table: 'absensi_siswa',
                column: 'jadwal_id, waktu_absen',
                sql: 'CREATE INDEX idx_absensi_siswa_jadwal_waktu ON absensi_siswa(jadwal_id, waktu_absen)'
            },
            {
                name: 'idx_absensi_siswa_siswa_waktu',
                table: 'absensi_siswa',
                column: 'siswa_id, waktu_absen',
                sql: 'CREATE INDEX idx_absensi_siswa_siswa_waktu ON absensi_siswa(siswa_id, waktu_absen)'
            },
            {
                name: 'idx_jadwal_guru_jadwal_guru_status',
                table: 'jadwal_guru',
                column: 'jadwal_id, guru_id, status',
                sql: 'CREATE INDEX idx_jadwal_guru_jadwal_guru_status ON jadwal_guru(jadwal_id, guru_id, status)'
            }
        ];

        let successCount = 0;
        let skipCount = 0;

        for (const index of indexes) {
            try {
                // Check if index already exists
                const [existingIndexes] = await connection.query(
                    `SHOW INDEX FROM ${index.table} WHERE Key_name = ?`,
                    [index.name]
                );

                if (existingIndexes.length > 0) {
                    console.log(`⏭️  Index ${index.name} already exists - skipped`);
                    skipCount++;
                    continue;
                }

                // Create index
                await connection.query(index.sql);
                console.log(`✅ Created index: ${index.name} on ${index.table}(${index.column})`);
                successCount++;

            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    console.log(`⏭️  Index ${index.name} already exists - skipped`);
                    skipCount++;
                } else {
                    console.error(`❌ Error creating index ${index.name}:`, error.message);
                }
            }
        }

        console.log('\n📊 Summary:');
        console.log(`  ✅ Created: ${successCount} indexes`);
        console.log(`  ⏭️  Skipped: ${skipCount} indexes (already exist)`);
        console.log(`  📝 Total: ${indexes.length} indexes processed`);

        // Show current indexes on absensi_siswa table
        console.log('\n📋 Current indexes on absensi_siswa:');
        const [currentIndexes] = await connection.query('SHOW INDEX FROM absensi_siswa');
        console.log('='.repeat(80));
        console.log('Key Name'.padEnd(40), 'Column Name'.padEnd(20), 'Non Unique');
        console.log('='.repeat(80));
        currentIndexes.forEach(idx => {
            console.log(
                idx.Key_name.padEnd(40),
                idx.Column_name.padEnd(20),
                idx.Non_unique
            );
        });
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

addPerformanceIndexes();


