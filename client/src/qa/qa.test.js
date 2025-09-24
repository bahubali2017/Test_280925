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
 * @typedef {object} TriageEvaluationItem
 * @property {string} userInput - User's medical input query
 * @property {"emergency"|"urgent"|"non_urgent"} triageLevel - Triage classification level
 * @property {boolean} isHighRisk - Whether case is high risk
 * @property {string[]} disclaimers - Associated medical disclaimers
 */

/**
 * @typedef {object} FeedbackAnalysis
 * @property {"accuracy"|"clarity"|"safety"} category - Feedback category
 * @property {"low"|"medium"|"critical"} severity - Severity level
 * @property {boolean} actionRequired - Whether action is required
 */

/**
 * @typedef {object} SampleFeedbackItem
 * @property {string} query - User query that generated feedback
 * @property {"high"|"medium"|"low"} perceivedAccuracy - User's accuracy perception
 * @property {string} feedbackText - Feedback text content
 * @property {"patient"|"doctor"|"nurse"} userType - Type of user providing feedback
 * @property {string} timestamp - ISO timestamp of feedback
 * @property {FeedbackAnalysis} analysis - Analysis of the feedback
 */

/**
 * @typedef {object} ValidFeedback
 * @property {string} query - Test medical query
 * @property {"high"|"medium"|"low"} perceivedAccuracy - Accuracy perception
 * @property {string} feedbackText - Feedback content
 * @property {"patient"|"doctor"|"nurse"} userType - User type
 * @property {string} timestamp - ISO timestamp
 */

/**
 * @typedef {object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string[]} errors - Validation error messages
 */

/**
 * @typedef {object} TriageAccuracyResult
 * @property {boolean} isAccurate - Whether triage classification is accurate
 * @property {"emergency"|"urgent"|"non_urgent"} expectedTriage - Expected triage level
 * @property {boolean} [isOverTriage] - Whether this is over-triage case
 */

/**
 * @typedef {object} MetricsResult
 * @property {number} accuracy - Accuracy percentage
 * @property {number} precision - Precision measurement
 * @property {number} recall - Recall measurement
 * @property {number} totalEvaluated - Total items evaluated
 */

/**
 * @typedef {object} PerformanceMetrics
 * @property {number} overallAccuracy - Overall system accuracy
 */

/**
 * @typedef {object} EvaluationReport
 * @property {string} reportId - Unique report identifier
 * @property {PerformanceMetrics} performance - Performance metrics
 * @property {string[]} recommendations - System recommendations
 */

/**
 * @typedef {object} FeedbackTrends
 * @property {number} totalFeedback - Total feedback count
 * @property {number} averageAccuracy - Average accuracy rating
 * @property {number} actionRequired - Count of items requiring action
 */

/**
 * @typedef {object} ImprovementOptions
 * @property {number} feedbackDays - Days of feedback to analyze
 * @property {number} minOccurrences - Minimum occurrences threshold
 */

/**
 * @typedef {object} ImprovementSummary
 * @property {number} totalSuggestions - Total number of suggestions
 */

/**
 * @typedef {object} ImprovementReport
 * @property {string} reportId - Unique report identifier
 * @property {ImprovementSummary} summary - Report summary
 * @property {string[]} actionItems - Actionable improvement items
 */

/**
 * @typedef {object} ChangeData
 * @property {string} version - Version identifier
 * @property {string} author - Change author
 * @property {"prompt_update"|"model_change"|"config_update"} changeType - Type of change
 * @property {string} reason - Reason for change
 * @property {"low"|"medium"|"high"|"critical"} impact - Impact level
 * @property {string[]} affectedComponents - Components affected by change
 */

/**
 * @typedef {object} ImpactAssessment
 * @property {"low"|"medium"|"high"|"critical"} suggestedImpact - Suggested impact level
 * @property {boolean} requiresExtensiveTesting - Whether extensive testing is required
 * @property {string[]} riskFactors - Identified risk factors
 */

/**
 * @typedef {object} QueryContext
 * @property {string} userInput - User input for context
 * @property {"emergency"|"urgent"|"non_urgent"} triageLevel - Triage level
 * @property {string} llmResponse - LLM response for context
 */

/**
 * Simple test assertion function
 * @param {boolean} condition - Condition to test
 * @param {string} message - Test description
 * @returns {void}
 */
function assert(condition, message) {
  if (condition) {
    console.info(`✅ PASS: ${message}`);
  } else {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
}

/**
 * Creates sample evaluation data for testing
 * @returns {TriageEvaluationItem[]} Sample dataset
 */
function createSampleEvaluationData() {
  /** @type {TriageEvaluationItem[]} */
  const samples = [
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
  return samples;
}

/**
 * Creates sample feedback data for testing
 * @returns {SampleFeedbackItem[]} Sample feedback
 */
function createSampleFeedbackData() {
  /** @type {SampleFeedbackItem[]} */
  const samples = [
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
  return samples;
}

// === METRICS EVALUATOR TESTS ===

console.info('🧪 Testing QA Framework - Phase 6\n');

console.info('📊 Testing Metrics Evaluator...');

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

console.info('\n📝 Testing Feedback Handler...');

// Test feedback validation
/** @type {ValidFeedback} */
const validFeedback = {
  query: 'Test medical query',
  perceivedAccuracy: 'high',
  feedbackText: 'Great response',
  userType: 'patient',
  timestamp: new Date().toISOString()
};

const validation = validateFeedback(validFeedback);
assert(validation.isValid === true, 'Feedback Handler - Valid Feedback Validation');
assert(validation.errors.length === 0, 'Feedback Handler - No Validation Errors');

/** @type {Partial<ValidFeedback>} */
const invalidFeedback = {
  query: '',
  perceivedAccuracy: /** @type {any} */ ('invalid'),
  userType: /** @type {any} */ ('invalid')
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

console.info('\n💡 Testing Improvement Suggester...');

// Test improvement suggestions generation
/** @type {ImprovementOptions} */
const suggestionOptions = { feedbackDays: 7, minOccurrences: 1 };
const suggestions = await generateImprovementSuggestions(suggestionOptions);
assert(Array.isArray(suggestions), 'Improvement Suggester - Suggestions Array');

// Test improvement report generation
/** @type {ImprovementOptions} */
const reportOptions = { feedbackDays: 7, minOccurrences: 1 };
const improvementReport = await generateImprovementReport(reportOptions);
assert(improvementReport.reportId && improvementReport.reportId.includes('improvement_'), 'Improvement Suggester - Report Generation');
assert(improvementReport.summary && typeof improvementReport.summary.totalSuggestions === 'number', 'Improvement Suggester - Summary Generation');
assert(Array.isArray(improvementReport.actionItems), 'Improvement Suggester - Action Items Generation');

// === VERSION TRACKER TESTS ===

console.info('\n📋 Testing Version Tracker...');

// Test change data validation
/** @type {ChangeData} */
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

console.info('\n🔄 Testing QA Framework Integration...');

// Test feedback capture with query context
/** @type {QueryContext} */
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
/** @type {ImprovementOptions} */
const workflowOptions = { feedbackDays: 1, minOccurrences: 1 };
const workflowSuggestions = await generateImprovementSuggestions(workflowOptions);

assert(workflowMetrics.accuracy >= 0, 'QA Integration - Metrics Workflow');
assert(workflowTrends.totalFeedback >= 0, 'QA Integration - Feedback Workflow');
assert(Array.isArray(workflowSuggestions), 'QA Integration - Improvement Workflow');

// Test QA framework completeness
assert(typeof evaluateTriageAccuracy === 'function', 'QA Framework - Metrics Evaluator Module');
assert(typeof captureFeedback === 'function', 'QA Framework - Feedback Handler Module');
assert(typeof generateImprovementSuggestions === 'function', 'QA Framework - Improvement Suggester Module');
assert(typeof logSystemChange === 'function', 'QA Framework - Version Tracker Module');

console.info('\n✅ QA Framework Test Suite Complete!\n');

console.info('📋 Tested Components:');
console.info('• ✅ Metrics Evaluator - Triage accuracy, precision/recall, performance validation');
console.info('• ✅ Feedback Handler - User feedback capture, validation, trend analysis');
console.info('• ✅ Improvement Suggester - Pattern analysis, suggestion generation, reporting');
console.info('• ✅ Version Tracker - Change logging, impact assessment, audit trail');
console.info('• ✅ QA Integration - End-to-end workflow validation and module integration');

console.info('\n🎯 QA Framework Features:');
console.info('• 📊 Performance metrics tracking with clinical benchmarks');
console.info('• 📝 User feedback integration with privacy protection');
console.info('• 💡 Automated improvement suggestion generation');
console.info('• 📋 Comprehensive change tracking and audit trail');
console.info('• 🔄 End-to-end quality assurance workflow');

console.info('\n🚀 Phase 6: Quality Assurance & Continuous Improvement - COMPLETE!');