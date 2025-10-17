/**
 * Script untuk membuat tabel account lockout
 */

import { db } from '../db.js';

async function createTables() {
  try {
    console.log('🚀 Creating Account Lockout Tables...');
    
    // Create login_attempts table
    console.log('📝 Creating login_attempts table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        success BOOLEAN NOT NULL DEFAULT FALSE,
        reason VARCHAR(255) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_ip_address (ip_address),
        INDEX idx_created_at (created_at),
        INDEX idx_success (success),
        INDEX idx_username_created (username, created_at),
        INDEX idx_ip_created (ip_address, created_at)
      )
    `);
    console.log('✅ login_attempts table created');

    // Create account_lockouts table
    console.log('📝 Creating account_lockouts table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS account_lockouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        attempt_count INT NOT NULL DEFAULT 0,
        locked_until TIMESTAMP NOT NULL,
        is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
        unlocked_by VARCHAR(255) DEFAULT NULL,
        unlocked_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_ip_address (ip_address),
        INDEX idx_locked_until (locked_until),
        INDEX idx_is_permanent (is_permanent),
        INDEX idx_username_locked (username, locked_until),
        INDEX idx_ip_locked (ip_address, locked_until)
      )
    `);
    console.log('✅ account_lockouts table created');

    // Create security_events table
    console.log('📝 Creating security_events table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS security_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        username VARCHAR(255) DEFAULT NULL,
        ip_address VARCHAR(45) NOT NULL,
        description TEXT NOT NULL,
        severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_type (event_type),
        INDEX idx_username (username),
        INDEX idx_ip_address (ip_address),
        INDEX idx_severity (severity),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ security_events table created');

    // Insert default security events
    console.log('📝 Inserting default security events...');
    await db.execute(`
      INSERT IGNORE INTO security_events (event_type, ip_address, description, severity) VALUES
      ('system_startup', 'SYSTEM', 'Account lockout system initialized', 'low'),
      ('migration_completed', 'SYSTEM', 'Account lockout tables created successfully', 'low')
    `);
    console.log('✅ Default security events inserted');

    // Create active_lockouts view
    console.log('📝 Creating active_lockouts view...');
    await db.execute(`
      CREATE OR REPLACE VIEW active_lockouts AS
      SELECT 
        al.id,
        al.username,
        al.ip_address,
        al.attempt_count,
        al.locked_until,
        al.is_permanent,
        al.created_at,
        TIMESTAMPDIFF(MINUTE, NOW(), al.locked_until) as remaining_minutes,
        CASE 
          WHEN al.is_permanent = 1 THEN 'Permanent'
          WHEN al.locked_until > NOW() THEN 'Active'
          ELSE 'Expired'
        END as status
      FROM account_lockouts al
      WHERE al.locked_until > NOW()
      ORDER BY al.created_at DESC
    `);
    console.log('✅ active_lockouts view created');

    // Create login_attempt_stats view
    console.log('📝 Creating login_attempt_stats view...');
    await db.execute(`
      CREATE OR REPLACE VIEW login_attempt_stats AS
      SELECT 
        DATE(created_at) as attempt_date,
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN success = 1 THEN 1 END) as successful_attempts,
        COUNT(CASE WHEN success = 0 THEN 1 END) as failed_attempts,
        COUNT(DISTINCT username) as unique_users,
        COUNT(DISTINCT ip_address) as unique_ips,
        ROUND((COUNT(CASE WHEN success = 1 THEN 1 END) / COUNT(*)) * 100, 2) as success_rate
      FROM login_attempts
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY attempt_date DESC
    `);
    console.log('✅ login_attempt_stats view created');
    
    console.log('🎉 Account Lockout Tables created successfully!');
    console.log('📊 Tables created:');
    console.log('   - login_attempts');
    console.log('   - account_lockouts');
    console.log('   - security_events');
    console.log('   - active_lockouts (view)');
    console.log('   - login_attempt_stats (view)');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

// Run migration
createTables();
