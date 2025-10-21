// Schema untuk laporan Rekap Ketidakhadiran Siswa
export default {
  title: 'REKAP KETIDAKHADIRAN SISWA',
  subtitle: 'Rekap Ketidakhadiran Tahunan/Bulanan',
  columns: [
    { key: 'no', label: 'No', width: 5, align: 'center' },
    { key: 'nama', label: 'Nama Siswa', width: 25, align: 'left' },
    { key: 'nis', label: 'NIS', width: 15, align: 'center' },
    { key: 'kelas', label: 'Kelas', width: 12, align: 'center' },
    { key: 'periode', label: 'Periode', width: 15, align: 'center' },
    { key: 'izin', label: 'Izin', width: 8, align: 'center', format: 'number' },
    { key: 'sakit', label: 'Sakit', width: 8, align: 'center', format: 'number' },
    { key: 'alpa', label: 'Alpa', width: 8, align: 'center', format: 'number' },
    { key: 'dispen', label: 'Dispen', width: 8, align: 'center', format: 'number' },
    { key: 'total_tidak_hadir', label: 'Total', width: 10, align: 'center', format: 'number' }
  ]
};


