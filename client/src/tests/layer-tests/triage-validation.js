/**
 * Triage System Validation Script
 * Manual validation of medical triage functionality without test framework dependencies
 */

import { performTriage } from '../../lib/triage-checker.js';
import { createLayerContext, updateLayerContext } from '../../lib/layer-context.js';

/**
 * Helper to create test context with symptoms
 * @param {string} userInput 
 * @param {Array} symptoms 
 * @returns {import('../../lib/layer-context.js').LayerContext}
 */
function createTestContext(userInput, symptoms = []) {
  const ctx = createLayerContext(userInput);
  updateLayerContext(ctx, { symptoms });
  return ctx;
}

/**
 * Validation test runner
 * @param {string} testName 
 * @param {Function} testFn 
 */
function validate(testName, testFn) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    testFn();
    console.log(`✅ PASSED: ${testName}`);
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Assertion helper
 * @param {*} actual 
 * @param {*} expected 
 * @param {string} message 
 */
function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
  }
}

/**
 * Array contains assertion
 * @param {Array} array 
 * @param {*} item 
 * @param {string} message 
 */
function assertContains(array, item, message = '') {
  if (!array.includes(item)) {
    throw new Error(`Expected array to contain ${item}. ${message}`);
  }
}

// Run validation tests
console.log('🚑 Medical Triage System Validation');
console.log('=====================================');

// Emergency Level Tests
validate('Emergency: Chest Pain Detection', () => {
  const ctx = createTestContext("I have severe chest pain");
  const result = performTriage(ctx);
  
  assertEqual(result.level, 'EMERGENCY', 'Should detect chest pain as emergency');
  assertEqual(result.isHighRisk, true, 'Should mark as high risk');
});

validate('Emergency: Mental Health Crisis', () => {
  const ctx = createTestContext("I want to kill myself");
  const result = performTriage(ctx);
  
  assertEqual(result.level, 'EMERGENCY', 'Should detect suicidal ideation as emergency');
  assertEqual(result.isHighRisk, true, 'Should mark as high risk');
  assertContains(result.symptomNames, 'suicidal ideation', 'Should include symptom name');
});

// Urgent Level Tests  
validate('Urgent: Severe Headache with Vision Changes', () => {
  const ctx = createTestContext("I have a severe headache and my vision is blurry");
  const result = performTriage(ctx);
  
  assertEqual(result.level, 'URGENT', 'Should detect as urgent');
  assertEqual(result.isHighRisk, true, 'Should mark as high risk');
});

validate('Urgent: Self-Harm Behavior', () => {
  const ctx = createTestContext("I've been cutting myself");
  const result = performTriage(ctx);
  
  assertEqual(result.level, 'URGENT', 'Should detect self-harm as urgent');
  assertEqual(result.isHighRisk, true, 'Should mark as high risk');
  assertContains(result.symptomNames, 'self harm', 'Should include symptom name');
});

// Non-Urgent Tests
validate('Non-Urgent: Minor Symptoms', () => {
  const ctx = createTestContext("I have a mild headache");
  const result = performTriage(ctx);
  
  assertEqual(result.level, 'NON_URGENT', 'Should classify as non-urgent');
  assertEqual(result.isHighRisk, false, 'Should not mark as high risk');
});

validate('Non-Urgent: General Questions', () => {
  const ctx = createTestContext("What foods are good for heart health?");
  const result = performTriage(ctx);
  
  assertEqual(result.level, 'NON_URGENT', 'Should classify as non-urgent');
  assertEqual(result.isHighRisk, false, 'Should not mark as high risk');
});

// Complex Symptom Tests
validate('Complex: Multiple High-Risk Symptoms', () => {
  const symptoms = [
    { name: 'chest pain', severity: 'SEVERE', location: 'chest' },
    { name: 'shortness of breath', severity: 'MODERATE', location: 'chest' }
  ];
  
  const ctx = createTestContext("chest pain and shortness of breath", symptoms);
  const result = performTriage(ctx);
  
  assertEqual(result.level, 'EMERGENCY', 'Should detect combined symptoms as emergency');
  assertEqual(result.symptomNames.length, 2, 'Should include both symptoms');
});

// Edge Cases
validate('Edge Case: Empty Input', () => {
  const ctx = createTestContext("");
  const result = performTriage(ctx);
  
  assertEqual(result.level, 'NON_URGENT', 'Should handle empty input gracefully');
  assertEqual(result.isHighRisk, false, 'Should not mark as high risk');
  assertEqual(result.symptomNames.length, 0, 'Should have no symptom names');
});

validate('Edge Case: Mixed Case Input', () => {
  const ctx = createTestContext("SEVERE CHEST PAIN");
  const result = performTriage(ctx);
  
  assertEqual(result.level, 'EMERGENCY', 'Should handle mixed case input');
});

// Duration-Based Tests
validate('Duration: Persistent Symptoms', () => {
  const ctx = createTestContext("I've had this cough for over two weeks");
  const result = performTriage(ctx);
  
  const hasWeeksReason = result.reasons.some(r => r.includes('2 weeks'));
  if (!hasWeeksReason) {
    throw new Error('Should flag persistent symptoms over 2 weeks');
  }
});

console.log('\n🎉 Validation Complete!');
console.log('\nTo run this validation:');
console.log('node client/src/tests/layer-tests/triage-validation.js');