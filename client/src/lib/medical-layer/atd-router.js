/**
 * @file ATD (Advice to Doctor) routing and provider interface system
 * Phase 9: Medical Safety Guidelines - Professional medical handoff system
 */

/** @typedef {{[k: string]: number}} NumDict */
/** @typedef {{[k: string]: string}} StringDict */

/**
 * @typedef ActualTriageResult
 * @property {string} level - Triage level (EMERGENCY, URGENT, etc.)
 * @property {string[]} [symptomNames] - Array of detected symptom names
 * @property {string[]} [safetyFlags] - Safety flags array
 * @property {object} [severityAssessment] - Severity assessment object
 * @property {number} [severityAssessment.severeCount] - Count of severe symptoms
 * @property {string[]} [reasons] - Triage reasoning array
 * @property {boolean} [emergencyProtocol] - Emergency protocol flag
 * @property {boolean} [mentalHealthCrisis] - Mental health crisis flag
 * @property {boolean} [conservativeBiasApplied] - Conservative bias flag
 * @property {object[]} [detectedSymptoms] - Detected symptoms array
 * @property {string[]} [recommendedActions] - Recommended actions array
 */

/**
 * ATD routing decision result
 * @typedef {object} ATDRoutingResult
 * @property {boolean} routeToProvider - Whether to route to medical provider
 * @property {'emergency'|'urgent'|'routine'|'mental_health'} providerType - Type of provider needed
 * @property {object} structuredData - Structured medical data for provider
 * @property {string} providerMessage - Message formatted for healthcare provider
 * @property {string} patientGuidance - Guidance message for patient
 * @property {string[]} clinicalFlags - Clinical flags for provider attention
 * @property {number} priorityScore - Priority score (1-10, 10 being highest)
 */

/**
 * @typedef TriageInput
 * @property {string} level
 * @property {string[]} [symptomNames]
 * @property {string[]} [safetyFlags]
 * @property {object} [severityAssessment]
 * @property {number} [severityAssessment.severeCount]
 * @property {string[]} [reasons]
 * @property {boolean} [emergencyProtocol]
 * @property {boolean} [mentalHealthCrisis]
 * @property {boolean} [conservativeBiasApplied]
 * @property {object[]} [detectedSymptoms]
 * @property {string[]} [recommendedActions]
 */

/**
 * @typedef EmergencyDetectionInput
 * @property {boolean} isEmergency
 * @property {string} [emergencyType]
 * @property {string} [severity]
 * @property {string[]} [triggeredPatterns]
 * @property {boolean} [requiresEmergencyServices]
 */

/**
 * @typedef DemographicsInput
 * @property {number} [age]
 * @property {string} [sex]
 * @property {string} [sessionId]
 */

/**
 * @typedef DetectedSymptom
 * @property {string} name
 * @property {string} severity
 * @property {string} category
 */


/**
 * Determine if case should be routed to healthcare provider
 * @param {TriageInput} triageResult - Enhanced triage result from triage-engine
 * @param {EmergencyDetectionInput} emergencyDetection - Emergency detection result
 * @param {string} originalQuery - User's original query
 * @param {DemographicsInput} [demographics={}] - Patient demographics (age, sex, etc.)
 * @returns {ATDRoutingResult} ATD routing decision
 */
export function routeToProvider(triageResult, emergencyDetection, originalQuery, demographics = {}) {
  /** @type {string[]} */
  const clinicalFlags = [];
  let routeToProvider = false;
  let providerType = "routine";
  let priorityScore = 1;
  
  // Safe property access
  const triageLevel = triageResult && typeof triageResult.level === 'string' ? triageResult.level : '';
  const isEmergency = emergencyDetection && typeof emergencyDetection.isEmergency === 'boolean' ? emergencyDetection.isEmergency : false;
  const emergencyType = emergencyDetection && typeof emergencyDetection.emergencyType === 'string' ? emergencyDetection.emergencyType : '';
  const emergencySeverity = emergencyDetection && typeof emergencyDetection.severity === 'string' ? emergencyDetection.severity : '';
  const safetyFlags = triageResult && Array.isArray(triageResult.safetyFlags) ? triageResult.safetyFlags : [];
  const symptomNames = triageResult && Array.isArray(triageResult.symptomNames) ? triageResult.symptomNames : [];
  const severityAssessment = triageResult && triageResult.severityAssessment ? triageResult.severityAssessment : null;
  const severeCount = severityAssessment && typeof severityAssessment.severeCount === 'number' ? severityAssessment.severeCount : 0;
  
  // 1. EMERGENCY ROUTING - Immediate provider intervention
  if (triageLevel === "EMERGENCY" || isEmergency) {
    routeToProvider = true;
    providerType = emergencyType === "mental_health" ? "mental_health" : "emergency";
    priorityScore = 10;
    clinicalFlags.push("EMERGENCY_SITUATION");
    
    if (emergencyType === "mental_health") {
      clinicalFlags.push("MENTAL_HEALTH_CRISIS");
      if (emergencySeverity === "critical") {
        clinicalFlags.push("SUICIDE_RISK");
      }
    }
    
    if (safetyFlags.includes("CHEST_SYMPTOMS")) {
      clinicalFlags.push("CARDIAC_CONCERN");
    }
    
    if (safetyFlags.includes("BREATHING_SYMPTOMS")) {
      clinicalFlags.push("RESPIRATORY_DISTRESS");
    }
  }
  
  // 2. URGENT ROUTING - Provider needed within hours
  else if (triageLevel === "URGENT") {
    routeToProvider = true;
    providerType = "urgent";
    priorityScore = 7;
    clinicalFlags.push("URGENT_EVALUATION_NEEDED");
    
    // Add specific flags for urgent conditions
    if (safetyFlags.includes("MULTIPLE_SYMPTOMS")) {
      clinicalFlags.push("COMPLEX_SYMPTOM_PATTERN");
      priorityScore = 8;
    }
    
    if (safetyFlags.includes("CONSERVATIVE_ESCALATION")) {
      clinicalFlags.push("CONSERVATIVE_BIAS_APPLIED");
    }
  }
  
  // 3. DEMOGRAPHIC-BASED ROUTING
  const age = demographics && typeof demographics.age === 'number' ? demographics.age : null;
  if (age !== null) {
    if (age < 18) {
      clinicalFlags.push("PEDIATRIC_PATIENT");
      priorityScore = Math.min(priorityScore + 1, 10);
      if (!routeToProvider && symptomNames.length > 0) {
        routeToProvider = true;
        providerType = "routine";
        priorityScore = Math.max(priorityScore, 5);
      }
    } else if (age >= 65) {
      clinicalFlags.push("GERIATRIC_PATIENT");
      if (symptomNames.length > 1) {
        priorityScore = Math.min(priorityScore + 1, 10);
        if (!routeToProvider) {
          routeToProvider = true;
          providerType = "routine";
          priorityScore = Math.max(priorityScore, 4);
        }
      }
    }
  }
  
  // 4. COMPLEX SYMPTOM PATTERNS
  if (severeCount >= 2) {
    routeToProvider = true;
    providerType = providerType === "routine" ? "urgent" : providerType;
    clinicalFlags.push("MULTIPLE_SEVERE_SYMPTOMS");
    priorityScore = Math.min(priorityScore + 2, 10);
  }
  
  // 5. HIGH-RISK SYMPTOM COMBINATIONS
  const highRiskCombinations = [
    { symptoms: ["chest", "breathing"], flag: "CARDIOPULMONARY_SYMPTOMS" },
    { symptoms: ["headache", "vision"], flag: "NEUROLOGICAL_SYMPTOMS" },
    { symptoms: ["fever", "confusion"], flag: "SYSTEMIC_INFECTION_RISK" },
    { symptoms: ["bleeding", "pain"], flag: "TRAUMA_CONCERN" }
  ];
  
  for (const combo of highRiskCombinations) {
    const hasCombo = combo.symptoms.every(symptom => 
      symptomNames.some(s => s.includes(symptom))
    );
    
    if (hasCombo) {
      routeToProvider = true;
      providerType = providerType === "routine" ? "urgent" : providerType;
      clinicalFlags.push(combo.flag);
      priorityScore = Math.min(priorityScore + 1, 10);
    }
  }
  
  // Generate structured data for provider
  const structuredData = generateStructuredMedicalData(
    triageResult, 
    emergencyDetection, 
    originalQuery, 
    demographics, 
    clinicalFlags
  );
  
  return {
    routeToProvider,
    providerType: /** @type {'emergency'|'urgent'|'routine'|'mental_health'} */ (providerType),
    structuredData,
    providerMessage: generateProviderMessage(structuredData, clinicalFlags),
    patientGuidance: generatePatientGuidance(routeToProvider, providerType, priorityScore),
    clinicalFlags,
    priorityScore
  };
}

/**
 * @typedef StructuredMedicalData
 * @property {{age: number|null, sex: string|null, queryTimestamp: string, sessionId: string}} patient
 * @property {{originalQuery: string, sanitizedQuery: string, queryLength: number, keySymptoms: string[]}} chiefComplaint
 * @property {{level: string, reasons: string[], safetyFlags: string[], emergencyProtocol: boolean, mentalHealthCrisis: boolean, conservativeBiasApplied: boolean}} triage
 * @property {{detected: DetectedSymptom[], severity: object|null, categories: StringDict, timeline: Array<{type: string, matches: string[]}>}} symptoms
 * @property {{isEmergency: boolean, emergencyType: string, severity: string, triggeredPatterns: string[], requiresEmergencyServices: boolean}} emergency
 * @property {string[]} clinicalFlags
 * @property {string[]} recommendedActions
 * @property {{overallRisk: string, specificRisks: string[], followUpUrgency: string}} riskAssessment
 * @property {{aiTriageVersion: string, processingTimestamp: string, reliabilityScore: number}} systemContext
 */

/**
 * Generate structured medical data for healthcare provider interface
 * @param {TriageInput} triageResult - Triage result
 * @param {EmergencyDetectionInput} emergencyDetection - Emergency detection
 * @param {string} originalQuery - Original user query
 * @param {DemographicsInput} demographics - Patient demographics
 * @param {string[]} clinicalFlags - Clinical flags
 * @returns {StructuredMedicalData} Structured medical data
 */
function generateStructuredMedicalData(triageResult, emergencyDetection, originalQuery, demographics, clinicalFlags) {
  const detectedSymptoms = triageResult && Array.isArray(triageResult.detectedSymptoms) ? triageResult.detectedSymptoms : [];
  const recommendedActions = triageResult && Array.isArray(triageResult.recommendedActions) ? triageResult.recommendedActions : [];
  const symptomNames = triageResult && Array.isArray(triageResult.symptomNames) ? triageResult.symptomNames : [];
  const triageLevel = triageResult && typeof triageResult.level === 'string' ? triageResult.level : '';
  const reasons = triageResult && Array.isArray(triageResult.reasons) ? triageResult.reasons : [];
  const safetyFlags = triageResult && Array.isArray(triageResult.safetyFlags) ? triageResult.safetyFlags : [];
  const emergencyProtocol = triageResult && typeof triageResult.emergencyProtocol === 'boolean' ? triageResult.emergencyProtocol : false;
  const mentalHealthCrisis = triageResult && typeof triageResult.mentalHealthCrisis === 'boolean' ? triageResult.mentalHealthCrisis : false;
  const conservativeBiasApplied = triageResult && typeof triageResult.conservativeBiasApplied === 'boolean' ? triageResult.conservativeBiasApplied : false;
  const severityAssessment = triageResult && triageResult.severityAssessment ? triageResult.severityAssessment : null;
  
  const isEmergency = emergencyDetection && typeof emergencyDetection.isEmergency === 'boolean' ? emergencyDetection.isEmergency : false;
  const emergencyType = emergencyDetection && typeof emergencyDetection.emergencyType === 'string' ? emergencyDetection.emergencyType : '';
  const emergencySeverity = emergencyDetection && typeof emergencyDetection.severity === 'string' ? emergencyDetection.severity : '';
  const triggeredPatterns = emergencyDetection && Array.isArray(emergencyDetection.triggeredPatterns) ? emergencyDetection.triggeredPatterns : [];
  const requiresEmergencyServices = emergencyDetection && typeof emergencyDetection.requiresEmergencyServices === 'boolean' ? emergencyDetection.requiresEmergencyServices : false;
  
  return {
    // Patient Information
    patient: {
      age: demographics && typeof demographics.age === 'number' ? demographics.age : null,
      sex: demographics && typeof demographics.sex === 'string' ? demographics.sex : null,
      queryTimestamp: new Date().toISOString(),
      sessionId: demographics && typeof demographics.sessionId === 'string' ? demographics.sessionId : "anonymous"
    },
    
    // Chief Complaint (sanitized)
    chiefComplaint: {
      originalQuery: originalQuery.length > 200 ? originalQuery.substring(0, 200) + "..." : originalQuery,
      sanitizedQuery: sanitizeQueryForProvider(originalQuery),
      queryLength: originalQuery.length,
      keySymptoms: symptomNames
    },
    
    // Triage Assessment
    triage: {
      level: triageLevel,
      reasons,
      safetyFlags,
      emergencyProtocol,
      mentalHealthCrisis,
      conservativeBiasApplied
    },
    
    // Symptom Analysis
    symptoms: {
      detected: /** @type {DetectedSymptom[]} */ (detectedSymptoms),
      severity: severityAssessment,
      categories: getCategorizedSymptoms(/** @type {DetectedSymptom[]} */ (detectedSymptoms)),
      timeline: extractTimelineFromQuery(originalQuery)
    },
    
    // Emergency Assessment
    emergency: {
      isEmergency,
      emergencyType,
      severity: emergencySeverity,
      triggeredPatterns,
      requiresEmergencyServices
    },
    
    // Clinical Decision Support
    clinicalFlags,
    
    // Recommended Actions
    recommendedActions,
    
    // Risk Assessment
    riskAssessment: {
      overallRisk: calculateOverallRisk(triageResult, emergencyDetection),
      specificRisks: identifySpecificRisks(triageResult, demographics),
      followUpUrgency: determineFollowUpUrgency(triageLevel)
    },
    
    // System Context
    systemContext: {
      aiTriageVersion: "Phase9-SafetyFramework",
      processingTimestamp: new Date().toISOString(),
      reliabilityScore: calculateReliabilityScore(triageResult, originalQuery)
    }
  };
}

/**
 * Generate provider-facing message
 * @param {StructuredMedicalData} structuredData - Structured medical data
 * @param {string[]} clinicalFlags - Clinical flags
 * @returns {string} Formatted message for healthcare provider
 */
function generateProviderMessage(structuredData, clinicalFlags) {
  const patient = structuredData.patient;
  const triage = structuredData.triage;
  const symptoms = structuredData.symptoms;
  const emergency = structuredData.emergency;
  const riskAssessment = structuredData.riskAssessment;
  
  let message = "**MEDICAL AI TRIAGE REFERRAL**\n\n";
  
  // Patient Demographics
  message += "**PATIENT INFO:**\n";
  if (patient.age) message += `Age: ${patient.age}\n`;
  if (patient.sex) message += `Sex: ${patient.sex}\n`;
  message += `Query Time: ${new Date(patient.queryTimestamp).toLocaleString()}\n\n`;
  
  // Triage Level and Risk
  message += `**TRIAGE LEVEL:** ${triage.level}\n`;
  message += `**OVERALL RISK:** ${riskAssessment.overallRisk}\n\n`;
  
  // Clinical Flags
  if (clinicalFlags.length > 0) {
    message += `**CLINICAL FLAGS:** ${clinicalFlags.join(', ')}\n\n`;
  }
  
  // Emergency Status
  if (emergency.isEmergency) {
    message += `**⚠️ EMERGENCY DETECTED:** ${emergency.emergencyType} (${emergency.severity})\n`;
    message += `Triggered by: ${emergency.triggeredPatterns.join(', ')}\n\n`;
  }
  
  // Key Symptoms
  if (symptoms.detected.length > 0) {
    message += "**KEY SYMPTOMS:**\n";
    for (const symptom of symptoms.detected) {
      const symptomObj = symptom && typeof symptom === 'object' ? symptom : {};
      const name = 'name' in symptomObj && typeof symptomObj.name === 'string' ? symptomObj.name : 'Unknown';
      const severity = 'severity' in symptomObj && typeof symptomObj.severity === 'string' ? symptomObj.severity : 'Unknown';
      const category = 'category' in symptomObj && typeof symptomObj.category === 'string' ? symptomObj.category : 'Unknown';
      message += `- ${name} (${severity}, ${category})\n`;
    }
    message += "\n";
  }
  
  // Clinical Reasoning
  message += "**TRIAGE REASONING:**\n";
  for (const reason of triage.reasons) {
    message += `- ${reason}\n`;
  }
  message += "\n";
  
  // Recommended Actions
  const recommendedActions = structuredData.recommendedActions;
  if (recommendedActions.length > 0) {
    message += "**RECOMMENDED ACTIONS:**\n";
    for (const action of recommendedActions) {
      message += `- ${action}\n`;
    }
    message += "\n";
  }
  
  // System Notes
  message += "**SYSTEM NOTES:**\n";
  if (triage.conservativeBiasApplied) {
    message += "- Conservative safety bias applied to triage level\n";
  }
  message += `- AI Reliability Score: ${structuredData.systemContext.reliabilityScore}/10\n`;
  message += `- Follow-up Urgency: ${riskAssessment.followUpUrgency}\n`;
  
  return message;
}

/**
 * Generate patient guidance based on ATD routing decision
 * @param {boolean} routeToProvider - Whether routing to provider
 * @param {string} providerType - Type of provider
 * @param {number} priorityScore - Priority score
 * @returns {string} Patient guidance message
 */
function generatePatientGuidance(routeToProvider, providerType, priorityScore) {
  if (!routeToProvider) {
    return "Based on your symptoms, you may want to monitor your condition and consult a healthcare provider if symptoms worsen or persist.";
  }
  
  switch (providerType) {
    case "emergency":
      return "🚨 **SEEK EMERGENCY CARE IMMEDIATELY** - Your symptoms suggest you need emergency medical attention. Call emergency services or go to the emergency room right away.";
      
    case "mental_health":
      return "🆘 **MENTAL HEALTH CRISIS SUPPORT NEEDED** - Please reach out for immediate help. Contact a mental health crisis line or emergency services.";
      
    case "urgent":
      return "⚡ **URGENT MEDICAL ATTENTION NEEDED** - You should seek medical care within the next 2-4 hours. Visit urgent care or contact your healthcare provider immediately.";
      
    case "routine":
      if (priorityScore >= 7) {
        return "📅 **SCHEDULE MEDICAL APPOINTMENT SOON** - Your symptoms warrant medical evaluation within the next 1-2 days.";
      } else if (priorityScore >= 4) {
        return "📞 **CONSULT HEALTHCARE PROVIDER** - Consider scheduling an appointment within the next few days to discuss your symptoms.";
      } else {
        return "🏥 **MEDICAL CONSULTATION RECOMMENDED** - Schedule an appointment with your healthcare provider when convenient to discuss your concerns.";
      }
      
    default:
      return "Please consult with a healthcare professional about your symptoms.";
  }
}

// Helper functions

/**
 * Sanitize query for provider by removing PII
 * @param {string} query - Original query
 * @returns {string} Sanitized query
 */
function sanitizeQueryForProvider(query) {
  // Remove potential PII while keeping medical content
  return query.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
              .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE_REDACTED]')
              .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
}

/**
 * Categorize symptoms by type
 * @param {DetectedSymptom[]} symptoms - Array of detected symptoms
 * @returns {StringDict} Categories mapping to symptom names
 */
function getCategorizedSymptoms(symptoms) {
  /** @type {{[k: string]: string[]}} */
  const categoriesArrays = {};
  for (const symptom of symptoms) {
    const symptomObj = symptom && typeof symptom === 'object' ? symptom : {};
    const category = 'category' in symptomObj && typeof symptomObj.category === 'string' ? symptomObj.category : 'unknown';
    const name = 'name' in symptomObj && typeof symptomObj.name === 'string' ? symptomObj.name : 'Unknown symptom';
    
    if (!categoriesArrays[category]) {
      categoriesArrays[category] = [];
    }
    
    categoriesArrays[category].push(name);
  }
  
  /** @type {StringDict} */
  const categories = {};
  for (const [category, names] of Object.entries(categoriesArrays)) {
    categories[category] = names.join(', ');
  }
  
  return categories;
}

/**
 * Extract timeline information from query
 * @param {string} query - User query
 * @returns {Array<{type: string, matches: string[]}>} Timeline information
 */
function extractTimelineFromQuery(query) {
  const timePatterns = [
    { pattern: /(\d+)\s*(hour|hr)s?\s*ago/gi, type: "hours" },
    { pattern: /(\d+)\s*(day|dy)s?\s*ago/gi, type: "days" },
    { pattern: /(\d+)\s*(week|wk)s?\s*ago/gi, type: "weeks" },
    { pattern: /since\s*(yesterday|today|morning|evening)/gi, type: "relative" },
    { pattern: /(suddenly|gradually|slowly|quickly)/gi, type: "onset" }
  ];
  
  /** @type {Array<{type: string, matches: string[]}>} */
  const timeline = [];
  for (const timePattern of timePatterns) {
    const matches = query.match(timePattern.pattern);
    if (matches) {
      timeline.push({ type: timePattern.type, matches: Array.from(matches) });
    }
  }
  
  return timeline;
}

/**
 * Calculate overall risk level
 * @param {TriageInput} triageResult - Triage result
 * @param {EmergencyDetectionInput} emergencyDetection - Emergency detection
 * @returns {string} Risk level
 */
function calculateOverallRisk(triageResult, emergencyDetection) {
  const isEmergency = emergencyDetection && typeof emergencyDetection.isEmergency === 'boolean' ? emergencyDetection.isEmergency : false;
  const triageLevel = triageResult && typeof triageResult.level === 'string' ? triageResult.level : '';
  const safetyFlags = triageResult && Array.isArray(triageResult.safetyFlags) ? triageResult.safetyFlags : [];
  
  if (isEmergency) return "HIGH";
  if (triageLevel === "URGENT") return "MODERATE";
  if (safetyFlags.length > 2) return "MODERATE";
  return "LOW";
}

/**
 * Identify specific risks based on patient data
 * @param {TriageInput} triageResult - Triage result
 * @param {DemographicsInput} demographics - Patient demographics
 * @returns {string[]} Array of specific risks
 */
function identifySpecificRisks(triageResult, demographics) {
  /** @type {string[]} */
  const risks = [];
  
  const age = demographics && typeof demographics.age === 'number' ? demographics.age : null;
  const safetyFlags = triageResult && Array.isArray(triageResult.safetyFlags) ? triageResult.safetyFlags : [];
  
  if (age !== null && age >= 65) {
    risks.push("Age-related complications");
  }
  
  if (age !== null && age < 18) {
    risks.push("Pediatric considerations");
  }
  
  if (safetyFlags.includes("MULTIPLE_SYMPTOMS")) {
    risks.push("Complex symptom interaction");
  }
  
  return risks;
}

/**
 * Determine follow-up urgency
 * @param {string} triageLevel - Triage level
 * @returns {string} Follow-up urgency
 */
function determineFollowUpUrgency(triageLevel) {
  switch (triageLevel) {
    case "EMERGENCY": return "IMMEDIATE";
    case "URGENT": return "WITHIN_24_HOURS";
    default: return "ROUTINE";
  }
}

/**
 * Calculate reliability score for the AI assessment
 * @param {TriageInput} triageResult - Triage result
 * @param {string} originalQuery - Original user query
 * @returns {number} Reliability score (1-10)
 */
function calculateReliabilityScore(triageResult, originalQuery) {
  let score = 7; // Base reliability
  
  const symptomNames = triageResult && Array.isArray(triageResult.symptomNames) ? triageResult.symptomNames : [];
  const emergencyProtocol = triageResult && typeof triageResult.emergencyProtocol === 'boolean' ? triageResult.emergencyProtocol : false;
  const conservativeBiasApplied = triageResult && typeof triageResult.conservativeBiasApplied === 'boolean' ? triageResult.conservativeBiasApplied : false;
  
  // Increase reliability for clear symptoms
  if (symptomNames.length >= 3) score += 1;
  
  // Decrease for very short queries
  if (originalQuery.length < 50) score -= 2;
  
  // Increase for emergency detection consensus
  if (emergencyProtocol) score += 1;
  
  // Decrease if conservative bias was heavily applied
  if (conservativeBiasApplied) score -= 1;
  
  return Math.max(1, Math.min(10, score));
}