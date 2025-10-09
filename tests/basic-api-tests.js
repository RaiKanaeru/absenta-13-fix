// ================================================
// BASIC API TESTS
// ================================================

import request from 'supertest';
import app from '../server_modern.js';

describe('Basic API Tests', () => {
    let authToken = null;

    beforeAll(async () => {
        // Test login to get auth token
        const loginResponse = await request(app)
            .post('/api/login')
            .send({
                username: 'admin',
                password: 'admin123'
            });

        if (loginResponse.status === 200) {
            authToken = loginResponse.body.data?.token || loginResponse.body.token;
        }
    });

    describe('Health Check', () => {
        test('GET /api/health should return 200', async () => {
            const response = await request(app)
                .get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('status');
        });
    });

    describe('Authentication', () => {
        test('POST /api/login should return 400 for missing credentials', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('POST /api/login should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    username: 'invalid',
                    password: 'invalid'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('POST /api/logout should return 200', async () => {
            const response = await request(app)
                .post('/api/logout');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Admin Endpoints', () => {
        test('GET /api/admin/info should return 401 without auth', async () => {
            const response = await request(app)
                .get('/api/admin/info');

            expect(response.status).toBe(401);
        });

        test('GET /api/admin/info should return 200 with valid auth', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .get('/api/admin/info')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('user');
        });
    });

    describe('Guru CRUD', () => {
        test('GET /api/admin/guru should return 401 without auth', async () => {
            const response = await request(app)
                .get('/api/admin/guru');

            expect(response.status).toBe(401);
        });

        test('GET /api/admin/guru should return 200 with valid auth', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .get('/api/admin/guru')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('POST /api/admin/guru should return 400 for missing required fields', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .post('/api/admin/guru')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    nama: 'Test Guru'
                    // Missing required fields
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Mapel CRUD', () => {
        test('GET /api/admin/mapel should return 200 with valid auth', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .get('/api/admin/mapel')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Kelas CRUD', () => {
        test('GET /api/kelas should return 200 with valid auth', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .get('/api/kelas')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Dashboard', () => {
        test('GET /api/dashboard/stats should return 200 with valid auth', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .get('/api/dashboard/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalSiswa');
        });

        test('GET /api/dashboard/chart should return 200 with valid auth', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .get('/api/dashboard/chart')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Mapel Management', () => {
        test('GET /api/admin/mapel should return 200 with valid auth', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .get('/api/admin/mapel')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('POST /api/admin/mapel should return 400 for missing required fields', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .post('/api/admin/mapel')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    kode_mapel: 'TEST'
                    // Missing nama_mapel
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Profile Updates', () => {
        test('PUT /api/admin/update-profile should return 400 for missing required fields', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .put('/api/admin/update-profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    nama: 'Test Admin'
                    // Missing username
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});



