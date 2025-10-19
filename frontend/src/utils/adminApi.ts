// Shared API utility for admin components
export const apiCall = async (url: string, options: RequestInit = {}, onLogout?: () => void) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error = new Error('Sesi Anda telah berakhir. Silakan login kembali.');
      if (onLogout) {
        setTimeout(() => onLogout(), 2000);
      }
      throw error;
    }
    
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errorData.error || `Error: ${response.status}`);
  }

  return response.json();
};

// Common interfaces for admin components
export interface BaseEntity {
  id: number;
  status: string;
  created_at: string;
}

export interface Teacher extends BaseEntity {
  id_guru: number;
  nama: string;
  nip: string;
  email: string;
  no_telp: string;
  mapel_id: number;
  nama_mapel: string;
}

export interface Subject extends BaseEntity {
  id_mapel: number;
  kode_mapel: string;
  nama_mapel: string;
}

export interface Class extends BaseEntity {
  id_kelas: number;
  nama_kelas: string;
  tingkat: string;
  ruang: string;
  kapasitas: number;
}

export interface Room extends BaseEntity {
  id: number;
  nama_ruang: string;
  kode_ruang: string;
  kapasitas: number;
  lokasi: string;
  status: 'aktif' | 'nonaktif';
}

// Common form data interfaces
export interface TeacherFormData {
  nama: string;
  nip: string;
  email: string;
  no_telp: string;
  mapel_id: string;
  status: string;
}

export interface SubjectFormData {
  kode_mapel: string;
  nama_mapel: string;
  status: string;
}

export interface ClassFormData {
  nama_kelas: string;
  tingkat: string;
  ruang: string;
  kapasitas: string;
  status: string;
}

export interface RoomFormData {
  nama_ruang: string;
  kode_ruang: string;
  kapasitas: number;
  lokasi: string;
}

// Common props interface
export interface AdminViewProps {
  onBack: () => void;
  onLogout: () => void;
}
