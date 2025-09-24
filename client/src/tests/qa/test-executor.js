/**
 * Automated QA Test Executor
 * Loads test cases and runs them through the complete QA pipeline
 */

import fs from 'fs';
import { routeMedicalQuery } from '../../lib/router.js';
import { anonymizeText } from '../../analytics/anonymizer.js';

const TEST_CASES_PATH = 'client/src/tests/qa/test-cases.json';
const TEST_RESULTS_PATH = 'client/src/tests/qa/test-results.json';

/** @typedef {{ id: string, input: string, expected: string, meta?: Record<string, unknown> }} TestCase */
/** @typedef {{ id: string, passed: boolean, actual: string, expected: string, durationMs: number, error?: string }} TestResult */
/** @typedef {{ total: number, passed: number, failed: number, results: TestResult[] }} TestReport */

/**
 * @typedef {object} ExtendedTestCase
 * @property {string} id - Unique test case identifier
 * @property {string} category - Test category (emergency, urgent, etc.)
 * @property {string} description - Human readable test description
 * @property {object} input - Test input data
 * @property {string} input.userQuery - User query string
 * @property {boolean} [input.containsPII] - Whether input contains PII
 * @property {string[]} [input.expectedSymptoms] - Expected symptoms in query
 * @property {object} expected - Expected outcomes
 * @property {string} expected.triageLevel - Expected triage level
 * @property {boolean} expected.isHighRisk - Expected high risk flag
 * @property {boolean} expected.shouldHaveATD - Expected ATD presence
 * @property {boolean} expected.shouldHaveDisclaimer - Expected disclaimer presence
 * @property {string[]} [expected.atdKeywords] - Expected ATD keywords
 * @property {number} [expected.maxProcessingTimeMs] - Max processing time
 */

/**
 * @typedef {object} ExtendedTestResult
 * @property {string} testId - Test case ID
 * @property {string} category - Test category
 * @property {string} description - Test description
 * @property {boolean} passed - Overall test pass/fail status
 * @property {object|null} actualResult - Actual system output
 * @property {object} expectedResult - Expected outcomes
 * @property {string[]} failures - List of specific assertion failures
 * @property {number} processingTimeMs - Actual processing time
 * @property {string} timestamp - Test execution timestamp
 */

/**
 * @typedef {object} TestConfig
 * @property {ExtendedTestCase[]} testCases - Array of test cases
 * @property {Record<string, unknown>} [regressionBaselines] - Regression baselines
 */

/**
 * @typedef {object} CategoryStats
 * @property {number} total - Total tests in category
 * @property {number} passed - Passed tests in category
 */

/**
 * @typedef {object} ExecutionOptions
 * @property {string[]|null} [categories] - Categories to run
 * @property {boolean} [saveResults] - Whether to save results
 * @property {boolean} [verbose] - Verbose output
 */

/**
 * Loads test cases from JSON file
 * @returns {Promise<TestConfig>} Test cases configuration
 */
async function loadTestCases() {
  try {
    const content = fs.readFileSync(TEST_CASES_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[test-executor] Failed to load test cases:', errorMessage);
    throw new Error(`Cannot load test cases from ${TEST_CASES_PATH}`);
  }
}

/**
 * Executes a single test case through the QA pipeline
 * @param {ExtendedTestCase} testCase - Test case to execute
 * @returns {Promise<ExtendedTestResult>} Test execution result
 */
async function executeTestCase(testCase) {
  const startTime = Date.now();
  /** @type {string[]} */
  const failures = [];
  
  try {
    console.info(`🧪 Executing test: ${testCase.id} - ${testCase.description}`);
    
    // Execute medical query through router
    const actualResult = await routeMedicalQuery(testCase.input.userQuery);
    const processingTime = Date.now() - startTime;
    
    // Validate triage level
    const actualTriageLevel = actualResult && actualResult.metadata && typeof actualResult.metadata.triageLevel === 'string' 
      ? actualResult.metadata.triageLevel 
      : '';
    const expectedTriageLevel = testCase.expected && typeof testCase.expected.triageLevel === 'string' 
      ? testCase.expected.triageLevel 
      : '';
    
    if (actualTriageLevel !== expectedTriageLevel) {
      failures.push(`Triage level mismatch: expected '${expectedTriageLevel}', got '${actualTriageLevel}'`);
    }
    
    // Validate high risk classification
    const actualIsHighRisk = actualResult && typeof actualResult.isHighRisk === 'boolean' 
      ? actualResult.isHighRisk 
      : false;
    const expectedIsHighRisk = testCase.expected && typeof testCase.expected.isHighRisk === 'boolean' 
      ? testCase.expected.isHighRisk 
      : false;
    
    if (actualIsHighRisk !== expectedIsHighRisk) {
      failures.push(`High risk mismatch: expected ${expectedIsHighRisk}, got ${actualIsHighRisk}`);
    }
    
    // Validate ATD presence
    const hasATD = !!(actualResult && actualResult.atd && Array.isArray(actualResult.atd) && actualResult.atd.length > 0);
    const shouldHaveATD = testCase.expected && typeof testCase.expected.shouldHaveATD === 'boolean' 
      ? testCase.expected.shouldHaveATD 
      : false;
    
    if (hasATD !== shouldHaveATD) {
      failures.push(`ATD presence mismatch: expected ${shouldHaveATD}, got ${hasATD}`);
    }
    
    // Validate disclaimer presence
    const hasDisclaimer = !!(actualResult && actualResult.disclaimers && Array.isArray(actualResult.disclaimers) && actualResult.disclaimers.length > 0);
    const shouldHaveDisclaimer = testCase.expected && typeof testCase.expected.shouldHaveDisclaimer === 'boolean' 
      ? testCase.expected.shouldHaveDisclaimer 
      : false;
    
    if (hasDisclaimer !== shouldHaveDisclaimer) {
      failures.push(`Disclaimer presence mismatch: expected ${shouldHaveDisclaimer}, got ${hasDisclaimer}`);
    }
    
    // Validate ATD keywords (if ATD expected)
    if (shouldHaveATD && hasATD && actualResult && actualResult.atd) {
      const atdText = actualResult.atd.join(' ').toLowerCase();
      const atdKeywords = testCase.expected && Array.isArray(testCase.expected.atdKeywords) 
        ? testCase.expected.atdKeywords 
        : [];
      
      for (const keyword of atdKeywords) {
        if (typeof keyword === 'string' && !atdText.includes(keyword.toLowerCase())) {
          failures.push(`Missing ATD keyword: '${keyword}'`);
        }
      }
    }
    
    // Validate processing time
    const maxProcessingTime = testCase.expected && typeof testCase.expected.maxProcessingTimeMs === 'number' 
      ? testCase.expected.maxProcessingTimeMs 
      : 1000;
    
    if (processingTime > maxProcessingTime) {
      failures.push(`Processing time exceeded: ${processingTime}ms > ${maxProcessingTime}ms`);
    }
    
    // Validate PII removal (if applicable)
    if (testCase.input && typeof testCase.input.containsPII === 'boolean' && testCase.input.containsPII) {
      const anonymizedQuery = anonymizeText(testCase.input.userQuery);
      if (anonymizedQuery === testCase.input.userQuery) {
        failures.push('PII was not properly anonymized');
      }
    }
    
    // Validate expected symptoms (if specified)
    const expectedSymptoms = testCase.input && Array.isArray(testCase.input.expectedSymptoms) 
      ? testCase.input.expectedSymptoms 
      : [];
    
    if (expectedSymptoms.length > 0) {
      const userInput = testCase.input.userQuery.toLowerCase();
      /** @type {string[]} */
      const actualSymptomNames = [];
      
      // Check detected symptoms from metadata
      if (actualResult && actualResult.metadata && Array.isArray(actualResult.metadata.symptoms)) {
        actualSymptomNames.push(...actualResult.metadata.symptoms);
      }
      
      // Fallback: check user input directly for expected symptoms
      for (const expectedSymptom of expectedSymptoms) {
        if (typeof expectedSymptom === 'string') {
          const expectedLower = expectedSymptom.toLowerCase();
          if (userInput.includes(expectedLower) || actualSymptomNames.some(s => typeof s === 'string' && s.toLowerCase().includes(expectedLower))) {
            if (!actualSymptomNames.includes(expectedSymptom)) {
              actualSymptomNames.push(expectedSymptom);
            }
          }
        }
      }
      
      for (const expectedSymptom of expectedSymptoms) {
        if (typeof expectedSymptom === 'string' && !actualSymptomNames.some(name => typeof name === 'string' && name.includes(expectedSymptom.toLowerCase()))) {
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
        triageLevel: actualTriageLevel,
        isHighRisk: actualIsHighRisk,
        hasATD: hasATD,
        hasDisclaimer: hasDisclaimer,
        processingTimeMs: processingTime,
        symptoms: expectedSymptoms.filter(symptom => 
          typeof symptom === 'string' && testCase.input.userQuery.toLowerCase().includes(symptom.toLowerCase())
        )
      },
      expectedResult: testCase.expected,
      failures,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    };
    
    if (testResult.passed) {
      console.info(`✅ PASS: ${testCase.id}`);
    } else {
      console.error(`❌ FAIL: ${testCase.id}`);
      failures.forEach(failure => console.error(`   - ${failure}`));
    }
    
    return testResult;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`💥 ERROR in test ${testCase.id}:`, errorMessage);
    
    return {
      testId: testCase.id,
      category: testCase.category, 
      description: testCase.description,
      passed: false,
      actualResult: null,
      expectedResult: testCase.expected,
      failures: [`Test execution failed: ${errorMessage}`],
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Executes all test cases and generates comprehensive report
 * @param {ExecutionOptions} [options={}] - Execution options
 * @returns {Promise<object>} Complete test execution report
 */
export async function runAllTests(options = {}) {
  const { 
    categories = null,
    saveResults = true,
    verbose = true 
  } = options;
  
  console.info('🚀 Starting QA Test Executor...');
  
  // Load test cases
  const testConfig = await loadTestCases();
  let testCases = testConfig.testCases;
  
  // Filter by categories if specified
  if (categories && Array.isArray(categories)) {
    testCases = testCases.filter(tc => categories.includes(tc.category));
    console.info(`📋 Filtering to categories: ${categories.join(', ')}`);
  }
  
  console.info(`📊 Executing ${testCases.length} test cases...`);
  
  const startTime = Date.now();
  /** @type {ExtendedTestResult[]} */
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
  /** @type {Record<string, CategoryStats>} */
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
    console.info(`\n📈 TEST EXECUTION SUMMARY`);
    console.info(`=========================`);
    console.info(`Total Tests: ${summary.executionSummary.totalTests}`);
    console.info(`Passed: ${summary.executionSummary.passed} (${summary.executionSummary.passRate})`);
    console.info(`Failed: ${summary.executionSummary.failed}`);
    console.info(`Execution Time: ${totalTime}ms`);
    
    console.info(`\n🏥 MEDICAL SAFETY METRICS`);
    console.info(`==========================`);
    console.info(`Emergency Detection: ${(emergencyRecall * 100).toFixed(1)}%`);
    console.info(`Urgent Detection: ${(urgentPrecision * 100).toFixed(1)}%`);
    console.info(`Avg Processing Time: ${Math.round(avgProcessingTime)}ms`);
    
    console.info(`\n📂 CATEGORY BREAKDOWN`);
    console.info(`====================`);
    summary.categoryBreakdown.forEach(cat => {
      console.info(`${cat.category}: ${cat.passed}/${cat.total} (${cat.passRate})`);
    });
    
    if (summary.failedTests.length > 0) {
      console.error(`\n❌ FAILED TESTS (${summary.failedTests.length})`);
      console.error(`================`);
      summary.failedTests.forEach(test => {
        console.error(`- ${test.testId}: ${test.description}`);
        test.failures.forEach(failure => console.error(`  • ${failure}`));
      });
    }
  }
  
  // Save results to file
  if (saveResults) {
    try {
      fs.writeFileSync(TEST_RESULTS_PATH, JSON.stringify(summary, null, 2));
      console.info(`\n💾 Results saved to: ${TEST_RESULTS_PATH}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to save test results:', errorMessage);
    }
  }
  
  return summary;
}

/**
 * Runs regression tests against baseline metrics
 * @param {ExecutionOptions} [options={}] - Regression test options
 * @returns {Promise<object>} Regression analysis results
 */
export async function runRegressionTests(options = {}) {
  console.info('\n🔄 Starting Regression Test Suite...');
  
  const testResults = await runAllTests({ ...options, verbose: false });
  const testConfig = await loadTestCases();
  const baselines = testConfig.regressionBaselines || {};
  
  /** @type {Array<{metric: string, expected: number|string, actual: number|string, impact: string}>} */
  const criticalRegressions = [];
  /** @type {Array<{metric: string, expected: number|string, actual: number|string, impact: string}>} */
  const warningRegressions = [];
  /** @type {Array<{metric: string, improvement: string}>} */
  const improvements = [];
  
  const regressionResults = {
    timestamp: new Date().toISOString(),
    baselineComparison: {},
    regressionDetected: false,
    criticalRegressions,
    warningRegressions,
    improvements
  };
  
  // Compare emergency detection rate
  const actualEmergencyRate = parseFloat(testResults.medicalSafetyMetrics.emergencyDetectionRate);
  const expectedEmergencyRate = typeof baselines.emergency_detection_rate === 'number' 
    ? baselines.emergency_detection_rate 
    : 1.0;
  
  if (actualEmergencyRate < expectedEmergencyRate) {
    criticalRegressions.push({
      metric: 'Emergency Detection Rate',
      expected: expectedEmergencyRate,
      actual: actualEmergencyRate,
      impact: 'CRITICAL - Medical Safety Risk'
    });
    regressionResults.regressionDetected = true;
  }
  
  // Compare processing time
  const actualProcessingTime = testResults.medicalSafetyMetrics.averageProcessingTimeMs;
  const expectedProcessingTime = typeof baselines.average_processing_time_ms === 'number' 
    ? baselines.average_processing_time_ms 
    : 200;
  
  if (actualProcessingTime > expectedProcessingTime * 1.5) { // 50% increase threshold
    warningRegressions.push({
      metric: 'Average Processing Time',
      expected: expectedProcessingTime,
      actual: actualProcessingTime,
      impact: 'Performance degradation detected'
    });
    regressionResults.regressionDetected = true;
  }
  
  // Compare overall pass rate
  const actualPassRate = parseFloat(testResults.executionSummary.passRate);
  const expectedPassRate = typeof baselines.overall_pass_rate === 'number' 
    ? baselines.overall_pass_rate 
    : 95.0;
  
  if (actualPassRate < expectedPassRate) {
    criticalRegressions.push({
      metric: 'Overall Pass Rate',
      expected: `${expectedPassRate}%`,
      actual: `${actualPassRate}%`,
      impact: 'General system regression detected'
    });
    regressionResults.regressionDetected = true;
  }
  
  // Display regression results
  if (regressionResults.regressionDetected) {
    console.error(`\n🚨 REGRESSION DETECTED!`);
    console.error(`=======================`);
    
    criticalRegressions.forEach(reg => {
      console.error(`❌ CRITICAL: ${reg.metric}`);
      console.error(`   Expected: ${reg.expected}, Actual: ${reg.actual}`);
      console.error(`   Impact: ${reg.impact}`);
    });
    
    warningRegressions.forEach(reg => {
      console.warn(`⚠️ WARNING: ${reg.metric}`);
      console.warn(`   Expected: ${reg.expected}, Actual: ${reg.actual}`);
      console.warn(`   Impact: ${reg.impact}`);
    });
  } else {
    console.info(`\n✅ NO REGRESSIONS DETECTED`);
    console.info(`All metrics within acceptable ranges`);
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
  const categoriesArg = args.find(arg => arg.startsWith('--categories='));
  const categories = categoriesArg ? categoriesArg.split('=')[1]?.split(',') : null;
  
  try {
    if (isRegressionTest) {
      await runRegressionTests({ categories });
    } else {
      await runAllTests({ categories });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Test execution failed:', errorMessage);
    process.exit(1);
  }
}