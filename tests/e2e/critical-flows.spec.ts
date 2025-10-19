/**
 * End-to-End Tests for Critical User Flows
 */

import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:3001');
    });

    test.describe('Authentication Flow', () => {
        test('should complete admin login flow', async ({ page }) => {
            // Navigate to login page
            await page.goto('http://localhost:3001/login');
            
            // Fill login form
            await page.fill('input[name="username"]', 'admin');
            await page.fill('input[name="password"]', 'admin123');
            
            // Submit form
            await page.click('button[type="submit"]');
            
            // Wait for redirect to dashboard
            await page.waitForURL('**/admin/dashboard');
            
            // Verify admin dashboard elements
            await expect(page.locator('h1')).toContainText('Admin Dashboard');
            await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
        });

        test('should complete teacher login flow', async ({ page }) => {
            // Navigate to login page
            await page.goto('http://localhost:3001/login');
            
            // Fill login form
            await page.fill('input[name="username"]', 'guru001');
            await page.fill('input[name="password"]', 'guru123');
            
            // Submit form
            await page.click('button[type="submit"]');
            
            // Wait for redirect to teacher dashboard
            await page.waitForURL('**/teacher/dashboard');
            
            // Verify teacher dashboard elements
            await expect(page.locator('h1')).toContainText('Teacher Dashboard');
            await expect(page.locator('[data-testid="attendance-form"]')).toBeVisible();
        });

        test('should complete student login flow', async ({ page }) => {
            // Navigate to login page
            await page.goto('http://localhost:3001/login');
            
            // Fill login form
            await page.fill('input[name="username"]', 'perwakilan2000');
            await page.fill('input[name="password"]', 'siswa123');
            
            // Submit form
            await page.click('button[type="submit"]');
            
            // Wait for redirect to student dashboard
            await page.waitForURL('**/student/dashboard');
            
            // Verify student dashboard elements
            await expect(page.locator('h1')).toContainText('Student Dashboard');
            await expect(page.locator('[data-testid="attendance-view"]')).toBeVisible();
        });

        test('should handle invalid login credentials', async ({ page }) => {
            // Navigate to login page
            await page.goto('http://localhost:3001/login');
            
            // Fill login form with invalid credentials
            await page.fill('input[name="username"]', 'invaliduser');
            await page.fill('input[name="password"]', 'wrongpassword');
            
            // Submit form
            await page.click('button[type="submit"]');
            
            // Verify error message
            await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
            await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
        });

        test('should handle logout flow', async ({ page }) => {
            // Login first
            await page.goto('http://localhost:3001/login');
            await page.fill('input[name="username"]', 'admin');
            await page.fill('input[name="password"]', 'admin123');
            await page.click('button[type="submit"]');
            
            // Wait for dashboard
            await page.waitForURL('**/admin/dashboard');
            
            // Click logout
            await page.click('[data-testid="logout-button"]');
            
            // Verify redirect to login page
            await page.waitForURL('**/login');
            await expect(page.locator('h1')).toContainText('Login');
        });
    });

    test.describe('Admin Management Flow', () => {
        test.beforeEach(async ({ page }) => {
            // Login as admin
            await page.goto('http://localhost:3001/login');
            await page.fill('input[name="username"]', 'admin');
            await page.fill('input[name="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/admin/dashboard');
        });

        test('should create new teacher', async ({ page }) => {
            // Navigate to teachers page
            await page.click('[data-testid="nav-teachers"]');
            await page.waitForURL('**/admin/teachers');
            
            // Click add teacher button
            await page.click('[data-testid="add-teacher-button"]');
            
            // Fill teacher form
            await page.fill('input[name="id_guru"]', '999');
            await page.fill('input[name="nama_guru"]', 'New Teacher');
            await page.fill('input[name="email"]', 'newteacher@test.com');
            await page.selectOption('select[name="status"]', 'aktif');
            
            // Submit form
            await page.click('button[type="submit"]');
            
            // Verify success message
            await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
            await expect(page.locator('[data-testid="success-message"]')).toContainText('Teacher created successfully');
        });

        test('should create new student', async ({ page }) => {
            // Navigate to students page
            await page.click('[data-testid="nav-students"]');
            await page.waitForURL('**/admin/students');
            
            // Click add student button
            await page.click('[data-testid="add-student-button"]');
            
            // Fill student form
            await page.fill('input[name="id_siswa"]', '9999');
            await page.fill('input[name="nama_siswa"]', 'New Student');
            await page.selectOption('select[name="kelas_id"]', '1');
            await page.selectOption('select[name="status"]', 'aktif');
            
            // Submit form
            await page.click('button[type="submit"]');
            
            // Verify success message
            await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
            await expect(page.locator('[data-testid="success-message"]')).toContainText('Student created successfully');
        });

        test('should create new schedule', async ({ page }) => {
            // Navigate to schedules page
            await page.click('[data-testid="nav-schedules"]');
            await page.waitForURL('**/admin/schedules');
            
            // Click add schedule button
            await page.click('[data-testid="add-schedule-button"]');
            
            // Fill schedule form
            await page.selectOption('select[name="guru_id"]', '1');
            await page.selectOption('select[name="kelas_id"]', '1');
            await page.selectOption('select[name="mapel_id"]', '1');
            await page.selectOption('select[name="hari"]', 'Senin');
            await page.fill('input[name="jam_mulai"]', '07:00');
            await page.fill('input[name="jam_selesai"]', '07:45');
            
            // Submit form
            await page.click('button[type="submit"]');
            
            // Verify success message
            await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
            await expect(page.locator('[data-testid="success-message"]')).toContainText('Schedule created successfully');
        });

        test('should import schedule from Excel', async ({ page }) => {
            // Navigate to schedule import page
            await page.click('[data-testid="nav-schedule-import"]');
            await page.waitForURL('**/admin/schedule-import');
            
            // Upload Excel file
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles('tests/fixtures/sample-schedule.xlsx');
            
            // Click import button
            await page.click('[data-testid="import-button"]');
            
            // Wait for processing
            await page.waitForSelector('[data-testid="import-progress"]');
            
            // Verify success message
            await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
            await expect(page.locator('[data-testid="success-message"]')).toContainText('Schedule imported successfully');
        });
    });

    test.describe('Teacher Attendance Flow', () => {
        test.beforeEach(async ({ page }) => {
            // Login as teacher
            await page.goto('http://localhost:3001/login');
            await page.fill('input[name="username"]', 'guru001');
            await page.fill('input[name="password"]', 'guru123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/teacher/dashboard');
        });

        test('should record teacher attendance', async ({ page }) => {
            // Navigate to attendance page
            await page.click('[data-testid="nav-attendance"]');
            await page.waitForURL('**/teacher/attendance');
            
            // Select date
            await page.fill('input[name="tanggal"]', '2024-01-15');
            
            // Select schedule
            await page.selectOption('select[name="jadwal_id"]', '1');
            
            // Select status
            await page.selectOption('select[name="status"]', 'hadir');
            
            // Add note
            await page.fill('textarea[name="keterangan"]', 'Mengajar normal');
            
            // Submit attendance
            await page.click('button[type="submit"]');
            
            // Verify success message
            await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
            await expect(page.locator('[data-testid="success-message"]')).toContainText('Attendance recorded successfully');
        });

        test('should view attendance history', async ({ page }) => {
            // Navigate to attendance history
            await page.click('[data-testid="nav-attendance-history"]');
            await page.waitForURL('**/teacher/attendance-history');
            
            // Verify attendance records are displayed
            await expect(page.locator('[data-testid="attendance-table"]')).toBeVisible();
            await expect(page.locator('[data-testid="attendance-table"] tbody tr')).toHaveCount.greaterThan(0);
        });

        test('should filter attendance by date range', async ({ page }) => {
            // Navigate to attendance history
            await page.click('[data-testid="nav-attendance-history"]');
            await page.waitForURL('**/teacher/attendance-history');
            
            // Set date range
            await page.fill('input[name="start_date"]', '2024-01-01');
            await page.fill('input[name="end_date"]', '2024-01-31');
            
            // Apply filter
            await page.click('[data-testid="filter-button"]');
            
            // Verify filtered results
            await expect(page.locator('[data-testid="attendance-table"] tbody tr')).toHaveCount.greaterThan(0);
        });
    });

    test.describe('Student Attendance Flow', () => {
        test.beforeEach(async ({ page }) => {
            // Login as student
            await page.goto('http://localhost:3001/login');
            await page.fill('input[name="username"]', 'perwakilan2000');
            await page.fill('input[name="password"]', 'siswa123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/student/dashboard');
        });

        test('should view personal attendance', async ({ page }) => {
            // Navigate to attendance page
            await page.click('[data-testid="nav-attendance"]');
            await page.waitForURL('**/student/attendance');
            
            // Verify attendance records are displayed
            await expect(page.locator('[data-testid="attendance-table"]')).toBeVisible();
            await expect(page.locator('[data-testid="attendance-table"] tbody tr')).toHaveCount.greaterThan(0);
        });

        test('should view attendance summary', async ({ page }) => {
            // Navigate to attendance summary
            await page.click('[data-testid="nav-attendance-summary"]');
            await page.waitForURL('**/student/attendance-summary');
            
            // Verify summary statistics
            await expect(page.locator('[data-testid="attendance-stats"]')).toBeVisible();
            await expect(page.locator('[data-testid="attendance-percentage"]')).toBeVisible();
        });

        test('should view schedule', async ({ page }) => {
            // Navigate to schedule page
            await page.click('[data-testid="nav-schedule"]');
            await page.waitForURL('**/student/schedule');
            
            // Verify schedule is displayed
            await expect(page.locator('[data-testid="schedule-table"]')).toBeVisible();
            await expect(page.locator('[data-testid="schedule-table"] tbody tr')).toHaveCount.greaterThan(0);
        });
    });

    test.describe('Report Generation Flow', () => {
        test.beforeEach(async ({ page }) => {
            // Login as admin
            await page.goto('http://localhost:3001/login');
            await page.fill('input[name="username"]', 'admin');
            await page.fill('input[name="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/admin/dashboard');
        });

        test('should generate attendance report', async ({ page }) => {
            // Navigate to reports page
            await page.click('[data-testid="nav-reports"]');
            await page.waitForURL('**/admin/reports');
            
            // Select report type
            await page.selectOption('select[name="report_type"]', 'attendance');
            
            // Set date range
            await page.fill('input[name="start_date"]', '2024-01-01');
            await page.fill('input[name="end_date"]', '2024-01-31');
            
            // Generate report
            await page.click('[data-testid="generate-report-button"]');
            
            // Wait for report generation
            await page.waitForSelector('[data-testid="report-progress"]');
            
            // Verify report is displayed
            await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
        });

        test('should export report to Excel', async ({ page }) => {
            // Navigate to reports page
            await page.click('[data-testid="nav-reports"]');
            await page.waitForURL('**/admin/reports');
            
            // Select report type
            await page.selectOption('select[name="report_type"]', 'attendance');
            
            // Set date range
            await page.fill('input[name="start_date"]', '2024-01-01');
            await page.fill('input[name="end_date"]', '2024-01-31');
            
            // Generate report
            await page.click('[data-testid="generate-report-button"]');
            
            // Wait for report generation
            await page.waitForSelector('[data-testid="report-content"]');
            
            // Export to Excel
            await page.click('[data-testid="export-excel-button"]');
            
            // Verify download starts
            const downloadPromise = page.waitForEvent('download');
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toContain('.xlsx');
        });
    });

    test.describe('Error Handling Flow', () => {
        test('should handle network errors gracefully', async ({ page }) => {
            // Mock network failure
            await page.route('**/api/**', route => route.abort());
            
            // Navigate to login page
            await page.goto('http://localhost:3001/login');
            
            // Try to login
            await page.fill('input[name="username"]', 'admin');
            await page.fill('input[name="password"]', 'admin123');
            await page.click('button[type="submit"]');
            
            // Verify error handling
            await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
            await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
        });

        test('should handle validation errors', async ({ page }) => {
            // Navigate to login page
            await page.goto('http://localhost:3001/login');
            
            // Try to login with invalid data
            await page.fill('input[name="username"]', '');
            await page.fill('input[name="password"]', '');
            await page.click('button[type="submit"]');
            
            // Verify validation errors
            await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
        });

        test('should handle session timeout', async ({ page }) => {
            // Login first
            await page.goto('http://localhost:3001/login');
            await page.fill('input[name="username"]', 'admin');
            await page.fill('input[name="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/admin/dashboard');
            
            // Mock session timeout
            await page.evaluate(() => {
                localStorage.removeItem('token');
            });
            
            // Try to access protected page
            await page.goto('http://localhost:3001/admin/dashboard');
            
            // Verify redirect to login
            await page.waitForURL('**/login');
        });
    });

    test.describe('Responsive Design Flow', () => {
        test('should work on mobile devices', async ({ page }) => {
            // Set mobile viewport
            await page.setViewportSize({ width: 375, height: 667 });
            
            // Navigate to login page
            await page.goto('http://localhost:3001/login');
            
            // Verify mobile layout
            await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
            
            // Login
            await page.fill('input[name="username"]', 'admin');
            await page.fill('input[name="password"]', 'admin123');
            await page.click('button[type="submit"]');
            
            // Verify mobile dashboard
            await page.waitForURL('**/admin/dashboard');
            await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
        });

        test('should work on tablet devices', async ({ page }) => {
            // Set tablet viewport
            await page.setViewportSize({ width: 768, height: 1024 });
            
            // Navigate to login page
            await page.goto('http://localhost:3001/login');
            
            // Verify tablet layout
            await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
            
            // Login
            await page.fill('input[name="username"]', 'admin');
            await page.fill('input[name="password"]', 'admin123');
            await page.click('button[type="submit"]');
            
            // Verify tablet dashboard
            await page.waitForURL('**/admin/dashboard');
            await expect(page.locator('[data-testid="tablet-dashboard"]')).toBeVisible();
        });
    });

    test.describe('Performance Flow', () => {
        test('should load pages within acceptable time', async ({ page }) => {
            // Measure page load time
            const startTime = Date.now();
            await page.goto('http://localhost:3001/login');
            const endTime = Date.now();
            
            const loadTime = endTime - startTime;
            expect(loadTime).toBeLessThan(3000); // Less than 3 seconds
        });

        test('should handle multiple concurrent users', async ({ browser }) => {
            // Create multiple browser contexts
            const contexts = await Promise.all([
                browser.newContext(),
                browser.newContext(),
                browser.newContext()
            ]);
            
            const pages = await Promise.all(contexts.map(context => context.newPage()));
            
            // Login with multiple users simultaneously
            const loginPromises = pages.map(async (page, index) => {
                await page.goto('http://localhost:3001/login');
                await page.fill('input[name="username"]', 'admin');
                await page.fill('input[name="password"]', 'admin123');
                await page.click('button[type="submit"]');
                await page.waitForURL('**/admin/dashboard');
            });
            
            await Promise.all(loginPromises);
            
            // Verify all users are logged in
            for (const page of pages) {
                await expect(page.locator('h1')).toContainText('Admin Dashboard');
            }
            
            // Clean up
            await Promise.all(contexts.map(context => context.close()));
        });
    });
});
