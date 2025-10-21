import { db } from '../../db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting jadwal_khusus migration...');
    
    connection = await db.getConnection();
    
    // Direct SQL statement for creating jadwal_khusus table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`jadwal_khusus\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`kelas_id\` INT(11) NULL COMMENT 'NULL untuk kegiatan semua kelas (upacara)',
        \`jenis_kegiatan\` ENUM('istirahat', 'upacara', 'perwalian') NOT NULL,
        \`nama_kegiatan\` VARCHAR(100) NOT NULL COMMENT 'Nama deskriptif (Istirahat 1, Upacara Senin, dll)',
        \`hari\` ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu') NOT NULL,
        \`jam_mulai\` TIME NOT NULL,
        \`jam_selesai\` TIME NOT NULL,
        \`guru_id\` INT(11) NULL COMMENT 'Untuk perwalian - guru/wali kelas yang bertanggung jawab',
        \`keterangan\` TEXT NULL,
        \`status\` ENUM('aktif', 'tidak_aktif') DEFAULT 'aktif',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        CONSTRAINT \`fk_jadwal_khusus_kelas\` 
          FOREIGN KEY (\`kelas_id\`) 
          REFERENCES \`kelas\`(\`id_kelas\`) 
          ON DELETE CASCADE,
        
        CONSTRAINT \`fk_jadwal_khusus_guru\` 
          FOREIGN KEY (\`guru_id\`) 
          REFERENCES \`guru\`(\`id_guru\`) 
          ON DELETE SET NULL,
        
        INDEX \`idx_kelas_hari\` (\`kelas_id\`, \`hari\`),
        INDEX \`idx_jenis_hari\` (\`jenis_kegiatan\`, \`hari\`),
        INDEX \`idx_guru\` (\`guru_id\`),
        INDEX \`idx_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      COMMENT='Tabel untuk jadwal khusus (Istirahat, Upacara, Perwalian)'
    `;
    
    console.log('📝 Creating jadwal_khusus table...');
    
    await connection.execute(createTableSQL);
    
    console.log('✅ Table created successfully!');
    console.log('\n✨ Migration completed successfully!');
    
    // Verify table was created
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'jadwal_khusus'"
    );
    
    if (tables.length > 0) {
      console.log('✅ Table jadwal_khusus verified in database');
      
      // Show table structure
      const [structure] = await connection.execute('DESCRIBE jadwal_khusus');
      console.log('\n📊 Table Structure:');
      console.table(structure);
    } else {
      console.log('❌ Warning: Table jadwal_khusus not found after migration');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

// Run migration
runMigration();

