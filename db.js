// ================================================
// DATABASE CONNECTION POOL HELPER
// ================================================

import 'dotenv/config';
import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000,
    idleTimeout: 300000,
    charset: 'utf8mb4',
    port: 3306
};

// Default query timeout
export const DEFAULT_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS) || 30000;

// Log database configuration (without password)
console.log('🗄️ Database config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    connectionLimit: dbConfig.connectionLimit
});

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database helper functions
export const db = {
    // Execute query with automatic connection management and timeout
    async execute(query, params = [], options = {}) {
        const maxRetries = options.maxRetries ?? 3;
        const retryDelay = options.retryDelay ?? 1000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const timeout = options.timeout ?? DEFAULT_QUERY_TIMEOUT_MS;
                const [rows] = await pool.execute({ sql: query, timeout }, params);
                return [rows];
            } catch (error) {
                console.error(`❌ Database query error (attempt ${attempt}/${maxRetries}):`, error);
                
                // If it's a timeout error and we have retries left, wait and retry
                if (error.code === 'PROTOCOL_SEQUENCE_TIMEOUT' && attempt < maxRetries) {
                    console.log(`🔄 Retrying query in ${retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue;
                }
                
                // If it's the last attempt or not a timeout error, throw
                throw error;
            }
        }
    },

    // Execute query with timeout (alias for backward compatibility)
    async dbExecute(sql, params = [], opts = {}) {
        return this.execute(sql, params, opts);
    },

    // Get connection for transactions
    async getConnection() {
        try {
            const connection = await pool.getConnection();
            return connection;
        } catch (error) {
            console.error('❌ Failed to get database connection:', error);
            throw error;
        }
    },

    // Execute transaction
    async transaction(callback) {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Enhanced transaction helper with better error handling
    async withTransaction(fn) {
        const conn = await this.getConnection();
        try {
            await conn.beginTransaction();
            const result = await fn(conn);
            await conn.commit();
            return result;
        } catch (error) {
            try {
                await conn.rollback();
            } catch (rollbackError) {
                console.error('❌ Error during rollback:', rollbackError);
            }
            throw error;
        } finally {
            conn.release();
        }
    },

    // Test connection
    async testConnection() {
        try {
            if (!pool) {
                console.error('❌ Database pool not initialized');
                return false;
            }
            const [rows] = await pool.execute('SELECT 1 as test');
            return rows[0].test === 1;
        } catch (error) {
            console.error('❌ Database connection test failed:', error.message);
            return false;
        }
    },

    // Get pool stats
    getPoolStats() {
        if (!pool || !pool.pool) {
            return {
                totalConnections: 0,
                freeConnections: 0,
                acquiringConnections: 0,
                connectionQueue: 0
            };
        }
        return {
            totalConnections: pool.pool._allConnections?.length || 0,
            freeConnections: pool.pool._freeConnections?.length || 0,
            acquiringConnections: pool.pool._acquiringConnections?.length || 0,
            connectionQueue: pool.pool._connectionQueue?.length || 0
        };
    },

    // Check if connected
    isConnected() {
        return pool && pool.pool && pool.pool._allConnections && pool.pool._allConnections.length > 0;
    },

    // Close pool
    async close() {
        try {
            await pool.end();
            console.log('✅ Database pool closed');
        } catch (error) {
            console.error('❌ Error closing database pool:', error);
        }
    }
};

// Handle pool errors
pool.on('connection', (connection) => {
    console.log('🔗 New database connection established');
});

pool.on('error', (err) => {
    console.error('❌ Database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Connection lost, pool will handle reconnection');
    }
});

// Export pool for direct access
export { pool };

// Helper functions for direct use
export async function dbExecute(sql, params = [], opts = {}) {
    const timeout = opts.timeout ?? DEFAULT_QUERY_TIMEOUT_MS;
    try {
        const [rows] = await pool.execute({ sql, timeout }, params);
        return [rows];
    } catch (error) {
        console.error('❌ Database query error:', error);
        throw error;
    }
}


export default db;
