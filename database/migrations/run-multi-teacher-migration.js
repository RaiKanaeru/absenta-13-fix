/**
 * Run Multi-Teacher Migration
 * Executes 2025-10-20-multi-teacher-tables.sql migration
 */

import { db } from '../../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting multi-teacher migration...\n');
    
    connection = await db.getConnection();
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, '2025-10-20-multi-teacher-tables.sql');
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
        await connection.execute(stmt);
        
        // Log progress for important steps
        if (stmt.includes('CREATE TABLE')) {
          const tableName = stmt.match(/CREATE TABLE.*?`(\w+)`/)?.[1];
          console.log(`✅ Table created: ${tableName}`);
        } else if (stmt.includes('CREATE.*VIEW')) {
          const viewName = stmt.match(/CREATE.*VIEW.*?`(\w+)`/)?.[1];
          console.log(`✅ View created: ${viewName}`);
        } else if (stmt.includes('INSERT IGNORE')) {
          console.log(`✅ Data backfilled`);
        } else if (stmt.includes('CREATE INDEX')) {
          const indexName = stmt.match(/CREATE INDEX.*?`(\w+)`/)?.[1];
          console.log(`✅ Index created: ${indexName}`);
        }
      } catch (error) {
        // Some errors are expected (e.g., table already exists)
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠️  Table/View already exists (skipping)`);
        } else if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Index already exists (skipping)`);
        } else if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Duplicate entry (skipping)`);
        } else {
          console.warn(`⚠️  Warning during statement execution:`, error.message.slice(0, 100));
        }
      }
    }
    
    console.log('\n✨ Migration completed successfully!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying migration...\n');
    
    const [tables] = await connection.execute(`
      SELECT table_name, table_rows
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name IN ('jadwal_guru', 'absensi_guru_jadwal', 'absensi_guru_mapping')
    `);
    
    console.log('📊 Created Tables:');
    console.table(tables);
    
    // Verify view
    const [views] = await connection.execute(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = DATABASE()
      AND table_name = 'v_jadwal_guru_lengkap'
    `);
    
    if (views.length > 0) {
      console.log('\n✅ View verified: v_jadwal_guru_lengkap');
      
      // Test view
      const [viewTest] = await connection.execute(`
        SELECT COUNT(*) as count FROM v_jadwal_guru_lengkap
      `);
      console.log(`   View returns ${viewTest[0].count} records\n`);
    }
    
    // Show statistics
    const [stats] = await connection.execute(`
      SELECT 
          'jadwal_guru' as table_name,
          COUNT(*) as record_count,
          SUM(CASE WHEN is_primary = 1 THEN 1 ELSE 0 END) as primary_count,
          SUM(CASE WHEN is_primary = 0 THEN 1 ELSE 0 END) as additional_count
      FROM jadwal_guru
      WHERE status = 'aktif'
      
      UNION ALL
      
      SELECT 
          'absensi_guru_jadwal' as table_name,
          COUNT(*) as record_count,
          0 as primary_count,
          0 as additional_count
      FROM absensi_guru_jadwal
      
      UNION ALL
      
      SELECT 
          'absensi_guru_mapping' as table_name,
          COUNT(*) as record_count,
          0 as primary_count,
          0 as additional_count
      FROM absensi_guru_mapping
    `);
    
    console.log('📊 Migration Statistics:');
    console.table(stats);
    
    console.log('\n🎉 Multi-teacher system ready to use!\n');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

runMigration();

