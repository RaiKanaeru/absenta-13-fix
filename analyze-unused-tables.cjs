const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function analyzeUnusedTables() {
    console.log('🔍 Analyzing unused tables in database...');
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        console.log('✅ Connected to database');

        // Get all tables
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]);
        console.log(`📋 Found ${tableNames.length} tables`);

        // Check which tables are referenced in code
        const codeFiles = [
            'server_modern.js',
            'db.js',
            'frontend/src/components/AdminDashboard_Modern.tsx',
            'frontend/src/components/TeacherDashboard_Modern.tsx',
            'frontend/src/components/StudentDashboard_Modern.tsx'
        ];

        const usedTables = new Set();
        const unusedTables = [];

        // Check each code file
        for (const file of codeFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                for (const tableName of tableNames) {
                    if (content.includes(tableName)) {
                        usedTables.add(tableName);
                    }
                }
            }
        }

        // Find unused tables
        for (const tableName of tableNames) {
            if (!usedTables.has(tableName)) {
                unusedTables.push(tableName);
            }
        }

        console.log('\n📊 Analysis Results:');
        console.log(`✅ Used tables: ${usedTables.size}`);
        console.log(`❌ Unused tables: ${unusedTables.length}`);

        if (unusedTables.length > 0) {
            console.log('\n🗑️ Unused tables that can be removed:');
            unusedTables.forEach(table => console.log(`  - ${table}`));
        }

        // Check for tables with no data
        console.log('\n📈 Checking table data...');
        for (const tableName of tableNames) {
            const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
            const count = result[0].count;
            if (count === 0) {
                console.log(`  - ${tableName}: 0 records (empty table)`);
            } else {
                console.log(`  - ${tableName}: ${count} records`);
            }
        }

        return { usedTables: Array.from(usedTables), unusedTables };

    } catch (error) {
        console.error('❌ Error analyzing tables:', error);
        return null;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

analyzeUnusedTables();
