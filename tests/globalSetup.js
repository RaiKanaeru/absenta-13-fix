// tests/globalSetup.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  console.log('🚀 Setting up test environment...');
  
  // Create test database if it doesn't exist
  const testDbPath = path.join(process.cwd(), 'test.db');
  if (!fs.existsSync(testDbPath)) {
    console.log('📊 Creating test database...');
    // You can add database setup logic here if needed
  }
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'absenta_test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.PORT = '3002'; // Use different port for tests
  
  // Create test directories
  const testDirs = [
    'tests/unit',
    'tests/integration', 
    'tests/security',
    'tests/fixtures',
    'tests/mocks',
    'coverage',
    'coverage/html-report',
  ];
  
  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  console.log('✅ Test environment setup complete');
}
