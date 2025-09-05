/**
 * Router Test Suite - Phase 4 Validation
 * Tests standardized output format, performance instrumentation, and error handling
 */

import { routeMedicalQuery } from "../../lib/router.js";

/**
 * Simple test runner for Phase 4 validation
 * @param {string} testName 
 * @param {Function} testFn 
 */
async function test(testName, testFn) {
  try {
    console.log(`🧪 ${testName}`);
    await testFn();
    console.log(`✅ PASSED: ${testName}\n`);
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}\n`);
    throw error;
  }
}

/**
 * Assert helper functions
 */
const assert = {
  equal: (actual, expected, message = '') => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
    }
  },
  true: (condition, message = '') => {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  },
  isArray: (value, message = '') => {
    if (!Array.isArray(value)) {
      throw new Error(`Expected array, got ${typeof value}. ${message}`);
    }
  },
  isType: (value, type, message = '') => {
    if (typeof value !== type) {
      throw new Error(`Expected ${type}, got ${typeof value}. ${message}`);
    }
  },
  exists: (value, message = '') => {
    if (value === undefined || value === null) {
      throw new Error(`Expected value to exist: ${message}`);
    }
  }
};

console.log('🚀 Phase 4 Router Test Suite - Standardized Output & Performance');
console.log('================================================================\n');

// Test 1: Emergency Path with Complete Output Structure
await test('Emergency: Standardized Output Structure', async () => {
  const result = await routeMedicalQuery("I have severe chest pain for 20 minutes");
  
  // Core structure validation
  assert.isType(result.userInput, "string", "userInput should be string");
  assert.isType(result.enhancedPrompt, "string", "enhancedPrompt should be string");
  assert.isType(result.isHighRisk, "boolean", "isHighRisk should be boolean");
  assert.isArray(result.disclaimers, "disclaimers should be array");
  assert.isArray(result.suggestions, "suggestions should be array");
  assert.exists(result.metadata, "metadata should exist");
  
  // Emergency-specific validation
  assert.equal(result.isHighRisk, true, "Should be high risk");
  assert.equal(result.metadata.triageLevel, "emergency", "Should be emergency triage");
  assert.true(result.disclaimers.length > 0, "Should have disclaimers");
  assert.true(result.suggestions.length > 0, "Should have suggestions");
  
  // Metadata structure validation
  assert.isType(result.metadata.processingTime, "number", "processingTime should be number");
  assert.exists(result.metadata.stageTimings, "stageTimings should exist");
  assert.isType(result.metadata.stageTimings, "object", "stageTimings should be object");
  
  // Performance validation
  assert.true(result.metadata.processingTime >= 0, "Processing time should be non-negative");
  assert.true(typeof result.metadata.stageTimings.parseIntent === "number", "parseIntent timing recorded");
  assert.true(typeof result.metadata.stageTimings.triage === "number", "triage timing recorded");
  assert.true(typeof result.metadata.stageTimings.enhancePrompt === "number", "enhancePrompt timing recorded");
  
  // ATD validation for emergency
  if (result.atd) {
    assert.isArray(result.atd, "atd should be array if present");
    assert.true(result.atd.length > 0, "Should have ATD notices for emergency");
  }
});

// Test 2: Non-Urgent Path
await test('Non-Urgent: Consistent Output Format', async () => {
  const result = await routeMedicalQuery("I have a mild headache since yesterday");
  
  // Basic structure should be consistent
  assert.isType(result.userInput, "string");
  assert.isType(result.enhancedPrompt, "string");
  assert.isType(result.isHighRisk, "boolean");
  assert.isArray(result.disclaimers);
  assert.isArray(result.suggestions);
  assert.exists(result.metadata);
  
  // Non-urgent specific validation
  assert.equal(result.isHighRisk, false, "Should not be high risk");
  assert.true(
    result.metadata.triageLevel === "non_urgent" || result.metadata.triageLevel === undefined,
    "Should be non-urgent or undefined"
  );
  
  // Performance data should still be present
  assert.exists(result.metadata.stageTimings, "Stage timings should exist");
  assert.isType(result.metadata.processingTime, "number", "Processing time should be recorded");
});

// Test 3: Fallback Error Handling
await test('Fallback: Error Handling with Standardized Output', async () => {
  const result = await routeMedicalQuery(null);
  
  // Should still return standardized structure even with invalid input
  assert.isType(result.userInput, "string", "userInput should be string even for null input");
  assert.isType(result.enhancedPrompt, "string", "enhancedPrompt should be string");
  assert.isType(result.isHighRisk, "boolean", "isHighRisk should be boolean");
  assert.isArray(result.disclaimers, "disclaimers should be array");
  assert.isArray(result.suggestions, "suggestions should be array");
  assert.exists(result.metadata, "metadata should exist");
  
  // Fallback should indicate error state
  assert.true(result.disclaimers.length > 0, "Should have error disclaimer");
  assert.true(result.suggestions.length > 0, "Should have suggestions even in fallback");
  
  // Performance data should still be captured
  assert.exists(result.metadata.stageTimings, "Stage timings should exist in fallback");
  assert.isType(result.metadata.processingTime, "number", "Processing time should be recorded");
});

// Test 4: Performance Under Threshold
await test('Performance: Processing Time Validation', async () => {
  const result = await routeMedicalQuery("headache and fever for 3 days");
  
  // Performance requirements
  assert.true(result.metadata.processingTime < 1000, "Processing should be under 1 second");
  
  // Stage timings validation
  const stageSum = Object.values(result.metadata.stageTimings || {}).reduce((sum, time) => sum + time, 0);
  assert.true(stageSum <= result.metadata.processingTime, "Stage timings should not exceed total");
  
  // All timing values should be numbers
  Object.entries(result.metadata.stageTimings || {}).forEach(([stage, time]) => {
    assert.isType(time, "number", `${stage} timing should be number`);
    assert.true(time >= 0, `${stage} timing should be non-negative`);
  });
});

// Test 5: Mental Health Crisis with ATD
await test('Mental Health: Crisis Detection with ATD Notices', async () => {
  const result = await routeMedicalQuery("I'm having thoughts of suicide and feel hopeless");
  
  // Crisis detection validation
  assert.equal(result.isHighRisk, true, "Should be high risk");
  assert.equal(result.metadata.triageLevel, "emergency", "Should be emergency level");
  
  // ATD notices validation
  assert.exists(result.atd, "Should have ATD notices");
  assert.isArray(result.atd, "ATD should be array");
  assert.true(result.atd.length > 0, "Should have at least one ATD notice");
  
  // Crisis-specific disclaimers
  assert.true(result.disclaimers.length > 0, "Should have crisis disclaimers");
  assert.true(result.suggestions.length > 0, "Should have crisis suggestions");
});

// Test 6: Output Shape Consistency Across Varied Inputs
await test('Consistency: Output Shape Across Different Inputs', async () => {
  const inputs = [
    "severe chest pain",
    "mild headache", 
    "question about vitamins",
    "I feel dizzy",
    ""
  ];
  
  const expectedKeys = ["userInput", "enhancedPrompt", "isHighRisk", "disclaimers", "suggestions", "metadata"];
  
  for (const input of inputs) {
    const result = await routeMedicalQuery(input);
    
    // Validate all expected keys are present
    expectedKeys.forEach(key => {
      assert.exists(result[key], `Key ${key} should exist for input: "${input}"`);
    });
    
    // Validate metadata structure
    assert.isType(result.metadata.processingTime, "number", `processingTime should be number for: "${input}"`);
    assert.exists(result.metadata.stageTimings, `stageTimings should exist for: "${input}"`);
    
    // Validate array fields
    assert.isArray(result.disclaimers, `disclaimers should be array for: "${input}"`);
    assert.isArray(result.suggestions, `suggestions should be array for: "${input}"`);
  }
});

console.log('🎉 Phase 4 Router Test Suite Complete!');
console.log('\n📋 Validated Features:');
console.log('• ✅ Standardized LayeredResponse output structure');
console.log('• ✅ Performance instrumentation with stage timings');  
console.log('• ✅ Error handling with fallback consistency');
console.log('• ✅ Emergency and mental health crisis detection');
console.log('• ✅ Output shape consistency across all input types');
console.log('• ✅ Performance metrics under threshold validation');

console.log('\n🔧 To run this test suite:');
console.log('cd client/src && node tests/layer-tests/router.test.js');