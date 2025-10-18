// Attendance Aggregation Service
// Implements daily attendance calculation according to business rules

import { db } from '../../db.js';

/**
 * Status types for attendance
 */
const STATUS_TYPES = {
  HADIR: 'Hadir',
  TERLAMBAT: 'Terlambat', 
  SAKIT: 'Sakit',
  IZIN: 'Izin',
  DISPEN: 'Dispen',
  ALPHA: 'Alpa'
};

/**
 * Present-like statuses (count as present for daily aggregation)
 * DISPEN is included as present-like according to business rules
 */
const PRESENT_LIKE = new Set([
  'Hadir',
  'Terlambat',
  'Sakit',
  'Izin',
  'Dispen'
]);

/**
 * Hadir tercatat statuses (count as recorded attendance)
 * DISPEN = HADIR tercatat according to business rules
 */
const HADIR_TERCATAT = new Set([
  'Hadir',
  'Terlambat',
  'Dispen'
]);

/**
 * Check if status is present-like
 * @param {string} status - Attendance status
 * @returns {boolean} - True if present-like
 */
export function isPresentLike(status) {
  return PRESENT_LIKE.has(status);
}

/**
 * Check if status is hadir tercatat
 * @param {string} status - Attendance status  
 * @returns {boolean} - True if hadir tercatat
 */
export function isHadirTercatat(status) {
  return HADIR_TERCATAT.has(status);
}

/**
 * Compute daily attendance status for a class
 * Business Rule: If any slot has absent-like status (ALPHA or no event), 
 * final status = TIDAK_HADIR. Otherwise HADIR.
 * 
 * @param {number} classId - Class ID
 * @param {string} dateISO - Date in YYYY-MM-DD format
 * @param {number} hari - Day of week (1-6)
 * @returns {Promise<Array>} - Array of {student_id, final_status}
 */
export async function computeDailyStatusForClass(classId, dateISO, hari) {
  try {
    console.log(`🔄 Computing daily status for class ${classId}, date ${dateISO}, hari ${hari}`);
    
    // Get scheduled slots for the class on this day
    const [slots] = await db.execute(`
      SELECT id_jadwal as id, jam_ke, jam_mulai as start_time, jam_selesai as end_time
      FROM jadwal 
      WHERE kelas_id = ? AND hari = ?
      ORDER BY jam_ke ASC
    `, [classId, hari]);
    
    if (slots.length === 0) {
      console.log(`⚠️  No scheduled slots found for class ${classId} on day ${hari}`);
      return [];
    }
    
    // Get students in the class
    const [students] = await db.execute(`
      SELECT id_siswa as id, nama, nis
      FROM siswa 
      WHERE kelas_id = ? AND status = 'aktif'
      ORDER BY nama ASC
    `, [classId]);
    
    if (students.length === 0) {
      console.log(`⚠️  No active students found for class ${classId}`);
      return [];
    }
    
    // Get attendance events for the date and slots
    const slotIds = slots.map(s => s.id);
    const studentIds = students.map(s => s.id);
    
    const [events] = await db.execute(`
      SELECT siswa_id as student_id, jadwal_id, status
      FROM absensi_siswa 
      WHERE tanggal = ? 
        AND jadwal_id IN (${slotIds.map(() => '?').join(',')})
        AND siswa_id IN (${studentIds.map(() => '?').join(',')})
    `, [dateISO, ...slotIds, ...studentIds]);
    
    // Create lookup map for events
    const eventMap = new Map();
    events.forEach(event => {
      const key = `${event.student_id}:${event.jadwal_id}`;
      eventMap.set(key, event);
    });
    
    console.log(`📊 Processing ${students.length} students across ${slots.length} slots`);
    console.log(`📊 Found ${events.length} attendance events`);
    
    // Compute final status for each student
    const results = students.map(student => {
      let hasAbsentLike = false;
      let hadirTercatatCount = 0;
      
      // Check each scheduled slot
      for (const slot of slots) {
        const key = `${student.id}:${slot.id}`;
        const event = eventMap.get(key);
        
        if (!event) {
          // No event = absent-like
          hasAbsentLike = true;
          console.log(`❌ Student ${student.id} missing event for slot ${slot.jam_ke}`);
        } else if (!isPresentLike(event.status)) {
          // ALPHA or other absent-like status
          hasAbsentLike = true;
          console.log(`❌ Student ${student.id} has absent-like status ${event.status} for slot ${slot.jam_ke}`);
        } else {
          // Present-like status
          if (isHadirTercatat(event.status)) {
            hadirTercatatCount++;
          }
        }
      }
      
      const finalStatus = hasAbsentLike ? 'TIDAK_HADIR' : 'HADIR';
      
      console.log(`📊 Student ${student.id} (${student.nama}): ${finalStatus} (${hadirTercatatCount}/${slots.length} hadir tercatat)`);
      
      return {
        student_id: student.id,
        student_name: student.nama,
        student_nis: student.nis,
        final_status: finalStatus,
        hadir_tercatat_slots: hadirTercatatCount,
        total_scheduled_slots: slots.length
      };
    });
    
    console.log(`✅ Daily status computation completed for ${results.length} students`);
    return results;
    
  } catch (error) {
    console.error('❌ Error computing daily status:', error);
    throw error;
  }
}

/**
 * Get attendance summary for a class on a specific date
 * @param {number} classId - Class ID
 * @param {string} dateISO - Date in YYYY-MM-DD format
 * @param {number} hari - Day of week (1-6)
 * @returns {Promise<Object>} - Summary statistics
 */
export async function getAttendanceSummary(classId, dateISO, hari) {
  try {
    const dailyStatus = await computeDailyStatusForClass(classId, dateISO, hari);
    
    const totalStudents = dailyStatus.length;
    const hadirCount = dailyStatus.filter(s => s.final_status === 'HADIR').length;
    const tidakHadirCount = dailyStatus.filter(s => s.final_status === 'TIDAK_HADIR').length;
    
    const totalHadirTercatat = dailyStatus.reduce((sum, s) => sum + s.hadir_tercatat_slots, 0);
    const totalScheduledSlots = dailyStatus.reduce((sum, s) => sum + s.total_scheduled_slots, 0);
    
    return {
      date: dateISO,
      class_id: classId,
      hari: hari,
      total_students: totalStudents,
      hadir_count: hadirCount,
      tidak_hadir_count: tidakHadirCount,
      hadir_percentage: totalStudents > 0 ? (hadirCount / totalStudents * 100).toFixed(2) : 0,
      total_hadir_tercatat_slots: totalHadirTercatat,
      total_scheduled_slots: totalScheduledSlots,
      attendance_rate: totalScheduledSlots > 0 ? (totalHadirTercatat / totalScheduledSlots * 100).toFixed(2) : 0,
      students: dailyStatus
    };
    
  } catch (error) {
    console.error('❌ Error getting attendance summary:', error);
    throw error;
  }
}

/**
 * Get attendance summary for a date range
 * @param {number} classId - Class ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of daily summaries
 */
export async function getAttendanceRangeSummary(classId, startDate, endDate) {
  try {
    console.log(`📅 Getting attendance range for class ${classId} from ${startDate} to ${endDate}`);
    
    // Get all scheduled days in the range
    const [scheduledDays] = await db.execute(`
      SELECT DISTINCT hari, tanggal
      FROM jadwal_pelajaran j
      CROSS JOIN (
        SELECT DATE_ADD(?, INTERVAL seq.seq DAY) as tanggal
        FROM (
          SELECT 0 as seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
        ) seq
        WHERE DATE_ADD(?, INTERVAL seq.seq DAY) <= ?
      ) dates
      WHERE j.class_id = ? 
        AND j.hari = DAYOFWEEK(dates.tanggal) - 1
        AND j.is_active = 1
        AND dates.tanggal BETWEEN ? AND ?
      ORDER BY tanggal, hari
    `, [startDate, startDate, endDate, classId, startDate, endDate]);
    
    const summaries = [];
    
    for (const day of scheduledDays) {
      const summary = await getAttendanceSummary(classId, day.tanggal, day.hari);
      summaries.push(summary);
    }
    
    console.log(`✅ Generated ${summaries.length} daily summaries`);
    return summaries;
    
  } catch (error) {
    console.error('❌ Error getting attendance range summary:', error);
    throw error;
  }
}

export default {
  computeDailyStatusForClass,
  getAttendanceSummary,
  getAttendanceRangeSummary,
  isPresentLike,
  isHadirTercatat,
  STATUS_TYPES,
  PRESENT_LIKE,
  HADIR_TERCATAT
};
