/**
 * Multi-Teacher System Integration Tests
 * Tests the complete multi-teacher workflow
 */

import { expect } from 'chai';
import { db } from '../../db.js';
import { apiCall } from '../helpers/api-helper.js';

describe('Multi-Teacher System Integration Tests', function() {
  this.timeout(10000); // 10 second timeout for integration tests
  
  let testJadwalId;
  let primaryGuruId;
  let additionalGuruId1;
  let additionalGuruId2;
  let testKelasId;
  let testMapelId;
  let adminToken;
  let guruToken;
  
  before(async () => {
    console.log('🚀 Setting up multi-teacher test environment...');
    
    // Get active kelas and mapel for testing
    const [kelas] = await db.execute('SELECT id_kelas FROM kelas WHERE status = "aktif" LIMIT 1');
    const [mapel] = await db.execute('SELECT id_mapel FROM mapel LIMIT 1');
    const [guru] = await db.execute('SELECT id_guru FROM guru WHERE status = "aktif" LIMIT 3');
    
    if (kelas.length === 0 || mapel.length === 0 || guru.length < 3) {
      throw new Error('Insufficient test data: need at least 1 kelas, 1 mapel, and 3 guru');
    }
    
    testKelasId = kelas[0].id_kelas;
    testMapelId = mapel[0].id_mapel;
    primaryGuruId = guru[0].id_guru;
    additionalGuruId1 = guru[1].id_guru;
    additionalGuruId2 = guru[2].id_guru;
    
    console.log(`✅ Test environment ready:
      - Kelas ID: ${testKelasId}
      - Mapel ID: ${testMapelId}
      - Primary Guru: ${primaryGuruId}
      - Additional Guru 1: ${additionalGuruId1}
      - Additional Guru 2: ${additionalGuruId2}
    `);
  });
  
  describe('1. Create Jadwal with Multi-Teacher', () => {
    it('should create jadwal with primary teacher', async () => {
      const [result] = await db.execute(`
        INSERT INTO jadwal (kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai, status)
        VALUES (?, ?, ?, 'Senin', 1, '07:00:00', '07:45:00', 'aktif')
      `, [testKelasId, testMapelId, primaryGuruId]);
      
      testJadwalId = result.insertId;
      expect(testJadwalId).to.be.greaterThan(0);
      console.log(`✅ Created test jadwal ID: ${testJadwalId}`);
    });
    
    it('should add additional teachers to jadwal_guru', async () => {
      // Add first additional teacher
      const [result1] = await db.execute(`
        INSERT INTO jadwal_guru (jadwal_id, guru_id, is_primary, status)
        VALUES (?, ?, 0, 'aktif')
      `, [testJadwalId, additionalGuruId1]);
      
      expect(result1.insertId).to.be.greaterThan(0);
      
      // Add second additional teacher
      const [result2] = await db.execute(`
        INSERT INTO jadwal_guru (jadwal_id, guru_id, is_primary, status)
        VALUES (?, ?, 0, 'aktif')
      `, [testJadwalId, additionalGuruId2]);
      
      expect(result2.insertId).to.be.greaterThan(0);
      console.log(`✅ Added 2 additional teachers to jadwal ${testJadwalId}`);
    });
    
    it('should verify multi-teacher assignment', async () => {
      const [teachers] = await db.execute(`
        SELECT 
          jg.guru_id,
          jg.is_primary,
          g.nama
        FROM jadwal_guru jg
        JOIN guru g ON jg.guru_id = g.id_guru
        WHERE jg.jadwal_id = ? AND jg.status = 'aktif'
      `, [testJadwalId]);
      
      expect(teachers).to.have.lengthOf(2); // 2 additional teachers (primary is in jadwal table)
      expect(teachers.every(t => t.is_primary === 0)).to.be.true;
      console.log(`✅ Verified multi-teacher assignment: ${teachers.length} additional teachers`);
    });
  });
  
  describe('2. Query Jadwal with Multi-Teacher', () => {
    it('should return jadwal for primary teacher', async () => {
      const [jadwal] = await db.execute(`
        SELECT j.* 
        FROM jadwal j
        WHERE j.guru_id = ? AND j.id_jadwal = ? AND j.status = 'aktif'
      `, [primaryGuruId, testJadwalId]);
      
      expect(jadwal).to.have.lengthOf(1);
      console.log(`✅ Primary teacher can see jadwal`);
    });
    
    it('should return jadwal for additional teachers', async () => {
      const [jadwal1] = await db.execute(`
        SELECT j.* 
        FROM jadwal j
        LEFT JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id 
          AND jg.guru_id = ? AND jg.status = 'aktif'
        WHERE (j.guru_id = ? OR jg.guru_id IS NOT NULL) 
          AND j.id_jadwal = ? AND j.status = 'aktif'
      `, [additionalGuruId1, additionalGuruId1, testJadwalId]);
      
      expect(jadwal1).to.have.lengthOf(1);
      
      const [jadwal2] = await db.execute(`
        SELECT j.* 
        FROM jadwal j
        LEFT JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id 
          AND jg.guru_id = ? AND jg.status = 'aktif'
        WHERE (j.guru_id = ? OR jg.guru_id IS NOT NULL) 
          AND j.id_jadwal = ? AND j.status = 'aktif'
      `, [additionalGuruId2, additionalGuruId2, testJadwalId]);
      
      expect(jadwal2).to.have.lengthOf(1);
      console.log(`✅ Additional teachers can see jadwal`);
    });
    
    it('should use view v_jadwal_guru_lengkap correctly', async () => {
      const [viewData] = await db.execute(`
        SELECT * FROM v_jadwal_guru_lengkap WHERE id_jadwal = ?
      `, [testJadwalId]);
      
      expect(viewData).to.have.lengthOf(1);
      expect(viewData[0].guru_utama_id).to.equal(primaryGuruId);
      expect(viewData[0].jumlah_guru_pendamping).to.equal(2);
      expect(viewData[0].total_guru).to.equal(3);
      console.log(`✅ View v_jadwal_guru_lengkap returns correct data:
        - Primary guru: ${viewData[0].nama_guru_utama}
        - Additional gurus: ${viewData[0].nama_guru_pendamping}
        - Total: ${viewData[0].total_guru} teachers
      `);
    });
  });
  
  describe('3. Record Absensi with Multi-Teacher', () => {
    const testTanggal = new Date().toISOString().split('T')[0];
    
    it('should record attendance for schedule', async () => {
      const [result] = await db.execute(`
        INSERT INTO absensi_guru_jadwal (jadwal_id, tanggal, jam_ke, status, keterangan)
        VALUES (?, ?, 1, 'Hadir', 'Test absensi multi-guru')
      `, [testJadwalId, testTanggal]);
      
      expect(result.insertId).to.be.greaterThan(0);
      console.log(`✅ Created absensi_guru_jadwal record ID: ${result.insertId}`);
    });
    
    it('should record individual teacher attendance in mapping', async () => {
      const [absensi] = await db.execute(`
        SELECT id FROM absensi_guru_jadwal WHERE jadwal_id = ? AND tanggal = ?
      `, [testJadwalId, testTanggal]);
      
      const absensiId = absensi[0].id;
      
      // Record attendance for all teachers
      const teachers = [primaryGuruId, additionalGuruId1, additionalGuruId2];
      const statuses = ['Hadir', 'Hadir', 'Sakit'];
      
      for (let i = 0; i < teachers.length; i++) {
        await db.execute(`
          INSERT INTO absensi_guru_mapping (absensi_guru_jadwal_id, guru_id, status, keterangan)
          VALUES (?, ?, ?, ?)
        `, [absensiId, teachers[i], statuses[i], `Test for guru ${teachers[i]}`]);
      }
      
      const [mappings] = await db.execute(`
        SELECT * FROM absensi_guru_mapping WHERE absensi_guru_jadwal_id = ?
      `, [absensiId]);
      
      expect(mappings).to.have.lengthOf(3);
      console.log(`✅ Recorded attendance for ${mappings.length} teachers:
        - Primary: ${statuses[0]}
        - Additional 1: ${statuses[1]}
        - Additional 2: ${statuses[2]}
      `);
    });
    
    it('should query attendance by guru_id using index', async () => {
      const [attendance] = await db.execute(`
        SELECT 
          agm.status,
          agm.keterangan,
          agj.tanggal,
          j.hari,
          j.jam_mulai,
          j.jam_selesai
        FROM absensi_guru_mapping agm
        JOIN absensi_guru_jadwal agj ON agm.absensi_guru_jadwal_id = agj.id
        JOIN jadwal j ON agj.jadwal_id = j.id_jadwal
        WHERE agm.guru_id = ?
        ORDER BY agj.tanggal DESC
      `, [additionalGuruId1]);
      
      expect(attendance.length).to.be.greaterThan(0);
      expect(attendance[0].status).to.equal('Hadir');
      console.log(`✅ Query by guru_id successful (using idx_agm_guru_lookup index)`);
    });
  });
  
  describe('4. Verify Indexes Performance', () => {
    it('should have all required indexes on jadwal_guru', async () => {
      const [indexes] = await db.execute(`
        SHOW INDEXES FROM jadwal_guru 
        WHERE Key_name IN ('idx_jg_is_primary', 'idx_jg_composite')
      `);
      
      expect(indexes.length).to.be.greaterThan(0);
      console.log(`✅ jadwal_guru has ${indexes.length} performance indexes`);
    });
    
    it('should have critical index on absensi_guru_mapping', async () => {
      const [indexes] = await db.execute(`
        SHOW INDEXES FROM absensi_guru_mapping 
        WHERE Key_name = 'idx_agm_guru_lookup'
      `);
      
      expect(indexes.length).to.be.greaterThan(0);
      console.log(`✅ absensi_guru_mapping has idx_agm_guru_lookup index`);
    });
  });
  
  describe('5. Cleanup Test Data', () => {
    it('should cleanup test jadwal and related data', async () => {
      // Delete will cascade to jadwal_guru due to FK constraints
      await db.execute('DELETE FROM jadwal WHERE id_jadwal = ?', [testJadwalId]);
      
      // Verify cleanup
      const [jadwal] = await db.execute('SELECT * FROM jadwal WHERE id_jadwal = ?', [testJadwalId]);
      const [jadwalGuru] = await db.execute('SELECT * FROM jadwal_guru WHERE jadwal_id = ?', [testJadwalId]);
      
      expect(jadwal).to.have.lengthOf(0);
      expect(jadwalGuru).to.have.lengthOf(0);
      console.log(`✅ Test data cleaned up`);
    });
  });
});

describe('Multi-Teacher Banding Absen Integration', function() {
  this.timeout(10000);
  
  it('should filter banding absen for multi-teacher schedules', async () => {
    const testGuruId = 17; // Use existing guru from database
    
    const [banding] = await db.execute(`
      SELECT 
        ba.id_banding,
        ba.tanggal_absen,
        m.nama_mapel,
        CASE 
          WHEN j.guru_id = ? THEN 'Guru Utama'
          WHEN jg.guru_id IS NOT NULL THEN 'Guru Tambahan'
          ELSE 'Guru Mapel'
        END as peran_guru
      FROM pengajuan_banding_absen ba
      JOIN jadwal j ON ba.jadwal_id = j.id_jadwal
      JOIN mapel m ON j.mapel_id = m.id_mapel
      LEFT JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id 
        AND jg.guru_id = ? AND jg.status = 'aktif'
      WHERE (j.guru_id = ? OR jg.guru_id = ?)
      LIMIT 5
    `, [testGuruId, testGuruId, testGuruId, testGuruId]);
    
    console.log(`✅ Banding absen query successful, found ${banding.length} records`);
    if (banding.length > 0) {
      console.log(`   Sample: ${banding[0].nama_mapel} (${banding[0].peran_guru})`);
    }
  });
});

