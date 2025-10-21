const mysql = require('mysql2/promise');

async function checkKelas() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    console.log('🔍 Checking kelas data for inconsistencies...\n');

    // Get all kelas data
    const [kelas] = await connection.execute(
      'SELECT id_kelas, nama_kelas, tingkat FROM kelas ORDER BY nama_kelas'
    );

    console.log('📊 Current Kelas Data:');
    console.log('═'.repeat(60));
    kelas.forEach(k => {
      const flag = (k.nama_kelas.startsWith('X ') && k.tingkat !== '10') ? '❌' : '✅';
      console.log(`${flag} ID: ${k.id_kelas.toString().padStart(3)} | ${k.nama_kelas.padEnd(12)} | Tingkat: ${k.tingkat || 'NULL'}`);
    });

    console.log('\n🔍 Inconsistencies Found:');
    console.log('═'.repeat(60));
    
    // Check X tingkat inconsistencies
    const xKelas = kelas.filter(k => k.nama_kelas.startsWith('X '));
    const xInconsistent = xKelas.filter(k => k.tingkat !== '10');
    
    if (xInconsistent.length > 0) {
      console.log('❌ X Kelas with wrong tingkat (should be "10"):');
      xInconsistent.forEach(k => {
        console.log(`   - ${k.nama_kelas} (ID: ${k.id_kelas}) has tingkat: "${k.tingkat}"`);
      });
    }

    // Check XI tingkat inconsistencies
    const xiKelas = kelas.filter(k => k.nama_kelas.startsWith('XI '));
    const xiInconsistent = xiKelas.filter(k => k.tingkat !== '11');
    
    if (xiInconsistent.length > 0) {
      console.log('❌ XI Kelas with wrong tingkat (should be "11"):');
      xiInconsistent.forEach(k => {
        console.log(`   - ${k.nama_kelas} (ID: ${k.id_kelas}) has tingkat: "${k.tingkat}"`);
      });
    }

    // Check XII tingkat inconsistencies
    const xiiKelas = kelas.filter(k => k.nama_kelas.startsWith('XII '));
    const xiiInconsistent = xiiKelas.filter(k => k.tingkat !== '12');
    
    if (xiiInconsistent.length > 0) {
      console.log('❌ XII Kelas with wrong tingkat (should be "12"):');
      xiiInconsistent.forEach(k => {
        console.log(`   - ${k.nama_kelas} (ID: ${k.id_kelas}) has tingkat: "${k.tingkat}"`);
      });
    }

    const totalInconsistent = xInconsistent.length + xiInconsistent.length + xiiInconsistent.length;
    
    if (totalInconsistent === 0) {
      console.log('✅ No inconsistencies found!');
    } else {
      console.log(`\n⚠️  Total Inconsistencies: ${totalInconsistent}`);
      console.log('\n💡 Fix Command:');
      console.log('   node fix-kelas-tingkat.cjs');
    }

    await connection.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkKelas();


