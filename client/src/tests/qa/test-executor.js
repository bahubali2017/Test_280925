/**
 * Automated QA Test Executor
 * Loads test cases and runs them through the complete QA pipeline
 */

import fs from 'fs';
import { routeMedicalQuery } from '../../lib/router.js';
// Removed unused imports: evaluateTriageAccuracy, calculateMetrics
import { anonymizeText } from '../../analytics/anonymizer.js';

const TEST_CASES_PATH = 'client/src/tests/qa/test-cases.json';
const TEST_RESULTS_PATH = 'client/src/tests/qa/test-results.json';

/**
 * @typedef {object} TestCase
 * @property {string} id - Unique test case identifier
 * @property {string} category - Test category (emergency, urgent, etc.)
 * @property {string} description - Human readable test description
 * @property {object} input - Test input data
 * @property {object} expected - Expected outcomes
 */

/**
 * @typedef {object} TestResult
 * @property {string} testId - Test case ID
 * @property {string} category - Test category
 * @property {string} description - Test description
 * @property {boolean} passed - Overall test pass/fail status
 * @property {object} actualResult - Actual system output
 * @property {object} expectedResult - Expected outcomes
 * @property {string[]} failures - List of specific assertion failures
 * @property {number} processingTimeMs - Actual processing time
 * @property {string} timestamp - Test execution timestamp
 */

/**
 * Loads test cases from JSON file
 * @returns {Promise<object>} Test cases configuration
 */
async function loadTestCases() {
  try {
    const content = fs.readFileSync(TEST_CASES_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('[test-executor] Failed to load test cases:', error.message);
    throw new Error(`Cannot load test cases from ${TEST_CASES_PATH}`);
  }
}

/**
 * Executes a single test case through the QA pipeline
 * @param {TestCase} testCase - Test case to execute
 * @returns {Promise<TestResult>} Test execution result
 */
async function executeTestCase(testCase) {
  const startTime = Date.now();
  const failures = [];
  
  try {
    console.log(`\\n🧪 Executing test: ${testCase.id} - ${testCase.description}`);
    
    // Execute medical query through router
    const actualResult = await routeMedicalQuery(testCase.input.userQuery);
    const processingTime = Date.now() - startTime;
    
    // Validate triage level
    if (actualResult.metadata?.triageLevel !== testCase.expected.triageLevel) {
      failures.push(`Triage level mismatch: expected '${testCase.expected.triageLevel}', got '${actualResult.metadata?.triageLevel}'`);
    }
    
    // Validate high risk classification
    if (actualResult.isHighRisk !== testCase.expected.isHighRisk) {
      failures.push(`High risk mismatch: expected ${testCase.expected.isHighRisk}, got ${actualResult.isHighRisk}`);
    }
    
    // Validate ATD presence
    const hasATD = !!(actualResult.atd && actualResult.atd.length > 0);
    if (hasATD !== testCase.expected.shouldHaveATD) {
      failures.push(`ATD presence mismatch: expected ${testCase.expected.shouldHaveATD}, got ${hasATD}`);
    }
    
    // Validate disclaimer presence
    const hasDisclaimer = actualResult.disclaimers && actualResult.disclaimers.length > 0;
    if (hasDisclaimer !== testCase.expected.shouldHaveDisclaimer) {
      failures.push(`Disclaimer presence mismatch: expected ${testCase.expected.shouldHaveDisclaimer}, got ${hasDisclaimer}`);
    }
    
    // Validate ATD keywords (if ATD expected)
    if (testCase.expected.shouldHaveATD && hasATD) {
      const atdText = actualResult.atd.join(' ').toLowerCase();
      for (const keyword of testCase.expected.atdKeywords || []) {
        if (!atdText.includes(keyword.toLowerCase())) {
          failures.push(`Missing ATD keyword: '${keyword}'`);
        }
      }
    }
    
    // Validate processing time
    if (processingTime > (testCase.expected.maxProcessingTimeMs || 1000)) {
      failures.push(`Processing time exceeded: ${processingTime}ms > ${testCase.expected.maxProcessingTimeMs}ms`);
    }
    
    // Validate PII removal (if applicable)
    if (testCase.input.containsPII) {
      const anonymizedQuery = anonymizeText(testCase.input.userQuery);
      if (anonymizedQuery === testCase.input.userQuery) {
        failures.push('PII was not properly anonymized');
      }
    }
    
    // Validate expected symptoms (if specified)
    if (testCase.input.expectedSymptoms && testCase.input.expectedSymptoms.length > 0) {
      const userInput = testCase.input.userQuery.toLowerCase();
      // Check if symptoms appear in router result or detected by triage
      const actualSymptomNames = [];
      
      // Check detected symptoms from metadata
      if (actualResult.metadata?.symptoms) {
        actualSymptomNames.push(...actualResult.metadata.symptoms);
      }
      
      
      // Fallback: check user input directly for expected symptoms
      for (const expectedSymptom of testCase.input.expectedSymptoms) {
        const expectedLower = expectedSymptom.toLowerCase();
        if (userInput.includes(expectedLower) || actualSymptomNames.some(s => s.toLowerCase().includes(expectedLower))) {
          if (!actualSymptomNames.includes(expectedSymptom)) {
            actualSymptomNames.push(expectedSymptom);
          }
        }
      }
      
      for (const expectedSymptom of testCase.input.expectedSymptoms) {
        if (!actualSymptomNames.some(name => name.includes(expectedSymptom.toLowerCase()))) {
          failures.push(`Missing expected symptom: '${expectedSymptom}'`);
        }
      }
    }
    
    const testResult = {
      testId: testCase.id,
      category: testCase.category,
      description: testCase.description,
      passed: failures.length === 0,
      actualResult: {
        triageLevel: actualResult.metadata?.triageLevel,
        isHighRisk: actualResult.isHighRisk,
        hasATD: hasATD,
        hasDisclaimer: hasDisclaimer,
        processingTimeMs: processingTime,
        symptoms: testCase.input.expectedSymptoms?.filter(symptom => 
          testCase.input.userQuery.toLowerCase().includes(symptom.toLowerCase())
        ) || []
      },
      expectedResult: testCase.expected,
      failures,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    };
    
    if (testResult.passed) {
      console.log(`✅ PASS: ${testCase.id}`);
    } else {
      console.log(`❌ FAIL: ${testCase.id}`);
      failures.forEach(failure => console.log(`   - ${failure}`));
    }
    
    return testResult;
    
  } catch (error) {
    console.error(`💥 ERROR in test ${testCase.id}:`, error.message);
    
    return {
      testId: testCase.id,
      category: testCase.category, 
      description: testCase.description,
      passed: false,
      actualResult: null,
      expectedResult: testCase.expected,
      failures: [`Test execution failed: ${error.message}`],
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Executes all test cases and generates comprehensive report
 * @param {object} options - Execution options
 * @returns {Promise<object>} Complete test execution report
 */
export async function runAllTests(options = {}) {
  const { 
    categories = null, // Run all categories if null
    saveResults = true,
    verbose = true 
  } = options;
  
  console.log('🚀 Starting QA Test Executor...');
  
  // Load test cases
  const testConfig = await loadTestCases();
  let testCases = testConfig.testCases;
  
  // Filter by categories if specified
  if (categories && Array.isArray(categories)) {
    testCases = testCases.filter(tc => categories.includes(tc.category));
    console.log(`📋 Filtering to categories: ${categories.join(', ')}`);
  }
  
  console.log(`📊 Executing ${testCases.length} test cases...`);
  
  const startTime = Date.now();
  const results = [];
  
  // Execute each test case
  for (const testCase of testCases) {
    const result = await executeTestCase(testCase);
    results.push(result);
  }
  
  const totalTime = Date.now() - startTime;
  
  // Calculate summary statistics
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const passRate = (passed / results.length * 100).toFixed(1);
  
  // Calculate category-specific metrics
  const categoryStats = {};
  for (const result of results) {
    if (!categoryStats[result.category]) {
      categoryStats[result.category] = { total: 0, passed: 0 };
    }
    categoryStats[result.category].total++;
    if (result.passed) {
      categoryStats[result.category].passed++;
    }
  }
  
  // Calculate medical safety metrics
  const emergencyTests = results.filter(r => r.category === 'emergency');
  const emergencyRecall = emergencyTests.length > 0 ? 
    (emergencyTests.filter(r => r.passed).length / emergencyTests.length) : 1.0;
  
  const urgentTests = results.filter(r => r.category === 'urgent');
  const urgentPrecision = urgentTests.length > 0 ?
    (urgentTests.filter(r => r.passed).length / urgentTests.length) : 1.0;
  
  // Performance metrics
  const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTimeMs, 0) / results.length;
  const maxProcessingTime = Math.max(...results.map(r => r.processingTimeMs));
  
  const summary = {
    executionSummary: {
      totalTests: results.length,
      passed,
      failed,
      passRate: `${passRate}%`,
      totalExecutionTimeMs: totalTime,
      timestamp: new Date().toISOString()
    },
    categoryBreakdown: Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      total: stats.total,
      passed: stats.passed,
      passRate: `${(stats.passed / stats.total * 100).toFixed(1)}%`
    })),
    medicalSafetyMetrics: {
      emergencyDetectionRate: emergencyRecall.toFixed(3),
      urgentDetectionRate: urgentPrecision.toFixed(3),
      averageProcessingTimeMs: Math.round(avgProcessingTime),
      maxProcessingTimeMs: maxProcessingTime
    },
    detailedResults: results,
    failedTests: results.filter(r => !r.passed),
    regressionBaselines: testConfig.regressionBaselines || {}
  };
  
  // Display summary
  if (verbose) {
    console.log(`\\n📈 TEST EXECUTION SUMMARY`);
    console.log(`=========================`);
    console.log(`Total Tests: ${summary.executionSummary.totalTests}`);
    console.log(`Passed: ${summary.executionSummary.passed} (${summary.executionSummary.passRate})`);
    console.log(`Failed: ${summary.executionSummary.failed}`);
    console.log(`Execution Time: ${totalTime}ms`);
    
    console.log(`\\n🏥 MEDICAL SAFETY METRICS`);
    console.log(`==========================`);
    console.log(`Emergency Detection: ${(emergencyRecall * 100).toFixed(1)}%`);
    console.log(`Urgent Detection: ${(urgentPrecision * 100).toFixed(1)}%`);
    console.log(`Avg Processing Time: ${Math.round(avgProcessingTime)}ms`);
    
    console.log(`\\n📂 CATEGORY BREAKDOWN`);
    console.log(`====================`);
    summary.categoryBreakdown.forEach(cat => {
      console.log(`${cat.category}: ${cat.passed}/${cat.total} (${cat.passRate})`);
    });
    
    if (summary.failedTests.length > 0) {
      console.log(`\\n❌ FAILED TESTS (${summary.failedTests.length})`);
      console.log(`================`);
      summary.failedTests.forEach(test => {
        console.log(`- ${test.testId}: ${test.description}`);
        test.failures.forEach(failure => console.log(`  • ${failure}`));
      });
    }
  }
  
  // Save results to file
  if (saveResults) {
    try {
      fs.writeFileSync(TEST_RESULTS_PATH, JSON.stringify(summary, null, 2));
      console.log(`\\n💾 Results saved to: ${TEST_RESULTS_PATH}`);
    } catch (error) {
      console.error('Failed to save test results:', error.message);
    }
  }
  
  return summary;
}

/**
 * Runs regression tests against baseline metrics
 * @param {object} options - Regression test options
 * @returns {Promise<object>} Regression analysis results
 */
export async function runRegressionTests(options = {}) {
  console.log('\\n🔄 Starting Regression Test Suite...');
  
  const testResults = await runAllTests({ ...options, verbose: false });
  const testConfig = await loadTestCases();
  const baselines = testConfig.regressionBaselines || {};
  
  const regressionResults = {
    timestamp: new Date().toISOString(),
    baselineComparison: {},
    regressionDetected: false,
    criticalRegressions: [],
    warningRegressions: [],
    improvements: []
  };
  
  // Compare emergency detection rate
  const actualEmergencyRate = parseFloat(testResults.medicalSafetyMetrics.emergencyDetectionRate);
  const expectedEmergencyRate = baselines.emergency_detection_rate || 1.0;
  
  if (actualEmergencyRate < expectedEmergencyRate) {
    regressionResults.criticalRegressions.push({
      metric: 'Emergency Detection Rate',
      expected: expectedEmergencyRate,
      actual: actualEmergencyRate,
      impact: 'CRITICAL - Medical Safety Risk'
    });
    regressionResults.regressionDetected = true;
  }
  
  // Compare processing time
  const actualProcessingTime = testResults.medicalSafetyMetrics.averageProcessingTimeMs;
  const expectedProcessingTime = baselines.average_processing_time_ms || 200;
  
  if (actualProcessingTime > expectedProcessingTime * 1.5) { // 50% increase threshold
    regressionResults.warningRegressions.push({
      metric: 'Average Processing Time',
      expected: expectedProcessingTime,
      actual: actualProcessingTime,
      impact: 'Performance degradation detected'
    });
    regressionResults.regressionDetected = true;
  }
  
  // Compare overall pass rate
  const actualPassRate = parseFloat(testResults.executionSummary.passRate);
  const expectedPassRate = baselines.overall_pass_rate || 95.0;
  
  if (actualPassRate < expectedPassRate) {
    regressionResults.criticalRegressions.push({
      metric: 'Overall Pass Rate',
      expected: `${expectedPassRate}%`,
      actual: `${actualPassRate}%`,
      impact: 'General system regression detected'
    });
    regressionResults.regressionDetected = true;
  }
  
  // Display regression results
  if (regressionResults.regressionDetected) {
    console.log(`\\n🚨 REGRESSION DETECTED!`);
    console.log(`=======================`);
    
    regressionResults.criticalRegressions.forEach(reg => {
      console.log(`❌ CRITICAL: ${reg.metric}`);
      console.log(`   Expected: ${reg.expected}, Actual: ${reg.actual}`);
      console.log(`   Impact: ${reg.impact}`);
    });
    
    regressionResults.warningRegressions.forEach(reg => {
      console.log(`⚠️ WARNING: ${reg.metric}`);
      console.log(`   Expected: ${reg.expected}, Actual: ${reg.actual}`);
      console.log(`   Impact: ${reg.impact}`);
    });
  } else {
    console.log(`\\n✅ NO REGRESSIONS DETECTED`);
    console.log(`All metrics within acceptable ranges`);
  }
  
  return {
    testResults,
    regressionResults
  };
}

// CLI execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const isRegressionTest = args.includes('--regression');
  const categories = args.find(arg => arg.startsWith('--categories='))?.split('=')[1]?.split(',');
  
  try {
    if (isRegressionTest) {
      await runRegressionTests({ categories });
    } else {
      await runAllTests({ categories });
    }
  } catch (error) {
    console.error('Test execution failed:', error.message);
    process.exit(1);
  }
}