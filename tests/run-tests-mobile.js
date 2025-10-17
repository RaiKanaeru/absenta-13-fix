/**
 * Mobile Test Runner
 * Menjalankan tests dengan mobile testing dan responsive testing
 */

import { execSync } from 'child_process';
import fs from 'fs';

class MobileTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.mobileResults = {
      deviceTests: [],
      responsiveTests: [],
      touchTests: [],
      gestureTests: [],
      performanceTests: [],
      accessibilityTests: [],
      compatibilityTests: [],
      networkTests: [],
      batteryTests: [],
      securityTests: [],
      recommendations: []
    };
    this.devices = [
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPhone 13', width: 390, height: 844 },
      { name: 'Samsung Galaxy S21', width: 360, height: 800 },
      { name: 'Samsung Galaxy S22', width: 360, height: 800 },
      { name: 'iPad Pro', width: 1024, height: 1366 },
      { name: 'iPad Air', width: 820, height: 1180 }
    ];
    this.orientations = ['portrait', 'landscape'];
    this.networkConditions = ['3G', '4G', 'WiFi', 'Offline'];
  }

  async runMobileTests() {
    console.log('📱 Running Mobile Tests...\n');
    
    try {
      // Run device tests
      await this.runDeviceTests();
      
      // Run responsive tests
      await this.runResponsiveTests();
      
      // Run touch tests
      await this.runTouchTests();
      
      // Run gesture tests
      await this.runGestureTests();
      
      // Run performance tests
      await this.runPerformanceTests();
      
      // Run accessibility tests
      await this.runAccessibilityTests();
      
      // Run compatibility tests
      await this.runCompatibilityTests();
      
      // Run network tests
      await this.runNetworkTests();
      
      // Run battery tests
      await this.runBatteryTests();
      
      // Run security tests
      await this.runSecurityTests();
      
      // Analyze mobile results
      await this.analyzeMobileResults();
      
      // Generate mobile report
      this.generateMobileReport();
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ Mobile tests completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ Mobile tests failed in ${duration}ms: ${error.message}`);
      this.generateFailureReport(error);
      process.exit(1);
    }
  }

  async runDeviceTests() {
    console.log('📱 Running device tests...');
    
    for (const device of this.devices) {
      try {
        console.log(`📱 Testing device: ${device.name} (${device.width}x${device.height})...`);
        
        // Run Playwright tests for specific device
        execSync(`npx playwright test --project=mobile-${device.name.toLowerCase().replace(/\s+/g, '-')} --reporter=html`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.mobileResults.deviceTests.push({
          device: device.name,
          width: device.width,
          height: device.height,
          status: 'passed',
          description: `Mobile test for device: ${device.name}`
        });
        
        console.log(`✅ Device ${device.name} test passed`);
        
      } catch (error) {
        this.mobileResults.deviceTests.push({
          device: device.name,
          width: device.width,
          height: device.height,
          status: 'failed',
          description: `Mobile test for device: ${device.name}`,
          error: error.message
        });
        
        console.log(`❌ Device ${device.name} test failed: ${error.message}`);
      }
    }
  }

  async runResponsiveTests() {
    console.log('📐 Running responsive tests...');
    
    const responsiveTests = [
      {
        name: 'Breakpoint Testing',
        command: 'npx playwright test --grep="breakpoint" --reporter=html',
        description: 'Tests for responsive breakpoints'
      },
      {
        name: 'Viewport Testing',
        command: 'npx playwright test --grep="viewport" --reporter=html',
        description: 'Tests for viewport responsiveness'
      },
      {
        name: 'Grid System',
        command: 'npx playwright test --grep="grid" --reporter=html',
        description: 'Tests for responsive grid system'
      },
      {
        name: 'Flexbox Layout',
        command: 'npx playwright test --grep="flexbox" --reporter=html',
        description: 'Tests for flexbox layout'
      },
      {
        name: 'CSS Media Queries',
        command: 'npx playwright test --grep="media-queries" --reporter=html',
        description: 'Tests for CSS media queries'
      }
    ];
    
    for (const test of responsiveTests) {
      try {
        console.log(`📐 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.mobileResults.responsiveTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.mobileResults.responsiveTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runTouchTests() {
    console.log('👆 Running touch tests...');
    
    const touchTests = [
      {
        name: 'Touch Events',
        command: 'npx playwright test --grep="touch-events" --reporter=html',
        description: 'Tests for touch events'
      },
      {
        name: 'Touch Targets',
        command: 'npx playwright test --grep="touch-targets" --reporter=html',
        description: 'Tests for touch targets'
      },
      {
        name: 'Touch Feedback',
        command: 'npx playwright test --grep="touch-feedback" --reporter=html',
        description: 'Tests for touch feedback'
      },
      {
        name: 'Touch Accessibility',
        command: 'npx playwright test --grep="touch-accessibility" --reporter=html',
        description: 'Tests for touch accessibility'
      },
      {
        name: 'Touch Performance',
        command: 'npx playwright test --grep="touch-performance" --reporter=html',
        description: 'Tests for touch performance'
      }
    ];
    
    for (const test of touchTests) {
      try {
        console.log(`👆 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.mobileResults.touchTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.mobileResults.touchTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runGestureTests() {
    console.log('🤏 Running gesture tests...');
    
    const gestureTests = [
      {
        name: 'Swipe Gestures',
        command: 'npx playwright test --grep="swipe" --reporter=html',
        description: 'Tests for swipe gestures'
      },
      {
        name: 'Pinch Gestures',
        command: 'npx playwright test --grep="pinch" --reporter=html',
        description: 'Tests for pinch gestures'
      },
      {
        name: 'Tap Gestures',
        command: 'npx playwright test --grep="tap" --reporter=html',
        description: 'Tests for tap gestures'
      },
      {
        name: 'Long Press',
        command: 'npx playwright test --grep="long-press" --reporter=html',
        description: 'Tests for long press gestures'
      },
      {
        name: 'Multi-Touch',
        command: 'npx playwright test --grep="multi-touch" --reporter=html',
        description: 'Tests for multi-touch gestures'
      }
    ];
    
    for (const test of gestureTests) {
      try {
        console.log(`🤏 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.mobileResults.gestureTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.mobileResults.gestureTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running mobile performance tests...');
    
    const performanceTests = [
      {
        name: 'Page Load Performance',
        command: 'npx playwright test --grep="mobile-performance" --reporter=html',
        description: 'Tests for mobile page load performance'
      },
      {
        name: 'Touch Response Time',
        command: 'npx playwright test --grep="touch-response" --reporter=html',
        description: 'Tests for touch response time'
      },
      {
        name: 'Animation Performance',
        command: 'npx playwright test --grep="animation-performance" --reporter=html',
        description: 'Tests for animation performance'
      },
      {
        name: 'Memory Usage',
        command: 'npx playwright test --grep="memory-usage" --reporter=html',
        description: 'Tests for memory usage'
      },
      {
        name: 'Battery Impact',
        command: 'npx playwright test --grep="battery-impact" --reporter=html',
        description: 'Tests for battery impact'
      }
    ];
    
    for (const test of performanceTests) {
      try {
        console.log(`⚡ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.mobileResults.performanceTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.mobileResults.performanceTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runAccessibilityTests() {
    console.log('♿ Running mobile accessibility tests...');
    
    const accessibilityTests = [
      {
        name: 'Screen Reader Support',
        command: 'npx playwright test --grep="screen-reader" --reporter=html',
        description: 'Tests for screen reader support'
      },
      {
        name: 'Voice Over',
        command: 'npx playwright test --grep="voice-over" --reporter=html',
        description: 'Tests for Voice Over support'
      },
      {
        name: 'TalkBack',
        command: 'npx playwright test --grep="talkback" --reporter=html',
        description: 'Tests for TalkBack support'
      },
      {
        name: 'Keyboard Navigation',
        command: 'npx playwright test --grep="keyboard-nav" --reporter=html',
        description: 'Tests for keyboard navigation'
      },
      {
        name: 'Focus Management',
        command: 'npx playwright test --grep="focus-management" --reporter=html',
        description: 'Tests for focus management'
      }
    ];
    
    for (const test of accessibilityTests) {
      try {
        console.log(`♿ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.mobileResults.accessibilityTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.mobileResults.accessibilityTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runCompatibilityTests() {
    console.log('🔧 Running mobile compatibility tests...');
    
    const compatibilityTests = [
      {
        name: 'iOS Compatibility',
        command: 'npx playwright test --grep="ios-compatibility" --reporter=html',
        description: 'Tests for iOS compatibility'
      },
      {
        name: 'Android Compatibility',
        command: 'npx playwright test --grep="android-compatibility" --reporter=html',
        description: 'Tests for Android compatibility'
      },
      {
        name: 'Browser Compatibility',
        command: 'npx playwright test --grep="browser-compatibility" --reporter=html',
        description: 'Tests for mobile browser compatibility'
      },
      {
        name: 'WebView Compatibility',
        command: 'npx playwright test --grep="webview-compatibility" --reporter=html',
        description: 'Tests for WebView compatibility'
      },
      {
        name: 'PWA Compatibility',
        command: 'npx playwright test --grep="pwa-compatibility" --reporter=html',
        description: 'Tests for PWA compatibility'
      }
    ];
    
    for (const test of compatibilityTests) {
      try {
        console.log(`🔧 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.mobileResults.compatibilityTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.mobileResults.compatibilityTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runNetworkTests() {
    console.log('🌐 Running mobile network tests...');
    
    for (const networkCondition of this.networkConditions) {
      try {
        console.log(`🌐 Testing network condition: ${networkCondition}...`);
        
        // Run Playwright tests for specific network condition
        execSync(`npx playwright test --grep="${networkCondition}" --reporter=html`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.mobileResults.networkTests.push({
          networkCondition: networkCondition,
          status: 'passed',
          description: `Mobile test for network condition: ${networkCondition}`
        });
        
        console.log(`✅ Network condition ${networkCondition} test passed`);
        
      } catch (error) {
        this.mobileResults.networkTests.push({
          networkCondition: networkCondition,
          status: 'failed',
          description: `Mobile test for network condition: ${networkCondition}`,
          error: error.message
        });
        
        console.log(`❌ Network condition ${networkCondition} test failed: ${error.message}`);
      }
    }
  }

  async runBatteryTests() {
    console.log('🔋 Running battery tests...');
    
    const batteryTests = [
      {
        name: 'Battery Usage',
        command: 'npx playwright test --grep="battery-usage" --reporter=html',
        description: 'Tests for battery usage'
      },
      {
        name: 'Power Management',
        command: 'npx playwright test --grep="power-management" --reporter=html',
        description: 'Tests for power management'
      },
      {
        name: 'Background Processing',
        command: 'npx playwright test --grep="background-processing" --reporter=html',
        description: 'Tests for background processing'
      },
      {
        name: 'Sleep Mode',
        command: 'npx playwright test --grep="sleep-mode" --reporter=html',
        description: 'Tests for sleep mode handling'
      },
      {
        name: 'Battery Optimization',
        command: 'npx playwright test --grep="battery-optimization" --reporter=html',
        description: 'Tests for battery optimization'
      }
    ];
    
    for (const test of batteryTests) {
      try {
        console.log(`🔋 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.mobileResults.batteryTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.mobileResults.batteryTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runSecurityTests() {
    console.log('🔒 Running mobile security tests...');
    
    const securityTests = [
      {
        name: 'Touch ID',
        command: 'npx playwright test --grep="touch-id" --reporter=html',
        description: 'Tests for Touch ID security'
      },
      {
        name: 'Face ID',
        command: 'npx playwright test --grep="face-id" --reporter=html',
        description: 'Tests for Face ID security'
      },
      {
        name: 'Biometric Authentication',
        command: 'npx playwright test --grep="biometric" --reporter=html',
        description: 'Tests for biometric authentication'
      },
      {
        name: 'Secure Storage',
        command: 'npx playwright test --grep="secure-storage" --reporter=html',
        description: 'Tests for secure storage'
      },
      {
        name: 'Data Encryption',
        command: 'npx playwright test --grep="data-encryption" --reporter=html',
        description: 'Tests for data encryption'
      }
    ];
    
    for (const test of securityTests) {
      try {
        console.log(`🔒 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.mobileResults.securityTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.mobileResults.securityTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async analyzeMobileResults() {
    console.log('📊 Analyzing mobile results...');
    
    // Analyze all test categories
    const testCategories = [
      'deviceTests', 'responsiveTests', 'touchTests', 'gestureTests',
      'performanceTests', 'accessibilityTests', 'compatibilityTests',
      'networkTests', 'batteryTests', 'securityTests'
    ];
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const category of testCategories) {
      const tests = this.mobileResults[category];
      const passed = tests.filter(t => t.status === 'passed').length;
      const failed = tests.filter(t => t.status === 'failed').length;
      
      totalTests += tests.length;
      totalPassed += passed;
      totalFailed += failed;
      
      console.log(`📈 ${category}: ${tests.length} tests (${passed} passed, ${failed} failed)`);
    }
    
    // Generate recommendations
    this.generateMobileRecommendations();
    
    console.log(`📈 Mobile Analysis:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
    
    if (totalFailed > 0) {
      console.log('⚠️  Mobile issues found!');
    }
  }

  generateMobileRecommendations() {
    const recommendations = [];
    
    // Check for common mobile issues
    const failedDeviceTests = this.mobileResults.deviceTests.filter(t => t.status === 'failed');
    if (failedDeviceTests.length > 0) {
      recommendations.push('Fix failed device tests');
    }
    
    const failedResponsiveTests = this.mobileResults.responsiveTests.filter(t => t.status === 'failed');
    if (failedResponsiveTests.length > 0) {
      recommendations.push('Address responsive design issues');
    }
    
    const failedTouchTests = this.mobileResults.touchTests.filter(t => t.status === 'failed');
    if (failedTouchTests.length > 0) {
      recommendations.push('Fix touch interaction issues');
    }
    
    const failedGestureTests = this.mobileResults.gestureTests.filter(t => t.status === 'failed');
    if (failedGestureTests.length > 0) {
      recommendations.push('Address gesture handling issues');
    }
    
    const failedPerformanceTests = this.mobileResults.performanceTests.filter(t => t.status === 'failed');
    if (failedPerformanceTests.length > 0) {
      recommendations.push('Fix mobile performance issues');
    }
    
    const failedAccessibilityTests = this.mobileResults.accessibilityTests.filter(t => t.status === 'failed');
    if (failedAccessibilityTests.length > 0) {
      recommendations.push('Address mobile accessibility issues');
    }
    
    const failedCompatibilityTests = this.mobileResults.compatibilityTests.filter(t => t.status === 'failed');
    if (failedCompatibilityTests.length > 0) {
      recommendations.push('Fix mobile compatibility issues');
    }
    
    const failedNetworkTests = this.mobileResults.networkTests.filter(t => t.status === 'failed');
    if (failedNetworkTests.length > 0) {
      recommendations.push('Address mobile network issues');
    }
    
    const failedBatteryTests = this.mobileResults.batteryTests.filter(t => t.status === 'failed');
    if (failedBatteryTests.length > 0) {
      recommendations.push('Fix mobile battery issues');
    }
    
    const failedSecurityTests = this.mobileResults.securityTests.filter(t => t.status === 'failed');
    if (failedSecurityTests.length > 0) {
      recommendations.push('Address mobile security issues');
    }
    
    // General mobile recommendations
    recommendations.push('Implement comprehensive mobile testing');
    recommendations.push('Add device testing');
    recommendations.push('Implement responsive testing');
    recommendations.push('Add touch testing');
    recommendations.push('Implement gesture testing');
    recommendations.push('Add mobile performance testing');
    recommendations.push('Implement mobile accessibility testing');
    recommendations.push('Add mobile compatibility testing');
    recommendations.push('Implement mobile network testing');
    recommendations.push('Add mobile battery testing');
    recommendations.push('Implement mobile security testing');
    recommendations.push('Add mobile monitoring');
    recommendations.push('Implement mobile optimization');
    recommendations.push('Add mobile reporting');
    recommendations.push('Implement mobile maintenance');
    recommendations.push('Add mobile documentation');
    recommendations.push('Implement mobile best practices');
    
    this.mobileResults.recommendations = recommendations;
  }

  generateMobileReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        successRate: 0
      },
      deviceTests: this.mobileResults.deviceTests,
      responsiveTests: this.mobileResults.responsiveTests,
      touchTests: this.mobileResults.touchTests,
      gestureTests: this.mobileResults.gestureTests,
      performanceTests: this.mobileResults.performanceTests,
      accessibilityTests: this.mobileResults.accessibilityTests,
      compatibilityTests: this.mobileResults.compatibilityTests,
      networkTests: this.mobileResults.networkTests,
      batteryTests: this.mobileResults.batteryTests,
      securityTests: this.mobileResults.securityTests,
      recommendations: this.mobileResults.recommendations,
      status: this.getMobileStatus()
    };
    
    // Calculate summary
    const testCategories = [
      'deviceTests', 'responsiveTests', 'touchTests', 'gestureTests',
      'performanceTests', 'accessibilityTests', 'compatibilityTests',
      'networkTests', 'batteryTests', 'securityTests'
    ];
    
    for (const category of testCategories) {
      const tests = this.mobileResults[category];
      const passed = tests.filter(t => t.status === 'passed').length;
      const failed = tests.filter(t => t.status === 'failed').length;
      
      report.summary.totalTests += tests.length;
      report.summary.totalPassed += passed;
      report.summary.totalFailed += failed;
    }
    
    report.summary.successRate = report.summary.totalTests > 0 
      ? (report.summary.totalPassed / report.summary.totalTests) * 100 
      : 0;
    
    // Save JSON report
    fs.writeFileSync('mobile-test-results.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    this.generateMarkdownReport(report);
    
    console.log('📄 Mobile report generated');
  }

  generateMarkdownReport(report) {
    const markdown = `# Mobile Test Report

Generated: ${new Date(report.timestamp).toLocaleString()}
Duration: ${report.duration}ms

## Summary
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.totalPassed}
- **Failed**: ${report.summary.totalFailed}
- **Success Rate**: ${report.summary.successRate.toFixed(2)}%

## Device Tests
${report.deviceTests.map(test => `
### ${test.device} (${test.width}x${test.height})
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Responsive Tests
${report.responsiveTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Touch Tests
${report.touchTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Gesture Tests
${report.gestureTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Performance Tests
${report.performanceTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Accessibility Tests
${report.accessibilityTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Compatibility Tests
${report.compatibilityTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Network Tests
${report.networkTests.map(test => `
### ${test.networkCondition}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Battery Tests
${report.batteryTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Security Tests
${report.securityTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Mobile Status
${report.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}

## Mobile Testing Checklist
- [ ] All devices are tested
- [ ] Responsive design is tested
- [ ] Touch interactions are tested
- [ ] Gestures are tested
- [ ] Performance is tested
- [ ] Accessibility is tested
- [ ] Compatibility is tested
- [ ] Network conditions are tested
- [ ] Battery usage is tested
- [ ] Security is tested

## Next Steps
1. Review all failed mobile tests
2. Implement recommended mobile improvements
3. Add comprehensive mobile testing
4. Implement mobile monitoring
5. Consider mobile optimization
`;
    
    fs.writeFileSync('mobile-report.md', markdown);
  }

  getMobileStatus() {
    const totalTests = this.mobileResults.deviceTests.length + 
                      this.mobileResults.responsiveTests.length + 
                      this.mobileResults.touchTests.length + 
                      this.mobileResults.gestureTests.length + 
                      this.mobileResults.performanceTests.length + 
                      this.mobileResults.accessibilityTests.length + 
                      this.mobileResults.compatibilityTests.length + 
                      this.mobileResults.networkTests.length + 
                      this.mobileResults.batteryTests.length + 
                      this.mobileResults.securityTests.length;
    
    const totalFailed = this.mobileResults.deviceTests.filter(t => t.status === 'failed').length + 
                       this.mobileResults.responsiveTests.filter(t => t.status === 'failed').length + 
                       this.mobileResults.touchTests.filter(t => t.status === 'failed').length + 
                       this.mobileResults.gestureTests.filter(t => t.status === 'failed').length + 
                       this.mobileResults.performanceTests.filter(t => t.status === 'failed').length + 
                       this.mobileResults.accessibilityTests.filter(t => t.status === 'failed').length + 
                       this.mobileResults.compatibilityTests.filter(t => t.status === 'failed').length + 
                       this.mobileResults.networkTests.filter(t => t.status === 'failed').length + 
                       this.mobileResults.batteryTests.filter(t => t.status === 'failed').length + 
                       this.mobileResults.securityTests.filter(t => t.status === 'failed').length;
    
    if (totalFailed > 0) {
      return 'FAILED';
    }
    
    return 'PASSED';
  }

  generateFailureReport(error) {
    const failureReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      duration: Date.now() - this.startTime,
      mobileResults: this.mobileResults
    };
    
    fs.writeFileSync('mobile-failure-report.json', JSON.stringify(failureReport, null, 2));
    console.log('📄 Mobile failure report saved to mobile-failure-report.json');
  }
}

// Run mobile tests
const runner = new MobileTestRunner();
runner.runMobileTests().catch(error => {
  console.error('❌ Mobile test runner failed:', error);
  process.exit(1);
});