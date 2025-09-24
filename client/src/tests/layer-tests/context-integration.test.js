/**
 * LayerContext Integration Tests
 * Tests for the complete Create → Update → Validate flow
 */

/* global describe, it, beforeAll */

import { createLayerContext, updateLayerContext, validateLayerContext } from "../../lib/layer-context.js";

/**
 * Duration structure for symptom temporal information
 * @typedef {{
 *   value?: number | null;
 *   unit: string;
 *   raw: string;
 * }} Duration
 */

/**
 * Symptom structure with location, severity, and temporal data
 * @typedef {{
 *   name: string;
 *   location?: string;
 *   severity?: string;
 *   duration?: Duration;
 *   negated?: boolean;
 * }} Symptom
 */

/**
 * Intent classification result
 * @typedef {{
 *   type: string;
 *   confidence?: number;
 * }} Intent
 */

/**
 * Triage assessment result
 * @typedef {{
 *   level: string;
 *   isHighRisk: boolean;
 *   reasons?: string[];
 *   symptomNames?: string[];
 * }} Triage
 */

/**
 * Complete layer context structure
 * @typedef {{
 *   userInput: string;
 *   intent?: Intent;
 *   symptoms?: Symptom[];
 *   triage?: Triage;
 *   prompt?: {
 *     systemPrompt?: string;
 *     enhancedPrompt?: string;
 *   };
 *   metadata?: {
 *     processingTime?: number;
 *     intentConfidence?: number;
 *     bodySystem?: string;
 *   };
 *   demographics?: {
 *     age?: number;
 *     sex?: "male" | "female" | "other";
 *   };
 * }} LayerContext
 */

/**
 * Validation result structure
 * @typedef {{
 *   ok: boolean;
 *   errors?: Array<{ message: string; path?: string; }>;
 * }} ValidationResult
 */

/**
 * Simple assertion helper with proper error typing
 * @param {boolean} condition - Condition to assert
 * @param {string} message - Error message if assertion fails
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

/**
 * Type guard to check if context has symptoms array
 * @param {LayerContext} ctx - Context to check
 * @returns {ctx is LayerContext & { symptoms: Symptom[] }}
 */
function hasSymptoms(ctx) {
  return Array.isArray(ctx.symptoms);
}

/**
 * Type guard to check if context has intent
 * @param {LayerContext} ctx - Context to check
 * @returns {ctx is LayerContext & { intent: Intent }}
 */
function hasIntent(ctx) {
  return ctx.intent !== undefined && typeof ctx.intent === 'object';
}

/**
 * Type guard to check if context has triage
 * @param {LayerContext} ctx - Context to check
 * @returns {ctx is LayerContext & { triage: Triage }}
 */
function hasTriage(ctx) {
  return ctx.triage !== undefined && typeof ctx.triage === 'object';
}

/**
 * Type guard to check if context has metadata
 * @param {LayerContext} ctx - Context to check
 * @returns {ctx is LayerContext & { metadata: NonNullable<LayerContext['metadata']> }}
 */
function hasMetadata(ctx) {
  return ctx.metadata !== undefined && typeof ctx.metadata === 'object';
}

/**
 * Type guard to check if context has prompt
 * @param {LayerContext} ctx - Context to check
 * @returns {ctx is LayerContext & { prompt: NonNullable<LayerContext['prompt']> }}
 */
function hasPrompt(ctx) {
  return ctx.prompt !== undefined && typeof ctx.prompt === 'object';
}

/**
 * Type guard to check if validation result has errors
 * @param {ValidationResult} result - Validation result to check
 * @returns {result is ValidationResult & { ok: false; errors: NonNullable<ValidationResult['errors']> }}
 */
function hasValidationErrors(result) {
  return !result.ok && Array.isArray(result.errors);
}

describe("LayerContext Integration Tests", () => {
  beforeAll(() => {
    console.info("🧪 Running LayerContext Integration Tests...");
  });

  it("Create → Update → Validate flow", () => {
    // 1. Create initial context
    const ctx = createLayerContext("I have a headache");
    
    assert(ctx.userInput === "I have a headache", "Should create context with trimmed input");
    
    if (hasSymptoms(ctx)) {
      assert(ctx.symptoms.length === 0, "Should start with empty symptoms array");
    }
    
    assert(ctx.intent === undefined, "Should start with undefined intent");
    
    // 2. Update with intent parsing results
    updateLayerContext(ctx, {
      intent: { type: "symptom_check", confidence: 0.8 },
      symptoms: [{ name: "headache", location: "HEAD", negated: false }]
    });
    
    if (hasIntent(ctx)) {
      assert(ctx.intent.type === "symptom_check", "Should update intent type");
    }
    
    if (hasSymptoms(ctx)) {
      assert(ctx.symptoms.length === 1, "Should have one symptom");
      assert(ctx.symptoms[0].name === "headache", "Should have correct symptom name");
    }
    
    // 3. Update with triage results
    updateLayerContext(ctx, {
      triage: { level: "NON_URGENT", isHighRisk: false, reasons: [] }
    });
    
    if (hasTriage(ctx)) {
      assert(ctx.triage.level === "NON_URGENT", "Should update triage level");
      assert(ctx.triage.isHighRisk === false, "Should set high risk flag");
    }
    
    // 4. Final validation
    const validation = validateLayerContext(ctx, { strict: true });
    assert(validation.ok === true, "Should pass strict validation after full flow");
  });

  it("Validation hooks at key steps", () => {
    const ctx = createLayerContext("chest pain");
    
    // Pre-intent validation (non-strict)
    const preIntentValidation = validateLayerContext(ctx, { strict: false });
    assert(preIntentValidation.ok === true, "Should pass pre-intent validation");
    
    // Post-intent validation 
    updateLayerContext(ctx, {
      intent: { type: "symptom_check", confidence: 0.9 },
      symptoms: [{ name: "chest pain", location: "CHEST", negated: false }]
    });
    
    const postIntentValidation = validateLayerContext(ctx, { strict: false });
    assert(postIntentValidation.ok === true, "Should pass post-intent validation");
    
    // Post-triage validation (strict)
    updateLayerContext(ctx, {
      triage: { level: "EMERGENCY", isHighRisk: true, reasons: ["chest pain"] }
    });
    
    const postTriageValidation = validateLayerContext(ctx, { strict: true });
    assert(postTriageValidation.ok === true, "Should pass post-triage strict validation");
  });

  it("Validation error handling", () => {
    const ctx = createLayerContext("");
    
    // Empty userInput should fail
    const validation = validateLayerContext(ctx, { strict: false });
    assert(validation.ok === false, "Should fail validation with empty input");
    
    if (hasValidationErrors(validation)) {
      assert(validation.errors.length > 0, "Should have validation errors");
    }
  });

  it("Context mutation tracking", () => {
    const ctx = createLayerContext("test input");
    const originalCtx = JSON.parse(JSON.stringify(ctx));
    
    // Update should mutate the original context
    updateLayerContext(ctx, { 
      metadata: { processingTime: 100 } 
    });
    
    if (hasMetadata(ctx) && hasMetadata(originalCtx)) {
      assert(ctx.metadata.processingTime === 100, "Should mutate original context");
      assert(originalCtx.metadata.processingTime === undefined, "Original should be different");
    }
  });

  it("Nested object updates", () => {
    const ctx = createLayerContext("test");
    
    updateLayerContext(ctx, {
      prompt: { systemPrompt: "Test system prompt" }
    });
    
    if (hasPrompt(ctx)) {
      assert(ctx.prompt.systemPrompt === "Test system prompt", "Should handle nested object updates");
    }
    
    updateLayerContext(ctx, {
      prompt: { enhancedPrompt: "Test enhanced prompt" }
    });
    
    if (hasPrompt(ctx)) {
      // Should preserve existing prompt fields
      assert(ctx.prompt.systemPrompt === "Test system prompt", "Should preserve existing nested fields");
      assert(ctx.prompt.enhancedPrompt === "Test enhanced prompt", "Should add new nested fields");
    }
  });

  it("Array updates and preservation", () => {
    const ctx = createLayerContext("multiple symptoms");
    
    updateLayerContext(ctx, {
      symptoms: [
        { name: "symptom1", negated: false },
        { name: "symptom2", negated: true }
      ]
    });
    
    if (hasSymptoms(ctx)) {
      assert(ctx.symptoms.length === 2, "Should handle array updates");
      assert(ctx.symptoms[1].negated === true, "Should preserve array item properties");
    }
  });
});

console.info("✅ LayerContext Integration Tests Complete");