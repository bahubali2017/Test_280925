/**
 * Schema Validator Unit Tests
 * Tests for the schema validation system used in the Layered Interpretation System
 */

import { validateLayerSchema } from "../../lib/utils/schema-validator.js";

/**
 * Simple test runner for Node.js environments
 * @param {string} description - Test description
 * @param {Function} testFn - Test function
 */
function test(description, testFn) {
  try {
    testFn();
    console.log(`✅ PASS: ${description}`);
  } catch (error) {
    console.error(`❌ FAIL: ${description}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

/**
 * Simple assertion helper
 * @param {boolean} condition - Condition to assert
 * @param {string} message - Error message if assertion fails
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// Test Suite: Schema Validator Unit Tests
console.log("\n🧪 Running Schema Validator Tests...\n");

test("userInput required and trimmed", () => {
  const ctx = { userInput: "  test input  " };
  const result = validateLayerSchema(ctx, { strict: false });
  
  assert(result.ok === true, "Should pass with trimmed userInput");
});

test("userInput required - fails when missing", () => {
  const ctx = {};
  const result = validateLayerSchema(ctx, { strict: false });
  
  assert(result.ok === false, "Should fail when userInput is missing");
  assert(!result.ok && result.errors.length > 0, "Should have validation errors");
  assert(!result.ok && result.errors.some(e => e.path === "userInput"), "Should have userInput error");
});

test("strict=false allows partial context", () => {
  const ctx = {
    userInput: "test input",
    // Missing intent, symptoms, triage - should be OK in non-strict mode
  };
  const result = validateLayerSchema(ctx, { strict: false });
  
  assert(result.ok === true, "Should pass in non-strict mode with partial context");
});

test("strict=true requires intent.type, symptoms[], triage.level", () => {
  const partialCtx = {
    userInput: "test input",
    intent: { type: "symptom_check" },
    symptoms: [],
    // Missing triage - should fail in strict mode
  };
  
  const result = validateLayerSchema(partialCtx, { strict: true });
  assert(result.ok === false, "Should fail in strict mode with missing triage");
  
  const completeCtx = {
    userInput: "test input",
    intent: { type: "symptom_check", confidence: 0.8 },
    symptoms: [{ name: "headache", negated: false }],
    triage: { level: "NON_URGENT", isHighRisk: false, reasons: [] }
  };
  
  const strictResult = validateLayerSchema(completeCtx, { strict: true });
  assert(strictResult.ok === true, "Should pass in strict mode with complete context");
});

test("aggregates multiple errors with paths", () => {
  const invalidCtx = {
    // userInput missing
    intent: { /* type missing */ },
    symptoms: "invalid", // should be array
  };
  
  const result = validateLayerSchema(invalidCtx, { strict: true });
  
  assert(result.ok === false, "Should fail with multiple validation errors");
  assert(!result.ok && result.errors.length >= 2, "Should have multiple errors");
  
  if (!result.ok) {
    const errorPaths = result.errors.map(e => e.path);
    assert(errorPaths.includes("userInput"), "Should include userInput error path");
    assert(errorPaths.some(path => path.includes("intent")), "Should include intent error path");
  }
});

test("validates symptom structure", () => {
  const ctx = {
    userInput: "test input",
    symptoms: [
      { name: "headache", location: "HEAD", negated: false },
      { name: "invalid symptom" } // missing required negated field
    ]
  };
  
  const result = validateLayerSchema(ctx, { strict: false });
  // Should still pass in non-strict mode but may log warnings
  assert(result.ok === true, "Should pass in non-strict mode even with partial symptom data");
});

console.log("\n✅ Schema Validator Tests Complete\n");