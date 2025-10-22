import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Download, Filter, AlertTriangle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const HARI_OPTIONS = [
  { value: 'all', label: 'Semua Hari' },
  { value: 'Senin', label: 'Senin' },
  { value: 'Selasa', label: 'Selasa' },
  { value: 'Rabu', label: 'Rabu' },
  { value: 'Kamis', label: 'Kamis' },
  { value: 'Jumat', label: 'Jumat' },
  { value: 'Sabtu', label: 'Sabtu' }
];

interface Schedule {
  id: number;
  type: 'jadwal' | 'jadwal_khusus';
  hari: string;
  jam_ke?: number;
  jam_mulai: string;
  jam_selesai: string;
  kelas_id?: number;
  nama_kelas: string;
  mapel_id?: number;
  nama_mapel: string;
  guru_id?: number;
  nama_guru: string;
  guru_tambahan?: string;
  hasConflict: boolean;
  conflicts: any[];
}

interface Kelas {
  id_kelas: number;
  nama_kelas: string;
}

interface Guru {
  id_guru: number;
  nama: string;
}

const GlobalScheduleView: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    kelas_id: 'all',
    guru_id: 'all',
    hari: 'all'
  });
  const { toast } = useToast();
  
  // Fetch kelas and guru lists
  useEffect(() => {
    fetchKelasList();
    fetchGuruList();
  }, []);
  
  // Fetch schedules when filters change
  useEffect(() => {
    fetchSchedules();
  }, [filters]);
  
  const fetchKelasList = async () => {
    try {
      const response = await fetch('/api/admin/kelas', {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const result = await response.json();
      if (result.success) {
        setKelasList(result.data);
      }
    } catch (error) {
      console.error('Error fetching kelas list:', error);
    }
  };
  
  const fetchGuruList = async () => {
    try {
      const response = await fetch('/api/admin/guru', {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const result = await response.json();
      if (result.success) {
        setGuruList(result.data);
      }
    } catch (error) {
      console.error('Error fetching guru list:', error);
    }
  };
  
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`/api/admin/jadwal-global?${params}`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const result = await response.json();
      if (result.success) {
        setSchedules(result.data);
        console.log('📊 Loaded schedules:', result.summary);
      } else {
        throw new Error(result.error || 'Failed to fetch schedules');
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Gagal memuat jadwal', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Group schedules by hari and jam
  const groupedSchedules = React.useMemo(() => {
    const grouped: Record<string, Record<string, Schedule[]>> = {};
    
    ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].forEach(hari => {
      grouped[hari] = {};
    });
    
    schedules.forEach(schedule => {
      const hari = schedule.hari;
      const timeKey = `${schedule.jam_mulai}-${schedule.jam_selesai}`;
      
      if (!grouped[hari]) {
        grouped[hari] = {};
      }
      
      if (!grouped[hari][timeKey]) {
        grouped[hari][timeKey] = [];
      }
      
      grouped[hari][timeKey].push(schedule);
    });
    
    return grouped;
  }, [schedules]);
  
  // Get all unique time slots
  const timeSlots = React.useMemo(() => {
    const slots = new Set<string>();
    schedules.forEach(s => {
      slots.add(`${s.jam_mulai}-${s.jam_selesai}`);
    });
    return Array.from(slots).sort();
  }, [schedules]);
  
  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`/api/export/jadwal-global/excel?${params}`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jadwal-global-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ 
        title: 'Berhasil', 
        description: 'Jadwal berhasil diekspor ke Excel' 
      });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Gagal mengekspor jadwal', 
        variant: 'destructive' 
      });
    }
  };
  
  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`/api/export/jadwal-global/pdf?${params}`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jadwal-global-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ 
        title: 'Berhasil', 
        description: 'Jadwal berhasil diekspor ke PDF' 
      });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Gagal mengekspor jadwal', 
        variant: 'destructive' 
      });
    }
  };
  
  const handleExportSMKN13Excel = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.kelas_id !== 'all') params.append('kelas_id', filters.kelas_id);

      const response = await fetch(`/api/export/jadwal-smkn13/excel?${params.toString()}`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        throw new Error('Export SMKN 13 Excel failed');
      }

      const blob = await response.blob();
      const filename = `Jadwal_SMKN13_${new Date().toISOString().split('T')[0]}.xlsx`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: "Berhasil",
        description: "Jadwal SMKN 13 berhasil diekspor ke Excel",
      });
    } catch (err: any) {
      console.error("Error exporting SMKN 13 Excel:", err);
      toast({
        title: "Error",
        description: err.message || "Gagal mengekspor jadwal SMKN 13 ke Excel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Jadwal Global - Semua Kelas & Mata Pelajaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filter Kelas */}
            <div>
              <label className="text-sm font-medium mb-2 block">Kelas</label>
              <Select value={filters.kelas_id} onValueChange={(value) => setFilters({...filters, kelas_id: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasList.map(k => (
                    <SelectItem key={k.id_kelas} value={k.id_kelas.toString()}>{k.nama_kelas}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filter Guru */}
            <div>
              <label className="text-sm font-medium mb-2 block">Guru</label>
              <Select value={filters.guru_id} onValueChange={(value) => setFilters({...filters, guru_id: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Guru</SelectItem>
                  {guruList.map(g => (
                    <SelectItem key={g.id_guru} value={g.id_guru.toString()}>{g.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filter Hari */}
            <div>
              <label className="text-sm font-medium mb-2 block">Hari</label>
              <Select value={filters.hari} onValueChange={(value) => setFilters({...filters, hari: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HARI_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Export Buttons */}
            <div className="flex items-end gap-2">
              <Button onClick={handleExportExcel} variant="outline" size="sm" disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm" disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button onClick={handleExportSMKN13Excel} variant="default" size="sm" disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                Export SMKN 13
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Grid View */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Memuat jadwal...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 font-semibold text-sm">Jam</th>
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(hari => (
                      <th key={hari} className="border p-2 font-semibold text-sm">{hari}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        Tidak ada jadwal yang ditemukan
                      </td>
                    </tr>
                  ) : (
                    timeSlots.map(timeSlot => (
                      <tr key={timeSlot}>
                        <td className="border p-2 text-xs font-medium bg-gray-50 align-top">
                          {timeSlot.split('-').join('\n')}
                        </td>
                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(hari => {
                          const cellSchedules = groupedSchedules[hari]?.[timeSlot] || [];
                          const hasConflict = cellSchedules.some(s => s.hasConflict);
                          
                          return (
                            <td 
                              key={hari} 
                              className={`border p-2 text-xs align-top ${hasConflict ? 'bg-red-50' : ''}`}
                            >
                              {cellSchedules.map((schedule, idx) => (
                                <div 
                                  key={idx}
                                  className={`mb-2 p-2 rounded ${
                                    schedule.type === 'jadwal_khusus' 
                                      ? 'bg-purple-100 border-purple-300' 
                                      : 'bg-blue-100 border-blue-300'
                                  } border ${schedule.hasConflict ? 'ring-2 ring-red-500' : ''}`}
                                >
                                  <div className="font-semibold text-xs">{schedule.nama_mapel}</div>
                                  <div className="text-gray-600 text-xs">{schedule.nama_kelas}</div>
                                  <div className="text-gray-500 text-xs">{schedule.nama_guru}</div>
                                  {schedule.guru_tambahan && (
                                    <div className="text-gray-400 text-xs italic">+ {schedule.guru_tambahan}</div>
                                  )}
                                  {schedule.hasConflict && (
                                    <div className="flex items-center text-red-600 mt-1 text-xs">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Bentrok!
                                    </div>
                                  )}
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Jadwal Pelajaran</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
              <span>Jadwal Khusus (Istirahat/Upacara/Perwalian)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 ring-2 ring-red-500 rounded"></div>
              <span>Konflik/Bentrok</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalScheduleView;


