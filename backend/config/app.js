/**
 * Application Configuration - Centralized app settings
 * Handles application-wide configuration and environment settings
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration object
 */
export const appConfig = {
    // Server settings
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    
    // JWT settings
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        algorithm: 'HS256'
    },
    
    // CORS settings
    cors: {
        origin: [
            'http://localhost:8080',
            'http://localhost:8081', 
            'http://localhost:5173',
            'http://localhost:3000'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    },
    
    // File upload settings
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ],
        destination: './uploads/'
    },
    
    // Logging settings
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
        file: process.env.LOG_FILE || './logs/app.log'
    },
    
    // Security settings
    security: {
        bcryptRounds: 10,
        sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
        cookieMaxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production'
    }
};

/**
 * Database configuration
 */
export const databaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    charset: 'utf8mb4',
    timezone: '+07:00',
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000
};

/**
 * Redis configuration (optional)
 */
export const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null
};

/**
 * Email configuration (optional)
 */
export const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
};

/**
 * Application constants
 */
export const constants = {
    // User roles
    ROLES: {
        ADMIN: 'admin',
        TEACHER: 'guru',
        STUDENT: 'siswa'
    },
    
    // Attendance status
    ATTENDANCE_STATUS: {
        PRESENT: 'Hadir',
        ABSENT: 'Alpa',
        SICK: 'Sakit',
        PERMISSION: 'Izin',
        DISPENSATION: 'Dispen'
    },
    
    // Days of week
    DAYS: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
    
    // Time slots
    TIME_SLOTS: [
        '07:00-07:45',
        '07:45-08:30', 
        '08:30-09:15',
        '09:15-10:00',
        '10:00-10:45',
        '10:45-11:30',
        '11:30-12:15',
        '12:15-13:00',
        '13:00-13:45',
        '13:45-14:30',
        '14:30-15:15',
        '15:15-16:00'
    ],
    
    // Pagination
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100
    },
    
    // File types
    FILE_TYPES: {
        EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        CSV: 'text/csv',
        PDF: 'application/pdf'
    }
};

/**
 * Environment validation
 */
export const validateEnvironment = () => {
    const required = [
        'JWT_SECRET',
        'DB_HOST',
        'DB_USER', 
        'DB_PASSWORD',
        'DB_NAME'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing);
        process.exit(1);
    }
    
    console.log('✅ Environment variables validated');
};

/**
 * Get configuration for specific environment
 */
export const getConfig = (env = process.env.NODE_ENV) => {
    const baseConfig = {
        ...appConfig,
        database: databaseConfig,
        redis: redisConfig,
        email: emailConfig,
        constants
    };
    
    // Environment-specific overrides
    switch (env) {
        case 'production':
            return {
                ...baseConfig,
                security: {
                    ...baseConfig.security,
                    secure: true
                },
                logging: {
                    ...baseConfig.logging,
                    level: 'warn'
                }
            };
            
        case 'test':
            return {
                ...baseConfig,
                database: {
                    ...databaseConfig,
                    database: 'absenta_test'
                },
                logging: {
                    ...baseConfig.logging,
                    level: 'error'
                }
            };
            
        default:
            return baseConfig;
    }
};

/**
 * Application metadata
 */
export const appMetadata = {
    name: 'Absenta Modular Server',
    version: '2.0.0',
    description: 'Modular attendance management system',
    author: 'Absenta Team',
    license: 'MIT',
    repository: 'https://github.com/absenta/absenta-modular',
    documentation: 'https://docs.absenta.com'
};
