/**
 * Utility functions for Jadwal Khusus (Special Schedules)
 * Handles istirahat, upacara, and perwalian schedules
 */

export interface JadwalKhusus {
  id: number;
  kelas_id: number | null;
  jenis_kegiatan: 'istirahat' | 'upacara' | 'perwalian';
  nama_kegiatan: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  guru_id: number | null;
  keterangan: string | null;
  status: 'aktif' | 'tidak_aktif';
  nama_guru?: string;
  nama_kelas?: string;
}

export interface MergedSchedule {
  type: 'regular' | 'special';
  jenis_kegiatan?: 'istirahat' | 'upacara' | 'perwalian';
  id: number;
  nama: string; // nama_mapel for regular, nama_kegiatan for special
  jam_mulai: string;
  jam_selesai: string;
  hari: string;
  nama_guru?: string;
  nama_kelas?: string;
  keterangan?: string;
  // For regular schedules
  nama_mapel?: string;
  id_jadwal?: number;
  jam_ke?: number;
  status_kehadiran?: string;
  [key: string]: any;
}

/**
 * Get color class based on schedule type and jenis_kegiatan
 */
export const getScheduleColorClass = (
  type: 'regular' | 'special',
  jenisKegiatan?: 'istirahat' | 'upacara' | 'perwalian'
): string => {
  if (type === 'regular') {
    return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
  }
  
  switch (jenisKegiatan) {
    case 'istirahat':
      return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
    case 'upacara':
      return 'bg-red-50 border-red-200 hover:bg-red-100';
    case 'perwalian':
      return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
    default:
      return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
  }
};

/**
 * Get badge color for schedule type
 */
export const getScheduleBadgeColor = (
  type: 'regular' | 'special',
  jenisKegiatan?: 'istirahat' | 'upacara' | 'perwalian'
): string => {
  if (type === 'regular') {
    return 'bg-blue-100 text-blue-800';
  }
  
  switch (jenisKegiatan) {
    case 'istirahat':
      return 'bg-yellow-100 text-yellow-800';
    case 'upacara':
      return 'bg-red-100 text-red-800';
    case 'perwalian':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get icon for schedule type
 */
export const getScheduleIcon = (
  type: 'regular' | 'special',
  jenisKegiatan?: 'istirahat' | 'upacara' | 'perwalian'
): string => {
  if (type === 'regular') {
    return '📚'; // Book for regular lessons
  }
  
  switch (jenisKegiatan) {
    case 'istirahat':
      return '☕'; // Coffee for breaks
    case 'upacara':
      return '🇮🇩'; // Flag for ceremony
    case 'perwalian':
      return '👥'; // People for homeroom
    default:
      return '📅';
  }
};

/**
 * Merge regular schedules with special schedules
 */
export const mergeSchedules = (
  regularSchedules: any[],
  specialSchedules: JadwalKhusus[]
): MergedSchedule[] => {
  const merged: MergedSchedule[] = [
    // Regular schedules
    ...regularSchedules.map(schedule => ({
      ...schedule,
      type: 'regular' as const,
      id: schedule.id_jadwal || schedule.id,
      nama: schedule.nama_mapel
    })),
    // Special schedules
    ...specialSchedules.map(schedule => ({
      ...schedule,
      type: 'special' as const,
      nama: schedule.nama_kegiatan
    }))
  ];
  
  // Sort by jam_mulai
  return merged.sort((a, b) => {
    const timeA = a.jam_mulai.replace(':', '');
    const timeB = b.jam_mulai.replace(':', '');
    return timeA.localeCompare(timeB);
  });
};

/**
 * Group schedules by day
 */
export const groupSchedulesByDay = (schedules: MergedSchedule[]): Record<string, MergedSchedule[]> => {
  const grouped: Record<string, MergedSchedule[]> = {};
  
  schedules.forEach(schedule => {
    const day = schedule.hari;
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(schedule);
  });
  
  return grouped;
};

/**
 * Filter schedules for today
 */
export const getTodaySchedules = (schedules: MergedSchedule[]): MergedSchedule[] => {
  const todayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
  return schedules.filter(s => s.hari.toLowerCase() === todayName.toLowerCase());
};

/**
 * Check if schedule is currently active
 */
export const isScheduleActive = (jamMulai: string, jamSelesai: string): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = jamMulai.split(':').map(Number);
  const [endHour, endMin] = jamSelesai.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  return currentTime >= startTime && currentTime <= endTime;
};

/**
 * Get schedule status
 */
export const getScheduleStatus = (jamMulai: string, jamSelesai: string): 'upcoming' | 'current' | 'completed' => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = jamMulai.split(':').map(Number);
  const [endHour, endMin] = jamSelesai.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  if (currentTime < startTime) return 'upcoming';
  if (currentTime > endTime) return 'completed';
  return 'current';
};

/**
 * Format time range
 */
export const formatTimeRange = (jamMulai: string, jamSelesai: string): string => {
  const formatTime = (time: string) => {
    const [hour, min] = time.split(':');
    return `${hour}:${min}`;
  };
  
  return `${formatTime(jamMulai)} - ${formatTime(jamSelesai)}`;
};

/**
 * Get display name for jenis_kegiatan
 */
export const getJenisKegiatanLabel = (jenis: 'istirahat' | 'upacara' | 'perwalian'): string => {
  const labels = {
    istirahat: 'Istirahat',
    upacara: 'Upacara',
    perwalian: 'Perwalian'
  };
  
  return labels[jenis] || jenis;
};

