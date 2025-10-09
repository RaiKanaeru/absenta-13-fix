// Schema untuk laporan Riwayat Izin
export default {
  title: 'Riwayat Pengajuan Izin',
  subtitle: 'Laporan Pengajuan Izin Siswa',
  columns: [
    { key: 'no', label: 'No', width: 5, align: 'center' },
    { key: 'tanggal_pengajuan', label: 'Tanggal Pengajuan', width: 15, align: 'center' },
    { key: 'tanggal_izin', label: 'Tanggal Izin', width: 15, align: 'center' },
    { key: 'nama_siswa', label: 'Nama Siswa', width: 25, align: 'left' },
    { key: 'nis', label: 'NIS', width: 12, align: 'center' },
    { key: 'kelas', label: 'Kelas', width: 12, align: 'center' },
    { key: 'jenis_izin', label: 'Jenis Izin', width: 15, align: 'center' },
    { key: 'alasan', label: 'Alasan', width: 30, align: 'left' },
    { key: 'status', label: 'Status', width: 12, align: 'center' },
    { key: 'keterangan_guru', label: 'Keterangan Guru', width: 25, align: 'left' },
    { key: 'tanggal_respon', label: 'Tanggal Respon', width: 18, align: 'center' },
    { key: 'diproses_oleh', label: 'Diproses Oleh', width: 20, align: 'left' }
  ]
};
