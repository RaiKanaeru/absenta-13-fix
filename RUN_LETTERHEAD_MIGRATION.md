# Cara Menjalankan Migration Letterhead System

## 📋 Prerequisites
- MySQL/MariaDB sudah running
- Database `absenta13` sudah ada
- Akses sebagai user `root` atau user dengan privilege CREATE TABLE, INSERT

## 🚀 Cara 1: Via MySQL Workbench (Recommended untuk Windows)

### Step 1: Buka MySQL Workbench
1. Jalankan **MySQL Workbench**
2. Connect ke database `absenta13`

### Step 2: Load Migration File
1. Klik **File** → **Open SQL Script**
2. Navigate ke folder project
3. Pilih file: `database/migrations/2025-10-22-ensure-system-config-table.sql`
4. Klik **Open**

### Step 3: Execute Migration
1. Klik **Execute** (icon lightning bolt) atau tekan `Ctrl+Shift+Enter`
2. Tunggu hingga selesai

### Step 4: Verify
Jika berhasil, akan muncul output:
```
+-----------------------------------------------------+
| System config table created and default letterhead |
| configs inserted                                    |
+-----------------------------------------------------+

Showing letterhead configurations:
config_key                      | config_status | description
--------------------------------|---------------|----------------------------------
letterhead_global               | Custom Config | Default letterhead configuration...
letterhead_teacher_summary      | Using Global  | Letterhead for teacher summary...
letterhead_student_summary      | Using Global  | Letterhead for student summary...
letterhead_presensi_siswa       | Using Global  | Letterhead for student attendance...
letterhead_rekap_ketidakhadiran | Using Global  | Letterhead for absence recap...
letterhead_rekap_guru           | Using Global  | Letterhead for teacher recap...
letterhead_banding_absen        | Using Global  | Letterhead for attendance appeal...
```

## 🚀 Cara 2: Via phpMyAdmin

### Step 1: Buka phpMyAdmin
1. Buka browser
2. Navigate ke `http://localhost/phpmyadmin`
3. Login dengan user `root`

### Step 2: Select Database
1. Pilih database **`absenta13`** di sidebar kiri

### Step 3: Import Migration
1. Klik tab **SQL** di atas
2. Klik **Choose File**
3. Pilih file: `database/migrations/2025-10-22-ensure-system-config-table.sql`
4. Klik **Go** di bawah

### Step 4: Verify
Scroll ke bawah untuk melihat hasil query. Seharusnya ada:
- Table `system_config` created
- 7 rows inserted (1 global + 6 report types)

## 🚀 Cara 3: Via Command Line (Jika MySQL di PATH)

### Windows PowerShell:
```powershell
# Cari lokasi mysql.exe (biasanya di C:\Program Files\MySQL\...)
# Ganti path sesuai instalasi MySQL Anda

& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p absenta13 < database\migrations\2025-10-22-ensure-system-config-table.sql
```

### Linux/Mac Terminal:
```bash
mysql -u root -p absenta13 < database/migrations/2025-10-22-ensure-system-config-table.sql
```

## ✅ Verification Checklist

Setelah migration, verify dengan query berikut:

### 1. Check Table Exists
```sql
SHOW TABLES LIKE 'system_config';
```
**Expected**: 1 row returned

### 2. Check Default Data
```sql
SELECT config_key, 
       CASE 
         WHEN config_value IS NULL THEN 'Using Global' 
         ELSE 'Custom Config' 
       END as status,
       description
FROM system_config 
WHERE config_key LIKE 'letterhead%'
ORDER BY config_key;
```
**Expected**: 7 rows returned

### 3. Check Global Letterhead Content
```sql
SELECT config_value 
FROM system_config 
WHERE config_key = 'letterhead_global';
```
**Expected**: JSON object dengan:
- `enabled: true`
- `logoPosition: "tengah"`
- `textLines: [array of 4 lines]`

## 🔍 Troubleshooting

### Error: Table 'system_config' already exists
**Solusi**: Ini normal! Migration menggunakan `CREATE TABLE IF NOT EXISTS`, jadi safe untuk run berkali-kali.

### Error: Duplicate entry for key 'config_key'
**Solusi**: Data sudah ada. Migration menggunakan `INSERT IGNORE`, jadi ini normal dan safe.

### Error: Access denied
**Solusi**: 
1. Pastikan user MySQL memiliki privilege CREATE, INSERT
2. Atau gunakan user `root`

### Letterhead tidak muncul di export
**Solusi**:
1. Re-run migration
2. Check data dengan query verification di atas
3. Restart backend server (`node server_modern.js`)

## 📋 Next Steps

Setelah migration berhasil:

1. ✅ **Login sebagai Admin**
2. ✅ **Buka halaman "Pengaturan Kop Laporan"**
3. ✅ **Upload logo sekolah**
4. ✅ **Konfigurasi text kop surat**
5. ✅ **Test export laporan**

Lihat detail di: `LETTERHEAD_SYSTEM_IMPLEMENTATION.md`

## 📞 Support

Jika masih ada masalah:
1. Check file log: `logs/server.log`
2. Check MySQL error log
3. Verify database connection di `db.js`

---

**Migration File**: `database/migrations/2025-10-22-ensure-system-config-table.sql`  
**Documentation**: `LETTERHEAD_SYSTEM_IMPLEMENTATION.md`  
**Last Updated**: 22 Oktober 2025

