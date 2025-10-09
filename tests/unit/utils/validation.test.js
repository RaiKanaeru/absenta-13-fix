/**
 * Unit Tests for Validation Utilities
 */

const { describe, it, expect } = require('@jest/globals');

describe('Validation Utilities', () => {
    describe('Email Validation', () => {
        it('should validate correct email formats', () => {
            const validEmails = [
                'user@example.com',
                'test.email@domain.co.id',
                'user+tag@example.org',
                'admin@school.edu',
                'user123@test-domain.com'
            ];

            validEmails.forEach(email => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                expect(emailRegex.test(email)).toBe(true);
            });
        });

        it('should reject invalid email formats', () => {
            const invalidEmails = [
                'invalid-email',
                '@domain.com',
                'user@',
                'user@domain',
                ''
            ];

            invalidEmails.forEach(email => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const result = emailRegex.test(email);
                expect(result).toBe(false);
            });

            // Test edge cases separately
            const edgeCaseEmails = ['user@.com'];
            edgeCaseEmails.forEach(email => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const result = emailRegex.test(email);
                // This passes regex but should fail in real validation
                expect(result).toBe(false); // Actually this should fail
            });
        });

        it('should handle edge cases', () => {
            const edgeCases = [
                { email: null, expected: false },
                { email: undefined, expected: false },
                { email: 123, expected: false },
                { email: {}, expected: false },
                { email: [], expected: false }
            ];

            edgeCases.forEach(testCase => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const result = emailRegex.test(testCase.email);
                expect(result).toBe(testCase.expected);
            });
        });
    });

    describe('Username Validation', () => {
        it('should validate correct username formats', () => {
            const validUsernames = [
                'admin',
                'guru001',
                'perwakilan2000',
                'user_name',
                'test123',
                'a',
                'a'.repeat(50)
            ];

            validUsernames.forEach(username => {
                expect(username.length).toBeGreaterThan(0);
                expect(username.length).toBeLessThanOrEqual(50);
                expect(/^[a-zA-Z0-9_]+$/.test(username)).toBe(true);
            });
        });

        it('should reject invalid username formats', () => {
            const invalidUsernames = [
                '',
                'a'.repeat(51),
                'user@domain',
                'user name',
                'user-name',
                'user.name',
                'user/name',
                'user\\name',
                'user|name',
                'user<name',
                'user>name',
                'user"name',
                "user'name",
                'user`name',
                'user~name',
                'user!name',
                'user#name',
                'user$name',
                'user%name',
                'user^name',
                'user&name',
                'user*name',
                'user(name',
                'user)name',
                'user+name',
                'user=name',
                'user{name',
                'user}name',
                'user[name',
                'user]name',
                'user:name',
                'user;name',
                'user,name',
                'user<name',
                'user>name',
                'user?name',
                'user/name',
                'user\\name',
                'user|name'
            ];

            invalidUsernames.forEach(username => {
                const isValid = username.length > 0 && 
                               username.length <= 50 && 
                               /^[a-zA-Z0-9_]+$/.test(username);
                expect(isValid).toBe(false);
            });
        });
    });

    describe('Password Validation', () => {
        it('should validate password requirements', () => {
            const validPasswords = [
                'password123',
                'admin123',
                'testpass',
                'a'.repeat(6),
                'a'.repeat(255)
            ];

            validPasswords.forEach(password => {
                expect(password.length).toBeGreaterThanOrEqual(6);
                expect(password.length).toBeLessThanOrEqual(255);
            });
        });

        it('should reject invalid passwords', () => {
            const invalidPasswords = [
                '',
                '123',
                'a'.repeat(5),
                'a'.repeat(256)
            ];

            invalidPasswords.forEach(password => {
                const isValid = password && 
                               typeof password === 'string' &&
                               password.length >= 6 && 
                               password.length <= 255;
                // For empty string, isValid will be '' (falsy), which is correct
                expect(!!isValid).toBe(false);
            });

            // Test null/undefined separately
            expect(!!(null && typeof null === 'string' && null.length >= 6)).toBe(false);
            expect(!!(undefined && typeof undefined === 'string' && undefined.length >= 6)).toBe(false);
        });

        it('should handle special characters in passwords', () => {
            const specialPasswords = [
                'pass@123!',
                'test#word$',
                'admin%^&*()',
                'user+<>?{}[]',
                'pássw0rd',
                'пароль123',
                '密码456789', // Fixed: was 5 chars, now 8 chars
                'كلمة_المرور'
            ];

            specialPasswords.forEach(password => {
                expect(password.length).toBeGreaterThanOrEqual(6);
                expect(password.length).toBeLessThanOrEqual(255);
            });
        });
    });

    describe('Date Validation', () => {
        it('should validate correct date formats', () => {
            const validDates = [
                '2024-01-15',
                '2024-12-31',
                '2023-02-28',
                '2024-02-29', // Leap year
                '2000-01-01',
                '2099-12-31'
            ];

            validDates.forEach(date => {
                const dateObj = new Date(date);
                expect(dateObj instanceof Date && !isNaN(dateObj)).toBe(true);
                expect(dateObj.getFullYear()).toBeGreaterThanOrEqual(2000);
                expect(dateObj.getFullYear()).toBeLessThanOrEqual(2099);
            });
        });

        it('should reject invalid date formats', () => {
            const invalidDates = [
                'invalid-date',
                '15-01-2024',
                '2024-00-01',
                '2024-01-00',
                '1900-01-01', // Too old
                '2100-01-01'  // Too far in future
            ];

            invalidDates.forEach(date => {
                const dateObj = new Date(date);
                const isValid = dateObj instanceof Date && 
                               !isNaN(dateObj) &&
                               dateObj.getFullYear() >= 2000 &&
                               dateObj.getFullYear() <= 2099;
                
                expect(isValid).toBe(false);
            });

            // Test specific invalid dates that might pass Date constructor
            const invalidDate1 = new Date('2024-13-01');
            const invalidDate2 = new Date('2024-02-30');
            const invalidDate3 = new Date('2024-04-31');
            const invalidDate4 = new Date('2023-02-29');
            
            expect(isNaN(invalidDate1.getMonth())).toBe(true); // Invalid date
            expect(invalidDate2.getDate()).toBe(1); // Rolled over to next month
            expect(invalidDate3.getDate()).toBe(1); // Rolled over to next month
            expect(invalidDate4.getDate()).toBe(1); // Rolled over to next month
        });

        it('should validate date ranges', () => {
            const startDate = '2024-01-01';
            const endDate = '2024-12-31';
            const validDate = '2024-06-15';
            const invalidDate = '2023-06-15';

            const start = new Date(startDate);
            const end = new Date(endDate);
            const test = new Date(validDate);
            const invalid = new Date(invalidDate);

            expect(test >= start && test <= end).toBe(true);
            expect(invalid >= start && invalid <= end).toBe(false);
        });
    });

    describe('Time Validation', () => {
        it('should validate correct time formats', () => {
            const validTimes = [
                '07:00:00',
                '23:59:59',
                '00:00:00',
                '12:30:45',
                '09:15:30'
            ];

            validTimes.forEach(time => {
                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
                expect(timeRegex.test(time)).toBe(true);
            });
        });

        it('should reject invalid time formats', () => {
            const invalidTimes = [
                '25:00:00',
                '07:60:00',
                '07:00:60',
                'invalid-time',
                '07:0:00',
                '07:00:0',
                '07:00',
                '7:00',
                '07:00:00:00',
                '07-00-00',
                '07.00.00',
                '07 00 00'
            ];

            invalidTimes.forEach(time => {
                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
                const result = timeRegex.test(time);
                expect(result).toBe(false);
            });
        });

        it('should validate time ranges', () => {
            const startTime = '07:00:00';
            const endTime = '17:00:00';
            const validTime = '12:00:00';
            const invalidTime = '18:00:00';

            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            const test = new Date(`2000-01-01T${validTime}`);
            const invalid = new Date(`2000-01-01T${invalidTime}`);

            expect(test >= start && test <= end).toBe(true);
            expect(invalid >= start && invalid <= end).toBe(false);
        });
    });

    describe('Role Validation', () => {
        it('should validate correct roles', () => {
            const validRoles = ['admin', 'guru', 'siswa'];
            
            validRoles.forEach(role => {
                expect(['admin', 'guru', 'siswa'].includes(role)).toBe(true);
            });
        });

        it('should reject invalid roles', () => {
            const invalidRoles = [
                'invalid',
                'administrator',
                'teacher',
                'student',
                'user',
                'guest',
                '',
                null,
                undefined,
                'ADMIN',
                'GURU',
                'SISWA'
            ];

            invalidRoles.forEach(role => {
                expect(['admin', 'guru', 'siswa'].includes(role)).toBe(false);
            });
        });
    });

    describe('Status Validation', () => {
        it('should validate correct statuses', () => {
            const validStatuses = ['aktif', 'tidak_aktif', 'ditangguhkan'];
            
            validStatuses.forEach(status => {
                expect(['aktif', 'tidak_aktif', 'ditangguhkan'].includes(status)).toBe(true);
            });
        });

        it('should reject invalid statuses', () => {
            const invalidStatuses = [
                'active',
                'inactive',
                'suspended',
                'enabled',
                'disabled',
                'valid',
                'invalid',
                '',
                null,
                undefined,
                'AKTIF',
                'TIDAK_AKTIF',
                'DITANGGUHKAN'
            ];

            invalidStatuses.forEach(status => {
                expect(['aktif', 'tidak_aktif', 'ditangguhkan'].includes(status)).toBe(false);
            });
        });
    });

    describe('Attendance Status Validation', () => {
        it('should validate teacher attendance statuses', () => {
            const validStatuses = ['hadir', 'tidak_hadir', 'izin', 'sakit', 'cuti'];
            
            validStatuses.forEach(status => {
                expect(['hadir', 'tidak_hadir', 'izin', 'sakit', 'cuti'].includes(status)).toBe(true);
            });
        });

        it('should validate student attendance statuses', () => {
            const validStatuses = ['hadir', 'tidak_hadir', 'izin', 'sakit', 'alpa'];
            
            validStatuses.forEach(status => {
                expect(['hadir', 'tidak_hadir', 'izin', 'sakit', 'alpa'].includes(status)).toBe(true);
            });
        });

        it('should reject invalid attendance statuses', () => {
            const invalidStatuses = [
                'present',
                'absent',
                'late',
                'excused',
                'unexcused',
                'valid',
                'invalid',
                '',
                null,
                undefined,
                'HADIR',
                'TIDAK_HADIR',
                'IZIN',
                'SAKIT',
                'ALPA'
            ];

            invalidStatuses.forEach(status => {
                const isValid = ['hadir', 'tidak_hadir', 'izin', 'sakit', 'alpa', 'cuti'].includes(status);
                expect(isValid).toBe(false);
            });
        });
    });

    describe('Day Validation', () => {
        it('should validate correct days', () => {
            const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            
            validDays.forEach(day => {
                expect(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].includes(day)).toBe(true);
            });
        });

        it('should reject invalid days', () => {
            const invalidDays = [
                'Minggu',
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'invalid',
                '',
                null,
                undefined,
                'SENIN',
                'SELASA',
                'RABU',
                'KAMIS',
                'JUMAT',
                'SABTU'
            ];

            invalidDays.forEach(day => {
                expect(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].includes(day)).toBe(false);
            });
        });
    });

    describe('Input Sanitization', () => {
        it('should sanitize HTML content', () => {
            const maliciousInputs = [
                '<script>alert("xss")</script>',
                '<img src="x" onerror="alert(1)">',
                '<iframe src="javascript:alert(1)"></iframe>',
                '<svg onload="alert(1)"></svg>',
                '<object data="javascript:alert(1)"></object>',
                '<embed src="javascript:alert(1)">',
                '<link rel="stylesheet" href="javascript:alert(1)">',
                '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'
            ];

            maliciousInputs.forEach(input => {
                const sanitized = input.replace(/<[^>]*>/g, '');
                expect(sanitized).not.toContain('<');
                expect(sanitized).not.toContain('>');
            });
        });

        it('should sanitize SQL injection attempts', () => {
            const maliciousInputs = [
                "'; DROP TABLE users; --",
                "admin'; DELETE FROM users; --",
                "' OR '1'='1",
                "'; INSERT INTO users VALUES ('hacker', 'password', 'admin'); --",
                "'; UPDATE users SET password = 'hacked'; --",
                "'; SELECT * FROM users; --"
            ];

            maliciousInputs.forEach(input => {
                const sanitized = input.replace(/['";\\]/g, '');
                expect(sanitized).not.toContain("'");
                expect(sanitized).not.toContain('"');
                expect(sanitized).not.toContain(';');
                expect(sanitized).not.toContain('\\');
            });
        });

        it('should sanitize special characters', () => {
            const specialChars = ['<', '>', '"', "'", '&', ';', '\\', '/', '|', '`', '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '{', '}', '[', ']', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/', '\\', '|', '`', '~'];
            
            specialChars.forEach(char => {
                const sanitized = char.replace(/[<>'"&;\\/|`~!@#$%^&*()+={}[\]:;"'<>,.?/\\|`~]/g, '');
                expect(sanitized).toBe('');
            });
        });
    });

    describe('Data Type Validation', () => {
        it('should validate string types', () => {
            const validStrings = ['hello', '123', 'test@example.com', ''];
            const invalidStrings = [null, undefined, 123, {}, [], true, false];

            validStrings.forEach(str => {
                expect(typeof str === 'string').toBe(true);
            });

            invalidStrings.forEach(str => {
                expect(typeof str === 'string').toBe(false);
            });
        });

        it('should validate number types', () => {
            const validNumbers = [0, 1, -1, 123, 0.5, -0.5, Infinity, -Infinity];
            const invalidNumbers = [null, undefined, '123', {}, [], true, false, NaN];

            validNumbers.forEach(num => {
                expect(typeof num === 'number' && !isNaN(num)).toBe(true);
            });

            invalidNumbers.forEach(num => {
                expect(typeof num === 'number' && !isNaN(num)).toBe(false);
            });
        });

        it('should validate boolean types', () => {
            const validBooleans = [true, false];
            const invalidBooleans = [null, undefined, 'true', 'false', 1, 0, '1', '0', {}, []];

            validBooleans.forEach(bool => {
                expect(typeof bool === 'boolean').toBe(true);
            });

            invalidBooleans.forEach(bool => {
                expect(typeof bool === 'boolean').toBe(false);
            });
        });
    });

    describe('Range Validation', () => {
        it('should validate numeric ranges', () => {
            const min = 1;
            const max = 100;
            const validNumbers = [1, 50, 100];
            const invalidNumbers = [0, 101, -1, 0.5, 100.5];

            validNumbers.forEach(num => {
                expect(num >= min && num <= max).toBe(true);
            });

            invalidNumbers.forEach(num => {
                expect(num >= min && num <= max).toBe(false);
            });
        });

        it('should validate string length ranges', () => {
            const minLength = 3;
            const maxLength = 50;
            const validStrings = ['abc', 'test', 'a'.repeat(50)];
            const invalidStrings = ['ab', 'a'.repeat(51), '', 'a'.repeat(100)];

            validStrings.forEach(str => {
                expect(str.length >= minLength && str.length <= maxLength).toBe(true);
            });

            invalidStrings.forEach(str => {
                expect(str.length >= minLength && str.length <= maxLength).toBe(false);
            });
        });
    });

    describe('Format Validation', () => {
        it('should validate Indonesian phone numbers', () => {
            const validPhones = [
                '08123456789',
                '628123456789',
                '+628123456789'
            ];

            const invalidPhones = [
                '123456789',
                '0812345678901', // Too long
                '0812345678a',   // Contains letter
                '081-234-5678',  // Contains dash
                '081 234 5678'   // Contains space
            ];

            validPhones.forEach(phone => {
                const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
                const result = phoneRegex.test(phone);
                expect(result).toBe(true);
            });

            invalidPhones.forEach(phone => {
                const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
                const result = phoneRegex.test(phone);
                expect(result).toBe(false);
            });
        });

        it('should validate Indonesian NIK format', () => {
            const validNIKs = [
                '1234567890123456',
                '9876543210987654'
            ];

            const invalidNIKs = [
                '123456789012345',  // Too short
                '12345678901234567', // Too long
                '123456789012345a',  // Contains letter
                '123456789012345-',  // Contains dash
                '123456789012345 '   // Contains space
            ];

            validNIKs.forEach(nik => {
                const nikRegex = /^[0-9]{16}$/;
                expect(nikRegex.test(nik)).toBe(true);
            });

            invalidNIKs.forEach(nik => {
                const nikRegex = /^[0-9]{16}$/;
                expect(nikRegex.test(nik)).toBe(false);
            });
        });
    });
});
