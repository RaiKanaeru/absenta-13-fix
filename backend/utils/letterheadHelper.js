/**
 * Letterhead Helper - Centralized letterhead configuration fetching
 * 
 * This module provides a standardized way to fetch letterhead configurations
 * from the database with proper fallback mechanisms.
 * 
 * Usage:
 *   const { fetchLetterheadConfig } = require('./utils/letterheadHelper');
 *   const letterhead = await fetchLetterheadConfig('presensi-siswa');
 */

import { db } from '../db.js';

/**
 * Default letterhead configuration (fallback)
 */
const DEFAULT_LETTERHEAD = {
  enabled: true,
  logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
  logoRightUrl: "/uploads/letterheads/logo-smk.png",
  lines: [
    "PEMERINTAH PROVINSI DKI JAKARTA",
    "DINAS PENDIDIKAN",
    "SMK NEGERI 13 JAKARTA",
    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
    "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
  ],
  alignment: "center"
};

/**
 * Fetch letterhead configuration with fallback mechanism
 * 
 * Priority:
 * 1. Report-specific letterhead (letterhead_{reportKey})
 * 2. Global letterhead (letterhead_global)
 * 3. Default hardcoded letterhead
 * 
 * @param {string} reportKey - Report key (e.g., 'presensi-siswa', 'global')
 * @returns {Promise<Object|null>} Letterhead configuration object or null on error
 */
export async function fetchLetterheadConfig(reportKey = 'global') {
  try {
    console.log(`📄 Fetching letterhead config for: ${reportKey}`);
    
    // Try report-specific config
    if (reportKey !== 'global') {
      try {
        const [rows] = await db.execute(
          'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
          [`letterhead_${reportKey}`]
        );
        
        if (rows.length > 0 && rows[0].config_value) {
          const config = JSON.parse(rows[0].config_value);
          console.log(`✅ Using report-specific letterhead: letterhead_${reportKey}`);
          return config;
        }
      } catch (error) {
        console.log(`⚠️  No report-specific letterhead for: ${reportKey}`);
      }
    }
    
    // Fallback to global letterhead
    try {
      const [globalRows] = await db.execute(
        'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
        ['letterhead_global']
      );
      
      if (globalRows.length > 0 && globalRows[0].config_value) {
        const config = JSON.parse(globalRows[0].config_value);
        console.log('✅ Using global letterhead (fallback)');
        return config;
      }
    } catch (error) {
      console.log('⚠️  No global letterhead found');
    }
    
    // Final fallback to default
    console.log('✅ Using default letterhead (hardcoded fallback)');
    return DEFAULT_LETTERHEAD;
    
  } catch (error) {
    console.error('❌ Error fetching letterhead config:', error);
    // Return default on any error
    return DEFAULT_LETTERHEAD;
  }
}

/**
 * Validate letterhead configuration schema
 * 
 * @param {Object} config - Letterhead configuration to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateLetterheadConfig(config) {
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  // Check required properties
  const requiredProps = ['enabled', 'logoLeftUrl', 'logoRightUrl', 'lines', 'alignment'];
  for (const prop of requiredProps) {
    if (!(prop in config)) {
      console.warn(`⚠️  Missing required property: ${prop}`);
      return false;
    }
  }
  
  // Validate types
  if (typeof config.enabled !== 'boolean') {
    console.warn('⚠️  Property "enabled" must be boolean');
    return false;
  }
  
  if (typeof config.logoLeftUrl !== 'string' || typeof config.logoRightUrl !== 'string') {
    console.warn('⚠️  Logo URLs must be strings');
    return false;
  }
  
  if (!Array.isArray(config.lines)) {
    console.warn('⚠️  Property "lines" must be an array');
    return false;
  }
  
  if (!['left', 'center', 'right'].includes(config.alignment)) {
    console.warn('⚠️  Property "alignment" must be "left", "center", or "right"');
    return false;
  }
  
  return true;
}

/**
 * Save letterhead configuration to database
 * 
 * @param {string} reportKey - Report key
 * @param {Object} config - Letterhead configuration
 * @returns {Promise<boolean>} True if saved successfully, false otherwise
 */
export async function saveLetterheadConfig(reportKey, config) {
  try {
    console.log(`💾 Saving letterhead config for: ${reportKey}`);
    
    // Validate config
    if (!validateLetterheadConfig(config)) {
      throw new Error('Invalid letterhead configuration');
    }
    
    const configKey = `letterhead_${reportKey}`;
    const configValue = JSON.stringify(config);
    
    // Insert or update
    await db.execute(
      `INSERT INTO system_config (config_key, config_value, created_at, updated_at) 
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
         config_value = VALUES(config_value),
         updated_at = NOW()`,
      [configKey, configValue]
    );
    
    console.log(`✅ Letterhead saved: ${configKey}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error saving letterhead config:', error);
    return false;
  }
}

/**
 * Delete letterhead configuration from database
 * 
 * @param {string} reportKey - Report key
 * @returns {Promise<boolean>} True if deleted successfully, false otherwise
 */
export async function deleteLetterheadConfig(reportKey) {
  try {
    console.log(`🗑️  Deleting letterhead config for: ${reportKey}`);
    
    const configKey = `letterhead_${reportKey}`;
    
    await db.execute(
      'DELETE FROM system_config WHERE config_key = ?',
      [configKey]
    );
    
    console.log(`✅ Letterhead deleted: ${configKey}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting letterhead config:', error);
    return false;
  }
}

/**
 * List all letterhead configurations in database
 * 
 * @returns {Promise<Array>} Array of letterhead configurations
 */
export async function listLetterheadConfigs() {
  try {
    console.log('📋 Listing all letterhead configurations...');
    
    const [rows] = await db.execute(
      `SELECT 
         config_key,
         LENGTH(config_value) as size_bytes,
         created_at,
         updated_at
       FROM system_config 
       WHERE config_key LIKE 'letterhead_%'
       ORDER BY config_key`
    );
    
    console.log(`✅ Found ${rows.length} letterhead configurations`);
    return rows;
    
  } catch (error) {
    console.error('❌ Error listing letterhead configs:', error);
    return [];
  }
}

export default {
  fetchLetterheadConfig,
  validateLetterheadConfig,
  saveLetterheadConfig,
  deleteLetterheadConfig,
  listLetterheadConfigs,
  DEFAULT_LETTERHEAD
};

