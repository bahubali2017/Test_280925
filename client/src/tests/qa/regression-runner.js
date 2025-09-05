/**
 * Enhanced QA Test Runner with Regression Testing Capabilities
 * Integrates with existing qa.test.js and adds regression detection
 */

import { runAllTests, runRegressionTests } from './test-executor.js';

/**
 * Enhanced QA test runner with regression capabilities
 * @param {object} options - Test execution options
 * @returns {Promise<object>} Enhanced test results with regression analysis
 */
export async function runEnhancedQATests(options = {}) {
  const {
    includeRegression = true,
    categories = null,
    verbose = true
  } = options;

  console.log('🚀 Starting Enhanced QA Test Suite...');
  console.log('=====================================');

  const results = {
    timestamp: new Date().toISOString(),
    qaModuleTests: null,
    medicalScenarioTests: null,
    regressionAnalysis: null,
    overallStatus: 'UNKNOWN'
  };

  try {
    // 1. Run existing QA module tests (from qa.test.js functionality)
    console.log('\\n🔧 Phase 1: QA Module Validation');
    console.log('--------------------------------');
    
    // Import and run existing QA tests
    const runQAModuleTests = await import('../../qa/qa.test.js').catch(() => null);
    
    if (runQAModuleTests) {
      try {
        await runQAModuleTests();
        results.qaModuleTests = {
          status: 'PASSED',
          description: 'QA modules (metrics-evaluator, feedback-handler, improvement-suggester, version-tracker) validated'
        };
        console.log('✅ QA Module Tests: PASSED');
      } catch (error) {
        results.qaModuleTests = {
          status: 'FAILED',
          description: 'QA module validation failed',
          error: error.message
        };
        console.log('❌ QA Module Tests: FAILED -', error.message);
      }
    } else {
      // Run simplified QA module validation
      results.qaModuleTests = {
        status: 'SKIPPED',
        description: 'QA module tests not available - running in standalone mode'
      };
      console.log('⚠️ QA Module Tests: SKIPPED');
    }

    // 2. Run medical scenario tests
    console.log('\\n🏥 Phase 2: Medical Scenario Testing');
    console.log('------------------------------------');
    
    const scenarioResults = await runAllTests({
      categories: categories,
      saveResults: true,
      verbose: false
    });
    
    results.medicalScenarioTests = scenarioResults;
    
    const passRate = parseFloat(scenarioResults.executionSummary.passRate);
    console.log(`📊 Medical Scenarios: ${scenarioResults.executionSummary.passed}/${scenarioResults.executionSummary.totalTests} (${passRate}%)`);
    
    if (passRate >= 95) {
      console.log('✅ Medical Scenario Tests: PASSED');
    } else if (passRate >= 80) {
      console.log('⚠️ Medical Scenario Tests: WARNING - Low pass rate');
    } else {
      console.log('❌ Medical Scenario Tests: FAILED - Critical pass rate');
    }

    // 3. Run regression analysis (if enabled)
    if (includeRegression) {
      console.log('\\n🔄 Phase 3: Regression Analysis');
      console.log('-------------------------------');
      
      const regressionResults = await runRegressionTests({
        categories: categories,
        verbose: false
      });
      
      results.regressionAnalysis = regressionResults.regressionResults;
      
      if (regressionResults.regressionResults.regressionDetected) {
        console.log('🚨 Regression Analysis: ISSUES DETECTED');
        console.log(`   - Critical: ${regressionResults.regressionResults.criticalRegressions.length}`);
        console.log(`   - Warnings: ${regressionResults.regressionResults.warningRegressions.length}`);
      } else {
        console.log('✅ Regression Analysis: NO ISSUES');
      }
    }

    // 4. Determine overall status
    const qaStatus = results.qaModuleTests?.status || 'SKIPPED';
    const scenarioStatus = passRate >= 95 ? 'PASSED' : passRate >= 80 ? 'WARNING' : 'FAILED';
    const regressionStatus = results.regressionAnalysis?.regressionDetected ? 'ISSUES' : 'CLEAN';

    if (qaStatus === 'FAILED' || scenarioStatus === 'FAILED' || 
        (includeRegression && regressionStatus === 'ISSUES' && results.regressionAnalysis?.criticalRegressions.length > 0)) {
      results.overallStatus = 'FAILED';
    } else if (qaStatus === 'WARNING' || scenarioStatus === 'WARNING' || regressionStatus === 'ISSUES') {
      results.overallStatus = 'WARNING';
    } else {
      results.overallStatus = 'PASSED';
    }

    // 5. Display final summary
    console.log('\\n📋 ENHANCED QA TEST SUMMARY');
    console.log('===========================');
    console.log(`Overall Status: ${results.overallStatus}`);
    console.log(`QA Modules: ${qaStatus}`);
    console.log(`Medical Scenarios: ${scenarioStatus} (${passRate}%)`);
    if (includeRegression) {
      console.log(`Regression Check: ${regressionStatus}`);
    }
    
    // Display critical issues
    if (results.overallStatus !== 'PASSED') {
      console.log('\\n🚨 CRITICAL ISSUES REQUIRING ATTENTION:');
      
      if (qaStatus === 'FAILED') {
        console.log('❌ QA Module validation failed');
      }
      
      if (scenarioStatus === 'FAILED') {
        console.log(`❌ Medical scenario pass rate too low: ${passRate}%`);
      }
      
      if (results.regressionAnalysis?.criticalRegressions.length > 0) {
        console.log('❌ Critical regressions detected:');
        results.regressionAnalysis.criticalRegressions.forEach(reg => {
          console.log(`   - ${reg.metric}: ${reg.impact}`);
        });
      }
    }

    // Medical safety specific alerts
    const emergencyRate = parseFloat(results.medicalScenarioTests?.medicalSafetyMetrics?.emergencyDetectionRate || '1.0');
    if (emergencyRate < 1.0) {
      console.log('\\n🚨 MEDICAL SAFETY ALERT:');
      console.log(`Emergency detection rate below 100%: ${(emergencyRate * 100).toFixed(1)}%`);
      console.log('This could result in missed emergency cases - IMMEDIATE ATTENTION REQUIRED');
      results.overallStatus = 'FAILED';
    }

    if (verbose) {
      console.log('\\n📊 Detailed Results Available:');
      console.log('- client/src/tests/qa/test-results.json');
      console.log('- Full medical scenario breakdown');
      console.log('- Performance metrics and timing data');
    }

  } catch (error) {
    console.error('💥 Enhanced QA Test Suite Failed:', error.message);
    results.overallStatus = 'ERROR';
    results.error = error.message;
  }

  return results;
}

/**
 * Runs critical path regression tests for deployment validation
 * @returns {Promise<boolean>} True if safe for deployment
 */
export async function validateDeploymentReadiness() {
  console.log('🚀 DEPLOYMENT READINESS VALIDATION');
  console.log('==================================');

  try {
    const results = await runEnhancedQATests({
      includeRegression: true,
      categories: ['emergency', 'urgent'], // Focus on safety-critical categories
      verbose: false
    });

    const isReady = results.overallStatus === 'PASSED' && 
                   parseFloat(results.medicalScenarioTests?.medicalSafetyMetrics?.emergencyDetectionRate || '0') === 1.0;

    if (isReady) {
      console.log('✅ DEPLOYMENT APPROVED');
      console.log('All critical medical safety tests passed');
      console.log('No regressions detected in emergency handling');
      return true;
    } else {
      console.log('❌ DEPLOYMENT BLOCKED');
      console.log('Critical issues must be resolved before deployment');
      
      // Specific blocking issues
      if (results.overallStatus === 'FAILED') {
        console.log('- Overall test status: FAILED');
      }
      
      const emergencyRate = parseFloat(results.medicalScenarioTests?.medicalSafetyMetrics?.emergencyDetectionRate || '0');
      if (emergencyRate < 1.0) {
        console.log(`- Emergency detection: ${(emergencyRate * 100).toFixed(1)}% (Required: 100%)`);
      }
      
      return false;
    }

  } catch (error) {
    console.error('💥 Deployment validation failed:', error.message);
    return false;
  }
}

// CLI execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const deploymentCheck = args.includes('--deployment');
  const noRegression = args.includes('--no-regression');
  const categories = args.find(arg => arg.startsWith('--categories='))?.split('=')[1]?.split(',');
  
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
    console.error('Test execution failed:', error.message);
    process.exit(2);
  }
}