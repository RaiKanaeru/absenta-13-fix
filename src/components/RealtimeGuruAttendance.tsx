import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Edit,
  Eye,
  TrendingUp
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { toast } from '../hooks/use-toast';

interface GuruAttendance {
  id_absensi: number;
  guru_id: number;
  nama_guru: string;
  kelas_id: number;
  nama_kelas: string;
  jadwal_id: number;
  hari: string;
  jam_ke: number;
  jam_mulai: string;
  jam_selesai: string;
  tanggal: string;
  status: 'Hadir' | 'Tidak Hadir' | 'Sakit' | 'Izin' | 'Dispen' | 'Terlambat';
  keterangan: string;
  waktu_scan: string;
  metode_absen: 'manual' | 'scan' | 'otomatis';
  jam_terlambat: number;
  alasan_terlambat: string;
  waktu_catat: string;
  nama_mapel: string;
}

interface AttendanceSummary {
  total: number;
  hadir: number;
  tidak_hadir: number;
  sakit: number;
  izin: number;
  terlambat: number;
  dispen: number;
}

interface RealtimeGuruAttendanceProps {
  onBack: () => void;
}

const RealtimeGuruAttendance: React.FC<RealtimeGuruAttendanceProps> = ({ onBack }) => {
  const [attendance, setAttendance] = useState<GuruAttendance[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingAttendance, setEditingAttendance] = useState<GuruAttendance | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    keterangan: '',
    jam_terlambat: '',
    alasan_terlambat: '',
    metode_absen: 'manual'
  });

  const statusColors = {
    'Hadir': 'bg-green-100 text-green-800',
    'Tidak Hadir': 'bg-red-100 text-red-800',
    'Sakit': 'bg-yellow-100 text-yellow-800',
    'Izin': 'bg-blue-100 text-blue-800',
    'Terlambat': 'bg-orange-100 text-orange-800',
    'Dispen': 'bg-purple-100 text-purple-800'
  };

  const statusIcons = {
    'Hadir': <CheckCircle className="w-4 h-4" />,
    'Tidak Hadir': <XCircle className="w-4 h-4" />,
    'Sakit': <AlertTriangle className="w-4 h-4" />,
    'Izin': <Clock className="w-4 h-4" />,
    'Terlambat': <Clock className="w-4 h-4" />,
    'Dispen': <AlertTriangle className="w-4 h-4" />
  };

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall(`/api/admin/guru/kehadiran-realtime?tanggal=${selectedDate}`);
      setAttendance(response.data);
      setSummary(response.summary);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kehadiran guru",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handleEdit = (attendance: GuruAttendance) => {
    setEditingAttendance(attendance);
    setEditForm({
      status: attendance.status,
      keterangan: attendance.keterangan || '',
      jam_terlambat: attendance.jam_terlambat?.toString() || '',
      alasan_terlambat: attendance.alasan_terlambat || '',
      metode_absen: attendance.metode_absen || 'manual'
    });
  };

  const handleSave = async () => {
    if (!editingAttendance) return;

    try {
      await apiCall(`/api/admin/guru/kehadiran/${editingAttendance.id_absensi}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });

      toast({
        title: "Berhasil",
        description: "Kehadiran guru berhasil diperbarui"
      });

      setEditingAttendance(null);
      fetchAttendance();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui kehadiran guru",
        variant: "destructive"
      });
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAttendancePercentage = () => {
    if (!summary) return 0;
    return summary.total > 0 ? Math.round((summary.hadir / summary.total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tracking Kehadiran Guru</h1>
          <p className="text-gray-600">Monitor kehadiran guru secara realtime</p>
        </div>
        <Button onClick={onBack} variant="outline">
          ← Kembali
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="date">Tanggal:</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={fetchAttendance} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Hadir</p>
                  <p className="text-2xl font-bold text-green-600">{summary.hadir}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Tidak Hadir</p>
                  <p className="text-2xl font-bold text-red-600">{summary.tidak_hadir}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Sakit</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.sakit}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Izin</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.izin}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-orange-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Terlambat</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.terlambat}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Persentase</p>
                  <p className="text-2xl font-bold text-purple-600">{getAttendancePercentage()}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kehadiran Guru</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guru</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Mapel</TableHead>
                <TableHead>Hari</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Waktu Scan</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((item) => (
                <TableRow key={item.id_absensi}>
                  <TableCell className="font-medium">{item.nama_guru}</TableCell>
                  <TableCell>{item.nama_kelas}</TableCell>
                  <TableCell>{item.nama_mapel}</TableCell>
                  <TableCell>{item.hari}</TableCell>
                  <TableCell>
                    {formatTime(item.jam_mulai)} - {formatTime(item.jam_selesai)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[item.status]}>
                      <span className="flex items-center gap-1">
                        {statusIcons[item.status]}
                        {item.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.metode_absen}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.waktu_scan ? new Date(item.waktu_scan).toLocaleString('id-ID') : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingAttendance} onOpenChange={() => setEditingAttendance(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Kehadiran Guru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hadir">Hadir</SelectItem>
                  <SelectItem value="Tidak Hadir">Tidak Hadir</SelectItem>
                  <SelectItem value="Sakit">Sakit</SelectItem>
                  <SelectItem value="Izin">Izin</SelectItem>
                  <SelectItem value="Terlambat">Terlambat</SelectItem>
                  <SelectItem value="Dispen">Dispen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="metode_absen">Metode Absen</Label>
              <Select
                value={editForm.metode_absen}
                onValueChange={(value) => setEditForm({ ...editForm, metode_absen: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="scan">Scan</SelectItem>
                  <SelectItem value="otomatis">Otomatis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editForm.status === 'Terlambat' && (
              <>
                <div>
                  <Label htmlFor="jam_terlambat">Menit Keterlambatan</Label>
                  <Input
                    id="jam_terlambat"
                    type="number"
                    value={editForm.jam_terlambat}
                    onChange={(e) => setEditForm({ ...editForm, jam_terlambat: e.target.value })}
                    placeholder="Menit keterlambatan"
                  />
                </div>
                <div>
                  <Label htmlFor="alasan_terlambat">Alasan Keterlambatan</Label>
                  <Textarea
                    id="alasan_terlambat"
                    value={editForm.alasan_terlambat}
                    onChange={(e) => setEditForm({ ...editForm, alasan_terlambat: e.target.value })}
                    placeholder="Alasan keterlambatan"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={editForm.keterangan}
                onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
                placeholder="Keterangan tambahan"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingAttendance(null)}>
                Batal
              </Button>
              <Button onClick={handleSave}>
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RealtimeGuruAttendance;
