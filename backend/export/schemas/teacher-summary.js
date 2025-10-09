const teacherSummarySchema = {
    title: 'RINGKASAN KEHADIRAN GURU',
    subtitle: 'Laporan Kehadiran Harian Guru',
    columns: [
        { key: 'no', label: 'No', width: 60, align: 'center' },
        { key: 'nama', label: 'Nama Guru', width: 200, align: 'left' },
        { key: 'nip', label: 'NIP', width: 150, align: 'left' },
        { key: 'hadir', label: 'H', width: 80, align: 'center', format: 'number' },
        { key: 'izin', label: 'I', width: 80, align: 'center', format: 'number' },
        { key: 'sakit', label: 'S', width: 80, align: 'center', format: 'number' },
        { key: 'alpa', label: 'A', width: 80, align: 'center', format: 'number' },
        { key: 'presentase', label: 'Presentase', width: 100, align: 'center', format: 'percentage' }
    ]
};

export default teacherSummarySchema;
