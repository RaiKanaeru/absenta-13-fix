/**
 * Debug test for UPDATE operations
 */

const { describe, it, expect } = require('@jest/globals');

describe('Debug UPDATE Operations', () => {
    let testDb;

    beforeAll(async () => {
        testDb = global.testUtils.getTestDb();
        if (!testDb) {
            console.log('⚠️  Test database not available');
            return;
        }
    });

    it('should debug UPDATE operation', async () => {
        if (!testDb) return;

        console.log('Before update:');
        const beforeUser = await testDb.get('SELECT * FROM pengguna WHERE username = ?', ['admin']);
        console.log('Before:', beforeUser);

        const newName = 'Debug Updated Name';
        const newEmail = 'debug@admin.com';

        console.log('Executing UPDATE with:', {
            sql: 'UPDATE pengguna SET nama = ?, email = ? WHERE username = ?',
            params: [newName, newEmail, 'admin']
        });

        const result = await testDb.run(
            'UPDATE pengguna SET nama = ?, email = ? WHERE username = ?',
            [newName, newEmail, 'admin']
        );

        console.log('Update result:', result);

        console.log('After update:');
        const afterUser = await testDb.get('SELECT * FROM pengguna WHERE username = ?', ['admin']);
        console.log('After:', afterUser);

        expect(result.changes).toBe(1);
        expect(afterUser.nama).toBe(newName);
        expect(afterUser.email).toBe(newEmail);
    });
});
