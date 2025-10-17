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

interface Room {
  id: number;
  nama_ruang: string;
  kode_ruang: string;
  kapasitas: number;
  lokasi: string;
  status: 'aktif' | 'nonaktif';
  created_at?: string;
}

interface RuangKelasManagementViewProps {
  onBack: () => void;
  onLogout: () => void;
}

const RuangKelasManagementView: React.FC<RuangKelasManagementViewProps> = ({ onBack, onLogout }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nama_ruang: '',
    kode_ruang: '',
    kapasitas: 0,
    lokasi: ''
  });
  const { toast } = useToast();

  const fetchRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await apiCall('/api/admin/ruang-kelas', {}, onLogout);
      if (result.success) {
        setRooms(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [onLogout, toast]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // --- Validasi Form ---
    if (!formData.nama_ruang.trim()) {
      toast({ title: "Error", description: "Nama Ruang wajib diisi.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!formData.kode_ruang.trim()) {
      toast({ title: "Error", description: "Kode Ruang wajib diisi.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (formData.kapasitas <= 0) {
      toast({ title: "Error", description: "Kapasitas harus lebih dari 0.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!formData.lokasi.trim()) {
      toast({ title: "Error", description: "Lokasi wajib diisi.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    // --- End Validasi Form ---

    try {
      const url = editingId ? `/api/admin/ruang-kelas/${editingId}` : '/api/admin/ruang-kelas';
      const method = editingId ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        kapasitas: formData.kapasitas // Sudah number
      };

      await apiCall(url, {
        method,
        body: JSON.stringify(submitData),
      }, onLogout);

      toast({ title: editingId ? "Ruang kelas berhasil diupdate!" : "Ruang kelas berhasil ditambahkan!" });
      setFormData({ nama_ruang: '', kode_ruang: '', kapasitas: 0, lokasi: '' }); // Reset kapasitas ke 0
      setEditingId(null);
      setShowForm(false);
      fetchRooms();
    } catch (error) {
      console.error('Error submitting room:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (room: Room) => {
    setFormData({
      nama_ruang: room.nama_ruang,
      kode_ruang: room.kode_ruang,
      kapasitas: room.kapasitas || 0,
      lokasi: room.lokasi || ''
    });
    setEditingId(room.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiCall(`/api/admin/ruang-kelas/${id}`, { method: 'DELETE' }, onLogout);
      toast({ title: "Ruang kelas berhasil dihapus!" });
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.nama_ruang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.kode_ruang.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
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
          <h1 className="text-2xl font-bold">Kelola Ruang Kelas</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Ruang Kelas
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="nonaktif">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Ruang Kelas' : 'Tambah Ruang Kelas'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex space-x-2 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : (editingId ? 'Update' : 'Simpan')}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ nama_ruang: '', kode_ruang: '', kapasitas: 0, lokasi: '' });
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
                <TableCell>{room.nama_ruang}</TableCell>
                <TableCell><Badge>{room.kode_ruang}</Badge></TableCell>
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
                          <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus ruang kelas {room.nama_ruang}? Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(room.id)}>
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

      {filteredRooms.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {isLoading ? 'Memuat data...' : 'Tidak ada data ruang kelas yang ditemukan.'}
        </div>
      )}
    </div>
  );
};

export default RuangKelasManagementView;
