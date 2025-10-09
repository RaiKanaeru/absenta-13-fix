const studentSummarySchema = {
    title: 'RINGKASAN KEHADIRAN SISWA',
    subtitle: 'Laporan Kehadiran Harian Siswa',
    columns: [
        { key: 'no', label: 'No', width: 60, align: 'center' },
        { key: 'nama', label: 'Nama Siswa', width: 200, align: 'left' },
        { key: 'nis', label: 'NIS', width: 120, align: 'left' },
        { key: 'kelas', label: 'Kelas', width: 100, align: 'center' },
        { key: 'hadir', label: 'H', width: 80, align: 'center', format: 'number' },
        { key: 'izin', label: 'I', width: 80, align: 'center', format: 'number' },
        { key: 'sakit', label: 'S', width: 80, align: 'center', format: 'number' },
        { key: 'alpa', label: 'A', width: 80, align: 'center', format: 'number' },
        { key: 'dispen', label: 'D', width: 80, align: 'center', format: 'number' },
        { key: 'presentase', label: 'Presentase', width: 100, align: 'center', format: 'percentage' }
    ]
};

export default studentSummarySchema;
