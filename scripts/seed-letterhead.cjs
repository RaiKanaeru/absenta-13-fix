/**
 * Seed Letterhead Configuration to Database
 * 
 * This script loads the default letterhead template from JSON file
 * and seeds it to system_config table for all report types.
 * 
 * Usage: node scripts/seed-letterhead.cjs
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Report keys yang membutuhkan letterhead
const REPORT_KEYS = [
  'global',
  'presensi-siswa',
  'rekap-ketidakhadiran',
  'rekap-ketidakhadiran-guru',
  'banding-absen',
  'jadwal-global',
  'jadwal-smkn13',
  'teacher-summary',
  'student-summary'
];

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'absenta13',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 // 10 seconds
};

async function seedLetterhead() {
  let connection;
  
  try {
    console.log('🚀 Starting letterhead seeding...\n');
    
    // Read template file
    const templatePath = path.join(__dirname, '../backend/config/report-letterhead.json');
    console.log(`📄 Reading template from: ${templatePath}`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
    
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    console.log('✅ Template loaded successfully\n');
    console.log('📋 Template content:');
    console.log('   - Enabled:', template.enabled);
    console.log('   - Logo Left:', template.logoLeftUrl);
    console.log('   - Logo Right:', template.logoRightUrl);
    console.log('   - Lines:', template.lines.length);
    console.log('   - Alignment:', template.alignment);
    console.log('');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}\n`);
    
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('✅ Database connected successfully\n');
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}\n` +
        `Please check:\n` +
        `  1. MySQL is running\n` +
        `  2. Database '${dbConfig.database}' exists\n` +
        `  3. Credentials in .env are correct`);
    }
    
    // Check if system_config table exists
    console.log('🔍 Checking system_config table...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'system_config'"
    );
    
    if (tables.length === 0) {
      console.log('⚠️  system_config table does not exist. Creating...');
      
      try {
        await connection.execute(`
          CREATE TABLE system_config (
            config_key VARCHAR(255) PRIMARY KEY,
            config_value LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('✅ system_config table created with LONGTEXT column\n');
      } catch (error) {
        throw new Error(`Failed to create system_config table: ${error.message}`);
      }
    } else {
      console.log('✅ system_config table exists');
      
      // Check if config_value is LONGTEXT
      const [columns] = await connection.execute('DESCRIBE system_config');
      const configValueColumn = columns.find(col => col.Field === 'config_value');
      
      if (configValueColumn && !configValueColumn.Type.includes('longtext')) {
        console.log('⚠️  Upgrading config_value column to LONGTEXT...');
        await connection.execute('ALTER TABLE system_config MODIFY COLUMN config_value LONGTEXT');
        console.log('✅ Column upgraded to LONGTEXT');
      }
      
      console.log('');
    }
    
    // Seed letterhead for each report key
    console.log(`📦 Seeding letterhead for ${REPORT_KEYS.length} report types:\n`);
    
    let seededCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const key of REPORT_KEYS) {
      try {
        const configKey = `letterhead_${key}`;
        const configValue = JSON.stringify(template);
        
        // Check if already exists
        const [existing] = await connection.execute(
          'SELECT config_key FROM system_config WHERE config_key = ?',
          [configKey]
        );
        
        // Insert or update
        await connection.execute(
          `INSERT INTO system_config (config_key, config_value, created_at, updated_at) 
           VALUES (?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = NOW()`,
          [configKey, configValue]
        );
        
        if (existing.length > 0) {
          console.log(`   🔄 Updated: ${configKey}`);
          updatedCount++;
        } else {
          console.log(`   ✅ Created: ${configKey}`);
          seededCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error seeding ${key}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Seeding Summary:');
    console.log(`   - Created: ${seededCount}`);
    console.log(`   - Updated: ${updatedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Total: ${REPORT_KEYS.length}`);
    
    // Verify data
    console.log('\n🔍 Verifying seeded data...');
    const [result] = await connection.execute(
      `SELECT config_key, LENGTH(config_value) as size_bytes, updated_at 
       FROM system_config 
       WHERE config_key LIKE 'letterhead_%'
       ORDER BY config_key`
    );
    
    console.log('\n📋 Letterhead configurations in database:');
    console.log('┌─────────────────────────────────────┬──────────────┬─────────────────────┐');
    console.log('│ Config Key                          │ Size (bytes) │ Updated At          │');
    console.log('├─────────────────────────────────────┼──────────────┼─────────────────────┤');
    
    result.forEach(row => {
      const key = row.config_key.padEnd(35);
      const size = row.size_bytes.toString().padStart(12);
      const date = new Date(row.updated_at).toLocaleString('id-ID').padEnd(19);
      console.log(`│ ${key} │ ${size} │ ${date} │`);
    });
    
    console.log('└─────────────────────────────────────┴──────────────┴─────────────────────┘');
    
    if (errorCount === 0) {
      console.log('\n✅ Letterhead seeding completed successfully!');
    } else {
      console.log(`\n⚠️  Letterhead seeding completed with ${errorCount} errors`);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error during seeding:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run seeding
seedLetterhead()
  .then(() => {
    console.log('\n🎉 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

