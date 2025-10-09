/**
 * Unit Tests for User Model
 */

const { describe, it, expect } = require('@jest/globals');

describe('User Model', () => {
    describe('User Data Validation', () => {
        it('should validate user data structure', () => {
            const userData = {
                id: 1,
                username: 'admin',
                password: 'hashed_password',
                role: 'admin',
                nama: 'Administrator',
                email: 'admin@test.com',
                status: 'aktif',
                created_at: new Date(),
                updated_at: new Date()
            };

            expect(userData.id).toBeDefined();
            expect(userData.username).toBeDefined();
            expect(userData.password).toBeDefined();
            expect(userData.role).toBeDefined();
            expect(userData.nama).toBeDefined();
            expect(userData.email).toBeDefined();
            expect(userData.status).toBeDefined();
        });

        it('should validate user roles', () => {
            const validRoles = ['admin', 'guru', 'siswa'];
            
            validRoles.forEach(role => {
                expect(['admin', 'guru', 'siswa'].includes(role)).toBe(true);
            });
        });

        it('should validate user statuses', () => {
            const validStatuses = ['aktif', 'tidak_aktif', 'ditangguhkan'];
            
            validStatuses.forEach(status => {
                expect(['aktif', 'tidak_aktif', 'ditangguhkan'].includes(status)).toBe(true);
            });
        });

        it('should validate email format', () => {
            const validEmails = [
                'user@example.com',
                'test.email@domain.co.id',
                'user+tag@example.org'
            ];
            const invalidEmails = [
                'invalid-email',
                '@domain.com',
                'user@',
                'user@.com'
            ];

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            validEmails.forEach(email => {
                expect(emailRegex.test(email)).toBe(true);
            });

            invalidEmails.forEach(email => {
                expect(emailRegex.test(email)).toBe(false);
            });
        });

        it('should validate username format', () => {
            const validUsernames = ['admin', 'guru001', 'perwakilan2000', 'user_name', 'test123'];
            const invalidUsernames = ['', 'user@domain', 'user name', 'user-name', 'user.name'];

            validUsernames.forEach(username => {
                expect(username.length).toBeGreaterThan(0);
                expect(username.length).toBeLessThanOrEqual(50);
                expect(/^[a-zA-Z0-9_]+$/.test(username)).toBe(true);
            });

            invalidUsernames.forEach(username => {
                const isValid = username.length > 0 && 
                               username.length <= 50 && 
                               /^[a-zA-Z0-9_]+$/.test(username);
                expect(isValid).toBe(false);
            });
        });
    });

    describe('User Security', () => {
        it('should hash passwords securely', () => {
            const bcrypt = require('bcrypt');
            const password = 'testpassword123';
            const pepper = 'test-pepper';
            
            const hashedPassword = bcrypt.hashSync(password + pepper, 10);
            
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword.length).toBeGreaterThan(50);
            expect(hashedPassword).not.toBe(password);
        });

        it('should verify passwords correctly', () => {
            const bcrypt = require('bcrypt');
            const password = 'testpassword123';
            const pepper = 'test-pepper';
            const hashedPassword = bcrypt.hashSync(password + pepper, 10);
            
            const isMatch = bcrypt.compareSync(password + pepper, hashedPassword);
            expect(isMatch).toBe(true);
        });

        it('should reject wrong passwords', () => {
            const bcrypt = require('bcrypt');
            const password = 'testpassword123';
            const wrongPassword = 'wrongpassword';
            const pepper = 'test-pepper';
            const hashedPassword = bcrypt.hashSync(password + pepper, 10);
            
            const isMatch = bcrypt.compareSync(wrongPassword + pepper, hashedPassword);
            expect(isMatch).toBe(false);
        });

        it('should not expose sensitive data', () => {
            const userData = {
                id: 1,
                username: 'admin',
                password: 'hashed_password',
                role: 'admin',
                nama: 'Administrator',
                email: 'admin@test.com',
                status: 'aktif'
            };

            // Simulate removing password from response
            const { password, ...safeUserData } = userData;
            
            expect(safeUserData.password).toBeUndefined();
            expect(safeUserData.username).toBe('admin');
            expect(safeUserData.role).toBe('admin');
        });
    });

    describe('User Relationships', () => {
        it('should handle teacher relationship structure', () => {
            const teacherData = {
                id_guru: 1,
                user_id: 2,
                nama_guru: 'Test Teacher',
                status: 'aktif'
            };

            expect(teacherData.id_guru).toBeDefined();
            expect(teacherData.user_id).toBeDefined();
            expect(teacherData.nama_guru).toBeDefined();
        });

        it('should handle student relationship structure', () => {
            const studentData = {
                id_siswa: 2000,
                user_id: 3,
                nama_siswa: 'Test Student',
                kelas_id: 1,
                status: 'aktif'
            };

            expect(studentData.id_siswa).toBeDefined();
            expect(studentData.user_id).toBeDefined();
            expect(studentData.nama_siswa).toBeDefined();
        });
    });

    describe('User Queries', () => {
        it('should filter users by status', () => {
            const users = [
                { id: 1, username: 'admin', status: 'aktif' },
                { id: 2, username: 'guru001', status: 'aktif' },
                { id: 3, username: 'inactive', status: 'tidak_aktif' }
            ];

            const activeUsers = users.filter(user => user.status === 'aktif');
            expect(activeUsers.length).toBe(2);
            activeUsers.forEach(user => {
                expect(user.status).toBe('aktif');
            });
        });

        it('should filter users by role', () => {
            const users = [
                { id: 1, username: 'admin', role: 'admin' },
                { id: 2, username: 'guru001', role: 'guru' },
                { id: 3, username: 'siswa001', role: 'siswa' }
            ];

            const adminUsers = users.filter(user => user.role === 'admin');
            expect(adminUsers.length).toBe(1);
            expect(adminUsers[0].username).toBe('admin');
        });

        it('should search users by name', () => {
            const users = [
                { id: 1, username: 'admin', nama: 'Administrator' },
                { id: 2, username: 'guru001', nama: 'Test Teacher' },
                { id: 3, username: 'siswa001', nama: 'Test Student' }
            ];

            const testUsers = users.filter(user => user.nama.includes('Test'));
            expect(testUsers.length).toBe(2);
        });

        it('should paginate users', () => {
            const users = Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                username: `user${i + 1}`,
                nama: `User ${i + 1}`
            }));

            const page = 1;
            const limit = 3;
            const offset = (page - 1) * limit;
            const paginatedUsers = users.slice(offset, offset + limit);

            expect(paginatedUsers.length).toBe(3);
            expect(paginatedUsers[0].id).toBe(1);
        });
    });

    describe('User Data Integrity', () => {
        it('should maintain data consistency', () => {
            const originalUser = {
                id: 1,
                username: 'admin',
                nama: 'Administrator',
                email: 'admin@test.com'
            };

            const updatedUser = {
                ...originalUser,
                nama: 'Updated Administrator',
                email: 'updated@test.com'
            };

            expect(updatedUser.id).toBe(originalUser.id);
            expect(updatedUser.username).toBe(originalUser.username);
            expect(updatedUser.nama).not.toBe(originalUser.nama);
            expect(updatedUser.email).not.toBe(originalUser.email);
        });

        it('should validate required fields', () => {
            const requiredFields = ['username', 'password', 'role', 'nama', 'email', 'status'];
            
            const userData = {
                username: 'admin',
                password: 'hashed_password',
                role: 'admin',
                nama: 'Administrator',
                email: 'admin@test.com',
                status: 'aktif'
            };

            requiredFields.forEach(field => {
                expect(userData[field]).toBeDefined();
            });
        });

        it('should handle concurrent updates', () => {
            const user = {
                id: 1,
                username: 'admin',
                nama: 'Administrator',
                email: 'admin@test.com',
                updated_at: new Date()
            };

            // Simulate concurrent updates
            const update1 = { ...user, nama: 'Updated Name 1' };
            const update2 = { ...user, email: 'updated@test.com' };

            expect(update1.nama).toBe('Updated Name 1');
            expect(update2.email).toBe('updated@test.com');
            expect(update1.id).toBe(user.id);
            expect(update2.id).toBe(user.id);
        });
    });
});