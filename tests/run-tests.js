// tests/run-tests.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const runCommand = (command, description) => {
  log(`\n${colors.blue}${description}${colors.reset}`);
  log(`Running: ${command}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    if (output) {
      console.log(output);
    }
    
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed:`, 'red');
    console.error(error.message);
    return false;
  }
};

const checkCoverage = () => {
  const coverageFile = path.join(process.cwd(), 'coverage', 'lcov-report', 'index.html');
  if (fs.existsSync(coverageFile)) {
    log(`📊 Coverage report available at: ${coverageFile}`, 'blue');
  }
};

const main = async () => {
  log(`${colors.bold}${colors.blue}🧪 Running Absenta Test Suite${colors.reset}\n`);
  
  const startTime = Date.now();
  let allPassed = true;
  
  // Test categories
  const testCategories = [
    {
      name: 'Unit Tests',
      command: 'npm run test:unit',
      description: 'Running unit tests for components and utilities'
    },
    {
      name: 'Integration Tests', 
      command: 'npm run test:integration',
      description: 'Running integration tests for API endpoints'
    },
    {
      name: 'Security Tests',
      command: 'npm run test:security', 
      description: 'Running security tests for authentication and authorization'
    }
  ];
  
  // Run each test category
  for (const category of testCategories) {
    log(`\n${colors.bold}${colors.yellow}📋 ${category.name}${colors.reset}`);
    const passed = runCommand(category.command, category.description);
    if (!passed) {
      allPassed = false;
    }
  }
  
  // Run coverage analysis
  log(`\n${colors.bold}${colors.yellow}📊 Coverage Analysis${colors.reset}`);
  const coveragePassed = runCommand('npm run test:coverage', 'Generating test coverage report');
  if (!coveragePassed) {
    allPassed = false;
  }
  
  // Run linting
  log(`\n${colors.bold}${colors.yellow}🔍 Code Quality${colors.reset}`);
  const lintPassed = runCommand('npm run test:lint', 'Running ESLint checks');
  if (!lintPassed) {
    allPassed = false;
  }
  
  // Run type checking
  const typeCheckPassed = runCommand('npm run test:type-check', 'Running TypeScript type checks');
  if (!typeCheckPassed) {
    allPassed = false;
  }
  
  // Performance tests
  log(`\n${colors.bold}${colors.yellow}⚡ Performance Tests${colors.reset}`);
  const perfPassed = runCommand('npm run test:performance', 'Running performance tests');
  if (!perfPassed) {
    allPassed = false;
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Summary
  log(`\n${colors.bold}${colors.blue}📋 Test Summary${colors.reset}`);
  log(`Duration: ${duration}s`);
  log(`Status: ${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`, allPassed ? 'green' : 'red');
  
  if (allPassed) {
    log(`\n${colors.bold}${colors.green}🎉 All tests completed successfully!${colors.reset}`);
    checkCoverage();
  } else {
    log(`\n${colors.bold}${colors.red}💥 Some tests failed. Please check the output above.${colors.reset}`);
    process.exit(1);
  }
};

// Handle errors
process.on('uncaughtException', (error) => {
  log(`\n${colors.red}💥 Uncaught Exception: ${error.message}${colors.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n${colors.red}💥 Unhandled Rejection at: ${promise}, reason: ${reason}${colors.reset}`);
  process.exit(1);
});

main().catch((error) => {
  log(`\n${colors.red}💥 Test runner failed: ${error.message}${colors.reset}`);
  process.exit(1);
});
