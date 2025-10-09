import mysql from 'mysql2/promise';

const checkSchedules = async () => {
  const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'absenta13'
  });

  try {
    console.log('🔍 Checking schedules in database...');
    
    const [rows] = await db.execute(`
      SELECT hari, jam_ke, jam_mulai, jam_selesai 
      FROM jadwal 
      WHERE hari = 'Senin' AND jam_ke = 1 
      LIMIT 3
    `);
    
    console.log('Sample schedules from DB:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.hari} - Jam ${row.jam_ke} (${row.jam_mulai} - ${row.jam_selesai})`);
    });
    
    // Check all jam_ke for Senin
    const [allRows] = await db.execute(`
      SELECT DISTINCT jam_ke, jam_mulai, jam_selesai 
      FROM jadwal 
      WHERE hari = 'Senin' 
      ORDER BY jam_ke
    `);
    
    console.log('\nAll jam_ke for Senin:');
    allRows.forEach(row => {
      console.log(`Jam ${row.jam_ke}: ${row.jam_mulai} - ${row.jam_selesai}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.end();
  }
};

checkSchedules();

