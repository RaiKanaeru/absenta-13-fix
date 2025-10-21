/**
 * Admin Component untuk Manage Jadwal Khusus
 * CRUD operations untuk Istirahat, Upacara, dan Perwalian
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Filter, Search, RefreshCw, Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useJadwalKhususAdmin } from '../../hooks/useJadwalKhusus';
import { JadwalKhusus, getScheduleColorClass, getScheduleIcon, getJenisKegiatanLabel } from '../../utils/jadwalKhususHelpers';
import { toast } from 'sonner';

interface JadwalKhususFormData {
  kelas_id: number | null;
  jenis_kegiatan: 'istirahat' | 'upacara' | 'perwalian' | '';
  nama_kegiatan: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  guru_id: number | null;
  keterangan: string;
}

const initialFormData: JadwalKhususFormData = {
  kelas_id: null,
  jenis_kegiatan: '',
  nama_kegiatan: '',
  hari: '',
  jam_mulai: '',
  jam_selesai: '',
  guru_id: null,
  keterangan: ''
};

interface JadwalKhususManagementProps {
  onBack: () => void;
  onLogout: () => void;
}

export const JadwalKhususManagement: React.FC<JadwalKhususManagementProps> = ({ onBack, onLogout }) => {
  const { 
    jadwalKhusus, 
    loading, 
    error, 
    fetchJadwalKhusus, 
    createJadwalKhusus, 
    updateJadwalKhusus, 
    deleteJadwalKhusus 
  } = useJadwalKhususAdmin();
  
  // State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<JadwalKhususFormData>(initialFormData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    kelas_id: '',
    jenis_kegiatan: '',
    hari: '',
    search: ''
  });
  
  // Master data
  const [kelasList, setKelasList] = useState<Array<{ id_kelas: number; nama_kelas: string }>>([]);
  const [guruList, setGuruList] = useState<Array<{ id_guru: number; nama: string }>>([]);
  
  // Load master data
  useEffect(() => {
    loadMasterData();
    fetchJadwalKhusus();
  }, []);
  
  const loadMasterData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load kelas
      const kelasRes = await fetch('http://localhost:3001/api/admin/kelas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const kelasData = await kelasRes.json();
      if (kelasData.success) setKelasList(kelasData.data || []);
      
      // Load guru
      const guruRes = await fetch('http://localhost:3001/api/admin/guru', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const guruData = await guruRes.json();
      if (guruData.success) setGuruList(guruData.data || []);
      
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };
  
  const handleOpenForm = (jadwal?: JadwalKhusus) => {
    if (jadwal) {
      setEditingId(jadwal.id);
      setFormData({
        kelas_id: jadwal.kelas_id,
        jenis_kegiatan: jadwal.jenis_kegiatan,
        nama_kegiatan: jadwal.nama_kegiatan,
        hari: jadwal.hari,
        jam_mulai: jadwal.jam_mulai.substring(0, 5),
        jam_selesai: jadwal.jam_selesai.substring(0, 5),
        guru_id: jadwal.guru_id,
        keterangan: jadwal.keterangan || ''
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };
  
  const validateForm = (): string | null => {
    if (!formData.jenis_kegiatan) return 'Jenis kegiatan harus dipilih';
    if (!formData.nama_kegiatan.trim()) return 'Nama kegiatan harus diisi';
    if (!formData.hari) return 'Hari harus dipilih';
    if (!formData.jam_mulai) return 'Jam mulai harus diisi';
    if (!formData.jam_selesai) return 'Jam selesai harus diisi';
    
    // Business rules
    if (formData.jenis_kegiatan === 'upacara' && formData.kelas_id) {
      return 'Upacara tidak boleh ditugaskan ke kelas tertentu (harus untuk semua kelas)';
    }
    
    if (formData.jenis_kegiatan === 'perwalian' && !formData.guru_id) {
      return 'Perwalian harus memiliki guru/wali kelas yang bertanggung jawab';
    }
    
    return null;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    try {
      setSaving(true);
      
      const submitData = {
        ...formData,
        kelas_id: formData.jenis_kegiatan === 'upacara' ? null : formData.kelas_id,
        guru_id: formData.jenis_kegiatan === 'perwalian' ? formData.guru_id : null,
        jam_mulai: `${formData.jam_mulai}:00`,
        jam_selesai: `${formData.jam_selesai}:00`
      };
      
      if (editingId) {
        await updateJadwalKhusus(editingId, submitData);
        toast.success('Jadwal khusus berhasil diupdate');
      } else {
        await createJadwalKhusus(submitData as any);
        toast.success('Jadwal khusus berhasil ditambahkan');
      }
      
      handleCloseForm();
      await fetchJadwalKhusus();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan jadwal khusus';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (id: number) => {
    try {
      await deleteJadwalKhusus(id);
      toast.success('Jadwal khusus berhasil dihapus');
      setDeleteConfirm(null);
      await fetchJadwalKhusus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus jadwal khusus';
      toast.error(errorMessage);
    }
  };
  
  const handleFilter = async () => {
    const filterParams = {
      kelas_id: filters.kelas_id ? parseInt(filters.kelas_id) : undefined,
      jenis_kegiatan: filters.jenis_kegiatan || undefined,
      hari: filters.hari || undefined
    };
    
    await fetchJadwalKhusus(filterParams);
  };
  
  const filteredJadwal = jadwalKhusus.filter(j => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return j.nama_kegiatan.toLowerCase().includes(search) ||
             j.nama_kelas?.toLowerCase().includes(search) ||
             j.nama_guru?.toLowerCase().includes(search);
    }
    return true;
  });
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <X className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jadwal Khusus Management</h1>
            <p className="text-gray-600 mt-1">Kelola jadwal istirahat, upacara, dan perwalian</p>
          </div>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jadwal Khusus
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Jenis Kegiatan</Label>
              <Select 
                value={filters.jenis_kegiatan || "all"} 
                onValueChange={(value) => setFilters({ ...filters, jenis_kegiatan: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="istirahat">Istirahat</SelectItem>
                  <SelectItem value="upacara">Upacara</SelectItem>
                  <SelectItem value="perwalian">Perwalian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Kelas</Label>
              <Select 
                value={filters.kelas_id || "all"} 
                onValueChange={(value) => setFilters({ ...filters, kelas_id: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {kelasList.map(k => (
                    <SelectItem key={k.id_kelas} value={k.id_kelas.toString()}>{k.nama_kelas}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Hari</Label>
              <Select 
                value={filters.hari || "all"} 
                onValueChange={(value) => setFilters({ ...filters, hari: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="Senin">Senin</SelectItem>
                  <SelectItem value="Selasa">Selasa</SelectItem>
                  <SelectItem value="Rabu">Rabu</SelectItem>
                  <SelectItem value="Kamis">Kamis</SelectItem>
                  <SelectItem value="Jumat">Jumat</SelectItem>
                  <SelectItem value="Sabtu">Sabtu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Pencarian</Label>
              <Input
                placeholder="Cari nama kegiatan..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({ kelas_id: '', jenis_kegiatan: '', hari: '', search: '' });
                  fetchJadwalKhusus();
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Jadwal Khusus ({filteredJadwal.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-gray-200 h-20 rounded"></div>
              ))}
            </div>
          ) : filteredJadwal.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Belum ada jadwal khusus</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJadwal.map(jadwal => {
                const colorClass = getScheduleColorClass('special', jadwal.jenis_kegiatan);
                const icon = getScheduleIcon('special', jadwal.jenis_kegiatan);
                
                return (
                  <div key={jadwal.id} className={`p-4 rounded-lg border-2 ${colorClass}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{jadwal.nama_kegiatan}</h3>
                            <Badge>
                              {getJenisKegiatanLabel(jadwal.jenis_kegiatan)}
                            </Badge>
                            <Badge variant="outline">{jadwal.hari}</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>⏰ {jadwal.jam_mulai.substring(0, 5)} - {jadwal.jam_selesai.substring(0, 5)}</p>
                            {jadwal.nama_kelas && <p>🏫 {jadwal.nama_kelas}</p>}
                            {jadwal.nama_guru && <p>👤 {jadwal.nama_guru}</p>}
                            {jadwal.keterangan && <p className="text-gray-500">📝 {jadwal.keterangan}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenForm(jadwal)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setDeleteConfirm(jadwal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Jadwal Khusus' : 'Tambah Jadwal Khusus'}
            </DialogTitle>
            <DialogDescription>
              Lengkapi form di bawah untuk {editingId ? 'mengupdate' : 'menambahkan'} jadwal khusus
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Jenis Kegiatan */}
            <div>
              <Label>Jenis Kegiatan *</Label>
              <Select 
                value={formData.jenis_kegiatan} 
                onValueChange={(value: any) => setFormData({ ...formData, jenis_kegiatan: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kegiatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="istirahat">☕ Istirahat</SelectItem>
                  <SelectItem value="upacara">🇮🇩 Upacara</SelectItem>
                  <SelectItem value="perwalian">👥 Perwalian</SelectItem>
                </SelectContent>
              </Select>
              {formData.jenis_kegiatan === 'upacara' && (
                <p className="text-xs text-gray-500 mt-1">Upacara akan otomatis berlaku untuk semua kelas</p>
              )}
            </div>
            
            {/* Nama Kegiatan */}
            <div>
              <Label>Nama Kegiatan *</Label>
              <Input
                value={formData.nama_kegiatan}
                onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
                placeholder="Contoh: Istirahat 1, Upacara Bendera, Perwalian X AK"
                required
              />
            </div>
            
            {/* Hari */}
            <div>
              <Label>Hari *</Label>
              <Select 
                value={formData.hari} 
                onValueChange={(value) => setFormData({ ...formData, hari: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih hari" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Senin">Senin</SelectItem>
                  <SelectItem value="Selasa">Selasa</SelectItem>
                  <SelectItem value="Rabu">Rabu</SelectItem>
                  <SelectItem value="Kamis">Kamis</SelectItem>
                  <SelectItem value="Jumat">Jumat</SelectItem>
                  <SelectItem value="Sabtu">Sabtu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Waktu */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jam Mulai *</Label>
                <Input
                  type="time"
                  value={formData.jam_mulai}
                  onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Jam Selesai *</Label>
                <Input
                  type="time"
                  value={formData.jam_selesai}
                  onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                  required
                />
              </div>
            </div>
            
            {/* Kelas (hide for upacara) */}
            {formData.jenis_kegiatan !== 'upacara' && (
              <div>
                <Label>Kelas {formData.jenis_kegiatan === 'perwalian' && '*'}</Label>
                <Select 
                  value={formData.kelas_id?.toString() || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, kelas_id: value === 'none' ? null : parseInt(value) })}
                  required={formData.jenis_kegiatan === 'perwalian'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas (opsional untuk istirahat)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Semua Kelas</SelectItem>
                    {kelasList.map(k => (
                      <SelectItem key={k.id_kelas} value={k.id_kelas.toString()}>{k.nama_kelas}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Guru (only for perwalian) */}
            {formData.jenis_kegiatan === 'perwalian' && (
              <div>
                <Label>Guru/Wali Kelas *</Label>
                <Select 
                  value={formData.guru_id?.toString() || 'select-guru'} 
                  onValueChange={(value) => setFormData({ ...formData, guru_id: value === 'select-guru' ? null : parseInt(value) })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih guru/wali kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {guruList.map(g => (
                      <SelectItem key={g.id_guru} value={g.id_guru.toString()}>{g.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Keterangan */}
            <div>
              <Label>Keterangan</Label>
              <Textarea
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Tambahan informasi (opsional)"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus jadwal khusus ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JadwalKhususManagement;

