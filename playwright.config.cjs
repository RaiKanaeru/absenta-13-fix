// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Test file patterns
  testMatch: '**/*.spec.ts',
  
  // Global setup
  globalSetup: require.resolve('./tests/globalSetup.js'),
  
  // Global teardown
  globalTeardown: require.resolve('./tests/globalTeardown.js'),
  
  // Test timeout
  timeout: 30000,
  
  // Expect timeout
  expect: {
    timeout: 5000,
  },
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
  
  // Workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  
  // Use
  use: {
    // Base URL
    baseURL: 'http://localhost:3001',
    
    // Browser context options
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Action timeout
    actionTimeout: 0,
    
    // Navigation timeout
    navigationTimeout: 0,
  },
  
  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Web server
  webServer: {
    command: 'npm run start:modern',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
