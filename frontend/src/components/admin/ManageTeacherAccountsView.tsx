import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Trash2, Plus, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// API call utility
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

interface Teacher {
  id_guru: number;
  nama: string;
  nip: string;
  email: string;
  no_telp: string;
  mapel_id: number;
  nama_mapel: string;
  status: string;
  created_at: string;
}

interface ManageTeacherAccountsViewProps {
  onBack: () => void;
  onLogout: () => void;
}

const ManageTeacherAccountsView: React.FC<ManageTeacherAccountsViewProps> = ({ onBack, onLogout }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<{ id_mapel: number; nama_mapel: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    email: '',
    no_telp: '',
    mapel_id: '',
    status: 'aktif'
  });
  const { toast } = useToast();

  const fetchTeachers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await apiCall('/api/admin/guru', {}, onLogout);
      if (result.success) {
        setTeachers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [onLogout, toast]);

  const fetchSubjects = useCallback(async () => {
    try {
      const result = await apiCall('/api/admin/mapel', {}, onLogout);
      if (result.success) {
        setSubjects(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, [onLogout]);

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, [fetchTeachers, fetchSubjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId ? `/api/admin/guru/${editingId}` : '/api/admin/guru';
      const method = editingId ? 'PUT' : 'POST';

      await apiCall(url, {
        method,
        body: JSON.stringify(formData),
      }, onLogout);

      toast({ title: editingId ? "Guru berhasil diupdate!" : "Guru berhasil ditambahkan!" });
      setFormData({ nama: '', nip: '', email: '', no_telp: '', mapel_id: '', status: 'aktif' });
      setEditingId(null);
      setShowForm(false);
      fetchTeachers();
    } catch (error) {
      console.error('Error submitting teacher:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setFormData({
      nama: teacher.nama,
      nip: teacher.nip,
      email: teacher.email,
      no_telp: teacher.no_telp,
      mapel_id: teacher.mapel_id.toString(),
      status: teacher.status
    });
    setEditingId(teacher.id_guru);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiCall(`/api/admin/guru/${id}`, { method: 'DELETE' }, onLogout);
      toast({ title: "Guru berhasil dihapus!" });
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.nip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Kelola Akun Guru</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Guru
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari guru..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Guru' : 'Tambah Guru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nip">NIP *</Label>
                <Input
                  id="nip"
                  value={formData.nip}
                  onChange={(e) => setFormData({...formData, nip: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="no_telp">No. Telepon</Label>
                <Input
                  id="no_telp"
                  value={formData.no_telp}
                  onChange={(e) => setFormData({...formData, no_telp: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="mapel_id">Mata Pelajaran *</Label>
                <Select value={formData.mapel_id} onValueChange={(value) => setFormData({...formData, mapel_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Mata Pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id_mapel} value={subject.id_mapel.toString()}>
                        {subject.nama_mapel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : (editingId ? 'Update' : 'Simpan')}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ nama: '', nip: '', email: '', no_telp: '', mapel_id: '', status: 'aktif' });
                }}>
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIP</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>No. Telepon</TableHead>
              <TableHead>Mata Pelajaran</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.map((teacher) => (
              <TableRow key={teacher.id_guru}>
                <TableCell className="font-medium">{teacher.nama}</TableCell>
                <TableCell>{teacher.nip}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>{teacher.no_telp || '-'}</TableCell>
                <TableCell>{teacher.nama_mapel}</TableCell>
                <TableCell>
                  <Badge variant={teacher.status === 'aktif' ? 'default' : 'secondary'}>
                    {teacher.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(teacher)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus guru {teacher.nama}? Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(teacher.id_guru)}>
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

      {filteredTeachers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {isLoading ? 'Memuat data...' : 'Tidak ada data guru yang ditemukan.'}
        </div>
      )}
    </div>
  );
};

export default ManageTeacherAccountsView;
