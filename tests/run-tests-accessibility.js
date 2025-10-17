/**
 * Accessibility Test Runner
 * Menjalankan tests dengan accessibility testing dan WCAG compliance
 */

import { execSync } from 'child_process';
import fs from 'fs';

class AccessibilityTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.accessibilityResults = {
      wcagTests: [],
      keyboardTests: [],
      screenReaderTests: [],
      colorTests: [],
      recommendations: []
    };
    this.wcagLevels = ['A', 'AA', 'AAA'];
    this.accessibilityAreas = [
      'Perceivable',
      'Operable',
      'Understandable',
      'Robust'
    ];
  }

  async runAccessibilityTests() {
    console.log('♿ Running Accessibility Tests...\n');
    
    try {
      // Run WCAG compliance tests
      await this.runWCAGTests();
      
      // Run keyboard navigation tests
      await this.runKeyboardTests();
      
      // Run screen reader tests
      await this.runScreenReaderTests();
      
      // Run color and contrast tests
      await this.runColorTests();
      
      // Analyze accessibility results
      await this.analyzeAccessibilityResults();
      
      // Generate accessibility report
      this.generateAccessibilityReport();
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ Accessibility tests completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ Accessibility tests failed in ${duration}ms: ${error.message}`);
      this.generateFailureReport(error);
      process.exit(1);
    }
  }

  async runWCAGTests() {
    console.log('📋 Running WCAG compliance tests...');
    
    const wcagTests = [
      {
        name: 'WCAG 2.1 AA Compliance',
        command: 'npm run test:unit -- --testNamePattern="wcag|accessibility"',
        description: 'Tests for WCAG 2.1 AA compliance'
      },
      {
        name: 'Perceivable Content',
        command: 'npm run test:unit -- --testNamePattern="perceivable|alt|text"',
        description: 'Tests for perceivable content requirements'
      },
      {
        name: 'Operable Interface',
        command: 'npm run test:unit -- --testNamePattern="operable|keyboard|focus"',
        description: 'Tests for operable interface requirements'
      },
      {
        name: 'Understandable Content',
        command: 'npm run test:unit -- --testNamePattern="understandable|language|labels"',
        description: 'Tests for understandable content requirements'
      },
      {
        name: 'Robust Implementation',
        command: 'npm run test:unit -- --testNamePattern="robust|semantic|markup"',
        description: 'Tests for robust implementation requirements'
      }
    ];
    
    for (const test of wcagTests) {
      try {
        console.log(`📋 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.accessibilityResults.wcagTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.accessibilityResults.wcagTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runKeyboardTests() {
    console.log('⌨️ Running keyboard navigation tests...');
    
    const keyboardTests = [
      {
        name: 'Tab Navigation',
        command: 'npm run test:unit -- --testNamePattern="tab|navigation"',
        description: 'Tests for tab navigation support'
      },
      {
        name: 'Keyboard Shortcuts',
        command: 'npm run test:unit -- --testNamePattern="shortcut|hotkey"',
        description: 'Tests for keyboard shortcuts'
      },
      {
        name: 'Focus Management',
        command: 'npm run test:unit -- --testNamePattern="focus|focusable"',
        description: 'Tests for focus management'
      },
      {
        name: 'Skip Links',
        command: 'npm run test:unit -- --testNamePattern="skip|link"',
        description: 'Tests for skip links'
      },
      {
        name: 'Keyboard Traps',
        command: 'npm run test:unit -- --testNamePattern="trap|escape"',
        description: 'Tests for keyboard traps'
      }
    ];
    
    for (const test of keyboardTests) {
      try {
        console.log(`⌨️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.accessibilityResults.keyboardTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.accessibilityResults.keyboardTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runScreenReaderTests() {
    console.log('🔊 Running screen reader tests...');
    
    const screenReaderTests = [
      {
        name: 'ARIA Labels',
        command: 'npm run test:unit -- --testNamePattern="aria|label"',
        description: 'Tests for ARIA labels and roles'
      },
      {
        name: 'Screen Reader Announcements',
        command: 'npm run test:unit -- --testNamePattern="announce|live"',
        description: 'Tests for screen reader announcements'
      },
      {
        name: 'Semantic Markup',
        command: 'npm run test:unit -- --testNamePattern="semantic|heading"',
        description: 'Tests for semantic markup'
      },
      {
        name: 'Screen Reader Navigation',
        command: 'npm run test:unit -- --testNamePattern="navigation|landmark"',
        description: 'Tests for screen reader navigation'
      },
      {
        name: 'Screen Reader Forms',
        command: 'npm run test:unit -- --testNamePattern="form|input"',
        description: 'Tests for screen reader form support'
      }
    ];
    
    for (const test of screenReaderTests) {
      try {
        console.log(`🔊 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.accessibilityResults.screenReaderTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.accessibilityResults.screenReaderTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runColorTests() {
    console.log('🎨 Running color and contrast tests...');
    
    const colorTests = [
      {
        name: 'Color Contrast',
        command: 'npm run test:unit -- --testNamePattern="contrast|color"',
        description: 'Tests for color contrast compliance'
      },
      {
        name: 'Color Independence',
        command: 'npm run test:unit -- --testNamePattern="independence|colorblind"',
        description: 'Tests for color independence'
      },
      {
        name: 'Color Coding',
        command: 'npm run test:unit -- --testNamePattern="coding|pattern"',
        description: 'Tests for color coding alternatives'
      },
      {
        name: 'High Contrast Mode',
        command: 'npm run test:unit -- --testNamePattern="high-contrast|dark"',
        description: 'Tests for high contrast mode support'
      },
      {
        name: 'Color Blindness',
        command: 'npm run test:unit -- --testNamePattern="blindness|deuteranopia"',
        description: 'Tests for color blindness support'
      }
    ];
    
    for (const test of colorTests) {
      try {
        console.log(`🎨 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.accessibilityResults.colorTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.accessibilityResults.colorTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async analyzeAccessibilityResults() {
    console.log('📊 Analyzing accessibility results...');
    
    // Analyze WCAG tests
    const passedWCAGTests = this.accessibilityResults.wcagTests.filter(t => t.status === 'passed').length;
    const failedWCAGTests = this.accessibilityResults.wcagTests.filter(t => t.status === 'failed').length;
    
    // Analyze keyboard tests
    const passedKeyboardTests = this.accessibilityResults.keyboardTests.filter(t => t.status === 'passed').length;
    const failedKeyboardTests = this.accessibilityResults.keyboardTests.filter(t => t.status === 'failed').length;
    
    // Analyze screen reader tests
    const passedScreenReaderTests = this.accessibilityResults.screenReaderTests.filter(t => t.status === 'passed').length;
    const failedScreenReaderTests = this.accessibilityResults.screenReaderTests.filter(t => t.status === 'failed').length;
    
    // Analyze color tests
    const passedColorTests = this.accessibilityResults.colorTests.filter(t => t.status === 'passed').length;
    const failedColorTests = this.accessibilityResults.colorTests.filter(t => t.status === 'failed').length;
    
    // Generate recommendations
    this.generateAccessibilityRecommendations();
    
    console.log(`📈 Accessibility Analysis:`);
    console.log(`  WCAG Tests: ${passedWCAGTests} passed, ${failedWCAGTests} failed`);
    console.log(`  Keyboard Tests: ${passedKeyboardTests} passed, ${failedKeyboardTests} failed`);
    console.log(`  Screen Reader Tests: ${passedScreenReaderTests} passed, ${failedScreenReaderTests} failed`);
    console.log(`  Color Tests: ${passedColorTests} passed, ${failedColorTests} failed`);
    
    if (failedWCAGTests > 0 || failedKeyboardTests > 0 || failedScreenReaderTests > 0 || failedColorTests > 0) {
      console.log('⚠️  Accessibility issues found!');
    }
  }

  generateAccessibilityRecommendations() {
    const recommendations = [];
    
    // Check for common accessibility issues
    const failedWCAGTests = this.accessibilityResults.wcagTests.filter(t => t.status === 'failed');
    if (failedWCAGTests.length > 0) {
      recommendations.push('Address WCAG compliance issues');
    }
    
    const failedKeyboardTests = this.accessibilityResults.keyboardTests.filter(t => t.status === 'failed');
    if (failedKeyboardTests.length > 0) {
      recommendations.push('Improve keyboard navigation support');
    }
    
    const failedScreenReaderTests = this.accessibilityResults.screenReaderTests.filter(t => t.status === 'failed');
    if (failedScreenReaderTests.length > 0) {
      recommendations.push('Enhance screen reader support');
    }
    
    const failedColorTests = this.accessibilityResults.colorTests.filter(t => t.status === 'failed');
    if (failedColorTests.length > 0) {
      recommendations.push('Fix color and contrast issues');
    }
    
    // General accessibility recommendations
    recommendations.push('Implement comprehensive accessibility testing');
    recommendations.push('Add accessibility monitoring and logging');
    recommendations.push('Implement accessibility best practices');
    recommendations.push('Add accessibility documentation');
    recommendations.push('Implement accessibility training');
    recommendations.push('Add accessibility auditing');
    recommendations.push('Implement accessibility compliance');
    recommendations.push('Add accessibility governance');
    recommendations.push('Implement accessibility risk assessment');
    recommendations.push('Add accessibility user testing');
    
    this.accessibilityResults.recommendations = recommendations;
  }

  generateAccessibilityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        wcagTests: this.accessibilityResults.wcagTests.length,
        passedWCAGTests: this.accessibilityResults.wcagTests.filter(t => t.status === 'passed').length,
        failedWCAGTests: this.accessibilityResults.wcagTests.filter(t => t.status === 'failed').length,
        keyboardTests: this.accessibilityResults.keyboardTests.length,
        passedKeyboardTests: this.accessibilityResults.keyboardTests.filter(t => t.status === 'passed').length,
        failedKeyboardTests: this.accessibilityResults.keyboardTests.filter(t => t.status === 'failed').length,
        screenReaderTests: this.accessibilityResults.screenReaderTests.length,
        passedScreenReaderTests: this.accessibilityResults.screenReaderTests.filter(t => t.status === 'passed').length,
        failedScreenReaderTests: this.accessibilityResults.screenReaderTests.filter(t => t.status === 'failed').length,
        colorTests: this.accessibilityResults.colorTests.length,
        passedColorTests: this.accessibilityResults.colorTests.filter(t => t.status === 'passed').length,
        failedColorTests: this.accessibilityResults.colorTests.filter(t => t.status === 'failed').length
      },
      wcagTests: this.accessibilityResults.wcagTests,
      keyboardTests: this.accessibilityResults.keyboardTests,
      screenReaderTests: this.accessibilityResults.screenReaderTests,
      colorTests: this.accessibilityResults.colorTests,
      recommendations: this.accessibilityResults.recommendations,
      status: this.getAccessibilityStatus()
    };
    
    // Save JSON report
    fs.writeFileSync('accessibility-test-results.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    this.generateMarkdownReport(report);
    
    console.log('📄 Accessibility report generated');
  }

  generateMarkdownReport(report) {
    const markdown = `# Accessibility Test Report

Generated: ${new Date(report.timestamp).toISOString()}
Duration: ${report.duration}ms

## Summary
- **WCAG Tests**: ${report.summary.wcagTests} (${report.summary.passedWCAGTests} passed, ${report.summary.failedWCAGTests} failed)
- **Keyboard Tests**: ${report.summary.keyboardTests} (${report.summary.passedKeyboardTests} passed, ${report.summary.failedKeyboardTests} failed)
- **Screen Reader Tests**: ${report.summary.screenReaderTests} (${report.summary.passedScreenReaderTests} passed, ${report.summary.failedScreenReaderTests} failed)
- **Color Tests**: ${report.summary.colorTests} (${report.summary.passedColorTests} passed, ${report.summary.failedColorTests} failed)

## WCAG Compliance Tests
${report.wcagTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Keyboard Navigation Tests
${report.keyboardTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Screen Reader Tests
${report.screenReaderTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Color and Contrast Tests
${report.colorTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Accessibility Status
${report.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}

## Accessibility Testing Checklist
- [ ] WCAG 2.1 AA compliance is met
- [ ] Keyboard navigation works correctly
- [ ] Screen reader support is implemented
- [ ] Color and contrast meet requirements
- [ ] Accessibility monitoring is active
- [ ] Accessibility documentation is complete
- [ ] Accessibility training is provided
- [ ] Accessibility compliance is maintained

## Next Steps
1. Review all failed accessibility tests
2. Implement recommended accessibility improvements
3. Add comprehensive accessibility testing
4. Implement accessibility monitoring
5. Consider accessibility audit
`;
    
    fs.writeFileSync('accessibility-report.md', markdown);
  }

  getAccessibilityStatus() {
    const failedWCAGTests = this.accessibilityResults.wcagTests.filter(t => t.status === 'failed').length;
    const failedKeyboardTests = this.accessibilityResults.keyboardTests.filter(t => t.status === 'failed').length;
    const failedScreenReaderTests = this.accessibilityResults.screenReaderTests.filter(t => t.status === 'failed').length;
    const failedColorTests = this.accessibilityResults.colorTests.filter(t => t.status === 'failed').length;
    
    if (failedWCAGTests > 0 || failedKeyboardTests > 0 || failedScreenReaderTests > 0 || failedColorTests > 0) {
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
      accessibilityResults: this.accessibilityResults
    };
    
    fs.writeFileSync('accessibility-failure-report.json', JSON.stringify(failureReport, null, 2));
    console.log('📄 Accessibility failure report saved to accessibility-failure-report.json');
  }
}

// Run accessibility tests
const runner = new AccessibilityTestRunner();
runner.runAccessibilityTests().catch(error => {
  console.error('❌ Accessibility test runner failed:', error);
  process.exit(1);
});