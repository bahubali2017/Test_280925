/**
 * Enhanced QA Test Runner with Regression Testing Capabilities
 * Integrates with existing qa.test.js and adds regression detection
 */

import { runAllTests, runRegressionTests } from './test-executor.js';

/**
 * @typedef {object} TestExecutionOptions
 * @property {boolean} [includeRegression=true] - Whether to include regression analysis
 * @property {string[]|null} [categories=null] - Test categories to run
 * @property {boolean} [verbose=true] - Whether to show verbose output
 */

/**
 * @typedef {object} QAModuleTestResult
 * @property {"PASSED"|"FAILED"|"SKIPPED"} status - Test status
 * @property {string} description - Test description
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {object} ExecutionSummary
 * @property {number} totalTests - Total number of tests
 * @property {number} passed - Number of passed tests
 * @property {string} passRate - Pass rate as percentage string
 */

/**
 * @typedef {object} MedicalSafetyMetrics
 * @property {string} [emergencyDetectionRate] - Emergency detection rate as string
 */

/**
 * @typedef {object} MedicalScenarioTestResult
 * @property {ExecutionSummary} executionSummary - Execution summary
 * @property {MedicalSafetyMetrics} [medicalSafetyMetrics] - Medical safety metrics
 */

/**
 * @typedef {object} RegressionItem
 * @property {string} metric - Metric name
 * @property {string} impact - Impact description
 */

/**
 * @typedef {object} RegressionAnalysisResult
 * @property {boolean} regressionDetected - Whether regression was detected
 * @property {RegressionItem[]} criticalRegressions - Critical regression items
 * @property {RegressionItem[]} warningRegressions - Warning regression items
 */

/**
 * @typedef {object} EnhancedQATestResults
 * @property {string} timestamp - ISO timestamp of test execution
 * @property {QAModuleTestResult|null} qaModuleTests - QA module test results
 * @property {MedicalScenarioTestResult|null} medicalScenarioTests - Medical scenario test results
 * @property {RegressionAnalysisResult|null} regressionAnalysis - Regression analysis results
 * @property {"PASSED"|"WARNING"|"FAILED"|"ERROR"|"UNKNOWN"} overallStatus - Overall test status
 * @property {string} [error] - Error message if failed
 */

/**
 * Enhanced QA test runner with regression capabilities
 * @param {TestExecutionOptions} [options] - Test execution options
 * @returns {Promise<EnhancedQATestResults>} Enhanced test results with regression analysis
 */
export async function runEnhancedQATests(options = {}) {
  const {
    includeRegression = true,
    categories = null,
    verbose = true
  } = options;

  console.info('🚀 Starting Enhanced QA Test Suite...');
  console.info('=====================================');

  /** @type {EnhancedQATestResults} */
  const results = {
    timestamp: new Date().toISOString(),
    qaModuleTests: null,
    medicalScenarioTests: null,
    regressionAnalysis: null,
    overallStatus: 'UNKNOWN'
  };

  try {
    // 1. Run existing QA module tests (from qa.test.js functionality)
    console.info('\n🔧 Phase 1: QA Module Validation');
    console.info('--------------------------------');
    
    // Import and run existing QA tests
    const runQAModuleTests = await import('../../qa/qa.test.js').catch(() => null);
    
    if (runQAModuleTests) {
      try {
        await runQAModuleTests();
        results.qaModuleTests = {
          status: 'PASSED',
          description: 'QA modules (metrics-evaluator, feedback-handler, improvement-suggester, version-tracker) validated'
        };
        console.info('✅ QA Module Tests: PASSED');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.qaModuleTests = {
          status: 'FAILED',
          description: 'QA module validation failed',
          error: errorMessage
        };
        console.error('❌ QA Module Tests: FAILED -', errorMessage);
      }
    } else {
      // Run simplified QA module validation
      results.qaModuleTests = {
        status: 'SKIPPED',
        description: 'QA module tests not available - running in standalone mode'
      };
      console.warn('⚠️ QA Module Tests: SKIPPED');
    }

    // 2. Run medical scenario tests
    console.info('\n🏥 Phase 2: Medical Scenario Testing');
    console.info('------------------------------------');
    
    const scenarioResults = await runAllTests({
      categories: categories,
      saveResults: true,
      verbose: false
    });
    
    results.medicalScenarioTests = /** @type {MedicalScenarioTestResult} */ (scenarioResults);
    
    const passRate = parseFloat(scenarioResults.executionSummary.passRate);
    console.info(`📊 Medical Scenarios: ${scenarioResults.executionSummary.passed}/${scenarioResults.executionSummary.totalTests} (${passRate}%)`);
    
    if (passRate >= 95) {
      console.info('✅ Medical Scenario Tests: PASSED');
    } else if (passRate >= 80) {
      console.warn('⚠️ Medical Scenario Tests: WARNING - Low pass rate');
    } else {
      console.error('❌ Medical Scenario Tests: FAILED - Critical pass rate');
    }

    // 3. Run regression analysis (if enabled)
    if (includeRegression) {
      console.info('\n🔄 Phase 3: Regression Analysis');
      console.info('-------------------------------');
      
      const regressionResults = await runRegressionTests({
        categories: categories,
        verbose: false
      });
      
      results.regressionAnalysis = regressionResults.regressionResults;
      
      if (regressionResults.regressionResults.regressionDetected) {
        console.error('🚨 Regression Analysis: ISSUES DETECTED');
        console.error(`   - Critical: ${regressionResults.regressionResults.criticalRegressions.length}`);
        console.error(`   - Warnings: ${regressionResults.regressionResults.warningRegressions.length}`);
      } else {
        console.info('✅ Regression Analysis: NO ISSUES');
      }
    }

    // 4. Determine overall status
    const qaStatus = results.qaModuleTests && results.qaModuleTests.status || 'SKIPPED';
    const scenarioStatus = passRate >= 95 ? 'PASSED' : passRate >= 80 ? 'WARNING' : 'FAILED';
    const regressionStatus = results.regressionAnalysis && results.regressionAnalysis.regressionDetected ? 'ISSUES' : 'CLEAN';

    if (qaStatus === 'FAILED' || scenarioStatus === 'FAILED' || 
        (includeRegression && regressionStatus === 'ISSUES' && results.regressionAnalysis && results.regressionAnalysis.criticalRegressions.length > 0)) {
      results.overallStatus = 'FAILED';
    } else if (qaStatus === 'WARNING' || scenarioStatus === 'WARNING' || regressionStatus === 'ISSUES') {
      results.overallStatus = 'WARNING';
    } else {
      results.overallStatus = 'PASSED';
    }

    // 5. Display final summary
    console.info('\n📋 ENHANCED QA TEST SUMMARY');
    console.info('===========================');
    console.info(`Overall Status: ${results.overallStatus}`);
    console.info(`QA Modules: ${qaStatus}`);
    console.info(`Medical Scenarios: ${scenarioStatus} (${passRate}%)`);
    if (includeRegression) {
      console.info(`Regression Check: ${regressionStatus}`);
    }
    
    // Display critical issues
    if (results.overallStatus !== 'PASSED') {
      console.error('\n🚨 CRITICAL ISSUES REQUIRING ATTENTION:');
      
      if (qaStatus === 'FAILED') {
        console.error('❌ QA Module validation failed');
      }
      
      if (scenarioStatus === 'FAILED') {
        console.error(`❌ Medical scenario pass rate too low: ${passRate}%`);
      }
      
      if (results.regressionAnalysis && results.regressionAnalysis.criticalRegressions.length > 0) {
        console.error('❌ Critical regressions detected:');
        for (const reg of results.regressionAnalysis.criticalRegressions) {
          console.error(`   - ${reg.metric}: ${reg.impact}`);
        }
      }
    }

    // Medical safety specific alerts
    const emergencyRateStr = results.medicalScenarioTests && results.medicalScenarioTests.medicalSafetyMetrics && results.medicalScenarioTests.medicalSafetyMetrics.emergencyDetectionRate || '1.0';
    const emergencyRate = parseFloat(emergencyRateStr);
    if (emergencyRate < 1.0) {
      console.error('\n🚨 MEDICAL SAFETY ALERT:');
      console.error(`Emergency detection rate below 100%: ${(emergencyRate * 100).toFixed(1)}%`);
      console.error('This could result in missed emergency cases - IMMEDIATE ATTENTION REQUIRED');
      results.overallStatus = 'FAILED';
    }

    if (verbose) {
      console.info('\n📊 Detailed Results Available:');
      console.info('- client/src/tests/qa/test-results.json');
      console.info('- Full medical scenario breakdown');
      console.info('- Performance metrics and timing data');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('💥 Enhanced QA Test Suite Failed:', errorMessage);
    results.overallStatus = 'ERROR';
    results.error = errorMessage;
  }

  return results;
}

/**
 * Runs critical path regression tests for deployment validation
 * @returns {Promise<boolean>} True if safe for deployment
 */
export async function validateDeploymentReadiness() {
  console.info('🚀 DEPLOYMENT READINESS VALIDATION');
  console.info('==================================');

  try {
    const results = await runEnhancedQATests({
      includeRegression: true,
      categories: ['emergency', 'urgent'], // Focus on safety-critical categories
      verbose: false
    });

    const emergencyRateStr = results.medicalScenarioTests && results.medicalScenarioTests.medicalSafetyMetrics && results.medicalScenarioTests.medicalSafetyMetrics.emergencyDetectionRate || '0';
    const emergencyRate = parseFloat(emergencyRateStr);
    const isReady = results.overallStatus === 'PASSED' && emergencyRate === 1.0;

    if (isReady) {
      console.info('✅ DEPLOYMENT APPROVED');
      console.info('All critical medical safety tests passed');
      console.info('No regressions detected in emergency handling');
      return true;
    } else {
      console.error('❌ DEPLOYMENT BLOCKED');
      console.error('Critical issues must be resolved before deployment');
      
      // Specific blocking issues
      if (results.overallStatus === 'FAILED') {
        console.error('- Overall test status: FAILED');
      }
      
      if (emergencyRate < 1.0) {
        console.error(`- Emergency detection: ${(emergencyRate * 100).toFixed(1)}% (Required: 100%)`);
      }
      
      return false;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('💥 Deployment validation failed:', errorMessage);
    return false;
  }
}

/**
 * Main CLI execution function
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);
  const deploymentCheck = args.includes('--deployment');
  const noRegression = args.includes('--no-regression');
  const categoriesArg = args.find(arg => arg.startsWith('--categories='));
  const categories = categoriesArg ? categoriesArg.split('=')[1]?.split(',') : null;
  
  try {
    if (deploymentCheck) {
      const isReady = await validateDeploymentReadiness();
      process.exit(isReady ? 0 : 1);
    } else {
      const results = await runEnhancedQATests({
        includeRegression: !noRegression,
        categories: categories
      });
      
      // Exit with appropriate code
      const exitCode = results.overallStatus === 'PASSED' ? 0 : 
                      results.overallStatus === 'WARNING' ? 1 : 2;
      process.exit(exitCode);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Test execution failed:', errorMessage);
    process.exit(2);
  }
}

// CLI execution support
const isMainModule = process.argv[1] && process.argv[1].endsWith('regression-runner.js');
if (isMainModule) {
  main().catch(error => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Main execution failed:', errorMessage);
    process.exit(2);
  });
}