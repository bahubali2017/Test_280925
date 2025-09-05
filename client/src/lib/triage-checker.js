import atd from "../rules/atd-conditions.json" with { type: "json" };

/**
 * Extract additional symptoms from user input text
 * @param {string} text - Lowercase user input
 * @returns {string[]} - Array of detected symptoms
 */
function extractSymptomsFromText(text) {
  const symptoms = [];
  
  // Chest pain related symptoms
  if (text.includes("chest pain")) symptoms.push("chest pain");
  if (text.includes("radiating") || text.includes("spreading")) symptoms.push("radiating pain");
  if (text.includes("sweating") || text.includes("diaphoresis")) symptoms.push("diaphoresis");
  
  // Breathing related symptoms  
  if (text.includes("difficulty breathing") || text.includes("can't breathe")) symptoms.push("difficulty breathing");
  if (text.includes("shortness of breath")) symptoms.push("shortness of breath");
  if (text.includes("blue") && (text.includes("lips") || text.includes("fingers"))) symptoms.push("cyanosis");
  
  // Mental health symptoms
  if (text.includes("suicidal") || text.includes("kill myself") || text.includes("suicide")) symptoms.push("suicidal ideation");
  if (text.includes("self harm") || text.includes("cutting")) symptoms.push("self harm");
  if (text.includes("depression") || text.includes("depressed")) symptoms.push("depression");
  if (text.includes("hopeless") || text.includes("hopelessness")) symptoms.push("hopelessness");
  if (text.includes("panic attacks")) symptoms.push("panic attacks");
  if (text.includes("racing heart") || text.includes("heart racing")) symptoms.push("racing heart");
  if (text.includes("can't sleep") || text.includes("insomnia")) symptoms.push("insomnia");
  
  // Fever related symptoms
  if (text.includes("fever") || text.includes("104") || text.includes("high temperature")) symptoms.push("high fever");
  if (text.includes("chills") || text.includes("shivering")) symptoms.push("chills");
  if (text.includes("confusion") || text.includes("confused")) symptoms.push("confusion");
  
  // Headache related symptoms
  if (text.includes("headache")) symptoms.push("headache");
  if (text.includes("severe headache") || text.includes("worst headache")) symptoms.push("severe headache");
  if (text.includes("vision") && (text.includes("blurry") || text.includes("changes"))) symptoms.push("vision changes");
  
  // Body aches and skin symptoms
  if (text.includes("body aches") || text.includes("aches")) symptoms.push("body aches");
  if (text.includes("red spot") || text.includes("skin") || text.includes("lesion")) symptoms.push("skin lesion");
  
  // Chest symptoms
  if (text.includes("chest tight") || text.includes("tightness")) symptoms.push("chest tightness");
  
  // Other symptoms
  if (text.includes("nausea") || text.includes("nauseated")) symptoms.push("nausea");
  if (text.includes("headache")) symptoms.push("headache");
  
  return [...new Set(symptoms)]; // Remove duplicates
}

/**
 * @param {import("./layer-context.js").LayerContext} ctx
 * @returns {import("./layer-context.js").Triage & { symptomNames: string[] }}
 */
export function performTriage(ctx) {
  const text = ctx.userInput.toLowerCase();
  const reasons = [];

  /** @type {import("./layer-context.js").Triage["level"]} */
  let level = "NON_URGENT";

  // Collect normalized symptom names (from parser if available)
  const symptomNames = Array.isArray(ctx.symptoms) && ctx.symptoms.length
    ? ctx.symptoms.map(s => String(s.name || "").toLowerCase()).filter(Boolean)
    : [];
    
  // Enhanced symptom extraction from user input
  const extractedSymptoms = extractSymptomsFromText(text);
  symptomNames.push(...extractedSymptoms);

  for (const rf of atd.red_flags) {
    if (text.includes(rf.pattern)) {
      if (rf.triage === "emergency") {
        level = "EMERGENCY";
        reasons.push(rf.reason);
        break;
      }
      if (rf.triage === "urgent" && level === "NON_URGENT") {
        level = "URGENT";
        reasons.push(rf.reason);
      }
    }
  }

  // Additional combinations for more sophisticated triage  
  if ((text.includes("headache") && (text.includes("worst") || text.includes("severe"))) && 
      (text.includes("vision") || text.includes("blurry"))) {
    if (level !== "EMERGENCY") {
      level = "URGENT";
      reasons.push("Severe headache with vision changes can indicate a neurologic emergency.");
      symptomNames.push("severe headache", "vision changes");
    }
  }
  
  // High fever with severe symptoms
  if (text.includes("104") || (text.includes("high fever") && (text.includes("confusion") || text.includes("severe")))) {
    if (level !== "EMERGENCY") {
      level = "URGENT";
      reasons.push("High fever with severe symptoms requires urgent evaluation.");
    }
  }

  // Duration heuristic (very naive, expand later)
  if (/over\s+(?:2|two)\s+weeks/.test(text) && level === "NON_URGENT") {
    reasons.push("Persistent symptoms over 2 weeks may warrant evaluation.");
  }

  // Mental health crisis detection
  if (text.includes("suicidal") || text.includes("kill myself") || text.includes("end it all")) {
    level = "EMERGENCY";
    reasons.push("Mental health crisis requiring immediate intervention.");
    symptomNames.push("suicidal ideation");
  }

  if (text.includes("self harm") || text.includes("cutting") || text.includes("hurting myself")) {
    if (level !== "EMERGENCY") level = "URGENT";
    reasons.push("Self-harm behavior requires urgent evaluation.");
    symptomNames.push("self harm");
  }
  
  // Depression and anxiety triage
  if (text.includes("depression") || text.includes("depressed") || 
      (text.includes("sad") && text.includes("hopeless")) ||
      text.includes("hopelessness")) {
    // Any mention of depression/hopelessness warrants urgent evaluation
    if (level !== "EMERGENCY") level = "URGENT";
    reasons.push("Depression screening requires urgent mental health evaluation.");
    symptomNames.push("depression", "hopelessness");
  }
  
  if (text.includes("anxiety") || text.includes("panic")) {
    if (text.includes("attacks") || text.includes("racing") || text.includes("can't") || text.includes("heart")) {
      if (level !== "EMERGENCY") level = "URGENT";
      reasons.push("Severe anxiety with physical symptoms requires prompt evaluation.");
      symptomNames.push("anxiety", "panic attacks");
    }
  }

  const isHighRisk = level !== "NON_URGENT";
  
  
  return { level, isHighRisk, reasons, symptomNames };
}