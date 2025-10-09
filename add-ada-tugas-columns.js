const mysql = require('mysql2/promise');

async function addAdaTugasColumns() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });

        console.log('🔗 Connected to database');

        // Add ada_tugas column
        await connection.execute(`
            ALTER TABLE absensi_siswa 
            ADD COLUMN ada_tugas BOOLEAN DEFAULT FALSE COMMENT 'Status ada tugas'
        `);
        console.log('✅ Added ada_tugas column');

        // Add terlambat column
        await connection.execute(`
            ALTER TABLE absensi_siswa 
            ADD COLUMN terlambat BOOLEAN DEFAULT FALSE COMMENT 'Status terlambat'
        `);
        console.log('✅ Added terlambat column');

        console.log('🎉 Successfully added columns to absensi_siswa table');

    } catch (error) {
        console.error('❌ Error adding columns:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

addAdaTugasColumns();
