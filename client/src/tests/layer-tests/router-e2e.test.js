/**
 * Router End-to-End Integration Tests
 * Tests the complete flow through routeMedicalQuery including all layers:
 * Intent parsing → Triage → Prompt enhancement → Result formatting
 */

import { routeMedicalQuery } from "../../lib/router.js";

/**
 * Simple test runner for Node.js environments
 * @param {string} description - Test description
 * @param {Function} testFn - Test function (can be async)
 */
async function test(description, testFn) {
  try {
    await testFn();
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

// Test Suite: Router E2E Integration Tests
console.log("\n🧪 Running Router End-to-End Tests...\n");

// Basic Flow Tests
test("E2E - Basic symptom query flow", async () => {
  const result = await routeMedicalQuery("I have a headache for 2 days");
  
  // Validate result structure
  assert(result.userInput === "I have a headache for 2 days", "Should preserve user input");
  assert(typeof result.enhancedPrompt === "string", "Should generate enhanced prompt");
  assert(Array.isArray(result.disclaimers), "Should include disclaimers array");
  assert(Array.isArray(result.suggestions), "Should include suggestions array");
  assert(typeof result.isHighRisk === "boolean", "Should include risk assessment");
  assert(typeof result.metadata === "object", "Should include metadata");
  
  // Validate processing occurred
  assert(result.metadata.processingTime > 0, "Should have processing time");
  assert(typeof result.metadata.intentConfidence === "number", "Should have intent confidence");
  assert(result.enhancedPrompt.length > result.userInput.length, "Enhanced prompt should be longer");
});

test("E2E - High risk symptom handling", async () => {
  const result = await routeMedicalQuery("I have severe chest pain and shortness of breath");
  
  assert(result.isHighRisk === true, "Should identify as high risk");
  assert(result.disclaimers.length > 0, "Should include safety disclaimers");
  assert(result.enhancedPrompt.includes("emergency") || result.enhancedPrompt.includes("urgent"), 
    "Enhanced prompt should include urgency language");
  assert(result.metadata.triageLevel === "emergency", "Should escalate to emergency triage");
});

test("E2E - Information request flow", async () => {
  const result = await routeMedicalQuery("What is diabetes and how is it treated?");
  
  assert(result.isHighRisk === false, "Information requests should be low risk");
  assert(result.metadata.intentConfidence >= 0.6, "Should have good confidence for info requests");
  assert(result.enhancedPrompt.includes("diabetes"), "Should include original topic in prompt");
  assert(result.disclaimers.some(d => d.includes("educational") || d.includes("informational")), 
    "Should include educational disclaimers");
});

test("E2E - Prevention/wellness query flow", async () => {
  const result = await routeMedicalQuery("How can I prevent heart disease through diet?");
  
  assert(result.isHighRisk === false, "Prevention queries should be low risk");
  assert(result.suggestions.length > 0, "Should provide follow-up suggestions");
  assert(result.enhancedPrompt.includes("prevention") || result.enhancedPrompt.includes("preventive"), 
    "Should enhance prompt with prevention focus");
});

// Multiple Symptoms Tests
test("E2E - Multiple symptoms processing", async () => {
  const result = await routeMedicalQuery("I have a headache, nausea, and feel dizzy for the past week");
  
  assert(result.metadata.intentConfidence >= 0.7, "Multiple symptoms should increase confidence");
  assert(result.enhancedPrompt.includes("headache") && result.enhancedPrompt.includes("nausea"), 
    "Should include all symptoms in enhanced prompt");
  assert(result.metadata.processingTime > 0, "Should track processing time");
});

// Edge Cases and Error Handling
test("E2E - Empty input handling", async () => {
  const result = await routeMedicalQuery("");
  
  assert(result.userInput === "", "Should handle empty input");
  assert(result.isHighRisk === false, "Empty input should be low risk");
  assert(result.disclaimers.length > 0, "Should still provide disclaimers");
  assert(result.metadata.intentConfidence <= 0.5, "Should have low confidence");
});

test("E2E - Very long input handling", async () => {
  const longInput = "I have been experiencing ".repeat(50) + "headaches and fatigue";
  const result = await routeMedicalQuery(longInput);
  
  assert(result.userInput === longInput, "Should handle long input");
  assert(result.enhancedPrompt.length > 0, "Should still generate enhanced prompt");
  assert(typeof result.metadata.processingTime === "number", "Should track processing time");
});

test("E2E - Non-medical input graceful handling", async () => {
  const result = await routeMedicalQuery("What's the weather like today?");
  
  assert(result.isHighRisk === false, "Non-medical should be low risk");
  assert(result.metadata.intentConfidence <= 0.5, "Should have low confidence for non-medical");
  assert(result.disclaimers.some(d => d.includes("medical") || d.includes("health")), 
    "Should include medical focus disclaimer");
});

// Triage Level Tests
test("E2E - Emergency triage escalation", async () => {
  const emergencyInputs = [
    "I'm having chest pain and can't breathe - this is an emergency",
    "I think I'm having a heart attack",
    "Severe bleeding that won't stop"
  ];
  
  for (const input of emergencyInputs) {
    const result = await routeMedicalQuery(input);
    assert(result.isHighRisk === true, `"${input}" should be high risk`);
    assert(result.metadata.triageLevel === "emergency", 
      `"${input}" should escalate to emergency triage`);
  }
});

test("E2E - Non-urgent triage classification", async () => {
  const nonUrgentInputs = [
    "I have a mild headache",
    "Minor skin rash on my arm",
    "General wellness question about vitamins"
  ];
  
  for (const input of nonUrgentInputs) {
    const result = await routeMedicalQuery(input);
    assert(result.isHighRisk === false, `"${input}" should be low risk`);
    assert(result.metadata.triageLevel === "non_urgent", 
      `"${input}" should be non-urgent triage`);
  }
});

// Metadata and Performance Tests
test("E2E - Metadata completeness", async () => {
  const result = await routeMedicalQuery("I have stomach pain");
  
  // Check all expected metadata fields
  assert(typeof result.metadata.processingTime === "number", "Should have processing time");
  assert(typeof result.metadata.intentConfidence === "number", "Should have intent confidence");
  assert(typeof result.metadata.triageLevel === "string", "Should have triage level");
  assert(typeof result.metadata.bodySystem === "string", "Should have body system");
  
  // Performance checks
  assert(result.metadata.processingTime < 1000, "Processing should be under 1 second");
  assert(result.metadata.intentConfidence >= 0 && result.metadata.intentConfidence <= 1, 
    "Intent confidence should be between 0 and 1");
});

test("E2E - Processing performance", async () => {
  const startTime = Date.now();
  const result = await routeMedicalQuery("I have multiple symptoms including headache, nausea, dizziness, fatigue, and muscle aches");
  const endTime = Date.now();
  
  const actualTime = endTime - startTime;
  
  assert(actualTime < 2000, "Complex queries should process within 2 seconds");
  assert(result.metadata.processingTime <= actualTime, "Reported time should be reasonable");
  assert(result.metadata.processingTime > 0, "Should have measurable processing time");
});

// Enhanced Prompt Quality Tests
test("E2E - Enhanced prompt quality", async () => {
  const result = await routeMedicalQuery("I have been having chest pain for 3 days");
  
  // Enhanced prompt should be substantially longer and more detailed
  const enhancement = result.enhancedPrompt.length - result.userInput.length;
  assert(enhancement > 50, "Enhanced prompt should add significant context");
  
  // Should include safety context
  assert(result.enhancedPrompt.includes("medical") || result.enhancedPrompt.includes("health"), 
    "Should include medical context");
  
  // Should preserve original user input
  assert(result.enhancedPrompt.includes("chest pain"), "Should preserve key symptoms");
});

test("E2E - Suggestions relevance", async () => {
  const result = await routeMedicalQuery("I have a headache");
  
  assert(result.suggestions.length >= 1, "Should provide relevant suggestions");
  assert(result.suggestions.every(s => typeof s === "string"), "All suggestions should be strings");
  assert(result.suggestions.every(s => s.length > 10), "Suggestions should be meaningful");
  
  // Suggestions should be contextually relevant
  const suggestionsText = result.suggestions.join(" ").toLowerCase();
  assert(suggestionsText.includes("symptom") || suggestionsText.includes("pain") || 
         suggestionsText.includes("head"), "Suggestions should be contextually relevant");
});

console.log("\n✅ Router End-to-End Tests Complete\n");