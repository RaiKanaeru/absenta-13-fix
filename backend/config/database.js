/**
 * Database Configuration - Centralized database settings
 * Handles database connection configuration and optimization
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Database configuration object
 */
export const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    charset: 'utf8mb4',
    timezone: '+07:00',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: false
};

/**
 * Create database connection pool
 */
export const createPool = () => {
    try {
        const pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: dbConfig.connectionLimit,
            queueLimit: dbConfig.queueLimit,
            acquireTimeout: dbConfig.acquireTimeout,
            timeout: dbConfig.timeout
        });

        console.log('✅ Database pool created successfully');
        return pool;
    } catch (error) {
        console.error('❌ Error creating database pool:', error);
        throw error;
    }
};

/**
 * Test database connection
 * @param {Object} pool - Database pool
 * @returns {Promise<boolean>} Connection test result
 */
export const testConnection = async (pool) => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        
        console.log('✅ Database connection test successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
    }
};

/**
 * Get database statistics
 * @param {Object} pool - Database pool
 * @returns {Promise<Object>} Database statistics
 */
export const getDatabaseStats = async (pool) => {
    try {
        const [rows] = await pool.execute('SHOW STATUS LIKE "Threads_connected"');
        const [maxConnections] = await pool.execute('SHOW VARIABLES LIKE "max_connections"');
        
        return {
            current_connections: rows[0]?.Value || 0,
            max_connections: maxConnections[0]?.Value || 0,
            pool_config: {
                connectionLimit: dbConfig.connectionLimit,
                queueLimit: dbConfig.queueLimit
            }
        };
    } catch (error) {
        console.error('❌ Error getting database stats:', error);
        return null;
    }
};

/**
 * Database health check
 * @param {Object} pool - Database pool
 * @returns {Promise<Object>} Health check result
 */
export const healthCheck = async (pool) => {
    try {
        const startTime = Date.now();
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        
        const responseTime = Date.now() - startTime;
        
        return {
            status: 'healthy',
            response_time: `${responseTime}ms`,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Database optimization settings
 */
export const optimizationSettings = {
    // Connection pool settings
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    
    // Query optimization
    multipleStatements: false,
    dateStrings: false,
    supportBigNumbers: true,
    bigNumberStrings: true,
    
    // Performance settings
    charset: 'utf8mb4',
    timezone: '+07:00',
    reconnect: true
};

/**
 * Database error codes mapping
 */
export const DB_ERROR_CODES = {
    CONNECTION_LOST: 'PROTOCOL_CONNECTION_LOST',
    TIMEOUT: 'ETIMEDOUT',
    DUPLICATE_ENTRY: 'ER_DUP_ENTRY',
    FOREIGN_KEY_CONSTRAINT: 'ER_NO_REFERENCED_ROW_2',
    INVALID_DATA: 'ER_TRUNCATED_WRONG_VALUE',
    TABLE_NOT_EXISTS: 'ER_NO_SUCH_TABLE',
    ACCESS_DENIED: 'ER_ACCESS_DENIED_ERROR'
};

/**
 * Database query helpers
 */
export const queryHelpers = {
    /**
     * Execute query with error handling
     * @param {Object} pool - Database pool
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>} Query result
     */
    async execute(pool, query, params = []) {
        try {
            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('❌ Database query error:', error);
            throw error;
        }
    },

    /**
     * Execute transaction
     * @param {Object} pool - Database pool
     * @param {Function} callback - Transaction callback
     * @returns {Promise<any>} Transaction result
     */
    async transaction(pool, callback) {
        const connection = await pool.getConnection();
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
    }
};
