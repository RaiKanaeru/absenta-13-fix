const mysql = require('mysql2/promise');

async function fixKelasTingkat() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    console.log('🔧 Fixing kelas tingkat inconsistencies...\n');

    await connection.beginTransaction();

    // Fix X AK - should have tingkat "10"
    const [xResult] = await connection.execute(
      'UPDATE kelas SET tingkat = ? WHERE nama_kelas LIKE ? AND tingkat != ?',
      ['10', 'X %', '10']
    );

    if (xResult.affectedRows > 0) {
      console.log(`✅ Fixed ${xResult.affectedRows} X kelas (tingkat → "10")`);
    }

    // Fix XI kelas - should have tingkat "11"
    const [xiResult] = await connection.execute(
      'UPDATE kelas SET tingkat = ? WHERE nama_kelas LIKE ? AND tingkat != ?',
      ['11', 'XI %', '11']
    );

    if (xiResult.affectedRows > 0) {
      console.log(`✅ Fixed ${xiResult.affectedRows} XI kelas (tingkat → "11")`);
    }

    // Fix XII kelas - should have tingkat "12"
    const [xiiResult] = await connection.execute(
      'UPDATE kelas SET tingkat = ? WHERE nama_kelas LIKE ? AND tingkat != ?',
      ['12', 'XII %', '12']
    );

    if (xiiResult.affectedRows > 0) {
      console.log(`✅ Fixed ${xiiResult.affectedRows} XII kelas (tingkat → "12")`);
    }

    await connection.commit();

    const totalFixed = xResult.affectedRows + xiResult.affectedRows + xiiResult.affectedRows;

    console.log(`\n🎉 Total Fixed: ${totalFixed} kelas`);

    // Verify the fix
    console.log('\n🔍 Verifying fixes...');
    const [kelas] = await connection.execute(
      'SELECT id_kelas, nama_kelas, tingkat FROM kelas ORDER BY nama_kelas'
    );

    console.log('\n📊 Updated Kelas Data:');
    console.log('═'.repeat(60));
    kelas.forEach(k => {
      const flag = '✅';
      console.log(`${flag} ID: ${k.id_kelas.toString().padStart(3)} | ${k.nama_kelas.padEnd(12)} | Tingkat: ${k.tingkat}`);
    });

    console.log('\n✅ All kelas tingkat are now consistent!');

    await connection.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixKelasTingkat();


