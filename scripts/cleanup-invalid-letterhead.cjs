/**
 * Cleanup Invalid Letterhead Configurations
 * 
 * This script removes letterhead configurations with:
 * - Empty or null config_value
 * - Old format with underscores (should be dashes)
 * - Invalid JSON
 * 
 * Usage: node scripts/cleanup-invalid-letterhead.cjs
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'absenta13',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function cleanupInvalidLetterhead() {
  let connection;
  
  try {
    console.log('🧹 Starting Invalid Letterhead Cleanup...\n');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected\n');
    
    // Find all letterhead configs
    const [allConfigs] = await connection.execute(
      `SELECT config_key, LENGTH(config_value) as size_bytes, config_value
       FROM system_config 
       WHERE config_key LIKE 'letterhead_%'
       ORDER BY config_key`
    );
    
    console.log(`📊 Found ${allConfigs.length} letterhead configurations\n`);
    
    const toDelete = [];
    
    // Identify invalid configs
    for (const row of allConfigs) {
      const reasons = [];
      
      // Check 1: Empty or null value
      if (row.size_bytes === 0 || !row.config_value) {
        reasons.push('Empty config_value');
      }
      
      // Check 2: Old format with underscores (should use dashes)
      if (row.config_key.includes('_') && 
          !row.config_key.startsWith('letterhead_global') &&
          row.config_key !== 'letterhead_global') {
        // Check if dash version exists
        const dashVersion = row.config_key.replace(/_/g, '-').replace('letterhead-', 'letterhead_');
        const hasDashVersion = allConfigs.some(c => c.config_key === dashVersion && c.size_bytes > 0);
        
        if (hasDashVersion) {
          reasons.push('Old format (underscore), dash version exists');
        }
      }
      
      // Check 3: Invalid JSON
      if (row.size_bytes > 0) {
        try {
          JSON.parse(row.config_value);
        } catch (error) {
          reasons.push('Invalid JSON');
        }
      }
      
      if (reasons.length > 0) {
        toDelete.push({
          config_key: row.config_key,
          reasons: reasons.join(', ')
        });
      }
    }
    
    if (toDelete.length === 0) {
      console.log('✅ No invalid letterhead configurations found!\n');
      return;
    }
    
    console.log(`🗑️  Found ${toDelete.length} invalid configurations to delete:\n`);
    console.log('┌─────────────────────────────────────┬─────────────────────────────────────┐');
    console.log('│ Config Key                          │ Reason                              │');
    console.log('├─────────────────────────────────────┼─────────────────────────────────────┤');
    
    toDelete.forEach(item => {
      const key = item.config_key.padEnd(35);
      const reason = item.reasons.padEnd(35);
      console.log(`│ ${key} │ ${reason} │`);
    });
    
    console.log('└─────────────────────────────────────┴─────────────────────────────────────┘\n');
    
    // Delete invalid configs
    let deletedCount = 0;
    
    for (const item of toDelete) {
      try {
        await connection.execute(
          'DELETE FROM system_config WHERE config_key = ?',
          [item.config_key]
        );
        console.log(`   ✅ Deleted: ${item.config_key}`);
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ Error deleting ${item.config_key}:`, error.message);
      }
    }
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   - Deleted: ${deletedCount}`);
    console.log(`   - Failed: ${toDelete.length - deletedCount}`);
    
    // Verify remaining configs
    const [remainingConfigs] = await connection.execute(
      `SELECT config_key, LENGTH(config_value) as size_bytes
       FROM system_config 
       WHERE config_key LIKE 'letterhead_%'
       ORDER BY config_key`
    );
    
    console.log(`\n📋 Remaining letterhead configurations: ${remainingConfigs.length}\n`);
    console.log('┌─────────────────────────────────────┬──────────────┐');
    console.log('│ Config Key                          │ Size (bytes) │');
    console.log('├─────────────────────────────────────┼──────────────┤');
    
    remainingConfigs.forEach(row => {
      const key = row.config_key.padEnd(35);
      const size = row.size_bytes.toString().padStart(12);
      console.log(`│ ${key} │ ${size} │`);
    });
    
    console.log('└─────────────────────────────────────┴──────────────┘');
    
    console.log('\n✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Fatal error during cleanup:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run cleanup
cleanupInvalidLetterhead()
  .then(() => {
    console.log('\n🎉 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

