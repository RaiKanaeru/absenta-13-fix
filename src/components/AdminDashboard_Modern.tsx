import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { formatTime24WithSeconds, formatDateTime24 } from "@/lib/time-utils";
import { FontSizeControl } from "@/components/ui/font-size-control";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ErrorBoundary from "./ErrorBoundary";
import BackupManagementView from "./BackupManagementView";
import LoadBalancerView from "./LoadBalancerView";
import MonitoringDashboard from "./MonitoringDashboard";
import SchedulePreviewGrid from "./SchedulePreviewGrid";
import SimpleRestoreView from "./SimpleRestoreView";
import RuangKelasManagement from "./RuangKelasManagement";
import { printReport } from "../utils/printLayouts";
import ExcelPreview from './ExcelPreview';
// import ReportHeader from './ReportHeader';
import PresensiSiswaView from './PresensiSiswaView';
import RekapKetidakhadiranView from './RekapKetidakhadiranView';
import RekapKetidakhadiranGuruView from './RekapKetidakhadiranGuruView';
import ExcelImportView from './ExcelImportView';
import JadwalAdvancedImportView from './JadwalAdvancedImportView';
import { VIEW_TO_REPORT_KEY } from '../utils/reportKeys';
import { EditProfile } from './EditProfile';
import ReportLetterheadSettings from './ReportLetterheadSettings';
import { ensureArray, normalizeList, getSelectValue, hasValidId } from '../utils/normalize';
import { httpGet, handleResponseError } from '../utils/http';
import { 
  UserPlus, BookOpen, Calendar, BarChart3, LogOut, ArrowLeft, ArrowRight, Users, GraduationCap, 
  Eye, Download, FileText, Edit, Trash2, Plus, Search, Filter, Settings, Bell, Menu, X,
  TrendingUp, BookPlus, Home, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, MessageCircle, ClipboardList,
  Database, Archive, Activity, Server, Monitor, Shield, RefreshCw, ArrowUpCircle, User, FileText as FileTextIcon, Building,
  Info, Loader2, MapPin
} from "lucide-react";

// Utility function for API calls with consistent error handling
const apiCall = async (url: string, options: RequestInit = {}, onLogout?: () => void) => {
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

// Types
interface Teacher {
  id: number;
  nip: string;
  nama: string;
  username: string;
  user_username?: string;
  user_email?: string;
  email?: string;
  alamat?: string;
  no_telp?: string;
  jenis_kelamin: 'L' | 'P';
  status: 'aktif' | 'nonaktif';
  mata_pelajaran?: string;
  mapel_id?: number;
  nama_mapel?: string;
}

interface TeacherData {
  id: number;
  nip: string;
  nama: string;
  email?: string;
  mata_pelajaran?: string;
  mapel_id?: number;
  nama_mapel?: string;
  alamat?: string;
  no_telp?: string;
  jenis_kelamin: 'L' | 'P';
  status: 'aktif' | 'nonaktif';
  username?: string;
}

interface Student {
  id: number;
  id_siswa: number;
  nis: string;
  nama: string;
  kelas_id: number;
  nama_kelas: string;
  username?: string;
  email?: string;
  jenis_kelamin: 'L' | 'P';
  jabatan?: string;
  status: 'aktif' | 'nonaktif';
  alamat?: string;
  telepon_orangtua?: string;
  telepon_siswa?: string;
}

interface StudentFormData {
  nama: string;
  username: string;
  password: string;
  nis: string;
  kelas_id: string;
  jabatan: string;
  jenis_kelamin: string;
  email: string;
  alamat: string;
  telepon_orangtua: string;
  telepon_siswa: string;
  status: 'aktif' | 'nonaktif';
}

interface StudentData {
  id: number;
  id_siswa: number;
  user_id: number;
  username: string;
  nis: string;
  nama: string;
  kelas_id: number;
  nama_kelas?: string;
  tingkat?: string;
  jabatan?: string;
  jenis_kelamin: 'L' | 'P';
  email?: string;
  alamat?: string;
  telepon_orangtua?: string;
  telepon_siswa?: string;
  status: 'aktif' | 'nonaktif' | 'lulus' | 'pindah' | 'alumni' | 'keluar';
  account_username?: string;
  account_status?: string;
}

interface Subject {
  id: number;
  kode_mapel: string;
  nama_mapel: string;
  deskripsi?: string;
  status: 'aktif' | 'nonaktif';
}

interface Kelas {
  id: number;
  id_kelas?: number;
  nama_kelas: string;
  tingkat?: string;
  ruang?: string;
  kode_ruang?: string;
  status?: 'aktif' | 'nonaktif';
}

interface Room {
  id: number;
  nama_ruang: string;
  kode_ruang: string;
  kapasitas: number;
  lokasi: string;
  status: 'aktif' | 'nonaktif';
  created_at?: string;
}

interface Schedule {
  id: number;
  kelas_id: number;
  mapel_id: number;
  guru_id: number;
  ruang_id?: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  jam_ke?: number;
  nama_kelas: string;
  nama_mapel: string;
  nama_guru: string;
  nama_ruang?: string;
  kode_ruang?: string;
  has_conflict?: boolean;
}

interface LiveData {
  ongoing_classes: Array<{
    id?: number;
    kelas: string;
    guru: string;
    mapel: string;
    jam: string;
    nama_kelas?: string;
    nama_mapel?: string;
    nama_guru?: string;
    jam_mulai?: string;
    jam_selesai?: string;
    absensi_diambil?: number;
  }>;
  overall_attendance_percentage?: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const menuItems = [
  { id: 'add-teacher', title: 'Tambah Akun Guru', icon: UserPlus, description: 'Kelola akun guru', gradient: 'from-blue-500 to-blue-700' },
  { id: 'add-student', title: 'Tambah Akun Siswa', icon: UserPlus, description: 'Kelola akun siswa perwakilan', gradient: 'from-green-500 to-green-700' },
  { id: 'add-teacher-data', title: 'Data Guru', icon: GraduationCap, description: 'Input dan kelola data guru', gradient: 'from-purple-500 to-purple-700' },
  { id: 'add-student-data', title: 'Data Siswa', icon: Users, description: 'Input dan kelola data siswa lengkap', gradient: 'from-orange-500 to-orange-700' },
  { id: 'student-promotion', title: 'Naik Kelas', icon: ArrowUpCircle, description: 'Kelola kenaikan kelas siswa', gradient: 'from-emerald-500 to-emerald-700' },
  { id: 'add-subject', title: 'Mata Pelajaran', icon: BookOpen, description: 'Kelola mata pelajaran', gradient: 'from-red-500 to-red-700' },
  { id: 'add-class', title: 'Kelas', icon: Home, description: 'Kelola kelas', gradient: 'from-indigo-500 to-indigo-700' },
  { id: 'room-management', title: 'Ruang Kelas', icon: Building, description: 'Kelola ruang kelas dan alokasi', gradient: 'from-yellow-500 to-yellow-700' },
  { id: 'add-schedule', title: 'Jadwal', icon: Calendar, description: 'Atur jadwal pelajaran', gradient: 'from-teal-500 to-teal-700' },
  { id: 'backup-management', title: 'Backup & Archive', icon: Database, description: 'Kelola backup dan arsip data', gradient: 'from-cyan-500 to-cyan-700' },
  { id: 'load-balancer', title: 'Load Balancer', icon: Activity, description: 'Monitoring performa sistem', gradient: 'from-emerald-500 to-emerald-700' },
  { id: 'monitoring', title: 'System Monitoring', icon: Monitor, description: 'Real-time monitoring & alerting', gradient: 'from-violet-500 to-violet-700' },
  { id: 'disaster-recovery', title: 'Restorasi Backup', icon: Shield, description: 'Restorasi dan pemulihan backup', gradient: 'from-amber-500 to-amber-700' },
  { id: 'letterhead-settings', title: 'Kop Laporan', icon: FileTextIcon, description: 'Kelola header/kop untuk semua laporan', gradient: 'from-slate-500 to-slate-700' },
  { id: 'reports', title: 'Laporan', icon: BarChart3, description: 'Pemantau siswa & guru live', gradient: 'from-pink-500 to-pink-700' }
];

// ManageTeacherAccountsView Component
const ManageTeacherAccountsView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [formData, setFormData] = useState({ 
    nama: '', 
    username: '', 
    password: '', 
    nip: '', 
    mapel_id: '', 
    no_telp: '', 
    alamat: '', 
    jenis_kelamin: '', 
    email: '' 
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      console.log('🔄 Fetching teachers data...');
      // Add cache busting parameter
      const timestamp = Date.now();
      const response = await apiCall(`/api/admin/guru?t=${timestamp}`, {}, onLogout);
      console.log('📊 Teachers data received:', response);
      
      // Handle different response formats
      let teachersData;
      if (response.success && response.data) {
        teachersData = response.data;
      } else if (Array.isArray(response)) {
        teachersData = response;
      } else {
        teachersData = [];
      }
      
      // Ensure teachersData is an array
      const teachersArray = Array.isArray(teachersData) ? teachersData : [];
      console.log('📊 Processed teachers data:', teachersArray.length, 'teachers');
      console.log('📊 Sample teacher data:', teachersArray[0]);
      setTeachers(teachersArray);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({ title: "Error memuat data guru", description: error.message, variant: "destructive" });
      setTeachers([]);
    }
  }, [onLogout]);

  const fetchSubjects = useCallback(async () => {
    try {
      // Add cache busting parameter
      const timestamp = Date.now();
      const response = await apiCall(`/api/admin/mapel?t=${timestamp}`, {}, onLogout);
      // Handle response format: { success: true, data: { success: true, data: [...] } }
      const subjects = response.data?.data || response.data || response;
      setSubjects(Array.isArray(subjects) ? subjects : []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      // Don't show error toast for subjects as it's not critical
    }
  }, [onLogout]);

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, [fetchTeachers, fetchSubjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi client-side
    if (!formData.nama || !formData.username || !formData.nip) {
      toast({ title: "Error", description: "Nama, username, dan NIP wajib diisi!", variant: "destructive" });
      return;
    }

    if (!editingId && !formData.password) {
      toast({ title: "Error", description: "Password wajib diisi untuk akun baru!", variant: "destructive" });
      return;
    }

    // Validasi format NIP
    if (!/^\d{10,20}$/.test(formData.nip)) {
      toast({ title: "Error", description: "NIP harus berupa angka 10-20 digit!", variant: "destructive" });
      return;
    }

    // Validasi format username
    if (!/^[a-zA-Z0-9._-]{4,32}$/.test(formData.username)) {
      toast({ title: "Error", description: "Username harus 4-32 karakter, hanya huruf, angka, titik, underscore, dan strip!", variant: "destructive" });
      return;
    }

    // Validasi format email jika diisi
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: "Error", description: "Format email tidak valid!", variant: "destructive" });
      return;
    }

    // Validasi format telepon jika diisi
    if (formData.no_telp && !/^[\d+]{1,20}$/.test(formData.no_telp)) {
      toast({ title: "Error", description: "Nomor telepon harus berupa angka dan plus, maksimal 20 karakter!", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const url = editingId ? `/api/admin/guru/${editingId}` : '/api/admin/guru';
      const method = editingId ? 'PUT' : 'POST';
      
      const submitData = {
        nip: formData.nip,
        nama: formData.nama,
        username: formData.username,
        password: formData.password,
        email: formData.email,
        mapel_id: formData.mapel_id ? parseInt(formData.mapel_id) : null,
        no_telp: formData.no_telp,
        alamat: formData.alamat,
        jenis_kelamin: formData.jenis_kelamin,
        status: 'aktif'
      };

      console.log('📤 Sending teacher update data:', submitData);
      console.log('🔗 URL:', url, 'Method:', method);

      const response = await apiCall(url, {
        method,
        body: JSON.stringify(submitData),
      }, onLogout);

      console.log('📥 Server response:', response);

      toast({ title: editingId ? "Akun guru berhasil diupdate!" : "Akun guru berhasil ditambahkan!" });
      setFormData({ 
        nama: '', username: '', password: '', nip: '', mapel_id: '', 
        no_telp: '', alamat: '', jenis_kelamin: '', email: '' 
      });
      setEditingId(null);
      setDialogOpen(false);
      
      // Force refresh data dengan delay untuk memastikan backend sudah ter-update
      console.log('🔄 Refreshing teachers data after update...');
      
      // Reset state first
      setTeachers([]);
      
      // Immediate refresh
      fetchTeachers();
      
      // Additional refresh after 1 second
      setTimeout(() => {
        console.log('🔄 First refresh after 1 second...');
        fetchTeachers();
      }, 1000);
      
      // Additional refresh after 2 seconds to ensure data is updated
      setTimeout(() => {
        console.log('🔄 Second refresh after 2 seconds...');
        fetchTeachers();
      }, 2000);
      
      // Final refresh after 3 seconds
      setTimeout(() => {
        console.log('🔄 Final refresh after 3 seconds...');
        fetchTeachers();
      }, 3000);
    } catch (error) {
      console.error('Error submitting teacher:', error);
      
      // Tampilkan error detail dari server jika ada
      if (error.details) {
        const errorMessage = Array.isArray(error.details) ? error.details.join(', ') : error.details;
        toast({ 
          title: "Error Validasi", 
          description: errorMessage, 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: error.message || "Gagal menyimpan data guru", 
          variant: "destructive" 
        });
      }
    }

    setIsLoading(false);
  };

  const handleEdit = (teacher: Teacher) => {
    setFormData({
      nama: teacher.nama || '',
      username: teacher.username || teacher.user_username || '',
      password: '',
      nip: teacher.nip || '',
      mapel_id: teacher.mapel_id ? String(teacher.mapel_id) : '',
      no_telp: teacher.no_telp || '',
      alamat: teacher.alamat || '',
      jenis_kelamin: teacher.jenis_kelamin || '',
      email: teacher.email || teacher.user_email || ''
    });
    setEditingId(teacher.id);
    setDialogOpen(true);
  };  const handleDelete = async (id: number, nama: string) => {
    try {
      await apiCall(`/api/admin/guru/${id}`, {
        method: 'DELETE',
      }, onLogout);

      toast({ 
        title: "Berhasil", 
        description: `Akun guru ${nama} berhasil dihapus`,
        variant: "default"
      });
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Gagal menghapus akun guru", 
        variant: "destructive" 
      });
    }
  };

  const filteredTeachers = ensureArray<Teacher>(teachers).filter(teacher => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (teacher.nama && teacher.nama.toLowerCase().includes(searchLower)) ||
      (teacher.nip && teacher.nip.toLowerCase().includes(searchLower))
    );
  });

  if (showImport) {
    return <ExcelImportView entityType="guru" entityName="Akun Guru" onBack={() => setShowImport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Kelola Akun Guru
            </h1>
            <p className="text-gray-600">Tambah, edit, dan hapus akun login guru</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImport(true)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({ 
                nama: '', username: '', password: '', nip: '', mapel_id: '', 
                no_telp: '', alamat: '', jenis_kelamin: '', email: '' 
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Akun Guru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Akun Guru' : 'Tambah Akun Guru'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Edit informasi akun guru yang sudah ada' : 'Tambahkan akun login baru untuk guru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nama">Nama Lengkap *</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nip">NIP *</Label>
                  <Input
                    id="nip"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="Masukkan NIP"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Masukkan username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    Password {editingId ? '(Kosongkan jika tidak ingin mengubah)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Masukkan password"
                    required={!editingId}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Masukkan email"
                  />
                </div>
                <div>
                  <Label htmlFor="no_telp">No. Telepon</Label>
                  <Input
                    id="no_telp"
                    value={formData.no_telp}
                    onChange={(e) => setFormData({ ...formData, no_telp: e.target.value })}
                    placeholder="Masukkan no. telepon"
                  />
                </div>
                <div>
                  <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                  <Select value={formData.jenis_kelamin} onValueChange={(value) => setFormData({ ...formData, jenis_kelamin: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="L" value="L">Laki-laki</SelectItem>
                      <SelectItem key="P" value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mapel_id">Mata Pelajaran</Label>
                  <Select value={formData.mapel_id} onValueChange={(value) => setFormData({ ...formData, mapel_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mata pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.filter(s => s.id).map((subject) => (
                        <SelectItem key={subject.id} value={String(subject.id)}>
                          {subject.nama_mapel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="alamat">Alamat</Label>
                <Textarea
                  id="alamat"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari berdasarkan nama, username, atau NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {filteredTeachers.length} guru ditemukan
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Daftar Akun Guru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Data</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Tidak ada guru yang sesuai dengan pencarian' : 'Belum ada akun guru yang ditambahkan'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Akun Guru Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>No. Telepon</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher, index) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="text-gray-500 text-sm">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{teacher.nip || '-'}</TableCell>
                      <TableCell className="font-medium">{teacher.nama || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{teacher.username || '-'}</TableCell>
                      <TableCell className="text-sm">{teacher.email || '-'}</TableCell>
                      <TableCell className="text-sm">{teacher.no_telp || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {teacher.jenis_kelamin === 'L' ? 'Laki-laki' : teacher.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{teacher.nama_mapel || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.status === 'aktif' ? 'default' : 'secondary'}>
                          {teacher.status || 'aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            key="edit-btn"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(teacher)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog key="delete-dialog">
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Akun Guru</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus akun guru <strong>{teacher.nama}</strong>?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(teacher.id, teacher.nama)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ManageStudentDataView Component
const ManageStudentDataView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [formData, setFormData] = useState({
    nis: '', 
    nama: '', 
    kelas_id: '',
    jenis_kelamin: '' as 'L' | 'P' | '',
    alamat: '',
    telepon_orangtua: '',
    telepon_siswa: '',
    status: 'aktif' as 'aktif' | 'nonaktif'
  });
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);

  const fetchStudentsData = useCallback(async () => {
    try {
      console.log('🔄 Fetching students data...');
      const response = await apiCall('/api/admin/siswa', {}, onLogout);
      console.log('📊 Raw response:', response);
      
      // Handle nested response structure: response.data.data
      let students;
      if (response.success && response.data && response.data.data) {
        // Nested structure: response.data.data
        students = response.data.data;
      } else if (response.success && response.data) {
        // Direct structure: response.data
        students = response.data;
      } else if (response.data) {
        students = response.data;
      } else {
        students = response;
      }
      
      // Ensure students is an array
      const studentsArray = Array.isArray(students) ? students : [];
      console.log('📊 Students data received:', studentsArray.length, 'students');
      setStudentsData(studentsArray);
    } catch (error) {
      console.error('Error fetching students data:', error);
      toast({ title: "Error memuat data siswa", description: error.message, variant: "destructive" });
      setStudentsData([]);
    }
  }, [onLogout]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await apiCall('/api/admin/kelas', {}, onLogout);
      // Handle response format: { success: true, data: { success: true, data: [...] } }
      const classes = response.data || response;
      setClasses(Array.isArray(classes) ? classes : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({ title: "Error memuat data kelas", description: error.message, variant: "destructive" });
    }
  }, [onLogout]);

  useEffect(() => {
    fetchStudentsData();
    fetchClasses();
  }, [fetchStudentsData, fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId ? `/api/admin/siswa/${editingId}` : '/api/admin/siswa';
      const method = editingId ? 'PUT' : 'POST';
      
      const submitData = {
        nis: formData.nis,
        nama: formData.nama,
        kelas_id: parseInt(formData.kelas_id),
        jenis_kelamin: formData.jenis_kelamin,
        alamat: formData.alamat,
        telepon_orangtua: formData.telepon_orangtua,
        telepon_siswa: formData.telepon_siswa,
        status: formData.status,
        username: formData.nis // Use NIS as username for students
      };

      await apiCall(url, {
        method,
        body: JSON.stringify(submitData),
      }, onLogout);

      toast({ title: editingId ? "Data siswa berhasil diupdate!" : "Data siswa berhasil ditambahkan!" });
      setFormData({ 
        nis: '', 
        nama: '', 
        kelas_id: '',
        jenis_kelamin: '' as 'L' | 'P' | '',
        alamat: '',
        telepon_orangtua: '',
        telepon_siswa: '',
        status: 'aktif'
      });
      setEditingId(null);
      
      // Force refresh data dengan delay untuk memastikan backend sudah ter-update
      console.log('🔄 Refreshing students data after update...');
      setTimeout(() => {
        fetchStudentsData();
      }, 500);
    } catch (error) {
      console.error('Error submitting student data:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }

    setIsLoading(false);
  };

  const handleEdit = (student: StudentData) => {
    setFormData({ 
      nis: student.nis, 
      nama: student.nama, 
      kelas_id: student.kelas_id.toString(),
      jenis_kelamin: student.jenis_kelamin,
      alamat: student.alamat || '',
      telepon_orangtua: student.telepon_orangtua || '',
      telepon_siswa: student.telepon_siswa || '',
      status: student.status === 'aktif' ? 'aktif' : 'nonaktif'
    });
    setEditingId(student.id_siswa);
  };

  const handleDelete = async (id: number, nama: string) => {
    try {
      await apiCall(`/api/admin/siswa/${id}`, {
        method: 'DELETE',
      }, onLogout);

      toast({ title: `Data siswa ${nama} berhasil dihapus` });
      fetchStudentsData();
    } catch (error) {
      console.error('Error deleting student data:', error);
      toast({ title: "Error menghapus data siswa", description: error.message, variant: "destructive" });
    }
  };

  const filteredStudents = studentsData.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (student.nama && student.nama.toLowerCase().includes(searchLower)) ||
      (student.nis && student.nis.toLowerCase().includes(searchLower)) ||
      (student.nama_kelas && student.nama_kelas.toLowerCase().includes(searchLower))
    );
  });

  if (showImport) {
    return <ExcelImportView entityType="siswa" entityName="Data Siswa" onBack={() => setShowImport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              Kelola Data Siswa
            </h1>
            <p className="text-muted-foreground">Tambah dan kelola data lengkap siswa</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImport(true)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
        </div>
      </div>

      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {editingId ? 'Edit Data Siswa' : 'Tambah Data Siswa'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="student-nis">NIS *</Label>
              <Input 
                id="student-nis" 
                value={formData.nis} 
                onChange={(e) => setFormData({...formData, nis: e.target.value})} 
                placeholder="Nomor Induk Siswa"
                required 
              />
            </div>
            <div>
              <Label htmlFor="student-nama">Nama Lengkap *</Label>
              <Input 
                id="student-nama" 
                value={formData.nama} 
                onChange={(e) => setFormData({...formData, nama: e.target.value})} 
                placeholder="Nama lengkap siswa"
                required 
              />
            </div>
            <div>
              <Label htmlFor="student-class">Kelas *</Label>
              <Select value={formData.kelas_id} onValueChange={(value) => setFormData({...formData, kelas_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {ensureArray<Kelas>(classes).filter(cls => hasValidId(cls)).map((cls) => {
                    const value = getSelectValue(cls.id);
                    return value ? (
                      <SelectItem key={cls.id} value={value}>
                        {cls.nama_kelas}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="student-gender">Jenis Kelamin *</Label>
              <Select value={formData.jenis_kelamin} onValueChange={(value) => setFormData({...formData, jenis_kelamin: value as 'L' | 'P'})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="L" value="L">Laki-laki</SelectItem>
                  <SelectItem key="P" value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="student-telp">Telepon Orang Tua</Label>
              <Input 
                id="student-telp" 
                value={formData.telepon_orangtua} 
                onChange={(e) => setFormData({...formData, telepon_orangtua: e.target.value})} 
                placeholder="Nomor telepon orang tua"
              />
            </div>
            <div>
              <Label htmlFor="student-phone">Nomor Telepon Siswa</Label>
              <Input 
                id="student-phone" 
                value={formData.telepon_siswa || ''} 
                onChange={(e) => setFormData({...formData, telepon_siswa: e.target.value})} 
                placeholder="Nomor telepon pribadi siswa (08xx, +62xx, atau 62xx)"
                pattern="(\+62|62|0)[0-9]{9,13}"
                title="Format nomor telepon Indonesia (08xx, +62xx, atau 62xx)"
              />
            </div>
            <div>
              <Label htmlFor="student-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as 'aktif' | 'nonaktif'})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Non-aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="student-alamat">Alamat</Label>
              <Textarea 
                id="student-alamat" 
                value={formData.alamat} 
                onChange={(e) => setFormData({...formData, alamat: e.target.value})} 
                placeholder="Alamat lengkap siswa"
                rows={3}
              />
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
                {isLoading ? 'Menyimpan...' : (editingId ? 'Update' : 'Tambah')}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => {
                  setEditingId(null);
                  setFormData({ 
                    nis: '', 
                    nama: '', 
                    kelas_id: '',
                    jenis_kelamin: '' as 'L' | 'P' | '',
                    alamat: '',
                    telepon_orangtua: '',
                    telepon_siswa: '',
                    status: 'aktif'
                  });
                }}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari berdasarkan nama, NIS, atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {filteredStudents.length} siswa ditemukan
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Daftar Data Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Data</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada data siswa yang ditambahkan'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Telepon Ortu</TableHead>
                    <TableHead>Telepon Siswa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="text-gray-500 text-sm">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{student.nis}</TableCell>
                      <TableCell className="font-medium">{student.nama}</TableCell>
                      <TableCell>
                        {student.nama_kelas ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {student.nama_kelas}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-32 truncate" title={student.alamat}>
                        {student.alamat || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {student.telepon_orangtua || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {student.telepon_siswa || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={student.status === 'aktif' ? 'default' : 'secondary'}
                          className={student.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {student.status === 'aktif' ? 'Aktif' : 'Non-aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            key="edit-btn"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(student)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog key="delete-dialog">
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Data Siswa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus data siswa <strong>{student.nama}</strong>?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(student.id_siswa, student.nama)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ManageTeacherDataView Component  
const ManageTeacherDataView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [formData, setFormData] = useState({ 
    nip: '', 
    nama: '', 
    username: '', 
    email: '', 
    mapel_id: '',
    alamat: '',
    no_telp: '',
    jenis_kelamin: '' as 'L' | 'P' | '',
    status: 'aktif' as 'aktif' | 'nonaktif'
  });
  const [teachersData, setTeachersData] = useState<TeacherData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);

  const fetchTeachersData = useCallback(async () => {
    try {
      console.log('🔄 Fetching teachers data...');
      // Add cache busting parameter
      const timestamp = Date.now();
      const response = await apiCall(`/api/admin/guru?t=${timestamp}`, {}, onLogout);
      console.log('📊 Teachers data received:', response);
      
      // Handle different response formats
      let teachersData;
      if (response.success && response.data) {
        teachersData = response.data;
      } else if (Array.isArray(response)) {
        teachersData = response;
      } else {
        teachersData = [];
      }
      
      // Ensure teachersData is an array
      const teachersArray = Array.isArray(teachersData) ? teachersData : [];
      console.log('📊 Processed teachers data:', teachersArray.length, 'teachers');
      console.log('📊 Setting teachers data to state...');
      
      // Log data yang sebenarnya di-fetch untuk debugging
      const sampleData = teachersArray.slice(0, 3);
      console.log('📊 Sample fetched data:', sampleData);
      
      // Log sample data for debugging
      if (teachersArray.length > 0) {
        console.log('📊 Sample teacher data:', {
          id: teachersArray[0].id,
          nama: teachersArray[0].nama,
          no_telp: teachersArray[0].no_telp,
          alamat: teachersArray[0].alamat,
          nama_mapel: teachersArray[0].nama_mapel
        });
      }
      
      setTeachersData(teachersArray);
      console.log('📊 Teachers data state updated');
    } catch (error) {
      console.error('Error fetching teachers data:', error);
      toast({ title: "Error memuat data guru", description: error.message, variant: "destructive" });
      setTeachersData([]);
    }
  }, [onLogout]);

  useEffect(() => {
    fetchTeachersData();
  }, [fetchTeachersData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId ? `/api/admin/guru/${editingId}` : '/api/admin/teachers-data';
      const method = editingId ? 'PUT' : 'POST';
      
      const submitData = {
        nip: formData.nip,
        nama: formData.nama,
        username: formData.username,
        email: formData.email,
        mapel_id: formData.mapel_id ? parseInt(formData.mapel_id) : null,
        no_telp: formData.no_telp,
        alamat: formData.alamat,
        jenis_kelamin: formData.jenis_kelamin,
        status: formData.status
      };

      await apiCall(url, {
        method,
        body: JSON.stringify(submitData),
      }, onLogout);

      toast({ title: editingId ? "Data guru berhasil diupdate!" : "Data guru berhasil ditambahkan!" });
      setFormData({ 
        nip: '', 
        nama: '', 
        username: '',
        email: '', 
        mapel_id: '',
        alamat: '',
        no_telp: '',
        jenis_kelamin: '' as 'L' | 'P' | '',
        status: 'aktif' as 'aktif' | 'nonaktif'
      });
      setEditingId(null);
      
      // Force refresh data dengan delay untuk memastikan backend sudah ter-update
      console.log('🔄 Refreshing teachers data after update...');
      
      // Immediate refresh
      fetchTeachersData();
      
      // Additional refresh after 1 second
      setTimeout(() => {
        console.log('🔄 First refresh after 1 second...');
        fetchTeachersData();
      }, 1000);
      
      // Additional refresh after 2 seconds to ensure data is updated
      setTimeout(() => {
        console.log('🔄 Second refresh after 2 seconds...');
        fetchTeachersData();
      }, 2000);
      
      // Final refresh after 3 seconds
      setTimeout(() => {
        console.log('🔄 Final refresh after 3 seconds...');
        fetchTeachersData();
      }, 3000);
    } catch (error) {
      console.error('Error submitting teacher data:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }

    setIsLoading(false);
  };

  const handleEdit = (teacher: TeacherData) => {
    setFormData({ 
      nip: teacher.nip, 
      nama: teacher.nama, 
      username: teacher.username || teacher.nip,
      email: teacher.email || '',
      mapel_id: teacher.mapel_id ? String(teacher.mapel_id) : '',
      alamat: teacher.alamat || '',
      no_telp: teacher.no_telp || '',
      jenis_kelamin: teacher.jenis_kelamin,
      status: teacher.status
    });
    setEditingId(teacher.id);
  };

  const handleDelete = async (id: number, nama: string) => {
    try {
      await apiCall(`/api/admin/guru/${id}`, {
        method: 'DELETE',
      }, onLogout);

      toast({ title: `Data guru ${nama} berhasil dihapus` });
      fetchTeachersData();
    } catch (error) {
      console.error('Error deleting teacher data:', error);
      toast({ title: "Error menghapus data guru", description: error.message, variant: "destructive" });
    }
  };

  const filteredTeachers = teachersData.filter(teacher => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (teacher.nama && teacher.nama.toLowerCase().includes(searchLower)) ||
      (teacher.nip && teacher.nip.toLowerCase().includes(searchLower)) ||
      (teacher.nama_mapel && teacher.nama_mapel.toLowerCase().includes(searchLower))
    );
  });

  // Log filtered teachers for debugging
  console.log('📊 Filtered teachers:', filteredTeachers.length, 'teachers');
  console.log('📊 Teachers data length:', teachersData.length);
  console.log('📊 Search term:', searchTerm);

  if (showImport) {
    return <ExcelImportView entityType="guru" entityName="Data Guru" onBack={() => setShowImport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              Kelola Data Guru
            </h1>
            <p className="text-muted-foreground">Tambah dan kelola data lengkap guru</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImport(true)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
        </div>
      </div>

      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            {editingId ? 'Edit Data Guru' : 'Tambah Data Guru'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="teacher-nip">NIP *</Label>
              <Input 
                id="teacher-nip" 
                value={formData.nip} 
                onChange={(e) => setFormData({...formData, nip: e.target.value})} 
                placeholder="Nomor Induk Pegawai"
                required 
              />
            </div>
            <div>
              <Label htmlFor="teacher-username">Username *</Label>
              <Input 
                id="teacher-username" 
                value={formData.username} 
                onChange={(e) => setFormData({...formData, username: e.target.value})} 
                placeholder="Username guru"
                required 
              />
            </div>
            <div>
              <Label htmlFor="teacher-nama">Nama Lengkap *</Label>
              <Input 
                id="teacher-nama" 
                value={formData.nama} 
                onChange={(e) => setFormData({...formData, nama: e.target.value})} 
                placeholder="Nama lengkap guru"
                required 
              />
            </div>
            <div>
              <Label htmlFor="teacher-email">Email</Label>
              <Input 
                id="teacher-email" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                placeholder="Email guru"
              />
            </div>
            <div>
              <Label htmlFor="teacher-mapel">Mata Pelajaran</Label>
              <Input 
                id="teacher-mapel" 
                value={formData.mapel_id} 
                onChange={(e) => setFormData({...formData, mapel_id: e.target.value})} 
                placeholder="Mata pelajaran yang diampu"
              />
            </div>
            <div>
              <Label htmlFor="teacher-telepon">Telepon</Label>
              <Input 
                id="teacher-telepon" 
                value={formData.no_telp} 
                onChange={(e) => setFormData({...formData, no_telp: e.target.value})} 
                placeholder="Nomor telepon"
              />
            </div>
            <div>
              <Label htmlFor="teacher-gender">Jenis Kelamin *</Label>
              <Select value={formData.jenis_kelamin} onValueChange={(value) => setFormData({...formData, jenis_kelamin: value as 'L' | 'P'})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="L" value="L">Laki-laki</SelectItem>
                  <SelectItem key="P" value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="teacher-alamat">Alamat</Label>
              <Textarea 
                id="teacher-alamat" 
                value={formData.alamat} 
                onChange={(e) => setFormData({...formData, alamat: e.target.value})} 
                placeholder="Alamat lengkap"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="teacher-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as 'aktif' | 'nonaktif'})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Non-aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                {isLoading ? 'Menyimpan...' : (editingId ? 'Update' : 'Tambah')}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => {
                  setEditingId(null);
                  setFormData({ 
                    nip: '', 
                    nama: '', 
                    username: '',
                    email: '', 
                    mapel_id: '',
                    alamat: '',
                    no_telp: '',
                    jenis_kelamin: '' as 'L' | 'P' | '',
                    status: 'aktif' as 'aktif' | 'nonaktif'
                  });
                }}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari berdasarkan nama, NIP, atau mata pelajaran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {filteredTeachers.length} guru ditemukan
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Daftar Data Guru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Data</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Tidak ada guru yang cocok dengan pencarian' : 'Belum ada data guru yang ditambahkan'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher, index) => (
                    <TableRow key={`${teacher.id}-${teacher.no_telp}-${teacher.alamat}-${Date.now()}`}>
                      <TableCell className="text-gray-500 text-sm">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{teacher.nip}</TableCell>
                      <TableCell className="font-medium">{teacher.nama}</TableCell>
                      <TableCell className="text-sm">{teacher.email || '-'}</TableCell>
                      <TableCell className="text-sm">{teacher.no_telp || '-'}</TableCell>
                      <TableCell>
                        {teacher.nama_mapel ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {teacher.nama_mapel}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {teacher.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={teacher.status === 'aktif' ? 'default' : 'secondary'}
                          className={teacher.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {teacher.status === 'aktif' ? 'Aktif' : 'Non-aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            key="edit-btn"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(teacher)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog key="delete-dialog">
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Data Guru</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus data guru <strong>{teacher.nama}</strong>?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(teacher.id, teacher.nama)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ManageSubjectsView Component  
const ManageSubjectsView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [formData, setFormData] = useState({ 
    kode_mapel: '', 
    nama_mapel: '', 
    deskripsi: '',
    status: 'aktif' as 'aktif' | 'nonaktif'
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      // Add cache busting parameter
      const timestamp = Date.now();
      const response = await apiCall(`/api/admin/mapel?t=${timestamp}`, {}, onLogout);
      // Handle response format: { success: true, data: { success: true, data: [...] } }
      const subjects = response.data?.data || response.data || response;
      setSubjects(Array.isArray(subjects) ? subjects : []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({ title: "Error memuat mata pelajaran", description: error.message, variant: "destructive" });
    }
  }, [onLogout]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Client-side validation
    if (!formData.kode_mapel.trim()) {
      toast({ title: "Error", description: "Kode mata pelajaran wajib diisi!", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (!formData.nama_mapel.trim()) {
      toast({ title: "Error", description: "Nama mata pelajaran wajib diisi!", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (formData.kode_mapel.length < 2) {
      toast({ title: "Error", description: "Kode mata pelajaran minimal 2 karakter!", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (formData.nama_mapel.length < 3) {
      toast({ title: "Error", description: "Nama mata pelajaran minimal 3 karakter!", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const url = editingId ? `/api/admin/mapel/${editingId}` : '/api/admin/mapel';
      const method = editingId ? 'PUT' : 'POST';
      
      console.log('Sending data:', formData);
      
      await apiCall(url, {
        method,
        body: JSON.stringify(formData),
      }, onLogout);

      toast({ title: editingId ? "Mata pelajaran berhasil diupdate!" : "Mata pelajaran berhasil ditambahkan!" });
      setFormData({ 
        kode_mapel: '', 
        nama_mapel: '', 
        deskripsi: '',
        status: 'aktif'
      });
      setEditingId(null);
      fetchSubjects();
    } catch (error) {
      console.error('Error submitting subject:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }

    setIsLoading(false);
  };

  const handleEdit = (subject: Subject) => {
    setFormData({ 
      kode_mapel: subject.kode_mapel, 
      nama_mapel: subject.nama_mapel,
      deskripsi: subject.deskripsi || '',
      status: subject.status || 'aktif'
    });
    setEditingId(subject.id);
  };

  const handleDelete = async (id: number, nama: string) => {
    try {
      await apiCall(`/api/admin/mapel/${id}`, {
        method: 'DELETE',
      }, onLogout);

      toast({ title: `Mata pelajaran ${nama} berhasil dihapus` });
      fetchSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({ title: "Error menghapus mata pelajaran", description: error.message, variant: "destructive" });
    }
  };

  const filteredSubjects = ensureArray<Subject>(subjects).filter(subject => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (subject.nama_mapel && subject.nama_mapel.toLowerCase().includes(searchLower)) ||
      (subject.kode_mapel && subject.kode_mapel.toLowerCase().includes(searchLower)) ||
      (subject.deskripsi && subject.deskripsi.toLowerCase().includes(searchLower))
    );
  });

  if (showImport) {
    return <ExcelImportView entityType="mapel" entityName="Mata Pelajaran" onBack={() => setShowImport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Kelola Mata Pelajaran
            </h1>
            <p className="text-muted-foreground">Tambah dan kelola mata pelajaran sekolah</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImport(true)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
        </div>
      </div>

      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {editingId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject-code">Kode Mata Pelajaran *</Label>
                <Input 
                  id="subject-code" 
                  value={formData.kode_mapel} 
                  onChange={(e) => setFormData({...formData, kode_mapel: e.target.value})} 
                  placeholder="Misal: MAT, FIS, BIO"
                  required 
                />
              </div>
              <div>
                <Label htmlFor="subject-name">Nama Mata Pelajaran *</Label>
                <Input 
                  id="subject-name" 
                  value={formData.nama_mapel} 
                  onChange={(e) => setFormData({...formData, nama_mapel: e.target.value})} 
                  placeholder="Nama lengkap mata pelajaran"
                  required 
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="subject-desc">Deskripsi</Label>
              <textarea
                id="subject-desc"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                value={formData.deskripsi} 
                onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} 
                placeholder="Deskripsi mata pelajaran (opsional)"
              />
            </div>
            
            <div>
              <Label htmlFor="subject-status">Status *</Label>
              <select
                id="subject-status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'aktif' | 'nonaktif'})}
                required
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Tidak Aktif</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700">
                {isLoading ? 'Menyimpan...' : (editingId ? 'Update' : 'Tambah')}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => {
                  setEditingId(null);
                  setFormData({ 
                    kode_mapel: '', 
                    nama_mapel: '', 
                    deskripsi: '',
                    status: 'aktif'
                  });
                }}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari berdasarkan nama, kode, atau deskripsi mata pelajaran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {filteredSubjects.length} mata pelajaran ditemukan
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Daftar Mata Pelajaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSubjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Data</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Tidak ada mata pelajaran yang cocok dengan pencarian' : 'Belum ada mata pelajaran yang ditambahkan'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-32 min-w-32">Kode</TableHead>
                    <TableHead className="min-w-48">Nama Mata Pelajaran</TableHead>
                    <TableHead className="min-w-40">Deskripsi</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-24 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject, index) => (
                    <TableRow key={subject.id}>
                      <TableCell className="text-gray-500 text-sm">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm bg-gray-50 rounded px-2 py-1 w-32 min-w-32">
                        {subject.kode_mapel}
                      </TableCell>
                      <TableCell className="font-medium min-w-48">{subject.nama_mapel}</TableCell>
                      <TableCell className="text-sm min-w-40 truncate" title={subject.deskripsi}>
                        {subject.deskripsi || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={subject.status === 'aktif' ? 'default' : 'secondary'}
                          className={subject.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {subject.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            key="edit-btn"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(subject)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog key="delete-dialog">
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Mata Pelajaran</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus mata pelajaran <strong>{subject.nama_mapel}</strong>?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(subject.id, subject.nama_mapel)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ManageClassesView Component
// ManageClassesView Component
const ManageClassesView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [formData, setFormData] = useState({ 
    nama_kelas: '', 
    ruang: '', 
    kode_ruang: '' 
  });
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      console.log('🔄 Fetching classes data...');
      // Add cache busting parameter
      const timestamp = Date.now();
      const response = await apiCall(`/api/admin/kelas?t=${timestamp}`, {}, onLogout);
      console.log('📊 Classes data received:', response);
      console.log('📊 Response.data:', response.data);
      console.log('📊 Response.data type:', typeof response.data);
      console.log('📊 Response.data keys:', response.data ? Object.keys(response.data) : 'No keys');
      
      // Handle standardized response format: { success: true, data: [...] }
      const classes = response.data || response;
      console.log('📊 Processed classes data:', Array.isArray(classes) ? classes.length : 0, 'classes');
      console.log('📊 Classes sample:', Array.isArray(classes) ? classes.slice(0, 2) : 'Not an array');
      
      // Debug specific fields for first class
      if (Array.isArray(classes) && classes.length > 0) {
        const firstClass = classes[0];
        console.log('📊 First class details:', {
          id: firstClass.id,
          nama_kelas: firstClass.nama_kelas,
          tingkat: firstClass.tingkat,
          ruang: firstClass.ruang,
          kode_ruang: firstClass.kode_ruang,
          status: firstClass.status
        });
      }
      setClasses(Array.isArray(classes) ? classes : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({ title: "Error memuat kelas", description: error.message, variant: "destructive" });
    }
  }, [onLogout]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId ? `/api/admin/kelas/${editingId}` : '/api/admin/kelas';
      const method = editingId ? 'PUT' : 'POST';
      
      await apiCall(url, {
        method,
        body: JSON.stringify(formData),
      }, onLogout);

      toast({ title: editingId ? "Kelas berhasil diupdate!" : "Kelas berhasil ditambahkan!" });
      setFormData({ nama_kelas: '', ruang: '', kode_ruang: '' });
      setEditingId(null);
      
      // Force refresh data dengan delay untuk memastikan backend sudah ter-update
      console.log('🔄 Refreshing classes data after update...');
      
      // Immediate refresh
      fetchClasses();
      
      // Additional refresh after 1 second
      setTimeout(() => {
        console.log('🔄 First refresh after 1 second...');
        fetchClasses();
      }, 1000);
      
      // Additional refresh after 2 seconds to ensure data is updated
      setTimeout(() => {
        console.log('🔄 Second refresh after 2 seconds...');
        fetchClasses();
      }, 2000);
      
      // Final refresh after 3 seconds
      setTimeout(() => {
        console.log('🔄 Final refresh after 3 seconds...');
        fetchClasses();
      }, 3000);
    } catch (error) {
      console.error('Error submitting class:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }

    setIsLoading(false);
  };

  const handleEdit = (kelas: Kelas) => {
    setFormData({ 
      nama_kelas: kelas.nama_kelas, 
      ruang: kelas.ruang || '', 
      kode_ruang: kelas.kode_ruang || '' 
    });
    setEditingId(kelas.id);
    // Scroll to form
    document.getElementById('class-name')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id: number, nama: string) => {
    try {
      await apiCall(`/api/admin/kelas/${id}`, {
        method: 'DELETE',
      }, onLogout);

      toast({ title: `Kelas ${nama} berhasil dihapus` });
      fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({ title: "Error menghapus kelas", description: error.message, variant: "destructive" });
    }
  };

  const filteredClasses = ensureArray<Kelas>(classes).filter(kelas => {
    const searchLower = searchTerm.toLowerCase();
    return (
      kelas.nama_kelas && kelas.nama_kelas.toLowerCase().includes(searchLower)
    );
  });

  if (showImport) {
    return <ExcelImportView entityType="kelas" entityName="Kelas" onBack={() => setShowImport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
              Kelola Kelas
            </h1>
            <p className="text-muted-foreground">Tambah dan kelola kelas sekolah</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImport(true)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
        </div>
      </div>

      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            {editingId ? 'Edit Kelas' : 'Tambah Kelas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="class-name">Nama Kelas *</Label>
              <Input 
                id="class-name" 
                value={formData.nama_kelas} 
                onChange={(e) => setFormData({...formData, nama_kelas: e.target.value})} 
                placeholder="Contoh: X IPA 1, XI IPS 2, XII IPA 3"
                required 
              />
              <p className="text-sm text-muted-foreground mt-1">
                Format: [Tingkat] [Jurusan] [Nomor] - contoh: X IPA 1
              </p>
            </div>
            <div>
              <Label htmlFor="class-room">Ruang Kelas</Label>
              <Input 
                id="class-room" 
                value={formData.ruang} 
                onChange={(e) => setFormData({...formData, ruang: e.target.value})} 
                placeholder="Contoh: Ruang 101, Lab Komputer, Aula"
              />
            </div>
            <div>
              <Label htmlFor="class-room-code">Kode Ruang</Label>
              <Input 
                id="class-room-code" 
                value={formData.kode_ruang} 
                onChange={(e) => setFormData({...formData, kode_ruang: e.target.value})} 
                placeholder="Contoh: R101, LAB-KOM, AULA-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Kode unik untuk ruang kelas (opsional)
              </p>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                {isLoading ? 'Menyimpan...' : (editingId ? 'Update' : 'Tambah')}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => {
                  setEditingId(null);
                  setFormData({ nama_kelas: '', ruang: '', kode_ruang: '' });
                }}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari berdasarkan nama kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {filteredClasses.length} kelas ditemukan
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Daftar Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Data</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Tidak ada kelas yang cocok dengan pencarian' : 'Belum ada kelas yang ditambahkan'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nama Kelas</TableHead>
                    <TableHead>Tingkat</TableHead>
                    <TableHead>Ruang</TableHead>
                    <TableHead>Kode Ruang</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.map((kelas, index) => (
                    <TableRow key={kelas.id}>
                      <TableCell className="text-gray-500 text-sm">{index + 1}</TableCell>
                      <TableCell className="font-medium">{kelas.nama_kelas}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {kelas.tingkat || 'Belum diatur'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {kelas.ruang || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {kelas.kode_ruang || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            key="edit-btn"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(kelas)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog key="delete-dialog">
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Kelas</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus kelas <strong>{kelas.nama_kelas}</strong>?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(kelas.id, kelas.nama_kelas)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ManageStudentsView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [formData, setFormData] = useState<StudentFormData>({ 
    nama: '', 
    username: '', 
    password: '', 
    nis: '', 
    kelas_id: '', 
    jabatan: 'Sekretaris Kelas', 
    jenis_kelamin: '', 
    email: '',
    alamat: '',
    telepon_orangtua: '',
    telepon_siswa: '',
    status: 'aktif'
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      console.log('🔄 Fetching students data...');
      const response = await apiCall('/api/admin/siswa', {}, onLogout);
      console.log('📊 Raw response:', response);
      
      // Handle nested response structure: response.data.data
      let students;
      if (response.success && response.data && response.data.data) {
        // Nested structure: response.data.data
        students = response.data.data;
      } else if (response.success && response.data) {
        // Direct structure: response.data
        students = response.data;
      } else if (response.data) {
        students = response.data;
      } else {
        students = response;
      }
      
      // Ensure students is an array
      const studentsArray = Array.isArray(students) ? students : [];
      console.log('📊 Students data received:', studentsArray.length, 'students');
      console.log('📊 Sample data:', studentsArray.slice(0, 2));
      setStudents(studentsArray);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({ title: "Error memuat data siswa", description: error.message, variant: "destructive" });
      setStudents([]);
    }
  }, [onLogout]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await apiCall('/api/admin/kelas', {}, onLogout);
      // Handle response format: { success: true, data: { success: true, data: [...] } }
      const classes = response.data || response;
      setClasses(Array.isArray(classes) ? classes : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Don't show error toast for classes as it's not critical
    }
  }, [onLogout]);

  // Validasi form
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.nis || !/^\d{8,15}$/.test(formData.nis)) {
      errors.nis = 'NIS harus berupa angka 8-15 digit';
    }
    
    if (!formData.nama || formData.nama.trim().length < 2) {
      errors.nama = 'Nama lengkap wajib diisi minimal 2 karakter';
    }
    
    if (!formData.username || !/^[a-z0-9._-]{4,30}$/.test(formData.username)) {
      errors.username = 'Username harus 4-30 karakter, hanya huruf kecil, angka, titik, underscore, dan strip';
    }
    
    if (!formData.kelas_id) {
      errors.kelas_id = 'Kelas wajib dipilih';
    }
    
    if (!formData.jenis_kelamin) {
      errors.jenis_kelamin = 'Jenis kelamin wajib dipilih';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format email tidak valid';
    }
    
    if (formData.telepon_siswa && !/^(\+62|62|0)[0-9]{9,13}$/.test(formData.telepon_siswa)) {
      errors.telepon_siswa = 'Format nomor telepon tidak valid. Gunakan format 08xx, +62xx, atau 62xx';
    }
    
    if (!editingId && (!formData.password || formData.password.length < 6)) {
      errors.password = 'Password wajib diisi minimal 6 karakter';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [fetchStudents, fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({ title: "Error", description: "Mohon perbaiki error pada form", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const url = editingId ? `/api/admin/siswa/${editingId}` : '/api/admin/siswa';
      const method = editingId ? 'PUT' : 'POST';
      
      const submitData = {
        username: formData.username,
        password: formData.password,
        nis: formData.nis,
        nama: formData.nama,
        kelas_id: parseInt(formData.kelas_id),
        jabatan: formData.jabatan,
        jenis_kelamin: formData.jenis_kelamin,
        email: formData.email,
        alamat: formData.alamat || '',
        telepon_orangtua: formData.telepon_orangtua || '',
        telepon_siswa: formData.telepon_siswa || '',
        status: formData.status
      };

      // Hapus password kosong saat update
      if (editingId && !formData.password) {
        delete submitData.password;
      }

      await apiCall(url, {
        method,
        body: JSON.stringify(submitData),
      }, onLogout);

      toast({ title: editingId ? "Akun siswa berhasil diupdate!" : "Akun siswa berhasil ditambahkan!" });
      setFormData({ 
        nama: '', username: '', password: '', nis: '', kelas_id: '', 
        jabatan: 'Sekretaris Kelas', jenis_kelamin: '', email: '', alamat: '', telepon_orangtua: '', telepon_siswa: '', status: 'aktif'
      });
      setFormErrors({});
      setEditingId(null);
      setDialogOpen(false);
      
      // Force refresh data dengan delay untuk memastikan backend sudah ter-update
      console.log('🔄 Refreshing students data after update...');
      setTimeout(() => {
        fetchStudents();
      }, 500);
    } catch (error) {
      console.error('Error submitting student:', error);
      if (error.details) {
        const errorMessage = Array.isArray(error.details) ? error.details.join(', ') : error.details;
        toast({ title: "Error Validasi", description: errorMessage, variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }

    setIsLoading(false);
  };

  const handleEdit = (student: Student) => {
    setFormData({ 
      nama: student.nama, 
      username: student.username || '', 
      password: '', 
      nis: student.nis || '',
      kelas_id: String(student.kelas_id || ''),
      jabatan: student.jabatan || 'Sekretaris Kelas',
      jenis_kelamin: student.jenis_kelamin || '',
      email: student.email || '',
      alamat: student.alamat || '',
      telepon_orangtua: student.telepon_orangtua || '',
      telepon_siswa: student.telepon_siswa || '',
      status: (student.status as 'aktif' | 'nonaktif') || 'aktif'
    });
    setEditingId(student.id_siswa);
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleDelete = async (id: number, nama: string, nis: string) => {
    try {
      await apiCall(`/api/admin/siswa/${id}`, {
        method: 'DELETE',
      }, onLogout);

      toast({ title: `Akun siswa ${nama} (NIS: ${nis}) berhasil dihapus` });
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({ title: "Error menghapus akun siswa", description: error.message, variant: "destructive" });
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (student.nama && student.nama.toLowerCase().includes(searchLower)) ||
      (student.username && student.username.toLowerCase().includes(searchLower)) ||
      (student.nis && student.nis.toLowerCase().includes(searchLower)) ||
      (student.nama_kelas && student.nama_kelas.toLowerCase().includes(searchLower))
    );
  });

  if (showImport) {
    return <ExcelImportView entityType="siswa" entityName="Akun Siswa" onBack={() => setShowImport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              Kelola Akun Siswa
            </h1>
            <p className="text-gray-600">Tambah, edit, dan hapus akun login siswa perwakilan</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImport(true)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({ 
                nama: '', username: '', password: '', nis: '', kelas_id: '', 
                jabatan: 'Sekretaris Kelas', jenis_kelamin: '', email: '', alamat: '', telepon_orangtua: '', telepon_siswa: '', status: 'aktif'
              });
              setFormErrors({});
            }} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Akun Siswa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Akun Siswa' : 'Tambah Akun Siswa'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Edit informasi akun siswa yang sudah ada' : 'Tambahkan akun login baru untuk siswa'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nama">Nama Lengkap *</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    className={formErrors.nama ? 'border-red-500' : ''}
                  />
                  {formErrors.nama && <p className="text-sm text-red-500 mt-1">{formErrors.nama}</p>}
                </div>
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Masukkan username"
                    className={formErrors.username ? 'border-red-500' : ''}
                  />
                  {formErrors.username && <p className="text-sm text-red-500 mt-1">{formErrors.username}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">
                    Password {editingId ? '(Kosongkan jika tidak ingin mengubah)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingId ? "Kosongkan jika tidak ingin mengubah" : "Masukkan password"}
                    className={formErrors.password ? 'border-red-500' : ''}
                  />
                  {formErrors.password && <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>}
                </div>
                <div>
                  <Label htmlFor="nis">NIS *</Label>
                  <Input
                    id="nis"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="Masukkan NIS (8-15 digit)"
                    className={formErrors.nis ? 'border-red-500' : ''}
                  />
                  {formErrors.nis && <p className="text-sm text-red-500 mt-1">{formErrors.nis}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kelas_id">Kelas *</Label>
                  <Select value={formData.kelas_id} onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}>
                    <SelectTrigger className={formErrors.kelas_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {ensureArray<Kelas>(classes).filter(kelas => hasValidId(kelas)).map((kelas) => {
                        const value = getSelectValue(kelas.id);
                        return value ? (
                          <SelectItem key={kelas.id} value={value}>
                            {kelas.nama_kelas} {kelas.tingkat ? `(${kelas.tingkat})` : ''}
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                  {formErrors.kelas_id && <p className="text-sm text-red-500 mt-1">{formErrors.kelas_id}</p>}
                </div>
                <div>
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Select value={formData.jabatan} onValueChange={(value) => setFormData({ ...formData, jabatan: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Siswa">Siswa</SelectItem>
                      <SelectItem value="Ketua Kelas">Ketua Kelas</SelectItem>
                      <SelectItem value="Wakil Ketua Kelas">Wakil Ketua Kelas</SelectItem>
                      <SelectItem value="Sekretaris Kelas">Sekretaris Kelas</SelectItem>
                      <SelectItem value="Bendahara Kelas">Bendahara Kelas</SelectItem>
                      <SelectItem value="Perwakilan Siswa">Perwakilan Siswa</SelectItem>
                      <SelectItem value="Ketua Murid">Ketua Murid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jenis_kelamin">Jenis Kelamin *</Label>
                  <Select value={formData.jenis_kelamin} onValueChange={(value) => setFormData({ ...formData, jenis_kelamin: value })}>
                    <SelectTrigger className={formErrors.jenis_kelamin ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="L" value="L">Laki-laki</SelectItem>
                      <SelectItem key="P" value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.jenis_kelamin && <p className="text-sm text-red-500 mt-1">{formErrors.jenis_kelamin}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Masukkan email (opsional)"
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="telepon_orangtua">Nomor Telepon Orang Tua</Label>
                  <Input
                    id="telepon_orangtua"
                    type="tel"
                    value={formData.telepon_orangtua}
                    onChange={(e) => setFormData({ ...formData, telepon_orangtua: e.target.value })}
                    placeholder="Nomor telepon orang tua (08xx, +62xx, atau 62xx)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telepon_siswa">Nomor Telepon Siswa</Label>
                  <Input
                    id="telepon_siswa"
                    type="tel"
                    value={formData.telepon_siswa}
                    onChange={(e) => setFormData({ ...formData, telepon_siswa: e.target.value })}
                    placeholder="Nomor telepon pribadi siswa (08xx, +62xx, atau 62xx)"
                    className={formErrors.telepon_siswa ? 'border-red-500' : ''}
                  />
                  {formErrors.telepon_siswa && <p className="text-sm text-red-500 mt-1">{formErrors.telepon_siswa}</p>}
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value: 'aktif' | 'nonaktif') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="nonaktif">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                  {isLoading ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari berdasarkan nama, username, NIS, atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {filteredStudents.length} siswa ditemukan
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Daftar Akun Siswa Perwakilan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Data</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Tidak ada siswa yang sesuai dengan pencarian' : 'Belum ada akun siswa yang ditambahkan'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Akun Siswa Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon Orangtua</TableHead>
                    <TableHead>Telepon Siswa</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="text-gray-500 text-sm">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{student.nis || '-'}</TableCell>
                      <TableCell className="font-medium">{student.nama || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {student.nama_kelas || 'Belum ada kelas'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{student.username || '-'}</TableCell>
                      <TableCell className="text-sm">{student.email || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{student.telepon_orangtua || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{student.telepon_siswa || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {student.jenis_kelamin === 'L' ? 'Laki-laki' : student.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{student.jabatan || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'aktif' ? 'default' : 'secondary'}>
                          {student.status || 'aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            key="edit-btn"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(student)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog key="delete-dialog">
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Akun Siswa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus akun siswa <strong>{student.nama}</strong> (NIS: {student.nis})?
                                  Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(student.id_siswa, student.nama, student.nis)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Live Summary View Component
const LiveSummaryView = ({ onLogout }: { onLogout: () => void }) => {
  const [liveData, setLiveData] = useState<LiveData>({ ongoing_classes: [] });
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchLiveData = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/live-summary', {}, onLogout);
      // Ensure data has the correct structure
      if (data && Array.isArray(data.ongoing_classes)) {
        setLiveData(data);
      } else {
        setLiveData({ ongoing_classes: [] });
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
      setLiveData({ ongoing_classes: [] });
    }
  }, [onLogout]);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Live Clock & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Waktu Sekarang</p>
                                  <p className="text-2xl font-bold">
                    {formatTime24WithSeconds(currentTime)}
                  </p>
                <p className="text-blue-100 text-sm">
                  {currentTime.toLocaleDateString('id-ID', { 
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <Clock className="w-12 h-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Kelas Berlangsung</p>
                <p className="text-3xl font-bold">{liveData.ongoing_classes?.length || 0}</p>
                <p className="text-green-100 text-sm">Kelas aktif saat ini</p>
              </div>
              <BookOpen className="w-12 h-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Tingkat Kehadiran</p>
                <p className="text-3xl font-bold">{liveData.overall_attendance_percentage || '0'}%</p>
                <p className="text-purple-100 text-sm">Kehadiran hari ini</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ongoing Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Kelas yang Sedang Berlangsung

          </CardTitle>
        </CardHeader>
        <CardContent>
          {(liveData.ongoing_classes?.length || 0) === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Kelas Berlangsung</h3>
              <p className="text-gray-600">Saat ini tidak ada kelas yang sedang berlangsung.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(liveData.ongoing_classes || []).map((kelas, index) => (
                <Card key={`ongoing-class-${kelas.id || kelas.kelas || index}`} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {kelas.nama_kelas || kelas.kelas}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {kelas.jam_mulai} - {kelas.jam_selesai}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        {kelas.nama_mapel || kelas.mapel}
                      </h4>
                      <p className="text-sm text-gray-600">
                        👨‍🏫 {kelas.nama_guru || kelas.guru}
                      </p>
                      {kelas.absensi_diambil !== undefined && (
                        <div key={`attendance-${kelas.id}`} className="flex items-center gap-2">
                          {kelas.absensi_diambil > 0 ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Absensi Diambil
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Menunggu Absensi
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Schedule Management Component
const ManageSchedulesView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [conflicts, setConflicts] = useState<Array<{
    type: 'guru' | 'kelas';
    guru_id?: number;
    nama_guru?: string;
    kelas_id?: number;
    nama_kelas?: string;
    hari: string;
    severity?: 'high' | 'low';
    jadwal1: {
      id: number;
      kelas?: string;
      guru?: string;
      mapel: string;
      jam: string;
    };
    jadwal2: {
      id: number;
      kelas?: string;
      guru?: string;
      mapel: string;
      jam: string;
    };
  }>>([]);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSchedulePreviewGrid, setShowSchedulePreviewGrid] = useState(false);
  const [showRuangKelasManagement, setShowRuangKelasManagement] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [consecutiveHours, setConsecutiveHours] = useState(1);
  const [showImport, setShowImport] = useState(false);
  const [showAdvancedImport, setShowAdvancedImport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  
  const [formData, setFormData] = useState({
    kelas_id: '',
    mapel_id: '',
    guru_id: '',
    ruang_id: '',
    hari: '',
    jam_mulai: '',
    jam_selesai: '',
    jam_ke: ''
  });

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  // Filter dan search functionality
  const filteredSchedules = ensureArray<Schedule>(schedules).filter(schedule => {
    const matchesSearch = !searchTerm || 
      schedule.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.nama_mapel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.nama_guru?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.nama_ruang?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDay = !filterDay || filterDay === 'all' || schedule.hari === filterDay;
    const matchesClass = !filterClass || filterClass === 'all' || schedule.kelas_id?.toString() === filterClass;
    
    return matchesSearch && matchesDay && matchesClass;
  });

  // Fetch all necessary data
  useEffect(() => {
    fetchSchedules();
    fetchTeachers();
    fetchSubjects();
    fetchClasses();
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* intentionally run once to load initial data */]);

  const fetchSchedules = async () => {
    try {
      const data = await apiCall('/api/admin/jadwal', {}, onLogout);
      setSchedules(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memuat jadwal",
        variant: "destructive"
      });
    }
  };

  const checkConflicts = async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/api/admin/jadwal/conflicts', {}, onLogout);
      setConflicts(data.conflicts || []);
      setShowConflicts(true);
      
      if (data.total_conflicts > 0) {
        toast({
          title: "Bentrok Ditemukan",
          description: `Ditemukan ${data.total_conflicts} bentrok jadwal (${data.summary?.teacher_conflicts || 0} bentrok guru, ${data.summary?.class_conflicts || 0} bentrok kelas)`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Tidak Ada Bentrok",
          description: "Semua jadwal tidak memiliki konflik"
        });
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
      toast({ title: "Error memeriksa bentrok", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreview = async () => {
    setShowSchedulePreviewGrid(true);
  };

  const fetchTeachers = async () => {
    try {
      const response = await apiCall('/api/admin/guru', {}, onLogout);
      // Handle both array and object response formats
      if (Array.isArray(response)) {
        setTeachers(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setTeachers(response.data);
      } else {
        console.error('Invalid teachers response format:', response);
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiCall('/api/admin/mapel', {}, onLogout);
      if (response && response.success && Array.isArray(response.data)) {
        setSubjects(response.data);
      } else if (Array.isArray(response)) {
        setSubjects(response);
      } else {
        console.error('Invalid subjects response format:', response);
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiCall('/api/admin/kelas', {}, onLogout);
      // Handle response format: { success: true, data: { success: true, data: [...] } }
      const classes = response.data || response;
      setClasses(Array.isArray(classes) ? classes : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await apiCall('/api/admin/ruang-kelas', {}, onLogout);
      // Handle both array and object response formats
      if (Array.isArray(response)) {
        setRooms(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setRooms(response.data);
      } else {
        console.error('Invalid rooms response format:', response);
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  const generateTimeSlots = (startTime: string, endTime: string, jamKe: number, consecutiveHours: number) => {
    const slots = [];
    let currentJamKe = jamKe;
    
    // Parse start time
    const [startHour, startMinute] = startTime.split(':').map(Number);
  const currentTime = new Date();
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    // If end time is provided for single hour, calculate duration
    let duration = 40; // default 40 minutes
    if (endTime && consecutiveHours === 1) {
      const [endHour, endMinute] = endTime.split(':').map(Number);
      const endTimeObj = new Date();
      endTimeObj.setHours(endHour, endMinute, 0, 0);
      duration = (endTimeObj.getTime() - currentTime.getTime()) / (1000 * 60);
    }

    for (let i = 0; i < consecutiveHours; i++) {
      const jamMulai = currentTime.toTimeString().slice(0, 5);
      currentTime.setMinutes(currentTime.getMinutes() + duration);
      const jamSelesai = currentTime.toTimeString().slice(0, 5);
      
      slots.push({
        jam_ke: currentJamKe,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai
      });
      
      currentJamKe++;
      // Add 5 minutes break between classes
      if (i < consecutiveHours - 1) {
        currentTime.setMinutes(currentTime.getMinutes() + 5);
      }
    }
    
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingId) {
        // Update existing schedule
        await apiCall(`/api/admin/jadwal/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            kelas_id: parseInt(formData.kelas_id),
            mapel_id: parseInt(formData.mapel_id),
            guru_id: parseInt(formData.guru_id),
            ruang_id: formData.ruang_id ? parseInt(formData.ruang_id) : null,
            hari: formData.hari,
            jam_mulai: formData.jam_mulai,
            jam_selesai: formData.jam_selesai,
            jam_ke: parseInt(formData.jam_ke)
          })
        }, onLogout);

        toast({
          title: "Berhasil",
          description: "Jadwal berhasil diperbarui"
        });
      } else {
        // Create new schedule(s)
        const timeSlots = generateTimeSlots(
          formData.jam_mulai,
          formData.jam_selesai,
          parseInt(formData.jam_ke) || 1,
          consecutiveHours
        );

        for (const slot of timeSlots) {
          await apiCall('/api/admin/jadwal', {
            method: 'POST',
            body: JSON.stringify({
              kelas_id: parseInt(formData.kelas_id),
              mapel_id: parseInt(formData.mapel_id),
              guru_id: parseInt(formData.guru_id),
              ruang_id: formData.ruang_id ? parseInt(formData.ruang_id) : null,
              hari: formData.hari,
              jam_mulai: slot.jam_mulai,
              jam_selesai: slot.jam_selesai,
              jam_ke: slot.jam_ke
            })
          }, onLogout);
        }

        toast({
          title: "Berhasil",
          description: `${consecutiveHours} jam pelajaran berhasil ditambahkan`
        });
      }

      // Reset form
      setFormData({
        kelas_id: '',
        mapel_id: '',
        guru_id: '',
        ruang_id: '',
        hari: '',
        jam_mulai: '',
        jam_selesai: '',
        jam_ke: ''
      });
      setConsecutiveHours(1);
      setEditingId(null);
      fetchSchedules();
    } catch (error: unknown) {
      console.error('Error in handleSubmit:', error);
      
      // Handle conflict errors with detailed information
      if (error && typeof error === 'object' && 'conflict_type' in error && 'conflict_details' in error) {
        const conflictError = error as { conflict_type: string; conflict_details: { existing_schedule: Schedule; new_schedule: Schedule } };
        const { conflict_type, conflict_details } = conflictError;
        const existingSchedule = conflict_details.existing_schedule;
        const newSchedule = conflict_details.new_schedule;
        
        let conflictMessage = '';
        if (conflict_type === 'guru') {
          conflictMessage = `Guru sudah memiliki jadwal mengajar pada ${existingSchedule.nama_kelas} (${existingSchedule.nama_mapel}) jam ${existingSchedule.jam_mulai}-${existingSchedule.jam_selesai} yang bentrok dengan jam ${newSchedule.jam_mulai}-${newSchedule.jam_selesai}`;
        } else if (conflict_type === 'kelas') {
          conflictMessage = `Kelas sudah memiliki jadwal dengan guru ${existingSchedule.nama_guru} (${existingSchedule.nama_mapel}) jam ${existingSchedule.jam_mulai}-${existingSchedule.jam_selesai} yang bentrok dengan jam ${newSchedule.jam_mulai}-${newSchedule.jam_selesai}`;
        }
        
        toast({
          title: "Bentrok Jadwal Ditemukan",
          description: conflictMessage,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Gagal menyimpan jadwal",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setFormData({
      kelas_id: schedule.kelas_id?.toString() || '',
      mapel_id: schedule.mapel_id?.toString() || '',
      guru_id: schedule.guru_id?.toString() || '',
      ruang_id: schedule.ruang_id?.toString() || '',
      hari: schedule.hari,
      jam_mulai: schedule.jam_mulai,
      jam_selesai: schedule.jam_selesai,
      jam_ke: schedule.jam_ke?.toString() || ''
    });
    setEditingId(schedule.id);
    // Scroll to form
    document.getElementById('kelas_id')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      try {
        await apiCall(`/api/admin/jadwal/${id}`, {
          method: 'DELETE'
        }, onLogout);

        toast({
          title: "Berhasil",
          description: "Jadwal berhasil dihapus"
        });
        
        fetchSchedules();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Gagal menghapus jadwal",
          variant: "destructive"
        });
      }
    }
  };

  if (showAdvancedImport) {
    return <JadwalAdvancedImportView onBack={() => setShowAdvancedImport(false)} />;
  }

  if (showImport) {
    return <ExcelImportView entityType="jadwal" entityName="Jadwal Pelajaran" onBack={() => setShowImport(false)} />;
  }

  if (showSchedulePreviewGrid) {
    return <SchedulePreviewGrid onBack={() => setShowSchedulePreviewGrid(false)} />;
  }


  if (showRuangKelasManagement) {
    return <RuangKelasManagement onBack={() => setShowRuangKelasManagement(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dengan gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="px-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={onBack} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
                <h1 className="text-3xl font-bold">Kelola Jadwal</h1>
                <p className="text-blue-100 mt-1">Atur jadwal pelajaran untuk setiap kelas dengan mudah</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
              <Button onClick={checkConflicts} disabled={isLoading} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Cek Bentrok
          </Button>
              <Button onClick={generatePreview} disabled={isLoading} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Eye className="w-4 h-4 mr-2" />
            Preview Jadwal
          </Button>
              <Button onClick={() => setShowAdvancedImport(true)} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <FileText className="w-4 h-4 mr-2" />
            Import Advanced
          </Button>
              <Button onClick={() => setShowImport(true)} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Download className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">

      {/* Conflicts Modal */}
      {showConflicts && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Daftar Bentrok Jadwal ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conflicts.length === 0 ? (
              <div className="text-center py-8 text-green-600">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg font-medium">Tidak ada bentrok jadwal</p>
                <p className="text-sm">Semua jadwal sudah tersusun dengan baik</p>
              </div>
            ) : (
              <div className="space-y-4">
                {conflicts.map((conflict, index) => (
                  <div key={`conflict-${conflict.type}-${index}`} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-red-800">
                        Bentrok {conflict.type === 'guru' ? 'Guru' : 'Kelas'}
                      </span>
                      {conflict.severity && (
                        <Badge key={`severity-${conflict.type}-${index}`} variant="destructive" className="text-xs">
                          {conflict.severity === 'high' ? 'Tinggi' : 'Rendah'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-red-700">
                      <p><strong>Hari:</strong> {conflict.hari}</p>
                      {conflict.type === 'guru' ? (
                        <p><strong>Guru:</strong> {conflict.nama_guru}</p>
                      ) : (
                        <p><strong>Kelas:</strong> {conflict.nama_kelas}</p>
                      )}
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="bg-white p-3 rounded border">
                          <p className="font-medium text-gray-800">Jadwal 1:</p>
                          <p className="text-xs text-gray-600">ID: {conflict.jadwal1.id}</p>
                          <p className="text-xs text-gray-600">Jam: {conflict.jadwal1.jam}</p>
                          {conflict.type === 'guru' ? (
                            <p className="text-xs text-gray-600">Kelas: {conflict.jadwal1.kelas}</p>
                          ) : (
                            <p className="text-xs text-gray-600">Guru: {conflict.jadwal1.guru}</p>
                          )}
                          <p className="text-xs text-gray-600">Mapel: {conflict.jadwal1.mapel}</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <p className="font-medium text-gray-800">Jadwal 2:</p>
                          <p className="text-xs text-gray-600">ID: {conflict.jadwal2.id}</p>
                          <p className="text-xs text-gray-600">Jam: {conflict.jadwal2.jam}</p>
                          {conflict.type === 'guru' ? (
                            <p className="text-xs text-gray-600">Kelas: {conflict.jadwal2.kelas}</p>
                          ) : (
                            <p className="text-xs text-gray-600">Guru: {conflict.jadwal2.guru}</p>
                          )}
                          <p className="text-xs text-gray-600">Mapel: {conflict.jadwal2.mapel}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowConflicts(false)} variant="outline">
                Tutup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {showPreview && preview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Preview Jadwal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(preview).map(([kelas, jadwalHari]: [string, Record<string, Schedule[]>]) => (
                <div key={kelas} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-800">{kelas}</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(hari => (
                      <div key={hari} className="border rounded p-2">
                        <h4 className="font-medium text-sm mb-2 text-center">{hari}</h4>
                        <div className="space-y-1">
                          {jadwalHari[hari]?.map((jadwal: Schedule, index: number) => (
                            <div key={`schedule-${jadwal.id || jadwal.nama_mapel}-${index}`} className="text-xs bg-blue-50 p-1 rounded">
                              <p className="font-medium">{jadwal.jam_mulai}-{jadwal.jam_selesai}</p>
                              <p className="text-gray-600">{jadwal.nama_mapel}</p>
                              <p className="text-gray-500">{jadwal.nama_guru}</p>
                            </div>
                          )) || <p className="text-xs text-gray-400 text-center">-</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowPreview(false)} variant="outline">
                Tutup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

        {/* Form Section dengan design yang lebih baik */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Form Card */}
          <div className="xl:col-span-1">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
            {editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}
                    </div>
                    <div className="text-sm text-gray-600 font-normal">
                      {editingId ? 'Perbarui informasi jadwal' : 'Buat jadwal pelajaran baru'}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Kelas dan Mata Pelajaran */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                      <h4 className="font-semibold text-gray-800">Informasi Dasar</h4>
                    </div>
                    
                    <div className="space-y-4">
              <div>
                        <Label className="text-sm font-medium text-gray-700">Kelas *</Label>
                <Select 
                  value={formData.kelas_id} 
                  onValueChange={(value) => setFormData({...formData, kelas_id: value})}
                >
                          <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureArray<Kelas>(classes).filter(kelas => hasValidId(kelas)).map((kelas) => {
                      const value = getSelectValue(kelas.id);
                      return value ? (
                        <SelectItem key={kelas.id} value={value}>
                          {kelas.nama_kelas}
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                        <Label className="text-sm font-medium text-gray-700">Mata Pelajaran *</Label>
                <Select 
                  value={formData.mapel_id} 
                  onValueChange={(value) => setFormData({...formData, mapel_id: value})}
                >
                          <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih Mata Pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureArray<Subject>(subjects).filter(subject => hasValidId(subject)).map((subject) => {
                      const value = getSelectValue(subject.id);
                      return value ? (
                        <SelectItem key={subject.id} value={value}>
                          {subject.nama_mapel}
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
                      </div>
              </div>
            </div>

                  {/* Guru dan Ruang */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                      <h4 className="font-semibold text-gray-800">Penanggung Jawab</h4>
                    </div>
                    
                    <div className="space-y-4">
              <div>
                        <Label className="text-sm font-medium text-gray-700">Guru *</Label>
                <Select 
                  value={formData.guru_id} 
                  onValueChange={(value) => setFormData({...formData, guru_id: value})}
                >
                          <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih Guru" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureArray<Teacher>(teachers).filter(teacher => hasValidId(teacher)).map((teacher) => {
                      const value = getSelectValue(teacher.id);
                      return value ? (
                        <SelectItem key={teacher.id} value={value}>
                          {teacher.nama} (NIP: {teacher.nip})
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                        <Label className="text-sm font-medium text-gray-700">Ruang Kelas</Label>
                <Select 
                  value={formData.ruang_id || 'none'} 
                  onValueChange={(value) => setFormData({...formData, ruang_id: value === 'none' ? '' : value})}
                >
                          <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih Ruang (Opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="none">Tidak ada ruang</SelectItem>
                    {ensureArray<Room>(rooms).filter(room => hasValidId(room)).map((room) => {
                      const value = getSelectValue(room.id);
                      return value ? (
                        <SelectItem key={room.id} value={value}>
                          {room.nama_ruang} ({room.kode_ruang})
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
                      </div>
              </div>
            </div>

                  {/* Waktu dan Hari */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                      <h4 className="font-semibold text-gray-800">Waktu Pelaksanaan</h4>
                    </div>
                    
                    <div className="space-y-4">
              <div>
                        <Label className="text-sm font-medium text-gray-700">Hari *</Label>
                <Select 
                  value={formData.hari} 
                  onValueChange={(value) => setFormData({...formData, hari: value})}
                >
                          <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih Hari" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

                      <div className="grid grid-cols-2 gap-3">
              <div>
                          <Label htmlFor="jam-mulai" className="text-sm font-medium text-gray-700">Jam Mulai *</Label>
                <Input 
                  id="jam-mulai"
                  type="time" 
                  value={formData.jam_mulai} 
                  onChange={(e) => setFormData({...formData, jam_mulai: e.target.value})} 
                  required 
                            className="mt-1"
                />
              </div>
              <div>
                          <Label htmlFor="jam-selesai" className="text-sm font-medium text-gray-700">Jam Selesai *</Label>
                <Input 
                  id="jam-selesai"
                  type="time" 
                  value={formData.jam_selesai} 
                  onChange={(e) => setFormData({...formData, jam_selesai: e.target.value})} 
                  required={editingId !== null || consecutiveHours === 1}
                  disabled={!editingId && consecutiveHours > 1}
                            className="mt-1"
                />
              </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
              <div>
                          <Label htmlFor="jam-ke" className="text-sm font-medium text-gray-700">Jam ke- *</Label>
                <Input 
                  id="jam-ke"
                  type="number" 
                  value={formData.jam_ke} 
                  onChange={(e) => setFormData({...formData, jam_ke: e.target.value})} 
                  placeholder="1, 2, 3, dst"
                  min="1"
                  required={editingId !== null || consecutiveHours === 1}
                  disabled={!editingId && consecutiveHours > 1}
                            className="mt-1"
                />
            </div>

            {!editingId && (
              <div>
                            <Label htmlFor="consecutive-hours" className="text-sm font-medium text-gray-700">Jumlah Jam</Label>
                <Select 
                  value={consecutiveHours?.toString() || '1'} 
                  onValueChange={(value) => setConsecutiveHours(parseInt(value))}
                >
                              <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => {
                      const value = getSelectValue(num);
                      return value ? (
                        <SelectItem key={num} value={value}>
                          {num} Jam
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
                          </div>
                        )}
                      </div>

                      {!editingId && consecutiveHours > 1 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-sm text-blue-700 font-medium">
                              Akan menambahkan {consecutiveHours} jam berurutan secara otomatis
                            </p>
                          </div>
              </div>
            )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t">
                    <div className="flex gap-3">
                      <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {editingId ? 'Update Jadwal' : `Tambah ${consecutiveHours} Jam Pelajaran`}
                          </div>
                        )}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => {
                  setEditingId(null);
                  setFormData({
                    kelas_id: '',
                    mapel_id: '',
                    guru_id: '',
                    ruang_id: '',
                    hari: '',
                    jam_mulai: '',
                    jam_selesai: '',
                    jam_ke: ''
                  });
                  setConsecutiveHours(1);
                        }} className="px-6">
                  Cancel
                </Button>
              )}
                    </div>
            </div>
          </form>
              </CardContent>
        </Card>
          </div>

          {/* Schedule List dengan design yang lebih baik */}
          <div className="xl:col-span-2">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Daftar Jadwal</div>
                      <div className="text-sm text-gray-600 font-normal">
                        {filteredSchedules.length} dari {ensureArray<Schedule>(schedules).length} jadwal
                        {(searchTerm || filterDay || filterClass) && (
                          <span className="text-blue-600 ml-1">(difilter)</span>
                        )}
                      </div>
                    </div>
                  </CardTitle>
                  
                  {/* Search dan Filter */}
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input 
                        placeholder="Cari jadwal..." 
                        className="pl-10 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <Select value={filterDay} onValueChange={setFilterDay}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Hari" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Hari</SelectItem>
                        {daysOfWeek.map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterClass} onValueChange={setFilterClass}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kelas</SelectItem>
                        {ensureArray<Kelas>(classes).filter(kelas => hasValidId(kelas)).map((kelas) => {
                          const value = getSelectValue(kelas.id);
                          return value ? (
                            <SelectItem key={kelas.id} value={value}>
                              {kelas.nama_kelas}
                            </SelectItem>
                          ) : null;
                        })}
                      </SelectContent>
                    </Select>
                    
                    {(searchTerm || filterDay || filterClass) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setFilterDay('');
                          setFilterClass('');
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredSchedules.length === 0 ? (
                    <div className="text-center py-12">
                      {ensureArray<Schedule>(schedules).length === 0 ? (
                        <>
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada jadwal</h3>
                          <p className="text-gray-500 mb-4">Mulai dengan menambahkan jadwal pelajaran pertama</p>
                          <Button onClick={() => document.getElementById('kelas_id')?.scrollIntoView({ behavior: 'smooth' })}>
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Jadwal
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-yellow-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada jadwal yang cocok</h3>
                          <p className="text-gray-500 mb-4">Coba ubah kata kunci pencarian atau filter</p>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setSearchTerm('');
                              setFilterDay('');
                              setFilterClass('');
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reset Filter
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredSchedules.map((schedule) => (
                        <div key={schedule.id} className={`p-4 hover:bg-gray-50 transition-colors ${schedule.has_conflict ? 'bg-red-50 border-l-4 border-red-500' : ''}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <h4 className="font-semibold text-gray-900">{schedule.nama_kelas}</h4>
                                </div>
                      {schedule.has_conflict && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Bentrok
                        </Badge>
                      )}
                    </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium text-gray-700">{schedule.nama_mapel}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-gray-600">{schedule.nama_guru}</span>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm text-gray-600">
                                      {schedule.hari}, Jam {schedule.jam_ke}: {schedule.jam_mulai}-{schedule.jam_selesai}
                                    </span>
                                  </div>
                    {schedule.nama_ruang && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-purple-500" />
                                      <span className="text-sm text-gray-600">
                                        {schedule.nama_ruang} ({schedule.kode_ruang})
                                      </span>
                                    </div>
                                  )}
                  </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEdit(schedule)}
                                className="hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleDelete(schedule.id)}
                                className="hover:bg-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                        </div>
                      ))}
                    </div>
            )}
          </div>
              </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </div>
  );
};



// Live Student Attendance View
interface LiveStudentRow {
  id?: number;
  nama: string;
  nis: string;
  nama_kelas: string;
  status: string;
  waktu_absen: string | null;
  keterangan: string | null;
  keterangan_waktu?: string;
  periode_absen?: string;
}

const LiveStudentAttendanceView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [attendanceData, setAttendanceData] = useState<LiveStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Update waktu setiap detik
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [attendanceData]);

  // Calculate pagination
  const totalPages = Math.ceil(attendanceData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = attendanceData.slice(startIndex, endIndex);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setError('');
        console.log('🔄 Fetching live student attendance data...');
        const response = await fetch('/api/admin/live-student-attendance', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Error",
              description: "Sesi Anda telah berakhir. Silakan login ulang.",
              variant: "destructive"
            });
            setTimeout(() => onLogout(), 2000);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Live student attendance data received:', data.length, 'records');
        setAttendanceData(data);
      } catch (error: unknown) {
        console.error('❌ Error fetching live student attendance:', error);
        const message = error instanceof Error ? error.message : String(error);
        setError('Gagal memuat data absensi siswa: ' + message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
    const interval = setInterval(fetchStudentData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [onLogout]);

  // Fungsi untuk mengelompokkan data berdasarkan waktu
  const groupAttendanceByTime = (data: LiveStudentRow[]) => {
    const groups = {
      pagi: data.filter(item => {
        if (!item.waktu_absen) return false;
        const hour = parseInt(item.waktu_absen.split(':')[0]);
        return hour >= 6 && hour < 12;
      }),
      siang: data.filter(item => {
        if (!item.waktu_absen) return false;
        const hour = parseInt(item.waktu_absen.split(':')[0]);
        return hour >= 12 && hour < 15;
      }),
      sore: data.filter(item => {
        if (!item.waktu_absen) return false;
        const hour = parseInt(item.waktu_absen.split(':')[0]);
        return hour >= 15 && hour < 18;
      }),
      belumAbsen: data.filter(item => !item.waktu_absen)
    };
    return groups;
  };

  // Komponen statistik kehadiran
  const AttendanceStats = ({ data }: { data: LiveStudentRow[] }) => {
    const total = data.length;
    const hadir = data.filter(item => item.status === 'Hadir').length;
    const izin = data.filter(item => item.status === 'Izin').length;
    const sakit = data.filter(item => item.status === 'Sakit').length;
    const alpa = data.filter(item => item.status === 'Alpa').length;
    const dispen = data.filter(item => item.status === 'Dispen').length;
    
    const presentase = total > 0 ? Math.round((hadir / total) * 100) : 0;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{hadir}</p>
            <p className="text-sm text-green-600">Hadir</p>
            <p className="text-xs text-green-500">{total > 0 ? Math.round((hadir/total)*100) : 0}%</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{izin}</p>
            <p className="text-sm text-yellow-600">Izin</p>
            <p className="text-xs text-yellow-500">{total > 0 ? Math.round((izin/total)*100) : 0}%</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{sakit}</p>
            <p className="text-sm text-blue-600">Sakit</p>
            <p className="text-xs text-blue-500">{total > 0 ? Math.round((sakit/total)*100) : 0}%</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{alpa}</p>
            <p className="text-sm text-red-600">Alpa</p>
            <p className="text-xs text-red-500">{total > 0 ? Math.round((alpa/total)*100) : 0}%</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{dispen}</p>
            <p className="text-sm text-purple-600">Dispen</p>
            <p className="text-xs text-purple-500">{total > 0 ? Math.round((dispen/total)*100) : 0}%</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{total}</p>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xs text-gray-500">{presentase}% Hadir</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Komponen progress bar kehadiran
  const AttendanceProgress = ({ data }: { data: LiveStudentRow[] }) => {
    const total = data.length;
    const hadir = data.filter(item => item.status === 'Hadir').length;
    
    const presentase = total > 0 ? Math.round((hadir / total) * 100) : 0;
    
    return (
      <Card className="border-green-200 bg-green-50 mb-6">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-green-600">{presentase}%</p>
            <p className="text-sm text-green-600">Tingkat Kehadiran Siswa Hari Ini</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Hadir: {hadir} dari {total} siswa</span>
              <span className="text-green-600 font-medium">{presentase}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-500 ease-out" 
                style={{width: `${presentase}%`}}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Komponen pagination
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Menampilkan {startIndex + 1} - {Math.min(endIndex, attendanceData.length)} dari {attendanceData.length} data
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {getPageNumbers().map((page, index) => (
            <Button
              key={`page-${page}-${index}`}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' && setCurrentPage(page)}
              disabled={page === '...'}
              className={page === '...' ? 'cursor-default' : ''}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </Button>
        </div>
      </div>
    );
  };

  const handleExport = () => {
    try {
      if (!attendanceData || attendanceData.length === 0) {
        alert('Tidak ada data untuk diekspor');
        return;
      }

      console.log('📤 Exporting live student attendance data...');

      // Prepare data for Excel export
      const exportData = attendanceData.map((student: LiveStudentRow, index: number) => ({
        'No': index + 1,
        'Nama Siswa': student.nama || '',
        'NIS': student.nis || '',
        'Kelas': student.nama_kelas || '',
        'Status': student.status || '',
        'Waktu Absen': student.waktu_absen || '',
        'Ket. Waktu': student.keterangan_waktu || '',
        'Periode': student.periode_absen || '',
        'Keterangan': student.keterangan || ''
      }));

      // Create CSV content with UTF-8 BOM
      const BOM = '\uFEFF';
      const headers = Object.keys(exportData[0]).join(',');
      const rows = exportData.map(row =>
        Object.values(row).map(value =>
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      const csvContent = BOM + headers + '\n' + rows.join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `pemantauan_siswa_live_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      console.log('✅ Live student attendance exported successfully');
    } catch (error: unknown) {
      console.error('❌ Error exporting live student attendance:', error);
      const message = error instanceof Error ? error.message : String(error);
      alert('Gagal mengekspor data: ' + message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat data pemantauan siswa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={onBack} variant="outline">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Menu Laporan
      </Button>

      {/* Info Hari dan Waktu */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-800">
                  {currentTime.toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-blue-600">
                  Jam: {currentTime.toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Data Real-time</p>
              <p className="text-xs text-blue-500">Update setiap 30 detik</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistik Kehadiran */}
      <AttendanceStats data={attendanceData} />

      {/* Progress Bar Kehadiran */}
      <AttendanceProgress data={attendanceData} />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Pemantauan Siswa Langsung
              </CardTitle>
              <CardDescription>
                Daftar absensi siswa secara realtime untuk hari ini. Data diperbarui setiap 30 detik.
              </CardDescription>
            </div>
            <Button onClick={handleExport} size="sm" disabled={!attendanceData?.length}>
              <Download className="w-4 h-4 mr-2" />
              Export ke CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceData && attendanceData.length > 0 ? (
            <React.Fragment key="attendance-content">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>NIS</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Waktu Absen</TableHead>
                      <TableHead>Ket. Waktu</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((student: LiveStudentRow, index: number) => (
                      <TableRow key={student.id || index}>
                        <TableCell>{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium">{student.nama}</TableCell>
                        <TableCell>{student.nis}</TableCell>
                        <TableCell>{student.nama_kelas}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.status === 'Hadir'
                              ? 'bg-green-100 text-green-800'
                              : student.status === 'Sakit' || student.status === 'Izin'
                              ? 'bg-yellow-100 text-yellow-800'
                              : student.status === 'Dispen'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {student.waktu_absen ? (
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {student.waktu_absen}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.keterangan_waktu === 'Tepat Waktu' ? 'bg-green-100 text-green-800' :
                            student.keterangan_waktu === 'Terlambat Ringan' ? 'bg-yellow-100 text-yellow-800' :
                            student.keterangan_waktu === 'Terlambat' ? 'bg-orange-100 text-orange-800' :
                            student.keterangan_waktu === 'Terlambat Berat' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {student.keterangan_waktu || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.periode_absen === 'Pagi' ? 'bg-blue-100 text-blue-800' :
                            student.periode_absen === 'Siang' ? 'bg-yellow-100 text-yellow-800' :
                            student.periode_absen === 'Sore' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {student.periode_absen || '-'}
                          </span>
                        </TableCell>
                        <TableCell>{student.keterangan || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination />
            </React.Fragment>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data absensi siswa</p>
              <p className="text-sm">Data akan muncul saat siswa melakukan absensi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};



// Banding Absen Report Component
const BandingAbsenReportView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
    const [reportData, setReportData] = useState<{
      id_banding: number;
      tanggal_pengajuan: string;
      tanggal_absen: string;
      nama_pengaju: string;
      nama_kelas: string;
      nama_mapel: string;
      nama_guru: string;
      jam_mulai: string;
      jam_selesai: string;
      status_asli: string;
      status_diajukan: string;
      alasan_banding: string;
      status_banding: string;
      catatan_guru: string;
      tanggal_keputusan: string;
      diproses_oleh: string;
      jenis_banding: string;
      jumlah_siswa_banding: number;
    }[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
    const [selectedKelas, setSelectedKelas] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [classes, setClasses] = useState<Kelas[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchClasses = useCallback(async () => {
      try {
        setError(null);
        const data = await apiCall('/api/admin/kelas', {}, onLogout);
        if (Array.isArray(data)) {
          setClasses(data);
        } else {
          setClasses([]);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Gagal memuat data kelas');
        setClasses([]);
      }
    }, [onLogout]);

    useEffect(() => {
      fetchClasses();
    }, [fetchClasses]);

    const fetchReportData = async () => {
      if (!dateRange.startDate || !dateRange.endDate) {
        setError('Mohon pilih tanggal mulai dan tanggal selesai');
        toast({
          title: "Error",
          description: "Mohon pilih tanggal mulai dan tanggal selesai",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);
      setError(null);
      setReportData([]); // Reset data sebelum load ulang
      
      try {
        const params = new URLSearchParams();
        
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
        
        if (selectedKelas && selectedKelas !== "all") {
          params.append('kelas_id', selectedKelas);
        }
        
        if (selectedStatus && selectedStatus !== "all") {
          params.append('status', selectedStatus);
        }

        console.log('Fetching banding absen report with params:', params.toString());

        const response = await fetch(`/api/admin/banding-absen-report?${params}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Banding absen report data:', data);
          
          if (Array.isArray(data)) {
            setReportData(data);
            if (data.length > 0) {
              toast({
                title: "Berhasil",
                description: `Data laporan berhasil dimuat (${data.length} record)`
              });
            } else {
              toast({
                title: "Info",
                description: "Tidak ada data banding absen ditemukan untuk periode yang dipilih"
              });
            }
          } else {
            setReportData([]);
            toast({
              title: "Info",
              description: "Tidak ada data ditemukan untuk periode yang dipilih"
            });
          }
        } else {
          if (response.status === 401) {
            toast({
              title: "Error",
              description: "Sesi Anda telah berakhir. Silakan login ulang.",
              variant: "destructive"
            });
            setTimeout(() => onLogout(), 2000);
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Terjadi kesalahan' }));
            console.error('Error response:', errorData);
            setError(errorData.error || 'Gagal memuat data laporan');
            toast({
              title: "Error", 
              description: errorData.error || "Gagal memuat data laporan",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Network error:', error);
        setError('Terjadi kesalahan jaringan. Pastikan server berjalan.');
        toast({
          title: "Error",
          description: "Terjadi kesalahan jaringan. Pastikan server berjalan.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const downloadExcel = async () => {
      try {
        const params = new URLSearchParams();
        
        if (dateRange.startDate && dateRange.endDate) {
          params.append('startDate', dateRange.startDate);
          params.append('endDate', dateRange.endDate);
        }
        
        if (selectedKelas && selectedKelas !== "all") {
          params.append('kelas_id', selectedKelas);
        }
        
        if (selectedStatus) {
          params.append('status', selectedStatus);
        }

        console.log('Downloading banding absen report with params:', params.toString());

        const response = await fetch(`/api/admin/download-banding-absen?${params}`, {
          credentials: 'include',
          headers: {
            'Accept': 'text/csv, application/vnd.ms-excel',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `riwayat-banding-absen-${dateRange.startDate || 'all'}-${dateRange.endDate || 'all'}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "Berhasil",
            description: "Laporan berhasil didownload dalam format CSV"
          });
        } else {
          if (response.status === 401) {
            toast({
              title: "Error",
              description: "Sesi Anda telah berakhir. Silakan login ulang.",
              variant: "destructive"
            });
            setTimeout(() => onLogout(), 2000);
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Gagal mendownload laporan' }));
            console.error('Download error:', errorData);
            toast({
              title: "Error",
              description: errorData.error || "Gagal mendownload laporan", 
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Download network error:', error);
        toast({
          title: "Error",
          description: "Terjadi kesalahan jaringan saat download. Pastikan server berjalan.",
          variant: "destructive" 
        });
      }
    };

    const downloadSMKN13Format = async (exportType: string) => {
      if (reportData.length === 0) {
        setError('Tidak ada data untuk diunduh');
        return;
      }

      if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
        setError('Mohon pilih tanggal mulai dan tanggal selesai');
        toast({
          title: "Error",
          description: "Mohon pilih tanggal mulai dan tanggal selesai",
          variant: "destructive"
        });
        return;
      }

      try {
        const params = new URLSearchParams();
        
        if (dateRange && dateRange.startDate) {
          params.append('startDate', dateRange.startDate);
        }
        
        if (dateRange && dateRange.endDate) {
          params.append('endDate', dateRange.endDate);
        }
        
        if (selectedKelas && selectedKelas !== "all") {
          params.append('kelas_id', selectedKelas);
        }
        
        if (selectedStatus && selectedStatus !== 'all-status') {
          params.append('status', selectedStatus);
        }

        const url = `/api/export/${exportType}?${params.toString()}`;
        const response = await fetch(url, { 
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `banding-absen-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        toast({
          title: "Berhasil",
          description: "Laporan berhasil didownload dalam format SMKN13"
        });
      } catch (error) {
        console.error('Error downloading SMKN13 format:', error);
        setError(`Gagal mengunduh file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        toast({
          title: "Error",
          description: "Gagal mengunduh file",
          variant: "destructive"
        });
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Riwayat Pengajuan Banding Absen</h1>
            <p className="text-gray-600">Laporan dan history pengajuan banding absensi</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          </Card>
        )}

        {/* Filter */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Filter Laporan</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date">Tanggal Mulai</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="end-date">Tanggal Selesai</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
            <div>
              <Label>Kelas (Opsional)</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {ensureArray<Kelas>(classes).filter(kelas => hasValidId(kelas)).map((kelas) => {
                    const value = getSelectValue(kelas.id);
                    return value ? (
                      <SelectItem key={kelas.id} value={value}>
                        {kelas.nama_kelas}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status Banding</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="disetujui">Disetujui</SelectItem>
                  <SelectItem value="ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={fetchReportData} disabled={loading}>
              {loading ? 'Memuat...' : 'Tampilkan Laporan'}
            </Button>
            <Button onClick={downloadExcel} variant="outline" disabled={loading || reportData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </Card>

        {/* Report Data */}
        {loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Sedang memuat data laporan...</p>
            </CardContent>
          </Card>
        )}

        {!loading && reportData.length === 0 && !error && (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Belum ada data banding absen untuk ditampilkan</p>
              <p className="text-sm text-gray-500">Pilih filter dan klik "Tampilkan Laporan" untuk melihat data</p>
              <p className="text-xs text-gray-400 mt-2">Pastikan ada pengajuan banding absen dalam periode yang dipilih</p>
            </CardContent>
          </Card>
        )}

        {reportData.length > 0 && (
          <ExcelPreview
            title="Laporan Banding Absen"
            reportKey={VIEW_TO_REPORT_KEY['banding-absen-report']}
            data={reportData.map((record) => ({
              tanggal_pengajuan: record.tanggal_pengajuan,
              tanggal_absen: record.tanggal_absen,
              pengaju: record.nama_pengaju,
              kelas: record.nama_kelas,
              mata_pelajaran: record.nama_mapel || '-',
              status_asli: record.status_asli,
              status_diajukan: record.status_diajukan,
              status_banding: record.status_banding,
              jenis_banding: record.jenis_banding,
              jumlah_siswa: record.jumlah_siswa_banding,
              alasan: record.alasan_banding || '-',
              catatan_guru: record.catatan_guru || '-',
              tanggal_keputusan: record.tanggal_keputusan || '-'
            }))}
            columns={[
              { key: 'tanggal_pengajuan', label: 'Tanggal Pengajuan', width: 120, align: 'center', format: 'date' },
              { key: 'tanggal_absen', label: 'Tanggal Absen', width: 120, align: 'center', format: 'date' },
              { key: 'pengaju', label: 'Pengaju', width: 150, align: 'left' },
              { key: 'kelas', label: 'Kelas', width: 100, align: 'center' },
              { key: 'mata_pelajaran', label: 'Mata Pelajaran', width: 150, align: 'left' },
              { key: 'status_asli', label: 'Status Asli', width: 100, align: 'center' },
              { key: 'status_diajukan', label: 'Status Diajukan', width: 120, align: 'center' },
              { key: 'status_banding', label: 'Status Banding', width: 120, align: 'center' },
              { key: 'jenis_banding', label: 'Jenis', width: 100, align: 'center' },
              { key: 'jumlah_siswa', label: 'Jumlah Siswa', width: 100, align: 'center', format: 'number' },
              { key: 'alasan', label: 'Alasan', width: 200, align: 'left' },
              { key: 'catatan_guru', label: 'Catatan Guru', width: 200, align: 'left' },
              { key: 'tanggal_keputusan', label: 'Tanggal Keputusan', width: 120, align: 'center', format: 'date' }
            ]}
            onExport={downloadExcel}
            onExportSMKN13={() => downloadSMKN13Format('banding-absen')}
          />
        )}
      </div>
    );
};

// Live Teacher Attendance View
interface LiveTeacherRow {
  id?: number;
  nama: string;
  nip: string;
  nama_mapel: string;
  nama_kelas: string;
  jam_mulai: string;
  jam_selesai: string;
  status: string;
  waktu_absen: string | null;
  keterangan: string | null;
  keterangan_waktu?: string;
  periode_absen?: string;
}

const LiveTeacherAttendanceView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
    const [attendanceData, setAttendanceData] = useState<LiveTeacherRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Update waktu setiap detik
    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    // Reset to first page when data changes
    useEffect(() => {
      setCurrentPage(1);
    }, [attendanceData]);

    // Calculate pagination
    const totalPages = Math.ceil(attendanceData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = attendanceData.slice(startIndex, endIndex);

    useEffect(() => {
      const fetchTeacherData = async () => {
        try {
          setError('');
          console.log('🔄 Fetching live teacher attendance data...');
          const response = await fetch('/api/admin/live-teacher-attendance', { 
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              toast({
                title: "Error",
                description: "Sesi Anda telah berakhir. Silakan login ulang.",
                variant: "destructive"
              });
              setTimeout(() => onLogout(), 2000);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('✅ Live teacher attendance data received:', data.length, 'records');
          setAttendanceData(data);
        } catch (error) {
          console.error('❌ Error fetching live teacher attendance:', error);
          setError('Gagal memuat data absensi guru: ' + error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchTeacherData();
      const interval = setInterval(fetchTeacherData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }, [onLogout]);

    // Komponen statistik kehadiran guru
    const TeacherAttendanceStats = ({ data }: { data: LiveTeacherRow[] }) => {
      const total = data.length;
      const hadir = data.filter(item => item.status === 'Hadir').length;
      const tidakHadir = data.filter(item => item.status === 'Tidak Hadir').length;
      const sakit = data.filter(item => item.status === 'Sakit').length;
      const izin = data.filter(item => item.status === 'Izin').length;
      const dispen = data.filter(item => item.status === 'Dispen').length;
      const belumAbsen = data.filter(item => item.status === 'Belum Absen').length;
      
      const presentase = total > 0 ? Math.round((hadir / total) * 100) : 0;
      
      return (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{hadir}</p>
              <p className="text-sm text-green-600">Hadir</p>
              <p className="text-xs text-green-500">{total > 0 ? Math.round((hadir/total)*100) : 0}%</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{tidakHadir}</p>
              <p className="text-sm text-red-600">Tidak Hadir</p>
              <p className="text-xs text-red-500">{total > 0 ? Math.round((tidakHadir/total)*100) : 0}%</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{sakit}</p>
              <p className="text-sm text-blue-600">Sakit</p>
              <p className="text-xs text-blue-500">{total > 0 ? Math.round((sakit/total)*100) : 0}%</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{izin}</p>
              <p className="text-sm text-yellow-600">Izin</p>
              <p className="text-xs text-yellow-500">{total > 0 ? Math.round((izin/total)*100) : 0}%</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{dispen}</p>
              <p className="text-sm text-purple-600">Dispen</p>
              <p className="text-xs text-purple-500">{total > 0 ? Math.round((dispen/total)*100) : 0}%</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{belumAbsen}</p>
              <p className="text-sm text-gray-600">Belum Absen</p>
              <p className="text-xs text-gray-500">{total > 0 ? Math.round((belumAbsen/total)*100) : 0}%</p>
            </CardContent>
          </Card>
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{total}</p>
              <p className="text-sm text-indigo-600">Total</p>
              <p className="text-xs text-indigo-500">{presentase}% Hadir</p>
            </CardContent>
          </Card>
        </div>
      );
    };

    // Komponen progress bar kehadiran guru
    const TeacherAttendanceProgress = ({ data }: { data: LiveTeacherRow[] }) => {
      const total = data.length;
      const hadir = data.filter(item => item.status === 'Hadir').length;
      
      const presentase = total > 0 ? Math.round((hadir / total) * 100) : 0;
      
      return (
        <Card className="border-indigo-200 bg-indigo-50 mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-indigo-600">{presentase}%</p>
              <p className="text-sm text-indigo-600">Tingkat Kehadiran Guru Hari Ini</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hadir: {hadir} dari {total} guru</span>
                <span className="text-indigo-600 font-medium">{presentase}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out" 
                  style={{width: `${presentase}%`}}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    };

    // Komponen pagination untuk guru
    const TeacherPagination = () => {
      if (totalPages <= 1) return null;

      const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
          for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) {
              pages.push(i);
            }
            pages.push('...');
            pages.push(totalPages);
          } else if (currentPage >= totalPages - 2) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 3; i <= totalPages; i++) {
              pages.push(i);
            }
          } else {
            pages.push(1);
            pages.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
              pages.push(i);
            }
            pages.push('...');
            pages.push(totalPages);
          }
        }
        
        return pages;
      };

      return (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Menampilkan {startIndex + 1} - {Math.min(endIndex, attendanceData.length)} dari {attendanceData.length} data
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {getPageNumbers().map((page, index) => (
              <Button
                key={`page-${page}-${index}`}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                disabled={page === '...'}
                className={page === '...' ? 'cursor-default' : ''}
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      );
    };

    const handleExport = () => {
      try {
        if (!attendanceData || attendanceData.length === 0) {
          toast({
            title: "Info",
            description: "Tidak ada data untuk diekspor"
          });
          return;
        }

        console.log('📤 Exporting live teacher attendance data...');
        
        // Prepare data for Excel export
        const exportData = attendanceData.map((teacher, index) => ({
          'No': index + 1,
          'Nama Guru': teacher.nama || '',
          'NIP': teacher.nip || '',
          'Mata Pelajaran': teacher.nama_mapel || '',
          'Kelas': teacher.nama_kelas || '',
          'Jadwal': `${teacher.jam_mulai || ''} - ${teacher.jam_selesai || ''}`,
          'Status': teacher.status || '',
          'Waktu Absen': teacher.waktu_absen || '',
          'Ket. Waktu': teacher.keterangan_waktu || '',
          'Periode': teacher.periode_absen || '',
          'Keterangan': teacher.keterangan || ''
        }));

        // Create CSV content with UTF-8 BOM
        const BOM = '\uFEFF';
        const headers = Object.keys(exportData[0]).join(',');
        const rows = exportData.map(row => 
          Object.values(row).map(value => 
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          ).join(',')
        );
        const csvContent = BOM + headers + '\n' + rows.join('\n');

        // Download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pemantauan_guru_live_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        toast({
          title: "Berhasil",
          description: "Data guru berhasil diekspor ke CSV"
        });
        console.log('✅ Live teacher attendance exported successfully');
      } catch (error) {
        console.error('❌ Error exporting live teacher attendance:', error);
        toast({
          title: "Error",
          description: "Gagal mengekspor data: " + error.message,
          variant: "destructive"
        });
      }
    };

    if (loading) {
      return (
        <div className="space-y-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Menu Laporan
          </Button>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data pemantauan guru...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Menu Laporan
        </Button>

        {/* Info Hari dan Waktu */}
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="font-semibold text-indigo-800">
                    {currentTime.toLocaleDateString('id-ID', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-indigo-600">
                    Jam: {currentTime.toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-indigo-600">Data Real-time</p>
                <p className="text-xs text-indigo-500">Update setiap 30 detik</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center text-red-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistik Kehadiran Guru */}
        <TeacherAttendanceStats data={attendanceData} />

        {/* Progress Bar Kehadiran Guru */}
        <TeacherAttendanceProgress data={attendanceData} />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Pemantauan Guru Langsung
                </CardTitle>
                <CardDescription>
                  Daftar validasi kehadiran guru secara realtime untuk hari ini. Data diperbarui setiap 30 detik.
                </CardDescription>
              </div>
              <Button onClick={handleExport} size="sm" disabled={!attendanceData?.length}>
                <Download className="w-4 h-4 mr-2" />
                Export ke CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {attendanceData && attendanceData.length > 0 ? (
              <React.Fragment key="teacher-attendance-content">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Nama Guru</TableHead>
                        <TableHead>NIP</TableHead>
                        <TableHead>Mata Pelajaran</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Jadwal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Waktu Absen</TableHead>
                        <TableHead>Ket. Waktu</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentData.map((teacher, index) => (
                        <TableRow key={teacher.id || index}>
                          <TableCell>{startIndex + index + 1}</TableCell>
                          <TableCell className="font-medium">{teacher.nama}</TableCell>
                          <TableCell>{teacher.nip}</TableCell>
                          <TableCell>{teacher.nama_mapel}</TableCell>
                          <TableCell>{teacher.nama_kelas}</TableCell>
                          <TableCell>{teacher.jam_mulai} - {teacher.jam_selesai}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              teacher.status === 'Hadir' 
                                ? 'bg-green-100 text-green-800' 
                                : teacher.status === 'Sakit' || teacher.status === 'Izin'
                                ? 'bg-yellow-100 text-yellow-800'
                                : teacher.status === 'Dispen'
                                ? 'bg-purple-100 text-purple-800'
                                : teacher.status === 'Belum Absen'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {teacher.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {teacher.waktu_absen ? (
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {teacher.waktu_absen}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              teacher.keterangan_waktu === 'Tepat Waktu' ? 'bg-green-100 text-green-800' :
                              teacher.keterangan_waktu === 'Terlambat Ringan' ? 'bg-yellow-100 text-yellow-800' :
                              teacher.keterangan_waktu === 'Terlambat' ? 'bg-orange-100 text-orange-800' :
                              teacher.keterangan_waktu === 'Terlambat Berat' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {teacher.keterangan_waktu || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              teacher.periode_absen === 'Pagi' ? 'bg-blue-100 text-blue-800' :
                              teacher.periode_absen === 'Siang' ? 'bg-yellow-100 text-yellow-800' :
                              teacher.periode_absen === 'Sore' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {teacher.periode_absen || '-'}
                            </span>
                          </TableCell>
                          <TableCell>{teacher.keterangan || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <TeacherPagination />
              </React.Fragment>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada data absensi guru hari ini</p>
                <p className="text-sm">Data akan muncul saat guru melakukan absensi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
};

// Analytics Dashboard View
const AnalyticsDashboardView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [processingNotif, setProcessingNotif] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
      const fetchAnalyticsData = async () => {
        try {
          setError('');
          console.log('🔄 Fetching analytics data...');
          const response = await fetch('/api/admin/analytics', { 
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              toast({
                title: "Error",
                description: "Sesi Anda telah berakhir. Silakan login ulang.",
                variant: "destructive"
              });
              setTimeout(() => onLogout(), 2000);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('✅ Analytics data received:', data);
          setAnalyticsData(data);
        } catch (error) {
          console.error('❌ Error fetching analytics data:', error);
          setError('Gagal memuat data analitik: ' + error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchAnalyticsData();
    }, [onLogout]);

    const handlePermissionRequest = async (notificationId: number, newStatus: 'disetujui' | 'ditolak') => {
      setProcessingNotif(notificationId);
      try {
        const response = await fetch(`/api/admin/izin/${notificationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: "Berhasil",
            description: `Permintaan berhasil ${newStatus}`
          });
          setAnalyticsData(prevData => {
            if (!prevData) return null;
            const updatedNotifications = prevData.notifications.map(notif =>
              notif.id === notificationId ? { ...notif, status: newStatus } : notif
            );
            return { ...prevData, notifications: updatedNotifications };
          });
        } else {
          toast({
            title: "Error",
            description: data.error || 'Gagal memproses permintaan',
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Tidak dapat terhubung ke server",
          variant: "destructive"
        });
      } finally {
        setProcessingNotif(null);
      }
    };

    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Menu Laporan
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dasbor Analitik</h1>
              <p className="text-gray-600">Memuat data analitik...</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data analitik...</p>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Menu Laporan
          </Button>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center text-red-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!analyticsData) {
      return (
        <div className="space-y-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Menu Laporan
          </Button>
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Gagal memuat data analitik</p>
          </div>
        </div>
      );
    }

    const { studentAttendance, teacherAttendance, topAbsentStudents, topAbsentTeachers, notifications } = analyticsData;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Menu Laporan
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2" />
              Dasbor Analitik
            </h1>
            <p className="text-gray-600">Analisis dan statistik kehadiran siswa dan guru</p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Student Attendance Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Grafik Kehadiran Siswa</CardTitle>
              <CardDescription>Statistik kehadiran siswa per periode</CardDescription>
            </CardHeader>
            <CardContent>
              {studentAttendance && studentAttendance.length > 0 ? (
                <div className="h-[300px]">
                  <div className="space-y-4">
                    {studentAttendance.map((item, index) => (
                      <div key={`student-attendance-${item.periode || index}`} className="p-4 border rounded-lg">
                        <h3 className="font-medium text-gray-900">{item.periode}</h3>
                        <div className="mt-2 flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-sm">Hadir: {item.hadir}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className="text-sm">Tidak Hadir: {item.tidak_hadir}</span>
                          </div>
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(item.hadir / (item.hadir + item.tidak_hadir)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada data kehadiran siswa</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Overview Sistem
              </CardTitle>
              <CardDescription>Kelola data & pantau aktivitas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* System Overview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                    <p className="text-xs font-medium text-green-800">Sistem Aktif</p>
                    <p className="text-xs text-green-600">Semua layanan berjalan</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
                    <p className="text-xs font-medium text-blue-800">Database</p>
                    <p className="text-xs text-blue-600">Terhubung & stabil</p>
                  </div>
                </div>

                

                {/* System Info */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Tanggal Hari Ini</span>
                    <span className="font-mono">{new Date().toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Waktu Server</span>
                    <span className="font-mono">{new Date().toLocaleTimeString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Total Siswa</span>
                    <span className="font-mono">{analyticsData?.totalStudents || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Attendance Chart */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Grafik Kehadiran Guru</CardTitle>
              <CardDescription>Statistik kehadiran guru per periode</CardDescription>
            </CardHeader>
            <CardContent>
              {teacherAttendance && teacherAttendance.length > 0 ? (
                <div className="h-[300px]">
                  <div className="grid gap-4 md:grid-cols-3">
                    {teacherAttendance.map((item, index) => (
                      <div key={`teacher-attendance-${item.periode || index}`} className="p-4 border rounded-lg">
                        <h3 className="font-medium text-gray-900">{item.periode}</h3>
                        <div className="mt-2 flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                            <span className="text-sm">Hadir: {item.hadir}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                            <span className="text-sm">Tidak Hadir: {item.tidak_hadir}</span>
                          </div>
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${(item.hadir / (item.hadir + item.tidak_hadir)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada data kehadiran guru</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Absent Students */}
          <Card>
            <CardHeader>
              <CardTitle>Siswa Sering Alpa</CardTitle>
              <CardDescription>5 siswa dengan tingkat alpa tertinggi</CardDescription>
            </CardHeader>
            <CardContent>
              {topAbsentStudents && topAbsentStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead className="text-right">Total Alpa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topAbsentStudents.map((student, index) => (
                        <TableRow key={`absent-student-${student.id || student.nama || index}`}>
                          <TableCell className="font-medium">{student.nama}</TableCell>
                          <TableCell>{student.nama_kelas}</TableCell>
                          <TableCell className="text-right">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                              {student.total_alpa}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada data siswa alpa</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Absent Teachers */}
          <Card>
            <CardHeader>
              <CardTitle>Guru Sering Tidak Hadir</CardTitle>
              <CardDescription>5 guru dengan tingkat tidak hadir tertinggi</CardDescription>
            </CardHeader>
            <CardContent>
              {topAbsentTeachers && topAbsentTeachers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Guru</TableHead>
                        <TableHead className="text-right">Total Tidak Hadir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topAbsentTeachers.map((teacher, index) => (
                        <TableRow key={`absent-teacher-${teacher.id || teacher.nama || index}`}>
                          <TableCell className="font-medium">{teacher.nama}</TableCell>
                          <TableCell className="text-right">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                              {teacher.total_tidak_hadir}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada data guru tidak hadir</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  

// Riwayat Pengajuan Izin Report View
const RiwayatIzinReportView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedJenisIzin, setSelectedJenisIzin] = useState('all-jenis');
  const [selectedStatus, setSelectedStatus] = useState('all-status');
  const [classes, setClasses] = useState([]);

  const jenisIzinOptions = [
    { value: 'all-jenis', label: 'Semua Jenis Izin' },
    { value: 'sakit', label: 'Sakit' },
    { value: 'izin', label: 'Izin' },
    { value: 'dispen', label: 'Dispen' },
    { value: 'keperluan_keluarga', label: 'Keperluan Keluarga' },
    { value: 'acara_sekolah', label: 'Acara Sekolah' },
    { value: 'lainnya', label: 'Lainnya' }
  ];

  const statusOptions = [
    { value: 'all-status', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' }
  ];

  // ===== New: Summary views components =====
  interface SummaryToolbarProps {
    title: string;
    onBack: () => void;
    onLogout: () => void;
    dateRange: { startDate: string; endDate: string };
    setDateRange: (range: { startDate: string; endDate: string }) => void;
    selectedKelas: string;
    setSelectedKelas: (kelas: string) => void;
    onShow: () => void;
    onDownload: () => void;
  }

  const SummaryToolbar = ({
    title,
    onBack,
    onLogout,
    dateRange,
    setDateRange,
    selectedKelas,
    setSelectedKelas,
    onShow,
    onDownload
  }: SummaryToolbarProps) => (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onLogout}><LogOut className="w-4 h-4 mr-2"/>Keluar</Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 items-end">
        <div>
          <Label>Dari Tanggal</Label>
          <Input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})} />
        </div>
        <div>
          <Label>Sampai Tanggal</Label>
          <Input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})} />
        </div>
        <div>
          <Label>Kelas</Label>
          <Select value={selectedKelas} onValueChange={setSelectedKelas}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Semua Kelas"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all" value="all">Semua</SelectItem>
              {classes?.filter(c => c.id).map((c: Kelas)=>(<SelectItem key={c.id} value={String(c.id)}>{c.nama_kelas}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onShow}><Search className="w-4 h-4 mr-2"/>Tampilkan</Button>
          <Button variant="outline" onClick={onDownload}><Download className="w-4 h-4 mr-2"/>Excel</Button>
        </div>
      </div>
      <h2 className="text-xl font-semibold mt-6">{title}</h2>
    </div>
  );

  interface SummaryTableProps {
    rows: Array<Record<string, string | number>>;
  }

  const SummaryTable = ({ rows }: SummaryTableProps) => (
    <div className="overflow-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">No</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead className="w-28">NIS/NIP</TableHead>
            <TableHead className="w-28">Kelas</TableHead>
            <TableHead className="text-center">H</TableHead>
            <TableHead className="text-center">I</TableHead>
            <TableHead className="text-center">S</TableHead>
            <TableHead className="text-center">A</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">Presentase</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows?.length ? rows.map((r: Record<string, string | number>, idx: number)=> (
            <TableRow key={idx}>
              <TableCell>{idx+1}</TableCell>
              <TableCell className="font-medium">{r.nama}</TableCell>
              <TableCell>{r.nis || r.nip || '-'}</TableCell>
              <TableCell>{r.nama_kelas || '-'}</TableCell>
              <TableCell className="text-center bg-emerald-50 text-emerald-700 font-semibold">{r.H||0}</TableCell>
              <TableCell className="text-center bg-blue-50 text-blue-700 font-semibold">{r.I||0}</TableCell>
              <TableCell className="text-center bg-red-50 text-red-700 font-semibold">{r.S||0}</TableCell>
              <TableCell className="text-center bg-yellow-50 text-yellow-700 font-semibold">{r.A||0}</TableCell>
              <TableCell className="text-center bg-purple-50 text-purple-700 font-semibold">{r.D||0}</TableCell>
              <TableCell className="text-center">{Number(r.presentase||0).toFixed(2)}%</TableCell>
            </TableRow>
          )) : (
            <TableRow><TableCell colSpan={10} className="text-center py-6 text-gray-500">Tidak ada data</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        console.log('🏫 Fetching classes for filter...');
        const response = await fetch('/api/kelas', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Classes data received:', data.length, 'classes');
          setClasses(data);
        } else {
          if (response.status === 401) {
            toast({
              title: "Error",
              description: "Sesi Anda telah berakhir. Silakan login ulang.",
              variant: "destructive"
            });
            setTimeout(() => onLogout(), 2000);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching classes:', error);
      }
    };

    fetchClasses();
  }, [onLogout]);

  const fetchReportData = async () => {
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      setError('Mohon pilih tanggal mulai dan tanggal selesai');
      toast({
        title: "Error",
        description: "Mohon pilih tanggal mulai dan tanggal selesai",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Fetching riwayat pengajuan izin report...');
      
      const params = new URLSearchParams();
      
      if (dateRange && dateRange.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      
      if (dateRange && dateRange.endDate) {
        params.append('endDate', dateRange.endDate);
      }
      
      if (selectedKelas && selectedKelas !== "all") {
        params.append('kelas_id', selectedKelas);
      }
      
      if (selectedJenisIzin && selectedJenisIzin !== 'all-jenis') {
        params.append('jenis_izin', selectedJenisIzin);
      }
      
      if (selectedStatus && selectedStatus !== 'all-status') {
        params.append('status', selectedStatus);
      }

      console.log('Request params:', params.toString());

      const response = await fetch(`/api/admin/riwayat-izin-report?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Riwayat izin report data received:', data.length, 'records');
        setReportData(data);
        
        toast({
          title: "Berhasil",
          description: `Data berhasil dimuat: ${data.length} pengajuan izin`
        });
      } else {
        if (response.status === 401) {
          toast({
            title: "Error",
            description: "Sesi Anda telah berakhir. Silakan login ulang.",
            variant: "destructive"
          });
          setTimeout(() => onLogout(), 2000);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching riwayat izin report:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: 'Gagal mengambil data: ' + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      setError('Mohon pilih tanggal mulai dan tanggal selesai');
      toast({
        title: "Error",
        description: "Mohon pilih tanggal mulai dan tanggal selesai",
        variant: "destructive"
      });
      return;
    }

    try {
      const params = new URLSearchParams();
      
      if (dateRange && dateRange.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      
      if (dateRange && dateRange.endDate) {
        params.append('endDate', dateRange.endDate);
      }
      
      if (selectedKelas && selectedKelas !== "all") {
        params.append('kelas_id', selectedKelas);
      }
      
      if (selectedJenisIzin && selectedJenisIzin !== 'all-jenis') {
        params.append('jenis_izin', selectedJenisIzin);
      }
      
      if (selectedStatus && selectedStatus !== 'all-status') {
        params.append('status', selectedStatus);
      }

      console.log('Downloading riwayat izin report with params:', params.toString());

      const response = await fetch(`/api/admin/download-riwayat-izin?${params}`, {
        credentials: 'include',
        headers: {
          'Accept': 'text/csv, application/vnd.ms-excel',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `riwayat-pengajuan-izin-${dateRange.startDate || 'all'}-${dateRange.endDate || 'all'}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Berhasil",
          description: "Laporan berhasil didownload dalam format CSV"
        });
      } else {
        if (response.status === 401) {
          toast({
            title: "Error",
            description: "Sesi Anda telah berakhir. Silakan login ulang.",
            variant: "destructive"
          });
          setTimeout(() => onLogout(), 2000);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error downloading riwayat izin report:', error);
      toast({
        title: "Error",
        description: 'Gagal download CSV: ' + error.message,
        variant: "destructive"
      });
    }
  };


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Menunggu' },
      'approved': { color: 'bg-green-100 text-green-800 border-green-200', text: 'Disetujui' },
      'rejected': { color: 'bg-red-100 text-red-800 border-red-200', text: 'Ditolak' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', text: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getJenisIzinBadge = (jenis: string) => {
    const jenisConfig = {
      'sakit': { color: 'bg-red-100 text-red-800 border-red-200', text: 'Sakit' },
      'izin': { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Izin' },
      'dispen': { color: 'bg-purple-100 text-purple-800 border-purple-200', text: 'Dispen' },
      'keperluan_keluarga': { color: 'bg-orange-100 text-orange-800 border-orange-200', text: 'Keperluan Keluarga' },
      'acara_sekolah': { color: 'bg-green-100 text-green-800 border-green-200', text: 'Acara Sekolah' },
      'lainnya': { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Lainnya' }
    };
    
    const config = jenisConfig[jenis] || { color: 'bg-gray-100 text-gray-800 border-gray-200', text: jenis };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const downloadSMKN13Format = async (exportType: string) => {
    if (reportData.length === 0) {
      setError('Tidak ada data untuk diunduh');
      return;
    }

    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      setError('Mohon pilih tanggal mulai dan tanggal selesai');
      toast({
        title: "Error",
        description: "Mohon pilih tanggal mulai dan tanggal selesai",
        variant: "destructive"
      });
      return;
    }

    try {
      const params = new URLSearchParams();
      
      if (dateRange && dateRange.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      
      if (dateRange && dateRange.endDate) {
        params.append('endDate', dateRange.endDate);
      }
      
      if (selectedKelas && selectedKelas !== "all") {
        params.append('kelas_id', selectedKelas);
      }
      
      if (selectedJenisIzin && selectedJenisIzin !== 'all-jenis') {
        params.append('jenis_izin', selectedJenisIzin);
      }
      
      if (selectedStatus && selectedStatus !== 'all-status') {
        params.append('status', selectedStatus);
      }

      const url = `/api/export/${exportType}?${params.toString()}`;
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `pengajuan-izin-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Berhasil",
        description: "Laporan berhasil didownload dalam format SMKN13"
      });
    } catch (error) {
      console.error('Error downloading SMKN13 format:', error);
      setError(`Gagal mengunduh file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Error",
        description: "Gagal mengunduh file",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClipboardList className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Riwayat Pengajuan Izin</h1>
              <p className="text-gray-600">Laporan lengkap pengajuan izin siswa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {ensureArray<Kelas>(classes).filter(kelas => hasValidId(kelas)).map((kelas) => {
                    const id = kelas.id_kelas || kelas.id;
                    const value = getSelectValue(id);
                    return value ? (
                      <SelectItem key={id} value={value}>
                        {kelas.nama_kelas}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jenisIzin">Jenis Izin</Label>
              <Select value={selectedJenisIzin} onValueChange={setSelectedJenisIzin}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  {jenisIzinOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchReportData} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
              {loading ? (
                <React.Fragment key="loading-state">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Memuat...
                </React.Fragment>
              ) : (
                <React.Fragment key="normal-state">
                  <Search className="w-4 h-4 mr-2" />
                  Tampilkan Data
                </React.Fragment>
              )}
            </Button>
            
            <Button onClick={downloadCSV} disabled={loading || reportData.length === 0} variant="outline" className="border-green-200 hover:bg-green-50">
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {reportData.length > 0 && (
        <ExcelPreview
          title="Riwayat Pengajuan Izin"
          reportKey={VIEW_TO_REPORT_KEY['riwayat-izin-report']}
          data={reportData.map((item, index) => ({
            tanggal_pengajuan: item.tanggal_pengajuan,
            tanggal_izin: item.tanggal_izin,
            nama_siswa: item.nama_siswa,
            nis: item.nis,
            kelas: item.nama_kelas,
            jenis_izin: item.jenis_izin,
            alasan: item.alasan,
            status: item.status,
            nama_guru: item.nama_guru,
            mata_pelajaran: item.nama_mapel,
            keterangan_guru: item.keterangan_guru || '-',
            tanggal_respon: item.tanggal_respon || '-'
          }))}
          columns={[
            { key: 'tanggal_pengajuan', label: 'Tanggal Pengajuan', width: 120, align: 'center', format: 'date' },
            { key: 'tanggal_izin', label: 'Tanggal Izin', width: 120, align: 'center', format: 'date' },
            { key: 'nama_siswa', label: 'Nama Siswa', width: 150, align: 'left' },
            { key: 'nis', label: 'NIS', width: 100, align: 'left' },
            { key: 'kelas', label: 'Kelas', width: 100, align: 'center' },
            { key: 'jenis_izin', label: 'Jenis Izin', width: 120, align: 'center' },
            { key: 'alasan', label: 'Alasan', width: 200, align: 'left' },
            { key: 'status', label: 'Status', width: 100, align: 'center' },
            { key: 'nama_guru', label: 'Guru', width: 150, align: 'left' },
            { key: 'mata_pelajaran', label: 'Mata Pelajaran', width: 150, align: 'left' },
            { key: 'keterangan_guru', label: 'Keterangan Guru', width: 200, align: 'left' },
            { key: 'tanggal_respon', label: 'Tanggal Respon', width: 120, align: 'center', format: 'date' }
          ]}
          onExport={downloadCSV}
          onExportSMKN13={() => downloadSMKN13Format('pengajuan-izin')}
        />
      )}

      {!loading && reportData.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data</h3>
            <p className="text-gray-500 text-center">Klik "Tampilkan Data" untuk melihat riwayat pengajuan izin</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Student Attendance Summary Component
const StudentAttendanceSummaryView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [reportData, setReportData] = useState<Array<Record<string, string | number>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedKelas, setSelectedKelas] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [classes, setClasses] = useState<Kelas[]>([]);

  const fetchClasses = useCallback(async () => {
    try {
      setError(null);
      const data = await apiCall('/api/admin/kelas', {}, onLogout);
      if (Array.isArray(data)) {
        setClasses(data);
      } else {
        console.error('Invalid classes data:', data);
        setClasses([]);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Gagal memuat data kelas');
    }
  }, [onLogout]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endDate = `${year}-${monthNum}-${lastDay}`;
      setDateRange({ startDate, endDate });
    }
  };

  const fetchReportData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Mohon pilih tanggal mulai dan tanggal selesai');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      if (selectedKelas && selectedKelas !== 'all') {
        params.append('kelas_id', selectedKelas);
      }

      const data = await apiCall(`/api/admin/student-attendance-summary?${params.toString()}`, { method: 'GET' }, onLogout);
      
      if (Array.isArray(data)) {
        setReportData(data);
      } else {
        console.error('Invalid report data:', data);
        setReportData([]);
        setError('Format data tidak valid');
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Gagal memuat data laporan');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    if (reportData.length === 0) {
      setError('Tidak ada data untuk diunduh');
      return;
    }

    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      if (selectedKelas && selectedKelas !== 'all') {
        params.append('kelas_id', selectedKelas);
      }

      const url = `/api/admin/download-student-attendance-excel?${params.toString()}`;
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        // Coba baca error message dari response
        let errorMessage = 'Gagal mengunduh file';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ringkasan-kehadiran-siswa-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      link.click();
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch (err) {
      console.error('Error downloading excel:', err);
      setError(`Gagal mengunduh file Excel: ${err.message}`);
    }
  };

  const downloadSMKN13Format = async (exportType) => {
    if (reportData.length === 0) {
      setError('Tidak ada data untuk diunduh');
      return;
    }

    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      if (selectedKelas && selectedKelas !== 'all') {
        params.append('kelas_id', selectedKelas);
      }

      const url = `/api/export/${exportType}?${params.toString()}`;
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
      link.download = `${exportType}-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ringkasan Kehadiran Siswa</h1>
          <p className="text-gray-600">Download ringkasan kehadiran siswa dalam format CSV</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        </Card>
      )}

      {/* Filter */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Filter Laporan</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="month">Bulan (Opsional)</Label>
            <Input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              placeholder="Pilih bulan"
            />
          </div>
          <div>
            <Label htmlFor="start-date">Tanggal Mulai</Label>
            <Input
              id="start-date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="end-date">Tanggal Selesai</Label>
            <Input
              id="end-date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            />
          </div>
          <div>
            <Label>Kelas (Opsional)</Label>
            <Select value={selectedKelas} onValueChange={setSelectedKelas}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {ensureArray<Kelas>(classes).filter(kelas => hasValidId(kelas)).map((kelas) => {
                  const value = getSelectValue(kelas.id);
                  return value ? (
                    <SelectItem key={kelas.id} value={value}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ) : null;
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={fetchReportData} disabled={loading}>
            {loading ? 'Memuat...' : 'Tampilkan Laporan'}
          </Button>
          <Button onClick={downloadExcel} variant="outline" disabled={loading || reportData.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </Card>

      {/* Report Data */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Sedang memuat data laporan...</p>
          </CardContent>
        </Card>
      )}

      {!loading && reportData.length === 0 && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Belum ada data untuk ditampilkan</p>
            <p className="text-sm text-gray-500">Pilih tanggal dan klik "Tampilkan Laporan" untuk melihat data</p>
          </CardContent>
        </Card>
      )}

      {reportData.length > 0 && (
        <ExcelPreview
          title="Ringkasan Kehadiran Siswa"
          reportKey={VIEW_TO_REPORT_KEY['student-attendance-summary']}
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
          onExportSMKN13={() => downloadSMKN13Format('student-summary')}
        />
      )}
    </div>
  );
};

// Teacher Attendance Summary Component
const TeacherAttendanceSummaryView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [reportData, setReportData] = useState<Array<Record<string, string | number>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedMonth, setSelectedMonth] = useState('');

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endDate = `${year}-${monthNum}-${lastDay}`;
      setDateRange({ startDate, endDate });
    }
  };

  const fetchReportData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Mohon pilih tanggal mulai dan tanggal selesai');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const data = await apiCall(`/api/admin/teacher-attendance-summary?${params.toString()}`, { method: 'GET' }, onLogout);
      
      if (Array.isArray(data)) {
        setReportData(data);
      } else {
        console.error('Invalid report data:', data);
        setReportData([]);
        setError('Format data tidak valid');
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Gagal memuat data laporan');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    if (reportData.length === 0) {
      setError('Tidak ada data untuk diunduh');
      return;
    }

    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const url = `/api/admin/download-teacher-attendance-excel?${params.toString()}`;
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        // Coba baca error message dari response
        let errorMessage = 'Gagal mengunduh file';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ringkasan-kehadiran-guru-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      link.click();
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch (err) {
      console.error('Error downloading excel:', err);
      setError(`Gagal mengunduh file Excel: ${err.message}`);
    }
  };

  const downloadSMKN13Format = async (exportType) => {
    if (reportData.length === 0) {
      setError('Tidak ada data untuk diunduh');
      return;
    }

    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const url = `/api/export/${exportType}?${params.toString()}`;
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
      link.download = `${exportType}-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ringkasan Kehadiran Guru</h1>
              <p className="text-gray-600">Download ringkasan kehadiran guru dalam format CSV</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="month">Bulan (Opsional)</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                placeholder="Pilih bulan"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchReportData} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <React.Fragment key="loading-state">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Memuat...
                </React.Fragment>
              ) : (
                <React.Fragment key="normal-state">
                  <Search className="w-4 h-4 mr-2" />
                  Tampilkan Data
                </React.Fragment>
              )}
            </Button>
            
            <Button onClick={downloadExcel} disabled={loading || reportData.length === 0} variant="outline" className="border-green-200 hover:bg-green-50">
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {reportData.length > 0 && (
        <ExcelPreview
          title="Ringkasan Kehadiran Guru"
          reportKey={VIEW_TO_REPORT_KEY['teacher-attendance-summary']}
          data={reportData.map((item, index) => ({
            no: index + 1,
            nama: item.nama,
            nip: item.nip || '-',
            hadir: item.H || 0,
            izin: item.I || 0,
            sakit: item.S || 0,
            alpa: item.A || 0,
            presentase: Number(item.presentase || 0).toFixed(2) + '%'
          }))}
          columns={[
            { key: 'no', label: 'No', width: 60, align: 'center', format: 'number' },
            { key: 'nama', label: 'Nama Guru', width: 200, align: 'left' },
            { key: 'nip', label: 'NIP', width: 150, align: 'left' },
            { key: 'hadir', label: 'H', width: 80, align: 'center', format: 'number' },
            { key: 'izin', label: 'I', width: 80, align: 'center', format: 'number' },
            { key: 'sakit', label: 'S', width: 80, align: 'center', format: 'number' },
            { key: 'alpa', label: 'A', width: 80, align: 'center', format: 'number' },
            { key: 'presentase', label: 'Presentase', width: 100, align: 'center', format: 'percentage' }
          ]}
          onExport={downloadExcel}
          onExportSMKN13={() => downloadSMKN13Format('teacher-summary')}
          showLetterhead={true}
          reportPeriod={`${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`}
        />
      )}

      {!loading && reportData.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data</h3>
            <p className="text-gray-500 text-center">Klik "Tampilkan Data" untuk melihat ringkasan kehadiran guru</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Student Promotion View Component
const StudentPromotionView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [fromClassId, setFromClassId] = useState<string>('');
  const [toClassId, setToClassId] = useState<string>('');
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await apiCall('/api/admin/kelas', {}, onLogout);
      // Handle response format: { success: true, data: { success: true, data: [...] } }
      const classes = response.data || response;
      setClasses(Array.isArray(classes) ? classes : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({ title: "Error memuat data kelas", description: error.message, variant: "destructive" });
    }
  }, [onLogout]);

  const fetchStudents = useCallback(async (classId: string) => {
    if (!classId) {
      console.log('❌ No classId provided to fetchStudents');
      return;
    }
    
    console.log('👥 Fetching students for classId:', classId);
    setIsLoading(true);
    try {
      const response = await apiCall('/api/admin/siswa', {}, onLogout);
      console.log('📊 Raw response:', response);
      
      // Handle nested response structure: response.data.data
      let students;
      if (response.data && response.data.data) {
        students = response.data.data;
      } else if (response.data) {
        students = response.data;
      } else {
        students = response;
      }
      
      console.log('📊 Raw students data:', students);
      console.log('🔍 Filtering students for classId:', classId);
      
      const filteredStudents = students.filter((student: StudentData) => {
        // Convert both to string for comparison
        const studentClassId = student.kelas_id?.toString();
        const targetClassId = classId.toString();
        const matches = studentClassId === targetClassId;
        console.log(`Student ${student.nama} (ID: ${student.id_siswa}) - kelas_id: ${studentClassId}, target: ${targetClassId}, matches: ${matches}`);
        return matches;
      });
      
      console.log('✅ Filtered students:', filteredStudents);
      setStudents(filteredStudents);
      setSelectedStudents(new Set()); // Reset selection
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      toast({ title: "Error memuat data siswa", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    console.log('🔄 useEffect triggered - fromClassId:', fromClassId);
    if (fromClassId && fromClassId.trim() !== '') {
      console.log('📞 Calling fetchStudents with classId:', fromClassId);
      fetchStudents(fromClassId);
    } else {
      console.log('🧹 Clearing students - no valid classId');
      setStudents([]);
      setSelectedStudents(new Set());
    }
  }, [fromClassId, fetchStudents]);

  // 🧠 SMART CLASS PARSER - Parsing nama kelas secara cerdas dan fleksibel
  const parseClassName = useCallback((className: string) => {
    console.log('🔤 Parsing class name:', className);
    const cleanName = className.trim().toUpperCase();
    console.log('🧹 Cleaned name:', cleanName);
    
    // Pattern yang lebih fleksibel untuk berbagai format kelas
    const patterns = [
      // Format standar: X IPA 1, XI IPS 2, XII BAHASA 1
      /^(X|XI|XII)\s+(IPA|IPS|BAHASA|AGAMA|UMUM|TEKNIK|MULTIMEDIA|TKJ|RPL|AKUNTANSI|PEMASARAN|ADMINISTRASI|KEBIDANAN|KEPERAWATAN|FARMASI|KIMIA|FISIKA|BIOLOGI|MATEMATIKA|BHS|BAHASA|SOSIAL|EKONOMI|SEJARAH|GEOGRAFI|SENI|OLAHRAGA|PENDIDIKAN|GURU|SISWA|KA|KEJURUAN|KEJURUANAN|KEJURUAN_AN|KEJURUAN-AN|AK)\s*(\d+)?$/,
      // Format dengan angka: 10 IPA 1, 11 IPS 2, 12 BAHASA 1
      /^(10|11|12)\s+(IPA|IPS|BAHASA|AGAMA|UMUM|TEKNIK|MULTIMEDIA|TKJ|RPL|AKUNTANSI|PEMASARAN|ADMINISTRASI|KEBIDANAN|KEPERAWATAN|FARMASI|KIMIA|FISIKA|BIOLOGI|MATEMATIKA|BHS|BAHASA|SOSIAL|EKONOMI|SEJARAH|GEOGRAFI|SENI|OLAHRAGA|PENDIDIKAN|GURU|SISWA|KA|KEJURUAN|KEJURUANAN|KEJURUAN_AN|KEJURUAN-AN|AK)\s*(\d+)?$/,
      // Format tanpa nomor: X IPA, XI IPS, XII BAHASA
      /^(X|XI|XII)\s+(IPA|IPS|BAHASA|AGAMA|UMUM|TEKNIK|MULTIMEDIA|TKJ|RPL|AKUNTANSI|PEMASARAN|ADMINISTRASI|KEBIDANAN|KEPERAWATAN|FARMASI|KIMIA|FISIKA|BIOLOGI|MATEMATIKA|BHS|BAHASA|SOSIAL|EKONOMI|SEJARAH|GEOGRAFI|SENI|OLAHRAGA|PENDIDIKAN|GURU|SISWA|KA|KEJURUAN|KEJURUANAN|KEJURUAN_AN|KEJURUAN-AN|AK)$/,
      // Format dengan dash: X-IPA-1, XI-IPS-2
      /^(X|XI|XII)[\s\-_]+(IPA|IPS|BAHASA|AGAMA|UMUM|TEKNIK|MULTIMEDIA|TKJ|RPL|AKUNTANSI|PEMASARAN|ADMINISTRASI|KEBIDANAN|KEPERAWATAN|FARMASI|KIMIA|FISIKA|BIOLOGI|MATEMATIKA|BHS|BAHASA|SOSIAL|EKONOMI|SEJARAH|GEOGRAFI|SENI|OLAHRAGA|PENDIDIKAN|GURU|SISWA|KA|KEJURUAN|KEJURUANAN|KEJURUAN_AN|KEJURUAN-AN|AK)[\s\-_]*(\d+)?$/,
      // Format dengan underscore: X_IPA_1, XI_IPS_2
      /^(X|XI|XII)[\s\-_]+(IPA|IPS|BAHASA|AGAMA|UMUM|TEKNIK|MULTIMEDIA|TKJ|RPL|AKUNTANSI|PEMASARAN|ADMINISTRASI|KEBIDANAN|KEPERAWATAN|FARMASI|KIMIA|FISIKA|BIOLOGI|MATEMATIKA|BHS|BAHASA|SOSIAL|EKONOMI|SEJARAH|GEOGRAFI|SENI|OLAHRAGA|PENDIDIKAN|GURU|SISWA|KA|KEJURUAN|KEJURUANAN|KEJURUAN_AN|KEJURUAN-AN|AK)[\s\-_]*(\d+)?$/,
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = cleanName.match(pattern);
      console.log(`🔍 Pattern ${i + 1}:`, pattern, 'match:', match);
      
      if (match) {
        let level = match[1];
        // Konversi angka ke romawi
        if (level === '10') level = 'X';
        if (level === '11') level = 'XI';
        if (level === '12') level = 'XII';
        
        let major = match[2];
        const number = match[3] ? parseInt(match[3]) : 1;
        
        // Mapping jurusan untuk kompatibilitas
        const majorMapping = {
          'KA': 'AK',  // KA -> AK (Akuntansi)
          'KEJURUAN': 'AK',
          'KEJURUANAN': 'AK',
          'KEJURUAN_AN': 'AK',
          'KEJURUAN-AN': 'AK'
        };
        
        if (majorMapping[major]) {
          major = majorMapping[major];
          console.log(`🔄 Mapped jurusan: ${match[2]} -> ${major}`);
        }
        
        const result = { level, major, number, fullName: className };
        console.log('✅ Parsed successfully:', result);
        return result;
      }
    }
    
    // Fallback: coba ekstrak tingkat dari awal string
    console.log('🔄 Trying fallback parsing...');
    const fallbackPatterns = [
      /^(X|XI|XII)/,
      /^(10|11|12)/
    ];
    
    for (const pattern of fallbackPatterns) {
      const match = cleanName.match(pattern);
      if (match) {
        let level = match[1];
        if (level === '10') level = 'X';
        if (level === '11') level = 'XI';
        if (level === '12') level = 'XII';
        
        // Coba ekstrak jurusan dari sisa string
        const remaining = cleanName.replace(pattern, '').trim();
        const majorMatch = remaining.match(/(IPA|IPS|BAHASA|AGAMA|UMUM|TEKNIK|MULTIMEDIA|TKJ|RPL|AKUNTANSI|PEMASARAN|ADMINISTRASI|KEBIDANAN|KEPERAWATAN|FARMASI|KIMIA|FISIKA|BIOLOGI|MATEMATIKA|BHS|BAHASA|SOSIAL|EKONOMI|SEJARAH|GEOGRAFI|SENI|OLAHRAGA|PENDIDIKAN|GURU|SISWA|KA|KEJURUAN|KEJURUANAN|KEJURUAN_AN|KEJURUAN-AN|AK)/);
        let major = majorMatch ? majorMatch[1] : 'UMUM';
        
        // Mapping jurusan untuk kompatibilitas
        const majorMapping = {
          'KA': 'AK',  // KA -> AK (Akuntansi)
          'KEJURUAN': 'AK',
          'KEJURUANAN': 'AK',
          'KEJURUAN_AN': 'AK',
          'KEJURUAN-AN': 'AK'
        };
        
        if (majorMapping[major]) {
          major = majorMapping[major];
          console.log(`🔄 Fallback mapped jurusan: ${majorMatch[1]} -> ${major}`);
        }
        
        // Coba ekstrak nomor
        const numberMatch = remaining.match(/(\d+)/);
        const number = numberMatch ? parseInt(numberMatch[1]) : 1;
        
        const result = { level, major, number, fullName: className };
        console.log('✅ Fallback parsed successfully:', result);
        return result;
      }
    }
    
    console.log('❌ Could not parse class name:', className);
    return null;
  }, []);

  // 🎯 AUTO-DETECT TARGET CLASS - Otomatis cari kelas tujuan berdasarkan kelas asal
  const findTargetClass = useCallback((fromClassId: string) => {
    console.log('🔍 Finding target class for:', fromClassId);
    console.log('📚 Available classes:', ensureArray<Kelas>(classes).map(c => ({ id: c.id, name: c.nama_kelas, status: c.status })));
    
    const sourceClass = ensureArray<Kelas>(classes).find(c => c.id?.toString() === fromClassId);
    if (!sourceClass) {
      console.log('❌ Source class not found');
      return null;
    }
    
    console.log('📖 Source class:', sourceClass.nama_kelas);
    
    const parsed = parseClassName(sourceClass.nama_kelas || '');
    if (!parsed) {
      console.log('❌ Could not parse class name:', sourceClass.nama_kelas);
      return null;
    }
    
    console.log('🧩 Parsed class:', parsed);
    
    // Tentukan tingkat tujuan
    let targetLevel = '';
    if (parsed.level === 'X') targetLevel = 'XI';
    else if (parsed.level === 'XI') targetLevel = 'XII';
    else {
      console.log('❌ Cannot promote from level:', parsed.level);
      return null; // XII tidak bisa dinaikkan
    }
    
    console.log('🎯 Looking for target level:', targetLevel, 'major:', parsed.major, 'number:', parsed.number);
    
    // Cari kelas dengan tingkat tujuan, jurusan sama, nomor sama
    const targetClass = ensureArray<Kelas>(classes).find(cls => {
      const targetParsed = parseClassName(cls.nama_kelas || '');
      const isMatch = targetParsed &&
             targetParsed.level === targetLevel &&
             targetParsed.major === parsed.major &&
             targetParsed.number === parsed.number;
      
      if (targetParsed) {
        console.log('🔍 Checking class:', cls.nama_kelas, 'parsed:', targetParsed, 'match:', isMatch);
      }
      
      return isMatch;
    });
    
    console.log('✅ Target class found:', targetClass?.nama_kelas || 'None');
    return targetClass || null;
  }, [classes, parseClassName]);

  // Auto-detect dan set kelas tujuan saat kelas asal dipilih
  useEffect(() => {
    if (fromClassId && classes.length > 0) {
      console.log('🔄 Auto-detecting target class for:', fromClassId);
      
      const targetClass = findTargetClass(fromClassId);
      
      if (targetClass) {
        console.log('✅ Exact match found:', targetClass.nama_kelas);
        setToClassId(targetClass.id?.toString() || '');
        
        // Parsing untuk notifikasi
        const sourceClass = ensureArray<Kelas>(classes).find(c => c.id?.toString() === fromClassId);
        const sourceParsed = parseClassName(sourceClass?.nama_kelas || '');
        const targetParsed = parseClassName(targetClass.nama_kelas || '');
        
        if (sourceParsed && targetParsed) {
          toast({
            title: "✓ Kelas Tujuan Terdeteksi",
            description: `${sourceParsed.level} ${sourceParsed.major} ${sourceParsed.number} → ${targetParsed.level} ${targetParsed.major} ${targetParsed.number}`,
            variant: "default"
          });
        }
      } else {
        console.log('🔄 No exact match, trying fallback search');
        
        // Jika tidak ditemukan, coba cari manual berdasarkan tingkat dan jurusan
        const sourceClass = ensureArray<Kelas>(classes).find(c => c.id?.toString() === fromClassId);
        const sourceParsed = parseClassName(sourceClass?.nama_kelas || '');
        
        if (sourceParsed) {
          // Validasi kelas XII tidak bisa dinaikkan
          if (sourceParsed.level === 'XII') {
            console.log('❌ Cannot promote from XII level');
            setToClassId('');
            toast({
              title: "❌ Tidak Dapat Dipromosikan",
              description: "Siswa kelas XII sudah lulus dan tidak dapat dinaikkan kelas",
              variant: "destructive"
            });
            return;
          }
          
          let targetLevel = '';
          if (sourceParsed.level === 'X') targetLevel = 'XI';
          else if (sourceParsed.level === 'XI') targetLevel = 'XII';
          
          console.log('🔄 Fallback search for:', targetLevel, sourceParsed.major);
          
          // Cari kelas dengan tingkat tujuan dan jurusan sama (abaikan nomor)
          const fallbackClass = ensureArray<Kelas>(classes).find(cls => {
            if (cls.status !== 'aktif') return false;
            
            const name = cls.nama_kelas?.toUpperCase() || '';
            const isMatch = name.includes(targetLevel) && name.includes(sourceParsed.major);
            console.log('🔍 Fallback checking:', cls.nama_kelas, 'contains', targetLevel, 'and', sourceParsed.major, ':', isMatch);
            return isMatch;
          });
          
          if (fallbackClass) {
            console.log('✅ Fallback class found:', fallbackClass.nama_kelas);
            setToClassId(fallbackClass.id?.toString() || '');
            toast({
              title: "⚠ Kelas Tujuan Ditemukan (Parsial)",
              description: `Nomor kelas mungkin berbeda. Mohon periksa: ${fallbackClass.nama_kelas}`,
              variant: "default"
            });
          } else {
            console.log('❌ No fallback class found');
            setToClassId('');
            toast({
              title: "❌ Kelas Tujuan Tidak Ditemukan",
              description: `Kelas ${targetLevel} ${sourceParsed.major} belum dibuat di sistem`,
              variant: "destructive"
            });
          }
        } else {
          console.log('❌ Could not parse source class for fallback');
          setToClassId('');
          
          // Coba fallback sederhana: cari kelas dengan tingkat yang lebih tinggi
          const sourceClass = ensureArray<Kelas>(classes).find(c => c.id?.toString() === fromClassId);
          if (sourceClass?.nama_kelas) {
            const className = sourceClass.nama_kelas.toUpperCase();
            
            // Coba deteksi tingkat sederhana
            let targetLevel = '';
            if (className.includes('X ') && !className.includes('XI') && !className.includes('XII')) {
              targetLevel = 'XI';
            } else if (className.includes('XI ') && !className.includes('XII')) {
              targetLevel = 'XII';
            }
            
            if (targetLevel) {
              // Cari kelas dengan tingkat target
              const fallbackClass = ensureArray<Kelas>(classes).find(cls => {
                if (cls.status !== 'aktif') return false;
                return cls.nama_kelas?.toUpperCase().includes(targetLevel);
              });
              
              if (fallbackClass) {
                console.log('✅ Simple fallback found:', fallbackClass.nama_kelas);
                setToClassId(fallbackClass.id?.toString() || '');
                toast({
                  title: "⚠ Kelas Tujuan Ditemukan (Sederhana)",
                  description: `Ditemukan kelas ${targetLevel}: ${fallbackClass.nama_kelas}`,
                  variant: "default"
                });
                return;
              }
            }
          }
          
          toast({
            title: "⚠ Kelas Tujuan Tidak Ditemukan",
            description: "Tidak dapat mendeteksi kelas tujuan. Silakan buat kelas yang sesuai terlebih dahulu.",
            variant: "destructive"
          });
        }
      }
    } else if (!fromClassId) {
      setToClassId('');
    }
  }, [fromClassId, classes, findTargetClass, parseClassName]);

  // Reset states when fromClassId changes
  useEffect(() => {
    if (!fromClassId) {
      setStudents([]);
      setSelectedStudents(new Set());
      setToClassId('');
    }
  }, [fromClassId]);

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(student => student.id_siswa)));
    }
  };

  const handleSelectStudent = (studentId: number) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const handlePromotion = async () => {
    // Validasi state yang lebih ketat
    if (!fromClassId) {
      toast({ title: "Peringatan", description: "Pilih kelas asal terlebih dahulu", variant: "destructive" });
      return;
    }

    if (!toClassId) {
      toast({ title: "Peringatan", description: "Kelas tujuan tidak ditemukan atau tidak valid", variant: "destructive" });
      return;
    }

    if (selectedStudents.size === 0) {
      toast({ title: "Peringatan", description: "Pilih minimal satu siswa untuk dinaikkan kelas", variant: "destructive" });
      return;
    }

    // Validasi kelas asal tidak boleh kelas XII
    const sourceClass = ensureArray<Kelas>(classes).find(c => c.id?.toString() === fromClassId);
    if (sourceClass?.nama_kelas?.includes('XII')) {
      toast({ 
        title: "Tidak Dapat Dipromosikan", 
        description: "Siswa kelas XII sudah lulus dan tidak dapat dinaikkan kelas", 
        variant: "destructive" 
      });
      return;
    }

    // Validasi kelas tujuan harus berbeda dari kelas asal
    if (fromClassId === toClassId) {
      toast({ 
        title: "Peringatan", 
        description: "Kelas tujuan harus berbeda dari kelas asal", 
        variant: "destructive" 
      });
      return;
    }

    setIsProcessing(true);
    try {
      const studentIds = Array.from(selectedStudents);
      console.log('🚀 Sending promotion request:', { fromClassId, toClassId, studentIds });
      
      const response = await apiCall('/api/admin/student-promotion', {
        method: 'POST',
        body: JSON.stringify({
          fromClassId,
          toClassId,
          studentIds
        })
      }, onLogout);

      console.log('✅ Promotion response:', response);

      toast({ 
        title: "Berhasil", 
        description: response.message || `${studentIds.length} siswa berhasil dinaikkan dari ${fromClass?.nama_kelas} ke ${toClass?.nama_kelas}`, 
        variant: "default" 
      });

      // Reset state setelah sukses
      setSelectedStudents(new Set());
      setShowPreview(false);
      
      // Refresh data siswa kelas asal
      await fetchStudents(fromClassId);
      
    } catch (error) {
      console.error('❌ Error promoting students:', error);
      
      // Error handling yang lebih spesifik
      let errorMessage = 'Terjadi kesalahan saat memproses promosi siswa';
      
      if (error.message) {
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.error || error.message;
        } catch {
          errorMessage = error.message;
        }
      }
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fromClass = ensureArray<Kelas>(classes).find(c => c.id?.toString() === fromClassId);
  const toClass = ensureArray<Kelas>(classes).find(c => c.id?.toString() === toClassId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Naik Kelas Siswa</h1>
            <p className="text-gray-600">Kelola kenaikan kelas siswa secara massal</p>
          </div>
        </div>
        {fromClassId && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setFromClassId('');
              setToClassId('');
              setStudents([]);
              setSelectedStudents(new Set());
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      {/* Progress Indicator */}
      {fromClassId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Pilih Kelas</span>
              </div>
              <div className={`w-8 h-0.5 ${selectedStudents.size > 0 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center gap-2 ${selectedStudents.size > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedStudents.size > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Pilih Siswa</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Selection - SMART AUTO-DETECT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5" />
            Pilih Kelas Asal
          </CardTitle>
          <CardDescription>
            Sistem akan otomatis mendeteksi kelas tujuan berdasarkan tingkat dan jurusan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="from-class">Kelas Asal *</Label>
              <Select value={fromClassId} onValueChange={setFromClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas asal (contoh: X IPA 1)" />
                </SelectTrigger>
                <SelectContent>
                  {ensureArray<Kelas>(classes).filter(cls => cls.status === 'aktif' && hasValidId(cls)).map((cls) => {
                    const value = getSelectValue(cls.id);
                    return value ? (
                      <SelectItem key={cls.id} value={value}>
                        {cls.nama_kelas}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>
            {toClassId && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      🧠 Auto-Detected Target Class
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {fromClass?.nama_kelas} → <span className="text-green-700">{toClass?.nama_kelas}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Message */}
      {!fromClassId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">🧠 Sistem Promosi Cerdas</h3>
              <p className="text-gray-500 mb-2">Pilih kelas asal, sistem akan otomatis mendeteksi kelas tujuan</p>
              <p className="text-sm text-gray-400">Contoh: X IPA 1 → XI IPA 1 (otomatis)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Students Message */}
      {fromClassId && students.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Siswa</h3>
              <p className="text-gray-500">Tidak ada siswa ditemukan di kelas yang dipilih</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Info */}
      {fromClassId && (
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-600">
              <p><strong>Status:</strong></p>
              <p>Kelas Asal: {fromClass?.nama_kelas || 'Tidak dipilih'}</p>
              <p>Kelas Tujuan: {toClass?.nama_kelas || 'Belum terdeteksi'}</p>
              <p>Siswa Tersedia: {students.length} siswa</p>
              <p>Siswa Terpilih: {selectedStudents.size} siswa</p>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p><strong>Debug Info:</strong></p>
                  <p>fromClassId: {fromClassId}</p>
                  <p>toClassId: {toClassId}</p>
                  <p>isLoading: {isLoading.toString()}</p>
                  <p>isProcessing: {isProcessing.toString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      {students.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Daftar Siswa ({students.length} siswa)
                </CardTitle>
                <CardDescription>
                  Pilih siswa yang akan dinaikkan kelas
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isLoading}
                >
                  {selectedStudents.size === students.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </Button>
                {selectedStudents.size > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    disabled={!toClassId || !fromClassId || isProcessing}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Preview ({selectedStudents.size} siswa)
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id_siswa}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      selectedStudents.has(student.id_siswa) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id_siswa)}
                        onChange={() => handleSelectStudent(student.id_siswa)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{student.nama}</p>
                        <p className="text-sm text-gray-500">NIS: {student.nis}</p>
                      </div>
                    </div>
                    <Badge variant={student.status === 'aktif' ? 'default' : 'secondary'}>
                      {student.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5" />
              Preview Naik Kelas
            </DialogTitle>
            <DialogDescription>
              Konfirmasi data siswa yang akan dinaikkan kelas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Dari Kelas</p>
                <p className="text-lg font-semibold text-blue-700">{fromClass?.nama_kelas}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Ke Kelas</p>
                <p className="text-lg font-semibold text-green-700">{toClass?.nama_kelas}</p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-500">
                  Siswa yang akan dinaikkan ({selectedStudents.size} siswa):
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {students
                  .filter(student => selectedStudents.has(student.id_siswa))
                  .map((student) => (
                    <div key={student.id_siswa} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {student.nama.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{student.nama}</span>
                          <p className="text-sm text-gray-500">NIS: {student.nis}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {student.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Batal
            </Button>
            <Button 
              onClick={handlePromotion}
              disabled={isProcessing || !toClassId || !fromClassId || selectedStudents.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <React.Fragment key="processing-state">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses...
                </React.Fragment>
              ) : (
                <React.Fragment key="normal-state">
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Konfirmasi Naik Kelas
                </React.Fragment>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Action Button */}
      {selectedStudents.size > 0 && toClassId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Siap untuk Naik Kelas</h3>
                <p className="text-gray-500">
                  {selectedStudents.size} siswa siap dinaikkan dari {fromClass?.nama_kelas} ke {toClass?.nama_kelas}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={handlePromotion}
                  disabled={isProcessing || !toClassId || !fromClassId || selectedStudents.size === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing ? (
                    <React.Fragment key="processing-state">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </React.Fragment>
                  ) : (
                    <React.Fragment key="normal-state">
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      Naik Kelas Sekarang
                    </React.Fragment>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


// Ruang Kelas Management Component
const RuangKelasManagementView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [formData, setFormData] = useState({
    nama_ruang: '',
    kode_ruang: '',
    kapasitas: 0,
    lokasi: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRooms = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/ruang-kelas', {}, onLogout);
      
      // Normalisasi data rooms agar selalu array
      type RoomsEnvelope = { success?: boolean; data?: Room[] };
      const raw = (typeof data === 'object' && data !== null && 'data' in (data as RoomsEnvelope)
        ? (data as RoomsEnvelope).data
        : data) as unknown;
      const roomsArr = ensureArray<Room>(raw);
      setRooms(roomsArr);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({ title: "Error memuat ruang kelas", description: error.message, variant: "destructive" });
      setRooms([]);
    }
  }, [onLogout]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi field wajib
    if (!formData.nama_ruang.trim()) {
      toast({ title: "Error", description: "Nama ruang wajib diisi", variant: "destructive" });
      return;
    }
    if (!formData.kode_ruang.trim()) {
      toast({ title: "Error", description: "Kode ruang wajib diisi", variant: "destructive" });
      return;
    }
    if (!formData.kapasitas || formData.kapasitas <= 0) {
      toast({ title: "Error", description: "Kapasitas harus lebih dari 0", variant: "destructive" });
      return;
    }
    if (!formData.lokasi.trim()) {
      toast({ title: "Error", description: "Lokasi wajib diisi", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);

    try {
      const url = editingId ? `/api/admin/ruang-kelas/${editingId}` : '/api/admin/ruang-kelas';
      const method = editingId ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        kapasitas: parseInt(formData.kapasitas.toString())
      };
      
      await apiCall(url, {
        method,
        body: JSON.stringify(submitData),
      }, onLogout);

      toast({ title: editingId ? "Ruang kelas berhasil diupdate!" : "Ruang kelas berhasil ditambahkan!" });
      setFormData({ nama_ruang: '', kode_ruang: '', kapasitas: 0, lokasi: '' });
      setEditingId(null);
      fetchRooms();
    } catch (error) {
      console.error('Error submitting room:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }

    setIsLoading(false);
  };

  const handleEdit = (room: { id: number; nama_ruang: string; kode_ruang: string; kapasitas?: number; lokasi?: string }) => {
    setFormData({ 
      nama_ruang: room.nama_ruang, 
      kode_ruang: room.kode_ruang, 
      kapasitas: room.kapasitas || 0, 
      lokasi: room.lokasi || '' 
    });
    setEditingId(room.id);
  };

  const handleDelete = async (id: number, nama: string) => {
    try {
      await apiCall(`/api/admin/ruang-kelas/${id}`, { method: 'DELETE' }, onLogout);
      toast({ title: "Ruang kelas berhasil dihapus!" });
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredRooms = ensureArray<Room>(rooms).filter(room =>
    (room.nama_ruang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.kode_ruang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.lokasi || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Management Ruang Kelas</h1>
          <p className="text-gray-600 mt-1">Kelola ruang kelas dan alokasi ruang</p>
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari ruang kelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {editingId ? 'Edit Ruang Kelas' : 'Tambah Ruang Kelas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="room-name">Nama Ruang *</Label>
              <Input 
                id="room-name" 
                value={formData.nama_ruang} 
                onChange={(e) => setFormData({...formData, nama_ruang: e.target.value})} 
                placeholder="Contoh: Ruang 101, Lab Komputer, Aula"
                required 
              />
            </div>
            <div>
              <Label htmlFor="room-code">Kode Ruang *</Label>
              <Input 
                id="room-code" 
                value={formData.kode_ruang} 
                onChange={(e) => setFormData({...formData, kode_ruang: e.target.value})} 
                placeholder="Contoh: R101, LAB-KOM, AULA-1"
                required 
              />
            </div>
            <div>
              <Label htmlFor="room-capacity">Kapasitas *</Label>
              <Input 
                id="room-capacity" 
                type="number"
                value={formData.kapasitas || 0} 
                onChange={(e) => setFormData({...formData, kapasitas: parseInt(e.target.value) || 0})} 
                placeholder="Contoh: 30"
                required
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="room-location">Lokasi *</Label>
              <Input 
                id="room-location" 
                value={formData.lokasi} 
                onChange={(e) => setFormData({...formData, lokasi: e.target.value})} 
                placeholder="Contoh: Lantai 1, Gedung A"
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : (editingId ? 'Update' : 'Tambah')}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => {
                  setEditingId(null);
                  setFormData({ nama_ruang: '', kode_ruang: '', kapasitas: 0, lokasi: '' });
                }}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Rooms List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Ruang Kelas ({filteredRooms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada ruang kelas ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow key="header-row">
                    <TableHead key="header-nama">Nama Ruang</TableHead>
                    <TableHead key="header-kode">Kode Ruang</TableHead>
                    <TableHead key="header-kapasitas">Kapasitas</TableHead>
                    <TableHead key="header-lokasi">Lokasi</TableHead>
                    <TableHead key="header-status">Status</TableHead>
                    <TableHead key="header-aksi" className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.nama_ruang}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{room.kode_ruang}</Badge>
                      </TableCell>
                      <TableCell>{room.kapasitas || 0}</TableCell>
                      <TableCell>{room.lokasi || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={room.status === 'aktif' ? 'default' : 'secondary'}>
                          {room.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" key={`actions-${room.id}`}>
                          <Button
                            key={`edit-${room.id}`}
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(room)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog key={`delete-${room.id}`}>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Ruang Kelas</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus ruang kelas "{room.nama_ruang}"? 
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(room.id, room.nama_ruang)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Reports Main Menu Component
const ReportsView = ({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) => {
  const [reportView, setReportView] = useState<string | null>(null);

  if (reportView === 'banding-absen-report') {
    return <BandingAbsenReportView onBack={() => setReportView(null)} onLogout={onLogout} />;
  }

  if (reportView === 'riwayat-izin-report') {
    return <RiwayatIzinReportView onBack={() => setReportView(null)} onLogout={onLogout} />;
  }

  if (reportView === 'student-attendance-summary') {
    return <StudentAttendanceSummaryView onBack={() => setReportView(null)} onLogout={onLogout} />;
  }

  if (reportView === 'teacher-attendance-summary') {
    return <TeacherAttendanceSummaryView onBack={() => setReportView(null)} onLogout={onLogout} />;
  }

  if (reportView === 'live-teacher-attendance') {
    return <LiveTeacherAttendanceView onBack={() => setReportView(null)} onLogout={onLogout} />;
  }

  if (reportView === 'live-student-attendance') {
    return <LiveStudentAttendanceView onBack={() => setReportView(null)} onLogout={onLogout} />;
  }

  if (reportView === 'analytics-dashboard') {
    return <AnalyticsDashboardView onBack={() => setReportView(null)} onLogout={onLogout} />;
  }

  if (reportView === 'presensi-siswa') {
    return <PresensiSiswaView onBack={() => setReportView(null)} onLogout={onLogout} />;
  }

  if (reportView === 'rekap-ketidakhadiran') {
    return <RekapKetidakhadiranView onBack={() => setReportView(null)} onLogout={onLogout} />;
  }

  if (reportView === 'rekap-ketidakhadiran-guru') {
    return <RekapKetidakhadiranGuruView onBack={() => setReportView(null)} onLogout={onLogout} />;
  }

  const reportItems = [
    {
      id: 'teacher-attendance-summary',
      title: 'Ringkasan Kehadiran Guru',
      description: 'Tabel H/I/S/A/D dan persentase, filter kelas & tanggal',
      icon: ClipboardList,
      gradient: 'from-indigo-500 to-indigo-700'
    },
    {
      id: 'student-attendance-summary',
      title: 'Ringkasan Kehadiran Siswa', 
      description: 'Tabel H/I/S/A/D dan persentase, filter kelas & tanggal',
      icon: ClipboardList,
      gradient: 'from-emerald-500 to-emerald-700'
    },
    {
      id: 'banding-absen-report',
      title: 'Riwayat Pengajuan Banding Absen', 
      description: 'Laporan history pengajuan banding absensi',
      icon: MessageCircle,
      gradient: 'from-red-500 to-red-700'
    },
    // Menu riwayat pengajuan izin dihapus - tidak ada lagi pengajuan izin
    {
      id: 'presensi-siswa',
      title: 'Presensi Siswa', 
      description: 'Format presensi siswa SMKN 13',
      icon: FileText,
      gradient: 'from-slate-500 to-slate-700'
    },
    {
      id: 'rekap-ketidakhadiran',
      title: 'Rekap Ketidakhadiran', 
      description: 'Rekap ketidakhadiran tahunan/bulanan',
      icon: BarChart3,
      gradient: 'from-emerald-500 to-emerald-700'
    },
    {
      id: 'rekap-ketidakhadiran-guru',
      title: 'Rekap Ketidakhadiran Guru', 
      description: 'Format rekap ketidakhadiran guru SMKN 13',
      icon: Users,
      gradient: 'from-orange-500 to-orange-700'
    },
    {
      id: 'live-student-attendance',
      title: 'Pemantauan Siswa Langsung',
      description: 'Pantau absensi siswa secara realtime',
      icon: Users,
      gradient: 'from-green-500 to-green-700'
    },
    {
      id: 'live-teacher-attendance',
      title: 'Pemantauan Guru Langsung',
      description: 'Pantau absensi guru secara realtime',
      icon: GraduationCap,
      gradient: 'from-purple-500 to-purple-700'
    },
    {
      id: 'analytics-dashboard',
      title: 'Dasbor Analitik',
      description: 'Analisis dan statistik kehadiran lengkap',
      icon: BarChart3,
      gradient: 'from-orange-500 to-orange-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Laporan</h1>
          <p className="text-gray-600">Pilih jenis laporan yang ingin Anda lihat</p>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card 
              key={item.id}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
              onClick={() => setReportView(item.id)}
            >
              <div className={`h-2 bg-gradient-to-r ${item.gradient}`} />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${item.gradient} text-white`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeView, setActiveView] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [userData, setUserData] = useState<{
    id: number;
    username: string;
    nama: string;
    email?: string;
    role: string;
    created_at?: string;
    updated_at?: string;
  } | null>(null);

  // Check token validity on component mount and load latest profile data
  useEffect(() => {
    const checkTokenValidity = async () => {
      try {
        const response = await apiCall('/api/verify', {}, onLogout);
        setUserData(response.data);
        
        // Load latest profile data from server
        try {
          const profileResponse = await apiCall('/api/admin/info', {}, onLogout);
          if (profileResponse.success && profileResponse.data) {
            setUserData({
              id: profileResponse.data.id || userData?.id,
              username: profileResponse.data.username || userData?.username,
              nama: profileResponse.data.nama || userData?.nama,
              email: profileResponse.data.email || userData?.email,
              role: profileResponse.data.role || userData?.role,
              created_at: profileResponse.data.created_at || userData?.created_at,
              updated_at: profileResponse.data.updated_at || userData?.updated_at
            });
          }
        } catch (profileErr) {
          console.error("Failed to load latest profile data:", profileErr);
        }
      } catch (err) {
        console.error("Token verification failed:", err);
      }
    };

    checkTokenValidity();
  }, []);

  const handleUpdateProfile = (updatedData: {
    id: number;
    username: string;
    nama: string;
    email?: string;
    role: string;
    created_at?: string;
    updated_at?: string;
  }) => {
    setUserData(updatedData);
  };

  const renderActiveView = () => {
    const handleBack = () => setActiveView(null);
    
    switch (activeView) {
      case 'add-teacher':
        return <ManageTeacherAccountsView onBack={handleBack} onLogout={onLogout} />;
      case 'add-student':
        return <ManageStudentsView onBack={handleBack} onLogout={onLogout} />;
      case 'add-teacher-data':
        return <ManageTeacherDataView onBack={handleBack} onLogout={onLogout} />;
      case 'add-student-data':
        return <ManageStudentDataView onBack={handleBack} onLogout={onLogout} />;
      case 'student-promotion':
        return <StudentPromotionView onBack={handleBack} onLogout={onLogout} />;
      case 'add-subject':
        return <ManageSubjectsView onBack={handleBack} onLogout={onLogout} />;
      case 'add-class':
        return <ManageClassesView onBack={handleBack} onLogout={onLogout} />;
      case 'room-management':
        return <RuangKelasManagementView onBack={handleBack} onLogout={onLogout} />;
      case 'add-schedule':
        return <ManageSchedulesView onBack={handleBack} onLogout={onLogout} />;
      case 'backup-management':
        return <ErrorBoundary><BackupManagementView /></ErrorBoundary>;
      case 'load-balancer':
        return <ErrorBoundary><LoadBalancerView /></ErrorBoundary>;
      case 'monitoring':
        return <ErrorBoundary><MonitoringDashboard /></ErrorBoundary>;
      case 'disaster-recovery':
        return <ErrorBoundary><SimpleRestoreView onBack={handleBack} onLogout={onLogout} /></ErrorBoundary>;
      case 'letterhead-settings':
        return <ErrorBoundary><ReportLetterheadSettings onBack={handleBack} onLogout={onLogout} /></ErrorBoundary>;
      case 'reports':
        return <ErrorBoundary><ReportsView onBack={handleBack} onLogout={onLogout} /></ErrorBoundary>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-xl transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-16'
      } lg:w-64 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`flex items-center space-x-3 ${sidebarOpen ? '' : 'justify-center lg:justify-start'}`}>
            <div className="p-2 rounded-lg">
              <img src="/logo.png" alt="ABSENTA Logo" className="h-12 w-12" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent block lg:hidden">
                ABSENTA
              </span>
            )}
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent hidden lg:block">
              ABSENTA
            </span>
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
        <nav className="p-4 space-y-2 h-[calc(100vh-8rem)] overflow-y-auto">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${sidebarOpen ? '' : 'px-2 lg:px-3'}`}
              onClick={() => {
                setActiveView(item.id);
                setSidebarOpen(false);
              }}
            >
              <item.icon className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2 block lg:hidden">{item.title}</span>}
              <span className="ml-2 hidden lg:block">{item.title}</span>
            </Button>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          {/* Font Size Control - Above Profile Buttons */}
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <div className="mb-4">
              <FontSizeControl variant="compact" />
            </div>
          )}
          
          {/* User Profile Info */}
          {userData && (
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{userData.nama}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Button
              onClick={() => setShowEditProfile(true)}
              variant="outline"
              size="sm"
              className={`w-full ${sidebarOpen ? '' : 'px-2 lg:px-3'}`}
            >
              <Settings className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2 block lg:hidden">Edit Profil</span>}
              <span className="ml-2 hidden lg:block">Edit Profil</span>
            </Button>
            
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className={`w-full ${sidebarOpen ? '' : 'px-2 lg:px-3'}`}
            >
              <LogOut className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2 block lg:hidden">Keluar</span>}
              <span className="ml-2 hidden lg:block">Keluar</span>
            </Button>
          </div>
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
            <h1 className="text-xl font-bold">Dashboard Admin</h1>
            <div className="w-10"></div>
          </div>

          {/* Content */}
          {!activeView ? (
            <div className="space-y-8">
              {/* Desktop Header */}
              <div className="hidden lg:block">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Dashboard Admin
                </h1>
                <p className="text-gray-600 mt-2">ABSENTA - Sistem Absensi Sekolah</p>
              </div>

              <LiveSummaryView onLogout={onLogout} />
              
              {/* Menu Grid */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu Administrasi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {menuItems.map((item) => (
                    <Card
                      key={item.id}
                      className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50"
                      onClick={() => setActiveView(item.id)}
                    >
                      <CardContent className="p-6 text-center space-y-4">
                        <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${item.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <item.icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            renderActiveView()
          )}
        </div>
      </div>
      
      {/* Floating Font Size Control for Mobile */}
      <FontSizeControl variant="floating" className="lg:hidden" />
      
      {/* Edit Profile Modal */}
      {showEditProfile && userData && (
        <EditProfile
          userData={userData}
          onUpdate={handleUpdateProfile}
          onClose={() => setShowEditProfile(false)}
          role="admin"
        />
      )}
    </div>
  );
};

