// tests/globalTeardown.js
import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up test files
  const testFiles = [
    'test.db',
    'test.db-journal',
    'logs/test.log',
  ];
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
  
  // Clean up test directories
  const testDirs = [
    'tests/fixtures/temp',
    'coverage/temp',
  ];
  
  testDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
  
  console.log('✅ Test environment cleanup complete');
}
