/**
 * Enhanced Intent Parser Tests 
 * Comprehensive tests for Phase 1 intent parsing features including duration parsing,
 * condition types, regex + keywords + synonyms, fallback NLP, and contextual correction
 */

import { parseIntent } from "../../lib/intent-parser.js";

// Jest globals are available without explicit import in the test environment
/* global describe, it, expect */

/**
 * Intent type enumeration
 * @typedef {"symptom_check" | "prevention_inquiry" | "information_request" | "medication_inquiry" | "emergency" | "general_inquiry"} IntentType
 */

/**
 * Symptom duration structure
 * @typedef {{
 *   value?: number;
 *   unit?: string;
 *   raw?: string;
 * }} SymptomDuration
 */

/**
 * Symptom structure from intent parser
 * @typedef {{
 *   name: string;
 *   duration?: SymptomDuration;
 *   severity?: string;
 *   location?: string;
 *   negated?: boolean;
 * }} Symptom
 */

/**
 * Intent classification structure
 * @typedef {{
 *   type: IntentType;
 *   confidence?: number;
 * }} IntentClassification
 */

/**
 * Complete intent parser output structure
 * @typedef {{
 *   symptoms: Symptom[];
 *   intent: IntentClassification;
 * }} IntentParserOutput
 */

/**
 * Simple assertion helper with proper typing
 * @param {unknown} condition - Condition to assert
 * @param {string} message - Error message if assertion fails
 */
function assert(condition, message = "Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Safely access confidence with fallback - uses generic typing to avoid conflicts
 * @param {unknown} intent - Intent object
 * @returns {number} Confidence value or 0
 */
function getConfidence(intent) {
  return (intent && 
          typeof intent === "object" && 
          "confidence" in intent && 
          typeof intent.confidence === "number") 
    ? intent.confidence : 0;
}

/**
 * Safely access duration property - uses generic typing to avoid conflicts
 * @param {unknown} symptom - Symptom object
 * @returns {unknown} Duration or undefined
 */
function getDuration(symptom) {
  return (symptom && 
          typeof symptom === "object" && 
          "duration" in symptom) 
    ? symptom.duration : undefined;
}

describe("🧪 Enhanced Intent Parser Tests", () => {
  // Phase 1.1: Duration Parsing Tests
  describe("Duration parsing tests", () => {
    it("Duration parsing - numeric with units", () => {
      const result = parseIntent("I've had a headache for 3 days");
      
      assert(result.symptoms.length === 1, "Should detect one symptom");
      assert(result.symptoms[0].name === "headache", "Should detect headache");
      
      const duration = getDuration(result.symptoms[0]);
      assert(duration !== undefined, "Should include duration");
      assert(duration && 
             typeof duration === "object" && 
             "value" in duration && 
             typeof duration.value === "number" && 
             duration.value === 3, "Should parse duration value");
      assert(duration && 
             typeof duration === "object" && 
             "unit" in duration && 
             duration.unit === "day", "Should parse duration unit");
    });

    it("Duration parsing - relative time", () => {
      const result = parseIntent("Since yesterday I feel nauseous");
      
      assert(result.symptoms.length === 1, "Should detect nausea");
      
      const duration = getDuration(result.symptoms[0]);
      assert(duration !== undefined, "Should detect relative duration");
      assert(duration && 
             typeof duration === "object" && 
             "unit" in duration && 
             duration.unit === "yesterday", "Should capture relative time unit");
    });

    it("Duration parsing - ongoing/chronic", () => {
      const result = parseIntent("I have ongoing back pain");
      
      assert(result.symptoms.length === 1, "Should detect back pain");
      
      const duration = getDuration(result.symptoms[0]);
      assert(duration !== undefined, "Should detect ongoing duration");
      assert(duration && 
             typeof duration === "object" && 
             "raw" in duration && 
             duration.raw === "ongoing", "Should capture ongoing indicator");
    });
  });

  // Phase 1.2: Condition Type Detection Tests  
  describe("Condition type detection tests", () => {
    it("Condition type - ACUTE detection", () => {
      const result = parseIntent("I have sudden sharp chest pain");
      
      assert(result.intent.type === "symptom_check", "Should classify as symptom check");
      assert(result.symptoms.length === 1, "Should detect chest pain");
      assert(result.symptoms[0].severity === "SHARP", "Should detect sharp severity");
    });

    it("Condition type - PREVENTIVE detection", () => {
      const result = parseIntent("How can I prevent heart disease?");
      
      assert(result.intent.type === "prevention_inquiry", "Should classify as prevention inquiry");
      assert(getConfidence(result.intent) >= 0.8, "Should have high confidence for prevention");
    });

    it("Condition type - INFORMATIONAL detection", () => {
      const result = parseIntent("What is diabetes and how does it affect the body?");
      
      assert(result.intent.type === "information_request", "Should classify as information request");
      assert(getConfidence(result.intent) >= 0.6, "Should have good confidence for info requests");
    });

    it("Condition type - MEDICATION detection", () => {
      const result = parseIntent("What is the right dosage for my blood pressure medication?");
      
      assert(result.intent.type === "medication_inquiry", "Should classify as medication inquiry");
      assert(getConfidence(result.intent) >= 0.7, "Should have good confidence for medication queries");
    });
  });

  // Phase 1.3: Enhanced Symptom Parsing with Regex + Keywords + Synonyms
  describe("Enhanced symptom parsing tests", () => {
    it("Symptom synonyms - headache variations", () => {
      const testCases = [
        "I have a migraine",
        "My head hurts really bad", 
        "I'm experiencing head pain",
        "I have a severe headache"
      ];
      
      testCases.forEach((testCase, index) => {
        const result = parseIntent(testCase);
        assert(result.symptoms.length >= 1, `Case ${index + 1}: Should detect head pain symptom`);
        assert(result.symptoms.some(s => s.name === "headache"), `Case ${index + 1}: Should map to headache`);
        assert(result.symptoms[0].location === "HEAD", `Case ${index + 1}: Should have HEAD location`);
      });
    });

    it("Symptom synonyms - chest pain variations", () => {
      const testCases = [
        "I have chest tightness",
        "My chest hurts",
        "I feel heart pain",
        "There's chest discomfort"
      ];
      
      testCases.forEach((testCase, index) => {
        const result = parseIntent(testCase);
        assert(result.symptoms.length >= 1, `Case ${index + 1}: Should detect chest symptom`);
        assert(result.symptoms.some(s => s.name === "chest pain"), `Case ${index + 1}: Should map to chest pain`);
        assert(result.symptoms[0].location === "CHEST", `Case ${index + 1}: Should have CHEST location`);
      });
    });

    it("Multiple symptoms detection", () => {
      const result = parseIntent("I have a headache, nausea, and feel very tired");
      
      assert(result.symptoms.length >= 2, "Should detect multiple symptoms");
      
      const symptomNames = result.symptoms.map(s => s.name);
      assert(symptomNames.includes("headache"), "Should detect headache");
      assert(symptomNames.includes("nausea") || symptomNames.includes("fatigue"), 
        "Should detect nausea or fatigue");
    });

    it("Severity extraction", () => {
      const severeCase = parseIntent("I have severe stabbing chest pain");
      assert(severeCase.symptoms.length >= 1, "Should detect symptom");
      
      const symptom = severeCase.symptoms[0];
      assert(symptom.severity === "SEVERE" || symptom.severity === "SHARP", 
        "Should detect severe or sharp severity");
      
      const mildCase = parseIntent("I have mild stomach discomfort");
      assert(mildCase.symptoms.length >= 1, "Should detect mild symptom");
      assert(mildCase.symptoms[0].severity === "MILD", "Should detect mild severity");
    });
  });

  // Phase 1.4: Fallback NLP Handler Tests
  describe("Fallback NLP handler tests", () => {
    it("Fallback parsing - body part + pain", () => {
      const result = parseIntent("My knee hurts when I walk");
      
      assert(result.symptoms.length >= 1, "Should detect symptom via fallback");
      // The fallback should catch this as a body part + pain combination
      assert(result.symptoms.some(s => s.location !== "UNSPECIFIED"), 
        "Should assign proper body location");
    });

    it("Fallback parsing - uncommon symptom combinations", () => {
      const result = parseIntent("I have shoulder aches and elbow soreness");
      
      assert(result.symptoms.length >= 1, "Should detect symptoms via fallback");
      // Should use fallback NLP to catch body parts + pain descriptors
    });
  });

  // Phase 1.5: Contextual Correction and Disambiguation Tests
  describe("Contextual correction and disambiguation tests", () => {
    it("Contextual correction - duplicate removal", () => {
      const result = parseIntent("I have head pain and a headache and head hurts");
      
      // Should consolidate multiple references to the same symptom  
      const headSymptoms = result.symptoms.filter(s => 
        s.name === "headache" || s.name.includes("head"));
      
      assert(headSymptoms.length <= 2, "Should consolidate duplicate head pain references");
    });

    it("Contextual correction - location normalization", () => {
      const result = parseIntent("I have chest pain");
      
      assert(result.symptoms.length >= 1, "Should detect symptom");
      assert(result.symptoms[0].location !== undefined, "Should have location");
      
      // Location should be normalized to valid BODY_LOCATIONS key
      const validLocations = ["HEAD", "CHEST", "ABDOMEN", "BACK", "GENERAL", "UNSPECIFIED"];
      const location = result.symptoms[0].location;
      assert(location && validLocations.includes(location), 
        "Should normalize to valid location");
    });

    it("Contextual correction - negation handling", () => {
      const result = parseIntent("I don't have a fever but I do have chills");
      
      assert(result.symptoms.length >= 1, "Should parse symptoms");
      
      // Should properly handle negation - fever should be negated if detected
      const feverSymptom = result.symptoms.find(s => s.name === "fever");
      if (feverSymptom) {
        assert(feverSymptom.negated === true, "Should mark fever as negated");
      }
      
      // Should ensure negated field exists on all symptoms
      result.symptoms.forEach((symptom, index) => {
        assert("negated" in symptom, `Symptom ${index + 1} should have negated field`);
        assert(typeof symptom.negated === "boolean", `Symptom ${index + 1} negated should be boolean`);
      });
    });
  });

  // Intent Classification Enhancement Tests
  describe("Intent classification enhancement tests", () => {
    it("Intent classification - emergency detection", () => {
      const result = parseIntent("This is an emergency! I have severe chest pain and can't breathe");
      
      assert(result.intent.type === "emergency", "Should classify as emergency");
      assert(getConfidence(result.intent) >= 0.9, "Should have very high confidence for emergency");
    });

    it("Intent classification - confidence scaling", () => {
      const singleSymptom = parseIntent("I have a headache");
      const multipleSymptoms = parseIntent("I have a headache, nausea, dizziness, and fatigue");
      
      const singleConfidence = getConfidence(singleSymptom.intent);
      const multipleConfidence = getConfidence(multipleSymptoms.intent);
      
      assert(singleConfidence < multipleConfidence,
        "Multiple symptoms should increase confidence");
      assert(multipleConfidence <= 0.95, "Confidence should be capped at 0.95");
    });
  });

  // Edge Cases and Error Handling
  describe("Edge cases and error handling", () => {
    it("Edge case - empty input", () => {
      const result = parseIntent("");
      
      assert(result.intent.type !== undefined, "Should return valid intent for empty input");
      assert(Array.isArray(result.symptoms), "Should return symptoms array");
      assert(result.symptoms.length === 0, "Should have no symptoms for empty input");
    });

    it("Edge case - non-medical input", () => {
      const result = parseIntent("What's the weather like today?");
      
      assert(result.intent.type === "general_inquiry", "Should classify non-medical as general inquiry");
      assert(getConfidence(result.intent) <= 0.5, "Should have low confidence for non-medical input");
    });

    it("Edge case - mixed medical and non-medical", () => {
      const result = parseIntent("I have a headache but also wanted to know about the weather");
      
      assert(result.symptoms.length >= 1, "Should still detect medical symptoms");
      assert(result.symptoms.some(s => s.name === "headache"), "Should detect headache");
      assert(result.intent.type === "symptom_check", "Should prioritize medical intent");
    });
  });

  it("Enhanced Intent Parser Tests Complete", () => {
    // Summary test to confirm all test suites run
    expect(true).toBe(true);
  });
});