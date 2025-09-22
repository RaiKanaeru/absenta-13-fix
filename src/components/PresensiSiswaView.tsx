import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ArrowLeft, Download, Search, FileText, Users, Calendar, User } from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface Kelas {
  id: number;
  nama_kelas: string;
}

interface Siswa {
  id: number;
  nama: string;
  nis: string;
  nisn: string;
  jenis_kelamin: 'L' | 'P';
  kelas_id: number;
}

interface PresensiData {
  siswa_id: number;
  tanggal: string;
  status: 'Hadir' | 'Sakit' | 'Alpa' | 'Izin' | 'Dispen';
  keterangan?: string;
}

const PresensiSiswaView: React.FC<{ onBack: () => void; onLogout: () => void }> = ({ onBack, onLogout }) => {
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedBulan, setSelectedBulan] = useState<string>('');
  const [selectedTahun, setSelectedTahun] = useState<string>(new Date().getFullYear().toString());
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [presensiData, setPresensiData] = useState<PresensiData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/kelas', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      } else if (response.status === 401) {
        toast({
          title: "Error",
          description: "Sesi Anda telah berakhir. Silakan login ulang.",
          variant: "destructive"
        });
        setTimeout(() => onLogout(), 2000);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Gagal memuat data kelas');
    }
  }, [onLogout]);

  // Fetch students by class
  const fetchStudents = useCallback(async (kelasId: string) => {
    if (!kelasId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/admin/students-by-class/${kelasId}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else if (response.status === 401) {
        toast({
          title: "Error",
          description: "Sesi Anda telah berakhir. Silakan login ulang.",
          variant: "destructive"
        });
        setTimeout(() => onLogout(), 2000);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  // Fetch presensi data
  const fetchPresensiData = useCallback(async (kelasId: string, bulan: string, tahun: string) => {
    if (!kelasId || !bulan || !tahun) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        kelas_id: kelasId,
        bulan: bulan,
        tahun: tahun
      });

      const response = await fetch(`http://localhost:3001/api/admin/presensi-siswa?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPresensiData(data);
      } else if (response.status === 401) {
        toast({
          title: "Error",
          description: "Sesi Anda telah berakhir. Silakan login ulang.",
          variant: "destructive"
        });
        setTimeout(() => onLogout(), 2000);
      }
    } catch (error) {
      console.error('Error fetching presensi data:', error);
      setError('Gagal memuat data presensi');
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedKelas) {
      fetchStudents(selectedKelas);
    }
  }, [selectedKelas, fetchStudents]);

  useEffect(() => {
    if (selectedKelas && selectedBulan && selectedTahun) {
      fetchPresensiData(selectedKelas, selectedBulan, selectedTahun);
    }
  }, [selectedKelas, selectedBulan, selectedTahun, fetchPresensiData]);

  // Get presensi status for specific student and date
  const getPresensiStatus = (siswaId: number, tanggal: number): string => {
    const dateStr = `${selectedTahun}-${selectedBulan.padStart(2, '0')}-${tanggal.toString().padStart(2, '0')}`;
    
    // Find presensi by matching date string (database returns ISO string, we need to extract date part)
    const presensi = presensiData.find(p => {
      const presensiDate = new Date(p.tanggal).toISOString().split('T')[0];
      return p.siswa_id === siswaId && presensiDate === dateStr;
    });
    
    
    if (!presensi) return '';
    
    // Convert full status to short format
    const statusMap: { [key: string]: string } = {
      'Hadir': 'H',
      'Sakit': 'S', 
      'Alpa': 'A',
      'Izin': 'I',
      'Dispen': 'D'
    };
    
    return statusMap[presensi.status] || presensi.status;
  };

  // Get keterangan for specific student and date
  const getKeterangan = (siswaId: number, tanggal: number): string => {
    const dateStr = `${selectedTahun}-${selectedBulan.padStart(2, '0')}-${tanggal.toString().padStart(2, '0')}`;
    
    // Find presensi by matching date string (database returns ISO string, we need to extract date part)
    const presensi = presensiData.find(p => {
      const presensiDate = new Date(p.tanggal).toISOString().split('T')[0];
      return p.siswa_id === siswaId && presensiDate === dateStr;
    });
    
    return presensi ? (presensi.keterangan || '') : '';
  };


  // Count students by gender
  const countByGender = () => {
    const lakiLaki = students.filter(s => s.jenis_kelamin === 'L').length;
    const perempuan = students.filter(s => s.jenis_kelamin === 'P').length;
    return { lakiLaki, perempuan };
  };

  // Generate days in month
  const getDaysInMonth = (month: string, year: string): number[] => {
    if (!month || !year) return [];
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (!selectedKelas || !selectedBulan || !selectedTahun) {
      toast({
        title: "Error",
        description: "Pilih kelas, bulan, dan tahun terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        kelas_id: selectedKelas,
        bulan: selectedBulan,
        tahun: selectedTahun,
      });

      const response = await fetch(`/api/export/presensi-siswa?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const kelasName = classes.find(c => c.id.toString() === selectedKelas)?.nama_kelas || 'Unknown';
      const bulanName = new Date(parseInt(selectedTahun), parseInt(selectedBulan) - 1).toLocaleDateString('id-ID', { month: 'long' });
      const fileName = `Presensi_Siswa_${kelasName}_${bulanName}_${selectedTahun}.xlsx`;
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Data presensi berhasil diekspor ke Excel",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Gagal mengekspor data presensi ke Excel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = getDaysInMonth(selectedBulan, selectedTahun);
  const { lakiLaki, perempuan } = countByGender();

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
              <h1 className="text-2xl font-bold text-gray-900">Presensi Siswa</h1>
              <p className="text-gray-600">Format presensi siswa sesuai standar SMKN 13</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id.toString()}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bulan">Bulan</Label>
              <Select value={selectedBulan} onValueChange={setSelectedBulan}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString();
                    const monthName = new Date(2024, i).toLocaleString('id-ID', { month: 'long' });
                    return (
                      <SelectItem key={month} value={month}>
                        {monthName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun</Label>
              <Input
                id="tahun"
                type="number"
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(e.target.value)}
                placeholder="Tahun"
                min="2020"
                max="2030"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Presensi Table */}
      {selectedKelas && selectedBulan && selectedTahun && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Presensi Siswa - {classes.find(c => c.id.toString() === selectedKelas)?.nama_kelas}</span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExportExcel}
                  disabled={loading || !selectedKelas || !selectedBulan || !selectedTahun}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {loading ? 'Exporting...' : 'Export Excel'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {/* School Header */}
              <div className="text-center mb-6 p-4 bg-white border-2 border-gray-300">
                <div className="text-sm font-bold">
                  PEMERINTAH DAERAH PROVINSI JAWA BARAT<br />
                  DINAS PENDIDIKAN<br />
                  CABANG DINAS PENDIDIKAN WILAYAH VII<br />
                  SEKOLAH MENENGAH KEJURUAN NEGERI 13
                </div>
                <div className="text-xs mt-2">
                  Jalan Soekarno - Hatta Km.10 Telepon (022) 7318960: Ext. 114<br />
                  Telepon/Faksimil: (022) 7332252 – Bandung 40286<br />
                  Email: smk13bdg@gmail.com Home page: http://www.smkn13.sch.id
                </div>
                <div className="text-lg font-bold mt-4">
                  PRESENSI SISWA
                </div>
                <div className="text-sm">
                  TAHUN PELAJARAN {selectedTahun}/{parseInt(selectedTahun) + 1}
                </div>
                <div className="text-sm font-bold">
                  KELAS {classes.find(c => c.id.toString() === selectedKelas)?.nama_kelas}
                </div>
              </div>

              {/* Presensi Table */}
              <div className="border-2 border-gray-400">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-400">
                      <th className="border border-gray-300 p-2 text-center w-12">NO</th>
                      <th className="border border-gray-300 p-2 text-center w-32">NIS / NISN</th>
                      <th className="border border-gray-300 p-2 text-center w-48">NAMA</th>
                      <th className="border border-gray-300 p-2 text-center w-8">L/P</th>
                      <th className="border border-gray-300 p-2 text-center" colSpan={daysInMonth.length}>
                        PERTEMUAN
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-20">KET</th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-300">
                      <th className="border border-gray-300 p-1"></th>
                      <th className="border border-gray-300 p-1"></th>
                      <th className="border border-gray-300 p-1"></th>
                      <th className="border border-gray-300 p-1"></th>
                      {daysInMonth.map((day) => (
                        <th key={day} className="border border-gray-300 p-1 text-center w-8">
                          {day}
                        </th>
                      ))}
                      <th className="border border-gray-300 p-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((siswa, index) => (
                      <tr key={siswa.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          {siswa.nis} / {siswa.nisn}
                        </td>
                        <td className="border border-gray-300 p-2">{siswa.nama}</td>
                        <td className="border border-gray-300 p-2 text-center">{siswa.jenis_kelamin}</td>
                        {daysInMonth.map((day) => {
                          const status = getPresensiStatus(siswa.id, day);
                          return (
                            <td key={day} className="border border-gray-300 p-1 text-center">
                              {status && (
                                <span className={`px-1 py-0.5 text-xs rounded ${
                                  status === 'H' ? 'bg-green-100 text-green-800' :
                                  status === 'S' ? 'bg-red-100 text-red-800' :
                                  status === 'A' ? 'bg-yellow-100 text-yellow-800' :
                                  status === 'I' ? 'bg-blue-100 text-blue-800' :
                                  status === 'D' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {status}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="border border-gray-300 p-2 text-center">
                          {(() => {
                            // Collect all keterangan for this student
                            const keteranganList = daysInMonth
                              .map(day => {
                                const keterangan = getKeterangan(siswa.id, day);
                                return keterangan ? { day, keterangan } : null;
                              })
                              .filter(Boolean);
                            
                            return keteranganList.length > 0 ? (
                              <div className="text-xs text-gray-600 text-left max-w-32">
                                {keteranganList.map((item, idx) => (
                                  <div key={idx} className="mb-1">
                                    <span className="font-semibold text-blue-600">{item.day}:</span> {item.keterangan}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="mt-4 flex justify-between">
                <div className="text-sm">
                  <div className="font-bold">JUMLAH</div>
                  <div>LAKI-LAKI = {lakiLaki}</div>
                  <div>PEREMPUAN = {perempuan}</div>
                  <div className="mt-2">
                    <div className="font-bold">KETERANGAN:</div>
                    <div>H: Hadir</div>
                    <div>S: Sakit</div>
                    <div>A: Alpa</div>
                    <div>I: Izin</div>
                    <div>D: Dispen</div>
                  </div>
                </div>
                <div className="text-sm text-right">
                  <div>Guru Mata Pelajaran</div>
                  <div className="mt-8">
                    <div className="border-b border-gray-400 w-32 mb-1"></div>
                    <div className="text-xs">(___________________)</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && (!selectedKelas || !selectedBulan || !selectedTahun) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Filter</h3>
            <p className="text-gray-500 text-center">Pilih kelas, bulan, dan tahun untuk melihat presensi siswa</p>
          </CardContent>
        </Card>
      )}

      {!loading && selectedKelas && selectedBulan && selectedTahun && students.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada siswa</h3>
            <p className="text-gray-500 text-center">Tidak ada siswa ditemukan untuk kelas yang dipilih</p>
          </CardContent>
        </Card>
      )}

      {!loading && selectedKelas && selectedBulan && selectedTahun && students.length > 0 && presensiData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data presensi</h3>
            <p className="text-gray-500 text-center">Tidak ada data presensi untuk periode yang dipilih. Pastikan ada data absensi siswa untuk kelas dan periode yang dipilih.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PresensiSiswaView;
