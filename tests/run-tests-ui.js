/**
 * UI Test Runner
 * Menjalankan tests dengan UI testing dan component testing
 */

import { execSync } from 'child_process';
import fs from 'fs';

class UITestRunner {
  constructor() {
    this.startTime = Date.now();
    this.uiResults = {
      componentTests: [],
      layoutTests: [],
      interactionTests: [],
      responsiveTests: [],
      accessibilityTests: [],
      performanceTests: [],
      visualTests: [],
      userExperienceTests: [],
      recommendations: []
    };
    this.components = [
      'AdminDashboard_Modern',
      'TeacherDashboard_Modern',
      'StudentDashboard_Modern',
      'LoginForm_Modern',
      'ManageTeacherAccountsView',
      'ManageSubjectsView',
      'ManageClassesView',
      'RuangKelasManagementView',
      'SecurityManagementView',
      'PerformanceMonitoringView'
    ];
    this.screenSizes = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Large Desktop', width: 2560, height: 1440 }
    ];
    this.browsers = ['chromium', 'firefox', 'webkit'];
  }

  async runUITests() {
    console.log('🎨 Running UI Tests...\n');
    
    try {
      // Run component tests
      await this.runComponentTests();
      
      // Run layout tests
      await this.runLayoutTests();
      
      // Run interaction tests
      await this.runInteractionTests();
      
      // Run responsive tests
      await this.runResponsiveTests();
      
      // Run accessibility tests
      await this.runAccessibilityTests();
      
      // Run performance tests
      await this.runPerformanceTests();
      
      // Run visual tests
      await this.runVisualTests();
      
      // Run user experience tests
      await this.runUserExperienceTests();
      
      // Analyze UI results
      await this.analyzeUIResults();
      
      // Generate UI report
      this.generateUIReport();
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ UI tests completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ UI tests failed in ${duration}ms: ${error.message}`);
      this.generateFailureReport(error);
      process.exit(1);
    }
  }

  async runComponentTests() {
    console.log('🧩 Running component tests...');
    
    for (const component of this.components) {
      try {
        console.log(`🧩 Testing component: ${component}...`);
        
        // Run Jest tests for specific component
        execSync(`npx jest --testPathPattern="components" --testNamePattern="${component}" --reporter=json`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.uiResults.componentTests.push({
          component: component,
          status: 'passed',
          description: `UI test for component: ${component}`
        });
        
        console.log(`✅ Component ${component} test passed`);
        
      } catch (error) {
        this.uiResults.componentTests.push({
          component: component,
          status: 'failed',
          description: `UI test for component: ${component}`,
          error: error.message
        });
        
        console.log(`❌ Component ${component} test failed: ${error.message}`);
      }
    }
  }

  async runLayoutTests() {
    console.log('📐 Running layout tests...');
    
    const layoutTests = [
      {
        name: 'Header Layout',
        command: 'npx jest --testPathPattern="layout" --testNamePattern="header"',
        description: 'Tests for header layout'
      },
      {
        name: 'Navigation Layout',
        command: 'npx jest --testPathPattern="layout" --testNamePattern="navigation"',
        description: 'Tests for navigation layout'
      },
      {
        name: 'Content Layout',
        command: 'npx jest --testPathPattern="layout" --testNamePattern="content"',
        description: 'Tests for content layout'
      },
      {
        name: 'Footer Layout',
        command: 'npx jest --testPathPattern="layout" --testNamePattern="footer"',
        description: 'Tests for footer layout'
      },
      {
        name: 'Grid Layout',
        command: 'npx jest --testPathPattern="layout" --testNamePattern="grid"',
        description: 'Tests for grid layout'
      }
    ];
    
    for (const test of layoutTests) {
      try {
        console.log(`📐 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.uiResults.layoutTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.uiResults.layoutTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runInteractionTests() {
    console.log('🖱️ Running interaction tests...');
    
    const interactionTests = [
      {
        name: 'Button Interactions',
        command: 'npx jest --testPathPattern="interaction" --testNamePattern="button"',
        description: 'Tests for button interactions'
      },
      {
        name: 'Form Interactions',
        command: 'npx jest --testPathPattern="interaction" --testNamePattern="form"',
        description: 'Tests for form interactions'
      },
      {
        name: 'Navigation Interactions',
        command: 'npx jest --testPathPattern="interaction" --testNamePattern="navigation"',
        description: 'Tests for navigation interactions'
      },
      {
        name: 'Modal Interactions',
        command: 'npx jest --testPathPattern="interaction" --testNamePattern="modal"',
        description: 'Tests for modal interactions'
      },
      {
        name: 'Table Interactions',
        command: 'npx jest --testPathPattern="interaction" --testNamePattern="table"',
        description: 'Tests for table interactions'
      }
    ];
    
    for (const test of interactionTests) {
      try {
        console.log(`🖱️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.uiResults.interactionTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.uiResults.interactionTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runResponsiveTests() {
    console.log('📱 Running responsive tests...');
    
    for (const screenSize of this.screenSizes) {
      try {
        console.log(`📱 Testing screen size: ${screenSize.name} (${screenSize.width}x${screenSize.height})...`);
        
        // Run Playwright tests for specific screen size
        execSync(`npx playwright test --project=${screenSize.name.toLowerCase().replace(/\s+/g, '-')} --reporter=html`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.uiResults.responsiveTests.push({
          screenSize: screenSize.name,
          width: screenSize.width,
          height: screenSize.height,
          status: 'passed',
          description: `Responsive test for screen size: ${screenSize.name}`
        });
        
        console.log(`✅ Screen size ${screenSize.name} test passed`);
        
      } catch (error) {
        this.uiResults.responsiveTests.push({
          screenSize: screenSize.name,
          width: screenSize.width,
          height: screenSize.height,
          status: 'failed',
          description: `Responsive test for screen size: ${screenSize.name}`,
          error: error.message
        });
        
        console.log(`❌ Screen size ${screenSize.name} test failed: ${error.message}`);
      }
    }
  }

  async runAccessibilityTests() {
    console.log('♿ Running accessibility tests...');
    
    const accessibilityTests = [
      {
        name: 'Keyboard Navigation',
        command: 'npx jest --testPathPattern="accessibility" --testNamePattern="keyboard"',
        description: 'Tests for keyboard navigation accessibility'
      },
      {
        name: 'Screen Reader Support',
        command: 'npx jest --testPathPattern="accessibility" --testNamePattern="screen-reader"',
        description: 'Tests for screen reader support'
      },
      {
        name: 'Color Contrast',
        command: 'npx jest --testPathPattern="accessibility" --testNamePattern="contrast"',
        description: 'Tests for color contrast accessibility'
      },
      {
        name: 'Focus Management',
        command: 'npx jest --testPathPattern="accessibility" --testNamePattern="focus"',
        description: 'Tests for focus management accessibility'
      },
      {
        name: 'ARIA Labels',
        command: 'npx jest --testPathPattern="accessibility" --testNamePattern="aria"',
        description: 'Tests for ARIA labels accessibility'
      }
    ];
    
    for (const test of accessibilityTests) {
      try {
        console.log(`♿ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.uiResults.accessibilityTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.uiResults.accessibilityTests.push({
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
    console.log('⚡ Running UI performance tests...');
    
    const performanceTests = [
      {
        name: 'Component Render Performance',
        command: 'npx jest --testPathPattern="performance" --testNamePattern="render"',
        description: 'Tests for component render performance'
      },
      {
        name: 'Interaction Performance',
        command: 'npx jest --testPathPattern="performance" --testNamePattern="interaction"',
        description: 'Tests for interaction performance'
      },
      {
        name: 'Animation Performance',
        command: 'npx jest --testPathPattern="performance" --testNamePattern="animation"',
        description: 'Tests for animation performance'
      },
      {
        name: 'Memory Usage',
        command: 'npx jest --testPathPattern="performance" --testNamePattern="memory"',
        description: 'Tests for memory usage performance'
      },
      {
        name: 'Bundle Size',
        command: 'npx jest --testPathPattern="performance" --testNamePattern="bundle"',
        description: 'Tests for bundle size performance'
      }
    ];
    
    for (const test of performanceTests) {
      try {
        console.log(`⚡ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.uiResults.performanceTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.uiResults.performanceTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runVisualTests() {
    console.log('👁️ Running visual tests...');
    
    const visualTests = [
      {
        name: 'Visual Regression',
        command: 'npx playwright test --grep="visual" --reporter=html',
        description: 'Tests for visual regression'
      },
      {
        name: 'Screenshot Comparison',
        command: 'npx playwright test --grep="screenshot" --reporter=html',
        description: 'Tests for screenshot comparison'
      },
      {
        name: 'Color Accuracy',
        command: 'npx playwright test --grep="color" --reporter=html',
        description: 'Tests for color accuracy'
      },
      {
        name: 'Font Rendering',
        command: 'npx playwright test --grep="font" --reporter=html',
        description: 'Tests for font rendering'
      },
      {
        name: 'Icon Display',
        command: 'npx playwright test --grep="icon" --reporter=html',
        description: 'Tests for icon display'
      }
    ];
    
    for (const test of visualTests) {
      try {
        console.log(`👁️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.uiResults.visualTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.uiResults.visualTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runUserExperienceTests() {
    console.log('👤 Running user experience tests...');
    
    const uxTests = [
      {
        name: 'User Flow',
        command: 'npx playwright test --grep="user-flow" --reporter=html',
        description: 'Tests for user flow experience'
      },
      {
        name: 'Navigation Experience',
        command: 'npx playwright test --grep="navigation-ux" --reporter=html',
        description: 'Tests for navigation experience'
      },
      {
        name: 'Form Experience',
        command: 'npx playwright test --grep="form-ux" --reporter=html',
        description: 'Tests for form experience'
      },
      {
        name: 'Error Handling Experience',
        command: 'npx playwright test --grep="error-ux" --reporter=html',
        description: 'Tests for error handling experience'
      },
      {
        name: 'Loading Experience',
        command: 'npx playwright test --grep="loading-ux" --reporter=html',
        description: 'Tests for loading experience'
      }
    ];
    
    for (const test of uxTests) {
      try {
        console.log(`👤 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.uiResults.userExperienceTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.uiResults.userExperienceTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async analyzeUIResults() {
    console.log('📊 Analyzing UI results...');
    
    // Analyze all test categories
    const testCategories = [
      'componentTests', 'layoutTests', 'interactionTests', 'responsiveTests',
      'accessibilityTests', 'performanceTests', 'visualTests', 'userExperienceTests'
    ];
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const category of testCategories) {
      const tests = this.uiResults[category];
      const passed = tests.filter(t => t.status === 'passed').length;
      const failed = tests.filter(t => t.status === 'failed').length;
      
      totalTests += tests.length;
      totalPassed += passed;
      totalFailed += failed;
      
      console.log(`📈 ${category}: ${tests.length} tests (${passed} passed, ${failed} failed)`);
    }
    
    // Generate recommendations
    this.generateUIRecommendations();
    
    console.log(`📈 UI Analysis:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
    
    if (totalFailed > 0) {
      console.log('⚠️  UI issues found!');
    }
  }

  generateUIRecommendations() {
    const recommendations = [];
    
    // Check for common UI issues
    const failedComponentTests = this.uiResults.componentTests.filter(t => t.status === 'failed');
    if (failedComponentTests.length > 0) {
      recommendations.push('Fix failed component tests');
    }
    
    const failedLayoutTests = this.uiResults.layoutTests.filter(t => t.status === 'failed');
    if (failedLayoutTests.length > 0) {
      recommendations.push('Address layout issues');
    }
    
    const failedInteractionTests = this.uiResults.interactionTests.filter(t => t.status === 'failed');
    if (failedInteractionTests.length > 0) {
      recommendations.push('Fix interaction issues');
    }
    
    const failedResponsiveTests = this.uiResults.responsiveTests.filter(t => t.status === 'failed');
    if (failedResponsiveTests.length > 0) {
      recommendations.push('Address responsive design issues');
    }
    
    const failedAccessibilityTests = this.uiResults.accessibilityTests.filter(t => t.status === 'failed');
    if (failedAccessibilityTests.length > 0) {
      recommendations.push('Fix accessibility issues');
    }
    
    const failedPerformanceTests = this.uiResults.performanceTests.filter(t => t.status === 'failed');
    if (failedPerformanceTests.length > 0) {
      recommendations.push('Address performance issues');
    }
    
    const failedVisualTests = this.uiResults.visualTests.filter(t => t.status === 'failed');
    if (failedVisualTests.length > 0) {
      recommendations.push('Fix visual issues');
    }
    
    const failedUXTests = this.uiResults.userExperienceTests.filter(t => t.status === 'failed');
    if (failedUXTests.length > 0) {
      recommendations.push('Address user experience issues');
    }
    
    // General UI recommendations
    recommendations.push('Implement comprehensive UI testing');
    recommendations.push('Add component testing');
    recommendations.push('Implement layout testing');
    recommendations.push('Add interaction testing');
    recommendations.push('Implement responsive testing');
    recommendations.push('Add accessibility testing');
    recommendations.push('Implement performance testing');
    recommendations.push('Add visual testing');
    recommendations.push('Implement user experience testing');
    recommendations.push('Add UI test automation');
    recommendations.push('Implement UI test monitoring');
    recommendations.push('Add UI test reporting');
    recommendations.push('Implement UI test maintenance');
    recommendations.push('Add UI test documentation');
    recommendations.push('Implement UI test best practices');
    
    this.uiResults.recommendations = recommendations;
  }

  generateUIReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        successRate: 0
      },
      componentTests: this.uiResults.componentTests,
      layoutTests: this.uiResults.layoutTests,
      interactionTests: this.uiResults.interactionTests,
      responsiveTests: this.uiResults.responsiveTests,
      accessibilityTests: this.uiResults.accessibilityTests,
      performanceTests: this.uiResults.performanceTests,
      visualTests: this.uiResults.visualTests,
      userExperienceTests: this.uiResults.userExperienceTests,
      recommendations: this.uiResults.recommendations,
      status: this.getUIStatus()
    };
    
    // Calculate summary
    const testCategories = [
      'componentTests', 'layoutTests', 'interactionTests', 'responsiveTests',
      'accessibilityTests', 'performanceTests', 'visualTests', 'userExperienceTests'
    ];
    
    for (const category of testCategories) {
      const tests = this.uiResults[category];
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
    fs.writeFileSync('ui-test-results.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    this.generateMarkdownReport(report);
    
    console.log('📄 UI report generated');
  }

  generateMarkdownReport(report) {
    const markdown = `# UI Test Report

Generated: ${new Date(report.timestamp).toLocaleString()}
Duration: ${report.duration}ms

## Summary
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.totalPassed}
- **Failed**: ${report.summary.totalFailed}
- **Success Rate**: ${report.summary.successRate.toFixed(2)}%

## Component Tests
${report.componentTests.map(test => `
### ${test.component}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Layout Tests
${report.layoutTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Interaction Tests
${report.interactionTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Responsive Tests
${report.responsiveTests.map(test => `
### ${test.screenSize} (${test.width}x${test.height})
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

## Performance Tests
${report.performanceTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Visual Tests
${report.visualTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## User Experience Tests
${report.userExperienceTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## UI Status
${report.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}

## UI Testing Checklist
- [ ] All components are tested
- [ ] Layout is responsive
- [ ] Interactions work correctly
- [ ] Accessibility standards are met
- [ ] Performance is optimal
- [ ] Visual design is consistent
- [ ] User experience is smooth
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] Error handling is user-friendly

## Next Steps
1. Review all failed UI tests
2. Implement recommended UI improvements
3. Add comprehensive UI testing
4. Implement UI test automation
5. Consider UI test monitoring
`;
    
    fs.writeFileSync('ui-report.md', markdown);
  }

  getUIStatus() {
    const failedComponentTests = this.uiResults.componentTests.filter(t => t.status === 'failed').length;
    const failedLayoutTests = this.uiResults.layoutTests.filter(t => t.status === 'failed').length;
    const failedInteractionTests = this.uiResults.interactionTests.filter(t => t.status === 'failed').length;
    const failedResponsiveTests = this.uiResults.responsiveTests.filter(t => t.status === 'failed').length;
    const failedAccessibilityTests = this.uiResults.accessibilityTests.filter(t => t.status === 'failed').length;
    const failedPerformanceTests = this.uiResults.performanceTests.filter(t => t.status === 'failed').length;
    const failedVisualTests = this.uiResults.visualTests.filter(t => t.status === 'failed').length;
    const failedUXTests = this.uiResults.userExperienceTests.filter(t => t.status === 'failed').length;
    
    if (failedComponentTests > 0 || failedLayoutTests > 0 || failedInteractionTests > 0 || 
        failedResponsiveTests > 0 || failedAccessibilityTests > 0 || failedPerformanceTests > 0 || 
        failedVisualTests > 0 || failedUXTests > 0) {
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
      uiResults: this.uiResults
    };
    
    fs.writeFileSync('ui-failure-report.json', JSON.stringify(failureReport, null, 2));
    console.log('📄 UI failure report saved to ui-failure-report.json');
  }
}

// Run UI tests
const runner = new UITestRunner();
runner.runUITests().catch(error => {
  console.error('❌ UI test runner failed:', error);
  process.exit(1);
});