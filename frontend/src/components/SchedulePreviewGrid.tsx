import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Download, Printer, Eye, Filter } from 'lucide-react';
import { apiCall } from '../utils/api';

interface ScheduleData {
  [className: string]: {
    [day: string]: {
      [jamKe: number]: {
        id: number | null;
        mapel: string;
        kode_mapel: string;
        guru: string;
        id_guru: number;
        ruang: string;
        kode_ruang: string;
        jam_mulai: string;
        jam_selesai: string;
        jam_ke: number;
      };
    };
  };
}

interface SchedulePreviewProps {
  onBack: () => void;
}

const SchedulePreviewGrid: React.FC<SchedulePreviewProps> = ({ onBack }) => {
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [metadata, setMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const [classes, setClasses] = useState<any[]>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'matrix'>('matrix');

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const timeSlots = [
    { jam_ke: 1, jam_mulai: '07:00', jam_selesai: '08:00' },
    { jam_ke: 2, jam_mulai: '08:00', jam_selesai: '09:00' },
    { jam_ke: 3, jam_mulai: '09:00', jam_selesai: '10:00' },
    { jam_ke: 4, jam_mulai: '10:00', jam_selesai: '11:00' },
    { jam_ke: 5, jam_mulai: '11:00', jam_selesai: '12:00' },
    { jam_ke: 6, jam_mulai: '12:00', jam_selesai: '13:00' },
    { jam_ke: 7, jam_mulai: '13:00', jam_selesai: '14:00' },
    { jam_ke: 8, jam_mulai: '14:00', jam_selesai: '15:00' },
    { jam_ke: 9, jam_mulai: '15:00', jam_selesai: '16:00' }
  ];

  // Fetch classes for filter
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await apiCall('/api/admin/kelas');
        setClasses(response);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, []);

  // Fetch schedule preview data
  const fetchSchedulePreview = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClass !== 'all') {
        params.append('kelas_id', selectedClass);
      }
      if (selectedWeek !== 'current') {
        params.append('minggu_ke', selectedWeek);
      }

      const response = await apiCall(`/api/admin/jadwal/preview?${params.toString()}`);
      setScheduleData(response.data);
      setMetadata(response.metadata);
      setShowGrid(true);
    } catch (error) {
      console.error('Error fetching schedule preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Export to Excel (Grid format)
  const exportToExcel = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedClass !== 'all') {
        params.append('kelas_id', selectedClass);
      }
      params.append('format', 'excel');

      const response = await fetch(`/api/admin/jadwal/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jadwal-grid-${selectedClass === 'all' ? 'semua-kelas' : `kelas-${selectedClass}`}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Export failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Export to Excel (Matrix format)
  const exportToMatrix = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedClass !== 'all') {
        params.append('kelas_id', selectedClass);
      }
      params.append('format', 'matrix');

      const response = await fetch(`/api/admin/jadwal/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jadwal-matrix-${selectedClass === 'all' ? 'semua-kelas' : `kelas-${selectedClass}`}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Export failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error exporting to Matrix:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateExcelFile = (data: any) => {
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
    const classGroups: { [key: string]: any[] } = {};
    data.classes.forEach((classData: any) => {
      classData.schedules.forEach((schedule: any) => {
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
      const dayGroups: { [key: string]: any[] } = {};
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
          const schedule = daySchedules.find((s: any) => s.jam_ke === timeIndex + 1);
          
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


  // Print schedule
  const printSchedule = () => {
    window.print();
  };

  const getFilteredClasses = () => {
    if (selectedClass === 'all') {
      return Object.keys(scheduleData);
    }
    return [selectedClass];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Preview Jadwal Pelajaran</h1>
          <p className="text-muted-foreground">Lihat dan export jadwal dalam format grid</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Kembali
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Jadwal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Kelas</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes && Array.isArray(classes) ? classes.map((kelas) => (
                    <SelectItem key={kelas.id_kelas} value={kelas.id_kelas.toString()}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Minggu</label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih minggu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Minggu Ini</SelectItem>
                  <SelectItem value="1">Minggu 1</SelectItem>
                  <SelectItem value="2">Minggu 2</SelectItem>
                  <SelectItem value="3">Minggu 3</SelectItem>
                  <SelectItem value="4">Minggu 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchSchedulePreview} disabled={isLoading} className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                {isLoading ? 'Loading...' : 'Preview Jadwal'}
              </Button>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="mt-4">
            <label className="text-sm font-medium mb-2 block">Mode Tampilan</label>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'matrix' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('matrix')}
              >
                Matrix 3-Baris/Kelas
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid Jam
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      {showGrid && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button onClick={exportToMatrix} variant="outline" disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel (Matrix)
              </Button>
              <Button onClick={exportToExcel} variant="outline" disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel (Grid)
              </Button>
              <Button onClick={printSchedule} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Grid */}
      {showGrid && (
        <div className="space-y-6">
          {viewMode === 'matrix' ? (
            // Matrix Mode: 3 rows per class
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Jadwal Matrix (3-Baris per Kelas)</span>
                  <Badge variant="secondary">
                    {metadata?.total_schedules || 0} jadwal
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-center font-semibold">KELAS</th>
                        {days.map((day) => 
                          timeSlots.map((slot) => (
                            <th key={`${day}-${slot.jam_ke}`} className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs">
                              {day}-{slot.jam_ke}
                            </th>
                          ))
                        )}
                      </tr>
                      <tr className="bg-gray-100">
                        <td className="border border-gray-300 px-4 py-1 text-center text-xs font-medium">----------</td>
                        {days.map((day) => 
                          timeSlots.map((slot) => (
                            <td key={`sep-${day}-${slot.jam_ke}`} className="border border-gray-300 px-2 py-1 text-center text-xs">
                              ----------
                            </td>
                          ))
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredClasses().map((className) => (
                        <React.Fragment key={className}>
                          {/* Row 1: Kode Guru */}
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-bold text-center" rowSpan={3}>
                              {className}
                            </td>
                            {days.map((day) => 
                              timeSlots.map((slot) => {
                                const schedule = scheduleData[className]?.[day]?.[slot.jam_ke];
                                return (
                                  <td key={`guru-${day}-${slot.jam_ke}`} className="border border-gray-300 px-2 py-2 text-center text-sm">
                                    {schedule && schedule.id ? `G${schedule.id_guru}` : '-'}
                                  </td>
                                );
                              })
                            )}
                          </tr>
                          {/* Row 2: Alias Mapel */}
                          <tr>
                            {days.map((day) => 
                              timeSlots.map((slot) => {
                                const schedule = scheduleData[className]?.[day]?.[slot.jam_ke];
                                return (
                                  <td key={`mapel-${day}-${slot.jam_ke}`} className="border border-gray-300 px-2 py-2 text-center text-sm">
                                    {schedule && schedule.id ? schedule.kode_mapel : '-'}
                                  </td>
                                );
                              })
                            )}
                          </tr>
                          {/* Row 3: Kode Ruang */}
                          <tr>
                            {days.map((day) => 
                              timeSlots.map((slot) => {
                                const schedule = scheduleData[className]?.[day]?.[slot.jam_ke];
                                return (
                                  <td key={`ruang-${day}-${slot.jam_ke}`} className="border border-gray-300 px-2 py-2 text-center text-sm">
                                    {schedule && schedule.id ? (schedule.kode_ruang || schedule.ruang || '-') : '-'}
                                  </td>
                                );
                              })
                            )}
                          </tr>
                          {/* Separator after each class */}
                          <tr>
                            <td className="border border-gray-300 px-4 py-1 text-center text-xs font-medium" colSpan={days.length * timeSlots.length + 1}>
                              ----------
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Grid Mode: Original time-based grid
            getFilteredClasses().map((className) => (
              <Card key={className}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Kelas: {className}</span>
                  <Badge variant="secondary">
                    {metadata?.total_schedules || 0} jadwal
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Jam</th>
                        {days.map((day) => (
                          <th key={day} className="border border-gray-300 px-4 py-2 text-center font-semibold">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((timeSlot) => (
                        <tr key={timeSlot.jam_ke}>
                          <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">
                            {timeSlot.jam_mulai}-{timeSlot.jam_selesai}
                          </td>
                          {days.map((day) => {
                            const schedule = scheduleData[className]?.[day]?.[timeSlot.jam_ke];
                            return (
                              <td key={day} className="border border-gray-300 px-4 py-2 min-h-[60px] align-top">
                                {schedule && schedule.id ? (
                                  <div className="text-center">
                                    <div className="font-semibold text-sm">{schedule.mapel}</div>
                                    <div className="text-xs text-gray-600 mt-1">{schedule.guru}</div>
                                    {schedule.ruang && (
                                      <div className="text-xs text-gray-500 mt-1">{schedule.ruang}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-sm">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      )}

      {/* Empty State */}
      {!showGrid && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Preview Jadwal</h3>
            <p className="text-gray-600 mb-4">
              Pilih filter dan klik "Preview Jadwal" untuk melihat jadwal dalam format grid
            </p>
            <Button onClick={fetchSchedulePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview Jadwal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SchedulePreviewGrid;
