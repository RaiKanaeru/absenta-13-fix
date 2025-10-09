import mysql from 'mysql2/promise';

async function checkClasses() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });
    console.log('✅ Database connected successfully');

    // Get all active classes
    console.log('📚 Checking available classes...');
    const [rows] = await connection.execute(`
      SELECT id_kelas, nama_kelas, tingkat 
      FROM kelas 
      WHERE status = 'aktif' 
      ORDER BY tingkat, nama_kelas
    `);
    
    console.log(`\n📊 Found ${rows.length} active classes:`);
    console.log('=' .repeat(50));
    
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nama_kelas} (ID: ${row.id_kelas}, Tingkat: ${row.tingkat})`);
    });
    
    // Check specifically for KA classes
    console.log('\n🔍 Checking for KA classes:');
    console.log('=' .repeat(30));
    
    const kaClasses = rows.filter(row => 
      row.nama_kelas.toUpperCase().includes('KA') || 
      row.nama_kelas.toUpperCase().includes('KEJURUAN')
    );
    
    if (kaClasses.length > 0) {
      kaClasses.forEach(row => {
        console.log(`✅ Found: ${row.nama_kelas} (ID: ${row.id_kelas})`);
      });
    } else {
      console.log('❌ No KA classes found');
    }
    
    // Check for XI classes
    console.log('\n🔍 Checking for XI classes:');
    console.log('=' .repeat(30));
    
    const xiClasses = rows.filter(row => 
      row.tingkat === 'XI' || 
      row.nama_kelas.toUpperCase().includes('XI')
    );
    
    if (xiClasses.length > 0) {
      xiClasses.forEach(row => {
        console.log(`✅ Found: ${row.nama_kelas} (ID: ${row.id_kelas})`);
      });
    } else {
      console.log('❌ No XI classes found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

checkClasses().catch(console.error);

