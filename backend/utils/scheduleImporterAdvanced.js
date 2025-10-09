/**
 * Advanced Schedule Importer untuk Format Matrix Excel
 * Mendukung parsing sheet JADWAL dengan struktur 3 baris per kelas
 */

/**
 * Parse header kolom untuk ekstrak hari dan jam_ke
 * @param {Object} worksheet - ExcelJS worksheet
 * @param {Object} config - Konfigurasi impor
 * @returns {Array} Array of {hari, jam_ke, colIndex}
 */
function parseHeaders(worksheet, config) {
  const headers = [];
  const headerPattern = new RegExp(config.headerPatterns.hariJam, 'i');
  
  // Baca header dari baris pertama (row 1)
  for (let col = 2; col <= worksheet.columnCount; col++) {
    const cellValue = worksheet.getCell(1, col).value;
    if (!cellValue) continue;
    
    const match = cellValue.toString().match(headerPattern);
    if (match) {
      const [, hariRaw, jamKeRaw] = match;
      const hari = normalizeHariName(hariRaw);
      const jam_ke = parseInt(jamKeRaw);
      
      if (hari && jam_ke) {
        headers.push({ hari, jam_ke, colIndex: col });
      }
    }
  }
  
  return headers;
}

/**
 * Normalisasi nama hari ke format standar
 * @param {string} hariRaw - Nama hari dari Excel
 * @returns {string} Nama hari yang dinormalisasi
 */
function normalizeHariName(hariRaw) {
  const mapping = {
    'SEN': 'Senin', 'SEL': 'Selasa', 'RAB': 'Rabu',
    'KAM': 'Kamis', 'JUM': 'Jumat',
    'SENIN': 'Senin', 'SELASA': 'Selasa', 'RABU': 'Rabu',
    'KAMIS': 'Kamis', 'JUMAT': 'Jumat'
  };
  
  return mapping[hariRaw.toUpperCase()] || hariRaw;
}

/**
 * Parse sheet JADWAL dengan format matrix grid
 * @param {Object} worksheet - ExcelJS worksheet
 * @param {Object} config - Konfigurasi impor
 * @returns {Array} Array of raw entries
 */
function parseJadwalSheet(worksheet, config) {
  const rawEntries = [];
  const headers = parseHeaders(worksheet, config);
  
  if (headers.length === 0) {
    throw new Error('Tidak ada header kolom yang valid ditemukan');
  }
  
  // Iterate rows dalam kelompok 3 (guru, mapel, ruang)
  for (let i = 2; i <= worksheet.rowCount; i += 3) {
    if (i + 2 > worksheet.rowCount) break;
    
    const namaKelas = worksheet.getCell(i, 1).value;
    if (!namaKelas || typeof namaKelas !== 'string') continue;
    
    // Parse setiap kolom hari-jam
    for (const { hari, jam_ke, colIndex } of headers) {
      const guruCode = worksheet.getCell(i, colIndex).value;     // Baris 1: Kode Guru
      const mapelAlias = worksheet.getCell(i + 1, colIndex).value; // Baris 2: Alias Mapel
      const ruang = worksheet.getCell(i + 2, colIndex).value;      // Baris 3: Ruang
      
      // Hanya proses jika ada guru dan mapel
      if (guruCode && mapelAlias) {
        rawEntries.push({
          namaKelas: namaKelas.trim(),
          hari,
          jam_ke,
          guruCode: guruCode.toString().trim(),
          mapelAlias: mapelAlias.toString().trim(),
          ruang: ruang ? ruang.toString().trim() : ''
        });
      }
    }
  }
  
  return rawEntries;
}

/**
 * Validasi dan transformasi raw entries ke format database
 * @param {Array} rawEntries - Array of raw entries
 * @param {Object} caches - Cache data dari database
 * @returns {Object} {valid, errors}
 */
function validateAndTransform(rawEntries, caches) {
  const valid = [];
  const errors = [];
  
  for (const entry of rawEntries) {
    const rowErrors = [];
    
    // Validasi dan mapping kelas
    const kelasId = caches.kelas[entry.namaKelas];
    if (!kelasId) {
      rowErrors.push(`Kelas "${entry.namaKelas}" tidak ditemukan`);
    }
    
    // Validasi dan mapping guru: G1 → id_guru=1 → guru.id_guru (BUKAN guru.id)
    const guruMatch = entry.guruCode.match(/^G(\d+)$/i);
    let guruId = null;
    if (!guruMatch) {
      rowErrors.push(`Kode guru "${entry.guruCode}" tidak valid (format: G1, G2, dst)`);
    } else {
      const idGuru = parseInt(guruMatch[1]);
      // Mapping: G1 → id_guru=1 → jadwal.guru_id=1 (mengacu ke guru.id_guru)
      guruId = idGuru; // Langsung gunakan id_guru sebagai guru_id di jadwal
      if (!caches.guru[idGuru]) {
        rowErrors.push(`Guru G${idGuru} tidak ditemukan di database`);
      }
    }
    
    // Validasi dan mapping mapel: alias → kode_mapel → mapel.id_mapel
    const kodeMapel = caches.aliasMap[entry.mapelAlias.toUpperCase()];
    let mapelId = null;
    if (!kodeMapel) {
      rowErrors.push(`Alias mapel "${entry.mapelAlias}" tidak terdaftar di konfigurasi`);
    } else {
      // Mapping: MTK → MTK-01 → mapel.id_mapel
      mapelId = caches.mapel[kodeMapel];
      if (!mapelId) {
        rowErrors.push(`Mapel "${kodeMapel}" tidak ditemukan di database`);
      }
    }
    
    // Validasi time slot
    const slot = caches.timeSlots[entry.hari]?.find(s => s.jam_ke === entry.jam_ke);
    if (!slot) {
      rowErrors.push(`Slot waktu ${entry.hari} jam ${entry.jam_ke} tidak ditemukan di konfigurasi`);
    }
    
    // Jika ada error, tambahkan ke list errors
    if (rowErrors.length > 0) {
      errors.push({
        row: `${entry.namaKelas} - ${entry.hari} Jam ${entry.jam_ke}`,
        errors: rowErrors,
        data: {
          guruCode: entry.guruCode,
          mapelAlias: entry.mapelAlias,
          ruang: entry.ruang
        }
      });
    } else {
      // Data valid, tambahkan ke list valid
      valid.push({
        kelas_id: kelasId,
        guru_id: guruId,
        mapel_id: mapelId,
        hari: entry.hari,
        jam_ke: entry.jam_ke,
        jam_mulai: slot.jam_mulai,
        jam_selesai: slot.jam_selesai,
        status: 'aktif'
      });
    }
  }
  
  return { valid, errors };
}

/**
 * Upsert schedules ke database dengan transaksi per kelas
 * @param {Array} validEntries - Array of valid entries
 * @param {Object} db - Database connection pool
 * @returns {Object} {inserted, updated}
 */
async function upsertSchedules(validEntries, db) {
  let inserted = 0;
  let updated = 0;
  
  // Group by kelas_id untuk transaksi per kelas
  const byKelas = {};
  for (const entry of validEntries) {
    if (!byKelas[entry.kelas_id]) {
      byKelas[entry.kelas_id] = [];
    }
    byKelas[entry.kelas_id].push(entry);
  }
  
  // Process setiap kelas dalam transaksi terpisah
  for (const [kelasId, entries] of Object.entries(byKelas)) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      
      for (const entry of entries) {
        // Cek apakah jadwal sudah ada
        const [existing] = await conn.execute(
          `SELECT id_jadwal FROM jadwal 
           WHERE kelas_id = ? AND hari = ? AND jam_ke = ?`,
          [entry.kelas_id, entry.hari, entry.jam_ke]
        );
        
        if (existing.length > 0) {
          // UPDATE existing record
          await conn.execute(
            `UPDATE jadwal 
             SET guru_id = ?, mapel_id = ?, 
                 jam_mulai = ?, jam_selesai = ?, status = ?
             WHERE id_jadwal = ?`,
            [
              entry.guru_id, entry.mapel_id, 
              entry.jam_mulai, entry.jam_selesai, 
              entry.status, existing[0].id_jadwal
            ]
          );
          updated++;
        } else {
          // INSERT new record
          await conn.execute(
            `INSERT INTO jadwal 
             (kelas_id, mapel_id, guru_id, hari, jam_ke, 
              jam_mulai, jam_selesai, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              entry.kelas_id, entry.mapel_id, entry.guru_id, 
              entry.hari, entry.jam_ke, 
              entry.jam_mulai, entry.jam_selesai, entry.status
            ]
          );
          inserted++;
        }
      }
      
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw new Error(`Gagal upsert jadwal untuk kelas ${kelasId}: ${error.message}`);
    } finally {
      conn.release();
    }
  }
  
  return { inserted, updated };
}

/**
 * Generate laporan import
 * @param {Object} summary - Ringkasan hasil import
 * @param {Array} errors - Array of errors
 * @returns {Object} Laporan lengkap
 */
function generateReport(summary, errors) {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      total: summary.total,
      inserted: summary.inserted,
      updated: summary.updated,
      errors: errors.length,
      success_rate: summary.total > 0 ? 
        ((summary.inserted + summary.updated) / summary.total * 100).toFixed(2) + '%' : '0%'
    },
    errors: errors,
    recommendations: generateRecommendations(errors)
  };
}

/**
 * Generate rekomendasi berdasarkan error yang ditemukan
 * @param {Array} errors - Array of errors
 * @returns {Array} Array of recommendations
 */
function generateRecommendations(errors) {
  const recommendations = [];
  const errorTypes = {};
  
  // Analisis tipe error
  for (const error of errors) {
    for (const errMsg of error.errors) {
      if (errMsg.includes('tidak ditemukan')) {
        errorTypes['data_not_found'] = (errorTypes['data_not_found'] || 0) + 1;
      } else if (errMsg.includes('tidak valid')) {
        errorTypes['invalid_format'] = (errorTypes['invalid_format'] || 0) + 1;
      } else if (errMsg.includes('tidak terdaftar')) {
        errorTypes['unregistered_alias'] = (errorTypes['unregistered_alias'] || 0) + 1;
      }
    }
  }
  
  // Generate rekomendasi
  if (errorTypes['data_not_found']) {
    recommendations.push('Periksa data master (guru, kelas, mapel) di database');
  }
  if (errorTypes['invalid_format']) {
    recommendations.push('Pastikan format kode guru menggunakan pola G1, G2, dst');
  }
  if (errorTypes['unregistered_alias']) {
    recommendations.push('Tambahkan alias mapel yang belum terdaftar di konfigurasi');
  }
  
  return recommendations;
}

export {
  parseJadwalSheet,
  validateAndTransform,
  upsertSchedules,
  generateReport,
  parseHeaders,
  normalizeHariName
};
