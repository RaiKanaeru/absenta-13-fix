import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Trash2, Plus, Search } from 'lucide-react';
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

interface Class {
  id_kelas: number;
  nama_kelas: string;
  tingkat: string;
  ruang: string;
  kapasitas: number;
  status: string;
  created_at: string;
}

interface ManageClassesViewProps {
  onBack: () => void;
  onLogout: () => void;
}

const ManageClassesView: React.FC<ManageClassesViewProps> = ({ onBack, onLogout }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nama_kelas: '',
    tingkat: '',
    ruang: '',
    kapasitas: '',
    status: 'aktif'
  });
  const { toast } = useToast();

  const fetchClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await apiCall('/api/admin/kelas', {}, onLogout);
      if (result.success) {
        setClasses(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [onLogout, toast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId ? `/api/admin/kelas/${editingId}` : '/api/admin/kelas';
      const method = editingId ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        kapasitas: parseInt(formData.kapasitas)
      };

      await apiCall(url, {
        method,
        body: JSON.stringify(submitData),
      }, onLogout);

      toast({ title: editingId ? "Kelas berhasil diupdate!" : "Kelas berhasil ditambahkan!" });
      setFormData({ nama_kelas: '', tingkat: '', ruang: '', kapasitas: '', status: 'aktif' });
      setEditingId(null);
      setShowForm(false);
      fetchClasses();
    } catch (error) {
      console.error('Error submitting class:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (classItem: Class) => {
    setFormData({
      nama_kelas: classItem.nama_kelas,
      tingkat: classItem.tingkat,
      ruang: classItem.ruang,
      kapasitas: classItem.kapasitas.toString(),
      status: classItem.status
    });
    setEditingId(classItem.id_kelas);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiCall(`/api/admin/kelas/${id}`, { method: 'DELETE' }, onLogout);
      toast({ title: "Kelas berhasil dihapus!" });
      fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.tingkat.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || classItem.status === statusFilter;
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
          <h1 className="text-2xl font-bold">Kelola Kelas</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kelas
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari kelas..."
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
              {editingId ? 'Edit Kelas' : 'Tambah Kelas'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nama_kelas">Nama Kelas *</Label>
                <Input
                  id="nama_kelas"
                  value={formData.nama_kelas}
                  onChange={(e) => setFormData({...formData, nama_kelas: e.target.value})}
                  placeholder="Contoh: X AK 1, XI TKJ 2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="tingkat">Tingkat *</Label>
                <Select value={formData.tingkat} onValueChange={(value) => setFormData({...formData, tingkat: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="X">X</SelectItem>
                    <SelectItem value="XI">XI</SelectItem>
                    <SelectItem value="XII">XII</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ruang">Ruang</Label>
                <Input
                  id="ruang"
                  value={formData.ruang}
                  onChange={(e) => setFormData({...formData, ruang: e.target.value})}
                  placeholder="Contoh: Ruang 101, Lab Komputer"
                />
              </div>
              <div>
                <Label htmlFor="kapasitas">Kapasitas</Label>
                <Input
                  id="kapasitas"
                  type="number"
                  value={formData.kapasitas}
                  onChange={(e) => setFormData({...formData, kapasitas: e.target.value})}
                  placeholder="Contoh: 30"
                  min="1"
                />
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
                  setFormData({ nama_kelas: '', tingkat: '', ruang: '', kapasitas: '', status: 'aktif' });
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
              <TableHead>Nama Kelas</TableHead>
              <TableHead>Tingkat</TableHead>
              <TableHead>Ruang</TableHead>
              <TableHead>Kapasitas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClasses.map((classItem) => (
              <TableRow key={classItem.id_kelas}>
                <TableCell className="font-medium">{classItem.nama_kelas}</TableCell>
                <TableCell>{classItem.tingkat}</TableCell>
                <TableCell>{classItem.ruang || '-'}</TableCell>
                <TableCell>{classItem.kapasitas || '-'}</TableCell>
                <TableCell>
                  <Badge variant={classItem.status === 'aktif' ? 'default' : 'secondary'}>
                    {classItem.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(classItem)}
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
                            Apakah Anda yakin ingin menghapus kelas {classItem.nama_kelas}? Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(classItem.id_kelas)}>
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

      {filteredClasses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {isLoading ? 'Memuat data...' : 'Tidak ada data kelas yang ditemukan.'}
        </div>
      )}
    </div>
  );
};

export default ManageClassesView;
