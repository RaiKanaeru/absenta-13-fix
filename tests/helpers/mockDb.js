/**
 * Mock Database Helper
 * In-memory database for testing without native dependencies
 */

class MockDatabase {
    constructor() {
        this.data = {
            pengguna: [],
            guru: [],
            siswa_perwakilan: [],
            mapel: [],
            kelas: [],
            jadwal: [],
            absensi_guru: [],
            absensi_siswa: []
        };
        this.nextIds = {
            pengguna: 1,
            guru: 1,
            siswa_perwakilan: 1,
            mapel: 1,
            kelas: 1,
            jadwal: 1,
            absensi_guru: 1,
            absensi_siswa: 1
        };
    }

    async connect() {
        // Mock connection - always succeeds
        return Promise.resolve();
    }

    async disconnect() {
        // Mock disconnection - always succeeds
        return Promise.resolve();
    }

    async run(sql, params = []) {
        // Parse SQL to determine operation
        const sqlLower = sql.toLowerCase().trim();
        
        if (sqlLower.startsWith('insert into')) {
            return this._handleInsert(sql, params);
        } else if (sqlLower.startsWith('update')) {
            return this._handleUpdate(sql, params);
        } else if (sqlLower.startsWith('delete from')) {
            return this._handleDelete(sql, params);
        } else if (sqlLower.startsWith('create table')) {
            return this._handleCreateTable(sql, params);
        } else if (sqlLower.startsWith('drop table')) {
            return this._handleDropTable(sql, params);
        }
        
        return { id: 0, changes: 0 };
    }

    async get(sql, params = []) {
        const results = await this.all(sql, params);
        return results.length > 0 ? results[0] : undefined;
    }

    async all(sql, params = []) {
        const sqlLower = sql.toLowerCase().trim();
        
        if (sqlLower.startsWith('select')) {
            return this._handleSelect(sql, params);
        }
        
        return [];
    }

    _handleInsert(sql, params) {
        // Extract table name from INSERT statement
        const tableMatch = sql.match(/insert into\s+(\w+)/i);
        if (!tableMatch) return { id: 0, changes: 0 };
        
        const tableName = tableMatch[1];
        if (!this.data[tableName]) {
            this.data[tableName] = [];
        }
        
        // Create record with auto-increment ID
        const id = this.nextIds[tableName]++;
        const record = { id, ...this._paramsToObject(sql, params) };
        
        this.data[tableName].push(record);
        
        return { id, changes: 1 };
    }

    _handleUpdate(sql, params) {
        // Extract table name and WHERE clause
        const tableMatch = sql.match(/update\s+(\w+)/i);
        if (!tableMatch) return { id: 0, changes: 0 };
        
        const tableName = tableMatch[1];
        if (!this.data[tableName]) return { id: 0, changes: 0 };
        
        // Parse SET clause to get column names and values
        const setMatch = sql.match(/set\s+(.+?)\s+where/i);
        if (!setMatch) return { id: 0, changes: 0 };
        
        const setClause = setMatch[1];
        const setPairs = setClause.split(',').map(pair => {
            const trimmedPair = pair.trim();
            const equalIndex = trimmedPair.indexOf('=');
            if (equalIndex === -1) {
                return { column: trimmedPair, value: '?' };
            }
            const column = trimmedPair.substring(0, equalIndex).trim();
            const value = trimmedPair.substring(equalIndex + 1).trim();
            return { column, value };
        });
        
        
        // Simple WHERE clause parsing (WHERE column = ?)
        const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
        if (!whereMatch) return { id: 0, changes: 0 };
        
        const whereColumn = whereMatch[1];
        const whereValue = params[params.length - 1]; // Last param is WHERE value
        
        // Count SET parameters (those with '?' values)
        const setParamCount = setPairs.filter(pair => pair.value === '?').length;
        
        let changes = 0;
        for (const record of this.data[tableName]) {
            if (record[whereColumn] === whereValue) {
                // Update record with new values
                let paramIndex = 0;
                for (const pair of setPairs) {
                    if (pair.value === '?') {
                        record[pair.column] = params[paramIndex];
                        paramIndex++;
                    } else {
                        record[pair.column] = pair.value;
                    }
                }
                changes++;
            }
        }
        
        return { id: 0, changes };
    }

    _handleDelete(sql, params) {
        // Extract table name and WHERE clause
        const tableMatch = sql.match(/delete from\s+(\w+)/i);
        if (!tableMatch) return { id: 0, changes: 0 };
        
        const tableName = tableMatch[1];
        if (!this.data[tableName]) return { id: 0, changes: 0 };
        
        // Simple WHERE clause parsing (WHERE column = ?)
        const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
        if (!whereMatch) return { id: 0, changes: 0 };
        
        const whereColumn = whereMatch[1];
        const whereValue = params[0];
        
        const originalLength = this.data[tableName].length;
        this.data[tableName] = this.data[tableName].filter(record => record[whereColumn] !== whereValue);
        const changes = originalLength - this.data[tableName].length;
        
        return { id: 0, changes };
    }

    _handleSelect(sql, params) {
        // Handle COUNT queries
        const countMatch = sql.match(/select\s+count\(\*\)\s+as\s+(\w+)\s+from\s+(\w+)/i);
        if (countMatch) {
            const alias = countMatch[1];
            const tableName = countMatch[2];
            if (!this.data[tableName]) return [{ [alias]: 0 }];
            
            let results = [...this.data[tableName]];
            
            // Handle WHERE clause for COUNT
            const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
            if (whereMatch && params.length > 0) {
                const whereColumn = whereMatch[1];
                const whereValue = params[0];
                results = results.filter(record => record[whereColumn] === whereValue);
            }
            
            return [{ [alias]: results.length }];
        }
        
        // Extract table name from SELECT statement
        const tableMatch = sql.match(/from\s+(\w+)/i);
        if (!tableMatch) return [];
        
        const tableName = tableMatch[1];
        if (!this.data[tableName]) return [];
        
        let results = [...this.data[tableName]];
        
        // Handle WHERE clause with multiple conditions
        const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?\s+and\s+(\w+)\s*=\s*\?/i);
        if (whereMatch && params.length >= 2) {
            const whereColumn1 = whereMatch[1];
            const whereValue1 = params[0];
            const whereColumn2 = whereMatch[2];
            const whereValue2 = params[1];
            results = results.filter(record => 
                record[whereColumn1] === whereValue1 && record[whereColumn2] === whereValue2
            );
        } else {
            // Handle single WHERE condition
            const singleWhereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
            if (singleWhereMatch && params.length > 0) {
                const whereColumn = singleWhereMatch[1];
                const whereValue = params[0];
                results = results.filter(record => record[whereColumn] === whereValue);
            }
        }
        
        // Handle WHERE with multiple conditions
        const whereBetweenMatch = sql.match(/where\s+(\w+)\s+between\s+\?\s+and\s+\?/i);
        if (whereBetweenMatch && params.length >= 2) {
            const whereColumn = whereBetweenMatch[1];
            const startValue = params[0];
            const endValue = params[1];
            results = results.filter(record => 
                record[whereColumn] >= startValue && record[whereColumn] <= endValue
            );
        }
        
        // Handle ORDER BY
        const orderMatch = sql.match(/order by\s+(\w+)/i);
        if (orderMatch) {
            const orderColumn = orderMatch[1];
            results.sort((a, b) => {
                if (a[orderColumn] < b[orderColumn]) return -1;
                if (a[orderColumn] > b[orderColumn]) return 1;
                return 0;
            });
        }
        
        // Handle LIMIT
        const limitMatch = sql.match(/limit\s+(\d+)/i);
        if (limitMatch) {
            const limit = parseInt(limitMatch[1]);
            results = results.slice(0, limit);
        }
        
        return results;
    }

    _handleCreateTable(sql, params) {
        // Mock table creation - always succeeds
        return { id: 0, changes: 0 };
    }

    _handleDropTable(sql, params) {
        // Extract table name
        const tableMatch = sql.match(/drop table\s+if exists\s+(\w+)/i);
        if (tableMatch) {
            const tableName = tableMatch[1];
            if (this.data[tableName]) {
                delete this.data[tableName];
            }
        }
        return { id: 0, changes: 0 };
    }

    _paramsToObject(sql, params) {
        // Extract column names from INSERT statement
        const columnsMatch = sql.match(/\(([^)]+)\)/);
        if (!columnsMatch) return {};
        
        const columns = columnsMatch[1].split(',').map(col => col.trim());
        const obj = {};
        
        for (let i = 0; i < columns.length && i < params.length; i++) {
            obj[columns[i]] = params[i];
        }
        
        return obj;
    }

    async createTables() {
        // Mock table creation - always succeeds
        return Promise.resolve();
    }

    async seedTestData() {
        // Seed with test data
        this.data.pengguna = [
            {
                id: 1,
                username: 'admin',
                password: '$2b$10$test.hash.for.admin',
                role: 'admin',
                nama: 'Admin User',
                email: 'admin@test.com',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 2,
                username: 'guru001',
                password: '$2b$10$test.hash.for.guru',
                role: 'guru',
                nama: 'Guru Test',
                email: 'guru@test.com',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 3,
                username: 'perwakilan2000',
                password: '$2b$10$test.hash.for.student',
                role: 'siswa',
                nama: 'Siswa Test',
                email: 'siswa@test.com',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        this.data.guru = [
            {
                id: 1,
                id_guru: 1,
                nama: 'Guru Matematika',
                nip: '123456789012345678',
                email: 'guru1@test.com',
                mapel_id: 1,
                status: 'aktif',
                user_id: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 2,
                id_guru: 2,
                nama: 'Guru Bahasa',
                nip: '123456789012345679',
                email: 'guru2@test.com',
                mapel_id: 2,
                status: 'aktif',
                user_id: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        this.data.siswa_perwakilan = [
            {
                id: 1,
                id_siswa: 2000,
                nama: 'Siswa Test 1',
                nis: '2024001',
                kelas_id: 1,
                status: 'aktif',
                user_id: 3,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 2,
                id_siswa: 2001,
                nama: 'Siswa Test 2',
                nis: '2024002',
                kelas_id: 1,
                status: 'aktif',
                user_id: 3,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        this.data.mapel = [
            {
                id: 1,
                id_mapel: 1,
                kode_mapel: 'MTK-01',
                nama_mapel: 'Matematika',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 2,
                id_mapel: 2,
                kode_mapel: 'BHS-01',
                nama_mapel: 'Bahasa Indonesia',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 3,
                id_mapel: 3,
                kode_mapel: 'ING-01',
                nama_mapel: 'Bahasa Inggris',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        this.data.kelas = [
            {
                id: 1,
                id_kelas: 1,
                nama_kelas: 'X TKJ 1',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 2,
                id_kelas: 2,
                nama_kelas: 'X TKJ 2',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 3,
                id_kelas: 3,
                nama_kelas: 'XI TKJ 1',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        this.data.jadwal = [
            {
                id: 1,
                guru_id: 1,
                mapel_id: 1,
                kelas_id: 1,
                hari: 'Senin',
                jam_mulai: '07:00:00',
                jam_selesai: '07:45:00',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 2,
                guru_id: 1,
                mapel_id: 1,
                kelas_id: 1,
                hari: 'Senin',
                jam_mulai: '08:00:00',
                jam_selesai: '08:45:00',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 3,
                guru_id: 2,
                mapel_id: 2,
                kelas_id: 1,
                hari: 'Selasa',
                jam_mulai: '07:00:00',
                jam_selesai: '07:45:00',
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        // Reset next IDs
        this.nextIds.pengguna = 4;
        this.nextIds.guru = 3;
        this.nextIds.siswa_perwakilan = 3;
        this.nextIds.mapel = 4;
        this.nextIds.kelas = 4;
        this.nextIds.jadwal = 4;
        this.nextIds.absensi_guru = 1;
        this.nextIds.absensi_siswa = 1;
    }

    async clearData() {
        // Clear all data
        for (const tableName in this.data) {
            this.data[tableName] = [];
        }
        
        // Reset next IDs
        for (const tableName in this.nextIds) {
            this.nextIds[tableName] = 1;
        }
    }

    async dropTables() {
        // Mock table dropping - always succeeds
        return Promise.resolve();
    }
}

module.exports = MockDatabase;
