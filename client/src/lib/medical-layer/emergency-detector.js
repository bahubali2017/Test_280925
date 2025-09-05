/**
 * @file Emergency situation detection and response system
 * Phase 9: Medical Safety Guidelines - Emergency protocol integration
 */

import { assessMentalHealthCrisis, getEmergencyContact } from '../config/safety-rules.js';

/**
 * Emergency detection result
 * @typedef {object} EmergencyDetectionResult
 * @property {boolean} isEmergency - Whether an emergency was detected
 * @property {'medical'|'mental_health'|'trauma'|null} emergencyType - Type of emergency
 * @property {string} severity - Emergency severity (critical, high, moderate)
 * @property {string[]} triggeredPatterns - Patterns that triggered emergency detection
 * @property {object} emergencyContacts - Relevant emergency contact information
 * @property {string} immediateActions - Immediate actions to take
 * @property {boolean} requiresEmergencyServices - Whether to call emergency services
 * @property {string} emergencyMessage - User-facing emergency message
 */

/**
 * Detect emergency situations from user input
 * @param {string} userInput - User's message
 * @param {string} region - User's region for emergency contacts
 * @param {object} _context - Additional context (age, medical history, etc.)
 * @returns {EmergencyDetectionResult} Emergency detection result
 */
export function detectEmergency(userInput, region = "US", _context = {}) {
  const text = userInput.toLowerCase();
  const triggeredPatterns = [];
  let emergencyType = null;
  let severity = "moderate";
  let requiresEmergencyServices = false;
  
  // 1. Check for life-threatening medical emergencies
  const medicalEmergencies = [
    "heart attack", "cardiac arrest", "chest pain", "can't breathe", "difficulty breathing",
    "unconscious", "loss of consciousness", "severe bleeding", "overdose", "poisoning",
    "stroke", "seizure", "choking", "severe head injury", "paralysis"
  ];
  
  for (const emergency of medicalEmergencies) {
    if (text.includes(emergency)) {
      triggeredPatterns.push(emergency);
      emergencyType = "medical";
      severity = "critical";
      requiresEmergencyServices = true;
    }
  }
  
  // 2. Check for mental health crises
  const mentalHealthAssessment = assessMentalHealthCrisis(text);
  if (mentalHealthAssessment.isCrisis) {
    triggeredPatterns.push(...mentalHealthAssessment.triggers);
    emergencyType = "mental_health";
    severity = mentalHealthAssessment.severity === "high" ? "critical" : "high";
    requiresEmergencyServices = mentalHealthAssessment.severity === "high";
  }
  
  // 3. Check for trauma emergencies
  const traumaEmergencies = [
    "severe accident", "car accident", "fell from height", "broken bones", "head trauma",
    "severe bleeding", "can't move", "hit by", "motorcycle accident"
  ];
  
  for (const trauma of traumaEmergencies) {
    if (text.includes(trauma)) {
      triggeredPatterns.push(trauma);
      emergencyType = "trauma";
      severity = "critical";
      requiresEmergencyServices = true;
    }
  }
  
  // 4. Check for less obvious but concerning patterns
  const concerningPatterns = [
    "worst headache of my life", "sudden severe pain", "vision loss", "can't speak",
    "severe allergic reaction", "anaphylaxis", "severe burn", "electrical shock"
  ];
  
  for (const pattern of concerningPatterns) {
    if (text.includes(pattern)) {
      triggeredPatterns.push(pattern);
      if (!emergencyType) {
        emergencyType = "medical";
        severity = "high";
        requiresEmergencyServices = true;
      }
    }
  }
  
  const isEmergency = triggeredPatterns.length > 0;
  const emergencyContacts = getEmergencyContact(region);
  
  return {
    isEmergency,
    emergencyType: /** @type {'medical'|'mental_health'|'trauma'|null} */ (emergencyType),
    severity,
    triggeredPatterns,
    emergencyContacts,
    immediateActions: generateImmediateActions(emergencyType, severity, _context),
    requiresEmergencyServices,
    emergencyMessage: generateEmergencyMessage(emergencyType, severity, emergencyContacts)
  };
}

/**
 * Generate immediate action instructions based on emergency type
 * @param {string|null} emergencyType - Type of emergency
 * @param {string} severity - Emergency severity
 * @param {object} _context - Additional context
 * @returns {string} Immediate action instructions
 */
function generateImmediateActions(emergencyType, severity, _context) {
  if (!emergencyType) return "";
  
  const actions = [];
  
  switch (emergencyType) {
    case "medical":
      if (severity === "critical") {
        actions.push("🚨 Call emergency services immediately");
        actions.push("📍 Stay where you are - do not drive");
        actions.push("👥 Get someone to help you if possible");
        actions.push("💊 Have your medications list ready");
      } else {
        actions.push("⚡ Seek immediate medical attention");
        actions.push("🏥 Go to emergency room or urgent care");
        actions.push("📞 Call your doctor if available");
      }
      break;
      
    case "mental_health":
      actions.push("🆘 You are not alone - help is available");
      if (severity === "critical") {
        actions.push("📞 Call emergency services or crisis hotline now");
        actions.push("👤 Reach out to a trusted person immediately");
        actions.push("🏠 Stay in a safe environment");
        actions.push("🚫 Remove any means of self-harm");
      } else {
        actions.push("📞 Call a mental health crisis line");
        actions.push("👥 Talk to someone you trust");
        actions.push("🏥 Consider going to emergency room");
      }
      break;
      
    case "trauma":
      actions.push("🚨 Call emergency services immediately");
      actions.push("🛑 Do not move unless in immediate danger");
      actions.push("🩹 Apply pressure to bleeding wounds");
      actions.push("👥 Wait for professional medical help");
      break;
  }
  
  return actions.join("\n");
}

/**
 * Generate emergency message for user interface
 * @param {string|null} emergencyType - Type of emergency
 * @param {string} severity - Emergency severity
 * @param {object} emergencyContacts - Emergency contact information
 * @returns {string} User-facing emergency message
 */
function generateEmergencyMessage(emergencyType, severity, emergencyContacts) {
  if (!emergencyType) return "";
  
  let baseMessage = "";
  
  switch (emergencyType) {
    case "medical":
      baseMessage = severity === "critical" 
        ? "🚨 **MEDICAL EMERGENCY DETECTED** - This appears to be a life-threatening situation."
        : "⚠️ **URGENT MEDICAL SITUATION** - You need immediate medical attention.";
      break;
      
    case "mental_health":
      baseMessage = severity === "critical"
        ? "🆘 **MENTAL HEALTH CRISIS** - Your safety is our immediate concern."
        : "💙 **MENTAL HEALTH SUPPORT NEEDED** - You don't have to go through this alone.";
      break;
      
    case "trauma":
      baseMessage = "🚨 **TRAUMA EMERGENCY** - You need immediate emergency medical care.";
      break;
  }
  
  // Add contact information
  const contactInfo = [];
  if (emergencyType === "mental_health") {
    contactInfo.push(`Crisis Line: ${emergencyContacts.crisis}`);
  }
  contactInfo.push(`Emergency: ${emergencyContacts.emergency}`);
  
  return `${baseMessage}\n\n📞 **IMMEDIATE HELP:**\n${contactInfo.join("\n")}`;
}

/**
 * Check if situation requires emergency services
 * @param {string} userInput - User input
 * @returns {boolean} Whether emergency services should be called
 */
export function requiresEmergencyServices(userInput) {
  const detection = detectEmergency(userInput);
  return detection.requiresEmergencyServices;
}

/**
 * Get crisis intervention resources based on situation
 * @param {'medical'|'mental_health'|'trauma'} emergencyType - Emergency type
 * @param {string} region - User region
 * @returns {object} Crisis intervention resources
 */
export function getCrisisInterventionResources(emergencyType, region = "US") {
  const contacts = getEmergencyContact(region);
  const resources = {
    immediate: [],
    followup: [],
    online: []
  };
  
  switch (emergencyType) {
    case "medical":
      resources.immediate = [
        { name: "Emergency Services", number: contacts.emergency, available: "24/7" },
        { name: "Poison Control", number: contacts.poison, available: "24/7" }
      ];
      resources.online = [
        { name: "WebMD Symptom Checker", url: "https://symptoms.webmd.com" },
        { name: "Mayo Clinic", url: "https://www.mayoclinic.org" }
      ];
      break;
      
    case "mental_health":
      resources.immediate = [
        { name: "Crisis Hotline", number: contacts.crisis, available: "24/7" },
        { name: "Emergency Services", number: contacts.emergency, available: "24/7" }
      ];
      resources.online = [
        { name: "Crisis Text Line", text: "HOME to 741741", available: "24/7" },
        { name: "National Suicide Prevention", url: "https://suicidepreventionlifeline.org" }
      ];
      break;
      
    case "trauma":
      resources.immediate = [
        { name: "Emergency Services", number: contacts.emergency, available: "24/7" }
      ];
      break;
  }
  
  return resources;
}

/**
 * Generate emergency protocol checklist
 * @param {EmergencyDetectionResult} detection - Emergency detection result
 * @returns {Array<{step: number, action: string, priority: 'critical'|'high'|'medium', completed: boolean}>} Checklist items
 */
export function generateEmergencyChecklist(detection) {
  const checklist = [];
  let stepNumber = 1;
  
  if (!detection.isEmergency) return checklist;
  
  // Critical priority actions
  if (detection.requiresEmergencyServices) {
    checklist.push({
      step: stepNumber++,
      action: `Call ${detection.emergencyContacts.emergency} immediately`,
      priority: "critical",
      completed: false
    });
  }
  
  if (detection.emergencyType === "mental_health") {
    checklist.push({
      step: stepNumber++,
      action: "Ensure you are in a safe environment",
      priority: "critical",
      completed: false
    });
    
    if (detection.severity === "critical") {
      checklist.push({
        step: stepNumber++,
        action: "Remove any potential means of self-harm",
        priority: "critical",
        completed: false
      });
    }
  }
  
  // High priority actions
  checklist.push({
    step: stepNumber++,
    action: "Stay calm and breathe slowly",
    priority: "high",
    completed: false
  });
  
  if (detection.emergencyType === "medical" || detection.emergencyType === "trauma") {
    checklist.push({
      step: stepNumber++,
      action: "Do not drive yourself - get help or call ambulance",
      priority: "high",
      completed: false
    });
  }
  
  checklist.push({
    step: stepNumber++,
    action: "Contact a trusted person to help you",
    priority: "high",
    completed: false
  });
  
  // Medium priority actions
  checklist.push({
    step: stepNumber++,
    action: "Gather important medical information (medications, allergies)",
    priority: "medium",
    completed: false
  });
  
  return /** @type {Array<{step: number, action: string, priority: 'critical'|'high'|'medium', completed: boolean}>} */ (checklist);
}