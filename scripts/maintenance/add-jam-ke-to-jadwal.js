import mysql from 'mysql2/promise';

async function addJamKeToJadwal() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'absenta13'
    });

    console.log('✅ Connected to database');

    // Check if jam_ke column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jadwal' AND COLUMN_NAME = 'jam_ke'
    `, [process.env.DB_NAME || 'absenta13']);

    if (columns.length > 0) {
      console.log('⚠️ Column jam_ke already exists in jadwal table');
      return;
    }

    // Add jam_ke column to jadwal table
    await connection.execute(`
      ALTER TABLE jadwal 
      ADD COLUMN jam_ke INT(11) NOT NULL DEFAULT 1 AFTER hari
    `);

    console.log('✅ Added jam_ke column to jadwal table');

    // Update existing records with default jam_ke values
    const [existingRecords] = await connection.execute('SELECT id_jadwal FROM jadwal');
    
    if (existingRecords.length > 0) {
      console.log(`📊 Found ${existingRecords.length} existing records, updating jam_ke values...`);
      
      for (let i = 0; i < existingRecords.length; i++) {
        const jamKe = (i % 9) + 1; // Assign jam_ke from 1 to 9
        await connection.execute(
          'UPDATE jadwal SET jam_ke = ? WHERE id_jadwal = ?',
          [jamKe, existingRecords[i].id_jadwal]
        );
      }
      
      console.log('✅ Updated existing records with jam_ke values');
    }

    // Verify the column was added
    const [verifyColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jadwal' AND COLUMN_NAME = 'jam_ke'
    `, [process.env.DB_NAME || 'absenta13']);

    if (verifyColumns.length > 0) {
      console.log('✅ Verification successful:');
      console.log('   Column:', verifyColumns[0].COLUMN_NAME);
      console.log('   Type:', verifyColumns[0].DATA_TYPE);
      console.log('   Nullable:', verifyColumns[0].IS_NULLABLE);
      console.log('   Default:', verifyColumns[0].COLUMN_DEFAULT);
    }

    // Show sample data
    const [sampleData] = await connection.execute(`
      SELECT id_jadwal, kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai, status
      FROM jadwal 
      ORDER BY id_jadwal 
      LIMIT 5
    `);

    console.log('\n📋 Sample jadwal data with jam_ke:');
    console.table(sampleData);

  } catch (error) {
    console.error('❌ Error adding jam_ke column:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
addJamKeToJadwal();
