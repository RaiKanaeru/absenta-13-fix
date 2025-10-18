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

interface StudentDashboardProps {
  userData: {
    id: number;
    username: string;
    nama: string;
    role: string;
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
  const [kelasInfo, setKelasInfo] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
  const [showFormIzinKelas, setShowFormIzinKelas] = useState(false);
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

  const [formIzinKelas, setFormIzinKelas] = useState({
    jadwal_id: '',
    tanggal_izin: '',
    siswa_izin: [] as Array<{
      id?: number;
      nama: string;
      jenis_izin: 'sakit' | 'izin' | 'alpa' | 'dispen';
      alasan: string;
    }>
  });

  // State untuk form banding absen kelas
  const [formBandingKelas, setFormBandingKelas] = useState({
    jadwal_id: '',
    tanggal_absen: '',
    siswa_banding: [] as Array<{
      id?: number;
      nama: string;
      status_asli: 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen';
      status_diajukan: 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen';
      alasan_banding: string;
    }>
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

  // Memoized total pages
  const totalPengajuanPages = useMemo(() => 
    Math.ceil(pengajuanIzin.length / itemsPerPage), [pengajuanIzin.length, itemsPerPage]
  );

  const totalBandingPages = useMemo(() => 
    Math.ceil(bandingAbsen.length / itemsPerPage), [bandingAbsen.length, itemsPerPage]
  );

  const totalRiwayatPages = useMemo(() => 
    Math.ceil(riwayatData.length / riwayatItemsPerPage), [riwayatData.length, riwayatItemsPerPage]
  );

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

  // Memoized pagination handlers
  const handlePengajuanPageChange = useCallback((page: number) => {
    setPengajuanIzinPage(page);
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
    
    const getSiswaInfo = async () => {
      try {
        setLoadingRef.current('initial', true);
        setError(null);
        
        const result = await apiCall('/api/siswa-perwakilan/info', {
          method: 'GET',
          signal: abortController.signal
        });
        
        if (result.success) {
          // The API returns data directly, not wrapped in a data property
          const siswaData = result.data || result;
          
          if (siswaData) {
          // Batch state updates to prevent multiple re-renders
            setSiswaId(siswaData.id_siswa);
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
                  username: siswaData.username,
                  nama: siswaData.nama,
                  role: siswaData.role
              };
            }
            return prevData;
          });
          }
        } else {
          let errorMessage = result.message || 'Gagal memuat informasi siswa';
          
          if (result.error === 'Unauthorized') {
            errorMessage = 'Sesi login Anda telah berakhir. Silakan login kembali.';
            // Redirect to login after showing error
            setTimeout(() => {
              onLogout();
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
        if (error.name === 'AbortError') {
          return; // Request was cancelled, don't show error
        }
        
        console.error('StudentDashboard: Network error getting siswa info:', error);
        
        let errorMessage = 'Koneksi bermasalah. ';
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMessage += 'Tidak dapat terhubung ke server. Pastikan server backend sedang berjalan di ';
        } else {
          errorMessage += 'Silakan periksa koneksi internet Anda dan coba lagi.';
        }
        
        setError(errorMessage);
      } finally {
        setLoadingRef.current('initial', false);
      }
    };

    getSiswaInfo();
    
    return () => {
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
        const data = await apiCall(`/api/siswa/${siswaId}/jadwal-hari-ini`, {
          signal: request.signal
        });

          setJadwalHariIni(data);
          console.log('📊 Raw data from API (normal mode):', data);
          
          // Initialize kehadiran data
          const initialKehadiran: KehadiranData = {};
          data.forEach((jadwal: JadwalHariIni) => {
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

  // Load jadwal berdasarkan tanggal yang dipilih
  const loadJadwalByDate = useCallback(async (tanggal: string) => {
    if (!siswaId || isLoading('jadwal')) return;

    setLoadingRef.current('jadwal', true);
    try {
      const token = localStorage.getItem('token');
      const cleanToken = token ? token.replace(/['"]/g, '') : '';
      
      // Add cache busting and retry logic
      const timestamp = Date.now();
      const url = `/api/siswa/${siswaId}/jadwal-rentang?tanggal=${tanggal}&t=${timestamp}`;
      
      console.log(`🔄 Loading jadwal for siswa ${siswaId} on ${tanggal}...`);
      
      const result = await apiCall(url, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });

      console.log(`📊 Jadwal rentang response:`, result);

      if (result && result.success) {
        console.log('✅ Jadwal rentang loaded successfully');
        console.log('📊 Raw data from API:', result.data);
        
        if (result.success && result.data) {
          setJadwalBerdasarkanTanggal(result.data);
          
          // Initialize kehadiranData for edit mode
          const initialKehadiran: KehadiranData = {};
          result.data.forEach((jadwal: JadwalHariIni) => {
            console.log(`🔍 Processing jadwal ${jadwal.id_jadwal} (edit mode):`, {
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
            
            // Debug logging khusus untuk jadwal Kimia (id 1125) - edit mode
            if (jadwal.id_jadwal === 1125) {
              console.log(`🔍 SPECIAL DEBUG - Jadwal Kimia (1125) EDIT MODE:`, {
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
          
          console.log('📊 Initialized kehadiranData for edit mode:', initialKehadiran);
          setKehadiranData(initialKehadiran);
        } else {
          setJadwalBerdasarkanTanggal([]);
          setKehadiranData({});
        }
      } else {
        toast({
          title: "Error memuat jadwal",
          description: result?.error || 'Failed to load schedule',
          variant: "destructive"
        });
        setJadwalBerdasarkanTanggal([]);
        setKehadiranData({});
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
  }, [siswaId, isLoading]);

  // loadJadwalBandingByDate - REMOVED (tidak digunakan lagi)
  // const loadJadwalBandingByDate = useCallback(async (tanggal: string) => {
  //   if (!siswaId || isLoading('jadwal')) return;

  //   setLoadingRef.current('jadwal', true);
  //   try {
  //     const token = localStorage.getItem('token');
  //     const cleanToken = token ? token.replace(/['"]/g, '') : '';
      
  //     const response = await fetch(`/api/siswa/${siswaId}/jadwal-rentang?tanggal=${tanggal}`, {
  //       headers: {
  //         'Authorization': `Bearer ${cleanToken}`
  //       },
  //       credentials: 'include'
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
        
  //       if (result.success && result.data) {
  //         setJadwalBerdasarkanTanggal(result.data);
          
  //         // Initialize kehadiranData for banding mode
  //         const initialKehadiran: KehadiranData = {};
  //         result.data.forEach((jadwal: JadwalHariIni) => {
  //           if (jadwal.status_kehadiran && jadwal.status_kehadiran !== 'belum_diambil') {
  //             initialKehadiran[jadwal.id_jadwal] = {
  //               status: jadwal.status_kehadiran,
  //               keterangan: jadwal.keterangan || ''
  //             };
  //           } else {
  //             // Default to 'Hadir' for new entries, but allow user to change
  //             initialKehadiran[jadwal.id_jadwal] = {
  //               status: 'Hadir',
  //               keterangan: ''
  //             };
  //           }
  //         });
  //         setKehadiranData(initialKehadiran);
  //       } else {
  //         setJadwalBerdasarkanTanggal([]);
  //         setKehadiranData({});
  //       }
  //     } else {
  //       // Check if response is JSON before trying to parse
  //       const contentType = response.headers.get('content-type');
  //       if (contentType && contentType.includes('application/json')) {
  //         const errorData = await response.json();
  //         toast({
  //           title: "Error memuat jadwal",
  //           description: errorData.error || 'Failed to load schedule',
  //           variant: "destructive"
  //         });
  //       } else {
  //         toast({
  //           title: "Error memuat jadwal",
  //           description: `HTTP ${response.status}: ${response.statusText}`,
  //           variant: "destructive"
  //         });
  //       }
  //       setJadwalBerdasarkanTanggal([]);
  //     }
  //   } catch (error) {
  //     console.error('Error loading jadwal banding by date:', error);
  //     toast({
  //       title: "Error",
  //       description: "Network error while loading schedule",
  //       variant: "destructive"
  //     });
  //     setJadwalBerdasarkanTanggal([]);
  //   } finally {
  //     setLoadingRef.current('jadwal', false);
  //   }

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

  // const submitPengajuanIzin = useCallback(async () => {
  //   // Cek apakah sedang dalam proses submit
  //   if (submitting) {
  //     console.log('⚠️ Pengajuan izin sedang diproses, mencegah multiple submission');
  //     return;
  //   }

  //   // Validasi form
  //   if (!formIzin.tanggal_izin || !formIzin.jadwal_id || !formIzin.jenis_izin || !formIzin.alasan) {
  //     toast({
  //       title: "Error",
  //       description: "Semua field wajib diisi",
  //       variant: "destructive"
  //     });
  //     return;
  //   }

  //   setSubmitting(true);
  //   setLoadingRef.current('submit', true);
  //   try {
  //     const requestData = {
  //       jadwal_id: parseInt(formIzin.jadwal_id),
  //       tanggal_mulai: formIzin.tanggal_izin,
  //       tanggal_selesai: formIzin.tanggal_izin,
  //       jenis_izin: formIzin.jenis_izin,
  //       alasan: formIzin.alasan
  //     };

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
      
  //     const response = await fetch(``, {
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
  //         description: "Pengajuan izin berhasil dikirim"
  //       });
        
  //       loadPengajuanIzin();
  //     } else {
  //       const errorData = await response.json();
  //       console.error('❌ Error submitting pengajuan izin:', errorData);
  //       toast({
  //         title: "Error",
  //         variant: "destructive"
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error submitting pengajuan izin:', error);
  //     toast({
  //       title: "Error",
  //       description: "Terjadi kesalahan saat mengirim pengajuan",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setSubmitting(false);
  //     setLoadingRef.current('submit', false);
  //   }

  // Create refs for functions to avoid dependency issues
  const loadJadwalHariIniRef = useRef(loadJadwalHariIni);
  const loadRiwayatDataRef = useRef(loadRiwayatData);
  const loadPengajuanIzinRef = useRef(loadPengajuanIzin);
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

  // Update refs when functions change - using direct assignment to avoid re-render
  loadJadwalHariIniRef.current = loadJadwalHariIni;
  loadRiwayatDataRef.current = loadRiwayatData;
  loadPengajuanIzinRef.current = loadPengajuanIzin;
  loadDaftarSiswaRef.current = loadDaftarSiswa;
  loadBandingAbsenRef.current = loadBandingAbsen;

  useEffect(() => {
    if (siswaId && activeTab === 'banding-absen') {
      loadBandingAbsenRef.current();
      loadDaftarSiswaRef.current();
      loadRiwayatDataRef.current();
    }
  }, [siswaId, activeTab]);

  // Load jadwal when selected date changes in edit mode
  useEffect(() => {
    if (isEditMode && siswaId && selectedDate) {
      loadJadwalByDate(selectedDate);
    }
  }, [isEditMode, selectedDate, siswaId, loadJadwalByDate]);

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
          if (isEditMode) {
            loadJadwalByDate(selectedDate);
          } else {
            loadJadwalHariIni();
          }
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
  }, [siswaId, kehadiranData, adaTugasData, selectedDate, isEditMode, loadJadwalByDate, loadJadwalHariIni, executeWithRetryRef, submitting]);

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
      loadJadwalByDate(today);
    } else {
      // Switching back to normal mode, load today's schedule
      loadJadwalHariIni();
    }
  }, [isEditMode, today, loadJadwalByDate, loadJadwalHariIni]);

  // Handle date change
  const handleDateChange = useCallback((newDate: string) => {
    setSelectedDate(newDate);
    loadJadwalByDate(newDate);
  }, [loadJadwalByDate]);

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
              ) : (isEditMode ? jadwalBerdasarkanTanggal : jadwalHariIni).map((jadwal, index) => (
                <div key={jadwal.id_jadwal} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline">Jam ke-{jadwal.jam_ke}</Badge>
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
                      <p className="text-sm text-gray-500">NIP: {jadwal.nip}</p>
                    </div>
                  </div>

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
                </div>
              ))}
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
                    {(isEditMode ? jadwalBerdasarkanTanggal : jadwalHariIni).map((jadwal) => {
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

  // Render Pengajuan Izin Content untuk Kelas
  const renderPengajuanIzinContent = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">Pengajuan Izin Kelas</h2>
            <p className="text-gray-600">Ajukan izin ketidakhadiran untuk teman sekelas</p>
          </div>
          {/* Button Ajukan Izin (personal) - REMOVED */}
          {/* <Button 
            onClick={() => setShowFormIzin(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Ajukan Izin
          </Button> */}
          <Button 
            onClick={() => setShowFormIzinKelas(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Users className="w-4 h-4 mr-2" />
            Ajukan Izin Kelas
          </Button>
        </div>

        {/* Form Pengajuan Izin (Single Student) - REMOVED */}

        {/* Form Pengajuan Izin Kelas */}
        {showFormIzinKelas && (
          <Card>
            <CardHeader>
              <CardTitle>Form Pengajuan Izin Kelas</CardTitle>
              <p className="text-sm text-gray-600">Ajukan izin ketidakhadiran untuk teman sekelas</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tanggal_izin_kelas">Tanggal Izin *</Label>
                  <input
                    id="tanggal_izin_kelas"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formIzinKelas.tanggal_izin}
                    onChange={(e) => {
                      const tanggal = e.target.value;
                      setFormIzinKelas({
                        jadwal_id: '',
                        tanggal_izin: tanggal,
                        siswa_izin: []
                      });
                      if (tanggal) {
                        loadJadwalByDate(tanggal);
                      } else {
                        setJadwalBerdasarkanTanggal([]);
                      }
                    }}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Pilih tanggal izin terlebih dahulu untuk melihat jadwal pelajaran</p>
                </div>
                
                <div>
                  <Label htmlFor="jadwal_kelas">Jadwal Pelajaran *</Label>
                  <select 
                    id="jadwal_kelas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formIzinKelas.jadwal_id}
                    onChange={(e) => setFormIzinKelas({...formIzinKelas, jadwal_id: e.target.value})}
                    disabled={!formIzinKelas.tanggal_izin || jadwalBerdasarkanTanggal.length === 0}
                    required
                  >
                    <option value="">
                      {!formIzinKelas.tanggal_izin 
                        ? "Pilih tanggal izin terlebih dahulu..." 
                        : jadwalBerdasarkanTanggal.length === 0 
                          ? "Tidak ada jadwal untuk tanggal ini" 
                          : "Pilih jadwal pelajaran..."
                      }
                    </option>
                    {jadwalBerdasarkanTanggal.map((jadwal) => (
                      <option key={jadwal.id_jadwal} value={jadwal.id_jadwal}>
                        {jadwal.nama_mapel} - {jadwal.nama_guru} (Jam {jadwal.jam_ke}: {jadwal.jam_mulai}-{jadwal.jam_selesai})
                      </option>
                    ))}
                  </select>
                  {formIzinKelas.tanggal_izin && jadwalBerdasarkanTanggal.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">Tidak ada jadwal pelajaran untuk tanggal {formIzinKelas.tanggal_izin}</p>
                  )}
                </div>
              </div>

              {/* Daftar Siswa untuk Izin Kelas */}
              {formIzinKelas.jadwal_id && (
                <div className="border-t pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Pilih Siswa yang Izin</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSiswa = {
                            id: undefined as number | undefined,
                            nama: '',
                            jenis_izin: 'sakit' as const,
                            alasan: ''
                          };
                          // Cek apakah sudah ada siswa kosong (belum dipilih)
                          const hasEmptySiswa = formIzinKelas.siswa_izin.some(siswa => !siswa.id);
                          if (hasEmptySiswa) {
                            toast({
                              title: "Peringatan",
                              description: "Selesaikan pemilihan siswa yang ada terlebih dahulu",
                              variant: "destructive"
                            });
                            return;
                          }
                          // Cek apakah sudah mencapai maksimal 10 siswa
                          if (formIzinKelas.siswa_izin.length >= 10) {
                            toast({
                              title: "Peringatan",
                              description: "Maksimal 10 siswa per pengajuan",
                              variant: "destructive"
                            });
                            return;
                          }
                          const updatedSiswaIzin = [...formIzinKelas.siswa_izin, newSiswa];
                          console.log('➕ Adding siswa, total now:', updatedSiswaIzin.length);
                          setFormIzinKelas({
                            ...formIzinKelas,
                            siswa_izin: updatedSiswaIzin
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Siswa
                      </Button>
                    </div>

                    {(() => {
                      console.log('🔍 Rendering siswa_izin:', formIzinKelas.siswa_izin.length, 'items');
                      return null;
                    })()}
                    {formIzinKelas.siswa_izin.map((siswa, index) => {
                      console.log(`   └─ [${index}]`, siswa.id, siswa.nama);
                      return (
                      <div key={`siswa-izin-${siswa.id || index}-${index}`} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`siswa_nama_${index}`}>Nama Siswa *</Label>
                            <select
                              id={`siswa_nama_${index}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={siswa.id || ''}
                              onChange={(e) => {
                                const selectedId = parseInt(e.target.value);
                                
                                // Cek apakah siswa sudah dipilih di form lain
                                if (selectedId) {
                                  const isAlreadySelected = formIzinKelas.siswa_izin.some((s, i) => 
                                    i !== index && s.id === selectedId
                                  );
                                  
                                  if (isAlreadySelected) {
                                    toast({
                                      title: "Peringatan",
                                      description: "Siswa ini sudah dipilih di form lain",
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                }
                                
                                const selectedSiswa = daftarSiswa.find(s => s.id === selectedId);
                                const updatedSiswa = [...formIzinKelas.siswa_izin];
                                updatedSiswa[index] = {
                                  ...siswa,
                                  id: selectedId,
                                  nama: selectedSiswa?.nama || ''
                                };
                                setFormIzinKelas({...formIzinKelas, siswa_izin: updatedSiswa});
                              }}
                              required
                            >
                              <option value="">Pilih siswa...</option>
                              {daftarSiswa.map((s) => {
                                const isSelected = formIzinKelas.siswa_izin.some((siswa, i) => 
                                  i !== index && siswa.id === s.id
                                );
                                return (
                                  <option 
                                    key={s.id} 
                                    value={s.id}
                                    disabled={isSelected}
                                    style={{ 
                                      opacity: isSelected ? 0.5 : 1,
                                      backgroundColor: isSelected ? '#f3f4f6' : 'white'
                                    }}
                                  >
                                    {s.nama} {isSelected ? '(Sudah dipilih)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div>
                            <Label htmlFor={`siswa_jenis_${index}`}>Jenis Izin *</Label>
                            <select
                              id={`siswa_jenis_${index}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={siswa.jenis_izin}
                              onChange={(e) => {
                                const updatedSiswa = [...formIzinKelas.siswa_izin];
                                updatedSiswa[index] = {...siswa, jenis_izin: e.target.value as 'sakit' | 'izin' | 'alpa' | 'dispen'};
                                setFormIzinKelas({...formIzinKelas, siswa_izin: updatedSiswa});
                              }}
                              required
                            >
                              <option value="sakit">Sakit</option>
                              <option value="izin">Izin</option>
                              <option value="alpa">Alpa</option>
                              <option value="dispen">Dispen</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`siswa_alasan_${index}`}>Alasan *</Label>
                          <textarea
                            id={`siswa_alasan_${index}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={2}
                            value={siswa.alasan}
                            onChange={(e) => {
                              const updatedSiswa = [...formIzinKelas.siswa_izin];
                              updatedSiswa[index] = {...siswa, alasan: e.target.value};
                              setFormIzinKelas({...formIzinKelas, siswa_izin: updatedSiswa});
                            }}
                            placeholder="Jelaskan alasan ketidakhadiran..."
                            required
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedSiswa = formIzinKelas.siswa_izin.filter((_, i) => i !== index);
                              setFormIzinKelas({...formIzinKelas, siswa_izin: updatedSiswa});
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    );
                    })}

                    {formIzinKelas.siswa_izin.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Belum ada siswa yang dipilih</p>
                        <p className="text-sm">Klik "Tambah Siswa" untuk memilih siswa yang akan izin</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={submitPengajuanIzinKelas}
                  disabled={!formIzinKelas.jadwal_id || !formIzinKelas.tanggal_izin || formIzinKelas.siswa_izin.length === 0 || submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Pengajuan Kelas
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowFormIzinKelas(false);
                    setFormIzinKelas({
                      jadwal_id: '',
                      tanggal_izin: '',
                      siswa_izin: []
                    });
                  }}
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
                                  <div key={`${s.nama}-${idx}`}>
                                    {s.nama} ({s.jenis_izin})
                                  </div>
                                ))}
                                {izin.siswa_izin.length > 3 && (
                                  <div 
                                    className="text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                                    onClick={() => toggleRowExpansion(izin.id_pengajuan)}
                                  >
                                    +{izin.siswa_izin.length - 3} lainnya
                                  </div>
                                )}
                              </div>
                              {expandedRows.has(izin.id_pengajuan) && izin.siswa_izin.length > 3 && (
                                <div className="text-xs text-gray-600 max-w-xs mt-2 p-2 bg-gray-50 rounded border">
                                  {izin.siswa_izin.slice(3).map((s, idx) => (
                                    <div key={`${s.nama}-${idx + 3}`} className="mb-1">
                                      {s.nama} ({s.jenis_izin})
                                    </div>
                                  ))}
                                  <div 
                                    className="text-blue-600 cursor-pointer hover:text-blue-800 hover:underline mt-1"
                                    onClick={() => toggleRowExpansion(izin.id_pengajuan)}
                                  >
                                    Tutup
                                  </div>
                                </div>
                              )}
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
                                  <div key={`${s.nama}-${idx}`} className="text-xs bg-gray-50 p-1 rounded break-words">
                                    <strong>{s.nama}:</strong> {s.alasan}
                                  </div>
                                ))}
                                {izin.siswa_izin.length > 2 && (
                                  <div 
                                    className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                                    onClick={() => toggleRowExpansion(izin.id_pengajuan)}
                                  >
                                    +{izin.siswa_izin.length - 2} alasan lainnya
                                  </div>
                                )}
                                {expandedRows.has(izin.id_pengajuan) && izin.siswa_izin.length > 2 && (
                                  <div className="text-xs space-y-1 mt-2 p-2 bg-gray-50 rounded border">
                                    {izin.siswa_izin.slice(2).map((s, idx) => (
                                      <div key={`${s.nama}-${idx + 2}`} className="bg-white p-1 rounded break-words">
                                        <strong>{s.nama}:</strong> {s.alasan}
                                      </div>
                                    ))}
                                    <div 
                                      className="text-blue-600 cursor-pointer hover:text-blue-800 hover:underline mt-1"
                                      onClick={() => toggleRowExpansion(izin.id_pengajuan)}
                                    >
                                      Tutup
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm break-words">{izin.alasan}</div>
                            )}
                            {izin.keterangan_guru && (
                              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded break-words">
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
                        siswa_banding: []
                      });
                      setAttendanceRecords([]); // Reset attendance records
                      if (tanggal) {
                        loadJadwalByDate(tanggal);
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
                      setFormBandingKelas({...formBandingKelas, jadwal_id: jadwalId});
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

              {/* Daftar Siswa untuk Banding Kelas */}
              {formBandingKelas.jadwal_id && (
                <div className="border-t pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Pilih Siswa untuk Banding</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSiswa = {
                            id: undefined as number | undefined,
                            nama: '',
                            status_asli: 'alpa' as const,
                            status_diajukan: 'hadir' as const,
                            alasan_banding: ''
                          };
                          // Cek apakah sudah ada siswa kosong (belum dipilih)
                          const hasEmptySiswa = formBandingKelas.siswa_banding.some(siswa => !siswa.id);
                          if (hasEmptySiswa) {
                            toast({
                              title: "Peringatan",
                              description: "Selesaikan pemilihan siswa yang ada terlebih dahulu",
                              variant: "destructive"
                            });
                            return;
                          }
                          // Cek apakah sudah mencapai maksimal 10 siswa
                          if (formBandingKelas.siswa_banding.length >= 10) {
                            toast({
                              title: "Peringatan",
                              description: "Maksimal 10 siswa per pengajuan",
                              variant: "destructive"
                            });
                            return;
                          }
                          setFormBandingKelas({
                            ...formBandingKelas,
                            siswa_banding: [...formBandingKelas.siswa_banding, newSiswa]
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Siswa
                      </Button>
                    </div>

                    {formBandingKelas.siswa_banding.map((siswa, index) => (
                      <div key={`siswa-banding-${siswa.id || index}-${index}`} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`banding_siswa_nama_${index}`}>Nama Siswa *</Label>
                            <select
                              id={`banding_siswa_nama_${index}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={siswa.id || ''}
                              onChange={(e) => {
                                const selectedId = parseInt(e.target.value);
                                
                                // Cek apakah siswa sudah dipilih di form lain
                                if (selectedId) {
                                  const isAlreadySelected = formBandingKelas.siswa_banding.some((s, i) => 
                                    i !== index && s.id === selectedId
                                  );
                                  
                                  if (isAlreadySelected) {
                                    toast({
                                      title: "Peringatan",
                                      description: "Siswa ini sudah dipilih di form lain",
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                }
                                
                                // Find attendance record
                                const attendanceRecord = attendanceRecords.find(r => r.siswa_id === selectedId);
                                const selectedSiswa = daftarSiswa.find(s => s.id === selectedId);
                                
                                // Check if student has attendance record
                                if (attendanceRecord && !attendanceRecord.has_attendance) {
                                  toast({
                                    title: "Peringatan",
                                    description: "Siswa ini belum diabsen oleh guru untuk jadwal ini",
                                    variant: "destructive"
                                  });
                                }
                                
                                const updatedSiswa = [...formBandingKelas.siswa_banding];
                                updatedSiswa[index] = {
                                  ...siswa,
                                  id: selectedId,
                                  nama: selectedSiswa?.nama || '',
                                  status_asli: (attendanceRecord?.status as 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen') || 'alpa', // Auto-fill dari database
                                  status_diajukan: 'hadir', // Default diajukan ke hadir
                                  alasan_banding: ''
                                };
                                setFormBandingKelas({...formBandingKelas, siswa_banding: updatedSiswa});
                              }}
                              required
                            >
                              <option value="">Pilih siswa...</option>
                              {daftarSiswa.map((s) => {
                                const isSelected = formBandingKelas.siswa_banding.some((siswa, i) => 
                                  i !== index && siswa.id === s.id
                                );
                                const attendanceRecord = attendanceRecords.find(r => r.siswa_id === s.id);
                                const hasAttendance = attendanceRecord?.has_attendance || false;
                                
                                return (
                                  <option 
                                    key={s.id} 
                                    value={s.id}
                                    disabled={isSelected || !hasAttendance}
                                    style={{ 
                                      opacity: (isSelected || !hasAttendance) ? 0.5 : 1,
                                      backgroundColor: (isSelected || !hasAttendance) ? '#f3f4f6' : 'white'
                                    }}
                                  >
                                    {s.nama}
                                    {isSelected ? ' (Sudah dipilih)' : ''}
                                    {!hasAttendance && !isSelected ? ' (Belum diabsen)' : ''}
                                    {hasAttendance && attendanceRecord?.status ? ` - ${attendanceRecord.status}` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`banding_status_asli_${index}`}>
                                Status Tercatat *
                                <span className="text-xs text-gray-500 ml-2">(Otomatis dari sistem)</span>
                              </Label>
                              <select
                                id={`banding_status_asli_${index}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                                value={siswa.status_asli}
                                disabled
                                required
                              >
                                <option value="">Pilih status...</option>
                                <option value="hadir">Hadir</option>
                                <option value="izin">Izin</option>
                                <option value="sakit">Sakit</option>
                                <option value="alpa">Alpa</option>
                                <option value="dispen">Dispen</option>
                              </select>
                              {siswa.status_asli && (
                                <p className="text-xs text-gray-600 mt-1">
                                  Status ini diambil dari catatan guru
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor={`banding_status_diajukan_${index}`}>Status Diajukan *</Label>
                              <select
                                id={`banding_status_diajukan_${index}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                value={siswa.status_diajukan}
                                onChange={(e) => {
                                  const updatedSiswa = [...formBandingKelas.siswa_banding];
                                  updatedSiswa[index] = {...siswa, status_diajukan: e.target.value as 'hadir' | 'izin' | 'sakit' | 'alpa' | 'dispen'};
                                  setFormBandingKelas({...formBandingKelas, siswa_banding: updatedSiswa});
                                }}
                                required
                              >
                                <option value="hadir">Hadir</option>
                                <option value="izin">Izin</option>
                                <option value="sakit">Sakit</option>
                                <option value="alpa">Alpa</option>
                                <option value="dispen">Dispen</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`banding_alasan_${index}`}>Alasan Banding *</Label>
                          <textarea
                            id={`banding_alasan_${index}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={2}
                            value={siswa.alasan_banding}
                            onChange={(e) => {
                              const updatedSiswa = [...formBandingKelas.siswa_banding];
                              updatedSiswa[index] = {...siswa, alasan_banding: e.target.value};
                              setFormBandingKelas({...formBandingKelas, siswa_banding: updatedSiswa});
                            }}
                            placeholder="Jelaskan alasan mengapa status absen perlu diubah..."
                            required
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedSiswa = formBandingKelas.siswa_banding.filter((_, i) => i !== index);
                              setFormBandingKelas({...formBandingKelas, siswa_banding: updatedSiswa});
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ))}

                    {formBandingKelas.siswa_banding.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Belum ada siswa yang dipilih</p>
                        <p className="text-sm">Klik "Tambah Siswa" untuk memilih siswa yang akan diajukan banding</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={submitBandingKelas}
                  disabled={!formBandingKelas.jadwal_id || !formBandingKelas.tanggal_absen || formBandingKelas.siswa_banding.length === 0 || submitting}
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
                      siswa_banding: []
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
      onError={(error, errorInfo) => {
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
            variant={activeTab === 'pengajuan-izin' ? "default" : "ghost"}
            className={`w-full justify-start`}
            onClick={() => {setActiveTab('pengajuan-izin'); setSidebarOpen(false);}}
          >
            <FileText className="h-4 w-4" />
            <span className="ml-2">Pengajuan Izin Kelas</span>
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
          {activeTab === 'pengajuan-izin' && renderPengajuanIzinContent()}
          {activeTab === 'banding-absen' && renderBandingAbsenContent()}
        </div>
      </div>
      
      {/* Floating Font Size Control for Mobile */}
      <FontSizeControl variant="floating" className="lg:hidden" />
      
      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile
          userData={currentUserData}
          onUpdate={handleUpdateProfile}
          onClose={() => setShowEditProfile(false)}
          role="siswa"
        />
      )}
      </div>
    </ErrorBoundary>
  );
};

// Export with ErrorBoundary wrapper
export const StudentDashboard = ({ userData, onLogout }: StudentDashboardProps) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('StudentDashboard Error:', error, errorInfo);
        // You can add error reporting service here
      }}
    >
      <StudentDashboardComponent userData={userData} onLogout={onLogout} />
    </ErrorBoundary>
  );
};
