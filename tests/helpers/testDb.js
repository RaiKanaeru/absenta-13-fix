/**
 * Test Database Helper
 * SQLite-based test database for integration tests
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class TestDatabase {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '../fixtures/test.db');
    }

    async connect() {
        return new Promise((resolve, reject) => {
            // Remove existing test database
            if (fs.existsSync(this.dbPath)) {
                fs.unlinkSync(this.dbPath);
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async disconnect() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async createTables() {
        const createTablesSQL = `
            -- Users table
            CREATE TABLE IF NOT EXISTS pengguna (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'guru', 'siswa') NOT NULL,
                nama VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                status ENUM('aktif', 'tidak_aktif', 'ditangguhkan') DEFAULT 'aktif',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Teachers table
            CREATE TABLE IF NOT EXISTS guru (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_guru INTEGER UNIQUE NOT NULL,
                nama VARCHAR(100) NOT NULL,
                nip VARCHAR(18),
                email VARCHAR(100),
                mapel_id INTEGER,
                status ENUM('aktif', 'tidak_aktif') DEFAULT 'aktif',
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES pengguna(id)
            );

            -- Students table
            CREATE TABLE IF NOT EXISTS siswa_perwakilan (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_siswa INTEGER UNIQUE NOT NULL,
                nama VARCHAR(100) NOT NULL,
                nis VARCHAR(20),
                kelas_id INTEGER,
                status ENUM('aktif', 'tidak_aktif') DEFAULT 'aktif',
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES pengguna(id)
            );

            -- Subjects table
            CREATE TABLE IF NOT EXISTS mapel (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_mapel INTEGER UNIQUE NOT NULL,
                kode_mapel VARCHAR(20) UNIQUE NOT NULL,
                nama_mapel VARCHAR(100) NOT NULL,
                status ENUM('aktif', 'tidak_aktif') DEFAULT 'aktif',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Classes table
            CREATE TABLE IF NOT EXISTS kelas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_kelas INTEGER UNIQUE NOT NULL,
                nama_kelas VARCHAR(50) NOT NULL,
                status ENUM('aktif', 'tidak_aktif') DEFAULT 'aktif',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Schedules table
            CREATE TABLE IF NOT EXISTS jadwal (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guru_id INTEGER NOT NULL,
                mapel_id INTEGER NOT NULL,
                kelas_id INTEGER NOT NULL,
                hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu') NOT NULL,
                jam_mulai TIME NOT NULL,
                jam_selesai TIME NOT NULL,
                status ENUM('aktif', 'tidak_aktif') DEFAULT 'aktif',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guru_id) REFERENCES guru(id_guru),
                FOREIGN KEY (mapel_id) REFERENCES mapel(id_mapel),
                FOREIGN KEY (kelas_id) REFERENCES kelas(id_kelas)
            );

            -- Teacher attendance table
            CREATE TABLE IF NOT EXISTS absensi_guru (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guru_id INTEGER NOT NULL,
                jadwal_id INTEGER NOT NULL,
                tanggal DATE NOT NULL,
                status ENUM('Hadir', 'Tidak Hadir', 'Sakit', 'Izin', 'Terlambat') NOT NULL,
                keterangan TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guru_id) REFERENCES guru(id_guru),
                FOREIGN KEY (jadwal_id) REFERENCES jadwal(id)
            );

            -- Student attendance table
            CREATE TABLE IF NOT EXISTS absensi_siswa (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                siswa_id INTEGER NOT NULL,
                jadwal_id INTEGER NOT NULL,
                tanggal DATE NOT NULL,
                status ENUM('Hadir', 'Izin', 'Sakit', 'Alpa', 'Dispen') NOT NULL,
                keterangan TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (siswa_id) REFERENCES siswa_perwakilan(id_siswa),
                FOREIGN KEY (jadwal_id) REFERENCES jadwal(id)
            );
        `;

        // SQLite doesn't support ENUM, so we'll use TEXT instead
        const sqliteCreateTablesSQL = `
            -- Users table
            CREATE TABLE IF NOT EXISTS pengguna (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
                nama TEXT NOT NULL,
                email TEXT,
                status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak_aktif', 'ditangguhkan')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Teachers table
            CREATE TABLE IF NOT EXISTS guru (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_guru INTEGER UNIQUE NOT NULL,
                nama TEXT NOT NULL,
                nip TEXT,
                email TEXT,
                mapel_id INTEGER,
                status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak_aktif')),
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES pengguna(id)
            );

            -- Students table
            CREATE TABLE IF NOT EXISTS siswa_perwakilan (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_siswa INTEGER UNIQUE NOT NULL,
                nama TEXT NOT NULL,
                nis TEXT,
                kelas_id INTEGER,
                status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak_aktif')),
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES pengguna(id)
            );

            -- Subjects table
            CREATE TABLE IF NOT EXISTS mapel (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_mapel INTEGER UNIQUE NOT NULL,
                kode_mapel TEXT UNIQUE NOT NULL,
                nama_mapel TEXT NOT NULL,
                status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak_aktif')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Classes table
            CREATE TABLE IF NOT EXISTS kelas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_kelas INTEGER UNIQUE NOT NULL,
                nama_kelas TEXT NOT NULL,
                status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak_aktif')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Schedules table
            CREATE TABLE IF NOT EXISTS jadwal (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guru_id INTEGER NOT NULL,
                mapel_id INTEGER NOT NULL,
                kelas_id INTEGER NOT NULL,
                hari TEXT NOT NULL CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')),
                jam_mulai TEXT NOT NULL,
                jam_selesai TEXT NOT NULL,
                status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak_aktif')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Teacher attendance table
            CREATE TABLE IF NOT EXISTS absensi_guru (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guru_id INTEGER NOT NULL,
                jadwal_id INTEGER NOT NULL,
                tanggal TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('Hadir', 'Tidak Hadir', 'Sakit', 'Izin', 'Terlambat')),
                keterangan TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Student attendance table
            CREATE TABLE IF NOT EXISTS absensi_siswa (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                siswa_id INTEGER NOT NULL,
                jadwal_id INTEGER NOT NULL,
                tanggal TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('Hadir', 'Izin', 'Sakit', 'Alpa', 'Dispen')),
                keterangan TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await this.run(sqliteCreateTablesSQL);
    }

    async seedTestData() {
        // Insert test users
        await this.run(`
            INSERT INTO pengguna (username, password, role, nama, email, status) VALUES
            ('admin', '$2b$10$test.hash.for.admin', 'admin', 'Admin User', 'admin@test.com', 'aktif'),
            ('guru001', '$2b$10$test.hash.for.guru', 'guru', 'Guru Test', 'guru@test.com', 'aktif'),
            ('perwakilan2000', '$2b$10$test.hash.for.student', 'siswa', 'Siswa Test', 'siswa@test.com', 'aktif')
        `);

        // Insert test teachers
        await this.run(`
            INSERT INTO guru (id_guru, nama, nip, email, mapel_id, status, user_id) VALUES
            (1, 'Guru Matematika', '123456789012345678', 'guru1@test.com', 1, 'aktif', 2),
            (2, 'Guru Bahasa', '123456789012345679', 'guru2@test.com', 2, 'aktif', 2)
        `);

        // Insert test students
        await this.run(`
            INSERT INTO siswa_perwakilan (id_siswa, nama, nis, kelas_id, status, user_id) VALUES
            (2000, 'Siswa Test 1', '2024001', 1, 'aktif', 3),
            (2001, 'Siswa Test 2', '2024002', 1, 'aktif', 3)
        `);

        // Insert test subjects
        await this.run(`
            INSERT INTO mapel (id_mapel, kode_mapel, nama_mapel, status) VALUES
            (1, 'MTK-01', 'Matematika', 'aktif'),
            (2, 'BHS-01', 'Bahasa Indonesia', 'aktif'),
            (3, 'ING-01', 'Bahasa Inggris', 'aktif')
        `);

        // Insert test classes
        await this.run(`
            INSERT INTO kelas (id_kelas, nama_kelas, status) VALUES
            (1, 'X TKJ 1', 'aktif'),
            (2, 'X TKJ 2', 'aktif'),
            (3, 'XI TKJ 1', 'aktif')
        `);

        // Insert test schedules
        await this.run(`
            INSERT INTO jadwal (guru_id, mapel_id, kelas_id, hari, jam_mulai, jam_selesai, status) VALUES
            (1, 1, 1, 'Senin', '07:00:00', '07:45:00', 'aktif'),
            (1, 1, 1, 'Senin', '08:00:00', '08:45:00', 'aktif'),
            (2, 2, 1, 'Selasa', '07:00:00', '07:45:00', 'aktif')
        `);
    }

    async clearData() {
        const tables = [
            'absensi_siswa',
            'absensi_guru', 
            'jadwal',
            'siswa_perwakilan',
            'guru',
            'pengguna',
            'mapel',
            'kelas'
        ];

        for (const table of tables) {
            await this.run(`DELETE FROM ${table}`);
        }
    }

    async dropTables() {
        const tables = [
            'absensi_siswa',
            'absensi_guru', 
            'jadwal',
            'siswa_perwakilan',
            'guru',
            'pengguna',
            'mapel',
            'kelas'
        ];

        for (const table of tables) {
            await this.run(`DROP TABLE IF EXISTS ${table}`);
        }
    }
}

module.exports = TestDatabase;
