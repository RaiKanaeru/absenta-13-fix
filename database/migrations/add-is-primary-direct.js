import { db } from '../../db.js';

async function addIsPrimary() {
  let connection;
  
  try {
    console.log('🚀 Adding is_primary column to jadwal_guru...\n');
    
    connection = await db.getConnection();
    
    // Step 1: Add is_primary column
    console.log('📝 Step 1: Adding is_primary column...');
    try {
      await connection.execute(`
        ALTER TABLE jadwal_guru 
        ADD COLUMN is_primary TINYINT(1) DEFAULT 0 COMMENT '1 if primary teacher, 0 if additional'
        AFTER guru_id
      `);
      console.log('✅ Column is_primary added successfully!\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Column is_primary already exists (skipping)\n');
      } else {
        throw error;
      }
    }
    
    // Step 2: Backfill is_primary for primary teachers
    console.log('📝 Step 2: Backfilling primary teachers...');
    const [updatePrimary] = await connection.execute(`
      UPDATE jadwal_guru jg
      JOIN jadwal j ON jg.jadwal_id = j.id_jadwal
      SET jg.is_primary = 1
      WHERE jg.guru_id = j.guru_id
    `);
    console.log(`✅ Updated ${updatePrimary.affectedRows} primary teacher records\n`);
    
    // Step 3: Backfill is_primary for additional teachers
    console.log('📝 Step 3: Backfilling additional teachers...');
    const [updateAdditional] = await connection.execute(`
      UPDATE jadwal_guru jg
      JOIN jadwal j ON jg.jadwal_id = j.id_jadwal
      SET jg.is_primary = 0
      WHERE jg.guru_id != j.guru_id
    `);
    console.log(`✅ Updated ${updateAdditional.affectedRows} additional teacher records\n`);
    
    // Step 4: Create indexes
    console.log('📝 Step 4: Creating indexes...');
    try {
      await connection.execute(`
        CREATE INDEX idx_jg_is_primary ON jadwal_guru (is_primary, status)
      `);
      console.log('✅ Index idx_jg_is_primary created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  Index idx_jg_is_primary already exists');
      } else {
        console.warn('⚠️  Warning creating index:', error.message.slice(0, 80));
      }
    }
    
    try {
      await connection.execute(`
        CREATE INDEX idx_jg_composite ON jadwal_guru (guru_id, jadwal_id, status)
      `);
      console.log('✅ Index idx_jg_composite created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  Index idx_jg_composite already exists');
      } else {
        console.warn('⚠️  Warning creating index:', error.message.slice(0, 80));
      }
    }
    
    console.log('\n✨ Migration completed!\n');
    
    // Verification
    console.log('🔍 Verification...\n');
    
    const [columns] = await connection.execute(`SHOW COLUMNS FROM jadwal_guru`);
    const hasPrimary = columns.some(col => col.Field === 'is_primary');
    
    if (hasPrimary) {
      console.log('✅ Column is_primary verified!\n');
      
      const [stats] = await connection.execute(`
        SELECT 
            COUNT(*) as total_records,
            SUM(CASE WHEN is_primary = 1 THEN 1 ELSE 0 END) as primary_teachers,
            SUM(CASE WHEN is_primary = 0 THEN 1 ELSE 0 END) as additional_teachers
        FROM jadwal_guru
        WHERE status = 'aktif'
      `);
      
      console.log('📊 jadwal_guru Statistics:');
      console.table(stats);
      
      const [sample] = await connection.execute(`
        SELECT * FROM jadwal_guru LIMIT 5
      `);
      
      console.log('\n📋 Sample data with is_primary:');
      console.table(sample);
    } else {
      console.error('❌ Column is_primary NOT found!');
    }
    
    console.log('\n🎉 jadwal_guru table ready for multi-teacher system!\n');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

addIsPrimary();

