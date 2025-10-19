// ================================================
// SWAGGER/OPENAPI CONFIGURATION
// ================================================

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sistem Absensi Modern API',
            version: '1.0.0',
            description: 'API untuk sistem absensi modern dengan fitur lengkap untuk admin, guru, dan siswa',
            contact: {
                name: 'Development Team',
                email: 'dev@absensi-modern.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: process.env.API_BASE_URL || 'http://localhost:3001',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        username: { type: 'string', example: 'admin' },
                        nama: { type: 'string', example: 'Administrator' },
                        role: { type: 'string', enum: ['admin', 'guru', 'siswa'], example: 'admin' },
                        email: { type: 'string', format: 'email', example: 'admin@example.com' },
                        status: { type: 'string', enum: ['aktif', 'nonaktif'], example: 'aktif' }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string', example: 'admin' },
                        password: { type: 'string', example: 'password123' }
                    }
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: {
                            type: 'object',
                            properties: {
                                user: { $ref: '#/components/schemas/User' },
                                token: { type: 'string', example: 'jwt-token-here' }
                            }
                        },
                        message: { type: 'string', example: 'Login berhasil' }
                    }
                },
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' },
                        message: { type: 'string', example: 'Success' },
                        meta: {
                            type: 'object',
                            properties: {
                                timestamp: { type: 'string', format: 'date-time' },
                                pagination: {
                                    type: 'object',
                                    properties: {
                                        page: { type: 'integer', example: 1 },
                                        limit: { type: 'integer', example: 10 },
                                        total: { type: 'integer', example: 100 },
                                        totalPages: { type: 'integer', example: 10 },
                                        hasNext: { type: 'boolean', example: true },
                                        hasPrev: { type: 'boolean', example: false }
                                    }
                                }
                            }
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', example: 'Error message' },
                        message: { type: 'string', example: 'Error description' },
                        details: { type: 'object' },
                        meta: {
                            type: 'object',
                            properties: {
                                timestamp: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                },
                Guru: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        nip: { type: 'string', example: 'G001' },
                        nama: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', format: 'email', example: 'john@example.com' },
                        mapel_id: { type: 'integer', example: 1 },
                        no_telp: { type: 'string', example: '08123456789' },
                        alamat: { type: 'string', example: 'Jl. Contoh No. 1' },
                        jenis_kelamin: { type: 'string', enum: ['L', 'P'], example: 'L' },
                        status: { type: 'string', enum: ['aktif', 'nonaktif'], example: 'aktif' }
                    }
                },
                Siswa: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        nis: { type: 'string', example: 'S001' },
                        nama: { type: 'string', example: 'Jane Doe' },
                        kelas_id: { type: 'integer', example: 1 },
                        jenis_kelamin: { type: 'string', enum: ['L', 'P'], example: 'P' },
                        alamat: { type: 'string', example: 'Jl. Contoh No. 2' },
                        telepon_orangtua: { type: 'string', example: '08123456789' },
                        status: { type: 'string', enum: ['aktif', 'nonaktif'], example: 'aktif' }
                    }
                },
                Mapel: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        kode_mapel: { type: 'string', example: 'MTK' },
                        nama_mapel: { type: 'string', example: 'Matematika' },
                        deskripsi: { type: 'string', example: 'Mata pelajaran matematika' },
                        status: { type: 'string', enum: ['aktif', 'nonaktif'], example: 'aktif' }
                    }
                },
                Kelas: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        nama_kelas: { type: 'string', example: 'X IPA 1' },
                        tingkat: { type: 'string', example: 'X' },
                        status: { type: 'string', enum: ['aktif', 'nonaktif'], example: 'aktif' }
                    }
                }
            }
        },
        security: [
            { bearerAuth: [] },
            { cookieAuth: [] }
        ]
    },
    apis: ['./server_modern.js'] // Path to the API files
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };



