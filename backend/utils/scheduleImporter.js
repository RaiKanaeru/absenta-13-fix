import XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

/**
 * Schedule Importer untuk format Excel 3-sheet
 * Mendukung format matrix grid dengan parsing otomatis
 */
class ScheduleImporter {
  constructor(dbPool) {
    this.dbPool = dbPool;
    this.config = null;
    this.mapelAlias = null;
    this.kelasMap = null;
    this.caches = {};
  }

  /**
   * Load konfigurasi dari file
   */
  async loadConfigs() {
    try {
      const configPath = path.join(__dirname, '../config/schedule-import.config.json');
      const mapelPath = path.join(__dirname, '../config/mapel-alias.json');
      const kelasPath = path.join(__dirname, '../config/kelas-map.json');

      this.config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      this.mapelAlias = JSON.parse(await fs.readFile(mapelPath, 'utf-8'));
      this.kelasMap = JSON.parse(await fs.readFile(kelasPath, 'utf-8'));
    } catch (error) {
      throw new Error(`Gagal memuat konfigurasi: ${error.message}`);
    }
  }

  /**
   * Build cache mapping dari database
   */
  async buildCaches() {
    try {
      // Cache guru: id_guru -> guru.id (PK)
      const [guruRows] = await this.dbPool.execute(
        'SELECT id, id_guru, nama FROM guru WHERE status = "aktif"'
      );
      this.caches.guru = {};
      for (const row of guruRows) {
        this.caches.guru[row.id_guru] = {
          id: row.id,
          nama: row.nama
        };
      }

      // Cache kelas: nama_kelas -> id_kelas
      const [kelasRows] = await this.dbPool.execute(
        'SELECT id_kelas, nama_kelas FROM kelas WHERE status = "aktif"'
      );
      this.caches.kelas = {};
      for (const row of kelasRows) {
        this.caches.kelas[row.nama_kelas] = row.id_kelas;
      }

      // Cache mapel: kode_mapel -> id_mapel
      const [mapelRows] = await this.dbPool.execute(
        'SELECT id_mapel, kode_mapel, nama_mapel FROM mapel WHERE status = "aktif"'
      );
      this.caches.mapel = {};
      for (const row of mapelRows) {
        this.caches.mapel[row.kode_mapel] = {
          id: row.id_mapel,
          nama: row.nama_mapel
        };
      }

      // Cache alias mapel
      this.caches.aliasMap = this.mapelAlias.aliases;

      // Cache time slots
      this.caches.timeSlots = this.config.timeSlots;

    } catch (error) {
      throw new Error(`Gagal membangun cache: ${error.message}`);
    }
  }

  /**
   * Parse header kolom untuk ekstrak hari dan jam_ke
   */
  parseHeaders(worksheet) {
    const headers = [];
    const headerRow = 0; // Baris pertama adalah header (0-indexed)
    
    // Dapatkan range kolom dari worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    for (let col = 1; col <= range.e.c; col++) { // Mulai dari kolom B (index 1)
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
      const cell = worksheet[cellAddress];
      if (!cell || !cell.v) continue;

      const match = cell.v.toString().match(/^(Senin|Selasa|Rabu|Kamis|Jumat|SEN|SEL|RAB|KAM|JUM)[-\s]?(\d+)$/i);
      if (match) {
        let hari = match[1].toLowerCase();
        const jamKe = parseInt(match[2]);

        // Normalisasi nama hari
        const hariMap = {
          'sen': 'senin', 'sel': 'selasa', 'rab': 'rabu',
          'kam': 'kamis', 'jum': 'jumat'
        };
        hari = hariMap[hari] || hari;

        // Normalisasi ke format standar
        hari = hari.charAt(0).toUpperCase() + hari.slice(1);

        headers[col] = { hari, jam_ke: jamKe };
      }
    }

    return headers;
  }

  /**
   * Parse sheet JADWAL dengan format matrix grid
   */
  parseJadwalSheet(worksheet) {
    const rawEntries = [];
    const headers = this.parseHeaders(worksheet);

    // Dapatkan range dari worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);

    // Iterasi baris dalam grup 3 (setiap 3 baris = 1 kelas)
    for (let row = 1; row <= range.e.r; row += 3) { // Mulai dari baris 2 (index 1)
      if (row + 2 > range.e.r) break;

      // Ambil nama kelas dari kolom pertama (baris pertama grup)
      const kelasCell = XLSX.utils.encode_cell({ r: row, c: 0 });
      const namaKelas = worksheet[kelasCell]?.v;
      if (!namaKelas) continue;

      // Normalisasi nama kelas
      const normalizedKelas = this.kelasMap.normalization[namaKelas] || namaKelas;

      // Iterasi kolom untuk setiap slot waktu
      for (let col = 1; col <= range.e.c; col++) { // Mulai dari kolom B (index 1)
        const header = headers[col];
        if (!header) continue;

        const { hari, jam_ke } = header;

        // Baris 1: Kode Guru (G1, G2, dst)
        const guruCell = XLSX.utils.encode_cell({ r: row, c: col });
        const guruCode = worksheet[guruCell]?.v;
        
        // Baris 2: Alias Mapel
        const mapelCell = XLSX.utils.encode_cell({ r: row + 1, c: col });
        const mapelAlias = worksheet[mapelCell]?.v;
        
        // Baris 3: Ruang (diabaikan, tapi di-log)
        const ruangCell = XLSX.utils.encode_cell({ r: row + 2, c: col });
        const ruang = worksheet[ruangCell]?.v;

        // Hanya proses jika ada kode guru dan alias mapel
        if (guruCode && mapelAlias) {
          rawEntries.push({
            namaKelas: normalizedKelas,
            hari,
            jam_ke,
            guruCode: guruCode.toString().trim(),
            mapelAlias: mapelAlias.toString().trim(),
            ruang: ruang ? ruang.toString().trim() : null
          });
        }
      }
    }

    return rawEntries;
  }

  /**
   * Validasi dan transformasi data mentah ke format database
   */
  validateAndTransform(rawEntries) {
    const valid = [];
    const errors = [];

    for (const entry of rawEntries) {
      const rowErrors = [];

      // Validasi dan mapping kelas
      const kelasId = this.caches.kelas[entry.namaKelas];
      if (!kelasId) {
        rowErrors.push(`Kelas "${entry.namaKelas}" tidak ditemukan`);
      }

      // Validasi dan mapping guru: G1 -> id_guru=1 -> guru.id
      const guruMatch = entry.guruCode.match(/^G(\d+)$/i);
      if (!guruMatch) {
        rowErrors.push(`Kode guru "${entry.guruCode}" tidak valid (format: G1, G2, dst)`);
      } else {
        const idGuru = parseInt(guruMatch[1]);
        const guruData = this.caches.guru[idGuru];
        if (!guruData) {
          rowErrors.push(`Guru G${idGuru} tidak ditemukan`);
        }
      }

      // Validasi dan mapping mapel: alias -> kode_mapel -> id_mapel
      const kodeMapel = this.caches.aliasMap[entry.mapelAlias.toUpperCase()];
      if (!kodeMapel) {
        rowErrors.push(`Alias mapel "${entry.mapelAlias}" tidak terdaftar`);
      } else {
        const mapelData = this.caches.mapel[kodeMapel];
        if (!mapelData) {
          rowErrors.push(`Mapel "${kodeMapel}" tidak ditemukan di database`);
        }
      }

      // Validasi time slot
      const timeSlot = this.caches.timeSlots[entry.hari]?.[entry.jam_ke.toString()];
      if (!timeSlot) {
        rowErrors.push(`Slot waktu ${entry.hari} jam ${entry.jam_ke} tidak ditemukan`);
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: `${entry.namaKelas} - ${entry.hari} Jam ${entry.jam_ke}`,
          errors: rowErrors,
          data: entry
        });
      } else {
        // Build record valid
        const idGuru = parseInt(entry.guruCode.match(/^G(\d+)$/i)[1]);
        const guruData = this.caches.guru[idGuru];
        const kodeMapel = this.caches.aliasMap[entry.mapelAlias.toUpperCase()];
        const mapelData = this.caches.mapel[kodeMapel];
        const timeSlot = this.caches.timeSlots[entry.hari][entry.jam_ke.toString()];

        valid.push({
          kelas_id: kelasId,
          guru_id: guruData.id,
          mapel_id: mapelData.id,
          hari: entry.hari,
          jam_ke: entry.jam_ke,
          jam_mulai: timeSlot.jam_mulai,
          jam_selesai: timeSlot.jam_selesai,
          status: 'aktif'
        });
      }
    }

    return { valid, errors };
  }

  /**
   * Validasi bentrok jadwal (guru dan kelas)
   */
  async validateConflicts(validEntries) {
    const conflicts = [];
    
    // Group by guru dan kelas untuk validasi bentrok
    const guruSchedules = {};
    const kelasSchedules = {};
    
    for (const entry of validEntries) {
      // Group by guru
      if (!guruSchedules[entry.guru_id]) {
        guruSchedules[entry.guru_id] = [];
      }
      guruSchedules[entry.guru_id].push(entry);
      
      // Group by kelas
      if (!kelasSchedules[entry.kelas_id]) {
        kelasSchedules[entry.kelas_id] = [];
      }
      kelasSchedules[entry.kelas_id].push(entry);
    }
    
    // Validasi bentrok guru
    for (const [guruId, schedules] of Object.entries(guruSchedules)) {
      for (let i = 0; i < schedules.length; i++) {
        for (let j = i + 1; j < schedules.length; j++) {
          const s1 = schedules[i];
          const s2 = schedules[j];
          
          if (s1.hari === s2.hari && this.isTimeOverlap(s1.jam_mulai, s1.jam_selesai, s2.jam_mulai, s2.jam_selesai)) {
            conflicts.push({
              type: 'guru',
              guru_id: guruId,
              guru_name: this.caches.guru[guruId]?.nama || 'Unknown',
              hari: s1.hari,
              schedule1: {
                kelas: this.getKelasName(s1.kelas_id),
                mapel: this.getMapelName(s1.mapel_id),
                jam: `${s1.jam_mulai}-${s1.jam_selesai}`
              },
              schedule2: {
                kelas: this.getKelasName(s2.kelas_id),
                mapel: this.getMapelName(s2.mapel_id),
                jam: `${s2.jam_mulai}-${s2.jam_selesai}`
              }
            });
          }
        }
      }
    }
    
    // Validasi bentrok kelas
    for (const [kelasId, schedules] of Object.entries(kelasSchedules)) {
      for (let i = 0; i < schedules.length; i++) {
        for (let j = i + 1; j < schedules.length; j++) {
          const s1 = schedules[i];
          const s2 = schedules[j];
          
          if (s1.hari === s2.hari && this.isTimeOverlap(s1.jam_mulai, s1.jam_selesai, s2.jam_mulai, s2.jam_selesai)) {
            conflicts.push({
              type: 'kelas',
              kelas_id: kelasId,
              kelas_name: this.getKelasName(kelasId),
              hari: s1.hari,
              schedule1: {
                guru: this.caches.guru[s1.guru_id]?.nama || 'Unknown',
                mapel: this.getMapelName(s1.mapel_id),
                jam: `${s1.jam_mulai}-${s1.jam_selesai}`
              },
              schedule2: {
                guru: this.caches.guru[s2.guru_id]?.nama || 'Unknown',
                mapel: this.getMapelName(s2.mapel_id),
                jam: `${s2.jam_mulai}-${s2.jam_selesai}`
              }
            });
          }
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Helper function untuk cek overlap waktu
   */
  isTimeOverlap(start1, end1, start2, end2) {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);
    
    return start1Min < end2Min && start2Min < end1Min;
  }

  /**
   * Helper function untuk mendapatkan nama kelas
   */
  getKelasName(kelasId) {
    for (const [nama, id] of Object.entries(this.caches.kelas)) {
      if (id === kelasId) return nama;
    }
    return 'Unknown';
  }

  /**
   * Helper function untuk mendapatkan nama mapel
   */
  getMapelName(mapelId) {
    for (const [kode, data] of Object.entries(this.caches.mapel)) {
      if (data.id === mapelId) return data.nama;
    }
    return 'Unknown';
  }

  /**
   * Upsert jadwal ke database (idempoten per kelas)
   */
  async upsertSchedules(validEntries) {
    let inserted = 0;
    let updated = 0;

    // Group by kelas_id untuk transaksi per kelas
    const byKelas = {};
    for (const entry of validEntries) {
      if (!byKelas[entry.kelas_id]) byKelas[entry.kelas_id] = [];
      byKelas[entry.kelas_id].push(entry);
    }

    for (const [kelasId, entries] of Object.entries(byKelas)) {
      const conn = await this.dbPool.getConnection();
      try {
        await conn.beginTransaction();

        for (const entry of entries) {
          // Cek apakah sudah ada
          const [existing] = await conn.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE kelas_id = ? AND hari = ? AND jam_ke = ?`,
            [entry.kelas_id, entry.hari, entry.jam_ke]
          );

          if (existing.length > 0) {
            // UPDATE
            await conn.execute(
              `UPDATE jadwal 
               SET guru_id = ?, mapel_id = ?, 
                   jam_mulai = ?, jam_selesai = ?, status = ?
               WHERE id_jadwal = ?`,
              [entry.guru_id, entry.mapel_id, entry.jam_mulai, 
               entry.jam_selesai, entry.status, existing[0].id_jadwal]
            );
            updated++;
          } else {
            // INSERT
            await conn.execute(
              `INSERT INTO jadwal 
               (kelas_id, mapel_id, guru_id, hari, jam_ke, 
                jam_mulai, jam_selesai, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [entry.kelas_id, entry.mapel_id, entry.guru_id, entry.hari, 
               entry.jam_ke, entry.jam_mulai, entry.jam_selesai, entry.status]
            );
            inserted++;
          }
        }

        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    }

    return { inserted, updated };
  }

  /**
   * Validasi silang dengan sheet JAM GURU (opsional)
   */
  async validateCrossCheck(worksheet) {
    const warnings = [];

    // Implementasi validasi silang bisa ditambahkan di sini
    // untuk membandingkan total jam mengajar per guru

    return warnings;
  }

  /**
   * Generate laporan import
   */
  generateReport(summary, errors, warnings = []) {
    const timestamp = new Date().toISOString();
    
    return {
      timestamp,
      summary: {
        total: summary.total,
        valid: summary.valid,
        invalid: summary.invalid,
        inserted: summary.inserted || 0,
        updated: summary.updated || 0,
        skipped: summary.skipped || 0
      },
      errors,
      warnings,
      config: {
        version: this.config.version,
        strictMode: this.config.importOptions.strictMode
      }
    };
  }

  /**
   * Main import method
   */
  async importSchedule(fileBuffer, options = {}) {
    try {
      // Load konfigurasi
      await this.loadConfigs();
      await this.buildCaches();

      // Parse Excel file
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const jadwalSheet = workbook.Sheets[this.config.sheets.jadwal];
      
      if (!jadwalSheet) {
        throw new Error(`Sheet "${this.config.sheets.jadwal}" tidak ditemukan`);
      }

      // Parse data
      const rawEntries = this.parseJadwalSheet(jadwalSheet);
      const { valid, errors } = this.validateAndTransform(rawEntries);

      // Validasi bentrok jadwal
      const conflicts = await this.validateConflicts(valid);

      // Validasi silang (opsional)
      const warnings = await this.validateCrossCheck(jadwalSheet);

      const summary = {
        total: rawEntries.length,
        valid: valid.length,
        invalid: errors.length,
        skipped: errors.length,
        conflicts: conflicts.length
      };

      // Jika ada bentrok, tambahkan ke errors
      if (conflicts.length > 0) {
        for (const conflict of conflicts) {
          errors.push({
            row: `${conflict.type === 'guru' ? conflict.guru_name : conflict.kelas_name} - ${conflict.hari}`,
            errors: [`Bentrok ${conflict.type}: ${conflict.schedule1.jam} vs ${conflict.schedule2.jam}`],
            data: conflict
          });
        }
      }

      // Jika dry run, return tanpa update database
      if (options.dryRun) {
        return {
          success: true,
          dryRun: true,
          summary,
          errors,
          warnings,
          conflicts
        };
      }

      // Upsert ke database
      const { inserted, updated } = await this.upsertSchedules(valid);
      
      summary.inserted = inserted;
      summary.updated = updated;

      return {
        success: true,
        summary,
        errors,
        warnings,
        conflicts
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        summary: { total: 0, valid: 0, invalid: 0, inserted: 0, updated: 0 }
      };
    }
  }
}

export default ScheduleImporter;
