/**
 * Schedule Conflict Detector
 * Detects conflicts between jadwal (regular) and jadwal_khusus (special schedules)
 */

import { db } from '../../db.js';

/**
 * Check if two time ranges overlap
 */
export const isTimeOverlap = (start1, end1, start2, end2) => {
  // Convert time strings to comparable format (minutes since midnight)
  const toMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  
  // Check overlap: start1 < end2 AND start2 < end1
  return s1 < e2 && s2 < e1;
};

/**
 * Check for schedule conflicts before creating/updating jadwal
 */
export const checkJadwalConflicts = async (scheduleData) => {
  const { hari, jam_mulai, jam_selesai, kelas_id, id_jadwal = null } = scheduleData;
  
  const conflicts = [];
  
  try {
    // 1. Check conflict with jadwal_khusus (istirahat, upacara, perwalian)
    const [jadwalKhusus] = await db.execute(
      `SELECT 
        jk.id,
        jk.nama_kegiatan,
        jk.jenis_kegiatan,
        jk.hari,
        jk.jam_mulai,
        jk.jam_selesai,
        jk.kelas_id,
        k.nama_kelas
      FROM jadwal_khusus jk
      LEFT JOIN kelas k ON jk.kelas_id = k.id_kelas
      WHERE jk.hari = ? 
        AND jk.status = 'aktif'
        AND (jk.kelas_id IS NULL OR jk.kelas_id = ?)`,
      [hari, kelas_id]
    );
    
    for (const jk of jadwalKhusus) {
      if (isTimeOverlap(jam_mulai, jam_selesai, jk.jam_mulai, jk.jam_selesai)) {
        conflicts.push({
          type: 'jadwal_khusus',
          conflictWith: {
            id: jk.id,
            nama: jk.nama_kegiatan,
            jenis: jk.jenis_kegiatan,
            hari: jk.hari,
            jam_mulai: jk.jam_mulai,
            jam_selesai: jk.jam_selesai,
            kelas: jk.nama_kelas || 'Semua Kelas'
          },
          message: `Bentrok dengan ${jk.jenis_kegiatan.toUpperCase()}: "${jk.nama_kegiatan}" (${jk.jam_mulai} - ${jk.jam_selesai})`
        });
      }
    }
    
    // 2. Check conflict with other jadwal (regular schedules)
    let jadwalQuery = `
      SELECT 
        j.id_jadwal,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        m.nama_mapel,
        k.nama_kelas,
        g.nama as nama_guru
      FROM jadwal j
      JOIN mapel m ON j.mapel_id = m.id_mapel
      JOIN kelas k ON j.kelas_id = k.id_kelas
      JOIN guru g ON j.guru_id = g.id_guru
      WHERE j.hari = ? 
        AND j.kelas_id = ?
        AND j.status = 'aktif'
    `;
    
    const queryParams = [hari, kelas_id];
    
    // Exclude current schedule if updating
    if (id_jadwal) {
      jadwalQuery += ' AND j.id_jadwal != ?';
      queryParams.push(id_jadwal);
    }
    
    const [jadwalExisting] = await db.execute(jadwalQuery, queryParams);
    
    for (const j of jadwalExisting) {
      if (isTimeOverlap(jam_mulai, jam_selesai, j.jam_mulai, j.jam_selesai)) {
        conflicts.push({
          type: 'jadwal',
          conflictWith: {
            id: j.id_jadwal,
            mapel: j.nama_mapel,
            kelas: j.nama_kelas,
            guru: j.nama_guru,
            hari: j.hari,
            jam_mulai: j.jam_mulai,
            jam_selesai: j.jam_selesai
          },
          message: `Bentrok dengan jadwal pelajaran: ${j.nama_mapel} - ${j.nama_guru} (${j.jam_mulai} - ${j.jam_selesai})`
        });
      }
    }
    
    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      totalConflicts: conflicts.length
    };
    
  } catch (error) {
    console.error('❌ Error checking schedule conflicts:', error);
    throw error;
  }
};

/**
 * Check for jadwal_khusus conflicts
 */
export const checkJadwalKhususConflicts = async (scheduleData) => {
  const { 
    hari, 
    jam_mulai, 
    jam_selesai, 
    kelas_id, 
    jenis_kegiatan,
    id = null 
  } = scheduleData;
  
  const conflicts = [];
  
  try {
    // 1. Check with other jadwal_khusus
    let queryKhusus = `
      SELECT 
        id,
        nama_kegiatan,
        jenis_kegiatan,
        hari,
        jam_mulai,
        jam_selesai,
        kelas_id
      FROM jadwal_khusus
      WHERE hari = ? 
        AND status = 'aktif'
    `;
    
    const paramsKhusus = [hari];
    
    // Add kelas_id check
    if (kelas_id) {
      queryKhusus += ' AND (kelas_id IS NULL OR kelas_id = ?)';
      paramsKhusus.push(kelas_id);
    }
    
    // Exclude current schedule if updating
    if (id) {
      queryKhusus += ' AND id != ?';
      paramsKhusus.push(id);
    }
    
    const [khususExisting] = await db.execute(queryKhusus, paramsKhusus);
    
    for (const jk of khususExisting) {
      if (isTimeOverlap(jam_mulai, jam_selesai, jk.jam_mulai, jk.jam_selesai)) {
        conflicts.push({
          type: 'jadwal_khusus',
          conflictWith: {
            id: jk.id,
            nama: jk.nama_kegiatan,
            jenis: jk.jenis_kegiatan,
            hari: jk.hari,
            jam_mulai: jk.jam_mulai,
            jam_selesai: jk.jam_selesai
          },
          message: `Bentrok dengan ${jk.jenis_kegiatan}: "${jk.nama_kegiatan}"`
        });
      }
    }
    
    // 2. Check with jadwal (regular schedules) - ONLY if NOT upacara (upacara affects all classes)
    if (jenis_kegiatan !== 'upacara') {
      let queryJadwal = `
        SELECT 
          j.id_jadwal,
          j.hari,
          j.jam_mulai,
          j.jam_selesai,
          m.nama_mapel,
          k.nama_kelas,
          g.nama as nama_guru
        FROM jadwal j
        JOIN mapel m ON j.mapel_id = m.id_mapel
        JOIN kelas k ON j.kelas_id = k.id_kelas
        JOIN guru g ON j.guru_id = g.id_guru
        WHERE j.hari = ? 
          AND j.status = 'aktif'
      `;
      
      const paramsJadwal = [hari];
      
      // If perwalian/istirahat with specific kelas, only check that kelas
      if (kelas_id && jenis_kegiatan !== 'istirahat') {
        queryJadwal += ' AND j.kelas_id = ?';
        paramsJadwal.push(kelas_id);
      }
      
      const [jadwalExisting] = await db.execute(queryJadwal, paramsJadwal);
      
      for (const j of jadwalExisting) {
        if (isTimeOverlap(jam_mulai, jam_selesai, j.jam_mulai, j.jam_selesai)) {
          conflicts.push({
            type: 'jadwal',
            conflictWith: {
              id: j.id_jadwal,
              mapel: j.nama_mapel,
              kelas: j.nama_kelas,
              guru: j.nama_guru,
              hari: j.hari,
              jam_mulai: j.jam_mulai,
              jam_selesai: j.jam_selesai
            },
            message: `Bentrok dengan jadwal pelajaran: ${j.nama_mapel} (${j.nama_kelas}) - ${j.jam_mulai} s/d ${j.jam_selesai}`
          });
        }
      }
    }
    
    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      totalConflicts: conflicts.length
    };
    
  } catch (error) {
    console.error('❌ Error checking jadwal khusus conflicts:', error);
    throw error;
  }
};

/**
 * Get all schedules for a specific day and class (combined view)
 */
export const getDayScheduleOverview = async (hari, kelas_id = null) => {
  try {
    const schedules = [];
    
    // Get jadwal (regular)
    let jadwalQuery = `
      SELECT 
        j.id_jadwal as id,
        'jadwal' as type,
        j.hari,
        j.jam_ke,
        j.jam_mulai,
        j.jam_selesai,
        m.nama_mapel as nama,
        k.nama_kelas as kelas,
        g.nama as guru,
        j.status
      FROM jadwal j
      JOIN mapel m ON j.mapel_id = m.id_mapel
      JOIN kelas k ON j.kelas_id = k.id_kelas
      JOIN guru g ON j.guru_id = g.id_guru
      WHERE j.hari = ? AND j.status = 'aktif'
    `;
    
    const jadwalParams = [hari];
    
    if (kelas_id) {
      jadwalQuery += ' AND j.kelas_id = ?';
      jadwalParams.push(kelas_id);
    }
    
    const [jadwal] = await db.execute(jadwalQuery, jadwalParams);
    schedules.push(...jadwal);
    
    // Get jadwal_khusus
    let khususQuery = `
      SELECT 
        jk.id,
        'jadwal_khusus' as type,
        jk.hari,
        NULL as jam_ke,
        jk.jam_mulai,
        jk.jam_selesai,
        jk.nama_kegiatan as nama,
        COALESCE(k.nama_kelas, 'Semua Kelas') as kelas,
        jk.jenis_kegiatan as guru,
        jk.status
      FROM jadwal_khusus jk
      LEFT JOIN kelas k ON jk.kelas_id = k.id_kelas
      WHERE jk.hari = ? AND jk.status = 'aktif'
    `;
    
    const khususParams = [hari];
    
    if (kelas_id) {
      khususQuery += ' AND (jk.kelas_id IS NULL OR jk.kelas_id = ?)';
      khususParams.push(kelas_id);
    }
    
    const [khusus] = await db.execute(khususQuery, khususParams);
    schedules.push(...khusus);
    
    // Sort by jam_mulai
    schedules.sort((a, b) => {
      const timeA = a.jam_mulai.split(':').map(Number);
      const timeB = b.jam_mulai.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
    
    return schedules;
    
  } catch (error) {
    console.error('❌ Error getting day schedule overview:', error);
    throw error;
  }
};

/**
 * Detect conflicts in array of schedules
 * Used for global schedule view to highlight conflicting schedules
 */
export const detectAllConflicts = async (schedules) => {
  const schedulesWithConflicts = [];
  
  for (let i = 0; i < schedules.length; i++) {
    const schedule = schedules[i];
    const conflicts = [];
    
    // Check against other schedules in same day and class
    for (let j = 0; j < schedules.length; j++) {
      if (i === j) continue;
      
      const other = schedules[j];
      
      // Check same day
      if (schedule.hari !== other.hari) continue;
      
      // Check same class or global (for jadwal_khusus)
      const isSameClass = 
        (schedule.kelas_id === other.kelas_id) ||
        (schedule.type === 'jadwal_khusus' && !schedule.kelas_id) ||
        (other.type === 'jadwal_khusus' && !other.kelas_id);
      
      if (!isSameClass) continue;
      
      // Check time overlap
      if (isTimeOverlap(schedule.jam_mulai, schedule.jam_selesai, other.jam_mulai, other.jam_selesai)) {
        conflicts.push({
          conflictWithId: other.id,
          conflictWithType: other.type,
          conflictWithName: other.nama_mapel || other.nama_kegiatan,
          conflictWithClass: other.nama_kelas,
          conflictWithTime: `${other.jam_mulai} - ${other.jam_selesai}`
        });
      }
    }
    
    schedulesWithConflicts.push({
      ...schedule,
      hasConflict: conflicts.length > 0,
      conflicts: conflicts
    });
  }
  
  return schedulesWithConflicts;
};

export default {
  isTimeOverlap,
  checkJadwalConflicts,
  checkJadwalKhususConflicts,
  getDayScheduleOverview,
  detectAllConflicts
};

