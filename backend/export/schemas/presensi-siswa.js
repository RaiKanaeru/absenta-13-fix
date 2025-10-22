// Schema untuk laporan Presensi Siswa
export default {
  title: 'PRESENSI SISWA',
  subtitle: 'Format Presensi Siswa SMKN 13 Jakarta',
  columns: [
    { key: 'no', label: 'No', width: 5, align: 'center' },
    { key: 'nis', label: 'NIS', width: 15, align: 'center' },
    { key: 'nama', label: 'Nama Siswa', width: 30, align: 'left' },
    { key: 'kelas', label: 'Kelas', width: 12, align: 'center' },
    { key: 'tanggal', label: 'Tanggal', width: 15, align: 'center', format: 'date' },
    { key: 'jam_ke', label: 'Jam Ke', width: 8, align: 'center' },
    { key: 'mata_pelajaran', label: 'Mata Pelajaran', width: 25, align: 'left' },
    { key: 'status', label: 'Status', width: 12, align: 'center' },
    { key: 'keterangan', label: 'Keterangan', width: 30, align: 'left' }
  ]
};




