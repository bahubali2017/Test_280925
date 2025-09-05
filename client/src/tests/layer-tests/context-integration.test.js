/**
 * LayerContext Integration Tests
 * Tests for the complete Create → Update → Validate flow
 */

import { createLayerContext, updateLayerContext, validateLayerContext } from "../../lib/layer-context.js";

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

// Test Suite: Context Integration Tests
console.log("\n🧪 Running LayerContext Integration Tests...\n");

test("Create → Update → Validate flow", () => {
  // 1. Create initial context
  const ctx = createLayerContext("I have a headache");
  
  assert(ctx.userInput === "I have a headache", "Should create context with trimmed input");
  assert(ctx.symptoms.length === 0, "Should start with empty symptoms array");
  assert(ctx.intent === undefined, "Should start with undefined intent");
  
  // 2. Update with intent parsing results
  updateLayerContext(ctx, {
    intent: { type: "symptom_check", confidence: 0.8 },
    symptoms: [{ name: "headache", location: "HEAD", negated: false }]
  });
  
  assert(ctx.intent.type === "symptom_check", "Should update intent type");
  assert(ctx.symptoms.length === 1, "Should have one symptom");
  assert(ctx.symptoms[0].name === "headache", "Should have correct symptom name");
  
  // 3. Update with triage results
  updateLayerContext(ctx, {
    triage: { level: "NON_URGENT", isHighRisk: false, reasons: [] }
  });
  
  assert(ctx.triage.level === "NON_URGENT", "Should update triage level");
  assert(ctx.triage.isHighRisk === false, "Should set high risk flag");
  
  // 4. Final validation
  const validation = validateLayerContext(ctx, { strict: true });
  assert(validation.ok === true, "Should pass strict validation after full flow");
});

test("Validation hooks at key steps", () => {
  const ctx = createLayerContext("chest pain");
  
  // Pre-intent validation (non-strict)
  let preIntentValidation = validateLayerContext(ctx, { strict: false });
  assert(preIntentValidation.ok === true, "Should pass pre-intent validation");
  
  // Post-intent validation 
  updateLayerContext(ctx, {
    intent: { type: "symptom_check", confidence: 0.9 },
    symptoms: [{ name: "chest pain", location: "CHEST", negated: false }]
  });
  
  let postIntentValidation = validateLayerContext(ctx, { strict: false });
  assert(postIntentValidation.ok === true, "Should pass post-intent validation");
  
  // Post-triage validation (strict)
  updateLayerContext(ctx, {
    triage: { level: "EMERGENCY", isHighRisk: true, reasons: ["chest pain"] }
  });
  
  let postTriageValidation = validateLayerContext(ctx, { strict: true });
  assert(postTriageValidation.ok === true, "Should pass post-triage strict validation");
});

test("Validation error handling", () => {
  const ctx = createLayerContext("");
  
  // Empty userInput should fail
  const validation = validateLayerContext(ctx, { strict: false });
  assert(validation.ok === false, "Should fail validation with empty input");
  assert(!validation.ok && validation.errors.length > 0, "Should have validation errors");
});

test("Context mutation tracking", () => {
  const ctx = createLayerContext("test input");
  const originalCtx = JSON.parse(JSON.stringify(ctx));
  
  // Update should mutate the original context
  updateLayerContext(ctx, { 
    metadata: { processingTime: 100 } 
  });
  
  assert(ctx.metadata.processingTime === 100, "Should mutate original context");
  assert(originalCtx.metadata.processingTime === undefined, "Original should be different");
});

test("Nested object updates", () => {
  const ctx = createLayerContext("test");
  
  updateLayerContext(ctx, {
    prompt: { systemPrompt: "Test system prompt" }
  });
  
  assert(ctx.prompt.systemPrompt === "Test system prompt", "Should handle nested object updates");
  
  updateLayerContext(ctx, {
    prompt: { enhancedPrompt: "Test enhanced prompt" }
  });
  
  // Should preserve existing prompt fields
  assert(ctx.prompt.systemPrompt === "Test system prompt", "Should preserve existing nested fields");
  assert(ctx.prompt.enhancedPrompt === "Test enhanced prompt", "Should add new nested fields");
});

test("Array updates and preservation", () => {
  const ctx = createLayerContext("multiple symptoms");
  
  updateLayerContext(ctx, {
    symptoms: [
      { name: "symptom1", negated: false },
      { name: "symptom2", negated: true }
    ]
  });
  
  assert(ctx.symptoms.length === 2, "Should handle array updates");
  assert(ctx.symptoms[1].negated === true, "Should preserve array item properties");
});

console.log("\n✅ LayerContext Integration Tests Complete\n");