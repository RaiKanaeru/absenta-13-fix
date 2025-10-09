// ================================================
// DATABASE INDEX AUDIT SCRIPT
// ================================================

import 'dotenv/config';
import db from './db.js';

// Index recommendations based on query patterns
const indexRecommendations = [
    // Users table indexes
    {
        table: 'users',
        indexes: [
            { name: 'idx_users_username', columns: ['username'], type: 'UNIQUE' },
            { name: 'idx_users_role', columns: ['role'] },
            { name: 'idx_users_status', columns: ['status'] },
            { name: 'idx_users_role_status', columns: ['role', 'status'] }
        ]
    },
    
    // Guru table indexes
    {
        table: 'guru',
        indexes: [
            { name: 'idx_guru_nip', columns: ['nip'], type: 'UNIQUE' },
            { name: 'idx_guru_user_id', columns: ['user_id'], type: 'UNIQUE' },
            { name: 'idx_guru_mapel_id', columns: ['mapel_id'] },
            { name: 'idx_guru_status', columns: ['status'] },
            { name: 'idx_guru_nama', columns: ['nama'] }
        ]
    },
    
    // Siswa_perwakilan table indexes
    {
        table: 'siswa_perwakilan',
        indexes: [
            { name: 'idx_siswa_nis', columns: ['nis'], type: 'UNIQUE' },
            { name: 'idx_siswa_user_id', columns: ['user_id'], type: 'UNIQUE' },
            { name: 'idx_siswa_kelas_id', columns: ['kelas_id'] },
            { name: 'idx_siswa_status', columns: ['status'] },
            { name: 'idx_siswa_nama', columns: ['nama'] }
        ]
    },
    
    // Kelas table indexes
    {
        table: 'kelas',
        indexes: [
            { name: 'idx_kelas_nama', columns: ['nama_kelas'] },
            { name: 'idx_kelas_tingkat', columns: ['tingkat'] },
            { name: 'idx_kelas_status', columns: ['status'] },
            { name: 'idx_kelas_tingkat_status', columns: ['tingkat', 'status'] }
        ]
    },
    
    // Mapel table indexes
    {
        table: 'mapel',
        indexes: [
            { name: 'idx_mapel_kode', columns: ['kode_mapel'], type: 'UNIQUE' },
            { name: 'idx_mapel_nama', columns: ['nama_mapel'] },
            { name: 'idx_mapel_status', columns: ['status'] }
        ]
    },
    
    // Jadwal table indexes
    {
        table: 'jadwal',
        indexes: [
            { name: 'idx_jadwal_kelas_id', columns: ['kelas_id'] },
            { name: 'idx_jadwal_guru_id', columns: ['guru_id'] },
            { name: 'idx_jadwal_mapel_id', columns: ['mapel_id'] },
            { name: 'idx_jadwal_status', columns: ['status'] },
            { name: 'idx_jadwal_hari', columns: ['hari'] },
            { name: 'idx_jadwal_kelas_guru', columns: ['kelas_id', 'guru_id'] },
            { name: 'idx_jadwal_hari_jam', columns: ['hari', 'jam_mulai'] }
        ]
    },
    
    // Absensi_guru table indexes
    {
        table: 'absensi_guru',
        indexes: [
            { name: 'idx_absensi_guru_guru_id', columns: ['guru_id'] },
            { name: 'idx_absensi_guru_tanggal', columns: ['tanggal'] },
            { name: 'idx_absensi_guru_status', columns: ['status'] },
            { name: 'idx_absensi_guru_guru_tanggal', columns: ['guru_id', 'tanggal'] },
            { name: 'idx_absensi_guru_tanggal_status', columns: ['tanggal', 'status'] }
        ]
    },
    
    // Absensi_siswa table indexes
    {
        table: 'absensi_siswa',
        indexes: [
            { name: 'idx_absensi_siswa_siswa_id', columns: ['siswa_id'] },
            { name: 'idx_absensi_siswa_tanggal', columns: ['tanggal'] },
            { name: 'idx_absensi_siswa_status', columns: ['status'] },
            { name: 'idx_absensi_siswa_siswa_tanggal', columns: ['siswa_id', 'tanggal'] },
            { name: 'idx_absensi_siswa_tanggal_status', columns: ['tanggal', 'status'] }
        ]
    },
    
    // Pengajuan_izin table indexes
    {
        table: 'pengajuan_izin',
        indexes: [
            { name: 'idx_pengajuan_izin_siswa_id', columns: ['siswa_id'] },
            { name: 'idx_pengajuan_izin_tanggal', columns: ['tanggal'] },
            { name: 'idx_pengajuan_izin_status', columns: ['status'] },
            { name: 'idx_pengajuan_izin_siswa_tanggal', columns: ['siswa_id', 'tanggal'] }
        ]
    },
    
    // Pengajuan_banding_absen table indexes
    {
        table: 'pengajuan_banding_absen',
        indexes: [
            { name: 'idx_banding_siswa_id', columns: ['siswa_id'] },
            { name: 'idx_banding_tanggal', columns: ['tanggal_absen'] },
            { name: 'idx_banding_status', columns: ['status_banding'] },
            { name: 'idx_banding_siswa_tanggal', columns: ['siswa_id', 'tanggal_absen'] }
        ]
    }
];

// Function to check existing indexes
async function checkExistingIndexes(tableName) {
    try {
        const [indexes] = await db.execute(`
            SELECT 
                INDEX_NAME,
                COLUMN_NAME,
                NON_UNIQUE,
                INDEX_TYPE
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY INDEX_NAME, SEQ_IN_INDEX
        `, [process.env.DB_NAME || 'absenta13', tableName]);
        
        return indexes;
    } catch (error) {
        console.error(`❌ Error checking indexes for ${tableName}:`, error);
        return [];
    }
}

// Function to create index
async function createIndex(tableName, index) {
    try {
        const uniqueKeyword = index.type === 'UNIQUE' ? 'UNIQUE ' : '';
        const columns = index.columns.join(', ');
        const sql = `CREATE ${uniqueKeyword}INDEX ${index.name} ON ${tableName} (${columns})`;
        
        console.log(`🔧 Creating index: ${sql}`);
        await db.execute(sql);
        console.log(`✅ Index ${index.name} created successfully`);
        return true;
    } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
            console.log(`⚠️ Index ${index.name} already exists`);
            return true;
        }
        console.error(`❌ Error creating index ${index.name}:`, error);
        return false;
    }
}

// Function to analyze table performance
async function analyzeTable(tableName) {
    try {
        const [stats] = await db.execute(`ANALYZE TABLE ${tableName}`);
        console.log(`📊 Analyzed table ${tableName}:`, stats[0]);
        return stats[0];
    } catch (error) {
        console.error(`❌ Error analyzing table ${tableName}:`, error);
        return null;
    }
}

// Main audit function
async function auditDatabaseIndexes() {
    console.log('🔍 Starting database index audit...');
    
    try {
        // Test database connection
        const isConnected = await db.testConnection();
        if (!isConnected) {
            throw new Error('Database connection failed');
        }
        
        console.log('✅ Database connection established');
        
        // Get all tables
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
        `, [process.env.DB_NAME || 'absenta13']);
        
        console.log(`📋 Found ${tables.length} tables to audit`);
        
        // Process each table
        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            console.log(`\n🔍 Auditing table: ${tableName}`);
            
            // Check existing indexes
            const existingIndexes = await checkExistingIndexes(tableName);
            console.log(`📊 Found ${existingIndexes.length} existing indexes`);
            
            // Find recommendations for this table
            const tableRecommendations = indexRecommendations.find(rec => rec.table === tableName);
            if (!tableRecommendations) {
                console.log(`⚠️ No index recommendations found for ${tableName}`);
                continue;
            }
            
            // Check and create missing indexes
            for (const index of tableRecommendations.indexes) {
                const exists = existingIndexes.some(existing => existing.INDEX_NAME === index.name);
                if (!exists) {
                    console.log(`➕ Creating missing index: ${index.name}`);
                    await createIndex(tableName, index);
                } else {
                    console.log(`✅ Index ${index.name} already exists`);
                }
            }
            
            // Analyze table
            await analyzeTable(tableName);
        }
        
        console.log('\n🎉 Database index audit completed!');
        
    } catch (error) {
        console.error('❌ Database index audit failed:', error);
    } finally {
        await db.close();
    }
}

// Run audit if called directly
if (process.argv[1] && process.argv[1].includes('database-index-audit.js')) {
    auditDatabaseIndexes();
}

export { auditDatabaseIndexes, checkExistingIndexes, createIndex, analyzeTable };
