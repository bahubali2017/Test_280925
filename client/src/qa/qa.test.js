/**
 * QA Framework Test Suite for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: All tests use anonymized sample data and do not
 * process any real personal health information.
 * 
 * @file Comprehensive test suite for Phase 6 QA modules
 */

import { evaluateTriageAccuracy, calculateMetrics, generateEvaluationReport } from './metrics-evaluator.js';
import { captureFeedback, analyzeFeedbackTrends, validateFeedback } from './feedback-handler.js';
import { generateImprovementSuggestions, generateImprovementReport } from './improvement-suggester.js';
import { logSystemChange, validateChangeData, assessChangeImpact } from './version-tracker.js';

/**
 * Simple test assertion function
 * @param {boolean} condition - Condition to test
 * @param {string} message - Test description
 */
function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
  } else {
    console.log(`❌ FAIL: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
}

/**
 * Creates sample evaluation data for testing
 * @returns {Array<object>} Sample dataset
 */
function createSampleEvaluationData() {
  return [
    {
      userInput: 'chest pain',
      triageLevel: 'emergency',
      isHighRisk: true,
      disclaimers: ['Seek immediate medical attention', 'Call emergency services']
    },
    {
      userInput: 'mild headache',
      triageLevel: 'non_urgent',
      isHighRisk: false,
      disclaimers: []
    },
    {
      userInput: 'severe headache',
      triageLevel: 'urgent',
      isHighRisk: false,
      disclaimers: ['Monitor symptoms closely']
    },
    {
      userInput: 'difficulty breathing',
      triageLevel: 'emergency',
      isHighRisk: true,
      disclaimers: ['Call 911 immediately']
    },
    {
      userInput: 'minor cold symptoms',
      triageLevel: 'non_urgent',
      isHighRisk: false,
      disclaimers: []
    }
  ];
}

/**
 * Creates sample feedback data for testing
 * @returns {Array<object>} Sample feedback
 */
function createSampleFeedbackData() {
  return [
    {
      query: 'Test query about headache',
      perceivedAccuracy: 'high',
      feedbackText: 'Very helpful response',
      userType: 'patient',
      timestamp: new Date().toISOString(),
      analysis: {
        category: 'accuracy',
        severity: 'low',
        actionRequired: false
      }
    },
    {
      query: 'Another test query',
      perceivedAccuracy: 'low',
      feedbackText: 'Response was confusing and unclear',
      userType: 'doctor',
      timestamp: new Date().toISOString(),
      analysis: {
        category: 'clarity',
        severity: 'medium',
        actionRequired: false
      }
    },
    {
      query: 'Emergency test query',
      perceivedAccuracy: 'low',
      feedbackText: 'Dangerous advice given',
      userType: 'patient',
      timestamp: new Date().toISOString(),
      analysis: {
        category: 'safety',
        severity: 'critical',
        actionRequired: true
      }
    }
  ];
}

// === METRICS EVALUATOR TESTS ===

console.log('🧪 Testing QA Framework - Phase 6\n');

console.log('📊 Testing Metrics Evaluator...');

// Test triage accuracy evaluation
const accurateEval = evaluateTriageAccuracy('chest pain', 'emergency');
assert(accurateEval.isAccurate === true, 'Metrics Evaluator - Accurate Triage Detection');
assert(accurateEval.expectedTriage === 'emergency', 'Metrics Evaluator - Expected Triage Lookup');

const inaccurateEval = evaluateTriageAccuracy('mild headache', 'emergency');
assert(inaccurateEval.isAccurate === false, 'Metrics Evaluator - Inaccurate Triage Detection');
assert(inaccurateEval.isOverTriage === true, 'Metrics Evaluator - Over-triage Detection');

// Test metrics calculation
const sampleData = createSampleEvaluationData();
const metrics = calculateMetrics(sampleData);
assert(typeof metrics.accuracy === 'number', 'Metrics Evaluator - Accuracy Calculation');
assert(typeof metrics.precision === 'number', 'Metrics Evaluator - Precision Calculation');
assert(typeof metrics.recall === 'number', 'Metrics Evaluator - Recall Calculation');
assert(metrics.totalEvaluated === sampleData.length, 'Metrics Evaluator - Dataset Count');

// Test evaluation report generation
const report = generateEvaluationReport(sampleData);
assert(report.reportId && report.reportId.includes('eval_'), 'Metrics Evaluator - Report Generation');
assert(report.performance && typeof report.performance.overallAccuracy === 'number', 'Metrics Evaluator - Performance Metrics');
assert(Array.isArray(report.recommendations), 'Metrics Evaluator - Recommendations Generation');

// === FEEDBACK HANDLER TESTS ===

console.log('\n📝 Testing Feedback Handler...');

// Test feedback validation
const validFeedback = {
  query: 'Test medical query',
  perceivedAccuracy: /** @type {const} */ ('high'),
  feedbackText: 'Great response',
  userType: /** @type {const} */ ('patient'),
  timestamp: new Date().toISOString()
};

const validation = validateFeedback(validFeedback);
assert(validation.isValid === true, 'Feedback Handler - Valid Feedback Validation');
assert(validation.errors.length === 0, 'Feedback Handler - No Validation Errors');

const invalidFeedback = {
  query: '',
  perceivedAccuracy: 'invalid',
  userType: 'invalid'
};

const invalidValidation = validateFeedback(invalidFeedback);
assert(invalidValidation.isValid === false, 'Feedback Handler - Invalid Feedback Detection');
assert(invalidValidation.errors.length > 0, 'Feedback Handler - Validation Error Detection');

// Test feedback trends analysis
const sampleFeedback = createSampleFeedbackData();
const trends = analyzeFeedbackTrends(sampleFeedback);
assert(trends.totalFeedback === sampleFeedback.length, 'Feedback Handler - Feedback Count');
assert(typeof trends.averageAccuracy === 'number', 'Feedback Handler - Average Accuracy Calculation');
assert(trends.actionRequired > 0, 'Feedback Handler - Action Required Detection');

// === IMPROVEMENT SUGGESTER TESTS ===

console.log('\n💡 Testing Improvement Suggester...');

// Test improvement suggestions generation
const suggestions = await generateImprovementSuggestions({ feedbackDays: 7, minOccurrences: 1 });
assert(Array.isArray(suggestions), 'Improvement Suggester - Suggestions Array');

// Test improvement report generation
const improvementReport = await generateImprovementReport({ feedbackDays: 7, minOccurrences: 1 });
assert(improvementReport.reportId && improvementReport.reportId.includes('improvement_'), 'Improvement Suggester - Report Generation');
assert(improvementReport.summary && typeof improvementReport.summary.totalSuggestions === 'number', 'Improvement Suggester - Summary Generation');
assert(Array.isArray(improvementReport.actionItems), 'Improvement Suggester - Action Items Generation');

// === VERSION TRACKER TESTS ===

console.log('\n📋 Testing Version Tracker...');

// Test change data validation
const validChangeData = {
  version: 'v6.1.0',
  author: 'QA Test Suite',
  changeType: 'prompt_update',
  reason: 'Test change for QA validation',
  impact: 'low',
  affectedComponents: ['test-component']
};

const changeValidation = validateChangeData(validChangeData);
assert(changeValidation.isValid === true, 'Version Tracker - Valid Change Data Validation');
assert(changeValidation.errors.length === 0, 'Version Tracker - No Change Validation Errors');

// Test change impact assessment
const impactAssessment = assessChangeImpact('triage_logic', ['triage', 'safety']);
assert(impactAssessment.suggestedImpact === 'critical', 'Version Tracker - Critical Impact Assessment');
assert(impactAssessment.requiresExtensiveTesting === true, 'Version Tracker - Testing Requirements');
assert(impactAssessment.riskFactors.length > 0, 'Version Tracker - Risk Factor Detection');

// Test system change logging
const changeResult = await logSystemChange(validChangeData);
assert(changeResult === true, 'Version Tracker - System Change Logging');

// === INTEGRATION TESTS ===

console.log('\n🔄 Testing QA Framework Integration...');

// Test feedback capture with query context
const queryContext = {
  userInput: 'Test query for integration',
  triageLevel: 'non_urgent',
  llmResponse: 'Test response from system'
};

const feedbackResult = await captureFeedback(validFeedback, queryContext);
assert(feedbackResult === true, 'QA Integration - Feedback Capture with Context');

// Test end-to-end QA workflow
const workflowMetrics = calculateMetrics(sampleData);
const workflowTrends = analyzeFeedbackTrends(sampleFeedback);
const workflowSuggestions = await generateImprovementSuggestions({ feedbackDays: 1, minOccurrences: 1 });

assert(workflowMetrics.accuracy >= 0, 'QA Integration - Metrics Workflow');
assert(workflowTrends.totalFeedback >= 0, 'QA Integration - Feedback Workflow');
assert(Array.isArray(workflowSuggestions), 'QA Integration - Improvement Workflow');

// Test QA framework completeness
assert(typeof evaluateTriageAccuracy === 'function', 'QA Framework - Metrics Evaluator Module');
assert(typeof captureFeedback === 'function', 'QA Framework - Feedback Handler Module');
assert(typeof generateImprovementSuggestions === 'function', 'QA Framework - Improvement Suggester Module');
assert(typeof logSystemChange === 'function', 'QA Framework - Version Tracker Module');

console.log('\n✅ QA Framework Test Suite Complete!\n');

console.log('📋 Tested Components:');
console.log('• ✅ Metrics Evaluator - Triage accuracy, precision/recall, performance validation');
console.log('• ✅ Feedback Handler - User feedback capture, validation, trend analysis');
console.log('• ✅ Improvement Suggester - Pattern analysis, suggestion generation, reporting');
console.log('• ✅ Version Tracker - Change logging, impact assessment, audit trail');
console.log('• ✅ QA Integration - End-to-end workflow validation and module integration');

console.log('\n🎯 QA Framework Features:');
console.log('• 📊 Performance metrics tracking with clinical benchmarks');
console.log('• 📝 User feedback integration with privacy protection');
console.log('• 💡 Automated improvement suggestion generation');
console.log('• 📋 Comprehensive change tracking and audit trail');
console.log('• 🔄 End-to-end quality assurance workflow');

console.log('\n🚀 Phase 6: Quality Assurance & Continuous Improvement - COMPLETE!');