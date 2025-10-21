import db from '../../db.js';
import fs from 'fs/promises';
import path from 'path';

async function runMigration(migrationFile) {
  console.log(`🚀 Running migration: ${path.basename(migrationFile)}\n`);

  try {
    // Read migration file
    const sql = await fs.readFile(migrationFile, 'utf-8');
    
    // Split by semicolon but keep statements that are part of procedures/functions
    const statements = sql
      .split(/;\s*\n/)
      .map(stmt => stmt ? stmt.trim() : '')
      .filter(stmt => stmt && stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (!statement || statement.startsWith('--') || statement.length < 5) {
        skipCount++;
        continue;
      }

      try {
        // Execute statement
        await db.execute(statement);
        successCount++;
        
        // Log progress for important statements
        if (statement.toUpperCase().includes('CREATE TABLE') ||
            statement.toUpperCase().includes('ALTER TABLE') ||
            statement.toUpperCase().includes('CREATE VIEW') ||
            statement.toUpperCase().includes('UPDATE')) {
          const preview = statement.substring(0, 100).replace(/\s+/g, ' ');
          console.log(`✅ Statement ${i + 1}/${statements.length}: ${preview}...`);
        }
      } catch (error) {
        // Some errors are acceptable (e.g., "already exists")
        if (error.message.includes('already exists') ||
            error.message.toLowerCase().includes('duplicate key') ||
            error.message.includes('IF EXISTS') ||
            error.code === 'ER_DUP_KEYNAME' ||
            error.code === 'ER_DUP_KEY') {
          skipCount++;
          console.log(`⚠️  Statement ${i + 1}/${statements.length}: ${error.message.substring(0, 80)}... (skipped)`);
        } else {
          console.error(`❌ Error in statement ${i + 1}/${statements.length}:`);
          console.error(`   ${statement.substring(0, 200)}...`);
          console.error(`   Error: ${error.message}`);
          throw error;
        }
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total statements: ${statements.length}`);
    console.log(`   Executed successfully: ${successCount}`);
    console.log(`   Skipped: ${skipCount}`);
    console.log(`\n✅ Migration completed successfully!`);

    return true;

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 To rollback, run:');
    console.error(`   node database/scripts/run-migration.js database/migrations/2025-10-21-users-siswa-normalization-rollback.sql`);
    throw error;
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2] || 'database/migrations/2025-10-21-users-siswa-normalization.sql';

runMigration(migrationFile)
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

