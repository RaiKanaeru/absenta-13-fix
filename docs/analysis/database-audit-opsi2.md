# Database Audit Report - Opsi 2 Full Normalization

**Generated:** 2025-10-21T04:00:37.789Z

## Executive Summary

- **Total Issues:** 3
- **Critical Issues:** 1
- **High Priority Issues:** 2
- **Recommendations:** 2

## Issues Found

### 1. Table does not exist (HIGH)

- **Table:** pengguna
- **Message:** Table 'absenta13.pengguna' doesn't exist

### 2. Broken foreign key relationships (CRITICAL)

- **Table:** siswa
- **Message:** siswa.user_id references non-existent users.id
- **Count:** 76

### 3. Missing SISWA role in enum (HIGH)

- **Table:** users
- **Message:** Role enum needs to be updated to include SISWA

## Recommendations

### 1. Fix broken relationships (HIGH)

Set user_id to NULL for siswa with non-existent user references

### 2. Update role enum (HIGH)

Add SISWA to users.role enum and migrate KETOS/perwakilan to SISWA

## Siswa Statistics

- **Total Siswa:** 78
- **Dengan Akun:** 78
- **Tanpa Akun:** 0

## Foreign Key Dependencies

| Table | Column | References |
|-------|--------|------------|
| absensi_guru | siswa_pencatat_id | siswa.id_siswa |
| absensi_guru_jadwal | siswa_pencatat_id | siswa.id_siswa |
| absensi_siswa | siswa_id | siswa.id_siswa |
| guru | user_id | users.id |
| pengajuan_banding_absen | siswa_id | siswa.id_siswa |

