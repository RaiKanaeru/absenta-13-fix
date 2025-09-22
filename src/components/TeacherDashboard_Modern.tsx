import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatTime24, formatDateTime24 } from "@/lib/time-utils";
import { FontSizeControl } from "@/components/ui/font-size-control";
import { 
  Clock, Users, CheckCircle, LogOut, ArrowLeft, History, MessageCircle, Calendar,
  BookOpen, GraduationCap, Settings, Menu, X, Home, Bell, FileText, ClipboardList, Download, Search,
  Edit, XCircle, Filter, Eye, ChevronLeft, ChevronRight
} from "lucide-react";
import ExcelPreview from './ExcelPreview';

interface TeacherDashboardProps {
  userData: {
    id: number;
    username: string;
    nama: string;
    role: string;
    guru_id?: number;
    nip?: string;
    mapel?: string;
  };
  onLogout: () => void;
}

type ScheduleStatus = 'upcoming' | 'current' | 'completed';
type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpa' | 'Dispen' | 'Lain';

interface Schedule {
  id: number;
  nama_mapel: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  nama_kelas: string;
  status?: ScheduleStatus;
}

// Tipe data mentah dari backend (bisa id atau id_jadwal, dst.)
type RawSchedule = {
  id?: number;
  id_jadwal?: number;
  jadwal_id?: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  jam_ke?: number;
  status?: string;
  nama_mapel?: string;
  kode_mapel?: string;
  mapel?: string;
  nama_kelas?: string;
  kelas?: string;
};

// Baris riwayat datar dari backend /api/guru/student-attendance-history
type FlatHistoryRow = {
  tanggal: string;
  jam_ke: number;
  jam_mulai: string;
  jam_selesai: string;
  nama_mapel: string;
  nama_kelas: string;
  nama_siswa: string;
  nis: string;
  status_kehadiran: string;
  keterangan?: string;
  waktu_absen: string;
  status_guru?: string;
  keterangan_guru?: string;
};

interface Student {
  id: number;
  nama: string;
  nis?: string;
  jenis_kelamin?: string;
  jabatan?: string;
  status?: string;
  nama_kelas?: string;
  attendance_status?: AttendanceStatus;
  attendance_note?: string;
  waktu_absen?: string;
}

interface HistoryStudentData {
  nama: string;
  nis: string;
  status: AttendanceStatus;
  waktu_absen?: string;
  alasan?: string;
}

interface HistoryClassData {
  kelas: string;
  mata_pelajaran: string;
  jam: string;
  hari: string;
  siswa: HistoryStudentData[];
}

interface HistoryData {
  [date: string]: {
    [classKey: string]: HistoryClassData;
  };
}

interface PengajuanIzin {
  id: number;
  siswa_id: number;
  nama_siswa: string;
  nis: string;
  nama_kelas: string;
  jenis_izin: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
  tanggal_pengajuan: string;
  status_persetujuan: 'pending' | 'disetujui' | 'ditolak';
  disetujui_oleh?: number;
  catatan_guru?: string;
}

interface BandingAbsenTeacher {
  id_banding: number;
  siswa_id: number;
  nama_siswa: string;
  nis: string;
  nama_kelas: string;
  jadwal_id: number;
  tanggal_absen: string;
  status_asli: 'hadir' | 'izin' | 'sakit' | 'alpa';
  status_diajukan: 'hadir' | 'izin' | 'sakit' | 'alpa';
  alasan_banding: string;
  bukti_pendukung?: string;
  status_banding: 'pending' | 'disetujui' | 'ditolak';
  catatan_guru?: string;
  tanggal_pengajuan: string;
  tanggal_keputusan?: string;
  diproses_oleh?: number;
  nama_mapel?: string;
  nama_guru?: string;
  jam_mulai?: string;
  jam_selesai?: string;
}

const statusColors = {
  current: 'bg-green-100 text-green-800',
  upcoming: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
};

// API utility function
const apiCall = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errorData.error || `Error: ${response.status}`);
  }

  return response.json();
};

// Schedule List View
const ScheduleListView = ({ schedules, onSelectSchedule, isLoading }: {
  schedules: Schedule[];
  onSelectSchedule: (schedule: Schedule) => void;
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Jadwal Hari Ini
      </CardTitle>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-20 rounded"></div>
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada jadwal hari ini</h3>
          <p className="text-gray-600">Selamat beristirahat!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelectSchedule(schedule)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {schedule.jam_mulai} - {schedule.jam_selesai}
                    </Badge>
                    <Badge className={statusColors[schedule.status || 'upcoming']}>
                      {schedule.status === 'current' ? 'Sedang Berlangsung' : 
                       schedule.status === 'completed' ? 'Selesai' : 'Akan Datang'}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-gray-900">{schedule.nama_mapel}</h4>
                  <p className="text-sm text-gray-600">{schedule.nama_kelas}</p>
                </div>
                <Button variant="outline" size="sm">
                  {schedule.status === 'current' ? 'Ambil Absensi' : 'Lihat Detail'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

// Attendance View (for taking attendance)
const AttendanceView = ({ schedule, user, onBack }: {
  schedule: Schedule;
  user: TeacherDashboardProps['userData'];
  onBack: () => void;
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<{[key: number]: AttendanceStatus}>({});
  const [notes, setNotes] = useState<{[key: number]: string}>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // State untuk edit absen dengan rentang tanggal
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [maxDate, setMaxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [minDate, setMinDate] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  useEffect(() => {
    // Fetch students for the class
    const fetchStudents = async () => {
      try {
        setLoading(true);
        console.log(`🔍 Fetching students for schedule ID: ${schedule.id}`);
        const data = await apiCall(`/api/schedule/${schedule.id}/students`);
        console.log(`✅ Received ${data.length} students:`, data);
        setStudents(data);
        
        // Initialize attendance with existing data or default to 'Hadir'
        const initialAttendance: {[key: number]: AttendanceStatus} = {};
        const initialNotes: {[key: number]: string} = {};
        data.forEach((student: any) => {
          initialAttendance[student.id] = (student.attendance_status as AttendanceStatus) || 'Hadir';
          if (student.attendance_note) {
            initialNotes[student.id] = student.attendance_note;
          }
        });
        setAttendance(initialAttendance);
        setNotes(initialNotes);
        
        // Log attendance status for debugging
        console.log('📊 Initial attendance data:', initialAttendance);
        console.log('📝 Initial notes data:', initialNotes);
      } catch (error) {
        console.error('❌ Error fetching students:', error);
        let errorMessage = "Gagal memuat daftar siswa";
        
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            errorMessage = "Jadwal tidak ditemukan atau tidak ada siswa dalam kelas ini";
          } else if (error.message.includes('500')) {
            errorMessage = "Terjadi kesalahan server. Silakan coba lagi";
          } else if (error.message.includes('Failed to fetch')) {
            errorMessage = "Tidak dapat terhubung ke server. Pastikan server backend sedang berjalan";
          }
        }
        
        toast({ 
          title: "Error", 
          description: errorMessage, 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [schedule.id]);

  // Fetch students by date for edit mode
  const fetchStudentsByDate = async (tanggal: string) => {
    try {
      setLoading(true);
      console.log(`🔍 Fetching students for schedule ID: ${schedule.id} on date: ${tanggal}`);
      const data = await apiCall(`/api/schedule/${schedule.id}/students-by-date?tanggal=${tanggal}`);
      console.log(`✅ Received ${data.length} students for date ${tanggal}:`, data);
      setStudents(data);
      
      // Initialize attendance with existing data or default to 'Hadir'
      const initialAttendance: {[key: number]: AttendanceStatus} = {};
      const initialNotes: {[key: number]: string} = {};
      data.forEach((student: any) => {
        initialAttendance[student.id] = (student.attendance_status as AttendanceStatus) || 'Hadir';
        if (student.attendance_note) {
          initialNotes[student.id] = student.attendance_note;
        }
      });
      setAttendance(initialAttendance);
      setNotes(initialNotes);
    } catch (error) {
      console.error('❌ Error fetching students by date:', error);
      toast({ 
        title: "Error", 
        description: "Gagal memuat data siswa untuk tanggal tersebut", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      // Switching to edit mode
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } else {
      // Switching back to normal mode, reload today's data
      fetchStudents();
    }
  };

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchStudentsByDate(newDate);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Check if there are any students with existing attendance
      const hasExistingAttendance = students.some(student => student.waktu_absen);
      
      // Validate attendance data
      if (!attendance || Object.keys(attendance).length === 0) {
        toast({ 
          title: "Error", 
          description: "Data absensi tidak boleh kosong", 
          variant: "destructive" 
        });
        return;
      }
      
      // Check if all students have attendance status
      const missingAttendance = students.filter(student => !attendance[student.id]);
      if (missingAttendance.length > 0) {
        toast({ 
          title: "Error", 
          description: `Siswa ${missingAttendance.map(s => s.nama).join(', ')} belum diabsen`, 
          variant: "destructive" 
        });
        return;
      }
      
      console.log('📤 Submitting attendance data:', {
        scheduleId: schedule.id,
        attendance,
        notes,
        guruId: user.guru_id || user.id
      });
      
      const response = await apiCall(`/api/attendance/submit`, {
        method: 'POST',
        body: JSON.stringify({
          scheduleId: schedule.id,
          attendance,
          notes,
          guruId: user.guru_id || user.id,
          tanggal_absen: isEditMode ? selectedDate : undefined
        }),
      });

      console.log('✅ Attendance submission response:', response);

      const message = hasExistingAttendance 
        ? "Absensi berhasil diperbarui" 
        : "Absensi berhasil disimpan";
      
      toast({ 
        title: "Berhasil!", 
        description: message
      });
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('❌ Error submitting attendance:', error);
      toast({ 
        title: "Error", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button onClick={onBack} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Jadwal
          </Button>
          <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Absensi Siswa' : 'Ambil Absensi'}</h2>
          <p className="text-gray-600">{schedule.nama_mapel} - {schedule.nama_kelas}</p>
          <p className="text-sm text-gray-500">{schedule.jam_mulai} - {schedule.jam_selesai}</p>
          {isEditMode && (
            <p className="text-sm text-blue-600 mt-1">
              Mengedit absensi untuk tanggal: {new Date(selectedDate).toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
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
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
            title="Refresh halaman untuk memuat data terbaru"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Edit Mode Controls */}
      {isEditMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Pilih Tanggal Absensi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="date-picker" className="text-sm font-medium">
                Tanggal:
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
              <div className="text-sm text-gray-600">
                (Maksimal 30 hari yang lalu)
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada siswa dalam kelas ini</h3>
              <p className="text-gray-600">Belum ada siswa yang terdaftar di kelas {schedule.nama_kelas}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student, index) => (
                <div key={student.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{student.nama}</p>
                      {student.nis && (
                        <p className="text-sm text-gray-600">NIS: {student.nis}</p>
                      )}
                      {student.waktu_absen && (
                        <p className="text-xs text-gray-500">
                          Absen terakhir: {formatTime24(student.waktu_absen)}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {student.waktu_absen && (
                      <div className="mb-2">
                        <Badge variant="secondary" className="text-xs">
                          ✓ Sudah diabsen sebelumnya
                        </Badge>
                      </div>
                    )}
                    <RadioGroup
                      value={attendance[student.id]}
                      onValueChange={(value) => 
                        setAttendance(prev => ({ ...prev, [student.id]: value as AttendanceStatus }))
                      }
                    >
                      <div className="flex space-x-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Hadir" id={`hadir-${student.id}`} />
                          <Label htmlFor={`hadir-${student.id}`}>Hadir</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Izin" id={`izin-${student.id}`} />
                          <Label htmlFor={`izin-${student.id}`}>Izin</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Sakit" id={`sakit-${student.id}`} />
                          <Label htmlFor={`sakit-${student.id}`}>Sakit</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Alpa" id={`alpa-${student.id}`} />
                          <Label htmlFor={`alpa-${student.id}`}>Alpa</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Dispen" id={`dispen-${student.id}`} />
                          <Label htmlFor={`dispen-${student.id}`}>Dispen</Label>
                        </div>
                      </div>
                    </RadioGroup>
                    
                    {attendance[student.id] !== 'Hadir' && (
                      <Textarea
                        placeholder="Keterangan (opsional)"
                        value={notes[student.id] || ''}
                        onChange={(e) => 
                          setNotes(prev => ({ ...prev, [student.id]: e.target.value }))
                        }
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
              ))}
              
              {students.length > 0 && (
                <div className="pt-4 border-t space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Preview Data Absensi:</h4>
                    <div className="text-xs space-y-1">
                      {students.map(student => (
                        <div key={student.id} className="flex justify-between">
                          <span>{student.nama}:</span>
                          <span className={`font-medium ${
                            attendance[student.id] === 'Hadir' ? 'text-green-600' :
                            attendance[student.id] === 'Izin' ? 'text-yellow-600' :
                            attendance[student.id] === 'Sakit' ? 'text-blue-600' :
                            'text-red-600'
                          }`}>
                            {attendance[student.id]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting} 
                    className="w-full"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Absensi'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Laporan Kehadiran Siswa View
const LaporanKehadiranSiswaView = ({ user }: { user: TeacherDashboardProps['userData'] }) => {
  const [kelasOptions, setKelasOptions] = useState<{id:number, nama_kelas:string}[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapelInfo, setMapelInfo] = useState<{nama_mapel: string, nama_guru: string} | null>(null);

  useEffect(() => {
    (async ()=>{
      const res = await apiCall('/api/guru/classes');
      setKelasOptions(res);
    })();
  }, []);

  const fetchData = async () => {
    if (!selectedKelas) {
      setError('Mohon pilih kelas');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await apiCall(`/api/guru/laporan-kehadiran-siswa?kelas_id=${selectedKelas}`);
      setReportData(Array.isArray(res.data) ? res.data : []);
      setMapelInfo(res.mapel_info || null);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const url = `http://localhost:3001/api/guru/download-laporan-kehadiran-siswa?kelas_id=${selectedKelas}`;
      const resp = await fetch(url, { credentials: 'include' });
      const blob = await resp.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `laporan-kehadiran-siswa-${selectedKelas}.xlsx`;
      link.click();
    } catch (err) {
      console.error('Error downloading excel:', err);
      setError('Gagal mengunduh file Excel');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Kehadiran Siswa</h1>
          <p className="text-gray-600">Laporan kehadiran siswa berdasarkan jadwal pertemuan</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        </Card>
      )}

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label className="text-sm font-medium">Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Kelas"/>
                </SelectTrigger>
                <SelectContent>
                  {kelasOptions.map(k=> (<SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchData} disabled={loading} className="flex-1">
                <Search className="w-4 h-4 mr-2"/>
                {loading ? 'Memuat...' : 'Tampilkan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData.length > 0 && (
        <div className="space-y-4">
          {/* Laporan dengan Kop */}
          <Card>
            <CardContent className="p-0">
              {/* Kop Surat */}
              <div className="border-b border-gray-200 p-6 text-center">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">SMK NEGERI 13 BANDUNG</h2>
                  <p className="text-sm text-gray-600">Jl. Soekarno Hatta No. 123, Bandung</p>
                  <p className="text-sm text-gray-600">Telp: (022) 1234567 | Email: info@smkn13bandung.sch.id</p>
                </div>
              </div>

              {/* Header Laporan */}
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-2">LAPORAN KEHADIRAN SISWA</h3>
                  {mapelInfo && (
                    <div className="space-y-1">
                      <p className="text-sm"><strong>Mata Pelajaran:</strong> {mapelInfo.nama_mapel}</p>
                      <p className="text-sm"><strong>Guru:</strong> {mapelInfo.nama_guru}</p>
                    </div>
                  )}
                </div>

                {/* Tabel Laporan */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">No</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Nama</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">NIS</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">L/P</th>
                        {reportData[0]?.pertemuan_dates?.map((date: string, index: number) => (
                          <th key={index} className="border border-gray-300 px-1 py-2 text-center font-semibold text-xs">
                            {new Date(date).getDate()}
                          </th>
                        ))}
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">H</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">I</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Z</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">D</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((student, index) => (
                        <tr key={student.id_siswa}>
                          <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
                          <td className="border border-gray-300 px-2 py-2">{student.nama}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center">{student.nis}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center">{student.jenis_kelamin}</td>
                          {student.pertemuan_dates?.map((date: string, dateIndex: number) => {
                            const attendance = student.attendance_by_date?.[date];
                            return (
                              <td key={dateIndex} className="border border-gray-300 px-1 py-2 text-center text-xs">
                                {attendance === 'Hadir' ? 'H' : 
                                 attendance === 'Izin' ? 'I' : 
                                 attendance === 'Sakit' ? 'S' : 
                                 attendance === 'Alpa' ? 'A' : 
                                 attendance === 'Dispen' ? 'D' : '-'}
                              </td>
                            );
                          })}
                          <td className="border border-gray-300 px-2 py-2 text-center font-semibold">{student.total_hadir || 0}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center font-semibold">{student.total_izin || 0}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center font-semibold">{student.total_sakit || 0}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center font-semibold">{student.total_alpa || 0}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center font-semibold">{student.persentase_kehadiran || '0%'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tombol Download */}
                <div className="flex justify-center mt-6">
                  <Button onClick={downloadExcel} className="bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && reportData.length === 0 && !error && selectedKelas && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data laporan</h3>
            <p className="text-gray-600 text-center">Pilih kelas dan klik "Tampilkan" untuk melihat laporan kehadiran siswa</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Riwayat Pengajuan Izin Report View
const RiwayatPengajuanIzinView = ({ user }: { user: TeacherDashboardProps['userData'] }) => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [kelasOptions, setKelasOptions] = useState<{id:number, nama_kelas:string}[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async ()=>{
      const res = await apiCall('/api/guru/classes');
      setKelasOptions(res);
    })();
  }, []);

  const fetchData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Mohon pilih periode mulai dan akhir');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate 
      });
      if (selectedKelas && selectedKelas !== 'all') params.append('kelas_id', selectedKelas);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const res = await apiCall(`/api/guru/pengajuan-izin-history?${params.toString()}`);
      setReportData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching pengajuan izin history:', err);
      setError('Gagal memuat data riwayat pengajuan izin');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const params = new URLSearchParams({ 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate 
      });
      if (selectedKelas && selectedKelas !== 'all') params.append('kelas_id', selectedKelas);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const url = `http://localhost:3001/api/export/riwayat-pengajuan-izin?${params.toString()}`;
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengunduh file Excel');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `riwayat-pengajuan-izin-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      link.click();
      
      toast({
        title: "Berhasil!",
        description: "File Excel berhasil diunduh"
      });
    } catch (err) {
      console.error('Error downloading Excel:', err);
      setError('Gagal mengunduh file Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Filter Laporan Riwayat Pengajuan Izin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <Label className="text-sm font-medium">Periode Mulai</Label>
              <Input 
                type="date" 
                value={dateRange.startDate} 
                onChange={(e)=>setDateRange(p=>({...p,startDate:e.target.value}))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Periode Akhir</Label>
              <Input 
                type="date" 
                value={dateRange.endDate} 
                onChange={(e)=>setDateRange(p=>({...p,endDate:e.target.value}))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Kelas"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasOptions.map(k=> (<SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Status"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchData} disabled={loading} className="flex-1">
                <Search className="w-4 h-4 mr-2"/>
                {loading ? 'Memuat...' : 'Tampilkan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {reportData.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Riwayat Pengajuan Izin
                </CardTitle>
                <Button onClick={downloadExcel} className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>NIS</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Jenis Izin</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Disetujui</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{item.nama_siswa}</TableCell>
                        <TableCell>{item.nis}</TableCell>
                        <TableCell>{item.nama_kelas}</TableCell>
                        <TableCell>{item.jenis_izin}</TableCell>
                        <TableCell>{item.alasan}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.status === 'approved' ? 'default' : 
                                   item.status === 'rejected' ? 'destructive' : 'secondary'}
                          >
                            {item.status === 'approved' ? 'Disetujui' : 
                             item.status === 'rejected' ? 'Ditolak' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.tanggal_disetujui ? 
                            new Date(item.tanggal_disetujui).toLocaleDateString('id-ID') : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>{item.catatan || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Riwayat Pengajuan Banding Absen Report View
const RiwayatBandingAbsenView = ({ user }: { user: TeacherDashboardProps['userData'] }) => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [kelasOptions, setKelasOptions] = useState<{id:number, nama_kelas:string}[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async ()=>{
      const res = await apiCall('/api/guru/classes');
      setKelasOptions(res);
    })();
  }, []);

  const fetchData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Mohon pilih periode mulai dan akhir');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate 
      });
      if (selectedKelas && selectedKelas !== 'all') params.append('kelas_id', selectedKelas);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const res = await apiCall(`/api/guru/banding-absen-history?${params.toString()}`);
      setReportData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching banding absen history:', err);
      setError('Gagal memuat data riwayat banding absen');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const params = new URLSearchParams({ 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate 
      });
      if (selectedKelas && selectedKelas !== 'all') params.append('kelas_id', selectedKelas);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const url = `http://localhost:3001/api/export/riwayat-banding-absen?${params.toString()}`;
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengunduh file Excel');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `riwayat-banding-absen-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      link.click();
      
      toast({
        title: "Berhasil!",
        description: "File Excel berhasil diunduh"
      });
    } catch (err) {
      console.error('Error downloading Excel:', err);
      setError('Gagal mengunduh file Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Filter Laporan Riwayat Banding Absen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <Label className="text-sm font-medium">Periode Mulai</Label>
              <Input 
                type="date" 
                value={dateRange.startDate} 
                onChange={(e)=>setDateRange(p=>({...p,startDate:e.target.value}))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Periode Akhir</Label>
              <Input 
                type="date" 
                value={dateRange.endDate} 
                onChange={(e)=>setDateRange(p=>({...p,endDate:e.target.value}))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Kelas"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasOptions.map(k=> (<SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Status"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchData} disabled={loading} className="flex-1">
                <Search className="w-4 h-4 mr-2"/>
                {loading ? 'Memuat...' : 'Tampilkan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {reportData.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Riwayat Pengajuan Banding Absen
                </CardTitle>
                <Button onClick={downloadExcel} className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>NIS</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Tanggal Absen</TableHead>
                      <TableHead>Status Absen</TableHead>
                      <TableHead>Alasan Banding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Disetujui</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{item.nama_siswa}</TableCell>
                        <TableCell>{item.nis}</TableCell>
                        <TableCell>{item.nama_kelas}</TableCell>
                        <TableCell>{new Date(item.tanggal_absen).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.status_absen}</Badge>
                        </TableCell>
                        <TableCell>{item.alasan_banding}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.status === 'approved' ? 'default' : 
                                   item.status === 'rejected' ? 'destructive' : 'secondary'}
                          >
                            {item.status === 'approved' ? 'Disetujui' : 
                             item.status === 'rejected' ? 'Ditolak' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.tanggal_disetujui ? 
                            new Date(item.tanggal_disetujui).toLocaleDateString('id-ID') : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>{item.catatan || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Presensi Siswa SMK 13 Report View
const PresensiSiswaSMKN13View = ({ user }: { user: TeacherDashboardProps['userData'] }) => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [kelasOptions, setKelasOptions] = useState<{id:number, nama_kelas:string}[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async ()=>{
      const res = await apiCall('/api/guru/classes');
      setKelasOptions(res);
    })();
  }, []);

  const fetchData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Mohon pilih periode mulai dan akhir');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate 
      });
      if (selectedKelas && selectedKelas !== 'all') params.append('kelas_id', selectedKelas);
      
      const res = await apiCall(`/api/guru/presensi-siswa-smkn13?${params.toString()}`);
      setReportData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching presensi siswa SMKN 13:', err);
      setError('Gagal memuat data presensi siswa');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const params = new URLSearchParams({ 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate 
      });
      if (selectedKelas && selectedKelas !== 'all') params.append('kelas_id', selectedKelas);
      
      const url = `http://localhost:3001/api/export/presensi-siswa-smkn13?${params.toString()}`;
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengunduh file Excel');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `presensi-siswa-smkn13-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      link.click();
      
      toast({
        title: "Berhasil!",
        description: "File Excel berhasil diunduh"
      });
    } catch (err) {
      console.error('Error downloading Excel:', err);
      setError('Gagal mengunduh file Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Filter Laporan Presensi Siswa SMK 13
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-sm font-medium">Periode Mulai</Label>
              <Input 
                type="date" 
                value={dateRange.startDate} 
                onChange={(e)=>setDateRange(p=>({...p,startDate:e.target.value}))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Periode Akhir</Label>
              <Input 
                type="date" 
                value={dateRange.endDate} 
                onChange={(e)=>setDateRange(p=>({...p,endDate:e.target.value}))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Kelas"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasOptions.map(k=> (<SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchData} disabled={loading} className="flex-1">
                <Search className="w-4 h-4 mr-2"/>
                {loading ? 'Memuat...' : 'Tampilkan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {reportData.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Presensi Siswa SMK 13
                </CardTitle>
                <Button onClick={downloadExcel} className="bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Hari</TableHead>
                      <TableHead>Jam</TableHead>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Guru</TableHead>
                      <TableHead>Total Siswa</TableHead>
                      <TableHead>Hadir</TableHead>
                      <TableHead>Izin</TableHead>
                      <TableHead>Sakit</TableHead>
                      <TableHead>Alpa</TableHead>
                      <TableHead>Dispen</TableHead>
                      <TableHead>Presentase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((item, index) => {
                      const total = item.total_siswa || 0;
                      const hadir = item.hadir || 0;
                      const presentase = total > 0 ? ((hadir / total) * 100).toFixed(1) : '0.0';
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{item.hari}</TableCell>
                          <TableCell>{item.jam_mulai} - {item.jam_selesai}</TableCell>
                          <TableCell>{item.mata_pelajaran}</TableCell>
                          <TableCell>{item.nama_kelas}</TableCell>
                          <TableCell>{item.nama_guru}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{total}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-500">{item.hadir || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-yellow-500">{item.izin || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-orange-500">{item.sakit || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{item.alpa || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-purple-500">{item.dispen || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-100">
                              {presentase}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Rekap Ketidakhadiran Report View
const RekapKetidakhadiranView = ({ user }: { user: TeacherDashboardProps['userData'] }) => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [kelasOptions, setKelasOptions] = useState<{id:number, nama_kelas:string}[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [reportType, setReportType] = useState('bulanan'); // bulanan atau tahunan
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async ()=>{
      const res = await apiCall('/api/guru/classes');
      setKelasOptions(res);
    })();
  }, []);

  const fetchData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Mohon pilih periode mulai dan akhir');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate,
        reportType: reportType
      });
      if (selectedKelas && selectedKelas !== 'all') params.append('kelas_id', selectedKelas);
      
      const res = await apiCall(`/api/guru/rekap-ketidakhadiran?${params.toString()}`);
      setReportData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching rekap ketidakhadiran:', err);
      setError('Gagal memuat data rekap ketidakhadiran');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const params = new URLSearchParams({ 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate,
        reportType: reportType
      });
      if (selectedKelas && selectedKelas !== 'all') params.append('kelas_id', selectedKelas);
      
      const url = `http://localhost:3001/api/export/rekap-ketidakhadiran?${params.toString()}`;
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengunduh file Excel');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rekap-ketidakhadiran-${reportType}-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      link.click();
      
      toast({
        title: "Berhasil!",
        description: "File Excel berhasil diunduh"
      });
    } catch (err) {
      console.error('Error downloading Excel:', err);
      setError('Gagal mengunduh file Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Filter Laporan Rekap Ketidakhadiran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <Label className="text-sm font-medium">Periode Mulai</Label>
              <Input 
                type="date" 
                value={dateRange.startDate} 
                onChange={(e)=>setDateRange(p=>({...p,startDate:e.target.value}))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Periode Akhir</Label>
              <Input 
                type="date" 
                value={dateRange.endDate} 
                onChange={(e)=>setDateRange(p=>({...p,endDate:e.target.value}))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Kelas"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasOptions.map(k=> (<SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Jenis Laporan</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Jenis"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="tahunan">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchData} disabled={loading} className="flex-1">
                <Search className="w-4 h-4 mr-2"/>
                {loading ? 'Memuat...' : 'Tampilkan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {reportData.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Rekap Ketidakhadiran {reportType === 'bulanan' ? 'Bulanan' : 'Tahunan'}
                </CardTitle>
                <Button onClick={downloadExcel} className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Total Siswa</TableHead>
                      <TableHead>Hadir</TableHead>
                      <TableHead>Izin</TableHead>
                      <TableHead>Sakit</TableHead>
                      <TableHead>Alpa</TableHead>
                      <TableHead>Dispen</TableHead>
                      <TableHead>Total Absen</TableHead>
                      <TableHead>Presentase Hadir</TableHead>
                      <TableHead>Presentase Absen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((item, index) => {
                      const totalSiswa = item.total_siswa || 0;
                      const hadir = item.hadir || 0;
                      const totalAbsen = item.izin + item.sakit + item.alpa + item.dispen || 0;
                      const presentaseHadir = totalSiswa > 0 ? ((hadir / totalSiswa) * 100).toFixed(1) : '0.0';
                      const presentaseAbsen = totalSiswa > 0 ? ((totalAbsen / totalSiswa) * 100).toFixed(1) : '0.0';
                      
                      return (
                        <TableRow key={item.id || index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.periode}</TableCell>
                          <TableCell>{item.nama_kelas}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{totalSiswa}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-500">{hadir}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-yellow-500">{item.izin || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-orange-500">{item.sakit || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{item.alpa || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-purple-500">{item.dispen || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-100">{totalAbsen}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100">
                              {presentaseHadir}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-100">
                              {presentaseAbsen}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Teacher Reports View (summary per kelas & rentang tanggal)
const TeacherReportsView = ({ user }: { user: TeacherDashboardProps['userData'] }) => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [kelasOptions, setKelasOptions] = useState<{id:number, nama_kelas:string}[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async ()=>{
      const res = await apiCall('/api/guru/classes');
      setKelasOptions(res);
    })();
  }, []);

  const fetchData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Mohon pilih periode mulai dan akhir');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ startDate: dateRange.startDate, endDate: dateRange.endDate });
      if (selectedKelas && selectedKelas !== 'all') params.append('kelas_id', selectedKelas);
      const res = await apiCall(`/api/guru/attendance-summary?${params.toString()}`);
      setReportData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const params = new URLSearchParams({ startDate: dateRange.startDate, endDate: dateRange.endDate });
      if (selectedKelas && selectedKelas !== 'all') params.append('kelas_id', selectedKelas);
      const url = `http://localhost:3001/api/guru/download-attendance-excel?${params.toString()}`;
      const resp = await fetch(url, { credentials: 'include' });
      const blob = await resp.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `laporan-kehadiran-siswa-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      link.click();
    } catch (err) {
      console.error('Error downloading excel:', err);
      setError('Gagal mengunduh file Excel');
    }
  };

  const downloadSMKN13Format = async () => {
    try {
      const params = new URLSearchParams({ startDate: dateRange.startDate, endDate: dateRange.endDate });
      if (selectedKelas && selectedKelas !== 'all') params.append('kelas_id', selectedKelas);
      
      const url = `http://localhost:3001/api/export/ringkasan-kehadiran-siswa-smkn13?${params.toString()}`;
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengunduh file format SMKN 13');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `laporan-kehadiran-siswa-smkn13-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      link.click();
      
      toast({
        title: "Berhasil!",
        description: "File format SMKN 13 berhasil diunduh"
      });
    } catch (err) {
      console.error('Error downloading SMKN 13 format:', err);
      setError('Gagal mengunduh file format SMKN 13');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ringkasan Kehadiran Siswa</h1>
          <p className="text-gray-600">Download ringkasan kehadiran siswa dalam format Excel</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        </Card>
      )}

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-sm font-medium">Periode Mulai</Label>
              <Input 
                type="date" 
                value={dateRange.startDate} 
                onChange={(e)=>setDateRange(p=>({...p,startDate:e.target.value}))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Periode Akhir</Label>
              <Input 
                type="date" 
                value={dateRange.endDate} 
                onChange={(e)=>setDateRange(p=>({...p,endDate:e.target.value}))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Kelas"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasOptions.map(k=> (<SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchData} disabled={loading} className="flex-1">
                <Search className="w-4 h-4 mr-2"/>
                {loading ? 'Memuat...' : 'Tampilkan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData.length > 0 && (
        <div className="space-y-4">
          <ExcelPreview
            title="Ringkasan Kehadiran Siswa"
            data={reportData.map((record, index) => ({
              no: index + 1,
              nama: record.nama,
              nis: record.nis || '-',
              kelas: record.nama_kelas || '-',
              hadir: record.H || 0,
              izin: record.I || 0,
              sakit: record.S || 0,
              alpa: record.A || 0,
              dispen: record.D || 0,
              presentase: Number(record.presentase || 0).toFixed(2) + '%'
            }))}
            columns={[
              { key: 'no', label: 'No', width: 60, align: 'center', format: 'number' },
              { key: 'nama', label: 'Nama Siswa', width: 200, align: 'left' },
              { key: 'nis', label: 'NIS', width: 120, align: 'left' },
              { key: 'kelas', label: 'Kelas', width: 100, align: 'center' },
              { key: 'hadir', label: 'H', width: 80, align: 'center', format: 'number' },
              { key: 'izin', label: 'I', width: 80, align: 'center', format: 'number' },
              { key: 'sakit', label: 'S', width: 80, align: 'center', format: 'number' },
              { key: 'alpa', label: 'A', width: 80, align: 'center', format: 'number' },
              { key: 'dispen', label: 'D', width: 80, align: 'center', format: 'number' },
              { key: 'presentase', label: 'Presentase', width: 100, align: 'center', format: 'percentage' }
            ]}
            onExport={downloadExcel}
          />
          
          {/* SMK 13 Format Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Export Format SMK 13
              </CardTitle>
              <p className="text-sm text-gray-600">
                Download laporan dalam format resmi SMK Negeri 13 Bandung
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={downloadSMKN13Format}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Format SMK 13
                </Button>
                <div className="text-sm text-gray-500">
                  Format resmi dengan header sekolah dan styling profesional
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && reportData.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data laporan</h3>
            <p className="text-gray-600 text-center">Pilih periode dan kelas, lalu klik "Tampilkan" untuk melihat laporan kehadiran siswa</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
// Pengajuan Izin View for Teachers - to approve/reject student leave requests
const PengajuanIzinView = ({ user }: { user: TeacherDashboardProps['userData'] }) => {
  const [pengajuanList, setPengajuanList] = useState<PengajuanIzin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPending, setFilterPending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPending, setTotalPending] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const limit = 10; // Increased from 5 to 10 for better UX

  useEffect(() => {
    const fetchPengajuanIzin = async () => {
      try {
        setLoading(true);
        // Fetch pengajuan izin for this teacher to approve with pagination and filter
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
          filter_pending: filterPending.toString()
        });
        
        const response = await apiCall(`/api/guru/${user.guru_id || user.id}/pengajuan-izin?${params}`);
        
        if (response && typeof response === 'object') {
          setPengajuanList(response.data || []);
          setTotalPages(response.totalPages || 1);
          setTotalPending(response.totalPending || 0);
          setTotalAll(response.totalAll || 0);
        } else {
          setPengajuanList(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        console.error('Error fetching pengajuan izin:', error);
        toast({ 
          title: "Error", 
          description: "Gagal memuat data pengajuan izin", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPengajuanIzin();
  }, [user.guru_id, user.id, currentPage, filterPending]);

  const handleFilterToggle = () => {
    setFilterPending(!filterPending);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleApprovePengajuan = async (pengajuanId: number, status: 'disetujui' | 'ditolak', catatan: string = '') => {
    try {
      await apiCall(`/api/pengajuan-izin/${pengajuanId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status_persetujuan: status, 
          catatan_guru: catatan,
          disetujui_oleh: user.guru_id || user.id
        }),
      });

      toast({ 
        title: "Berhasil!", 
        description: `Pengajuan izin berhasil ${status}` 
      });
      
      // Refresh the list by refetching data
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        filter_pending: filterPending.toString()
      });
      
      const response = await apiCall(`/api/guru/${user.guru_id || user.id}/pengajuan-izin?${params}`);
      
      if (response && typeof response === 'object') {
        setPengajuanList(response.data || []);
        setTotalPages(response.totalPages || 1);
        setTotalPending(response.totalPending || 0);
        setTotalAll(response.totalAll || 0);
      }
    } catch (error) {
      console.error('Error updating pengajuan izin:', error);
      toast({ 
        title: "Error", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pengajuan Izin Siswa
            </CardTitle>
            <div className="text-sm text-gray-600">
              Halaman {currentPage} dari {totalPages}
            </div>
          </div>
          
          {/* Filter Section */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Total: {totalAll}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">Belum di-acc: {totalPending}</span>
              </div>
              {filterPending && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Menampilkan: Belum di-acc</span>
                </div>
              )}
            </div>
            
            <Button
              variant={filterPending ? "default" : "outline"}
              size="sm"
              onClick={handleFilterToggle}
              className={filterPending ? "bg-orange-600 hover:bg-orange-700 text-white" : "border-orange-300 text-orange-600 hover:bg-orange-50"}
            >
              {filterPending ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Tampilkan Semua
                </>
              ) : (
                <>
                  <Filter className="w-4 h-4 mr-2" />
                  Filter Belum di-acc ({totalPending})
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-32 rounded"></div>
            ))}
          </div>
        ) : pengajuanList.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada pengajuan izin</h3>
            <p className="text-gray-600">Belum ada pengajuan izin dari siswa yang perlu disetujui</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pengajuanList.map((pengajuan) => (
              <div key={pengajuan.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{pengajuan.nama_siswa}</h4>
                    <p className="text-sm text-gray-600">
                      NIS: {pengajuan.nis} - Kelas: {pengajuan.nama_kelas}
                    </p>
                                          <p className="text-xs text-gray-500">
                        Diajukan: {formatDateTime24(pengajuan.tanggal_pengajuan, true)}
                      </p>
                  </div>
                  <Badge 
                    variant={
                      pengajuan.status_persetujuan === 'disetujui' ? 'default' : 
                      pengajuan.status_persetujuan === 'ditolak' ? 'destructive' : 'secondary'
                    }
                  >
                    {pengajuan.status_persetujuan === 'pending' ? 'Menunggu Persetujuan' :
                     pengajuan.status_persetujuan === 'disetujui' ? 'Disetujui' : 'Ditolak'}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tanggal Mulai:</span>
                      <p className="text-gray-600">{new Date(pengajuan.tanggal_mulai).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Tanggal Selesai:</span>
                      <p className="text-gray-600">{new Date(pengajuan.tanggal_selesai).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Jenis Izin:</span>
                    <p className="text-gray-600">{pengajuan.jenis_izin}</p>
                  </div>
                  <div>
                    <span className="font-medium">Alasan:</span>
                    <p className="text-gray-600">{pengajuan.alasan}</p>
                  </div>
                  {pengajuan.catatan_guru && (
                    <div>
                      <span className="font-medium">Catatan Guru:</span>
                      <p className="text-gray-600">{pengajuan.catatan_guru}</p>
                    </div>
                  )}
                </div>

                {pengajuan.status_persetujuan === 'pending' && (
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Setujui
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Setujui Pengajuan Izin</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Pengajuan dari: <strong>{pengajuan.nama_siswa}</strong></p>
                            <p className="text-sm text-gray-600">Jenis: {pengajuan.jenis_izin}</p>
                            <p className="text-sm text-gray-600">Periode: {new Date(pengajuan.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(pengajuan.tanggal_selesai).toLocaleDateString('id-ID')}</p>
                          </div>
                          <Textarea 
                            placeholder="Catatan persetujuan (opsional)" 
                            id={`approve-note-${pengajuan.id}`}
                          />
                          <Button 
                            onClick={() => {
                              const textarea = document.getElementById(`approve-note-${pengajuan.id}`) as HTMLTextAreaElement;
                              handleApprovePengajuan(pengajuan.id, 'disetujui', textarea.value);
                            }}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            Setujui Pengajuan Izin
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <X className="w-4 h-4 mr-1" />
                          Tolak
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tolak Pengajuan Izin</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Pengajuan dari: <strong>{pengajuan.nama_siswa}</strong></p>
                            <p className="text-sm text-gray-600">Jenis: {pengajuan.jenis_izin}</p>
                          </div>
                          <Textarea 
                            placeholder="Alasan penolakan (wajib)" 
                            id={`reject-note-${pengajuan.id}`}
                            required
                          />
                          <Button 
                            onClick={() => {
                              const textarea = document.getElementById(`reject-note-${pengajuan.id}`) as HTMLTextAreaElement;
                              if (textarea.value.trim()) {
                                handleApprovePengajuan(pengajuan.id, 'ditolak', textarea.value);
                              } else {
                                toast({ title: "Error", description: "Alasan penolakan harus diisi", variant: "destructive" });
                              }
                            }}
                            variant="destructive"
                            className="w-full"
                          >
                            Tolak Pengajuan Izin
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && pengajuanList.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Menampilkan {pengajuanList.length} dari {filterPending ? totalPending : totalAll} pengajuan
              {filterPending && (
                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                  Filter: Belum di-acc
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={currentPage === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Banding Absen View for Teachers - to process student attendance appeals
const BandingAbsenView = ({ user }: { user: TeacherDashboardProps['userData'] }) => {
  const [bandingList, setBandingList] = useState<BandingAbsenTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPending, setFilterPending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPending, setTotalPending] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const limit = 5;

  useEffect(() => {
    const fetchBandingAbsen = async () => {
      try {
        setLoading(true);
        // Fetch banding absen for this teacher to process with pagination and filter
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
          filter_pending: filterPending.toString()
        });
        
        const response = await apiCall(`/api/guru/${user.guru_id || user.id}/banding-absen?${params}`);
        
        if (response && typeof response === 'object') {
          setBandingList(response.data || []);
          setTotalPages(response.totalPages || 1);
          setTotalPending(response.totalPending || 0);
          setTotalAll(response.totalAll || 0);
        } else {
          setBandingList(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        console.error('Error fetching banding absen:', error);
        toast({ 
          title: "Error", 
          description: "Gagal memuat data banding absen", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBandingAbsen();
  }, [user.guru_id, user.id, currentPage, filterPending]);

  const handleFilterToggle = () => {
    setFilterPending(!filterPending);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleBandingResponse = async (bandingId: number, status: 'disetujui' | 'ditolak', catatan: string = '') => {
    try {
      await apiCall(`/api/banding-absen/${bandingId}/respond`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status_banding: status, 
          catatan_guru: catatan,
          diproses_oleh: user.guru_id || user.id
        }),
      });

      toast({ 
        title: "Berhasil!", 
        description: `Banding absen berhasil ${status}` 
      });
      
      // Refresh the list by refetching data
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        filter_pending: filterPending.toString()
      });
      
      const response = await apiCall(`/api/guru/${user.guru_id || user.id}/banding-absen?${params}`);
      
      if (response && typeof response === 'object') {
        setBandingList(response.data || []);
        setTotalPages(response.totalPages || 1);
        setTotalPending(response.totalPending || 0);
        setTotalAll(response.totalAll || 0);
      }
    } catch (error) {
      console.error('Error responding to banding absen:', error);
      toast({ 
        title: "Error", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Pengajuan Banding Absen
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Total: {totalAll} | Belum di-acc: {totalPending}
            </div>
            <Button
              variant={filterPending ? "default" : "outline"}
              size="sm"
              onClick={handleFilterToggle}
              className={filterPending ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {filterPending ? (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Tampilkan Semua
                </>
              ) : (
                <>
                  <Filter className="w-4 h-4 mr-1" />
                  Belum di-acc ({totalPending})
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-32 rounded"></div>
            ))}
          </div>
        ) : bandingList.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada banding absen</h3>
            <p className="text-gray-600">Belum ada pengajuan banding absen dari siswa yang perlu diproses</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bandingList.map((banding) => (
              <div key={banding.id_banding} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{banding.nama_siswa}</h4>
                    <p className="text-sm text-gray-600">
                      NIS: {banding.nis} - Kelas: {banding.nama_kelas}
                    </p>
                    <p className="text-xs text-gray-500">
                      Diajukan: {formatDateTime24(banding.tanggal_pengajuan, true)}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      banding.status_banding === 'disetujui' ? 'default' : 
                      banding.status_banding === 'ditolak' ? 'destructive' : 'secondary'
                    }
                  >
                    {banding.status_banding === 'pending' ? 'Menunggu Proses' :
                     banding.status_banding === 'disetujui' ? 'Disetujui' : 'Ditolak'}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tanggal Absen:</span>
                      <p className="text-gray-600">{new Date(banding.tanggal_absen).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Mata Pelajaran:</span>
                      <p className="text-gray-600">{banding.nama_mapel}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status Tercatat:</span>
                      <Badge variant="outline" className="capitalize ml-2">
                        {banding.status_asli}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Status Diajukan:</span>
                      <Badge variant="outline" className="capitalize ml-2">
                        {banding.status_diajukan}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Alasan Banding:</span>
                    <p className="text-gray-600">{banding.alasan_banding}</p>
                  </div>
                  {banding.catatan_guru && (
                    <div>
                      <span className="font-medium">Catatan Guru:</span>
                      <p className="text-gray-600">{banding.catatan_guru}</p>
                    </div>
                  )}
                </div>

                {banding.status_banding === 'pending' && (
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 w-4 mr-1" />
                          Setujui
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Setujui Banding Absen</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Banding dari: <strong>{banding.nama_siswa}</strong></p>
                            <p className="text-sm text-gray-600">Status: {banding.status_asli} → {banding.status_diajukan}</p>
                            <p className="text-sm text-gray-600">Tanggal: {new Date(banding.tanggal_absen).toLocaleDateString('id-ID')}</p>
                          </div>
                          <Textarea 
                            placeholder="Catatan persetujuan (opsional)" 
                            id={`approve-banding-${banding.id_banding}`}
                          />
                          <Button 
                            onClick={() => {
                              const textarea = document.getElementById(`approve-banding-${banding.id_banding}`) as HTMLTextAreaElement;
                              handleBandingResponse(banding.id_banding, 'disetujui', textarea.value);
                            }}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            Setujui Banding Absen
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <X className="w-4 h-4 mr-1" />
                          Tolak
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tolak Banding Absen</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Banding dari: <strong>{banding.nama_siswa}</strong></p>
                            <p className="text-sm text-gray-600">Status: {banding.status_asli} → {banding.status_diajukan}</p>
                          </div>
                          <Textarea 
                            placeholder="Alasan penolakan (wajib)" 
                            id={`reject-banding-${banding.id_banding}`}
                            required
                          />
                          <Button 
                            onClick={() => {
                              const textarea = document.getElementById(`reject-banding-${banding.id_banding}`) as HTMLTextAreaElement;
                              if (textarea.value.trim()) {
                                handleBandingResponse(banding.id_banding, 'ditolak', textarea.value);
                              } else {
                                toast({ title: "Error", description: "Alasan penolakan harus diisi", variant: "destructive" });
                              }
                            }}
                            variant="destructive"
                            className="w-full"
                          >
                            Tolak Banding Absen
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && bandingList.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Halaman {currentPage} dari {totalPages} 
              {filterPending ? ` (${totalPending} belum di-acc)` : ` (${totalAll} total)`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={currentPage === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// History View
const HistoryView = ({ user }: { user: TeacherDashboardProps['userData'] }) => {
  const [historyData, setHistoryData] = useState<HistoryData>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDays, setTotalDays] = useState(0);
  const limit = 7; // 7 hari kebelakang

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Gunakan endpoint dengan pagination: /api/guru/student-attendance-history
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString()
        });
        
        const res = await apiCall(`/api/guru/student-attendance-history?${params}`);
        console.log('📊 Raw response from API:', res);
        
        let flat: Array<FlatHistoryRow>;
        let totalDaysCount = 0;
        
        if (res && typeof res === 'object' && res.data) {
          flat = res.data;
          totalDaysCount = res.totalDays || 0;
          setTotalPages(res.totalPages || 1);
          setTotalDays(totalDaysCount);
        } else {
          flat = Array.isArray(res) ? res : [];
          // Fallback: hitung total days dari data yang ada
          const uniqueDates = new Set(flat.map(row => new Date(row.tanggal).toISOString().split('T')[0]));
          totalDaysCount = uniqueDates.size;
          setTotalPages(Math.ceil(totalDaysCount / limit));
          setTotalDays(totalDaysCount);
        }
        
        console.log('📊 Flattened data:', flat);

        const normalizeStatus = (s: string): AttendanceStatus => {
          const v = (s || '').toLowerCase();
          if (v === 'hadir') return 'Hadir';
          if (v === 'izin') return 'Izin';
          if (v === 'dispen') return 'Dispen';
          if (v === 'sakit') return 'Sakit';
          if (v === 'alpa' || v === 'tidak hadir' || v === 'absen') return 'Alpa';
          return 'Lain';
        };

        // Bentuk ulang menjadi HistoryData terkelompok per tanggal dan kelas
        const grouped: HistoryData = {};
        flat.forEach((row) => {
          console.log('📊 Processing row:', row);
          const dateKey = new Date(row.tanggal).toISOString().split('T')[0];
          if (!grouped[dateKey]) grouped[dateKey] = {};
          const classKey = `${row.nama_mapel} - ${row.nama_kelas}`;
          if (!grouped[dateKey][classKey]) {
            grouped[dateKey][classKey] = {
              kelas: row.nama_kelas,
              mata_pelajaran: row.nama_mapel,
              jam: `${row.jam_mulai} - ${row.jam_selesai}`,
              hari: new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date(row.tanggal)),
              siswa: [],
            };
          }
          grouped[dateKey][classKey].siswa.push({
            nama: row.nama_siswa,
            nis: row.nis,
            status: normalizeStatus(String(row.status_kehadiran)),
            waktu_absen: row.waktu_absen,
            alasan: row.keterangan || undefined,
          });
        });

        console.log('📊 Grouped data:', grouped);
        setHistoryData(grouped);
      } catch (error) {
        console.error('Error fetching history:', error);
        toast({ 
          title: "Error", 
          description: "Gagal memuat riwayat absensi", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user.guru_id, user.id, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Absensi
          </CardTitle>
          {!loading && totalDays > 0 && (
            <div className="text-sm text-gray-600">
              Total: {totalDays} hari | Halaman {currentPage} dari {totalPages}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-32 rounded"></div>
            ))}
          </div>
        ) : Object.keys(historyData).length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada riwayat</h3>
            <p className="text-gray-600">Riwayat absensi akan muncul setelah Anda mengambil absensi</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(historyData)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, classes]) => (
              <div key={date} className="border-b pb-4 last:border-b-0">
                <h4 className="font-medium mb-3">
                  {new Date(date).toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <div className="space-y-3">
                  {Object.values(classes).map((classData, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium">{classData.mata_pelajaran}</h5>
                          <p className="text-sm text-gray-600">{classData.kelas}</p>
                          <p className="text-xs text-gray-500">{classData.jam}</p>
                        </div>
                        <Badge variant="outline">{classData.siswa.length} siswa</Badge>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Keterangan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {console.log('📊 Rendering siswa for class:', classData.mata_pelajaran, 'siswa count:', classData.siswa.length)}
                          {classData.siswa.map((siswa, siswaIndex) => {
                            console.log('📊 Rendering siswa:', siswaIndex, siswa);
                            return (
                              <TableRow key={siswaIndex}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{siswa.nama || 'Nama tidak tersedia'}</p>
                                  {siswa.nis && (
                                    <p className="text-xs text-gray-500">NIS: {siswa.nis}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    siswa.status === 'Hadir' ? 'default' :
                                    siswa.status === 'Izin' || siswa.status === 'Sakit' ? 'secondary' :
                                    siswa.status === 'Dispen' ? 'outline' :
                                    'destructive'
                                  }
                                  className={
                                    siswa.status === 'Dispen' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''
                                  }
                                >
                                  {siswa.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {siswa.waktu_absen ? (
                                  <span className="text-sm">
                                    {formatTime24(siswa.waktu_absen)}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {siswa.alasan ? (
                                  <span className="text-sm text-gray-600">{siswa.alasan}</span>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && Object.keys(historyData).length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Menampilkan {Object.keys(historyData).length} hari dari {totalDays} total
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={currentPage === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main TeacherDashboard Component
export const TeacherDashboard = ({ userData, onLogout }: TeacherDashboardProps) => {
  const [activeView, setActiveView] = useState<'schedule' | 'history' | 'pengajuan-izin' | 'banding-absen' | 'reports'>('schedule');
  const [activeReportView, setActiveReportView] = useState<string | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = userData;

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    if (!user.guru_id && !user.id) return;
    try {
      setIsLoading(true);
      // Gunakan endpoint backend yang tersedia: /api/guru/jadwal (auth user diambil dari token)
      const res = await apiCall(`/api/guru/jadwal`);
      const list: Schedule[] = Array.isArray(res) ? res : (res.data || []);

      // Filter hanya jadwal hari ini dan hitung status berdasar waktu sekarang
      const todayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
      const todayList = (list as RawSchedule[]).filter((s) => (s.hari || '').toLowerCase() === todayName.toLowerCase());

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const schedulesWithStatus = todayList.map((schedule: RawSchedule) => {
        const [startHour, startMinute] = String(schedule.jam_mulai).split(':').map(Number);
        const [endHour, endMinute] = String(schedule.jam_selesai).split(':').map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        let status: ScheduleStatus;
        if (currentTime < startTime) status = 'upcoming';
        else if (currentTime <= endTime) status = 'current';
        else status = 'completed';

        return {
          id: schedule.id ?? schedule.id_jadwal ?? schedule.jadwal_id ?? 0,
          nama_mapel: schedule.nama_mapel ?? schedule.mapel ?? '',
          hari: schedule.hari,
          jam_mulai: schedule.jam_mulai,
          jam_selesai: schedule.jam_selesai,
          nama_kelas: schedule.nama_kelas ?? schedule.kelas ?? '',
          status,
        } as Schedule;
      });

      setSchedules(schedulesWithStatus);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({ title: 'Error', description: 'Gagal memuat jadwal', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user.guru_id, user.id]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-xl transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-16'
      } lg:w-64 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`flex items-center space-x-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="p-2 rounded-lg">
              <img src="/logo.png" alt="ABSENTA Logo" className="h-12 w-12" />
            </div>
            {(sidebarOpen || window.innerWidth >= 1024) && (
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
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
            variant={activeView === 'schedule' ? "default" : "ghost"}
            className={`w-full justify-start ${sidebarOpen || window.innerWidth >= 1024 ? '' : 'px-2'}`}
            onClick={() => {setActiveView('schedule'); setSidebarOpen(false);}}
          >
            <Clock className="h-4 w-4" />
            {(sidebarOpen || window.innerWidth >= 1024) && <span className="ml-2">Jadwal Hari Ini</span>}
          </Button>
          <Button
            variant={activeView === 'pengajuan-izin' ? "default" : "ghost"}
            className={`w-full justify-start ${sidebarOpen || window.innerWidth >= 1024 ? '' : 'px-2'}`}
            onClick={() => {setActiveView('pengajuan-izin'); setSidebarOpen(false);}}
          >
            <FileText className="h-4 w-4" />
            {(sidebarOpen || window.innerWidth >= 1024) && <span className="ml-2">Pengajuan Izin</span>}
          </Button>
          <Button
            variant={activeView === 'banding-absen' ? "default" : "ghost"}
            className={`w-full justify-start ${sidebarOpen || window.innerWidth >= 1024 ? '' : 'px-2'}`}
            onClick={() => {setActiveView('banding-absen'); setSidebarOpen(false);}}
          >
            <MessageCircle className="h-4 w-4" />
            {(sidebarOpen || window.innerWidth >= 1024) && <span className="ml-2">Banding Absen</span>}
          </Button>
          <Button
            variant={activeView === 'history' ? "default" : "ghost"}
            className={`w-full justify-start ${sidebarOpen || window.innerWidth >= 1024 ? '' : 'ml-2'}`}
            onClick={() => {setActiveView('history'); setSidebarOpen(false);}}
          >
            <History className="h-4 w-4" />
            {(sidebarOpen || window.innerWidth >= 1024) && <span className="ml-2">Riwayat Absensi</span>}
          </Button>
          <Button
            variant={activeView === 'reports' ? "default" : "ghost"}
            className={`w-full justify-start ${sidebarOpen || window.innerWidth >= 1024 ? '' : 'px-2'}`}
            onClick={() => {setActiveView('reports'); setSidebarOpen(false);}}
          >
            <ClipboardList className="h-4 w-4" />
            {(sidebarOpen || window.innerWidth >= 1024) && <span className="ml-2">Laporan</span>}
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
          
          <div className={`flex items-center space-x-3 mb-3 ${sidebarOpen || window.innerWidth >= 1024 ? '' : 'justify-center'}`}>
            <div className="bg-emerald-100 p-2 rounded-full">
              <Settings className="h-4 w-4 text-emerald-600" />
            </div>
            {(sidebarOpen || window.innerWidth >= 1024) && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user.nama}</p>
                <p className="text-xs text-gray-500">Guru</p>
              </div>
            )}
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className={`w-full ${sidebarOpen || window.innerWidth >= 1024 ? '' : 'px-2'}`}
          >
            <LogOut className="h-4 w-4" />
            {(sidebarOpen || window.innerWidth >= 1024) && <span className="ml-2">Keluar</span>}
          </Button>
        </div>
      </div>

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
            <h1 className="text-xl font-bold">Dashboard Guru</h1>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Dashboard Guru
              </h1>
              <p className="text-gray-600 mt-2">Selamat datang, {user.username}!</p>
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
          {activeSchedule ? (
            <AttendanceView 
              schedule={activeSchedule} 
              user={user}
              onBack={() => setActiveSchedule(null)} 
            />
          ) : activeView === 'schedule' ? (
            <ScheduleListView 
              schedules={schedules.filter(s => s.hari === new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date()))} 
              onSelectSchedule={setActiveSchedule} 
              isLoading={isLoading}
            />
          ) : activeView === 'pengajuan-izin' ? (
            <PengajuanIzinView user={user} />
          ) : activeView === 'banding-absen' ? (
            <BandingAbsenView user={user} />
          ) : activeView === 'reports' ? (
            <LaporanKehadiranSiswaView user={user} />
          ) : (
            <HistoryView user={user} />
          )}
        </div>
      </div>
      
      {/* Floating Font Size Control for Mobile */}
      <FontSizeControl variant="floating" className="lg:hidden" />
    </div>
  );
};
