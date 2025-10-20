import mysql from 'mysql2/promise';

// Konfigurasi database
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'absenta13',
    port: 3306
};

async function optimizeMySQLConfig() {
    let connection;
    
    try {
        console.log('🔧 OPTIMASI KONFIGURASI MYSQL');
        console.log('==============================');
        connection = await mysql.createConnection(dbConfig);
        
        // 1. Analisis Konfigurasi Saat Ini
        console.log('\n📋 1. ANALISIS KONFIGURASI SAAT INI');
        console.log('------------------------------------');
        
        const configVars = [
            'innodb_buffer_pool_size',
            'innodb_log_file_size',
            'innodb_log_buffer_size',
            'max_connections',
            'query_cache_size',
            'query_cache_type',
            'tmp_table_size',
            'max_heap_table_size',
            'key_buffer_size',
            'table_open_cache',
            'thread_cache_size',
            'innodb_flush_log_at_trx_commit',
            'innodb_file_per_table',
            'slow_query_log',
            'long_query_time'
        ];
        
        console.log('📊 Konfigurasi MySQL saat ini:');
        for (const varName of configVars) {
            try {
                const [result] = await connection.execute(`SHOW VARIABLES LIKE '${varName}'`);
                if (result.length > 0) {
                    const value = result[0].Value;
                    let status = '✅';
                    let recommendation = '';
                    
                    switch (varName) {
                        case 'innodb_buffer_pool_size':
                            const bufferPoolSize = parseInt(value);
                            if (bufferPoolSize < 134217728) { // < 128MB
                                status = '❌';
                                recommendation = ' (Kritis: Terlalu kecil, minimal 128MB)';
                            } else if (bufferPoolSize < 268435456) { // < 256MB
                                status = '⚠️';
                                recommendation = ' (Rekomendasi: Minimal 256MB)';
                            }
                            break;
                        case 'max_connections':
                            const maxConn = parseInt(value);
                            if (maxConn < 100) {
                                status = '⚠️';
                                recommendation = ' (Rekomendasi: Minimal 100)';
                            }
                            break;
                        case 'query_cache_size':
                            if (value === '0') {
                                status = '⚠️';
                                recommendation = ' (Rekomendasi: Aktifkan query cache)';
                            }
                            break;
                        case 'query_cache_type':
                            if (value === 'OFF') {
                                status = '⚠️';
                                recommendation = ' (Rekomendasi: Set ke ON)';
                            }
                            break;
                        case 'slow_query_log':
                            if (value === 'OFF') {
                                status = '⚠️';
                                recommendation = ' (Rekomendasi: Aktifkan untuk monitoring)';
                            }
                            break;
                        case 'long_query_time':
                            const queryTime = parseFloat(value);
                            if (queryTime > 2) {
                                status = '⚠️';
                                recommendation = ' (Rekomendasi: Set ke 1-2 detik)';
                            }
                            break;
                    }
                    
                    const displayValue = varName.includes('size') || varName.includes('buffer') ? 
                        `${(parseInt(value) / 1024 / 1024).toFixed(2)} MB` : value;
                    
                    console.log(`${status} ${varName}: ${displayValue}${recommendation}`);
                }
            } catch (error) {
                console.log(`⚠️  Error getting ${varName}: ${error.message}`);
            }
        }
        
        // 2. Rekomendasi Optimasi
        console.log('\n📋 2. REKOMENDASI OPTIMASI');
        console.log('----------------------------');
        
        console.log('🔧 Konfigurasi yang Perlu Dioptimasi:');
        
        // Analisis buffer pool
        const [bufferPoolResult] = await connection.execute(`SHOW VARIABLES LIKE 'innodb_buffer_pool_size'`);
        const currentBufferPool = parseInt(bufferPoolResult[0].Value);
        
        if (currentBufferPool < 134217728) {
            console.log('\n1. ❌ INNODB_BUFFER_POOL_SIZE (KRITIS)');
            console.log(`   - Saat ini: ${(currentBufferPool / 1024 / 1024).toFixed(2)} MB`);
            console.log('   - Masalah: Terlalu kecil, menyebabkan performa lambat');
            console.log('   - Rekomendasi: Minimal 128MB, ideal 256MB atau 50-70% RAM');
            console.log('   - Solusi: Tambahkan di my.cnf:');
            console.log('     innodb_buffer_pool_size = 256M');
        }
        
        // Analisis query cache
        const [queryCacheResult] = await connection.execute(`SHOW VARIABLES LIKE 'query_cache_size'`);
        const [queryCacheTypeResult] = await connection.execute(`SHOW VARIABLES LIKE 'query_cache_type'`);
        
        if (queryCacheResult[0].Value === '0' || queryCacheTypeResult[0].Value === 'OFF') {
            console.log('\n2. ⚠️  QUERY CACHE (PERFORMA)');
            console.log('   - Masalah: Query cache tidak aktif');
            console.log('   - Rekomendasi: Aktifkan untuk meningkatkan performa query');
            console.log('   - Solusi: Tambahkan di my.cnf:');
            console.log('     query_cache_type = 1');
            console.log('     query_cache_size = 32M');
        }
        
        // Analisis slow query log
        const [slowLogResult] = await connection.execute(`SHOW VARIABLES LIKE 'slow_query_log'`);
        const [longQueryTimeResult] = await connection.execute(`SHOW VARIABLES LIKE 'long_query_time'`);
        
        if (slowLogResult[0].Value === 'OFF') {
            console.log('\n3. ⚠️  SLOW QUERY LOG (MONITORING)');
            console.log('   - Masalah: Slow query log tidak aktif');
            console.log('   - Rekomendasi: Aktifkan untuk monitoring performa');
            console.log('   - Solusi: Tambahkan di my.cnf:');
            console.log('     slow_query_log = 1');
            console.log('     slow_query_log_file = /var/log/mysql/slow.log');
            console.log('     long_query_time = 2');
        }
        
        // 3. Konfigurasi Optimal untuk Aplikasi Absensi
        console.log('\n📋 3. KONFIGURASI OPTIMAL UNTUK APLIKASI ABSENSI');
        console.log('---------------------------------------------------');
        
        console.log('🎯 Konfigurasi yang direkomendasikan untuk aplikasi absensi:');
        console.log('');
        console.log('[mysqld]');
        console.log('# Basic Settings');
        console.log('default-storage-engine = InnoDB');
        console.log('character-set-server = utf8mb4');
        console.log('collation-server = utf8mb4_general_ci');
        console.log('');
        console.log('# InnoDB Settings');
        console.log('innodb_buffer_pool_size = 256M          # 50-70% of RAM');
        console.log('innodb_log_file_size = 64M              # 25% of buffer pool');
        console.log('innodb_log_buffer_size = 16M            # 2-4MB per GB RAM');
        console.log('innodb_flush_log_at_trx_commit = 2      # Better performance');
        console.log('innodb_file_per_table = 1               # Better management');
        console.log('');
        console.log('# Query Cache');
        console.log('query_cache_type = 1                    # Enable query cache');
        console.log('query_cache_size = 32M                  # 32MB cache');
        console.log('query_cache_limit = 2M                  # Max query size');
        console.log('');
        console.log('# Connection Settings');
        console.log('max_connections = 200                   # Sufficient for absensi app');
        console.log('max_connect_errors = 1000               # Prevent brute force');
        console.log('connect_timeout = 10                    # Connection timeout');
        console.log('');
        console.log('# Table Settings');
        console.log('table_open_cache = 2000                 # Open table cache');
        console.log('tmp_table_size = 32M                    # Temp table size');
        console.log('max_heap_table_size = 32M               # Heap table size');
        console.log('');
        console.log('# Logging');
        console.log('slow_query_log = 1                      # Enable slow query log');
        console.log('slow_query_log_file = /var/log/mysql/slow.log');
        console.log('long_query_time = 2                     # Log queries > 2s');
        console.log('log_queries_not_using_indexes = 1       # Log non-indexed queries');
        console.log('');
        console.log('# Security');
        console.log('local_infile = 0                        # Disable local file loading');
        console.log('skip_show_database                      # Hide database list');
        
        // 4. Script untuk Menerapkan Konfigurasi
        console.log('\n📋 4. SCRIPT PENERAPAN KONFIGURASI');
        console.log('------------------------------------');
        
        console.log('🔧 Untuk menerapkan konfigurasi:');
        console.log('');
        console.log('1. Backup konfigurasi saat ini:');
        console.log('   sudo cp /etc/mysql/my.cnf /etc/mysql/my.cnf.backup');
        console.log('');
        console.log('2. Edit file konfigurasi:');
        console.log('   sudo nano /etc/mysql/my.cnf');
        console.log('');
        console.log('3. Tambahkan konfigurasi di atas ke file my.cnf');
        console.log('');
        console.log('4. Restart MySQL:');
        console.log('   sudo systemctl restart mysql');
        console.log('');
        console.log('5. Verifikasi konfigurasi:');
        console.log('   mysql -u root -p -e "SHOW VARIABLES LIKE \'innodb_buffer_pool_size\';"');
        
        // 5. Monitoring dan Maintenance
        console.log('\n📋 5. MONITORING DAN MAINTENANCE');
        console.log('----------------------------------');
        
        console.log('📊 Query untuk monitoring performa:');
        console.log('');
        console.log('# Cek status MySQL');
        console.log('SHOW STATUS LIKE \'Uptime\';');
        console.log('SHOW STATUS LIKE \'Connections\';');
        console.log('SHOW STATUS LIKE \'Threads_connected\';');
        console.log('');
        console.log('# Cek query cache');
        console.log('SHOW STATUS LIKE \'Qcache%\';');
        console.log('');
        console.log('# Cek InnoDB status');
        console.log('SHOW STATUS LIKE \'Innodb%\';');
        console.log('');
        console.log('# Cek slow queries');
        console.log('SHOW STATUS LIKE \'Slow_queries\';');
        console.log('');
        console.log('🔧 Maintenance rutin:');
        console.log('- OPTIMIZE TABLE untuk table yang sering diupdate');
        console.log('- ANALYZE TABLE untuk update statistik');
        console.log('- Monitor slow query log secara berkala');
        console.log('- Backup database secara rutin');
        
        console.log('\n✅ REKOMENDASI OPTIMASI MYSQL SELESAI!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

optimizeMySQLConfig();
