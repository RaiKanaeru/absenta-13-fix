# Panduan Filter Laporan Kehadiran Siswa - Guru

## Fitur Baru
Sistem laporan kehadiran siswa untuk guru telah diperbarui dengan fitur filter tanggal/bulan dan sinkronisasi preview-export.

## Cara Menggunakan

### 1. Akses Laporan
- Login sebagai guru
- Pilih menu "Laporan Kehadiran Siswa"

### 2. Filter Periode
Tersedia dua mode filter:

#### Mode Bulan (Default)
- Pilih "Bulan" pada toggle periode
- Pilih bulan dan tahun yang diinginkan
- Sistem otomatis menghitung rentang tanggal 1-31 bulan tersebut

#### Mode Rentang Tanggal
- Pilih "Rentang Tanggal" pada toggle periode
- Isi tanggal mulai dan tanggal selesai
- Maksimal rentang: 62 hari

### 3. Filter Kelas
- Pilih kelas dari dropdown
- Klik "Tampilkan" untuk memuat data

### 4. Preview dan Export
- Data ditampilkan dalam format Excel preview
- Kolom dinamis menampilkan tanggal pertemuan (1, 2, 3, dst.)
- Kolom ringkasan: H (Hadir), I (Izin), S (Sakit), A (Alpa), D (Dispen), % (Persentase)
- Klik "Download Excel" untuk export file dengan nama yang mencantumkan periode

## Validasi
- Rentang tanggal maksimal 62 hari
- Kelas wajib dipilih
- Periode wajib dipilih (bulan atau rentang)

## Sinkronisasi
- Preview UI dan file Excel menggunakan data yang sama
- Struktur kolom identik antara preview dan export
- Data diambil dari database dengan filter yang sama

## Perbaikan Terbaru
- **Tanggal Pertemuan Dinamis**: Kolom tanggal pertemuan sekarang menampilkan semua jadwal yang seharusnya ada dalam periode yang dipilih, bukan hanya yang sudah ada absensinya
- **Status Siswa Lengkap**: Siswa yang tidak hadir akan ditampilkan sebagai "A" (Alpa) di kolom tanggal pertemuan
- **Perhitungan Akurat**: Total pertemuan dihitung berdasarkan jadwal yang seharusnya ada, bukan hanya yang sudah ada absensinya

## Troubleshooting
- Jika tidak ada data: periksa apakah ada jadwal dalam periode yang dipilih
- Jika error "rentang maksimal 62 hari": pilih periode yang lebih pendek
- Jika preview kosong: pastikan kelas dan periode sudah dipilih dengan benar
- Jika kolom tanggal kosong: periksa apakah ada jadwal untuk guru dan kelas tersebut dalam periode yang dipilih
