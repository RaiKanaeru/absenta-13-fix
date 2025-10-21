import mysql from 'mysql2/promise';

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

        // Check if columns already exist
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'absenta13' 
            AND TABLE_NAME = 'absensi_siswa' 
            AND COLUMN_NAME IN ('ada_tugas', 'terlambat')
        `);

        const existingColumns = columns.map(col => col.COLUMN_NAME);

        // Add ada_tugas column if not exists
        if (!existingColumns.includes('ada_tugas')) {
            await connection.execute(`
                ALTER TABLE absensi_siswa 
                ADD COLUMN ada_tugas BOOLEAN DEFAULT FALSE COMMENT 'Status ada tugas'
            `);
            console.log('✅ Added ada_tugas column');
        } else {
            console.log('ℹ️  Column ada_tugas already exists');
        }

        // Add terlambat column if not exists
        if (!existingColumns.includes('terlambat')) {
            await connection.execute(`
                ALTER TABLE absensi_siswa 
                ADD COLUMN terlambat BOOLEAN DEFAULT FALSE COMMENT 'Status terlambat'
            `);
            console.log('✅ Added terlambat column');
        } else {
            console.log('ℹ️  Column terlambat already exists');
        }

        console.log('🎉 Successfully processed columns in absensi_siswa table');

    } catch (error) {
        console.error('❌ Error adding columns:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

addAdaTugasColumns();
