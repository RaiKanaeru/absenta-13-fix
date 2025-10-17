/**
 * E2E Tests untuk Critical Flows
 * Test end-to-end untuk alur bisnis utama sistem Absenta
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';

// Test credentials
const TEST_CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123' },
  guru: { username: 'guru001', password: 'admin123' },
  siswa: { username: 'perwakilan2000', password: 'admin123' }
};

test.describe('Absenta E2E Tests', () => {
  test.describe('Authentication Flow', () => {
    test('should complete admin login flow', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check login form is visible
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      
      // Fill login form
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.admin.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.admin.password);
      
      // Submit login
      await page.click('[data-testid="login-button"]');
      
      // Wait for redirect to admin dashboard
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-menu"]')).toContainText('admin');
    });

    test('should complete guru login flow', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.guru.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.guru.password);
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="teacher-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-menu"]')).toContainText('guru');
    });

    test('should complete siswa login flow', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.siswa.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.siswa.password);
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-menu"]')).toContainText('siswa');
    });

    test('should handle invalid credentials', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await page.fill('[data-testid="username-input"]', 'invalid');
      await page.fill('[data-testid="password-input"]', 'wrong');
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto(BASE_URL);
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.admin.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      
      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      
      // Should redirect to login page
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });
  });

  test.describe('Admin Management Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto(BASE_URL);
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.admin.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });

    test('should create new teacher', async ({ page }) => {
      // Navigate to teacher management
      await page.click('[data-testid="teacher-management-menu"]');
      await expect(page.locator('[data-testid="teacher-management"]')).toBeVisible();
      
      // Click add teacher button
      await page.click('[data-testid="add-teacher-button"]');
      await expect(page.locator('[data-testid="teacher-form"]')).toBeVisible();
      
      // Fill teacher form
      await page.fill('[data-testid="teacher-username"]', 'testguru');
      await page.fill('[data-testid="teacher-password"]', 'testpass123');
      await page.fill('[data-testid="teacher-name"]', 'Test Guru');
      await page.fill('[data-testid="teacher-email"]', 'testguru@example.com');
      await page.fill('[data-testid="teacher-nip"]', '123456789');
      await page.selectOption('[data-testid="teacher-role"]', 'guru');
      
      // Submit form
      await page.click('[data-testid="submit-teacher"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Teacher created successfully');
    });

    test('should create new student', async ({ page }) => {
      // Navigate to student management
      await page.click('[data-testid="student-management-menu"]');
      await expect(page.locator('[data-testid="student-management"]')).toBeVisible();
      
      // Click add student button
      await page.click('[data-testid="add-student-button"]');
      await expect(page.locator('[data-testid="student-form"]')).toBeVisible();
      
      // Fill student form
      await page.fill('[data-testid="student-username"]', 'testsiswa');
      await page.fill('[data-testid="student-password"]', 'testpass123');
      await page.fill('[data-testid="student-name"]', 'Test Siswa');
      await page.fill('[data-testid="student-nis"]', '123456');
      await page.selectOption('[data-testid="student-class"]', '1');
      
      // Submit form
      await page.click('[data-testid="submit-student"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should create new subject', async ({ page }) => {
      // Navigate to subject management
      await page.click('[data-testid="subject-management-menu"]');
      await expect(page.locator('[data-testid="subject-management"]')).toBeVisible();
      
      // Click add subject button
      await page.click('[data-testid="add-subject-button"]');
      await expect(page.locator('[data-testid="subject-form"]')).toBeVisible();
      
      // Fill subject form
      await page.fill('[data-testid="subject-code"]', 'TEST');
      await page.fill('[data-testid="subject-name"]', 'Test Subject');
      await page.fill('[data-testid="subject-description"]', 'Test Description');
      
      // Submit form
      await page.click('[data-testid="submit-subject"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should create new class', async ({ page }) => {
      // Navigate to class management
      await page.click('[data-testid="class-management-menu"]');
      await expect(page.locator('[data-testid="class-management"]')).toBeVisible();
      
      // Click add class button
      await page.click('[data-testid="add-class-button"]');
      await expect(page.locator('[data-testid="class-form"]')).toBeVisible();
      
      // Fill class form
      await page.fill('[data-testid="class-name"]', 'Test Class');
      await page.fill('[data-testid="class-level"]', 'X');
      await page.fill('[data-testid="class-room"]', 'A1');
      await page.fill('[data-testid="class-capacity"]', '30');
      
      // Submit form
      await page.click('[data-testid="submit-class"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('Teacher Attendance Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login as teacher
      await page.goto(BASE_URL);
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.guru.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.guru.password);
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="teacher-dashboard"]')).toBeVisible();
    });

    test('should record student attendance', async ({ page }) => {
      // Navigate to attendance
      await page.click('[data-testid="attendance-menu"]');
      await expect(page.locator('[data-testid="attendance-view"]')).toBeVisible();
      
      // Select schedule
      await page.click('[data-testid="schedule-item"]');
      await expect(page.locator('[data-testid="student-list"]')).toBeVisible();
      
      // Record attendance for first student
      const firstStudent = page.locator('[data-testid="student-item"]').first();
      await firstStudent.locator('[data-testid="status-hadir"]').click();
      
      // Add note
      await firstStudent.locator('[data-testid="attendance-note"]').fill('Present');
      
      // Submit attendance
      await page.click('[data-testid="submit-attendance"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should view attendance history', async ({ page }) => {
      // Navigate to history
      await page.click('[data-testid="history-menu"]');
      await expect(page.locator('[data-testid="attendance-history"]')).toBeVisible();
      
      // Check if history data is displayed
      await expect(page.locator('[data-testid="history-table"]')).toBeVisible();
    });
  });

  test.describe('Student Permission Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login as student
      await page.goto(BASE_URL);
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.siswa.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.siswa.password);
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
    });

    test('should submit permission request', async ({ page }) => {
      // Navigate to permission
      await page.click('[data-testid="permission-menu"]');
      await expect(page.locator('[data-testid="permission-view"]')).toBeVisible();
      
      // Click new permission button
      await page.click('[data-testid="new-permission-button"]');
      await expect(page.locator('[data-testid="permission-form"]')).toBeVisible();
      
      // Fill permission form
      await page.fill('[data-testid="permission-date"]', '2024-01-15');
      await page.selectOption('[data-testid="permission-type"]', 'sakit');
      await page.fill('[data-testid="permission-reason"]', 'Sakit demam');
      await page.selectOption('[data-testid="permission-schedule"]', '1');
      
      // Submit permission
      await page.click('[data-testid="submit-permission"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should submit dispute request', async ({ page }) => {
      // Navigate to dispute
      await page.click('[data-testid="dispute-menu"]');
      await expect(page.locator('[data-testid="dispute-view"]')).toBeVisible();
      
      // Click new dispute button
      await page.click('[data-testid="new-dispute-button"]');
      await expect(page.locator('[data-testid="dispute-form"]')).toBeVisible();
      
      // Fill dispute form
      await page.fill('[data-testid="dispute-date"]', '2024-01-15');
      await page.selectOption('[data-testid="dispute-schedule"]', '1');
      await page.selectOption('[data-testid="dispute-status"]', 'Hadir');
      await page.fill('[data-testid="dispute-reason"]', 'Actually present');
      
      // Submit dispute
      await page.click('[data-testid="submit-dispute"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('Report Generation Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto(BASE_URL);
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.admin.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });

    test('should generate attendance report', async ({ page }) => {
      // Navigate to reports
      await page.click('[data-testid="reports-menu"]');
      await expect(page.locator('[data-testid="reports-view"]')).toBeVisible();
      
      // Select report type
      await page.selectOption('[data-testid="report-type"]', 'attendance');
      
      // Set date range
      await page.fill('[data-testid="start-date"]', '2024-01-01');
      await page.fill('[data-testid="end-date"]', '2024-01-31');
      
      // Select class
      await page.selectOption('[data-testid="report-class"]', '1');
      
      // Generate report
      await page.click('[data-testid="generate-report"]');
      
      // Wait for report to load
      await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
      
      // Export report
      await page.click('[data-testid="export-excel"]');
      
      // Verify download started
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toContain('.xlsx');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(BASE_URL);
      
      // Check if mobile menu is visible
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // Login
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.admin.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      // Check if dashboard is responsive
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      
      // Check if mobile menu works
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto(BASE_URL);
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.admin.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Simulate server error
      await page.route('**/api/**', route => route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' })
      }));
      
      await page.goto(BASE_URL);
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.admin.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(BASE_URL);
      await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.admin.username);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle multiple concurrent users', async ({ browser }) => {
      const contexts = [];
      const pages = [];
      
      // Create multiple browser contexts
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }
      
      // Login all users simultaneously
      const loginPromises = pages.map(async (page, index) => {
        await page.goto(BASE_URL);
        await page.fill('[data-testid="username-input"]', TEST_CREDENTIALS.admin.username);
        await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.admin.password);
        await page.click('[data-testid="login-button"]');
        await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      });
      
      await Promise.all(loginPromises);
      
      // Clean up
      await Promise.all(contexts.map(context => context.close()));
    });
  });
});
