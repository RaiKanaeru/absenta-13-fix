const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'absenta13',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkKeterangan() {
  try {
    console.log('🔍 Checking keterangan data for jadwal 1125 (Kimia)...');
    
    const [rows] = await db.execute('SELECT jadwal_id, status, keterangan, tanggal FROM absensi_guru WHERE jadwal_id = 1125 ORDER BY tanggal DESC LIMIT 5');
    console.log('🔍 Data keterangan untuk jadwal 1125:');
    console.log(rows);
    
    const [jadwalRows] = await db.execute('SELECT id_jadwal, nama_mapel FROM jadwal j JOIN mapel m ON j.mapel_id = m.id_mapel WHERE j.id_jadwal = 1125');
    console.log('🔍 Data jadwal 1125:');
    console.log(jadwalRows);
    
    // Check if there's any data in absensi_guru for today
    const today = new Date().toISOString().split('T')[0];
    const [todayRows] = await db.execute('SELECT * FROM absensi_guru WHERE tanggal = ? AND jadwal_id = 1125', [today]);
    console.log('🔍 Data absensi_guru untuk hari ini:', today);
    console.log(todayRows);
    
    await db.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkKeterangan();




