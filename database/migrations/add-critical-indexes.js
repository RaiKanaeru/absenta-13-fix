import { db } from '../../db.js';

async function addCriticalIndexes() {
  let connection;
  
  try {
    console.log('🚀 Adding critical indexes for multi-teacher performance...\n');
    
    connection = await db.getConnection();
    
    const indexes = [
      {
        table: 'absensi_guru_mapping',
        name: 'idx_agm_guru_lookup',
        sql: 'CREATE INDEX idx_agm_guru_lookup ON absensi_guru_mapping (guru_id, absensi_guru_jadwal_id)',
        description: 'Optimize guru-based queries in absensi_guru_mapping'
      },
      {
        table: 'absensi_guru_jadwal',
        name: 'idx_agj_tanggal_range',
        sql: 'CREATE INDEX idx_agj_tanggal_range ON absensi_guru_jadwal (tanggal, jadwal_id)',
        description: 'Optimize date range queries'
      },
      {
        table: 'absensi_guru_jadwal',
        name: 'idx_agj_jadwal_tanggal',
        sql: 'CREATE INDEX idx_agj_jadwal_tanggal ON absensi_guru_jadwal (jadwal_id, tanggal)',
        description: 'Optimize schedule-based attendance lookups'
      }
    ];
    
    for (const index of indexes) {
      console.log(`📝 Adding index: ${index.name} on ${index.table}...`);
      console.log(`   Purpose: ${index.description}`);
      
      try {
        await connection.execute(index.sql);
        console.log(`✅ Index ${index.name} created successfully!\n`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Index ${index.name} already exists (skipping)\n`);
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`⚠️  Table ${index.table} does not exist (skipping)\n`);
        } else {
          console.warn(`⚠️  Warning creating ${index.name}:`, error.message.slice(0, 80), '\n');
        }
      }
    }
    
    console.log('✨ Index creation completed!\n');
    
    // Verification
    console.log('🔍 Verifying indexes...\n');
    
    const tables = ['jadwal_guru', 'absensi_guru_jadwal', 'absensi_guru_mapping'];
    
    for (const table of tables) {
      try {
        const [indexes] = await connection.execute(`
          SHOW INDEXES FROM ${table}
        `);
        
        console.log(`📊 Indexes on ${table}:`);
        const indexInfo = indexes.map(idx => ({
          Key_name: idx.Key_name,
          Column_name: idx.Column_name,
          Non_unique: idx.Non_unique
        }));
        console.table(indexInfo);
        console.log('');
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`⚠️  Table ${table} does not exist\n`);
        }
      }
    }
    
    console.log('🎉 All critical indexes ready for production!\n');
    
  } catch (error) {
    console.error('❌ Error during index creation:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

addCriticalIndexes();

