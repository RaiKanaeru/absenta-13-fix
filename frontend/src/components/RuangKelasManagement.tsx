import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  RefreshCw,
  MapPin,
  Users,
  Settings
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { toast } from '../hooks/use-toast';

interface RuangKelas {
  id: number;
  kode_ruang: string;
  nama_ruang: string;
  kapasitas: number;
  lokasi: string;
  fasilitas: string;
  status: 'aktif' | 'tidak_aktif' | 'maintenance';
  created_at: string;
  updated_at: string;
}

interface RuangKelasManagementProps {
  onBack: () => void;
}

const RuangKelasManagement: React.FC<RuangKelasManagementProps> = ({ onBack }) => {
  const [ruangKelas, setRuangKelas] = useState<RuangKelas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRuang, setEditingRuang] = useState<RuangKelas | null>(null);
  const [formData, setFormData] = useState({
    kode_ruang: '',
    nama_ruang: '',
    kapasitas: 30,
    lokasi: '',
    fasilitas: '',
    status: 'aktif' as 'aktif' | 'tidak_aktif' | 'maintenance'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const statusColors = {
    'aktif': 'bg-green-100 text-green-800',
    'tidak_aktif': 'bg-red-100 text-red-800',
    'maintenance': 'bg-yellow-100 text-yellow-800'
  };

  const fetchRuangKelas = async (page = 1, search = '') => {
    setIsLoading(true);
    try {
      const response = await apiCall(`/api/admin/ruang-kelas?page=${page}&limit=10&search=${search}`);
      setRuangKelas(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching ruang kelas:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data ruang kelas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuangKelas(1, searchTerm);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRuang) {
        await apiCall(`/api/admin/ruang-kelas/${editingRuang.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast({
          title: "Berhasil",
          description: "Ruang kelas berhasil diperbarui"
        });
      } else {
        await apiCall('/api/admin/ruang-kelas', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast({
          title: "Berhasil",
          description: "Ruang kelas berhasil ditambahkan"
        });
      }
      
      setShowForm(false);
      setEditingRuang(null);
      setFormData({
        kode_ruang: '',
        nama_ruang: '',
        kapasitas: 30,
        lokasi: '',
        fasilitas: '',
        status: 'aktif'
      });
      fetchRuangKelas(pagination.page, searchTerm);
    } catch (error) {
      console.error('Error saving ruang kelas:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan ruang kelas",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (ruang: RuangKelas) => {
    setEditingRuang(ruang);
    setFormData({
      kode_ruang: ruang.kode_ruang,
      nama_ruang: ruang.nama_ruang,
      kapasitas: ruang.kapasitas,
      lokasi: ruang.lokasi,
      fasilitas: ruang.fasilitas || '',
      status: ruang.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiCall(`/api/admin/ruang-kelas/${id}`, {
        method: 'DELETE'
      });
      toast({
        title: "Berhasil",
        description: "Ruang kelas berhasil dihapus"
      });
      fetchRuangKelas(pagination.page, searchTerm);
    } catch (error) {
      console.error('Error deleting ruang kelas:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus ruang kelas",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      kode_ruang: '',
      nama_ruang: '',
      kapasitas: 30,
      lokasi: '',
      fasilitas: '',
      status: 'aktif'
    });
    setEditingRuang(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Management Ruang Kelas</h1>
          <p className="text-gray-600">Kelola data ruang kelas dan fasilitas</p>
        </div>
        <Button onClick={onBack} variant="outline">
          ← Kembali
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
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
            <Button onClick={() => fetchRuangKelas(pagination.page, searchTerm)} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Ruang
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ruang Kelas Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Daftar Ruang Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Ruang</TableHead>
                <TableHead>Nama Ruang</TableHead>
                <TableHead>Kapasitas</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Fasilitas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ruangKelas.map((ruang) => (
                <TableRow key={ruang.id}>
                  <TableCell className="font-mono font-medium">{ruang.kode_ruang}</TableCell>
                  <TableCell className="font-medium">{ruang.nama_ruang}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      {ruang.kapasitas}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      {ruang.lokasi}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={ruang.fasilitas}>
                    {ruang.fasilitas || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[ruang.status]}>
                      {ruang.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(ruang)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Ruang Kelas</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus ruang kelas "{ruang.nama_ruang}"? 
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(ruang.id)}
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
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRuang ? 'Edit Ruang Kelas' : 'Tambah Ruang Kelas'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="kode_ruang">Kode Ruang *</Label>
              <Input
                id="kode_ruang"
                value={formData.kode_ruang}
                onChange={(e) => setFormData({ ...formData, kode_ruang: e.target.value })}
                placeholder="R001"
                required
              />
            </div>

            <div>
              <Label htmlFor="nama_ruang">Nama Ruang *</Label>
              <Input
                id="nama_ruang"
                value={formData.nama_ruang}
                onChange={(e) => setFormData({ ...formData, nama_ruang: e.target.value })}
                placeholder="Ruang Kelas 1"
                required
              />
            </div>

            <div>
              <Label htmlFor="kapasitas">Kapasitas</Label>
              <Input
                id="kapasitas"
                type="number"
                value={formData.kapasitas}
                onChange={(e) => setFormData({ ...formData, kapasitas: parseInt(e.target.value) })}
                placeholder="30"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input
                id="lokasi"
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                placeholder="Lantai 1"
              />
            </div>

            <div>
              <Label htmlFor="fasilitas">Fasilitas</Label>
              <Textarea
                id="fasilitas"
                value={formData.fasilitas}
                onChange={(e) => setFormData({ ...formData, fasilitas: e.target.value })}
                placeholder="AC, Proyektor, Papan Tulis"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingRuang ? 'Perbarui' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RuangKelasManagement;
