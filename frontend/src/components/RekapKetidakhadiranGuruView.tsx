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

interface RekapGuru {
  id: number;
  nama_guru: string;
  nip: string;
  bulan?: number;
  tahun?: number;
  total_ketidakhadiran: number;
  total_kehadiran: number;
  total_hari_efektif: number;
  persentase_ketidakhadiran: string | number;
  persentase_kehadiran: string | number;
  detail_ketidakhadiran?: {
    tanggal: string;
    status: 'S' | 'A' | 'I';
    keterangan?: string;
  }[];
}

interface RekapKetidakhadiranGuruViewProps {
  onBack: () => void;
  onLogout: () => void;
}

const RekapKetidakhadiranGuruView: React.FC<RekapKetidakhadiranGuruViewProps> = ({
  onBack,
  onLogout
}) => {
  const [selectedTahun, setSelectedTahun] = useState<string>(new Date().getFullYear().toString());
  const [selectedBulan, setSelectedBulan] = useState<string>('');
  const [selectedTanggalAwal, setSelectedTanggalAwal] = useState<string>('');
  const [selectedTanggalAkhir, setSelectedTanggalAkhir] = useState<string>('');
  const [viewMode, setViewMode] = useState<'tahunan' | 'bulanan' | 'tanggal'>('tahunan');
  const [rekapData, setRekapData] = useState<RekapGuru[]>([]);
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

  // Fetch rekap data
  const fetchRekapData = useCallback(async (tahun: string, bulan?: string, tanggalAwal?: string, tanggalAkhir?: string) => {
    if (!tahun) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        tahun: tahun
      });

      if (bulan) {
        params.append('bulan', bulan);
      }

      if (tanggalAwal && tanggalAkhir) {
        params.append('tanggal_awal', tanggalAwal);
        params.append('tanggal_akhir', tanggalAkhir);
      }

      const response = await fetch(`http://localhost:3001/api/admin/rekap-ketidakhadiran-guru?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRekapData(data);
      } else if (response.status === 401) {
        toast({
          title: "Error",
          description: "Sesi Anda telah berakhir. Silakan login ulang.",
          variant: "destructive"
        });
        setTimeout(() => onLogout(), 2000);
      }
    } catch (error) {
      console.error('Error fetching rekap data:', error);
      setError('Gagal memuat data rekap');
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  const handleExportExcel = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/export/rekap-ketidakhadiran-guru?tahun=${selectedTahun}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rekap_Ketidakhadiran_Guru_${selectedTahun}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "File Excel berhasil diunduh"
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Gagal mengunduh file Excel",
        variant: "destructive"
      });
    }
  };

  const handleExportSMKN13 = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/export/rekap-ketidakhadiran-guru-smkn13?tahun=${selectedTahun}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `REKAP_KETIDAKHADIRAN_GURU_SMKN13_${selectedTahun}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "File Excel SMKN 13 berhasil diunduh"
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Gagal mengunduh file Excel SMKN 13",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (selectedTahun) {
      if (viewMode === 'bulanan' && selectedBulan) {
        fetchRekapData(selectedTahun, selectedBulan);
      } else if (viewMode === 'tanggal' && selectedTanggalAwal && selectedTanggalAkhir) {
        fetchRekapData(selectedTahun, undefined, selectedTanggalAwal, selectedTanggalAkhir);
      } else if (viewMode === 'tahunan') {
        fetchRekapData(selectedTahun);
      }
    }
  }, [selectedTahun, selectedBulan, selectedTanggalAwal, selectedTanggalAkhir, viewMode, fetchRekapData]);

  // Get rekap data for specific teacher and month
  const getRekapForTeacher = (guruId: number, monthNumber: number) => {
    return rekapData.find(p => p.id === guruId && p.bulan === monthNumber);
  };

  // Get rekap data for specific teacher in date range
  const getRekapForTeacherByDate = (guruId: number) => {
    return rekapData.find(p => p.id === guruId);
  };

  // Get total ketidakhadiran for teacher
  const getTotalKetidakhadiran = (guruId: number) => {
    const teacherData = rekapData.filter(p => p.id === guruId);
    return teacherData.reduce((total, data) => total + data.total_ketidakhadiran, 0);
  };

  // Get total persentase ketidakhadiran for teacher
  const getTotalPersentaseKetidakhadiran = (guruId: number) => {
    const teacherData = rekapData.filter(p => p.id === guruId);
    if (teacherData.length === 0) return 0;
    const totalKetidakhadiran = getTotalKetidakhadiran(guruId);
    const totalHariEfektif = teacherData.reduce((total, data) => total + data.total_hari_efektif, 0);
    return totalHariEfektif > 0 ? (totalKetidakhadiran / totalHariEfektif) * 100 : 0;
  };

  // Get total persentase kehadiran for teacher
  const getTotalPersentaseKehadiran = (guruId: number) => {
    return 100 - getTotalPersentaseKetidakhadiran(guruId);
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
              <h1 className="text-2xl font-bold text-gray-900">Rekap Ketidakhadiran Guru</h1>
              <p className="text-gray-600">Format rekap ketidakhadiran sesuai standar SMKN 13</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportExcel}
            disabled={loading || !selectedTahun}
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
      {selectedTahun && (viewMode === 'tahunan' || (viewMode === 'bulanan' && selectedBulan) || (viewMode === 'tanggal' && selectedTanggalAwal && selectedTanggalAkhir)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Rekap Ketidakhadiran Guru</span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExportExcel}
                  disabled={loading || !selectedTahun}
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
                  REKAP KETIDAKHADIRAN GURU
                </div>
                <div className="text-sm">
                  TAHUN PELAJARAN {selectedTahun}/{parseInt(selectedTahun) + 1}
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
                      <th className="border border-gray-300 p-2 text-center w-48">NAMA GURU</th>
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
                    {rekapData.map((guru, index) => (
                      <tr key={guru.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 p-2">{guru.nama_guru}</td>
                        {viewMode === 'tahunan' ? (
                          <>
                            {months.map((month) => {
                              const rekap = getRekapForTeacher(guru.id, month.number);
                              return (
                                <td key={month.key} className="border border-gray-300 p-2 text-center bg-blue-50">
                                  {rekap ? rekap.total_ketidakhadiran : 0}
                                </td>
                              );
                            })}
                          </>
                        ) : viewMode === 'bulanan' ? (
                          <td className="border border-gray-300 p-2 text-center bg-blue-50">
                            {getRekapForTeacher(guru.id, parseInt(selectedBulan))?.total_ketidakhadiran || 0}
                          </td>
                        ) : (
                          <td className="border border-gray-300 p-2 text-center bg-blue-50">
                            {getRekapForTeacherByDate(guru.id)?.total_ketidakhadiran || 0}
                          </td>
                        )}
                        <td className="border border-gray-300 p-2 text-center bg-green-50 font-semibold">
                          {viewMode === 'tahunan' ? getTotalKetidakhadiran(guru.id) : 
                           viewMode === 'bulanan' ? getRekapForTeacher(guru.id, parseInt(selectedBulan))?.total_ketidakhadiran || 0 :
                           getRekapForTeacherByDate(guru.id)?.total_ketidakhadiran || 0}
                        </td>
                        <td className="border border-gray-300 p-2 text-center bg-green-50 font-semibold">
                          {viewMode === 'tahunan' ? getTotalPersentaseKetidakhadiran(guru.id).toFixed(2) : 
                           viewMode === 'bulanan' ? (parseFloat(getRekapForTeacher(guru.id, parseInt(selectedBulan))?.persentase_ketidakhadiran || '0')).toFixed(2) :
                           (parseFloat(getRekapForTeacherByDate(guru.id)?.persentase_ketidakhadiran || '0')).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-2 text-center bg-green-50 font-semibold">
                          {viewMode === 'tahunan' ? getTotalPersentaseKehadiran(guru.id).toFixed(2) : 
                           viewMode === 'bulanan' ? (parseFloat(getRekapForTeacher(guru.id, parseInt(selectedBulan))?.persentase_kehadiran || '0')).toFixed(2) :
                           (parseFloat(getRekapForTeacherByDate(guru.id)?.persentase_kehadiran || '0')).toFixed(2)}
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
      {!loading && !selectedTahun && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Filter</h3>
            <p className="text-gray-500 text-center">Pilih tahun untuk melihat rekap ketidakhadiran guru</p>
          </CardContent>
        </Card>
      )}

      {!loading && selectedTahun && rekapData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data rekap</h3>
            <p className="text-gray-500 text-center">Tidak ada data rekap ketidakhadiran guru untuk periode yang dipilih. Pastikan ada data absensi guru untuk periode yang dipilih.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RekapKetidakhadiranGuruView;
