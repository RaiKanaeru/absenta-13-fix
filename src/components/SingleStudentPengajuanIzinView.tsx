import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Send, FileText, Calendar, Clock, User } from "lucide-react";

interface SingleStudentPengajuanIzinViewProps {
  onBack: () => void;
  onLogout: () => void;
}

interface PengajuanIzin {
  id_pengajuan: number;
  siswa_id: number;
  jadwal_id: number;
  tanggal_izin: string;
  alasan: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  nama_siswa: string;
  nama_kelas: string;
  nama_mapel: string;
  nama_guru: string;
  jam_mulai: string;
  jam_selesai: string;
}

interface Jadwal {
  id_jadwal: number;
  nama_mapel: string;
  nama_guru: string;
  jam_mulai: string;
  jam_selesai: string;
  hari: string;
}

const SingleStudentPengajuanIzinView = ({ onBack, onLogout }: SingleStudentPengajuanIzinViewProps) => {
  const [pengajuanList, setPengajuanList] = useState<PengajuanIzin[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    jadwal_id: '',
    tanggal_izin: '',
    alasan: ''
  });

  // Load pengajuan izin data
  const loadPengajuanIzin = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch('http://localhost:3001/api/siswa/pengajuan-izin-single', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPengajuanList(data);
      } else {
        const errorData = await response.json();
        console.error('Error loading pengajuan izin:', errorData);
        toast({
          title: "Error",
          description: errorData.error || "Gagal memuat data pengajuan izin",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading pengajuan izin:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  // Load jadwal by date
  const loadJadwalByDate = useCallback(async (tanggal: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/api/siswa/jadwal-by-date?tanggal=${tanggal}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJadwalList(data);
      }
    } catch (error) {
      console.error('Error loading jadwal:', error);
    }
  }, []);

  // Submit pengajuan izin
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.jadwal_id || !formData.tanggal_izin || !formData.alasan) {
      toast({
        title: "Error",
        description: "Semua field wajib diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch('http://localhost:3001/api/siswa/pengajuan-izin-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Pengajuan izin berhasil diajukan"
        });
        
        // Reset form
        setFormData({
          jadwal_id: '',
          tanggal_izin: '',
          alasan: ''
        });
        setShowForm(false);
        loadPengajuanIzin();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Gagal mengajukan izin",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting pengajuan izin:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengajukan izin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPengajuanIzin();
  }, [loadPengajuanIzin]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return 'Tidak Diketahui';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengajuan Izin Siswa</h1>
          <p className="text-gray-600">Ajukan izin ketidakhadiran untuk diri sendiri</p>
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Form Pengajuan Izin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tanggal_izin">Tanggal Izin *</Label>
                  <Input
                    id="tanggal_izin"
                    type="date"
                    value={formData.tanggal_izin}
                    onChange={(e) => {
                      const tanggal = e.target.value;
                      setFormData({...formData, tanggal_izin: tanggal, jadwal_id: ''});
                      if (tanggal) {
                        loadJadwalByDate(tanggal);
                      } else {
                        setJadwalList([]);
                      }
                    }}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="jadwal_id">Jadwal Pelajaran *</Label>
                  <Select 
                    value={formData.jadwal_id} 
                    onValueChange={(value) => setFormData({...formData, jadwal_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jadwal pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {jadwalList.map((jadwal) => (
                        <SelectItem key={jadwal.id_jadwal} value={jadwal.id_jadwal.toString()}>
                          {jadwal.nama_mapel} - {jadwal.nama_guru} ({jadwal.jam_mulai}-{jadwal.jam_selesai})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="alasan">Alasan Izin *</Label>
                <Textarea
                  id="alasan"
                  value={formData.alasan}
                  onChange={(e) => setFormData({...formData, alasan: e.target.value})}
                  placeholder="Jelaskan alasan izin ketidakhadiran..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      jadwal_id: '',
                      tanggal_izin: '',
                      alasan: ''
                    });
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!showForm && (
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Ajukan Izin Baru
          </Button>
        </div>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-5" />
            Riwayat Pengajuan Izin
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data...</p>
            </div>
          ) : pengajuanList.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Pengajuan</h3>
              <p className="text-gray-600">Anda belum pernah mengajukan izin ketidakhadiran</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pengajuanList.map((pengajuan) => (
                    <TableRow key={pengajuan.id_pengajuan}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {new Date(pengajuan.tanggal_izin).toLocaleDateString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pengajuan.nama_mapel}</div>
                          <div className="text-sm text-gray-600">{pengajuan.nama_guru}</div>
                          <div className="text-sm text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {pengajuan.jam_mulai} - {pengajuan.jam_selesai}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-gray-700 truncate" title={pengajuan.alasan}>
                          {pengajuan.alasan}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(pengajuan.status)}>
                          {getStatusText(pengajuan.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(pengajuan.created_at).toLocaleDateString('id-ID')}
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

export default SingleStudentPengajuanIzinView;
