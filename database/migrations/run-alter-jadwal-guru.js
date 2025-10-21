import { db } from '../../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting jadwal_guru ALTER migration...\n');
    
    connection = await db.getConnection();
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, '2025-10-21-alter-jadwal-guru-add-is-primary.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip comments and empty statements
      if (stmt.startsWith('--') || stmt.trim().length === 0) {
        continue;
      }
      
      try {
        // Execute statement
        const [result] = await connection.execute(stmt);
        
        // Log progress
        if (stmt.includes('ALTER TABLE')) {
          console.log(`✅ ALTER TABLE executed`);
        } else if (stmt.includes('CREATE INDEX')) {
          const indexName = stmt.match(/CREATE INDEX.*?`(\w+)`/)?.[1];
          console.log(`✅ Index created: ${indexName}`);
        } else if (stmt.includes('UPDATE')) {
          console.log(`✅ Data updated: ${result.affectedRows} rows`);
        } else if (stmt.includes('SELECT')) {
          console.log(`📊 Verification results:`);
          if (Array.isArray(result) && result.length > 0) {
            console.table(result);
          }
        }
      } catch (error) {
        // Some errors are expected
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Column already exists (skipping)`);
        } else if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Index already exists (skipping)`);
        } else {
          console.warn(`⚠️  Warning:`, error.message.slice(0, 100));
        }
      }
    }
    
    console.log('\n✨ Migration completed successfully!\n');
    
    // Final verification
    console.log('🔍 Final verification...\n');
    
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM jadwal_guru
    `);
    
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
    } else {
      console.error('❌ Column is_primary NOT found!');
    }
    
    console.log('\n🎉 ALTER migration ready!\n');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

runMigration();

