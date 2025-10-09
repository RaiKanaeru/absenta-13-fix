import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ArrowLeft, Download, Search, FileText, Users, Calendar, BarChart3 } from 'lucide-react';
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
  bulan: number;
  tahun: number;
  total_hari_efektif: number;
  total_ketidakhadiran: number;
  persentase_ketidakhadiran: string | number;
  persentase_kehadiran: string | number;
  detail_ketidakhadiran: {
    tanggal: string;
    status: 'S' | 'A' | 'I';
    keterangan?: string;
  }[];
}

const RekapKetidakhadiranView: React.FC<{ onBack: () => void; onLogout: () => void }> = ({ onBack, onLogout }) => {
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedTahun, setSelectedTahun] = useState<string>(new Date().getFullYear().toString());
  const [selectedBulan, setSelectedBulan] = useState<string>('');
  const [selectedTanggalAwal, setSelectedTanggalAwal] = useState<string>('');
  const [selectedTanggalAkhir, setSelectedTanggalAkhir] = useState<string>('');
  const [viewMode, setViewMode] = useState<'tahunan' | 'bulanan' | 'tanggal'>('tahunan');
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [presensiData, setPresensiData] = useState<PresensiData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bulan dalam setahun
  const months = [
    { key: 'JUL', name: 'Juli', number: 7 },
    { key: 'AGT', name: 'Agustus', number: 8 },
    { key: 'SEP', name: 'September', number: 9 },
    { key: 'OKT', name: 'Oktober', number: 10 },
    { key: 'NOV', name: 'November', number: 11 },
    { key: 'DES', name: 'Desember', number: 12 },
    { key: 'JAN', name: 'Januari', number: 1 },
    { key: 'FEB', name: 'Februari', number: 2 },
    { key: 'MAR', name: 'Maret', number: 3 },
    { key: 'APR', name: 'April', number: 4 },
    { key: 'MEI', name: 'Mei', number: 5 },
    { key: 'JUN', name: 'Juni', number: 6 }
  ];

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
  const fetchPresensiData = useCallback(async (kelasId: string, tahun: string, bulan?: string, tanggalAwal?: string, tanggalAkhir?: string) => {
    if (!kelasId || !tahun) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        kelas_id: kelasId,
        tahun: tahun
      });

      if (bulan) {
        params.append('bulan', bulan);
      }

      if (tanggalAwal && tanggalAkhir) {
        params.append('tanggal_awal', tanggalAwal);
        params.append('tanggal_akhir', tanggalAkhir);
      }

      const response = await fetch(`http://localhost:3001/api/admin/rekap-ketidakhadiran?${params}`, {
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
    if (selectedKelas && selectedTahun) {
      if (viewMode === 'bulanan' && selectedBulan) {
        fetchPresensiData(selectedKelas, selectedTahun, selectedBulan);
      } else if (viewMode === 'tanggal' && selectedTanggalAwal && selectedTanggalAkhir) {
        fetchPresensiData(selectedKelas, selectedTahun, undefined, selectedTanggalAwal, selectedTanggalAkhir);
      } else if (viewMode === 'tahunan') {
        fetchPresensiData(selectedKelas, selectedTahun);
      }
    }
  }, [selectedKelas, selectedTahun, selectedBulan, selectedTanggalAwal, selectedTanggalAkhir, viewMode, fetchPresensiData]);

  // Get presensi data for specific student and month
  const getPresensiForStudent = (siswaId: number, monthNumber: number) => {
    return presensiData.find(p => p.siswa_id === siswaId && p.bulan === monthNumber);
  };

  // Get presensi data for specific student in date range
  const getPresensiForStudentByDate = (siswaId: number) => {
    return presensiData.find(p => p.siswa_id === siswaId);
  };

  // Get total ketidakhadiran for student
  const getTotalKetidakhadiran = (siswaId: number) => {
    const studentData = presensiData.filter(p => p.siswa_id === siswaId);
    return studentData.reduce((total, data) => total + data.total_ketidakhadiran, 0);
  };

  // Get total persentase ketidakhadiran for student
  const getTotalPersentaseKetidakhadiran = (siswaId: number) => {
    const studentData = presensiData.filter(p => p.siswa_id === siswaId);
    if (studentData.length === 0) return 0;
    const totalKetidakhadiran = getTotalKetidakhadiran(siswaId);
    const totalHariEfektif = studentData.reduce((total, data) => total + data.total_hari_efektif, 0);
    return totalHariEfektif > 0 ? (totalKetidakhadiran / totalHariEfektif) * 100 : 0;
  };

  // Get total persentase kehadiran for student
  const getTotalPersentaseKehadiran = (siswaId: number) => {
    return 100 - getTotalPersentaseKetidakhadiran(siswaId);
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (!selectedKelas || !selectedTahun) {
      toast({
        title: "Error",
        description: "Pilih kelas dan tahun terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        kelas_id: selectedKelas,
        tahun: selectedTahun,
      });
      
      if (viewMode === 'bulanan' && selectedBulan) {
        params.append('bulan', selectedBulan);
      }
      
      if (viewMode === 'tanggal' && selectedTanggalAwal && selectedTanggalAkhir) {
        params.append('tanggal_awal', selectedTanggalAwal);
        params.append('tanggal_akhir', selectedTanggalAkhir);
      }

      const response = await fetch(`/api/export/rekap-ketidakhadiran-siswa?${params}`, {
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
      let fileName = `Rekap_Ketidakhadiran_Siswa_${kelasName}_${selectedTahun}`;
      
      if (viewMode === 'bulanan' && selectedBulan) {
        fileName += `_${selectedBulan}`;
      } else if (viewMode === 'tanggal' && selectedTanggalAwal && selectedTanggalAkhir) {
        fileName += `_${selectedTanggalAwal}_${selectedTanggalAkhir}`;
      }
      
      fileName += '.xlsx';
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Data berhasil diekspor ke Excel",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Gagal mengekspor data ke Excel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get hari efektif for month
  const getHariEfektif = (monthNumber: number) => {
    // Ini bisa disesuaikan dengan kalender akademik
    const hariEfektifPerBulan = {
      7: 14, 8: 21, 9: 22, 10: 23, 11: 20, 12: 17,
      1: 15, 2: 20, 3: 22, 4: 22, 5: 21, 6: 20
    };
    return hariEfektifPerBulan[monthNumber] || 20;
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
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rekap Ketidakhadiran Siswa</h1>
              <p className="text-gray-600">Format rekap ketidakhadiran sesuai standar SMKN 13</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportExcel}
            disabled={loading || !selectedKelas || !selectedTahun}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Exporting...' : 'Export Excel'}
          </Button>
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
          <div className={`grid grid-cols-1 gap-4 ${viewMode === 'tanggal' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
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
              <Label htmlFor="tahun">Tahun Pelajaran</Label>
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

            <div className="space-y-2">
              <Label htmlFor="viewMode">Mode Tampilan</Label>
              <Select value={viewMode} onValueChange={(value: 'tahunan' | 'bulanan' | 'tanggal') => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tahunan">Tahunan (Juli-Juni)</SelectItem>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="tanggal">Berdasarkan Tanggal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {viewMode === 'bulanan' && (
              <div className="space-y-2">
                <Label htmlFor="bulan">Bulan</Label>
                <Select value={selectedBulan} onValueChange={setSelectedBulan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.number} value={month.number.toString()}>
                        {month.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {viewMode === 'tanggal' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tanggalAwal">Tanggal Awal</Label>
                  <Input
                    id="tanggalAwal"
                    type="date"
                    value={selectedTanggalAwal}
                    onChange={(e) => setSelectedTanggalAwal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggalAkhir">Tanggal Akhir</Label>
                  <Input
                    id="tanggalAkhir"
                    type="date"
                    value={selectedTanggalAkhir}
                    onChange={(e) => setSelectedTanggalAkhir(e.target.value)}
                  />
                </div>
              </>
            )}
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

      {/* Rekap Table */}
      {selectedKelas && selectedTahun && students.length > 0 && (viewMode === 'tahunan' || (viewMode === 'bulanan' && selectedBulan) || (viewMode === 'tanggal' && selectedTanggalAwal && selectedTanggalAkhir)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Rekap Ketidakhadiran - {classes.find(c => c.id.toString() === selectedKelas)?.nama_kelas}</span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {/* Export function */}}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
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
                  REKAP KETIDAKHADIRAN SISWA
                </div>
                <div className="text-sm">
                  TAHUN PELAJARAN {selectedTahun}/{parseInt(selectedTahun) + 1}
                </div>
                <div className="text-sm font-bold">
                  KELAS {classes.find(c => c.id.toString() === selectedKelas)?.nama_kelas}
                </div>
                {viewMode === 'bulanan' && selectedBulan && (
                  <div className="text-sm">
                    BULAN {months.find(m => m.number.toString() === selectedBulan)?.name.toUpperCase()}
                  </div>
                )}
                {viewMode === 'tanggal' && selectedTanggalAwal && selectedTanggalAkhir && (
                  <div className="text-sm">
                    PERIODE {new Date(selectedTanggalAwal).toLocaleDateString('id-ID')} - {new Date(selectedTanggalAkhir).toLocaleDateString('id-ID')}
                  </div>
                )}
              </div>

              {/* Rekap Table */}
              <div className="border-2 border-gray-400">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-400">
                      <th className="border border-gray-300 p-2 text-center w-12">NO.</th>
                      <th className="border border-gray-300 p-2 text-center w-48">NAMA SISWA</th>
                      {viewMode === 'tahunan' ? (
                        <>
                          {months.map((month) => (
                            <th key={month.key} className="border border-gray-300 p-2 text-center bg-blue-100">
                              {month.key}
                            </th>
                          ))}
                        </>
                      ) : viewMode === 'bulanan' ? (
                        <th className="border border-gray-300 p-2 text-center bg-blue-100">
                          {months.find(m => m.number.toString() === selectedBulan)?.key}
                        </th>
                      ) : (
                        <th className="border border-gray-300 p-2 text-center bg-blue-100">
                          PERIODE TANGGAL
                        </th>
                      )}
                      <th className="border border-gray-300 p-2 text-center bg-green-100 w-24">JUMLAH KETIDAKHADIRAN</th>
                      <th className="border border-gray-300 p-2 text-center bg-green-100 w-32">PERSENTASE KETIDAKHADIRAN (%)</th>
                      <th className="border border-gray-300 p-2 text-center bg-green-100 w-32">PERSENTASE KEHADIRAN (%)</th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-300">
                      <th className="border border-gray-300 p-1"></th>
                      <th className="border border-gray-300 p-1"></th>
                      {viewMode === 'tahunan' ? (
                        <>
                          {months.map((month) => (
                            <th key={month.key} className="border border-gray-300 p-1 text-center bg-blue-50">
                              {getHariEfektif(month.number)}
                            </th>
                          ))}
                        </>
                      ) : viewMode === 'bulanan' ? (
                        <th className="border border-gray-300 p-1 text-center bg-blue-50">
                          {getHariEfektif(parseInt(selectedBulan))}
                        </th>
                      ) : (
                        <th className="border border-gray-300 p-1 text-center bg-blue-50">
                          {(() => {
                            if (selectedTanggalAwal && selectedTanggalAkhir) {
                              const start = new Date(selectedTanggalAwal);
                              const end = new Date(selectedTanggalAkhir);
                              const diffTime = Math.abs(end.getTime() - start.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                              return diffDays;
                            }
                            return 0;
                          })()}
                        </th>
                      )}
                      <th className="border border-gray-300 p-1 bg-green-50"></th>
                      <th className="border border-gray-300 p-1 bg-green-50"></th>
                      <th className="border border-gray-300 p-1 bg-green-50"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((siswa, index) => (
                      <tr key={siswa.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 p-2">{siswa.nama}</td>
                        {viewMode === 'tahunan' ? (
                          <>
                            {months.map((month) => {
                              const presensi = getPresensiForStudent(siswa.id, month.number);
                              return (
                                <td key={month.key} className="border border-gray-300 p-2 text-center bg-blue-50">
                                  {presensi ? presensi.total_ketidakhadiran : 0}
                                </td>
                              );
                            })}
                          </>
                        ) : viewMode === 'bulanan' ? (
                          <td className="border border-gray-300 p-2 text-center bg-blue-50">
                            {getPresensiForStudent(siswa.id, parseInt(selectedBulan))?.total_ketidakhadiran || 0}
                          </td>
                        ) : (
                          <td className="border border-gray-300 p-2 text-center bg-blue-50">
                            {getPresensiForStudentByDate(siswa.id)?.total_ketidakhadiran || 0}
                          </td>
                        )}
                        <td className="border border-gray-300 p-2 text-center bg-green-50 font-semibold">
                          {viewMode === 'tahunan' ? getTotalKetidakhadiran(siswa.id) : 
                           viewMode === 'bulanan' ? getPresensiForStudent(siswa.id, parseInt(selectedBulan))?.total_ketidakhadiran || 0 :
                           getPresensiForStudentByDate(siswa.id)?.total_ketidakhadiran || 0}
                        </td>
                        <td className="border border-gray-300 p-2 text-center bg-green-50 font-semibold">
                          {viewMode === 'tahunan' ? getTotalPersentaseKetidakhadiran(siswa.id).toFixed(2) : 
                           viewMode === 'bulanan' ? (parseFloat(getPresensiForStudent(siswa.id, parseInt(selectedBulan))?.persentase_ketidakhadiran || '0')).toFixed(2) :
                           (parseFloat(getPresensiForStudentByDate(siswa.id)?.persentase_ketidakhadiran || '0')).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2 text-center bg-green-50 font-semibold">
                          {viewMode === 'tahunan' ? getTotalPersentaseKehadiran(siswa.id).toFixed(2) : 
                           viewMode === 'bulanan' ? (parseFloat(getPresensiForStudent(siswa.id, parseInt(selectedBulan))?.persentase_kehadiran || '0')).toFixed(2) :
                           (parseFloat(getPresensiForStudentByDate(siswa.id)?.persentase_kehadiran || '0')).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="mt-4 text-sm">
                <div className="font-bold">KETERANGAN:</div>
                <div>S: Sakit | A: Alpa | I: Izin</div>
                <div className="mt-2">
                  <div className="font-bold">JUMLAH HARI EFEKTIF KERJA:</div>
                  {viewMode === 'tahunan' ? (
                    <div>Total dalam setahun: {months.reduce((total, month) => total + getHariEfektif(month.number), 0)} hari</div>
                  ) : viewMode === 'bulanan' ? (
                    <div>Bulan {months.find(m => m.number.toString() === selectedBulan)?.name}: {getHariEfektif(parseInt(selectedBulan))} hari</div>
                  ) : (
                    <div>Periode {selectedTanggalAwal} - {selectedTanggalAkhir}: {(() => {
                      if (selectedTanggalAwal && selectedTanggalAkhir) {
                        const start = new Date(selectedTanggalAwal);
                        const end = new Date(selectedTanggalAkhir);
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        return diffDays;
                      }
                      return 0;
                    })()} hari</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && (!selectedKelas || !selectedTahun) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Filter</h3>
            <p className="text-gray-500 text-center">Pilih kelas dan tahun untuk melihat rekap ketidakhadiran</p>
          </CardContent>
        </Card>
      )}

      {!loading && selectedKelas && selectedTahun && students.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada siswa</h3>
            <p className="text-gray-500 text-center">Tidak ada siswa ditemukan untuk kelas yang dipilih</p>
          </CardContent>
        </Card>
      )}

      {!loading && selectedKelas && selectedTahun && students.length > 0 && presensiData.length === 0 && (
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

export default RekapKetidakhadiranView;
