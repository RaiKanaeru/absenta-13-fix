import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { FontSizeControl } from '@/components/ui/font-size-control';
import { 
  LogOut, Clock, User, BookOpen, CheckCircle2, XCircle, Calendar, Save,
  GraduationCap, Settings, Menu, X, Home, Users, FileText, Send, AlertCircle, MessageCircle, Eye, Plus, Edit,
  ChevronLeft, ChevronRight, RefreshCw, Trash2
} from 'lucide-react';

interface StudentDashboardProps {
  userData: {
    id: number;
    username: string;
    nama: string;
    role: string;
  };
  onLogout: () => void;
}

interface PengajuanIzin {
  id_pengajuan: number;
  jadwal_id: number;
  tanggal_izin: string;
  jenis_izin: 'sakit' | 'izin' | 'alpa' | 'dispen';
  alasan: string;
  bukti_pendukung?: string;
  status: 'pending' | 'disetujui' | 'ditolak';
  keterangan_guru?: string;
  tanggal_pengajuan: string;
  tanggal_respon?: string;
  nama_mapel: string;
  nama_guru: string;
  jam_mulai: string;
  jam_selesai: string;
  // Data untuk kelas
  siswa_izin?: Array<{
    nama: string;
    jenis_izin: 'sakit' | 'izin' | 'alpa' | 'dispen';
    alasan: string;
    bukti_pendukung?: string;
  }>;
  total_siswa_izin?: number;
}

interface BandingAbsen {
  id_banding: number;
  siswa_id: number;
  jadwal_id: number;
  tanggal_absen: string;
  status_asli: 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen';
  status_diajukan: 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen';
  alasan_banding: string;
  bukti_pendukung?: string;
  status_banding: 'pending' | 'disetujui' | 'ditolak';
  catatan_guru?: string;
  tanggal_pengajuan: string;
  tanggal_keputusan?: string;
  nama_mapel?: string;
  nama_guru?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  nama_kelas?: string;
  // Data untuk banding kelas
  siswa_banding?: Array<{
    nama: string;
    status_asli: 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen';
    status_diajukan: 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen';
    alasan_banding: string;
    bukti_pendukung?: string;
  }>;
  total_siswa_banding?: number;
}

interface StudentDashboardProps {
  userData: {
    id: number;
    username: string;
    nama: string;
    role: string;
  };
  onLogout: () => void;
}

interface JadwalHariIni {
  id_jadwal: number;
  jam_ke: number;
  jam_mulai: string;
  jam_selesai: string;
  nama_mapel: string;
  kode_mapel: string;
  nama_guru: string;
  nip: string;
  nama_kelas: string;
  status_kehadiran: string;
  keterangan?: string;
  waktu_catat?: string;
  tanggal_target?: string;
}

interface KehadiranData {
  [jadwal_id: number]: {
    status: string;
    keterangan: string;
  };
}

interface RiwayatData {
  tanggal: string;
  jadwal: Array<{
    jadwal_id: number;
    jam_ke: number;
    jam_mulai: string;
    jam_selesai: string;
    nama_mapel: string;
    nama_guru: string;
    total_siswa: number;
    total_hadir: number;
    total_izin: number;
    total_sakit: number;
    total_alpa: number;
    siswa_tidak_hadir?: Array<{
      nama_siswa: string;
      nis: string;
      status: string;
      keterangan?: string;
      nama_pencatat?: string;
    }>;
  }>;
}

// Komponen Pagination
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Always show pagination info, even for single page
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-center mt-6">
        <div className="text-sm text-gray-600">
          Menampilkan semua data (1 halaman)
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-2 px-4 py-2 h-10 w-full sm:w-auto"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Sebelumnya</span>
        <span className="sm:hidden">Prev</span>
      </Button>
      
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {getVisiblePages().map((page, index) => (
          <Button
            key={index}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className="w-10 h-10 p-0 text-sm font-medium"
          >
            {page}
          </Button>
        ))}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2 px-4 py-2 h-10 w-full sm:w-auto"
      >
        <span className="hidden sm:inline">Selanjutnya</span>
        <span className="sm:hidden">Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export const StudentDashboard = ({ userData, onLogout }: StudentDashboardProps) => {
  console.log('StudentDashboard: Component mounting/rendering with user:', userData);
  
  const [activeTab, setActiveTab] = useState('kehadiran');
  const [jadwalHariIni, setJadwalHariIni] = useState<JadwalHariIni[]>([]);
  const [kehadiranData, setKehadiranData] = useState<KehadiranData>({});
  const [riwayatData, setRiwayatData] = useState<RiwayatData[]>([]);
  const [pengajuanIzin, setPengajuanIzin] = useState<PengajuanIzin[]>([]);
  const [bandingAbsen, setBandingAbsen] = useState<BandingAbsen[]>([]);
  const [detailRiwayat, setDetailRiwayat] = useState<{ 
    jadwal_id: number;
    jam_ke: number;
    jam_mulai: string;
    jam_selesai: string;
    nama_mapel: string;
    nama_guru: string;
    total_siswa: number;
    total_hadir: number;
    total_izin: number;
    total_sakit: number;
    total_alpa: number;
    siswa_tidak_hadir?: Array<{ nama_siswa: string; nis: string; status: string; keterangan?: string; nama_pencatat?: string; }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [siswaId, setSiswaId] = useState<number | null>(null);
  const [kelasInfo, setKelasInfo] = useState<string>('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State untuk edit absen dengan rentang tanggal
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [maxDate, setMaxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [minDate, setMinDate] = useState<string>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  
  // State untuk form pengajuan izin kelas
  const [formIzin, setFormIzin] = useState({
    jadwal_id: '',
    tanggal_izin: '',
    siswa_izin: [] as Array<{
      nama: string;
      jenis_izin: 'sakit' | 'izin' | 'alpa' | 'dispen';
      alasan: string;
      bukti_pendukung?: string;
    }>
  });
  const [showFormIzin, setShowFormIzin] = useState(false);
  const [showFormBanding, setShowFormBanding] = useState(false);
  const [daftarSiswa, setDaftarSiswa] = useState<Array<{id: number; nama: string}>>([]);
  
  // State untuk pagination
  const [pengajuanIzinPage, setPengajuanIzinPage] = useState(1);
  const [bandingAbsenPage, setBandingAbsenPage] = useState(1);
  const [riwayatPage, setRiwayatPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [riwayatItemsPerPage] = useState(7);
  
  // State untuk form banding absen kelas
  const [formBanding, setFormBanding] = useState({
    jadwal_id: '',
    tanggal_absen: '',
    siswa_banding: [] as Array<{
      nama: string;
      status_asli: 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen';
      status_diajukan: 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen';
      alasan_banding: string;
      bukti_pendukung?: string;
    }>
  });

  console.log('StudentDashboard: Current state - siswaId:', siswaId, 'initialLoading:', initialLoading, 'error:', error);

  // Get siswa perwakilan info
  useEffect(() => {
    console.log('StudentDashboard: Starting to fetch siswa info...');
    
    const getSiswaInfo = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        
        console.log('StudentDashboard: Making fetch request to /api/siswa-perwakilan/info');
        
        const response = await fetch('http://localhost:3001/api/siswa-perwakilan/info', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log('StudentDashboard: Response status:', response.status);
        console.log('StudentDashboard: Response ok:', response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('StudentDashboard: Received data:', data);
          
          if (data.success) {
            setSiswaId(data.id_siswa);
            setKelasInfo(data.nama_kelas);
            console.log('StudentDashboard: Set siswaId to:', data.id_siswa, 'kelasInfo to:', data.nama_kelas);
          } else {
            setError(data.error || 'Data siswa tidak valid');
          }
        } else {
          let errorMessage = 'Gagal memuat informasi siswa';
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.log('Could not parse error response');
          }
          
          if (response.status === 401) {
            errorMessage = 'Sesi login Anda telah berakhir. Silakan login kembali.';
            // Redirect to login after showing error
            setTimeout(() => {
              onLogout();
            }, 2000);
          } else if (response.status === 403) {
            errorMessage = 'Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.';
          } else if (response.status === 404) {
            errorMessage = 'Data siswa perwakilan tidak ditemukan. Silakan hubungi administrator.';
          } else if (response.status >= 500) {
            errorMessage = 'Server sedang mengalami gangguan. Silakan coba lagi nanti.';
          }
          
          setError(errorMessage);
          console.error('StudentDashboard: API error:', response.status, errorMessage);
        }
      } catch (error) {
        console.error('StudentDashboard: Network error getting siswa info:', error);
        
        let errorMessage = 'Koneksi bermasalah. ';
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMessage += 'Tidak dapat terhubung ke server. Pastikan server backend sedang berjalan di http://localhost:3001';
        } else {
          errorMessage += 'Silakan periksa koneksi internet Anda dan coba lagi.';
        }
        
        setError(errorMessage);
      } finally {
        setInitialLoading(false);
        console.log('StudentDashboard: Finished loading initial data');
      }
    };

    getSiswaInfo();
  }, [onLogout]);

  // Load jadwal hari ini
  const loadJadwalHariIni = useCallback(async () => {
    if (!siswaId) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/siswa/${siswaId}/jadwal-hari-ini`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('StudentDashboard: Loaded jadwal hari ini:', data);
        setJadwalHariIni(data);
        
        // Initialize kehadiran data
        const initialKehadiran: KehadiranData = {};
        data.forEach((jadwal: JadwalHariIni) => {
          if (jadwal.status_kehadiran && jadwal.status_kehadiran !== 'belum_diambil') {
            initialKehadiran[jadwal.id_jadwal] = {
              status: jadwal.status_kehadiran,
              keterangan: jadwal.keterangan || ''
            };
          } else {
            initialKehadiran[jadwal.id_jadwal] = {
              status: 'hadir',
              keterangan: ''
            };
          }
        });
        setKehadiranData(initialKehadiran);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error memuat jadwal",
          description: errorData.error || 'Failed to load schedule',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading jadwal hari ini:', error);
      toast({
        title: "Error",
        description: "Network error while loading schedule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [siswaId]);

  // Load jadwal berdasarkan tanggal yang dipilih
  const loadJadwalByDate = useCallback(async (tanggal: string) => {
    if (!siswaId) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/siswa/${siswaId}/jadwal-rentang?tanggal=${tanggal}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('StudentDashboard: Loaded jadwal by date:', result);
        
        if (result.success && result.data) {
          setJadwalHariIni(result.data);
          
          // Initialize kehadiran data
          const initialKehadiran: KehadiranData = {};
          result.data.forEach((jadwal: JadwalHariIni) => {
            if (jadwal.status_kehadiran && jadwal.status_kehadiran !== 'belum_diambil') {
              initialKehadiran[jadwal.id_jadwal] = {
                status: jadwal.status_kehadiran,
                keterangan: jadwal.keterangan || ''
              };
            } else {
              initialKehadiran[jadwal.id_jadwal] = {
                status: 'hadir',
                keterangan: ''
              };
            }
          });
          setKehadiranData(initialKehadiran);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error memuat jadwal",
          description: errorData.error || 'Failed to load schedule',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading jadwal by date:', error);
      toast({
        title: "Error",
        description: "Network error while loading schedule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [siswaId]);

  // Load daftar siswa kelas
  const loadDaftarSiswa = useCallback(async () => {
    if (!siswaId) return;

    try {
      // Get and clean token from localStorage
      const rawToken = localStorage.getItem('token');
      const cleanToken = rawToken ? rawToken.trim() : '';
      
      if (!cleanToken) {
        console.error('❌ Token tidak ditemukan');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/siswa/${siswaId}/daftar-siswa`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('StudentDashboard: Loaded daftar siswa:', data);
        setDaftarSiswa(data);
      } else {
        const errorData = await response.json();
        console.error('Error loading daftar siswa:', errorData);
      }
    } catch (error) {
      console.error('Error loading daftar siswa:', error);
    }
  }, [siswaId]);

  // Load riwayat data
  const loadRiwayatData = useCallback(async () => {
    if (!siswaId) return;

    try {
      const response = await fetch(`http://localhost:3001/api/siswa/${siswaId}/riwayat-kehadiran`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('StudentDashboard: Loaded riwayat data:', data);
        setRiwayatData(data);
      } else {
        const errorData = await response.json();
        console.error('Error loading riwayat:', errorData);
      }
    } catch (error) {
      console.error('Error loading riwayat:', error);
    }
  }, [siswaId]);

  // Load pengajuan izin data
  const loadPengajuanIzin = useCallback(async () => {
    if (!siswaId) return;

    try {
      // Get and clean token from localStorage
      const rawToken = localStorage.getItem('token');
      const cleanToken = rawToken ? rawToken.trim() : '';
      
      if (!cleanToken) {
        console.error('❌ Token tidak ditemukan');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/siswa/${siswaId}/pengajuan-izin`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('StudentDashboard: Loaded pengajuan izin data:', data);
        setPengajuanIzin(data);
      } else {
        const errorData = await response.json();
        console.error('Error loading pengajuan izin:', errorData);
      }
    } catch (error) {
      console.error('Error loading pengajuan izin:', error);
    }
  }, [siswaId]);

  // Submit pengajuan izin kelas
  const submitPengajuanIzin = async () => {
    if (!siswaId || formIzin.siswa_izin.length === 0) return;

    try {
      const requestData = {
        jadwal_id: parseInt(formIzin.jadwal_id),
        tanggal_izin: formIzin.tanggal_izin,
        siswa_izin: formIzin.siswa_izin
      };
      
      console.log('📝 Submitting pengajuan izin data:', requestData);
      console.log('📝 Siswa ID:', siswaId);
      console.log('📝 Form izin:', formIzin);
      
      // Get and clean token from localStorage
      const rawToken = localStorage.getItem('token');
      const cleanToken = rawToken ? rawToken.trim() : '';
      
      if (!cleanToken) {
        toast({
          title: "Error",
          description: "Token tidak ditemukan. Silakan login ulang.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('🔑 Raw token:', rawToken);
      console.log('🔑 Clean token:', cleanToken);
      console.log('🔑 Token length:', cleanToken.length);
      
      const response = await fetch(`http://localhost:3001/api/siswa/${siswaId}/pengajuan-izin-kelas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanToken}`
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Pengajuan izin kelas berhasil dikirim"
        });
        
        // Reset form dan reload data
        setFormIzin({
          jadwal_id: '',
          tanggal_izin: '',
          siswa_izin: []
        });
        setShowFormIzin(false);
        loadPengajuanIzin();
      } else {
        const errorData = await response.json();
        console.error('❌ Error submitting pengajuan izin:', errorData);
        toast({
          title: "Error",
          description: errorData.error || "Gagal mengirim pengajuan izin",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting pengajuan izin:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengirim pengajuan",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (siswaId && activeTab === 'kehadiran') {
      loadJadwalHariIni();
    }
  }, [siswaId, activeTab, loadJadwalHariIni]);

  useEffect(() => {
    if (siswaId && activeTab === 'riwayat') {
      loadRiwayatData();
    }
  }, [siswaId, activeTab, loadRiwayatData]);

  useEffect(() => {
    if (siswaId && activeTab === 'pengajuan-izin') {
      loadPengajuanIzin();
      loadDaftarSiswa();
    }
  }, [siswaId, activeTab, loadPengajuanIzin, loadDaftarSiswa]);

  // Load Banding Absen
  const loadBandingAbsen = useCallback(async () => {
    if (!siswaId) return;
    
    try {
      // Get and clean token from localStorage
      const rawToken = localStorage.getItem('token');
      const cleanToken = rawToken ? rawToken.trim() : '';
      
      if (!cleanToken) {
        console.error('❌ Token tidak ditemukan');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/siswa/${siswaId}/banding-absen`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanToken}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setBandingAbsen(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading banding absen:', error);
    }
  }, [siswaId]);

  useEffect(() => {
    if (siswaId && activeTab === 'banding-absen') {
      loadBandingAbsen();
      loadDaftarSiswa();
      loadRiwayatData();
    }
  }, [siswaId, activeTab, loadBandingAbsen, loadDaftarSiswa, loadRiwayatData]);

  // Load jadwal when selected date changes in edit mode
  useEffect(() => {
    if (isEditMode && siswaId && selectedDate) {
      loadJadwalByDate(selectedDate);
    }
  }, [isEditMode, selectedDate, loadJadwalByDate, siswaId]);

  // Submit kehadiran guru
  const submitKehadiran = async () => {
    if (!siswaId) return;

    setLoading(true);
    try {
      const requestData = {
        siswa_id: siswaId,
        kehadiran_data: kehadiranData,
        tanggal_absen: selectedDate
      };
      
      console.log('📝 Submitting kehadiran data:', requestData);
      console.log('📝 Kehadiran data keys:', Object.keys(kehadiranData));
      console.log('📝 Selected date:', selectedDate);
      
      // Get and clean token from localStorage
      const rawToken = localStorage.getItem('token');
      const cleanToken = rawToken ? rawToken.trim() : '';
      
      if (!cleanToken) {
        toast({
          title: "Error",
          description: "Token tidak ditemukan. Silakan login ulang.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/siswa/submit-kehadiran-guru', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanToken}`
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Berhasil!",
          description: result.message || "Data kehadiran guru berhasil disimpan"
        });
        
        // Reload jadwal to get updated status
        if (isEditMode) {
          loadJadwalByDate(selectedDate);
        } else {
          loadJadwalHariIni();
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Error submitting kehadiran:', errorData);
        toast({
          title: "Error",
          description: errorData.error || 'Failed to submit attendance',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting kehadiran:', error);
      toast({
        title: "Error",
        description: "Network error while submitting attendance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateKehadiranStatus = (jadwalId: number, status: string) => {
    setKehadiranData(prev => ({
      ...prev,
      [jadwalId]: {
        ...prev[jadwalId],
        status: status
      }
    }));
  };

  const updateKehadiranKeterangan = (jadwalId: number, keterangan: string) => {
    setKehadiranData(prev => ({
      ...prev,
      [jadwalId]: {
        ...prev[jadwalId],
        keterangan: keterangan
      }
    }));
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      // Switching to edit mode, load today's schedule
      setSelectedDate(new Date().toISOString().split('T')[0]);
      loadJadwalHariIni();
    } else {
      // Switching back to normal mode, load today's schedule
      loadJadwalHariIni();
    }
  };

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    loadJadwalByDate(newDate);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hadir': return 'bg-green-100 text-green-800';
      case 'tidak_hadir': return 'bg-red-100 text-red-800';
      case 'izin': return 'bg-yellow-100 text-yellow-800';
      case 'sakit': return 'bg-blue-100 text-blue-800';
      case 'belum_diambil': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderKehadiranContent = () => {
    if (loading) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-24 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (jadwalHariIni.length === 0) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {isEditMode ? 'Edit Absen Guru' : 'Jadwal Hari Ini'} - {kelasInfo}
                </CardTitle>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  {isEditMode && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="date-picker" className="text-sm font-medium">
                        Pilih Tanggal:
                      </Label>
                      <input
                        id="date-picker"
                        type="date"
                        value={selectedDate}
                        min={minDate}
                        max={maxDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  <Button
                    onClick={toggleEditMode}
                    variant={isEditMode ? "destructive" : "default"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {isEditMode ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        Keluar Edit Mode
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4" />
                        Edit Absen (7 Hari)
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {isEditMode && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 text-blue-600 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Mode Edit Absen Aktif</p>
                      <p>Anda dapat mengubah absen guru untuk tanggal yang dipilih (maksimal 7 hari yang lalu).</p>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>

          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Jadwal Hari Ini</h3>
              <p className="text-gray-600 mb-4">Selamat beristirahat! Tidak ada mata pelajaran yang terjadwal untuk hari ini.</p>
              {!isEditMode && (
                <p className="text-sm text-gray-500 mb-4">
                  Gunakan tombol "Edit Absen (7 Hari)" di atas untuk melihat jadwal hari lain.
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Jadwal
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    if (confirm('Apakah Anda yakin ingin menghapus jadwal kosong? Tindakan ini akan menghapus semua jadwal yang tidak memiliki mata pelajaran.')) {
                      try {
                        setLoading(true);
                        const response = await fetch('/api/siswa/clear-empty-schedules', {
                          method: 'DELETE',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                          },
                          credentials: 'include'
                        });
                        
                        if (response.ok) {
                          toast({
                            title: "Berhasil!",
                            description: "Jadwal kosong berhasil dihapus"
                          });
                          window.location.reload();
                        } else {
                          throw new Error('Gagal menghapus jadwal kosong');
                        }
                      } catch (error) {
                        console.error('Error clearing empty schedules:', error);
                        toast({
                          title: "Error",
                          description: "Gagal menghapus jadwal kosong",
                          variant: "destructive"
                        });
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Jadwal Kosong
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Edit Mode Toggle and Date Picker */}
        <Card className="mx-4 lg:mx-0">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg lg:text-xl">
                  {isEditMode ? 'Edit Absen Guru' : 'Jadwal Hari Ini'} - {kelasInfo}
                </CardTitle>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-3">
                {isEditMode && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label htmlFor="date-picker" className="text-sm font-medium text-gray-700">
                      Pilih Tanggal:
                    </Label>
                    <input
                      id="date-picker"
                      type="date"
                      value={selectedDate}
                      min={minDate}
                      max={maxDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                <Button
                  onClick={toggleEditMode}
                  variant={isEditMode ? "destructive" : "default"}
                  size="sm"
                  className="flex items-center gap-2 px-4 py-2 w-full sm:w-auto"
                >
                  {isEditMode ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Keluar Edit Mode
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      Edit Absen (7 Hari)
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {isEditMode && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 text-blue-600 mt-0.5">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Mode Edit Absen Aktif</p>
                    <p>Anda dapat mengubah absen guru untuk tanggal yang dipilih (maksimal 7 hari yang lalu).</p>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        <Card className="mx-4 lg:mx-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
              {isEditMode ? `Jadwal ${new Date(selectedDate).toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}` : 'Jadwal Hari Ini'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jadwalHariIni.map((jadwal, index) => (
                <div key={jadwal.id_jadwal} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">Jam ke-{jadwal.jam_ke}</Badge>
                        <Badge variant="outline" className="text-xs">{jadwal.jam_mulai} - {jadwal.jam_selesai}</Badge>
                        <Badge className={`text-xs ${getStatusBadgeColor(kehadiranData[jadwal.id_jadwal]?.status || jadwal.status_kehadiran || 'belum_diambil')}`}>
                          {(() => {
                            const status = kehadiranData[jadwal.id_jadwal]?.status || jadwal.status_kehadiran || 'belum_diambil';
                            switch (status.toLowerCase()) {
                              case 'hadir': return 'Hadir';
                              case 'tidak_hadir': return 'Tidak Hadir';
                              case 'izin': return 'Izin';
                              case 'sakit': return 'Sakit';
                              case 'belum_diambil': return 'Belum Diambil';
                              default: return status;
                            }
                          })()}
                        </Badge>
                        {jadwal.waktu_catat && (
                          <Badge variant="secondary" className="text-xs">
                            ✓ Dicatat: {new Date(jadwal.waktu_catat).toLocaleString('id-ID')}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-1">{jadwal.nama_mapel}</h4>
                      <p className="text-gray-600 mb-1">{jadwal.nama_guru}</p>
                      <p className="text-sm text-gray-500">NIP: {jadwal.nip}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Status Kehadiran Guru:
                      </Label>
                      <RadioGroup 
                        value={kehadiranData[jadwal.id_jadwal]?.status || 'hadir'} 
                        onValueChange={(value) => updateKehadiranStatus(jadwal.id_jadwal, value)}
                        disabled={false}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <RadioGroupItem value="hadir" id={`hadir-${jadwal.id_jadwal}`} />
                            <Label htmlFor={`hadir-${jadwal.id_jadwal}`} className="flex items-center gap-2 cursor-pointer">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              Hadir
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <RadioGroupItem value="tidak_hadir" id={`tidak_hadir-${jadwal.id_jadwal}`} />
                            <Label htmlFor={`tidak_hadir-${jadwal.id_jadwal}`} className="flex items-center gap-2 cursor-pointer">
                              <XCircle className="w-4 h-4 text-red-600" />
                              Tidak Hadir
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <RadioGroupItem value="izin" id={`izin-${jadwal.id_jadwal}`} />
                            <Label htmlFor={`izin-${jadwal.id_jadwal}`} className="flex items-center gap-2 cursor-pointer">
                              <User className="w-4 h-4 text-yellow-600" />
                              Izin
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <RadioGroupItem value="sakit" id={`sakit-${jadwal.id_jadwal}`} />
                            <Label htmlFor={`sakit-${jadwal.id_jadwal}`} className="flex items-center gap-2 cursor-pointer">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                              Sakit
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {kehadiranData[jadwal.id_jadwal]?.status !== 'hadir' && (
                      <div>
                        <Label htmlFor={`keterangan-${jadwal.id_jadwal}`} className="text-sm font-medium text-gray-700">
                          Keterangan:
                        </Label>
                        <Textarea
                          id={`keterangan-${jadwal.id_jadwal}`}
                          placeholder="Masukkan keterangan jika diperlukan..."
                          value={kehadiranData[jadwal.id_jadwal]?.keterangan || ''}
                          onChange={(e) => updateKehadiranKeterangan(jadwal.id_jadwal, e.target.value)}
                          disabled={false}
                          className="mt-2 min-h-[80px] resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              {isEditMode && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Perhatian!</p>
                      <p>Anda sedang mengedit absen untuk tanggal {new Date(selectedDate).toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}. Perubahan akan disimpan dan menggantikan data sebelumnya.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={submitKehadiran} 
                disabled={loading} 
                className={`w-full h-12 text-base font-medium ${isEditMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Menyimpan...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    {isEditMode ? 'Simpan Perubahan Absen' : 'Simpan Data Kehadiran'}
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRiwayatContent = () => {
    if (riwayatData.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Riwayat</h3>
            <p className="text-gray-600">Riwayat kehadiran kelas akan muncul setelah ada data absensi.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-blue-800 font-medium">Riwayat Kehadiran Kelas</p>
              </div>
              <p className="text-blue-700 text-sm mt-1">Sebagai perwakilan kelas, Anda dapat melihat ringkasan kehadiran seluruh siswa</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600 font-medium">
                {riwayatData.length} hari riwayat
              </div>
              <div className="text-xs text-blue-500">
                Halaman {riwayatPage} dari {Math.ceil(riwayatData.length / riwayatItemsPerPage)}
              </div>
            </div>
          </div>
        </div>

        {riwayatData
          .slice((riwayatPage - 1) * riwayatItemsPerPage, riwayatPage * riwayatItemsPerPage)
          .map((hari, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {new Date(hari.tanggal).toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {hari.jadwal.map((jadwal, jadwalIndex) => (
                  <div key={jadwalIndex} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Jam ke-{jadwal.jam_ke}</Badge>
                        <span className="text-sm text-gray-600">{jadwal.jam_mulai} - {jadwal.jam_selesai}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('Detail jadwal:', jadwal);
                          setDetailRiwayat(jadwal);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs">Detail</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">{jadwal.nama_mapel}</h4>
                      <p className="text-sm text-gray-600">Guru: {jadwal.nama_guru}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Hadir: {jadwal.total_hadir}/{jadwal.total_siswa}
                          </Badge>
                        </div>
                      </div>

                      {(jadwal.total_izin > 0 || jadwal.total_sakit > 0 || jadwal.total_alpa > 0) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {jadwal.total_izin > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Izin: {jadwal.total_izin}
                            </Badge>
                          )}
                          {jadwal.total_sakit > 0 && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Sakit: {jadwal.total_sakit}
                            </Badge>
                          )}
                          {jadwal.total_alpa > 0 && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              Alpa: {jadwal.total_alpa}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jam Ke</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Mata Pelajaran</TableHead>
                        <TableHead>Guru</TableHead>
                        <TableHead>Total Hadir</TableHead>
                        <TableHead>Tidak Hadir</TableHead>
                        <TableHead>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hari.jadwal.map((jadwal, jadwalIndex) => (
                        <TableRow key={jadwalIndex}>
                          <TableCell>
                            <Badge variant="outline">Jam ke-{jadwal.jam_ke}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{jadwal.jam_mulai} - {jadwal.jam_selesai}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{jadwal.nama_mapel}</span>
                          </TableCell>
                          <TableCell>
                            <span>{jadwal.nama_guru}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">
                                {jadwal.total_hadir}/{jadwal.total_siswa}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {jadwal.total_izin > 0 && (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                  Izin: {jadwal.total_izin}
                                </Badge>
                              )}
                              {jadwal.total_sakit > 0 && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  Sakit: {jadwal.total_sakit}
                                </Badge>
                              )}
                              {jadwal.total_alpa > 0 && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  Alpa: {jadwal.total_alpa}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log('Detail jadwal:', jadwal);
                                setDetailRiwayat(jadwal);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Pagination untuk Riwayat */}
        <Pagination
          currentPage={riwayatPage}
          totalPages={Math.ceil(riwayatData.length / riwayatItemsPerPage)}
          onPageChange={setRiwayatPage}
        />

        {/* Modal Detail Riwayat */}
        {detailRiwayat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Detail Kehadiran - Jam ke-{detailRiwayat.jam_ke}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDetailRiwayat(null)}
                  className="p-2 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{detailRiwayat.nama_mapel}</h4>
                    <p className="text-sm text-gray-600">{detailRiwayat.jam_mulai} - {detailRiwayat.jam_selesai}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Guru: {detailRiwayat.nama_guru}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-green-100 text-green-800">
                        Hadir: {detailRiwayat.total_hadir}/{detailRiwayat.total_siswa}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {detailRiwayat.siswa_tidak_hadir && Array.isArray(detailRiwayat.siswa_tidak_hadir) && detailRiwayat.siswa_tidak_hadir.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 mb-3">Siswa Tidak Hadir ({detailRiwayat.siswa_tidak_hadir.length} siswa):</h4>
                    {detailRiwayat.siswa_tidak_hadir.map((siswa, idx) => {
                      // Coba berbagai kemungkinan field untuk nama dan NIS
                      const namaSiswa = siswa.nama_siswa || 'Nama tidak tersedia';
                      const nisSiswa = siswa.nis || 'NIS tidak tersedia';
                      const statusSiswa = siswa.status || 'Status tidak tersedia';

                      return (
                        <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-gray-900">{namaSiswa}</h5>
                                <Badge
                                  variant={
                                    statusSiswa === 'izin' ? 'secondary' :
                                    statusSiswa === 'sakit' ? 'outline' : 'destructive'
                                  }
                                  className="capitalize text-xs"
                                >
                                  {statusSiswa}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">NIS: {nisSiswa}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {siswa.keterangan && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Keterangan:</span>
                                <p className="text-sm text-gray-600 mt-1">{siswa.keterangan}</p>
                              </div>
                            )}
                            {siswa.nama_pencatat && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Dicatat oleh:</span>
                                <p className="text-sm text-gray-600 mt-1">{siswa.nama_pencatat}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h4 className="text-lg font-semibold text-green-600 mb-2">Semua Siswa Hadir</h4>
                    <p className="text-gray-600">Tidak ada siswa yang tidak hadir pada jam pelajaran ini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Pengajuan Izin Content untuk Kelas
  const renderPengajuanIzinContent = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Pengajuan Izin Kelas</h2>
            <p className="text-gray-600 text-sm lg:text-base">Ajukan izin ketidakhadiran untuk siswa-siswa dalam kelas</p>
          </div>
          <Button 
            onClick={() => setShowFormIzin(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-4 py-2 h-10 w-full sm:w-auto"
          >
            <Send className="w-4 h-4" />
            Ajukan Izin Kelas
          </Button>
        </div>

        {/* Form Pengajuan Izin Kelas */}
        {showFormIzin && (
          <Card className="mx-4 lg:mx-0">
            <CardHeader>
              <CardTitle className="text-lg">Form Pengajuan Izin Kelas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="jadwal" className="text-sm font-medium text-gray-700">Jadwal Pelajaran</Label>
                  <select
                    id="jadwal"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formIzin.jadwal_id}
                    onChange={(e) => setFormIzin({...formIzin, jadwal_id: e.target.value})}
                  >
                    <option value="">Pilih jadwal pelajaran...</option>
                    {jadwalHariIni.map((jadwal) => (
                      <option key={jadwal.id_jadwal} value={jadwal.id_jadwal}>
                        {jadwal.nama_mapel} - {jadwal.nama_guru} (Jam {jadwal.jam_ke}: {jadwal.jam_mulai}-{jadwal.jam_selesai})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="tanggal_izin" className="text-sm font-medium text-gray-700">Tanggal Izin</Label>
                  <input
                    id="tanggal_izin"
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formIzin.tanggal_izin}
                    onChange={(e) => setFormIzin({...formIzin, tanggal_izin: e.target.value})}
                  />
                </div>
              </div>

              {/* Pilihan Siswa */}
              <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <Label className="text-lg font-semibold text-gray-900">Siswa yang Izin</Label>
                  <Button
                    type="button"
                    onClick={() => {
                      setFormIzin({
                        ...formIzin,
                        siswa_izin: [...formIzin.siswa_izin, {
                          nama: '',
                          jenis_izin: 'izin',
                          alasan: '',
                          bukti_pendukung: ''
                        }]
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Siswa
                  </Button>
                </div>

                <div className="space-y-4">
                  {formIzin.siswa_izin.map((siswa, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Siswa {index + 1}</span>
                        <Button
                          type="button"
                          onClick={() => {
                            const newSiswaIzin = formIzin.siswa_izin.filter((_, i) => i !== index);
                            setFormIzin({...formIzin, siswa_izin: newSiswaIzin});
                          }}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Nama Siswa</Label>
                          <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={siswa.nama}
                            onChange={(e) => {
                              const newSiswaIzin = [...formIzin.siswa_izin];
                              newSiswaIzin[index] = {...newSiswaIzin[index], nama: e.target.value};
                              setFormIzin({...formIzin, siswa_izin: newSiswaIzin});
                            }}
                          >
                            <option value="">Pilih siswa...</option>
                            {daftarSiswa.map((s) => (
                              <option key={s.id} value={s.nama}>
                                {s.nama}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Jenis Izin</Label>
                          <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={siswa.jenis_izin}
                            onChange={(e) => {
                              const newSiswaIzin = [...formIzin.siswa_izin];
                              newSiswaIzin[index] = {...newSiswaIzin[index], jenis_izin: e.target.value as 'sakit' | 'izin' | 'alpa' | 'dispen'};
                              setFormIzin({...formIzin, siswa_izin: newSiswaIzin});
                            }}
                          >
                            <option value="izin">Izin</option>
                            <option value="sakit">Sakit</option>
                            <option value="alpa">Alpa</option>
                            <option value="dispen">Dispen</option>
                          </select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Alasan</Label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Alasan izin..."
                            value={siswa.alasan}
                            onChange={(e) => {
                              const newSiswaIzin = [...formIzin.siswa_izin];
                              newSiswaIzin[index] = {...newSiswaIzin[index], alasan: e.target.value};
                              setFormIzin({...formIzin, siswa_izin: newSiswaIzin});
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formIzin.siswa_izin.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="font-medium">Belum ada siswa yang dipilih untuk izin</p>
                      <p className="text-sm">Klik "Tambah Siswa" untuk menambahkan siswa</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button
                  onClick={submitPengajuanIzin}
                  disabled={!formIzin.jadwal_id || !formIzin.tanggal_izin || formIzin.siswa_izin.length === 0 || formIzin.siswa_izin.some(s => !s.nama || !s.alasan)}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2 px-6 py-3"
                >
                  <Send className="w-5 h-5" />
                  Kirim Pengajuan ({formIzin.siswa_izin.length} siswa)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFormIzin(false);
                    setFormIzin({
                      jadwal_id: '',
                      tanggal_izin: '',
                      siswa_izin: []
                    });
                  }}
                  className="px-6 py-3"
                >
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daftar Pengajuan Izin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Riwayat Pengajuan Izin Kelas
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 font-medium">
                  {pengajuanIzin.length} pengajuan
                </div>
                <div className="text-xs text-gray-500">
                  Halaman {pengajuanIzinPage} dari {Math.ceil(pengajuanIzin.length / itemsPerPage)}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pengajuanIzin.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Pengajuan</h3>
                <p className="text-gray-600">Kelas belum memiliki riwayat pengajuan izin</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {pengajuanIzin
                    .slice((pengajuanIzinPage - 1) * itemsPerPage, pengajuanIzinPage * itemsPerPage)
                    .map((izin) => (
                    <div key={izin.id_pengajuan} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={
                              izin.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                              izin.status === 'ditolak' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {izin.status === 'disetujui' ? 'Disetujui' :
                               izin.status === 'ditolak' ? 'Ditolak' : 'Menunggu'}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-gray-900">{izin.nama_mapel}</h4>
                          <p className="text-sm text-gray-600">{izin.nama_guru}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tanggal Pengajuan:</span>
                          <span>{new Date(izin.tanggal_pengajuan).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tanggal Izin:</span>
                          <span>{new Date(izin.tanggal_izin).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Waktu:</span>
                          <span>{izin.jam_mulai}-{izin.jam_selesai}</span>
                        </div>

                        {izin.siswa_izin && izin.siswa_izin.length > 0 ? (
                          <div>
                            <span className="text-gray-500">Siswa ({izin.total_siswa_izin || izin.siswa_izin.length}):</span>
                            <div className="mt-1 space-y-1">
                              {izin.siswa_izin.slice(0, 2).map((s, idx) => (
                                <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                                  <div className="font-medium">{s.nama}</div>
                                  <div className="text-gray-600">{s.jenis_izin} - {s.alasan}</div>
                                </div>
                              ))}
                              {izin.siswa_izin.length > 2 && (
                                <div className="text-xs text-blue-600 text-center">
                                  +{izin.siswa_izin.length - 2} siswa lainnya
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-gray-500">Alasan:</span>
                            <div className="mt-1 text-xs bg-gray-50 p-2 rounded">{izin.alasan}</div>
                          </div>
                        )}

                        {izin.keterangan_guru && (
                          <div>
                            <span className="text-gray-500">Respon Guru:</span>
                            <div className="mt-1 text-xs bg-blue-50 p-2 rounded text-blue-800">
                              {izin.keterangan_guru}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal Pengajuan</TableHead>
                          <TableHead>Tanggal Izin</TableHead>
                          <TableHead>Jadwal</TableHead>
                          <TableHead>Siswa Izin</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pengajuanIzin
                          .slice((pengajuanIzinPage - 1) * itemsPerPage, pengajuanIzinPage * itemsPerPage)
                          .map((izin) => (
                          <TableRow key={izin.id_pengajuan}>
                            <TableCell>
                              {new Date(izin.tanggal_pengajuan).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              {new Date(izin.tanggal_izin).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <span className="font-medium">{izin.nama_mapel}</span>
                                <div className="text-sm text-gray-600">
                                  {izin.nama_guru} • {izin.jam_mulai}-{izin.jam_selesai}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {izin.siswa_izin && izin.siswa_izin.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-sm">
                                    {izin.total_siswa_izin || izin.siswa_izin.length} siswa
                                  </div>
                                  <div className="text-xs text-gray-600 max-w-xs">
                                    {izin.siswa_izin.slice(0, 3).map((s, idx) => (
                                      <div key={idx}>
                                        {s.nama} ({s.jenis_izin})
                                      </div>
                                    ))}
                                    {izin.siswa_izin.length > 3 && (
                                      <div className="text-blue-600">
                                        +{izin.siswa_izin.length - 3} lainnya
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="outline" className={
                                  izin.jenis_izin === 'sakit' ? 'bg-red-50 text-red-700' :
                                  izin.jenis_izin === 'izin' ? 'bg-blue-50 text-blue-700' :
                                  izin.jenis_izin === 'dispen' ? 'bg-purple-50 text-purple-700' :
                                  'bg-gray-50 text-gray-700'
                                }>
                                  {izin.jenis_izin.charAt(0).toUpperCase() + izin.jenis_izin.slice(1)}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                izin.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                                izin.status === 'ditolak' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }>
                                {izin.status === 'disetujui' ? 'Disetujui' :
                                 izin.status === 'ditolak' ? 'Ditolak' : 'Menunggu'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 max-w-sm">
                                {izin.siswa_izin && izin.siswa_izin.length > 0 ? (
                                  <div className="text-sm space-y-1">
                                    {izin.siswa_izin.slice(0, 2).map((s, idx) => (
                                      <div key={idx} className="text-xs bg-gray-50 p-1 rounded">
                                        <strong>{s.nama}:</strong> {s.alasan}
                                      </div>
                                    ))}
                                    {izin.siswa_izin.length > 2 && (
                                      <div className="text-xs text-blue-600">
                                        +{izin.siswa_izin.length - 2} alasan lainnya
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-sm">{izin.alasan}</div>
                                )}
                                {izin.keterangan_guru && (
                                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    <strong>Respon Guru:</strong> {izin.keterangan_guru}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination untuk Pengajuan Izin */}
                    <Pagination
                      currentPage={pengajuanIzinPage}
                      totalPages={Math.ceil(pengajuanIzin.length / itemsPerPage)}
                      onPageChange={setPengajuanIzinPage}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render Banding Absen Content
  // Render Banding Absen Content untuk Kelas
  const renderBandingAbsenContent = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Pengajuan Banding Absen Kelas</h2>
            <p className="text-gray-600 text-sm lg:text-base">Ajukan banding absensi untuk siswa-siswa dalam kelas</p>
          </div>
          <Button 
            onClick={() => setShowFormBanding(true)}
            className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2 px-4 py-2 h-10 w-full sm:w-auto"
          >
            <MessageCircle className="w-4 h-4" />
            Ajukan Banding Kelas
          </Button>
        </div>

        {/* Form Pengajuan Banding Kelas */}
        {showFormBanding && (
          <Card className="mx-4 lg:mx-0">
            <CardHeader>
              <CardTitle className="text-lg">Form Pengajuan Banding Absen Kelas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="jadwal_banding" className="text-sm font-medium text-gray-700">Jadwal Pelajaran</Label>
                  <select
                    id="jadwal_banding"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={formBanding.jadwal_id}
                    onChange={(e) => setFormBanding({...formBanding, jadwal_id: e.target.value})}
                  >
                    <option value="">Pilih jadwal pelajaran...</option>
                    {riwayatData && riwayatData.length > 0 ? riwayatData.flatMap(hari =>
                      hari.jadwal.map(j => (
                        <option key={`${hari.tanggal}-${j.jam_ke}`} value={j.jadwal_id || `${hari.tanggal}-${j.jam_ke}`}>
                          {hari.tanggal} - {j.nama_mapel} ({j.jam_mulai}-{j.jam_selesai}) - {j.nama_guru}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading jadwal pelajaran...</option>
                    )}
                  </select>
                </div>

                <div>
                  <Label htmlFor="tanggal_banding" className="text-sm font-medium text-gray-700">Tanggal Absen</Label>
                  <input
                    id="tanggal_banding"
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={formBanding.tanggal_absen}
                    onChange={(e) => setFormBanding({...formBanding, tanggal_absen: e.target.value})}
                  />
                </div>
              </div>

              {/* Pilihan Siswa untuk Banding */}
              <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <Label className="text-lg font-semibold text-gray-900">Siswa yang Ajukan Banding</Label>
                  <Button
                    type="button"
                    onClick={() => {
                      setFormBanding({
                        ...formBanding,
                        siswa_banding: [...formBanding.siswa_banding, {
                          nama: '',
                          status_asli: 'alpa',
                          status_diajukan: 'hadir',
                          alasan_banding: '',
                          bukti_pendukung: ''
                        }]
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Siswa
                  </Button>
                </div>

                <div className="space-y-4">
                  {formBanding.siswa_banding.map((siswa, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-orange-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Siswa {index + 1}</span>
                        <Button
                          type="button"
                          onClick={() => {
                            const newSiswaBanding = formBanding.siswa_banding.filter((_, i) => i !== index);
                            setFormBanding({...formBanding, siswa_banding: newSiswaBanding});
                          }}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Nama Siswa</Label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Masukkan nama siswa..."
                            value={siswa.nama}
                            onChange={(e) => {
                              const newSiswaBanding = [...formBanding.siswa_banding];
                              newSiswaBanding[index] = {...newSiswaBanding[index], nama: e.target.value};
                              setFormBanding({...formBanding, siswa_banding: newSiswaBanding});
                            }}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Masukkan nama siswa dari kelas untuk pengajuan banding absen
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Status Tercatat</Label>
                            <select
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              value={siswa.status_asli}
                              onChange={(e) => {
                                const newSiswaBanding = [...formBanding.siswa_banding];
                                newSiswaBanding[index] = {...newSiswaBanding[index], status_asli: e.target.value as 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen'};
                                setFormBanding({...formBanding, siswa_banding: newSiswaBanding});
                              }}
                            >
                              <option value="hadir">Hadir</option>
                              <option value="izin">Izin</option>
                              <option value="sakit">Sakit</option>
                              <option value="alpa">Alpa</option>
                              <option value="dispen">Dispen</option>
                            </select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700">Status Diajukan</Label>
                            <select
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              value={siswa.status_diajukan}
                              onChange={(e) => {
                                const newSiswaBanding = [...formBanding.siswa_banding];
                                newSiswaBanding[index] = {...newSiswaBanding[index], status_diajukan: e.target.value as 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen'};
                                setFormBanding({...formBanding, siswa_banding: newSiswaBanding});
                              }}
                            >
                              <option value="hadir">Hadir</option>
                              <option value="izin">Izin</option>
                              <option value="sakit">Sakit</option>
                              <option value="alpa">Alpa</option>
                              <option value="dispen">Dispen</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Alasan Banding</Label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Alasan banding..."
                            value={siswa.alasan_banding}
                            onChange={(e) => {
                              const newSiswaBanding = [...formBanding.siswa_banding];
                              newSiswaBanding[index] = {...newSiswaBanding[index], alasan_banding: e.target.value};
                              setFormBanding({...formBanding, siswa_banding: newSiswaBanding});
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formBanding.siswa_banding.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-orange-50 rounded-lg">
                      <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="font-medium">Belum ada siswa yang dipilih untuk banding absen</p>
                      <p className="text-sm">Klik "Tambah Siswa" untuk menambahkan siswa</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button
                  onClick={submitBandingAbsen}
                  disabled={!formBanding.jadwal_id || !formBanding.tanggal_absen || formBanding.siswa_banding.length === 0 || formBanding.siswa_banding.some(s => !s.nama || !s.alasan_banding)}
                  className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2 px-6 py-3"
                >
                  <MessageCircle className="w-5 h-5" />
                  Kirim Banding ({formBanding.siswa_banding.length} siswa)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFormBanding(false);
                    setFormBanding({
                      jadwal_id: '',
                      tanggal_absen: '',
                      siswa_banding: []
                    });
                  }}
                  className="px-6 py-3"
                >
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daftar Banding Absen Kelas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Riwayat Pengajuan Banding Absen Kelas
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 font-medium">
                  {bandingAbsen.length} banding
                </div>
                <div className="text-xs text-gray-500">
                  Halaman {bandingAbsenPage} dari {Math.ceil(bandingAbsen.length / itemsPerPage)}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bandingAbsen.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Banding</h3>
                <p className="text-gray-600">Kelas belum memiliki riwayat pengajuan banding absen</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {bandingAbsen
                    .slice((bandingAbsenPage - 1) * itemsPerPage, bandingAbsenPage * itemsPerPage)
                    .map((banding) => (
                    <div key={banding.id_banding} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={
                              banding.status_banding === 'disetujui' ? 'bg-green-100 text-green-800' :
                              banding.status_banding === 'ditolak' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {banding.status_banding === 'disetujui' ? 'Disetujui' :
                               banding.status_banding === 'ditolak' ? 'Ditolak' : 'Menunggu'}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-gray-900">{banding.nama_mapel}</h4>
                          <p className="text-sm text-gray-600">{banding.nama_guru}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tanggal Pengajuan:</span>
                          <span>{new Date(banding.tanggal_pengajuan).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tanggal Absen:</span>
                          <span>{new Date(banding.tanggal_absen).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Waktu:</span>
                          <span>{banding.jam_mulai}-{banding.jam_selesai}</span>
                        </div>

                        {banding.siswa_banding && banding.siswa_banding.length > 0 ? (
                          <div>
                            <span className="text-gray-500">Siswa ({banding.total_siswa_banding || banding.siswa_banding.length}):</span>
                            <div className="mt-1 space-y-1">
                              {banding.siswa_banding.slice(0, 2).map((s, idx) => (
                                <div key={idx} className="text-xs bg-orange-50 p-2 rounded">
                                  <div className="font-medium">{s.nama}</div>
                                  <div className="text-gray-600">{s.status_asli} → {s.status_diajukan}</div>
                                  <div className="text-gray-600">{s.alasan_banding}</div>
                                </div>
                              ))}
                              {banding.siswa_banding.length > 2 && (
                                <div className="text-xs text-orange-600 text-center">
                                  +{banding.siswa_banding.length - 2} siswa lainnya
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <div className="mt-1 flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {banding.status_asli} → {banding.status_diajukan}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs bg-gray-50 p-2 rounded">{banding.alasan_banding}</div>
                          </div>
                        )}

                        {banding.catatan_guru && (
                          <div>
                            <span className="text-gray-500">Respon Guru:</span>
                            <div className="mt-1 text-xs bg-orange-50 p-2 rounded text-orange-800">
                              {banding.catatan_guru}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal Pengajuan</TableHead>
                          <TableHead>Tanggal Absen</TableHead>
                          <TableHead>Jadwal</TableHead>
                          <TableHead>Siswa Banding</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bandingAbsen
                          .slice((bandingAbsenPage - 1) * itemsPerPage, bandingAbsenPage * itemsPerPage)
                          .map((banding) => (
                          <TableRow key={banding.id_banding}>
                            <TableCell>
                              {new Date(banding.tanggal_pengajuan).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              {new Date(banding.tanggal_absen).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <span className="font-medium">{banding.nama_mapel}</span>
                                <div className="text-sm text-gray-600">
                                  {banding.nama_guru} • {banding.jam_mulai}-{banding.jam_selesai}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {banding.siswa_banding && banding.siswa_banding.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-sm">
                                    {banding.total_siswa_banding || banding.siswa_banding.length} siswa
                                  </div>
                                  <div className="text-xs text-gray-600 max-w-xs">
                                    {banding.siswa_banding.slice(0, 3).map((s, idx) => (
                                      <div key={idx}>
                                        {s.nama} ({s.status_asli} → {s.status_diajukan})
                                      </div>
                                    ))}
                                    {banding.siswa_banding.length > 3 && (
                                      <div className="text-orange-600">
                                        +{banding.siswa_banding.length - 3} lainnya
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm space-y-1">
                                  <Badge variant="outline" className="capitalize">
                                    {banding.status_asli} → {banding.status_diajukan}
                                  </Badge>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                banding.status_banding === 'disetujui' ? 'bg-green-100 text-green-800' :
                                banding.status_banding === 'ditolak' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }>
                                {banding.status_banding === 'disetujui' ? 'Disetujui' :
                                 banding.status_banding === 'ditolak' ? 'Ditolak' : 'Menunggu'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 max-w-sm">
                                {banding.siswa_banding && banding.siswa_banding.length > 0 ? (
                                  <div className="text-sm space-y-1">
                                    {banding.siswa_banding.slice(0, 2).map((s, idx) => (
                                      <div key={idx} className="text-xs bg-gray-50 p-1 rounded">
                                        <strong>{s.nama}:</strong> {s.alasan_banding}
                                      </div>
                                    ))}
                                    {banding.siswa_banding.length > 2 && (
                                      <div className="text-xs text-orange-600">
                                        +{banding.siswa_banding.length - 2} alasan lainnya
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-sm">{banding.alasan_banding}</div>
                                )}
                                {banding.catatan_guru && (
                                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    <strong>Respon Guru:</strong> {banding.catatan_guru}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination untuk Banding Absen */}
                    <Pagination
                      currentPage={bandingAbsenPage}
                      totalPages={Math.ceil(bandingAbsen.length / itemsPerPage)}
                      onPageChange={setBandingAbsenPage}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Submit Banding Absen Kelas
  const submitBandingAbsen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siswaId || formBanding.siswa_banding.length === 0) return;

    try {
      // Get and clean token from localStorage
      const rawToken = localStorage.getItem('token');
      const cleanToken = rawToken ? rawToken.trim() : '';
      
      if (!cleanToken) {
        toast({
          title: "Error",
          description: "Token tidak ditemukan. Silakan login ulang.",
          variant: "destructive"
        });
        return;
      }
      
      const requestData = {
        jadwal_id: formBanding.jadwal_id ? parseInt(formBanding.jadwal_id) : null,
        tanggal_absen: formBanding.tanggal_absen,
        siswa_banding: formBanding.siswa_banding
      };
      
      console.log('📝 Submitting banding absen data:', requestData);
      console.log('📝 Form state:', formBanding);
      
      const response = await fetch(`http://localhost:3001/api/siswa/${siswaId}/banding-absen-kelas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanToken}`
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Pengajuan banding absen kelas berhasil dikirim"
        });
        
        // Reset form dan reload data
        setFormBanding({
          jadwal_id: '',
          tanggal_absen: '',
          siswa_banding: []
        });
        setShowFormBanding(false);
        loadBandingAbsen();
      } else {
        const errorData = await response.json();
        console.error('❌ Error submitting banding absen:', errorData);
        toast({
          title: "Error",
          description: errorData.error || "Gagal mengirim pengajuan banding absen",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting banding absen:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan jaringan",
        variant: "destructive"
      });
    }
  };

  // Show loading or error states
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Memuat Data...</h3>
            <p className="text-gray-600">Sedang memuat informasi siswa</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Terjadi Kesalahan</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm font-medium mb-2">Pesan Error:</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setError(null);
                  setInitialLoading(true);
                  // Retry the initial data fetch
                  window.location.reload();
                }} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                🔄 Coba Lagi
              </Button>
              
              <Button 
                onClick={onLogout} 
                variant="outline" 
                className="w-full"
              >
                🚪 Kembali ke Login
              </Button>
              
              {error.includes('server backend') && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-xs">
                    💡 <strong>Tips:</strong> Pastikan server backend sudah berjalan di port 3001
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-xl transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-72' : 'w-16'
      } lg:w-64 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`flex items-center space-x-3 ${sidebarOpen ? '' : 'justify-center lg:justify-start'}`}>
            <div className="p-2 rounded-lg bg-blue-50">
              <img src="/logo.png" alt="ABSENTA Logo" className="h-8 w-8 lg:h-12 lg:w-12" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg lg:text-xl bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent block lg:hidden">
                ABSENTA
              </span>
            )}
            <span className="font-bold text-lg lg:text-xl bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent hidden lg:block">
              ABSENTA
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-3 lg:p-4 space-y-1">
          <Button
            variant={activeTab === 'kehadiran' ? "default" : "ghost"}
            className={`w-full justify-start h-12 text-sm lg:text-base ${sidebarOpen ? '' : 'px-2 lg:px-3'}`}
            onClick={() => {setActiveTab('kehadiran'); setSidebarOpen(false);}}
          >
            <Clock className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3 block lg:hidden">Menu Kehadiran</span>}
            <span className="ml-3 hidden lg:block">Menu Kehadiran</span>
          </Button>
          <Button
            variant={activeTab === 'riwayat' ? "default" : "ghost"}
            className={`w-full justify-start h-12 text-sm lg:text-base ${sidebarOpen ? '' : 'px-2 lg:px-3'}`}
            onClick={() => {setActiveTab('riwayat'); setSidebarOpen(false);}}
          >
            <Calendar className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3 block lg:hidden">Riwayat</span>}
            <span className="ml-3 hidden lg:block">Riwayat</span>
          </Button>
          <Button
            variant={activeTab === 'pengajuan-izin' ? "default" : "ghost"}
            className={`w-full justify-start h-12 text-sm lg:text-base ${sidebarOpen ? '' : 'px-2 lg:px-3'}`}
            onClick={() => {setActiveTab('pengajuan-izin'); setSidebarOpen(false);}}
          >
            <FileText className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3 block lg:hidden">Pengajuan Izin</span>}
            <span className="ml-3 hidden lg:block">Pengajuan Izin</span>
          </Button>
          <Button
            variant={activeTab === 'banding-absen' ? "default" : "ghost"}
            className={`w-full justify-start h-12 text-sm lg:text-base ${sidebarOpen ? '' : 'px-2 lg:px-3'}`}
            onClick={() => {setActiveTab('banding-absen'); setSidebarOpen(false);}}
          >
            <MessageCircle className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3 block lg:hidden">Banding Absen</span>}
            <span className="ml-3 hidden lg:block">Banding Absen</span>
          </Button>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 border-t border-gray-200">
          {/* Font Size Control - Above Profile */}
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <div className="mb-3 lg:mb-4">
              <FontSizeControl variant="compact" />
            </div>
          )}

          <div className={`flex items-center space-x-3 mb-3 ${sidebarOpen ? '' : 'justify-center lg:justify-start'}`}>
            <div className="bg-emerald-100 p-2 rounded-full flex-shrink-0">
              <User className="h-4 w-4 text-emerald-600" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 block lg:hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{userData.nama}</p>
                <p className="text-xs text-gray-500 truncate">Siswa Perwakilan</p>
                {kelasInfo && (
                  <p className="text-xs text-blue-600 truncate">Kelas {kelasInfo}</p>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0 hidden lg:block">
              <p className="text-sm font-medium text-gray-900 truncate">{userData.nama}</p>
              <p className="text-xs text-gray-500 truncate">Siswa Perwakilan</p>
              {kelasInfo && (
                <p className="text-xs text-blue-600 truncate">Kelas {kelasInfo}</p>
              )}
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className={`w-full h-10 text-sm ${sidebarOpen ? '' : 'px-2 lg:px-3'}`}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2 block lg:hidden">Keluar</span>}
            <span className="ml-2 hidden lg:block">Keluar</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'} ml-0`}>
        <div className="p-4 lg:p-6 pt-6 lg:pt-6">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-3 py-2"
            >
              <Menu className="h-4 w-4" />
              <span className="text-sm">Menu</span>
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Dashboard Siswa</h1>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="w-16"></div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Dashboard Siswa
              </h1>
              <p className="text-gray-600 mt-1">Selamat datang, {userData.nama}!</p>
              {kelasInfo && (
                <p className="text-sm text-blue-600 font-medium mt-1">Perwakilan Kelas {kelasInfo}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Badge>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'kehadiran' && renderKehadiranContent()}
          {activeTab === 'riwayat' && renderRiwayatContent()}
          {activeTab === 'pengajuan-izin' && renderPengajuanIzinContent()}
          {activeTab === 'banding-absen' && renderBandingAbsenContent()}
        </div>
      </div>
      
      {/* Floating Font Size Control for Mobile */}
      <FontSizeControl variant="floating" className="lg:hidden" />
    </div>
  );
};
