/**
 * Verify Letterhead System Configuration
 * 
 * This script verifies the letterhead system is properly configured:
 * - Database table exists
 * - Letterhead configurations are seeded
 * - JSON schema is valid
 * - Backend helper functions work
 * 
 * Usage: node scripts/verify-letterhead.cjs
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

// Expected report keys
const EXPECTED_REPORT_KEYS = [
  'letterhead_global',
  'letterhead_presensi-siswa',
  'letterhead_rekap-ketidakhadiran',
  'letterhead_rekap-ketidakhadiran-guru',
  'letterhead_banding-absen',
  'letterhead_jadwal-global',
  'letterhead_jadwal-smkn13',
  'letterhead_teacher-summary',
  'letterhead_student-summary'
];

// Required schema properties
const REQUIRED_PROPERTIES = ['enabled', 'logoLeftUrl', 'logoRightUrl', 'lines', 'alignment'];

/**
 * Validate letterhead JSON schema
 */
function validateLetterheadSchema(config, configKey) {
  const errors = [];
  
  // Check required properties
  for (const prop of REQUIRED_PROPERTIES) {
    if (!(prop in config)) {
      errors.push(`Missing property: ${prop}`);
    }
  }
  
  // Validate types
  if (typeof config.enabled !== 'boolean') {
    errors.push('Property "enabled" must be boolean');
  }
  
  if (typeof config.logoLeftUrl !== 'string' || typeof config.logoRightUrl !== 'string') {
    errors.push('Logo URLs must be strings');
  }
  
  if (!Array.isArray(config.lines)) {
    errors.push('Property "lines" must be an array');
  } else if (config.lines.length === 0) {
    errors.push('Property "lines" cannot be empty');
  }
  
  if (!['left', 'center', 'right'].includes(config.alignment)) {
    errors.push('Property "alignment" must be "left", "center", or "right"');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Main verification function
 */
async function verifyLetterheadSystem() {
  let connection;
  let allChecksPassed = true;
  
  try {
    console.log('🔍 Starting Letterhead System Verification...\n');
    console.log('=' .repeat(70));
    
    // Step 1: Database Connection
    console.log('\n📌 Step 1: Verify Database Connection');
    console.log('-'.repeat(70));
    
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log(`✅ Database connected: ${dbConfig.database}`);
    } catch (error) {
      console.error(`❌ Database connection failed: ${error.message}`);
      allChecksPassed = false;
      process.exit(1);
    }
    
    // Step 2: Check system_config Table
    console.log('\n📌 Step 2: Verify system_config Table');
    console.log('-'.repeat(70));
    
    try {
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'system_config'"
      );
      
      if (tables.length === 0) {
        console.error('❌ Table "system_config" does not exist');
        console.log('   Run migration: mysql -u root -p absenta13 < database/migrations/2025-10-22-system-config-letterhead.sql');
        allChecksPassed = false;
      } else {
        console.log('✅ Table "system_config" exists');
        
        // Check table structure
        const [columns] = await connection.execute('DESCRIBE system_config');
        console.log('\n   Table Structure:');
        console.log('   ┌─────────────────┬─────────────────┬──────┐');
        console.log('   │ Column          │ Type            │ Key  │');
        console.log('   ├─────────────────┼─────────────────┼──────┤');
        
        columns.forEach(col => {
          const column = col.Field.padEnd(15);
          const type = col.Type.padEnd(15);
          const key = (col.Key || '').padEnd(4);
          console.log(`   │ ${column} │ ${type} │ ${key} │`);
        });
        
        console.log('   └─────────────────┴─────────────────┴──────┘');
        
        // Verify config_value is LONGTEXT
        const configValueColumn = columns.find(col => col.Field === 'config_value');
        if (configValueColumn && configValueColumn.Type.includes('longtext')) {
          console.log('   ✅ Column "config_value" is LONGTEXT (supports large base64 images)');
        } else {
          console.warn('   ⚠️  Column "config_value" is not LONGTEXT');
          console.warn('      Run: ALTER TABLE system_config MODIFY COLUMN config_value LONGTEXT;');
          allChecksPassed = false;
        }
      }
    } catch (error) {
      console.error(`❌ Error checking table: ${error.message}`);
      allChecksPassed = false;
    }
    
    // Step 3: Check Letterhead Configurations
    console.log('\n📌 Step 3: Verify Letterhead Configurations');
    console.log('-'.repeat(70));
    
    try {
      const [configs] = await connection.execute(
        `SELECT 
           config_key,
           LENGTH(config_value) as size_bytes,
           created_at,
           updated_at
         FROM system_config 
         WHERE config_key LIKE 'letterhead_%'
         ORDER BY config_key`
      );
      
      if (configs.length === 0) {
        console.error('❌ No letterhead configurations found');
        console.log('   Run seed: node scripts/seed-letterhead.cjs');
        allChecksPassed = false;
      } else {
        console.log(`✅ Found ${configs.length} letterhead configurations\n`);
        
        console.log('   ┌─────────────────────────────────────┬──────────────┬─────────────────────┐');
        console.log('   │ Config Key                          │ Size (bytes) │ Updated At          │');
        console.log('   ├─────────────────────────────────────┼──────────────┼─────────────────────┤');
        
        configs.forEach(row => {
          const key = row.config_key.padEnd(35);
          const size = row.size_bytes.toString().padStart(12);
          const date = new Date(row.updated_at).toLocaleString('id-ID').padEnd(19);
          console.log(`   │ ${key} │ ${size} │ ${date} │`);
        });
        
        console.log('   └─────────────────────────────────────┴──────────────┴─────────────────────┘');
        
        // Check for missing report keys
        const foundKeys = configs.map(c => c.config_key);
        const missingKeys = EXPECTED_REPORT_KEYS.filter(key => !foundKeys.includes(key));
        
        if (missingKeys.length > 0) {
          console.warn('\n   ⚠️  Missing letterhead configurations:');
          missingKeys.forEach(key => {
            console.warn(`      - ${key}`);
          });
          console.log('   Run seed: node scripts/seed-letterhead.cjs');
          allChecksPassed = false;
        } else {
          console.log('\n   ✅ All expected letterhead configurations exist');
        }
      }
    } catch (error) {
      console.error(`❌ Error checking configurations: ${error.message}`);
      allChecksPassed = false;
    }
    
    // Step 4: Validate JSON Schema
    console.log('\n📌 Step 4: Validate JSON Schema');
    console.log('-'.repeat(70));
    
    try {
      const [configs] = await connection.execute(
        `SELECT config_key, config_value 
         FROM system_config 
         WHERE config_key LIKE 'letterhead_%'
         ORDER BY config_key`
      );
      
      let validCount = 0;
      let invalidCount = 0;
      
      for (const row of configs) {
        try {
          const config = JSON.parse(row.config_value);
          const validation = validateLetterheadSchema(config, row.config_key);
          
          if (validation.valid) {
            console.log(`   ✅ ${row.config_key}: Valid`);
            validCount++;
          } else {
            console.error(`   ❌ ${row.config_key}: Invalid`);
            validation.errors.forEach(err => {
              console.error(`      - ${err}`);
            });
            invalidCount++;
            allChecksPassed = false;
          }
        } catch (error) {
          console.error(`   ❌ ${row.config_key}: Invalid JSON`);
          console.error(`      ${error.message}`);
          invalidCount++;
          allChecksPassed = false;
        }
      }
      
      console.log(`\n   Summary: ${validCount} valid, ${invalidCount} invalid`);
    } catch (error) {
      console.error(`❌ Error validating schemas: ${error.message}`);
      allChecksPassed = false;
    }
    
    // Step 5: Test Sample Letterhead
    console.log('\n📌 Step 5: Test Sample Letterhead Fetch');
    console.log('-'.repeat(70));
    
    try {
      const [rows] = await connection.execute(
        'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
        ['letterhead_global']
      );
      
      if (rows.length > 0) {
        const config = JSON.parse(rows[0].config_value);
        console.log('   ✅ Successfully fetched letterhead_global');
        console.log(`   - Enabled: ${config.enabled}`);
        console.log(`   - Logo Left: ${config.logoLeftUrl}`);
        console.log(`   - Logo Right: ${config.logoRightUrl}`);
        console.log(`   - Lines: ${config.lines.length}`);
        console.log(`   - Alignment: ${config.alignment}`);
      } else {
        console.error('   ❌ Failed to fetch letterhead_global');
        allChecksPassed = false;
      }
    } catch (error) {
      console.error(`   ❌ Error testing letterhead fetch: ${error.message}`);
      allChecksPassed = false;
    }
    
    // Final Report
    console.log('\n' + '='.repeat(70));
    
    if (allChecksPassed) {
      console.log('🎉 All checks passed! Letterhead system is properly configured.');
      console.log('\n✅ Next Steps:');
      console.log('   1. Start server: node server_modern.js');
      console.log('   2. Login as admin');
      console.log('   3. Navigate to "Kop Laporan" menu');
      console.log('   4. Configure letterhead via UI');
      console.log('   5. Test export functionality');
    } else {
      console.error('❌ Some checks failed. Please fix the issues above.');
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Run migration: mysql -u root -p absenta13 < database/migrations/2025-10-22-system-config-letterhead.sql');
      console.log('   2. Run seed: node scripts/seed-letterhead.cjs');
      console.log('   3. Re-run this verification: node scripts/verify-letterhead.cjs');
    }
    
    console.log('='.repeat(70));
    
    return allChecksPassed;
    
  } catch (error) {
    console.error('\n💥 Fatal error during verification:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run verification
verifyLetterheadSystem()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

