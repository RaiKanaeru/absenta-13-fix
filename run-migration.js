#!/usr/bin/env node

import 'dotenv/config';
import { db } from './db.js';
import fs from 'fs/promises';
import path from 'path';

async function runMigration() {
    console.log('🚀 Starting Absenta Schema Migration...');
    
    try {
        // Test database connection
        console.log('📡 Testing database connection...');
        const [testResult] = await db.execute('SELECT 1 as test');
        console.log('✅ Database connection successful');
        
        // Read migration file
        const migrationPath = path.join(process.cwd(), 'migrations', '001_refactor_absenta_schema.sql');
        console.log(`📄 Reading migration file: ${migrationPath}`);
        
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        console.log('📝 Migration SQL loaded successfully');
        
        // Execute migration in transaction
        console.log('🔄 Executing migration...');
        await db.transaction(async (connection) => {
            // Split SQL by semicolon and execute each statement
            const statements = migrationSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            
            for (const statement of statements) {
                if (statement.trim()) {
                    console.log(`⚡ Executing: ${statement.substring(0, 50)}...`);
                    await connection.execute(statement);
                }
            }
        });
        
        console.log('✅ Migration completed successfully!');
        
        // Verify changes
        console.log('🔍 Verifying schema changes...');
        
        // Check users table structure
        const [usersColumns] = await db.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('📊 Users table columns:', usersColumns.map(col => col.COLUMN_NAME));
        
        // Check if pengajuan_izin tables are dropped
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('pengajuan_izin', 'pengajuan_izin_detail')
        `);
        
        if (tables.length === 0) {
            console.log('✅ Pengajuan izin tables successfully removed');
        } else {
            console.log('⚠️  Warning: Some pengajuan izin tables still exist:', tables.map(t => t.TABLE_NAME));
        }
        
        // Check constraints
        const [constraints] = await db.execute(`
            SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND CONSTRAINT_NAME IN ('uq_jadwal_slot', 'uq_absen_slot')
        `);
        console.log('🔗 Unique constraints created:', constraints.map(c => c.CONSTRAINT_NAME));
        
        console.log('🎉 Migration verification completed!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        // Close database connection
        await db.close();
        console.log('🔌 Database connection closed');
    }
}

// Run migration
runMigration().catch(console.error);