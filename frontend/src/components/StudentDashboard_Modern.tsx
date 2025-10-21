import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { apiCall } from '@/utils/api';
import { FontSizeControl } from '@/components/ui/font-size-control';
import { EditProfile } from './EditProfile';
import ErrorBoundary from './ErrorBoundary';
import { useRequestCancellation } from '@/hooks/useRequestCancellation';
import { useRetryLogic } from '@/hooks/useRetryLogic';
import { 
  LogOut, Clock, User, BookOpen, CheckCircle2, XCircle, Calendar, Save,
  GraduationCap, Settings, Menu, X, Home, Users, FileText, Send, AlertCircle, MessageCircle, Eye, Plus, Edit,
  ChevronLeft, ChevronRight, RefreshCw, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import { useJadwalKhusus } from '@/hooks/useJadwalKhusus';
import { mergeSchedules, getTodaySchedules } from '@/utils/jadwalKhususHelpers';

interface StudentDashboardProps {
  userData: {
    id: number;
    username: string;
    nama: string;
    role: string;
    email?: string;
    alamat?: string;
    jenis_kelamin?: 'L' | 'P';
    telepon_orangtua?: string;
    telepon_siswa?: string;
    jabatan?: string;
    nis?: string;
    kelas?: string;
  };
  onLogout: () => void;
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
  jenis_banding?: 'individual' | 'kelas';
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
    email?: string;
    alamat?: string;
    jenis_kelamin?: 'L' | 'P';
    telepon_orangtua?: string;
    telepon_siswa?: string;
    jabatan?: string;
    nis?: string;
    kelas?: string;
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
  kelas_id?: number; // TAMBAHKAN field ini
  status_kehadiran: string;
  keterangan?: string;
  waktu_catat?: string;
  tanggal_target?: string;
  jenis_kegiatan?: 'istirahat' | 'upacara' | 'perwalian'; // TAMBAHKAN untuk jadwal khusus
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
    total_tidak_hadir?: number;
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
    <div className="flex items-center justify-center space-x-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Sebelumnya
      </Button>
      
      <div className="flex items-center space-x-1">
        {getVisiblePages().map((page, index) => (
          <Button
            key={index}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className="w-8 h-8 p-0"
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
        className="flex items-center"
      >
        Selanjutnya
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
};

const StudentDashboardComponent = ({ userData, onLogout }: StudentDashboardProps) => {
  
  const [activeTab, setActiveTab] = useState('kehadiran');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(userData);
  const [jadwalHariIni, setJadwalHariIni] = useState<JadwalHariIni[]>([]);
  const [kehadiranData, setKehadiranData] = useState<KehadiranData>({});
  const [adaTugasData, setAdaTugasData] = useState<{[key: number]: boolean}>({});
  const [riwayatData, setRiwayatData] = useState<RiwayatData[]>([]);
  
  const [bandingAbsen, setBandingAbsen] = useState<BandingAbsen[]>([]);
  const [expandedBanding, setExpandedBanding] = useState<number | null>(null);
  
  const [attendanceRecords, setAttendanceRecords] = useState<Array<{
    siswa_id: number;
    nama: string;
    nis: string;
    status: string | null;
    has_attendance: boolean;
    keterangan?: string;
  }>>([]);
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
  // Centralized loading state management
  const [loadingStates, setLoadingStates] = useState({
    initial: true,
    jadwal: false,
    riwayat: false,
    
    bandingAbsen: false,
    submit: false,
    general: false
  });
  
  // State untuk mencegah multiple submission
  const [submitting, setSubmitting] = useState(false);
  
  const [siswaId, setSiswaId] = useState<number | null>(null);
  const [kelasId, setKelasId] = useState<number | null>(null);
  const [kelasInfo, setKelasInfo] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Fetch jadwal khusus untuk kelas siswa
  const { jadwalKhusus, loading: loadingJadwalKhusus } = useJadwalKhusus({
    kelasId: kelasId || undefined,
    autoFetch: !!kelasId
  });
  
  // Helper functions for loading state management
  const setLoading = useCallback((key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const isLoading = useCallback((key?: keyof typeof loadingStates) => {
    if (key) {
      return loadingStates[key];
    }
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  // Request cancellation hook
  const { createRequest, cancelRequest, isAborted } = useRequestCancellation();
  // Retry logic hook
  const { executeWithRetry } = useRetryLogic();
  
  // Use refs to avoid dependency issues
  const createRequestRef = useRef(createRequest);
  const executeWithRetryRef = useRef(executeWithRetry);
  const isAbortedRef = useRef(isAborted);
  const setLoadingRef = useRef(setLoading);
  
  // Update refs when functions change
  useEffect(() => {
    createRequestRef.current = createRequest;
    executeWithRetryRef.current = executeWithRetry;
    isAbortedRef.current = isAborted;
    setLoadingRef.current = setLoading;
  }, [createRequest, executeWithRetry, isAborted, setLoading]);
  
  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow || '';
    }
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, [sidebarOpen]);
  
  // Memoized date values
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const maxDateValue = useMemo(() => new Date().toISOString().split('T')[0], []);
  const minDateValue = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], []);
  
  // State untuk edit absen dengan rentang tanggal
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [isEditMode, setIsEditMode] = useState(false);
  const [maxDate, setMaxDate] = useState<string>(maxDateValue);
  const [minDate, setMinDate] = useState<string>(minDateValue);
  
  //   jadwal_id: '',
  //   tanggal_izin: '',
  //   jenis_izin: '',
  //   alasan: '',
  //   bukti_pendukung: ''
  const [showFormBandingKelas, setShowFormBandingKelas] = useState(false);
  const [daftarSiswa, setDaftarSiswa] = useState<Array<{id: number; nama: string}>>([]);
  
  // State untuk pagination
  
  const [bandingAbsenPage, setBandingAbsenPage] = useState(1);
  const [riwayatPage, setRiwayatPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [riwayatItemsPerPage] = useState(7);
  
  // State untuk expandable rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  // const [formBanding, setFormBanding] = useState({
  //   jadwal_id: '',
  //   tanggal_absen: '',
  //   status_asli: '',
  //   status_diajukan: '',
  //   alasan_banding: '',
  //   bukti_pendukung: ''


  // State untuk form banding absen kelas - SINGLE STUDENT ONLY
  const [formBandingKelas, setFormBandingKelas] = useState({
    jadwal_id: '',
    tanggal_absen: '',
    kelas_id: '', // TAMBAHKAN field ini
    siswa_banding: {
      id: '' as number | '', // UBAH dari nama ke id
      nama: '',
      status_asli: 'alpa' as 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen',
      status_diajukan: 'hadir' as 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen',
      alasan: '',
      bukti: '' // UBAH dari bukti_pendukung ke bukti
    }
  });
  
  // State untuk jadwal berdasarkan tanggal
  const [jadwalBerdasarkanTanggal, setJadwalBerdasarkanTanggal] = useState<JadwalHariIni[]>([]);

  // Memoized computed values
  const isDesktop = useMemo(() => window.innerWidth >= 1024, []);
  const sidebarClasses = useMemo(() => 
    `fixed inset-y-0 left-0 bg-white shadow-xl transition-transform duration-300 z-40 w-64 ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0 lg:w-64`, [sidebarOpen]
  );

  // Memoized pagination data

  const paginatedBandingAbsen = useMemo(() => {
    const startIndex = (bandingAbsenPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return bandingAbsen.slice(startIndex, endIndex);
  }, [bandingAbsen, bandingAbsenPage, itemsPerPage]);

  const paginatedRiwayat = useMemo(() => {
    const startIndex = (riwayatPage - 1) * riwayatItemsPerPage;
    const endIndex = startIndex + riwayatItemsPerPage;
    return riwayatData.slice(startIndex, endIndex);
  }, [riwayatData, riwayatPage, riwayatItemsPerPage]);


  const totalBandingPages = useMemo(() => 
    Math.ceil(bandingAbsen.length / itemsPerPage), [bandingAbsen.length, itemsPerPage]
  );

  const totalRiwayatPages = useMemo(() => 
    Math.ceil(riwayatData.length / riwayatItemsPerPage), [riwayatData.length, riwayatItemsPerPage]
  );

  // Merge jadwal reguler dengan jadwal khusus
  const mergedJadwal = useMemo(() => {
    if (!jadwalHariIni || jadwalHariIni.length === 0) {
      return [];
    }
    
    // Jadwal khusus untuk hari ini
    const todayJadwalKhusus = getTodaySchedules(jadwalKhusus || []);
    
    // Transform jadwal khusus ke format JadwalHariIni
    const transformedJadwalKhusus = todayJadwalKhusus.map(jk => ({
      id_jadwal: jk.id * -1, // Negative ID untuk membedakan dari jadwal reguler
      jam_ke: 0, // Jadwal khusus tidak punya jam_ke
      jam_mulai: jk.jam_mulai,
      jam_selesai: jk.jam_selesai,
      nama_mapel: jk.nama_kegiatan,
      kode_mapel: jk.jenis_kegiatan.toUpperCase(),
      nama_guru: jk.nama_guru || '-',
      nip: '',
      nama_kelas: kelasInfo,
      kelas_id: kelasId || undefined,
      status_kehadiran: '-',
      keterangan: jk.keterangan || '',
      jenis_kegiatan: jk.jenis_kegiatan // Tambahkan field ini untuk visual differentiation
    }));
    
    // Merge dan sort berdasarkan jam mulai
    const merged = [...jadwalHariIni, ...transformedJadwalKhusus];
    return merged.sort((a, b) => {
      const timeA = a.jam_mulai.split(':').map(Number);
      const timeB = b.jam_mulai.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });
  }, [jadwalHariIni, jadwalKhusus, kelasInfo, kelasId]);

  // Helper functions for expandable rows
  const toggleRowExpansion = useCallback((rowId: number) => {
    setExpandedRows(prev => {
      const newExpandedRows = new Set(prev);
      if (newExpandedRows.has(rowId)) {
        newExpandedRows.delete(rowId);
      } else {
        newExpandedRows.add(rowId);
      }
      return newExpandedRows;
    });
  }, []);

  const handleUpdateProfile = useCallback((updatedData: {
    id: number;
    username: string;
    nama: string;
    role: string;
  }) => {
    setCurrentUserData(updatedData);
  }, []);

  // Memoized event handlers
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Memoized form handlers - REMOVED (personal forms no longer exist)

  const handleEditModeToggle = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);


  const handleBandingPageChange = useCallback((page: number) => {
    setBandingAbsenPage(page);
  }, []);

  const handleRiwayatPageChange = useCallback((page: number) => {
    setRiwayatPage(page);
  }, []);

  // Get siswa perwakilan info
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    const getSiswaInfo = async () => {
      try {
        if (!isMounted) return;
        
        setLoadingRef.current('initial', true);
        setError(null);
        
        const result = await apiCall('/api/siswa-perwakilan/info', {
          method: 'GET',
          signal: abortController.signal
        });
        
        if (result.success && isMounted) {
          // The API returns data directly, not wrapped in a data property
          const siswaData = result.data || result;
          
          if (siswaData && isMounted) {
          // Batch state updates to prevent multiple re-renders
            setSiswaId(siswaData.id_siswa);
            setKelasId(siswaData.kelas_id); // Set kelas_id for jadwal khusus
            setKelasInfo(siswaData.nama_kelas);
          setCurrentUserData(prevData => {
            // Only update if data actually changed
              if (prevData.id !== siswaData.id || 
                  prevData.username !== siswaData.username || 
                  prevData.nama !== siswaData.nama || 
                  prevData.role !== siswaData.role) {
              return {
                ...prevData,
                  id: siswaData.id,
                  username: siswaData.username || prevData.username, // Preserve existing username if API doesn't provide it
                  nama: siswaData.nama,
                  role: siswaData.role || prevData.role, // Preserve existing role if API doesn't provide it
                  email: siswaData.email || prevData.email,
                  alamat: siswaData.alamat || prevData.alamat,
                  jenis_kelamin: siswaData.jenis_kelamin || prevData.jenis_kelamin,
                  telepon_orangtua: siswaData.telepon_orangtua,
                  telepon_siswa: siswaData.telepon_siswa,
                  jabatan: siswaData.jabatan,
                  nis: siswaData.nis,
                  kelas: siswaData.nama_kelas // UBAH dari siswaData.kelas ke siswaData.nama_kelas
              };
            }
            return prevData;
          });
          }
        } else if (isMounted) {
          let errorMessage = result.message || 'Gagal memuat informasi siswa';
          
          if (result.error === 'Unauthorized') {
            errorMessage = 'Sesi login Anda telah berakhir. Silakan login kembali.';
            // Redirect to login after showing error
            setTimeout(() => {
              if (isMounted) onLogout();
            }, 2000);
          } else if (result.error === 'Forbidden') {
            errorMessage = 'Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.';
          } else if (result.error === 'Not Found') {
            errorMessage = 'Data siswa perwakilan tidak ditemukan. Silakan hubungi administrator.';
          } else if (result.error === 'Internal Server Error') {
            errorMessage = 'Server sedang mengalami gangguan. Silakan coba lagi nanti.';
          }
          
          setError(errorMessage);
          console.error('StudentDashboard: API error:', result.error, errorMessage);
        }
      } catch (error) {
        if (error.name === 'AbortError' || !isMounted) {
          return; // Request was cancelled or component unmounted, don't show error
        }
        
        console.error('StudentDashboard: Network error getting siswa info:', error);
        
        let errorMessage = 'Koneksi bermasalah. ';
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMessage += 'Tidak dapat terhubung ke server. Pastikan server backend sedang berjalan di ';
        } else {
          errorMessage += 'Silakan periksa koneksi internet Anda dan coba lagi.';
        }
        
        if (isMounted) {
        setError(errorMessage);
        }
      } finally {
        if (isMounted) {
        setLoadingRef.current('initial', false);
        }
      }
    };

    getSiswaInfo();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [onLogout]);

  // Cleanup request cancellation on unmount
  useEffect(() => {
    return () => {
      cancelRequest();
    };
  }, [cancelRequest]);

  // Load jadwal hari ini
  const loadJadwalHariIni = useCallback(async () => {
    if (!siswaId || isLoading('jadwal')) return;

    const request = createRequestRef.current();
    setLoadingRef.current('jadwal', true);
    try {
      await executeWithRetryRef.current(async () => {
        const response = await apiCall(`/api/siswa/${siswaId}/jadwal-hari-ini`, {
          signal: request.signal
        });

          // Handle response with success wrapper
          const jadwalData = response.success ? response.data : (Array.isArray(response) ? response : []);
          
          setJadwalHariIni(jadwalData);
          console.log('📊 Raw data from API (normal mode):', jadwalData);
          
          // Initialize kehadiran data
          const initialKehadiran: KehadiranData = {};
          jadwalData.forEach((jadwal: JadwalHariIni) => {
            console.log(`🔍 Processing jadwal ${jadwal.id_jadwal} (normal mode):`, {
              status: jadwal.status_kehadiran,
              keterangan: jadwal.keterangan,
              hasKeterangan: !!(jadwal.keterangan && jadwal.keterangan.trim() !== ''),
              fullJadwalData: jadwal
            });
            
            // Selalu inisialisasi data, terlepas dari status
            initialKehadiran[jadwal.id_jadwal] = {
              status: jadwal.status_kehadiran || 'Hadir',
              keterangan: jadwal.keterangan || ''
            };
            
            // Debug logging khusus untuk jadwal Kimia (id 1125)
            if (jadwal.id_jadwal === 1125) {
              console.log(`🔍 SPECIAL DEBUG - Jadwal Kimia (1125):`, {
                nama_mapel: jadwal.nama_mapel,
                status: jadwal.status_kehadiran,
                keterangan: jadwal.keterangan,
                keteranganType: typeof jadwal.keterangan,
                keteranganLength: jadwal.keterangan?.length,
                isKeteranganEmpty: !jadwal.keterangan || jadwal.keterangan.trim() === '',
                fullData: jadwal
              });
            }
            
            // Debug logging untuk keterangan
            if (jadwal.keterangan && jadwal.keterangan.trim() !== '') {
              console.log(`🔍 Loaded keterangan for jadwal ${jadwal.id_jadwal}:`, jadwal.keterangan);
            }
          });
          
          console.log('📊 Initialized kehadiranData for normal mode:', initialKehadiran);
          setKehadiranData(initialKehadiran);
      });
    } catch (error) {
      if (isAbortedRef.current(error)) {
        // Request was cancelled, don't show error
        return;
      }
      console.error('Error loading jadwal hari ini:', error);
      toast({
        title: "Error",
        description: "Gagal memuat jadwal hari ini",
        variant: "destructive"
      });
    } finally {
      setLoadingRef.current('jadwal', false);
    }
  }, [siswaId, isLoading]);

  // Load jadwal by date for edit mode
  const loadJadwalByDate = useCallback(async (tanggal: string) => {
    console.log('[loadJadwalByDate] Called with tanggal:', tanggal, 'siswaId:', siswaId);
    if (!siswaId) {
      console.log('[loadJadwalByDate] Early return - no siswaId');
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoading('jadwal')) {
      console.log('[loadJadwalByDate] Already loading, skipping');
      return;
    }

    setLoadingRef.current('jadwal', true);
    try {
      const token = localStorage.getItem('token');
      const cleanToken = token ? token.replace(/['"]/g, '') : '';
      
      console.log('[loadJadwalByDate] Making API call to:', `/api/siswa/${siswaId}/jadwal-rentang?tanggal=${tanggal}`);
      console.log('[loadJadwalByDate] Token available:', !!cleanToken);
      
      const response = await fetch(`/api/siswa/${siswaId}/jadwal-rentang?tanggal=${tanggal}`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`
        },
        credentials: 'include'
      });

      console.log('[loadJadwalByDate] Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[loadJadwalByDate] API response:', result);
        
        if (result.success && result.data) {
          console.log('[loadJadwalByDate] Data received:', result.data.length, 'jadwal');
          setJadwalBerdasarkanTanggal(result.data);
          
          // Initialize kehadiranData for edit mode
          const initialKehadiran: KehadiranData = {};
          result.data.forEach((jadwal: JadwalHariIni) => {
            initialKehadiran[jadwal.id_jadwal] = {
              status: jadwal.status_kehadiran && jadwal.status_kehadiran !== 'belum_diambil' 
                ? jadwal.status_kehadiran 
                : 'Hadir',
              keterangan: jadwal.keterangan || ''
            };
          });
          setKehadiranData(initialKehadiran);
          console.log('[loadJadwalByDate] Initialized kehadiranData:', initialKehadiran);
        } else {
          console.log('[loadJadwalByDate] No data or invalid response format:', result);
          setJadwalBerdasarkanTanggal([]);
          setKehadiranData({});
        }
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          toast({
            title: "Error memuat jadwal",
            description: errorData.error || 'Failed to load schedule',
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error memuat jadwal",
            description: `HTTP ${response.status}: ${response.statusText}`,
            variant: "destructive"
          });
        }
        setJadwalBerdasarkanTanggal([]);
      }
    } catch (error) {
      console.error('Error loading jadwal by date:', error);
      toast({
        title: "Error",
        description: "Network error while loading schedule",
        variant: "destructive"
      });
      setJadwalBerdasarkanTanggal([]);
    } finally {
      setLoadingRef.current('jadwal', false);
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
      
      const response = await fetch(`/api/siswa/${siswaId}/daftar-siswa`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Deduplicate data berdasarkan id
        const uniqueData = Array.from(new Map(data.map((item: {id: number; nama: string}) => [item.id, item])).values());
        console.log('📊 Daftar siswa loaded:', data.length, 'items, unique:', uniqueData.length);
        setDaftarSiswa(uniqueData as Array<{id: number; nama: string}>);
      } else {
        const errorData = await response.json();
        console.error('Error loading daftar siswa:', errorData);
      }
    } catch (error) {
      console.error('Error loading daftar siswa:', error);
    }
  }, [siswaId]);

  // Load attendance records for banding absen
  const loadAttendanceRecords = useCallback(async (jadwalId: number, tanggal: string) => {
    if (!siswaId || !jadwalId || !tanggal) return;

    try {
      console.log('📊 Loading attendance records:', { jadwalId, tanggal });
      const response = await apiCall(
        `/api/siswa/${siswaId}/attendance-records?jadwal_id=${jadwalId}&tanggal_absen=${tanggal}`
      );
      
      if (response.success) {
        console.log('✅ Attendance records loaded:', response.data.length, 'students');
        setAttendanceRecords(response.data || []);
      } else {
        console.error('Error loading attendance records:', response.error);
        toast({
          title: "Error",
          description: "Gagal memuat data absensi",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data absensi",
        variant: "destructive"
      });
    }
  }, [siswaId]);

  // Load riwayat data
  const loadRiwayatData = useCallback(async () => {
    if (!siswaId) return;

    try {
      await executeWithRetryRef.current(async () => {
        const data = await apiCall(`/api/siswa/${siswaId}/riwayat-kehadiran`);
          setRiwayatData(data);
      });
    } catch (error) {
      console.error('Error loading riwayat:', error);
      toast({
        title: "Error",
        description: "Gagal memuat riwayat kehadiran",
        variant: "destructive"
      });
    }
  }, [siswaId]);

  // Load banding absen data
  const loadBandingAbsen = useCallback(async () => {
    if (!siswaId) return;

    try {
      console.log('📊 Loading banding absen data for siswa:', siswaId);
      const data = await apiCall(`/api/siswa/${siswaId}/banding-absen`);
      setBandingAbsen(data);
    } catch (error) {
      console.error('Error loading banding absen:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data banding absen",
        variant: "destructive"
      });
    }
  }, [siswaId]);

  // Create refs for functions to avoid dependency issues
  const loadJadwalHariIniRef = useRef(loadJadwalHariIni);
  const loadRiwayatDataRef = useRef(loadRiwayatData);
  const loadDaftarSiswaRef = useRef(loadDaftarSiswa);
  const loadBandingAbsenRef = useRef(loadBandingAbsen);

  // Debug useEffect untuk memantau perubahan kehadiranData
  useEffect(() => {
    console.log('🔍 kehadiranData changed:', kehadiranData);
    console.log('🔍 kehadiranData keys:', Object.keys(kehadiranData));
    Object.keys(kehadiranData).forEach(jadwalId => {
      const data = kehadiranData[parseInt(jadwalId)];
      console.log(`🔍 kehadiranData[${jadwalId}]:`, data);
      if (data?.keterangan && data.keterangan.trim() !== '') {
        console.log(`🔍 kehadiranData[${jadwalId}] has keterangan:`, data.keterangan);
      } else {
        console.log(`🔍 kehadiranData[${jadwalId}] keterangan is empty or null:`, data?.keterangan);
      }
    });
  }, [kehadiranData]);

  // Debug useEffect untuk memantau perubahan jadwalBerdasarkanTanggal
  useEffect(() => {
    console.log('📅 jadwalBerdasarkanTanggal changed:', jadwalBerdasarkanTanggal);
    console.log('📅 jadwalBerdasarkanTanggal length:', jadwalBerdasarkanTanggal.length);
    console.log('📅 isEditMode:', isEditMode);
    console.log('📅 selectedDate:', selectedDate);
  }, [jadwalBerdasarkanTanggal, isEditMode, selectedDate]);

  // Update refs when functions change - using direct assignment to avoid re-render
  loadJadwalHariIniRef.current = loadJadwalHariIni;
  loadRiwayatDataRef.current = loadRiwayatData;
  loadDaftarSiswaRef.current = loadDaftarSiswa;
  loadBandingAbsenRef.current = loadBandingAbsen;

  useEffect(() => {
    if (siswaId && activeTab === 'banding-absen') {
      loadBandingAbsenRef.current();
      loadDaftarSiswaRef.current();
      loadRiwayatDataRef.current();
    }
  }, [siswaId, activeTab]);

  // Load jadwal hari ini when opening kehadiran tab
  useEffect(() => {
    if (siswaId && activeTab === 'kehadiran' && !isEditMode) {
      loadJadwalHariIniRef.current();
    }
  }, [siswaId, activeTab, isEditMode]);

  // Submit kehadiran guru
  const submitKehadiran = useCallback(async () => {
    if (!siswaId) return;

    // Cek apakah sedang dalam proses submit
    if (submitting) {
      console.log('⚠️ Submit kehadiran sedang diproses, mencegah multiple submission');
      return;
    }

    setSubmitting(true);
    setLoadingRef.current('submit', true);
    try {
      // Validasi keterangan sebelum submit
      const invalidKeterangan = Object.keys(kehadiranData).find(jadwalId => {
        const keterangan = kehadiranData[parseInt(jadwalId)]?.keterangan;
        return keterangan && keterangan.length > 500; // Maksimal 500 karakter
      });

      if (invalidKeterangan) {
        toast({
          title: "Error",
          description: "Keterangan tidak boleh lebih dari 500 karakter",
          variant: "destructive"
        });
        setSubmitting(false);
        setLoadingRef.current('submit', false);
        return;
      }

      // Prepare kehadiran data with ada_tugas and diwakili flags
      const kehadiranDataWithFlags: {[key: number]: {status: string; keterangan: string; ada_tugas: boolean; diwakili: boolean}} = {};
      Object.keys(kehadiranData).forEach(jadwalId => {
        const jadwalIdNum = parseInt(jadwalId);
        kehadiranDataWithFlags[jadwalIdNum] = {
          status: kehadiranData[jadwalIdNum].status,
          keterangan: (kehadiranData[jadwalIdNum].keterangan || '').trim(), // Trim whitespace
          ada_tugas: adaTugasData[jadwalIdNum] || false,
          diwakili: (kehadiranData[jadwalIdNum] as { diwakili?: boolean }).diwakili || false
        };
      });

      // Validasi data sebelum submit
      const validationErrors: string[] = [];
      Object.entries(kehadiranDataWithFlags).forEach(([jadwalId, data]) => {
        const { status, keterangan } = data;
        
        // Validasi: Status "Hadir" tidak boleh ada keterangan khusus
        if (status === 'Hadir' && keterangan && keterangan.trim() !== '') {
          validationErrors.push(`Jadwal ${jadwalId}: Status "Hadir" tidak boleh ada keterangan`);
        }
        
        // Validasi: Status selain "Hadir" harus ada keterangan
        if (status !== 'Hadir' && (!keterangan || keterangan.trim() === '')) {
          validationErrors.push(`Jadwal ${jadwalId}: Status "${status}" harus ada keterangan`);
        }
      });
      
      if (validationErrors.length > 0) {
        toast({
          title: "Data Tidak Valid",
          description: validationErrors.join(', '),
          variant: "destructive"
        });
        return;
      }

      const requestData = {
        siswa_id: siswaId,
        kehadiran_data: kehadiranDataWithFlags,
        tanggal_absen: selectedDate
      };
      
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

      await executeWithRetryRef.current(async () => {
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
          // Hitung jumlah keterangan yang tersimpan
          const keteranganCount = Object.keys(kehadiranData).filter(jadwalId => 
            kehadiranData[parseInt(jadwalId)]?.keterangan && 
            kehadiranData[parseInt(jadwalId)].keterangan.trim() !== ''
          ).length;

          toast({
            title: "Berhasil!",
            description: `Data kehadiran guru berhasil disimpan${keteranganCount > 0 ? ` dengan ${keteranganCount} keterangan` : ''}`
          });
          
          // Reload jadwal to get updated status
          loadJadwalHariIni();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
      });
    } catch (error) {
      console.error('Error submitting kehadiran:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data kehadiran guru",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
      setLoadingRef.current('submit', false);
    }
  }, [siswaId, kehadiranData, adaTugasData, selectedDate, isEditMode, loadJadwalHariIni, executeWithRetryRef, submitting]);

  // Submit banding kelas
  const submitBandingKelas = useCallback(async () => {
    console.log('[submitBandingKelas] Called with form:', formBandingKelas);
    if (submitting) {
      console.log('[submitBandingKelas] Already submitting, return');
      return;
    }

    // Validation
    if (!formBandingKelas.jadwal_id || !formBandingKelas.tanggal_absen) {
      toast({ title: "Error", description: "Pilih jadwal dan tanggal terlebih dahulu", variant: "destructive" });
      return;
    }

    if (!formBandingKelas.kelas_id) { // TAMBAHKAN validasi ini
      toast({ title: "Error", description: "Kelas ID tidak ditemukan", variant: "destructive" });
      return;
    }

    if (!formBandingKelas.siswa_banding.id || !formBandingKelas.siswa_banding.nama || !formBandingKelas.siswa_banding.alasan.trim()) {
      toast({ title: "Error", description: "Data siswa dan alasan wajib diisi", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const cleanToken = token ? token.replace(/['"]/g, '') : '';

      // Build single-student payload per backend contract
      const payload = {
        jadwal_id: parseInt(formBandingKelas.jadwal_id),
        tanggal_absen: formBandingKelas.tanggal_absen,
        kelas_id: formBandingKelas.kelas_id, // PASTIKAN field ini ada
        siswa_banding: {
          id: formBandingKelas.siswa_banding.id, // UBAH struktur sesuai backend
          nama: formBandingKelas.siswa_banding.nama,
          status_asli: formBandingKelas.siswa_banding.status_asli,
          status_diajukan: formBandingKelas.siswa_banding.status_diajukan,
          alasan: formBandingKelas.siswa_banding.alasan,
          bukti: formBandingKelas.siswa_banding.bukti || null
        }
      };

      const response = await fetch(`/api/siswa/${siswaId}/banding-absen-kelas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        toast({ title: "Berhasil", description: result.message || "Banding kelas berhasil diajukan" });
        
        // Reset form
        setFormBandingKelas({
          jadwal_id: '',
          tanggal_absen: '',
          kelas_id: '',
          siswa_banding: { id: '', nama: '', status_asli: 'alpa', status_diajukan: 'hadir', alasan: '', bukti: '' }
        });
        setShowFormBandingKelas(false);
        
        // Refresh data
        if (loadBandingAbsenRef.current) loadBandingAbsenRef.current();
        if (loadRiwayatDataRef.current) loadRiwayatDataRef.current();
      } else {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.error || "Gagal mengajukan banding", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error submitting banding kelas:', error);
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [formBandingKelas, submitting, siswaId]);

  const updateKehadiranStatus = useCallback((jadwalId: number, status: string) => {
    setKehadiranData(prev => ({
      ...prev,
      [jadwalId]: {
        ...prev[jadwalId],
        status: status,
        // Jangan hapus keterangan yang sudah ada, biarkan user memutuskan
        keterangan: prev[jadwalId]?.keterangan || ''
      }
    }));
  }, []);

  const updateKehadiranKeterangan = useCallback((jadwalId: number, keterangan: string) => {
    setKehadiranData(prev => ({
      ...prev,
      [jadwalId]: {
        ...prev[jadwalId],
        status: prev[jadwalId]?.status || 'Hadir', // Pastikan status ada
        keterangan: keterangan.trim() // Trim whitespace
      }
    }));
  }, []);

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      // Switching to edit mode, load today's schedule
      setSelectedDate(today);
    } else {
      // Switching back to normal mode, load today's schedule
      loadJadwalHariIni();
    }
  }, [isEditMode, today, loadJadwalHariIni]);

  // Handle date change
  const handleDateChange = useCallback((newDate: string) => {
    console.log('📅 handleDateChange called with:', newDate, 'isEditMode:', isEditMode);
    setSelectedDate(newDate);
    if (isEditMode) {
      console.log('📅 Calling loadJadwalByDate for edit mode');
      loadJadwalByDate(newDate);
    }
  }, [isEditMode, loadJadwalByDate]);

  // Load jadwal when entering edit mode or date changes
  useEffect(() => {
    if (isEditMode && selectedDate !== today) {
      loadJadwalByDate(selectedDate);
    }
  }, [isEditMode, selectedDate, today]);

  const getStatusBadgeColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'hadir': return 'bg-green-100 text-green-800';
      case 'tidak hadir': return 'bg-red-100 text-red-800';
      case 'izin': return 'bg-yellow-100 text-yellow-800';
      case 'sakit': return 'bg-blue-100 text-blue-800';
      case 'belum_diambil': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Smart array selection: prefer mode-specific array, fallback to the other
  const getActiveJadwalArray = useCallback(() => {
    if (isEditMode) {
      // In edit mode: prefer dated array, fallback to merged today if dated is empty
      return jadwalBerdasarkanTanggal.length > 0 ? jadwalBerdasarkanTanggal : mergedJadwal;
    } else {
      // In normal mode: use merged jadwal (reguler + khusus)
      return mergedJadwal.length > 0 ? mergedJadwal : jadwalBerdasarkanTanggal;
    }
  }, [isEditMode, jadwalBerdasarkanTanggal, mergedJadwal]);

  const renderKehadiranContent = () => {
    if (isLoading('jadwal')) {
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

    // Add debug logging
    console.log('🎯 Render decision:', {
      isEditMode,
      jadwalHariIniLength: jadwalHariIni.length,
      jadwalBerdasarkanTanggalLength: jadwalBerdasarkanTanggal.length,
      activeArrayLength: getActiveJadwalArray().length
    });

    if (jadwalHariIni.length === 0 && jadwalBerdasarkanTanggal.length === 0) {
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
                        setLoadingRef.current('submit', true);
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
                        setLoadingRef.current('submit', false);
                      }
                    }
                  }}
                  disabled={isLoading('submit')}
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
                      Edit Absen (30 Hari)
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
          <CardHeader className="min-w-0">
            <CardTitle className="flex items-center gap-2 min-w-0">
              <Calendar className="w-5 h-5" />
              <span className="truncate" title={isEditMode ? `Jadwal ${new Date(selectedDate).toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}` : 'Jadwal Hari Ini'}>
                {isEditMode ? `Jadwal ${new Date(selectedDate).toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}` : 'Jadwal Hari Ini'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading('jadwal') && isEditMode ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Memuat jadwal...</span>
                </div>
              ) : isEditMode && jadwalBerdasarkanTanggal.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Tidak ada jadwal untuk tanggal {selectedDate}</p>
                </div>
              ) : getActiveJadwalArray().map((jadwal, index) => {
                // Tentukan apakah ini jadwal khusus
                const isJadwalKhusus = jadwal.jenis_kegiatan !== undefined;
                const jenisKegiatan = jadwal.jenis_kegiatan;
                
                // Tentukan warna border dan badge berdasarkan jenis
                const borderColor = isJadwalKhusus 
                  ? (jenisKegiatan === 'istirahat' ? 'border-l-4 border-l-yellow-500' :
                     jenisKegiatan === 'upacara' ? 'border-l-4 border-l-red-500' :
                     jenisKegiatan === 'perwalian' ? 'border-l-4 border-l-purple-500' :
                     'border-l-4 border-l-blue-500')
                  : 'border-l-4 border-l-blue-500';
                
                const jenisBadgeColor = isJadwalKhusus
                  ? (jenisKegiatan === 'istirahat' ? 'bg-yellow-100 text-yellow-800' :
                     jenisKegiatan === 'upacara' ? 'bg-red-100 text-red-800' :
                     jenisKegiatan === 'perwalian' ? 'bg-purple-100 text-purple-800' :
                     'bg-blue-100 text-blue-800')
                  : 'bg-blue-100 text-blue-800';
                
                return (
                <div key={jadwal.id_jadwal} className={`border rounded-lg p-4 ${borderColor}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {!isJadwalKhusus && <Badge variant="outline">Jam ke-{jadwal.jam_ke}</Badge>}
                        {isJadwalKhusus && (
                          <Badge className={jenisBadgeColor}>
                            {jenisKegiatan === 'istirahat' ? '☕ Istirahat' :
                             jenisKegiatan === 'upacara' ? '🎌 Upacara' :
                             jenisKegiatan === 'perwalian' ? '👥 Perwalian' :
                             jenisKegiatan}
                          </Badge>
                        )}
                        <Badge variant="outline">{jadwal.jam_mulai} - {jadwal.jam_selesai}</Badge>
                        <Badge className={getStatusBadgeColor(kehadiranData[jadwal.id_jadwal]?.status || jadwal.status_kehadiran || 'belum_diambil')}>
                          {(() => {
                            const status = kehadiranData[jadwal.id_jadwal]?.status || jadwal.status_kehadiran || 'belum_diambil';
                            switch (status.toLowerCase()) {
                              case 'hadir': return 'Hadir';
                              case 'tidak hadir': return 'Tidak Hadir';
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
                      <h4 className="font-semibold text-lg text-gray-900 break-words">{jadwal.nama_mapel}</h4>
                      <p className="text-gray-600 break-words">{jadwal.nama_guru}</p>
                      {!isJadwalKhusus && <p className="text-sm text-gray-500">NIP: {jadwal.nip}</p>}
                      {isJadwalKhusus && jadwal.keterangan && (
                        <p className="text-sm text-gray-500 mt-2 italic">{jadwal.keterangan}</p>
                      )}
                    </div>
                  </div>

                  {/* Form absensi guru - hanya untuk jadwal reguler, upacara, dan perwalian (TIDAK untuk istirahat) */}
                  {(!isJadwalKhusus || (jenisKegiatan !== 'istirahat')) && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Status Kehadiran Guru:
                      </Label>
                      <RadioGroup 
                        value={kehadiranData[jadwal.id_jadwal]?.status || 'Hadir'} 
                        onValueChange={(value) => updateKehadiranStatus(jadwal.id_jadwal, value)}
                        disabled={false}
                      >
                        <div className="flex flex-wrap gap-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Hadir" id={`hadir-${jadwal.id_jadwal}`} />
                            <Label htmlFor={`hadir-${jadwal.id_jadwal}`} className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              Hadir
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Tidak Hadir" id={`tidak_hadir-${jadwal.id_jadwal}`} />
                            <Label htmlFor={`tidak_hadir-${jadwal.id_jadwal}`} className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-600" />
                              Tidak Hadir
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Izin" id={`izin-${jadwal.id_jadwal}`} />
                            <Label htmlFor={`izin-${jadwal.id_jadwal}`} className="flex items-center gap-2">
                              <User className="w-4 h-4 text-yellow-600" />
                              Izin
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Sakit" id={`sakit-${jadwal.id_jadwal}`} />
                            <Label htmlFor={`sakit-${jadwal.id_jadwal}`} className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                              Sakit
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Opsi Ada Tugas */}
                    {(kehadiranData[jadwal.id_jadwal]?.status === 'Tidak Hadir' || 
                      kehadiranData[jadwal.id_jadwal]?.status === 'Izin' || 
                      kehadiranData[jadwal.id_jadwal]?.status === 'Sakit') && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`ada-tugas-${jadwal.id_jadwal}`}
                            checked={adaTugasData[jadwal.id_jadwal] || false}
                            onChange={(e) => {
                              setAdaTugasData(prev => ({ ...prev, [jadwal.id_jadwal]: e.target.checked }));
                              // If ada tugas is checked, also set diwakili flag
                              if (e.target.checked) {
                                setKehadiranData(prev => ({
                                  ...prev,
                                  [jadwal.id_jadwal]: {
                                    ...prev[jadwal.id_jadwal],
                                    diwakili: true
                                  }
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor={`ada-tugas-${jadwal.id_jadwal}`} className="text-sm text-blue-600">
                            Ada Tugas
                          </Label>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor={`keterangan-${jadwal.id_jadwal}`} className="text-sm font-medium text-gray-700">
                        Keterangan:
                        <span className="text-gray-500 text-xs ml-1">(Opsional - dapat diisi untuk semua status)</span>
                      </Label>
                      <Textarea
                        id={`keterangan-${jadwal.id_jadwal}`}
                        placeholder="Masukkan keterangan jika diperlukan..."
                        value={kehadiranData[jadwal.id_jadwal]?.keterangan || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 500) {
                            updateKehadiranKeterangan(jadwal.id_jadwal, value);
                          }
                        }}
                        disabled={false}
                        className="mt-1"
                        rows={3}
                        maxLength={500}
                        onFocus={() => {
                          console.log(`🔍 Textarea focused for jadwal ${jadwal.id_jadwal}:`, {
                            currentValue: kehadiranData[jadwal.id_jadwal]?.keterangan,
                            kehadiranData: kehadiranData[jadwal.id_jadwal],
                            allKehadiranData: kehadiranData
                          });
                          
                          // Special debug for Kimia jadwal
                          if (jadwal.id_jadwal === 1125) {
                            console.log(`🔍 SPECIAL TEXTAREA DEBUG - Kimia (1125):`, {
                              jadwalId: jadwal.id_jadwal,
                              namaMapel: jadwal.nama_mapel,
                              currentValue: kehadiranData[jadwal.id_jadwal]?.keterangan,
                              kehadiranDataForJadwal: kehadiranData[jadwal.id_jadwal],
                              hasKeterangan: !!(kehadiranData[jadwal.id_jadwal]?.keterangan),
                              keteranganLength: kehadiranData[jadwal.id_jadwal]?.keterangan?.length,
                              allKehadiranKeys: Object.keys(kehadiranData)
                            });
                          }
                        }}
                      />
                      {/* Tampilkan karakter yang tersisa */}
                      <div className={`mt-1 text-xs ${
                        (kehadiranData[jadwal.id_jadwal]?.keterangan?.length || 0) > 450 
                          ? 'text-red-500' 
                          : 'text-gray-500'
                      }`}>
                        {kehadiranData[jadwal.id_jadwal]?.keterangan?.length || 0} / 500 karakter
                      </div>
                      {/* Tampilkan keterangan yang sudah tersimpan jika ada */}
                    </div>
                  </div>
                  )}
                  {/* Akhir conditional form absensi */}
                </div>
              );
              })}
            </div>

            <div className="mt-6 pt-6 border-t">
              {isEditMode && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 text-yellow-600 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Perhatian!</p>
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

              {/* Ringkasan Keterangan yang Sudah Tersimpan */}
              {Object.keys(kehadiranData).some(jadwalId => 
                kehadiranData[parseInt(jadwalId)]?.keterangan && 
                kehadiranData[parseInt(jadwalId)].keterangan.trim() !== ''
              ) && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Keterangan yang Sudah Tersimpan ({Object.keys(kehadiranData).filter(jadwalId => 
                      kehadiranData[parseInt(jadwalId)]?.keterangan && 
                      kehadiranData[parseInt(jadwalId)].keterangan.trim() !== ''
                    ).length} item)
                  </h4>
                  <div className="space-y-2">
                    {getActiveJadwalArray().map((jadwal) => {
                      const keterangan = kehadiranData[jadwal.id_jadwal]?.keterangan;
                      const status = kehadiranData[jadwal.id_jadwal]?.status || jadwal.status_kehadiran || 'belum_diambil';
                      if (!keterangan || keterangan.trim() === '') return null;
                      
                      return (
                        <div key={jadwal.id_jadwal} className="flex items-start gap-3 p-3 bg-white rounded border shadow-sm">
                          <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900">{jadwal.nama_mapel}</p>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                status === 'Hadir' ? 'bg-green-100 text-green-800' :
                                status === 'Izin' ? 'bg-yellow-100 text-yellow-800' :
                                status === 'Sakit' ? 'bg-red-100 text-red-800' :
                                status === 'Tidak Hadir' ? 'bg-gray-100 text-gray-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{jadwal.jam_mulai} - {jadwal.jam_selesai}</p>
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-green-400">{keterangan}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={submitKehadiran} 
                disabled={isLoading('submit') || submitting} 
                className={`w-full ${isEditMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {(isLoading('submit') || submitting) ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menyimpan...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-blue-800 font-medium truncate">Riwayat Kehadiran Kelas</p>
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
              <div className="overflow-x-auto -mx-4 lg:mx-0">
              <Table className="min-w-[840px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Jam Ke</TableHead>
                    <TableHead className="whitespace-nowrap">Waktu</TableHead>
                    <TableHead className="whitespace-nowrap">Mata Pelajaran</TableHead>
                    <TableHead className="whitespace-nowrap">Guru</TableHead>
                    <TableHead className="whitespace-nowrap">Total Hadir</TableHead>
                    <TableHead className="whitespace-nowrap">Tidak Hadir</TableHead>
                    <TableHead className="whitespace-nowrap">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hari.jadwal.map((jadwal, jadwalIndex) => (
                    <TableRow key={jadwalIndex}>
                      <TableCell>
                        <Badge variant="outline">Jam ke-{jadwal.jam_ke}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm whitespace-nowrap">{jadwal.jam_mulai} - {jadwal.jam_selesai}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium block max-w-[180px] truncate" title={jadwal.nama_mapel}>{jadwal.nama_mapel}</span>
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-[160px] truncate" title={jadwal.nama_guru}>{jadwal.nama_guru}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">
                            {jadwal.total_hadir}/{jadwal.total_siswa}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
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
                          {jadwal.total_tidak_hadir && jadwal.total_tidak_hadir > 0 && (
                            <Badge className="bg-gray-100 text-gray-800 text-xs">
                              Tidak Hadir: {jadwal.total_tidak_hadir}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Detail Kehadiran - Jam ke-{detailRiwayat.jam_ke}</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setDetailRiwayat(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {detailRiwayat.nama_mapel} ({detailRiwayat.jam_mulai} - {detailRiwayat.jam_selesai})
                </p>
                <p className="text-sm text-gray-600">Guru: {detailRiwayat.nama_guru}</p>
              </div>

              {detailRiwayat.siswa_tidak_hadir && Array.isArray(detailRiwayat.siswa_tidak_hadir) && detailRiwayat.siswa_tidak_hadir.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Siswa Tidak Hadir:</h4>
                  {detailRiwayat.siswa_tidak_hadir.map((siswa, idx) => {
                    const namaSiswa = siswa.nama_siswa || 'Nama tidak tersedia';
                    const nisSiswa = siswa.nis || 'NIS tidak tersedia';
                    const statusSiswa = siswa.status || 'Status tidak tersedia';
                    
                    return (
                      <div key={`${nisSiswa}-${idx}`} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {namaSiswa}
                            </p>
                            <p className="text-sm text-gray-600">
                              NIS: {nisSiswa}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              statusSiswa === 'izin' ? 'secondary' :
                              statusSiswa === 'sakit' ? 'outline' : 'destructive'
                            }
                            className="capitalize"
                          >
                            {statusSiswa}
                          </Badge>
                        </div>
                        {siswa.keterangan && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Keterangan:</strong> {siswa.keterangan}
                          </p>
                        )}
                        {siswa.nama_pencatat && (
                          <p className="text-xs text-gray-500 mt-1">
                            Dicatat oleh: {siswa.nama_pencatat}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <p className="text-green-600 font-medium">Semua siswa hadir</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };


  // Render Banding Absen Content
  // Render Banding Absen Content untuk Kelas
  const renderBandingAbsenContent = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">Pengajuan Banding Kelas</h2>
            <p className="text-gray-600">Ajukan banding absensi untuk teman sekelas</p>
          </div>
          {/* Button Ajukan Banding Absen (personal) - REMOVED */}
          {/* <Button
            onClick={() => setShowFormBanding(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Ajukan Banding Absen
          </Button> */}
          <Button
            onClick={() => setShowFormBandingKelas(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Users className="w-4 h-4 mr-2" />
            Ajukan Banding Kelas
          </Button>
        </div>

        {/* Form Pengajuan Banding Absen (Single Student) - REMOVED */}

        {/* Form Pengajuan Banding Kelas */}
        {showFormBandingKelas && (
          <Card>
            <CardHeader>
              <CardTitle>Form Pengajuan Banding Kelas</CardTitle>
              <p className="text-sm text-gray-600">Ajukan banding absensi untuk teman sekelas</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tanggal_banding_kelas">Tanggal Absen *</Label>
                  <input
                    id="tanggal_banding_kelas"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formBandingKelas.tanggal_absen}
                    onChange={(e) => {
                      const tanggal = e.target.value;
                      setFormBandingKelas({
                        jadwal_id: '',
                        tanggal_absen: tanggal,
                        kelas_id: '', // tambahkan field ini
                        siswa_banding: { id: '', nama: '', status_asli: 'alpa', status_diajukan: 'hadir', alasan: '', bukti: '' }
                      });
                      setAttendanceRecords([]); // Reset attendance records
                      if (tanggal) {
                        loadJadwalByDate(tanggal); // UNCOMMENT DAN PANGGIL FUNGSI INI
                      } else {
                        setJadwalBerdasarkanTanggal([]);
                      }
                    }}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Pilih tanggal absen terlebih dahulu untuk melihat jadwal pelajaran</p>
                </div>
                
                <div>
                  <Label htmlFor="jadwal_banding_kelas">Jadwal Pelajaran *</Label>
                  <select 
                    id="jadwal_banding_kelas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formBandingKelas.jadwal_id}
                    onChange={(e) => {
                      const jadwalId = e.target.value;
                      const selectedJadwal = jadwalBerdasarkanTanggal.find(j => j.id_jadwal === parseInt(jadwalId));
                      setFormBandingKelas({
                        ...formBandingKelas, 
                        jadwal_id: jadwalId,
                        kelas_id: (selectedJadwal as JadwalHariIni & { kelas_id?: number })?.kelas_id?.toString() || '' // TAMBAHKAN ini
                      });
                      // Load attendance records when jadwal is selected
                      if (jadwalId && formBandingKelas.tanggal_absen) {
                        loadAttendanceRecords(parseInt(jadwalId), formBandingKelas.tanggal_absen);
                      }
                    }}
                    disabled={!formBandingKelas.tanggal_absen || isLoading('jadwal')}
                    required
                  >
                    <option value="">
                      {!formBandingKelas.tanggal_absen 
                        ? "Pilih tanggal absen terlebih dahulu..." 
                        : isLoading('jadwal') 
                          ? "Memuat jadwal..." 
                          : "Pilih jadwal pelajaran..."
                      }
                    </option>
                    {jadwalBerdasarkanTanggal && jadwalBerdasarkanTanggal.length > 0 ? jadwalBerdasarkanTanggal.map(j => (
                      <option key={j.id_jadwal} value={j.id_jadwal}>
                        {j.nama_mapel} ({j.jam_mulai}-{j.jam_selesai}) - {j.nama_guru}
                      </option>
                    )) : formBandingKelas.tanggal_absen && !isLoading('jadwal') ? (
                      <option value="" disabled>Tidak ada jadwal untuk tanggal ini</option>
                    ) : null}
                  </select>
                </div>
              </div>

              {/* Form Siswa untuk Banding Kelas (Single Student) */}
              {formBandingKelas.jadwal_id && (
                <div className="border-t pt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Data Siswa untuk Banding</h3>
                    
                    <div className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                          <Label htmlFor="banding_siswa_nama">Nama Siswa *</Label>
                            <select
                            id="banding_siswa_nama"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={formBandingKelas.siswa_banding.id} // UBAH ke id
                              onChange={(e) => {
                              const siswaId = parseInt(e.target.value);
                              const selectedSiswa = daftarSiswa.find(s => s.id === siswaId);
                              const attendanceRecord = attendanceRecords.find(r => r.siswa_id === siswaId);
                              
                              setFormBandingKelas({
                                ...formBandingKelas,
                                siswa_banding: {
                                  ...formBandingKelas.siswa_banding,
                                  id: siswaId, // UBAH ke id
                                  nama: selectedSiswa?.nama || '',
                                  status_asli: (attendanceRecord?.status as 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen') || 'alpa'
                                }
                              });
                              }}
                              required
                            >
                              <option value="">Pilih siswa...</option>
                              {daftarSiswa.map((s) => {
                                const attendanceRecord = attendanceRecords.find(r => r.siswa_id === s.id);
                                return (
                                <option key={s.id} value={s.id}> {/* UBAH ke s.id */}
                                  {s.nama} {attendanceRecord?.has_attendance ? `(${attendanceRecord.status})` : '(Belum Absen)'}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                            <div>
                          <Label htmlFor="banding_siswa_status_asli">Status Asli</Label>
                          <input
                            id="banding_siswa_status_asli"
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            value={formBandingKelas.siswa_banding.status_asli}
                            readOnly
                          />
                        </div>
                            </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                          <Label htmlFor="banding_siswa_status_diajukan">Status Diajukan *</Label>
                              <select
                            id="banding_siswa_status_diajukan"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={formBandingKelas.siswa_banding.status_diajukan}
                                onChange={(e) => {
                              setFormBandingKelas({
                                ...formBandingKelas,
                                siswa_banding: {
                                  ...formBandingKelas.siswa_banding,
                                  status_diajukan: e.target.value as 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen'
                                }
                              });
                                }}
                                required
                              >
                                <option value="hadir">Hadir</option>
                                <option value="izin">Izin</option>
                                <option value="sakit">Sakit</option>
                                <option value="alpa">Alpa</option>
                            <option value="dispen">Dispensasi</option>
                              </select>
                          </div>
                        </div>

                        <div>
                        <Label htmlFor="banding_siswa_alasan">Alasan Banding *</Label>
                          <textarea
                          id="banding_siswa_alasan"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                          value={formBandingKelas.siswa_banding.alasan}
                            onChange={(e) => {
                            setFormBandingKelas({
                              ...formBandingKelas,
                              siswa_banding: {
                                ...formBandingKelas.siswa_banding,
                                alasan: e.target.value
                              }
                            });
                            }}
                            placeholder="Jelaskan alasan mengapa status absen perlu diubah..."
                            required
                          />
                        </div>
                        </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={submitBandingKelas}
                  disabled={!formBandingKelas.jadwal_id || !formBandingKelas.tanggal_absen || !formBandingKelas.siswa_banding.nama || submitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Kirim Banding Kelas
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowFormBandingKelas(false);
                    setFormBandingKelas({
                      jadwal_id: '',
                      tanggal_absen: '',
                      kelas_id: '',
                      siswa_banding: { id: '', nama: '', status_asli: 'alpa', status_diajukan: 'hadir', alasan: '', bukti: '' }
                    });
                  }}
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal Pengajuan</TableHead>
                      <TableHead>Tanggal Absen</TableHead>
                      <TableHead>Jadwal</TableHead>
                      <TableHead>Detail Siswa & Alasan</TableHead>
                      <TableHead>Status Banding</TableHead>
                      <TableHead>Respon Guru</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bandingAbsen
                      .slice((bandingAbsenPage - 1) * itemsPerPage, bandingAbsenPage * itemsPerPage)
                      .map((banding) => (
                      <React.Fragment key={banding.id_banding}>
                        <TableRow className="hover:bg-gray-50">
                        <TableCell>
                            <div className="text-sm font-medium">
                          {new Date(banding.tanggal_pengajuan).toLocaleDateString('id-ID')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(banding.tanggal_pengajuan).toLocaleTimeString('id-ID', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm font-medium">
                          {new Date(banding.tanggal_absen).toLocaleDateString('id-ID')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {banding.jam_mulai}-{banding.jam_selesai}
                          </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-sm">{banding.nama_mapel}</div>
                              <div className="text-xs text-gray-600">
                                {banding.nama_guru}
                              </div>
                              <div className="text-xs text-gray-500">
                                {banding.nama_kelas}
                                  </div>
                                  </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                  {banding.siswa_banding && banding.siswa_banding.length > 0 
                                    ? `${banding.total_siswa_banding || banding.siswa_banding.length} siswa`
                                    : '1 siswa'
                                  }
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedBanding(
                                    expandedBanding === banding.id_banding ? null : banding.id_banding
                                  )}
                                  className="h-6 w-6 p-0"
                                >
                                  {expandedBanding === banding.id_banding ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                {banding.siswa_banding && banding.siswa_banding.length > 0 ? (
                                  banding.siswa_banding.slice(0, 2).map((s, idx) => (
                                    <div key={`${s.nama}-${idx}`} className="flex items-center gap-2">
                                      <span className="font-medium">{s.nama}</span>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs px-1 py-0"
                                      >
                                        {s.status_asli} → {s.status_diajukan}
                                      </Badge>
                            </div>
                                  ))
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Siswa Individual</span>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs px-1 py-0"
                                    >
                                {banding.status_asli} → {banding.status_diajukan}
                              </Badge>
                            </div>
                          )}
                                {banding.siswa_banding && banding.siswa_banding.length > 2 && (
                                  <div className="text-orange-600 text-xs">
                                    +{banding.siswa_banding.length - 2} siswa lainnya
                                  </div>
                                )}
                              </div>
                            </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                              banding.status_banding === 'disetujui' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                              banding.status_banding === 'ditolak' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                              'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }>
                            {banding.status_banding === 'disetujui' ? 'Disetujui' :
                             banding.status_banding === 'ditolak' ? 'Ditolak' : 'Menunggu'}
                          </Badge>
                            {banding.tanggal_keputusan && (
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(banding.tanggal_keputusan).toLocaleDateString('id-ID')}
                              </div>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="max-w-xs">
                              {banding.catatan_guru ? (
                                <div className="text-sm bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                                  <div className="font-medium text-gray-700 mb-1">Respon Guru:</div>
                                  <div className="text-gray-600 break-words">{banding.catatan_guru}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">Belum ada respon</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedBanding(
                                expandedBanding === banding.id_banding ? null : banding.id_banding
                              )}
                              className="text-xs"
                            >
                              {expandedBanding === banding.id_banding ? 'Tutup Detail' : 'Lihat Detail'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded Detail Row */}
                        {expandedBanding === banding.id_banding && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-gray-50 p-0">
                              <div className="p-4">
                                <div className="bg-white rounded-lg border p-4">
                                  <h4 className="font-semibold text-gray-800 mb-3">Detail Siswa Banding</h4>
                                  
                                  {banding.siswa_banding && banding.siswa_banding.length > 0 ? (
                                    <div className="space-y-3">
                                      {banding.siswa_banding.map((s, idx) => (
                                        <div key={`${s.nama}-${idx}`} className="border rounded-lg p-3">
                                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <div>
                                              <div className="text-sm font-medium text-gray-600 mb-1">Nama Siswa</div>
                                              <div className="text-sm text-gray-800">{s.nama}</div>
                                            </div>
                                            <div>
                                              <div className="text-sm font-medium text-gray-600 mb-1">Status Tercatat</div>
                                              <div className="text-sm text-gray-800 capitalize">{s.status_asli}</div>
                                            </div>
                                            <div>
                                              <div className="text-sm font-medium text-gray-600 mb-1">Status Diajukan</div>
                                              <div className="text-sm text-gray-800 capitalize">{s.status_diajukan}</div>
                                            </div>
                                            <div>
                                              <div className="text-sm font-medium text-gray-600 mb-1">Alasan</div>
                                              <div className="text-sm text-gray-800">{s.alasan_banding}</div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="border rounded-lg p-3">
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div>
                                          <div className="text-sm font-medium text-gray-600 mb-1">Nama Siswa</div>
                                          <div className="text-sm text-gray-800">Siswa Individual</div>
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-600 mb-1">Status Tercatat</div>
                                          <div className="text-sm text-gray-800 capitalize">{banding.status_asli}</div>
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-600 mb-1">Status Diajukan</div>
                                          <div className="text-sm text-gray-800 capitalize">{banding.status_diajukan}</div>
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-600 mb-1">Alasan</div>
                                          <div className="text-sm text-gray-800">{banding.alasan_banding}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
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
            )}
          </CardContent>
        </Card>
      </div>
    );
  };


  // Submit Banding Absen (personal) - REMOVED
  // const submitBandingAbsen = async (e: React.FormEvent) => {
  //   e.preventDefault();
    
  //   // Cek apakah sedang dalam proses submit
  //   if (submitting) {
  //     console.log('⚠️ Submit banding absen sedang diproses, mencegah multiple submission');
  //     return;
  //   }
    
  //   // Validasi form
  //   if (!formBanding.jadwal_id || !formBanding.tanggal_absen || !formBanding.status_asli || !formBanding.status_diajukan || !formBanding.alasan_banding) {
  //     toast({
  //       title: "Error",
  //       description: "Semua field wajib diisi",
  //       variant: "destructive"
  //     });
  //     return;
  //   }

  //   setSubmitting(true);
  //   try {
  //     // Get and clean token from localStorage
  //     const rawToken = localStorage.getItem('token');
  //     const cleanToken = rawToken ? rawToken.trim() : '';
      
  //     if (!cleanToken) {
  //       toast({
  //         title: "Error",
  //         description: "Token tidak ditemukan. Silakan login ulang.",
  //         variant: "destructive"
  //       });
  //       return;
  //     }
      
  //     const requestData = {
  //       jadwal_id: parseInt(formBanding.jadwal_id),
  //       tanggal_absen: formBanding.tanggal_absen,
  //       status_asli: formBanding.status_asli,
  //       status_diajukan: formBanding.status_diajukan,
  //       alasan_banding: formBanding.alasan_banding
  //     };

  //     const response = await fetch(`/api/siswa/${siswaId}/banding-absen`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${cleanToken}`
  //       },
  //       credentials: 'include',
  //       body: JSON.stringify(requestData)
  //     });

  //     if (response.ok) {
  //       toast({
  //         title: "Berhasil",
  //         description: "Pengajuan banding absen berhasil dikirim"
  //       });
        
  //     } else {
  //       const errorData = await response.json();
  //       console.error('❌ Error submitting banding absen:', errorData);
  //       toast({
  //         title: "Error",
  //         description: errorData.error || "Gagal mengirim pengajuan banding absen",
  //         variant: "destructive"
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error submitting banding absen:', error);
  //     toast({
  //       title: "Error",
  //       description: "Terjadi kesalahan jaringan",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setSubmitting(false);
  //   }

  // Show loading or error states
  if (isLoading('initial')) {
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
                  setLoadingRef.current('initial', true);
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
    <ErrorBoundary
      beforeCapture={(scope, error, errorInfo) => {
        // Log error to external service in production
        if (process.env.NODE_ENV === 'production') {
          // Here you would typically send to error reporting service
          console.error('StudentDashboard Error:', error, errorInfo);
        }
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 bg-white shadow-xl transition-transform duration-300 z-40 w-64 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:w-64`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`flex items-center space-x-3`}>
            <div className="p-2 rounded-lg">
              <img src="/logo.png" alt="ABSENTA Logo" className="h-12 w-12" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent hidden lg:block">
              ABSENTA
            </span>
            {sidebarOpen && (
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent block lg:hidden">
                ABSENTA
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <Button
            variant={activeTab === 'kehadiran' ? "default" : "ghost"}
            className={`w-full justify-start`}
            onClick={() => {setActiveTab('kehadiran'); setSidebarOpen(false);}}
          >
            <Clock className="h-4 w-4" />
            <span className="ml-2">Menu Kehadiran</span>
          </Button>
          <Button
            variant={activeTab === 'riwayat' ? "default" : "ghost"}
            className={`w-full justify-start`}
            onClick={() => {setActiveTab('riwayat'); setSidebarOpen(false);}}
          >
            <Calendar className="h-4 w-4" />
            <span className="ml-2">Riwayat</span>
          </Button>
          <Button
            variant={activeTab === 'banding-absen' ? "default" : "ghost"}
            className={`w-full justify-start`}
            onClick={() => {setActiveTab('banding-absen'); setSidebarOpen(false);}}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="ml-2">Banding Absen Kelas</span>
          </Button>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          {/* Font Size Control - Above Profile */}
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <div className="mb-4">
              <FontSizeControl variant="compact" />
            </div>
          )}
          
          <div className={`flex items-center space-x-3 mb-3`}>
            <div className="bg-emerald-100 p-2 rounded-full">
              <Settings className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{currentUserData.nama}</p>
              <p className="text-xs text-gray-500">Siswa Perwakilan</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={() => setShowEditProfile(true)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Settings className="h-4 w-4" />
              <span className="ml-2">Edit Profil</span>
            </Button>
            
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Keluar</span>
            </Button>
          </div>
        </div>
      </div>
 
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64">
        <div className="p-4 lg:p-6">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Dashboard Siswa</h1>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center mb-8 min-w-0">
            <div className="min-w-0">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent truncate">
                Dashboard Siswa
              </h1>
              <p className="text-gray-600 mt-2 truncate">Selamat datang, {currentUserData.nama}!</p>
              {kelasInfo && (
                <p className="text-sm text-gray-500 truncate">Perwakilan Kelas {kelasInfo}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
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
          {activeTab === 'banding-absen' && renderBandingAbsenContent()}
        </div>
      </div>
      
      {/* Floating Font Size Control for Mobile */}
      <FontSizeControl variant="floating" className="lg:hidden" />
      
      {/* Edit Profile Modal */}
      {showEditProfile && (
        <>
          {console.log('🔍 StudentDashboard: Opening EditProfile with currentUserData:', currentUserData)}
          <EditProfile
            userData={currentUserData}
            onUpdate={handleUpdateProfile}
            onClose={() => setShowEditProfile(false)}
            role="siswa"
          />
        </>
      )}
      </div>
    </ErrorBoundary>
  );
};

// Export with ErrorBoundary wrapper
export const StudentDashboard = ({ userData, onLogout }: StudentDashboardProps) => {
  return (
    <ErrorBoundary
      beforeCapture={(scope, error, errorInfo) => {
        console.error('StudentDashboard Error:', error, errorInfo);
        // You can add error reporting service here
      }}
    >
      <StudentDashboardComponent userData={userData} onLogout={onLogout} />
    </ErrorBoundary>
  );
};
