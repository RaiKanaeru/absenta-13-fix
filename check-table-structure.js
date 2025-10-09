// Check Table Structure
import 'dotenv/config';
import mysql from 'mysql2/promise';

const checkTableStructure = async () => {
    let connection;
    
    try {
        console.log('🔍 Checking table structures...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Check all tables
        console.log('📋 ALL TABLES:');
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'absenta13'
            ORDER BY TABLE_NAME
        `);
        
        tables.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });
        
        // 2. Check ruang_kelas structure
        console.log('\n🏫 RUANG_KELAS TABLE STRUCTURE:');
        const [ruangColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'absenta13' 
            AND TABLE_NAME = 'ruang_kelas'
            ORDER BY ORDINAL_POSITION
        `);
        
        if (ruangColumns.length > 0) {
            console.log('Columns found:');
            ruangColumns.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
        } else {
            console.log('❌ ruang_kelas table does not exist');
        }
        
        // 3. Check mapel structure
        console.log('\n📚 MAPEL TABLE STRUCTURE:');
        const [mapelColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'absenta13' 
            AND TABLE_NAME = 'mapel'
            ORDER BY ORDINAL_POSITION
        `);
        
        if (mapelColumns.length > 0) {
            console.log('Columns found:');
            mapelColumns.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
        } else {
            console.log('❌ mapel table does not exist');
        }
        
        // 4. Check jadwal table
        console.log('\n📅 JADWAL TABLE STRUCTURE:');
        const [jadwalColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'absenta13' 
            AND TABLE_NAME = 'jadwal'
            ORDER BY ORDINAL_POSITION
        `);
        
        if (jadwalColumns.length > 0) {
            console.log('Columns found:');
            jadwalColumns.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
        } else {
            console.log('❌ jadwal table does not exist');
        }
        
    } catch (error) {
        console.error('❌ Error checking table structure:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

checkTableStructure();
