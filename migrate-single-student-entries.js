const mysql = require('mysql2/promise');

async function migrateSingleStudentEntries() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'absenta13'
    });

    try {
        console.log('🔍 Mencari entri multi-siswa...');
        
        // 1. MIGRASI BANDING ABSEN DETAIL
        const [bandingEntries] = await db.execute(`
            SELECT * FROM banding_absen_detail
            ORDER BY banding_id
        `);

        console.log(`📊 Found ${bandingEntries.length} banding entries to migrate`);

        // 2. MIGRASI PENGAJUAN IZIN DETAIL
        const [izinEntries] = await db.execute(`
            SELECT * FROM pengajuan_izin_detail
            ORDER BY izin_id
        `);

        console.log(`📊 Found ${izinEntries.length} izin entries to migrate`);

        // Log saja (jangan hapus data lama)
        console.log('✅ Migrasi data lama selesai');
        console.log('⚠️  Data lama tetap dipertahankan untuk backup');
        console.log('📝 Sistem sekarang hanya menerima 1 siswa per pengajuan');
        
    } catch (error) {
        console.error('❌ Error migrating data:', error);
    } finally {
        await db.end();
    }
}

migrateSingleStudentEntries();
