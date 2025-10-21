/**
 * Custom hook untuk manage jadwal khusus
 * Fetches and manages special schedules (istirahat, upacara, perwalian)
 */

import { useState, useEffect, useCallback } from 'react';
import { JadwalKhusus } from '../utils/jadwalKhususHelpers';

interface UseJadwalKhususOptions {
  kelasId?: number;
  hari?: string;
  autoFetch?: boolean;
}

interface UseJadwalKhususReturn {
  jadwalKhusus: JadwalKhusus[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch jadwal khusus for a specific class
 */
export const useJadwalKhusus = (options: UseJadwalKhususOptions = {}): UseJadwalKhususReturn => {
  const { kelasId, hari, autoFetch = true } = options;
  
  const [jadwalKhusus, setJadwalKhusus] = useState<JadwalKhusus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchJadwalKhusus = useCallback(async () => {
    if (!kelasId) {
      console.log('⏭️ useJadwalKhusus: No kelasId provided, skipping fetch');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📅 Fetching jadwal khusus for kelas ${kelasId}`, { hari });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      let url = `/api/jadwal-khusus/kelas/${kelasId}`;
      if (hari) {
        url += `?hari=${encodeURIComponent(hari)}`;
      }
      
      const response = await fetch(`http://localhost:3001${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jadwal khusus: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ Fetched ${data.data.length} jadwal khusus`);
        setJadwalKhusus(data.data);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch jadwal khusus';
      console.error('❌ Error fetching jadwal khusus:', errorMessage);
      setError(errorMessage);
      setJadwalKhusus([]);
    } finally {
      setLoading(false);
    }
  }, [kelasId, hari]);
  
  useEffect(() => {
    if (autoFetch && kelasId) {
      fetchJadwalKhusus();
    }
  }, [autoFetch, kelasId, hari, fetchJadwalKhusus]);
  
  return {
    jadwalKhusus,
    loading,
    error,
    refresh: fetchJadwalKhusus
  };
};

/**
 * Hook to fetch all jadwal khusus (admin only)
 */
export const useJadwalKhususAdmin = () => {
  const [jadwalKhusus, setJadwalKhusus] = useState<JadwalKhusus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchJadwalKhusus = useCallback(async (filters?: {
    kelas_id?: number;
    jenis_kegiatan?: string;
    hari?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 Fetching all jadwal khusus (admin)', filters);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const params = new URLSearchParams();
      if (filters?.kelas_id) params.append('kelas_id', filters.kelas_id.toString());
      if (filters?.jenis_kegiatan) params.append('jenis_kegiatan', filters.jenis_kegiatan);
      if (filters?.hari) params.append('hari', filters.hari);
      
      const url = `/api/admin/jadwal-khusus${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(`http://localhost:3001${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jadwal khusus: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ Fetched ${data.data.length} jadwal khusus`);
        setJadwalKhusus(data.data);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch jadwal khusus';
      console.error('❌ Error fetching jadwal khusus:', errorMessage);
      setError(errorMessage);
      setJadwalKhusus([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const createJadwalKhusus = useCallback(async (data: Omit<JadwalKhusus, 'id' | 'status' | 'created_at' | 'updated_at'>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('http://localhost:3001/api/admin/jadwal-khusus', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create jadwal khusus');
      }
      
      const result = await response.json();
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create jadwal khusus';
      console.error('❌ Error creating jadwal khusus:', errorMessage);
      throw err;
    }
  }, []);
  
  const updateJadwalKhusus = useCallback(async (id: number, data: Partial<JadwalKhusus>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`http://localhost:3001/api/admin/jadwal-khusus/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update jadwal khusus');
      }
      
      const result = await response.json();
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update jadwal khusus';
      console.error('❌ Error updating jadwal khusus:', errorMessage);
      throw err;
    }
  }, []);
  
  const deleteJadwalKhusus = useCallback(async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`http://localhost:3001/api/admin/jadwal-khusus/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete jadwal khusus');
      }
      
      const result = await response.json();
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete jadwal khusus';
      console.error('❌ Error deleting jadwal khusus:', errorMessage);
      throw err;
    }
  }, []);
  
  return {
    jadwalKhusus,
    loading,
    error,
    fetchJadwalKhusus,
    createJadwalKhusus,
    updateJadwalKhusus,
    deleteJadwalKhusus
  };
};

