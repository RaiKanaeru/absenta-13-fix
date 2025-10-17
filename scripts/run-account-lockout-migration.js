/**
 * Script untuk menjalankan migration account lockout
 */

import { db } from '../db.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('🚀 Starting Account Lockout Migration...');
    
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'backend/migrations/account_lockout_tables_simple.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by delimiter and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          await db.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Skip if table already exists
          if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
            continue;
          }
          throw error;
        }
      }
    }
    
    console.log('🎉 Account Lockout Migration completed successfully!');
    console.log('📊 Tables created:');
    console.log('   - login_attempts');
    console.log('   - account_lockouts');
    console.log('   - security_events');
    console.log('   - active_lockouts (view)');
    console.log('   - login_attempt_stats (view)');
    console.log('   - CleanupOldLoginAttempts (stored procedure)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection if available
    if (db && typeof db.end === 'function') {
      await db.end();
    }
  }
}

// Run migration
runMigration();
