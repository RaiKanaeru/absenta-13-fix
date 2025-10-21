const db = require('./db.js');

(async () => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                s.id_siswa, 
                s.nis, 
                s.nama, 
                s.kelas_id, 
                k.nama_kelas, 
                u.username, 
                u.status
            FROM siswa s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE s.status = 'aktif'
            ORDER BY s.nis
            LIMIT 20
        `);
        
        console.log('\n📋 DAFTAR AKUN SISWA AKTIF:\n');
        console.log('='.repeat(100));
        console.log('| NIS       | Nama                          | Kelas      | Username        | Status  |');
        console.log('='.repeat(100));
        
        rows.forEach(row => {
            const nis = row.nis || '-';
            const nama = (row.nama || '-').padEnd(30).substring(0, 30);
            const kelas = (row.nama_kelas || '-').padEnd(10).substring(0, 10);
            const username = (row.username || '-').padEnd(15).substring(0, 15);
            const status = row.status || '-';
            
            console.log(`| ${nis.padEnd(9)} | ${nama} | ${kelas} | ${username} | ${status.padEnd(7)} |`);
        });
        
        console.log('='.repeat(100));
        console.log(`\n📊 Total: ${rows.length} siswa aktif dengan akun login\n`);
        
        console.log('💡 FORMAT LOGIN:');
        console.log('   Username: siswa_[NIS]');
        console.log('   Password: [NIS]@2024');
        console.log('\n📌 CONTOH:');
        if (rows.length > 0) {
            const example = rows[0];
            console.log(`   Username: ${example.username || `siswa_${example.nis}`}`);
            console.log(`   Password: ${example.nis}@2024`);
        }
        console.log('');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();


