import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
import SimpleRestoreView from "./SimpleRestoreView";
import { printReport } from "../utils/printLayouts";
import ExcelPreview from './ExcelPreview';
import ReportHeader from './ReportHeader';
import PresensiSiswaView from './PresensiSiswaView';
import RekapKetidakhadiranView from './RekapKetidakhadiranView';
import RekapKetidakhadiranGuruView from './RekapKetidakhadiranGuruView';
import { 
  UserPlus, BookOpen, Calendar, BarChart3, LogOut, ArrowLeft, Users, GraduationCap, 
  Eye, Download, FileText, Edit, Trash2, Plus, Search, Filter, Settings, Bell, Menu, X,
  TrendingUp, BookPlus, Home, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, MessageCircle, ClipboardList,
  Database, Archive, Activity, Server, Monitor, Shield, RefreshCw
} from "lucide-react";

// Utility function for API calls with consistent error handling
const apiCall = async (url: string, options: RequestInit = {}, onLogout?: () => void) => {
  const response = await fetch(`http://localhost:3001${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
  email?: string;
  alamat?: string;
  no_telp?: string;
  jenis_kelamin: 'L' | 'P';
  status: 'aktif' | 'nonaktif';
  mata_pelajaran?: string;
}

interface TeacherData {
  id: number;
  nip: string;
  nama: string;
  email?: string;
  mata_pelajaran?: string;
  alamat?: string;
  telepon?: string;
  jenis_kelamin: 'L' | 'P';
  status: 'aktif' | 'nonaktif';
}

interface Student {
  id: number;
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
}

interface StudentData {
  id: number;
  nis: string;
  nama: string;
  kelas_id: number;
  nama_kelas?: string;
  jenis_kelamin: 'L' | 'P';
  alamat?: string;
  telepon_orangtua?: string;
  status: 'aktif' | 'nonaktif';
}

interface Subject {
  id: number;
  kode_mapel: string;
  nama_mapel: string;
  deskripsi?: string;
  status: 'aktif' | 'tidak_aktif';
}

interface Kelas {
  id: number;
  nama_kelas: string;
  tingkat?: string;
}

interface Schedule {
  id: number;
  kelas_id: number;
  mapel_id: number;
  guru_id: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  jam_ke?: number;
  nama_kelas: string;
  nama_mapel: string;
  nama_guru: string;
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
  { id: 'add-subject', title: 'Mata Pelajaran', icon: BookOpen, description: 'Kelola mata pelajaran', gradient: 'from-red-500 to-red-700' },
  { id: 'add-class', title: 'Kelas', icon: Home, description: 'Kelola kelas', gradient: 'from-indigo-500 to-indigo-700' },
  { id: 'add-schedule', title: 'Jadwal', icon: Calendar, description: 'Atur jadwal pelajaran', gradient: 'from-teal-500 to-teal-700' },
  { id: 'backup-management', title: 'Backup & Archive', icon: Database, description: 'Kelola backup dan arsip data', gradient: 'from-cyan-500 to-cyan-700' },
  { id: 'load-balancer', title: 'Load Balancer', icon: Activity, description: 'Monitoring performa sistem', gradient: 'from-emerald-500 to-emerald-700' },
  { id: 'monitoring', title: 'System Monitoring', icon: Monitor, description: 'Real-time monitoring & alerting', gradient: 'from-violet-500 to-violet-700' },
  { id: 'disaster-recovery', title: 'Restorasi Backup', icon: Shield, description: 'Restorasi dan pemulihan backup', gradient: 'from-amber-500 to-amber-700' },
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

  const fetchTeachers = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/teachers', {}, onLogout);
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({ title: "Error memuat data guru", description: error.message, variant: "destructive" });
    }
  }, [onLogout]);

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/subjects', {}, onLogout);
      setSubjects(data);
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
    if (!formData.nama || !formData.username || !formData.nip) {
      toast({ title: "Error", description: "Nama, username, dan NIP wajib diisi!", variant: "destructive" });
      return;
    }

    if (!editingId && !formData.password) {
      toast({ title: "Error", description: "Password wajib diisi untuk akun baru!", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const url = editingId ? `/api/admin/teachers/${editingId}` : '/api/admin/teachers';
      const method = editingId ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        mapel_id: formData.mapel_id ? parseInt(formData.mapel_id) : null,
      };

      await apiCall(url, {
        method,
        body: JSON.stringify(submitData),
      }, onLogout);

      toast({ title: editingId ? "Akun guru berhasil diupdate!" : "Akun guru berhasil ditambahkan!" });
      setFormData({ 
        nama: '', username: '', password: '', nip: '', mapel_id: '', 
        no_telp: '', alamat: '', jenis_kelamin: '', email: '' 
      });
      setEditingId(null);
      setDialogOpen(false);
      fetchTeachers();
    } catch (error) {
      console.error('Error submitting teacher:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }

    setIsLoading(false);
  };

  const handleEdit = (teacher: Teacher) => {
    setFormData({
      nama: teacher.nama || '',
      username: teacher.username || '',
      password: '',
      nip: teacher.nip || '',
      mapel_id: teacher.mata_pelajaran ? String(teacher.mata_pelajaran) : '',
  no_telp: teacher.no_telp || '',
      alamat: teacher.alamat || '',
      jenis_kelamin: teacher.jenis_kelamin || '',
      email: teacher.email || ''
    });
    setEditingId(teacher.id);
    setDialogOpen(true);
  };  const handleDelete = async (id: number, nama: string) => {
    try {
      await apiCall(`/api/admin/teachers/${id}`, {
        method: 'DELETE',
      }, onLogout);

      toast({ title: `Akun guru ${nama} berhasil dihapus` });
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({ title: "Error menghapus akun guru", description: error.message, variant: "destructive" });
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.nip.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
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
                      {subjects.map((subject) => (
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
                      <TableCell className="font-medium">{teacher.nama}</TableCell>
                      <TableCell className="font-mono">{teacher.username}</TableCell>
                      <TableCell className="text-sm">{teacher.email || '-'}</TableCell>
                      <TableCell className="text-sm">{teacher.no_telp || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {teacher.jenis_kelamin === 'L' ? 'Laki-laki' : teacher.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{teacher.mata_pelajaran || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.status === 'aktif' ? 'default' : 'secondary'}>
                          {teacher.status || 'aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(teacher)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
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
    status: 'aktif' as 'aktif' | 'nonaktif'
  });
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStudentsData = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/students-data', {}, onLogout);
      setStudentsData(data);
    } catch (error) {
      console.error('Error fetching students data:', error);
      toast({ title: "Error memuat data siswa", description: error.message, variant: "destructive" });
    }
  }, [onLogout]);

  const fetchClasses = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/kelas', {}, onLogout);
      setClasses(data);
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
      const url = editingId ? `/api/admin/students-data/${editingId}` : '/api/admin/students-data';
      const method = editingId ? 'PUT' : 'POST';
      
      await apiCall(url, {
        method,
        body: JSON.stringify(formData),
      }, onLogout);

      toast({ title: editingId ? "Data siswa berhasil diupdate!" : "Data siswa berhasil ditambahkan!" });
      setFormData({ 
        nis: '', 
        nama: '', 
        kelas_id: '',
        jenis_kelamin: '' as 'L' | 'P' | '',
        alamat: '',
        telepon_orangtua: '',
        status: 'aktif'
      });
      setEditingId(null);
      fetchStudentsData();
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
      status: student.status
    });
    setEditingId(student.id);
  };

  const handleDelete = async (id: number, nama: string) => {
    try {
      await apiCall(`/api/admin/students-data/${id}`, {
        method: 'DELETE',
      }, onLogout);

      toast({ title: `Data siswa ${nama} berhasil dihapus` });
      fetchStudentsData();
    } catch (error) {
      console.error('Error deleting student data:', error);
      toast({ title: "Error menghapus data siswa", description: error.message, variant: "destructive" });
    }
  };

  const filteredStudents = studentsData.filter(student =>
    student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.nama_kelas && student.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id?.toString() || ''}>
                      {cls.nama_kelas}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
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
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(student)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
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
                                  onClick={() => handleDelete(student.id, student.nama)}
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
    email: '', 
    mata_pelajaran: '',
    alamat: '',
    telepon: '',
    jenis_kelamin: '' as 'L' | 'P' | '',
    status: 'aktif' as 'aktif' | 'nonaktif'
  });
  const [teachersData, setTeachersData] = useState<TeacherData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTeachersData = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/teachers-data', {}, onLogout);
      setTeachersData(data);
    } catch (error) {
      console.error('Error fetching teachers data:', error);
      toast({ title: "Error memuat data guru", description: error.message, variant: "destructive" });
    }
  }, [onLogout]);

  useEffect(() => {
    fetchTeachersData();
  }, [fetchTeachersData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId ? `/api/admin/teachers-data/${editingId}` : '/api/admin/teachers-data';
      const method = editingId ? 'PUT' : 'POST';
      
      await apiCall(url, {
        method,
        body: JSON.stringify(formData),
      }, onLogout);

      toast({ title: editingId ? "Data guru berhasil diupdate!" : "Data guru berhasil ditambahkan!" });
      setFormData({ 
        nip: '', 
        nama: '', 
        email: '', 
        mata_pelajaran: '',
        alamat: '',
        telepon: '',
        jenis_kelamin: '' as 'L' | 'P' | '',
        status: 'aktif'
      });
      setEditingId(null);
      fetchTeachersData();
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
      email: teacher.email || '',
      mata_pelajaran: teacher.mata_pelajaran || '',
      alamat: teacher.alamat || '',
      telepon: teacher.telepon || '',
      jenis_kelamin: teacher.jenis_kelamin,
      status: teacher.status
    });
    setEditingId(teacher.id);
  };

  const handleDelete = async (id: number, nama: string) => {
    try {
      await apiCall(`/api/admin/teachers-data/${id}`, {
        method: 'DELETE',
      }, onLogout);

      toast({ title: `Data guru ${nama} berhasil dihapus` });
      fetchTeachersData();
    } catch (error) {
      console.error('Error deleting teacher data:', error);
      toast({ title: "Error menghapus data guru", description: error.message, variant: "destructive" });
    }
  };

  const filteredTeachers = teachersData.filter(teacher =>
    teacher.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (teacher.mata_pelajaran && teacher.mata_pelajaran.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                value={formData.mata_pelajaran} 
                onChange={(e) => setFormData({...formData, mata_pelajaran: e.target.value})} 
                placeholder="Mata pelajaran yang diampu"
              />
            </div>
            <div>
              <Label htmlFor="teacher-telepon">Telepon</Label>
              <Input 
                id="teacher-telepon" 
                value={formData.telepon} 
                onChange={(e) => setFormData({...formData, telepon: e.target.value})} 
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
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
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
                    email: '', 
                    mata_pelajaran: '',
                    alamat: '',
                    telepon: '',
                    jenis_kelamin: '' as 'L' | 'P' | '',
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
                    <TableRow key={teacher.id}>
                      <TableCell className="text-gray-500 text-sm">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{teacher.nip}</TableCell>
                      <TableCell className="font-medium">{teacher.nama}</TableCell>
                      <TableCell className="text-sm">{teacher.email || '-'}</TableCell>
                      <TableCell className="text-sm">{teacher.telepon || '-'}</TableCell>
                      <TableCell>
                        {teacher.mata_pelajaran ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {teacher.mata_pelajaran}
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
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(teacher)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
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
    status: 'aktif' as 'aktif' | 'tidak_aktif'
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/mapel', {}, onLogout);
      setSubjects(data);
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

    try {
      const url = editingId ? `/api/admin/mapel/${editingId}` : '/api/admin/mapel';
      const method = editingId ? 'PUT' : 'POST';
      
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

  const filteredSubjects = subjects.filter(subject =>
    subject.nama_mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.kode_mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subject.deskripsi && subject.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                onChange={(e) => setFormData({...formData, status: e.target.value as 'aktif' | 'tidak_aktif'})}
                required
              >
                <option value="aktif">Aktif</option>
                <option value="tidak_aktif">Tidak Aktif</option>
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
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Mata Pelajaran</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject, index) => (
                    <TableRow key={subject.id}>
                      <TableCell className="text-gray-500 text-sm">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm bg-gray-50 rounded px-2 py-1 max-w-20">
                        {subject.kode_mapel}
                      </TableCell>
                      <TableCell className="font-medium">{subject.nama_mapel}</TableCell>
                      <TableCell className="text-sm max-w-40 truncate" title={subject.deskripsi}>
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
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(subject)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
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
  const [formData, setFormData] = useState({ nama_kelas: '' });
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClasses = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/kelas', {}, onLogout);
      setClasses(data);
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
      setFormData({ nama_kelas: '' });
      setEditingId(null);
      fetchClasses();
    } catch (error) {
      console.error('Error submitting class:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }

    setIsLoading(false);
  };

  const handleEdit = (kelas: Kelas) => {
    setFormData({ nama_kelas: kelas.nama_kelas });
    setEditingId(kelas.id);
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

  const filteredClasses = classes.filter(kelas =>
    kelas.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                {isLoading ? 'Menyimpan...' : (editingId ? 'Update' : 'Tambah')}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => {
                  setEditingId(null);
                  setFormData({ nama_kelas: '' });
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
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(kelas)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
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
  const [formData, setFormData] = useState({ 
    nama: '', 
    username: '', 
    password: '', 
    nis: '', 
    kelas_id: '', 
    jabatan: 'Sekretaris Kelas', 
    jenis_kelamin: '', 
    email: '' 
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStudents = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/students', {}, onLogout);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({ title: "Error memuat data siswa", description: error.message, variant: "destructive" });
    }
  }, [onLogout]);

  const fetchClasses = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/classes', {}, onLogout);
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Don't show error toast for classes as it's not critical
    }
  }, [onLogout]);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [fetchStudents, fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.username || !formData.nis || !formData.kelas_id) {
      toast({ title: "Error", description: "Nama, username, NIS, dan kelas wajib diisi!", variant: "destructive" });
      return;
    }

    if (!editingId && !formData.password) {
      toast({ title: "Error", description: "Password wajib diisi untuk akun baru!", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const url = editingId ? `/api/admin/students/${editingId}` : '/api/admin/students';
      const method = editingId ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        kelas_id: parseInt(formData.kelas_id),
      };

      await apiCall(url, {
        method,
        body: JSON.stringify(submitData),
      }, onLogout);

      toast({ title: editingId ? "Akun siswa berhasil diupdate!" : "Akun siswa berhasil ditambahkan!" });
      setFormData({ 
        nama: '', username: '', password: '', nis: '', kelas_id: '', 
        jabatan: 'Sekretaris Kelas', jenis_kelamin: '', email: '' 
      });
      setEditingId(null);
      setDialogOpen(false);
      fetchStudents();
    } catch (error) {
      console.error('Error submitting student:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      email: student.email || ''
    });
    setEditingId(student.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number, nama: string) => {
    try {
      await apiCall(`/api/admin/students/${id}`, {
        method: 'DELETE',
      }, onLogout);

      toast({ title: `Akun siswa ${nama} berhasil dihapus` });
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({ title: "Error menghapus akun siswa", description: error.message, variant: "destructive" });
    }
  };

  const filteredStudents = students.filter(student =>
    student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.username && student.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    student.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.nama_kelas && student.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({ 
                nama: '', username: '', password: '', nis: '', kelas_id: '', 
                jabatan: 'Sekretaris Kelas', jenis_kelamin: '', email: '' 
              });
            }} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Akun Siswa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Akun Siswa' : 'Tambah Akun Siswa'}</DialogTitle>
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
                    placeholder="Masukkan password"
                    required={!editingId}
                  />
                </div>
                <div>
                  <Label htmlFor="nis">NIS *</Label>
                  <Input
                    id="nis"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="Masukkan NIS"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kelas_id">Kelas *</Label>
                  <Select value={formData.kelas_id} onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((kelas) => (
                        <SelectItem key={kelas.id} value={kelas.id?.toString() || ''}>
                          {kelas.nama_kelas} {kelas.tingkat ? `(${kelas.tingkat})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Select value={formData.jabatan} onValueChange={(value) => setFormData({ ...formData, jabatan: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ketua Kelas">Ketua Kelas</SelectItem>
                      <SelectItem value="Wakil Ketua Kelas">Wakil Ketua Kelas</SelectItem>
                      <SelectItem value="Sekretaris Kelas">Sekretaris Kelas</SelectItem>
                      <SelectItem value="Bendahara Kelas">Bendahara Kelas</SelectItem>
                      <SelectItem value="Perwakilan Siswa">Perwakilan Siswa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jenis_kelamin">Jenis Kelamin *</Label>
                  <Select value={formData.jenis_kelamin} onValueChange={(value) => setFormData({ ...formData, jenis_kelamin: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Masukkan email (opsional)"
                  />
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
                      <TableCell className="font-medium">{student.nama}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {student.nama_kelas || 'Belum ada kelas'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{student.username || '-'}</TableCell>
                      <TableCell className="text-sm">{student.email || '-'}</TableCell>
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
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(student)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Akun Siswa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus akun siswa <strong>{student.nama}</strong>?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(student.id, student.nama)}
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
      setLiveData(data);
    } catch (error) {
      console.error('Error fetching live data:', error);
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
                <p className="text-3xl font-bold">{liveData.ongoing_classes.length}</p>
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
          {liveData.ongoing_classes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Kelas Berlangsung</h3>
              <p className="text-gray-600">Saat ini tidak ada kelas yang sedang berlangsung.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveData.ongoing_classes.map((kelas, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
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
                        <div className="flex items-center gap-2">
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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [consecutiveHours, setConsecutiveHours] = useState(1);
  
  const [formData, setFormData] = useState({
    kelas_id: '',
    mapel_id: '',
    guru_id: '',
    hari: '',
    jam_mulai: '',
    jam_selesai: '',
    jam_ke: ''
  });

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Fetch all necessary data
  useEffect(() => {
    fetchSchedules();
    fetchTeachers();
    fetchSubjects();
    fetchClasses();
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

  const fetchTeachers = async () => {
    try {
      const data = await apiCall('/api/admin/teachers', {}, onLogout);
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await apiCall('/api/admin/subjects', {}, onLogout);
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await apiCall('/api/admin/classes', {}, onLogout);
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
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
        hari: '',
        jam_mulai: '',
        jam_selesai: '',
        jam_ke: ''
      });
      setConsecutiveHours(1);
      setEditingId(null);
      fetchSchedules();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyimpan jadwal",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setFormData({
      kelas_id: schedule.kelas_id?.toString() || '',
      mapel_id: schedule.mapel_id?.toString() || '',
      guru_id: schedule.guru_id?.toString() || '',
      hari: schedule.hari,
      jam_mulai: schedule.jam_mulai,
      jam_selesai: schedule.jam_selesai,
      jam_ke: schedule.jam_ke?.toString() || ''
    });
    setEditingId(schedule.id);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Jadwal</h1>
            <p className="text-gray-600">Atur jadwal pelajaran untuk setiap kelas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Kelas</Label>
                <Select 
                  value={formData.kelas_id} 
                  onValueChange={(value) => setFormData({...formData, kelas_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((kelas) => (
                      <SelectItem key={kelas.id} value={kelas.id?.toString() || ''}>
                        {kelas.nama_kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mata Pelajaran</Label>
                <Select 
                  value={formData.mapel_id} 
                  onValueChange={(value) => setFormData({...formData, mapel_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Mata Pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id?.toString() || ''}>
                        {subject.nama_mapel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Guru</Label>
                <Select 
                  value={formData.guru_id} 
                  onValueChange={(value) => setFormData({...formData, guru_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Guru" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id?.toString() || ''}>
                        {teacher.nama} (NIP: {teacher.nip})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Hari</Label>
                <Select 
                  value={formData.hari} 
                  onValueChange={(value) => setFormData({...formData, hari: value})}
                >
                  <SelectTrigger>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="jam-mulai">Jam Mulai</Label>
                <Input 
                  id="jam-mulai"
                  type="time" 
                  value={formData.jam_mulai} 
                  onChange={(e) => setFormData({...formData, jam_mulai: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="jam-selesai">Jam Selesai</Label>
                <Input 
                  id="jam-selesai"
                  type="time" 
                  value={formData.jam_selesai} 
                  onChange={(e) => setFormData({...formData, jam_selesai: e.target.value})} 
                  required={editingId !== null || consecutiveHours === 1}
                  disabled={!editingId && consecutiveHours > 1}
                />
              </div>
              <div>
                <Label htmlFor="jam-ke">Jam ke-</Label>
                <Input 
                  id="jam-ke"
                  type="number" 
                  value={formData.jam_ke} 
                  onChange={(e) => setFormData({...formData, jam_ke: e.target.value})} 
                  placeholder="1, 2, 3, dst"
                  min="1"
                  required={editingId !== null || consecutiveHours === 1}
                  disabled={!editingId && consecutiveHours > 1}
                />
              </div>
            </div>

            {!editingId && (
              <div>
                <Label htmlFor="consecutive-hours">Jumlah Jam Berurutan</Label>
                <Select 
                  value={consecutiveHours?.toString() || '1'} 
                  onValueChange={(value) => setConsecutiveHours(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num?.toString() || '1'}>
                        {num} Jam
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Pilih lebih dari 1 untuk menambahkan jam berurutan secara otomatis
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : (editingId ? 'Update Jadwal' : `Tambah ${consecutiveHours} Jam Pelajaran`)}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => {
                  setEditingId(null);
                  setFormData({
                    kelas_id: '',
                    mapel_id: '',
                    guru_id: '',
                    hari: '',
                    jam_mulai: '',
                    jam_selesai: '',
                    jam_ke: ''
                  });
                  setConsecutiveHours(1);
                }}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Schedule List */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Daftar Jadwal</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {schedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Belum ada jadwal</p>
              </div>
            ) : (
              schedules.map((schedule) => (
                <div key={schedule.id} className="p-3 border rounded hover:bg-gray-50">
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{schedule.nama_kelas}</p>
                    <p className="text-muted-foreground">{schedule.nama_mapel}</p>
                    <p className="text-muted-foreground">{schedule.nama_guru}</p>
                    <p className="text-muted-foreground">
                      {schedule.hari}, Jam {schedule.jam_ke}: {schedule.jam_mulai}-{schedule.jam_selesai}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(schedule)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(schedule.id)}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
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
        const response = await fetch('http://localhost:3001/api/admin/live-student-attendance', {
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
              key={index}
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
            <>
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
            </>
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
        const data = await apiCall('/api/admin/classes', {}, onLogout);
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

        const response = await fetch(`http://localhost:3001/api/admin/banding-absen-report?${params}`, {
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

        const response = await fetch(`http://localhost:3001/api/admin/download-banding-absen?${params}`, {
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
                  {classes.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id?.toString() || ''}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
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
          const response = await fetch('http://localhost:3001/api/admin/live-teacher-attendance', { 
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
                key={index}
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
              <>
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
              </>
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
          const response = await fetch('http://localhost:3001/api/admin/analytics', { 
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
        const response = await fetch(`http://localhost:3001/api/admin/izin/${notificationId}`, {
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
                      <div key={index} className="p-4 border rounded-lg">
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
                Aksi Cepat & Overview Sistem
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

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start h-9"
                    onClick={async () => {
                      try {
                        // Tampilkan loading
                        toast({ 
                          title: "Membuat Backup...", 
                          description: "Sedang memproses database, mohon tunggu..." 
                        });
                        
                        const response = await fetch('/api/admin/backup', {
                          credentials: 'include'
                        });
                        
                        if (response.ok) {
                          // Langsung download file SQL
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `backup_absenta_${new Date().toISOString().split('T')[0]}.sql`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          
                          toast({ 
                            title: "Backup Berhasil!", 
                            description: "File SQL database berhasil didownload" 
                          });
                        } else {
                          throw new Error('Gagal membuat backup');
                        }
                      } catch (error) {
                        console.error('Backup error:', error);
                        toast({ 
                          title: "Error", 
                          description: "Gagal membuat backup database", 
                          variant: "destructive" 
                        });
                      }
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Backup Database
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start h-9"
                    onClick={() => window.open('/api/admin/logs', '_blank')}
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Lihat Log Sistem
                  </Button>
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
                      <div key={index} className="p-4 border rounded-lg">
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
                        <TableRow key={index}>
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
                        <TableRow key={index}>
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
  }: any) => (
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
          <Input type="date" value={dateRange.startDate} onChange={(e) => setDateRange((p:any)=>({...p,startDate:e.target.value}))} />
        </div>
        <div>
          <Label>Sampai Tanggal</Label>
          <Input type="date" value={dateRange.endDate} onChange={(e) => setDateRange((p:any)=>({...p,endDate:e.target.value}))} />
        </div>
        <div>
          <Label>Kelas</Label>
          <Select value={selectedKelas} onValueChange={setSelectedKelas}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Semua Kelas"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua</SelectItem>
              {classes?.map((c:any)=>(<SelectItem key={c.id} value={String(c.id)}>{c.nama_kelas}</SelectItem>))}
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

  const SummaryTable = ({ rows }: any) => (
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
          {rows?.length ? rows.map((r:any,idx:number)=> (
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
              <TableCell className="text-center">{(r.presentase||0).toFixed(2)}%</TableCell>
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
        const response = await fetch('http://localhost:3001/api/kelas', {
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

      const response = await fetch(`http://localhost:3001/api/admin/riwayat-izin-report?${params}`, {
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

      const response = await fetch(`http://localhost:3001/api/admin/download-riwayat-izin?${params}`, {
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

  const downloadSMKN13Format = async (exportType) => {
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

      const url = `http://localhost:3001/api/export/${exportType}?${params.toString()}`;
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
      link.download = `${exportType}-${dateRange.startDate || 'all'}-${dateRange.endDate || 'all'}.xlsx`;
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
                  {classes.map((kelas) => (
                    <SelectItem key={kelas.id_kelas || kelas.id} value={(kelas.id_kelas || kelas.id)?.toString() || ''}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
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
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Memuat...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Tampilkan Data
                </>
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
  const [reportData, setReportData] = useState<any[]>([]);
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
      const data = await apiCall('/api/admin/classes', {}, onLogout);
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

      const url = `http://localhost:3001/api/admin/download-student-attendance-excel?${params.toString()}`;
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengunduh file');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ringkasan-kehadiran-siswa-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      link.click();
    } catch (err) {
      console.error('Error downloading excel:', err);
      setError('Gagal mengunduh file Excel');
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

      const url = `http://localhost:3001/api/export/${exportType}?${params.toString()}`;
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
                {classes.map((kelas) => (
                  <SelectItem key={kelas.id} value={kelas.id?.toString() || ''}>
                    {kelas.nama_kelas}
                  </SelectItem>
                ))}
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
  const [reportData, setReportData] = useState<any[]>([]);
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

      const url = `http://localhost:3001/api/admin/download-teacher-attendance-excel?${params.toString()}`;
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengunduh file');
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ringkasan-kehadiran-guru-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      link.click();
    } catch (err) {
      console.error('Error downloading excel:', err);
      setError('Gagal mengunduh file Excel');
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

      const url = `http://localhost:3001/api/export/${exportType}?${params.toString()}`;
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
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Memuat...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Tampilkan Data
                </>
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

      {/* Report Header with Kop */}
      {reportData.length > 0 && (
        <ReportHeader
          title="RINGKASAN KEHADIRAN GURU"
          subtitle="Laporan Kehadiran Guru Berdasarkan Status H/I/S/A"
          reportPeriod={`${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`}
        />
      )}

      {reportData.length > 0 && (
        <ExcelPreview
          title="Ringkasan Kehadiran Guru"
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
          showLetterhead={false}
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
    {
      id: 'riwayat-izin-report',
      title: 'Riwayat Pengajuan Izin', 
      description: 'Laporan history pengajuan izin siswa',
      icon: ClipboardList,
      gradient: 'from-orange-500 to-orange-700'
    },
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

  // Check token validity on component mount
  useEffect(() => {
    const checkTokenValidity = async () => {
      try {
        await apiCall('/api/verify-token', {}, onLogout);
      } catch (err) {
        console.error("Token verification failed:", err);
      }
    };

    checkTokenValidity();
  }, [onLogout]);

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
      case 'add-subject':
        return <ManageSubjectsView onBack={handleBack} onLogout={onLogout} />;
      case 'add-class':
        return <ManageClassesView onBack={handleBack} onLogout={onLogout} />;
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
          {/* Font Size Control - Above Logout Button */}
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <div className="mb-4">
              <FontSizeControl variant="compact" />
            </div>
          )}
          
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
    </div>
  );
};
