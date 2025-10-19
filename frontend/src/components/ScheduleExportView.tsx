import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/utils/api';

interface ScheduleData {
  id_jadwal: number;
  kelas_id: number;
  mapel_id: number;
  guru_id: number;
  ruang_id: number;
  hari: string;
  jam_ke: number;
  jam_mulai: string;
  jam_selesai: string;
  nama_kelas: string;
  tingkat: string;
  nama_mapel: string;
  kode_mapel: string;
  nama_guru: string;
  nip: string;
  nama_ruang: string;
  kode_ruang: string;
}

interface ExportData {
  headers: string[];
  timeSlots: string[];
  classes: Array<{
    kelas: string;
    tingkat: string;
    hari: string;
    schedules: ScheduleData[];
  }>;
  metadata: {
    totalSchedules: number;
    totalClasses: number;
    exportDate: string;
    format: string;
  };
}

interface ConflictData {
  jadwal1_id: number;
  kelas1_id: number;
  guru1_id: number;
  hari1: string;
  jam_mulai1: string;
  jam_selesai1: string;
  jadwal2_id: number;
  kelas2_id: number;
  guru2_id: number;
  hari2: string;
  jam_mulai2: string;
  jam_selesai2: string;
  kelas1_nama: string;
  kelas2_nama: string;
  guru1_nama: string;
  guru2_nama: string;
  mapel1_nama: string;
  mapel2_nama: string;
}

const ScheduleExportView: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await api.get('/api/admin/kelas');
        if (response.success) {
          setClasses(response.data || []);
        }
      } catch (err) {
        console.error('Error loading classes:', err);
      }
    };
    loadClasses();
  }, []);

  // Check for conflicts
  const checkConflicts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/jadwal/conflicts');
      if (response.success) {
        setConflicts(response.data || []);
      }
    } catch (err) {
      console.error('Error checking conflicts:', err);
      setError('Gagal memeriksa konflik jadwal');
    } finally {
      setLoading(false);
    }
  };

  // Export schedule
  const exportSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/admin/jadwal/export?kelas_id=${selectedClass}&format=excel`);
      if (response.success) {
        setExportData(response.data);
        generateExcelFile(response.data);
      } else {
        setError('Gagal mengekspor jadwal');
      }
    } catch (err) {
      console.error('Error exporting schedule:', err);
      setError('Gagal mengekspor jadwal');
    } finally {
      setLoading(false);
    }
  };

  // Generate Excel file
  const generateExcelFile = (data: ExportData) => {
    // Create a simple HTML table that can be opened in Excel
    let html = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Jadwal Pelajaran - ${new Date().toLocaleDateString('id-ID')}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 10px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 2px; text-align: center; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .kelas-row { background-color: #e6f3ff; font-weight: bold; }
            .mapel-row { background-color: #fff2e6; }
            .ruang-row { background-color: #f0f8f0; }
            .guru-row { background-color: #f8f0ff; }
            .break { background-color: #ffebee; }
            .upacara { background-color: #fff3e0; }
          </style>
        </head>
        <body>
          <h2 style="text-align: center;">JADWAL PELAJARAN SMK NEGERI 13 BANDUNG</h2>
          <h3 style="text-align: center;">TAHUN AJARAN 2024/2025</h3>
          <br>
    `;

    // Group classes by name
    const classGroups: { [key: string]: ScheduleData[] } = {};
    data.classes.forEach(classData => {
      classData.schedules.forEach(schedule => {
        if (!classGroups[schedule.nama_kelas]) {
          classGroups[schedule.nama_kelas] = [];
        }
        classGroups[schedule.nama_kelas].push(schedule);
      });
    });

    // Create table
    html += '<table>';
    
    // Header row
    html += '<tr>';
    html += '<th>No</th>';
    html += '<th>KELAS</th>';
    html += '<th>JAM KE</th>';
    html += '<th>WAKTU</th>';
    
    // Day headers
    const days = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
    days.forEach(day => {
      for (let i = 1; i <= 12; i++) {
        html += `<th>${day} ${i}</th>`;
      }
    });
    html += '</tr>';

    // Time slots
    const timeSlots = [
      '06.30 - 07.15', '07.15 - 08.00', '08.00 - 08.45', '08.45 - 09.30', '09.30 - 10.15', '10.15 - 10.30',
      '10.30 - 11.15', '11.15 - 12.00', '12.00 - 12.45', '12.45 - 13.30', '13.30 - 14.15', '14.15 - 15.00'
    ];

    // For each class
    Object.keys(classGroups).forEach((className, classIndex) => {
      const classSchedules = classGroups[className];
      
      // Group by day
      const dayGroups: { [key: string]: ScheduleData[] } = {};
      classSchedules.forEach(schedule => {
        if (!dayGroups[schedule.hari]) {
          dayGroups[schedule.hari] = [];
        }
        dayGroups[schedule.hari].push(schedule);
      });

      // Create rows for this class
      for (let timeIndex = 0; timeIndex < timeSlots.length; timeIndex++) {
        html += '<tr>';
        
        if (timeIndex === 0) {
          html += `<td rowspan="12" class="kelas-row">${classIndex + 1}</td>`;
          html += `<td rowspan="12" class="kelas-row">${className}</td>`;
        }
        
        html += `<td>${timeIndex + 1}</td>`;
        html += `<td>${timeSlots[timeIndex]}</td>`;

        // For each day
        days.forEach(day => {
          const daySchedules = dayGroups[day] || [];
          const schedule = daySchedules.find(s => s.jam_ke === timeIndex + 1);
          
          if (schedule) {
            // Special handling for breaks and upacara
            if (schedule.nama_mapel.includes('ISTIRAHAT') || schedule.nama_mapel.includes('DZUHUR')) {
              html += `<td class="break" colspan="1">${schedule.nama_mapel}</td>`;
            } else if (schedule.nama_mapel.includes('UPACARA')) {
              html += `<td class="upacara" colspan="1">${schedule.nama_mapel}</td>`;
            } else {
              html += `<td class="mapel-row">${schedule.nama_mapel}</td>`;
            }
          } else {
            html += '<td></td>';
          }
        });
        
        html += '</tr>';
      }
    });

    html += '</table>';
    html += '</body></html>';

    // Create and download file
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Jadwal_Pelajaran_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Jadwal Pelajaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Pilih Kelas</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes && Array.isArray(classes) ? classes.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id.toString()}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                onClick={checkConflicts} 
                variant="outline" 
                disabled={loading}
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Cek Konflik
              </Button>
              
              <Button 
                onClick={exportSchedule} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {conflicts.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ditemukan {conflicts.length} konflik jadwal. 
                <Button variant="link" className="p-0 h-auto" onClick={() => setConflicts([])}>
                  Tutup
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {exportData && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Jadwal berhasil diekspor! Total {exportData.metadata.totalSchedules} jadwal untuk {exportData.metadata.totalClasses} kelas.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Conflicts Details */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Detail Konflik Jadwal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.map((conflict, index) => (
                <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="font-medium text-red-800">
                    Konflik #{index + 1}: {conflict.guru1_nama}
                  </div>
                  <div className="text-sm text-red-600">
                    <div>Kelas: {conflict.kelas1_nama} vs {conflict.kelas2_nama}</div>
                    <div>Hari: {conflict.hari1}</div>
                    <div>Waktu: {conflict.jam_mulai1} - {conflict.jam_selesai1}</div>
                    <div>Mata Pelajaran: {conflict.mapel1_nama} vs {conflict.mapel2_nama}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleExportView;
