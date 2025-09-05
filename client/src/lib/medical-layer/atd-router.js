/**
 * @file ATD (Advice to Doctor) routing and provider interface system
 * Phase 9: Medical Safety Guidelines - Professional medical handoff system
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
 * Determine if case should be routed to healthcare provider
 * @param {object} triageResult - Enhanced triage result from triage-engine
 * @param {object} emergencyDetection - Emergency detection result
 * @param {string} originalQuery - User's original query
 * @param {object} demographics - Patient demographics (age, sex, etc.)
 * @returns {ATDRoutingResult} ATD routing decision
 */
export function routeToProvider(triageResult, emergencyDetection, originalQuery, demographics = {}) {
  const clinicalFlags = [];
  let routeToProvider = false;
  let providerType = "routine";
  let priorityScore = 1;
  
  // 1. EMERGENCY ROUTING - Immediate provider intervention
  if (triageResult.level === "EMERGENCY" || emergencyDetection.isEmergency) {
    routeToProvider = true;
    providerType = emergencyDetection.emergencyType === "mental_health" ? "mental_health" : "emergency";
    priorityScore = 10;
    clinicalFlags.push("EMERGENCY_SITUATION");
    
    if (emergencyDetection.emergencyType === "mental_health") {
      clinicalFlags.push("MENTAL_HEALTH_CRISIS");
      if (emergencyDetection.severity === "critical") {
        clinicalFlags.push("SUICIDE_RISK");
      }
    }
    
    if (triageResult.safetyFlags?.includes("CHEST_SYMPTOMS")) {
      clinicalFlags.push("CARDIAC_CONCERN");
    }
    
    if (triageResult.safetyFlags?.includes("BREATHING_SYMPTOMS")) {
      clinicalFlags.push("RESPIRATORY_DISTRESS");
    }
  }
  
  // 2. URGENT ROUTING - Provider needed within hours
  else if (triageResult.level === "URGENT") {
    routeToProvider = true;
    providerType = "urgent";
    priorityScore = 7;
    clinicalFlags.push("URGENT_EVALUATION_NEEDED");
    
    // Add specific flags for urgent conditions
    if (triageResult.safetyFlags?.includes("MULTIPLE_SYMPTOMS")) {
      clinicalFlags.push("COMPLEX_SYMPTOM_PATTERN");
      priorityScore = 8;
    }
    
    if (triageResult.safetyFlags?.includes("CONSERVATIVE_ESCALATION")) {
      clinicalFlags.push("CONSERVATIVE_BIAS_APPLIED");
    }
  }
  
  // 3. DEMOGRAPHIC-BASED ROUTING
  if (demographics.age) {
    if (demographics.age < 18) {
      clinicalFlags.push("PEDIATRIC_PATIENT");
      priorityScore = Math.min(priorityScore + 1, 10);
      if (!routeToProvider && triageResult.symptomNames.length > 0) {
        routeToProvider = true;
        providerType = "routine";
        priorityScore = Math.max(priorityScore, 5);
      }
    } else if (demographics.age >= 65) {
      clinicalFlags.push("GERIATRIC_PATIENT");
      if (triageResult.symptomNames.length > 1) {
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
  if (triageResult.severityAssessment?.severeCount >= 2) {
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
      triageResult.symptomNames.some(s => s.includes(symptom))
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
 * Generate structured medical data for healthcare provider interface
 * @param {object} triageResult - Triage result
 * @param {object} emergencyDetection - Emergency detection
 * @param {string} originalQuery - Original user query
 * @param {object} demographics - Patient demographics
 * @param {string[]} clinicalFlags - Clinical flags
 * @returns {object} Structured medical data
 */
function generateStructuredMedicalData(triageResult, emergencyDetection, originalQuery, demographics, clinicalFlags) {
  return {
    // Patient Information
    patient: {
      age: demographics.age || null,
      sex: demographics.sex || null,
      queryTimestamp: new Date().toISOString(),
      sessionId: demographics.sessionId || "anonymous"
    },
    
    // Chief Complaint (sanitized)
    chiefComplaint: {
      originalQuery: originalQuery.length > 200 ? originalQuery.substring(0, 200) + "..." : originalQuery,
      sanitizedQuery: sanitizeQueryForProvider(originalQuery),
      queryLength: originalQuery.length,
      keySymptoms: triageResult.symptomNames
    },
    
    // Triage Assessment
    triage: {
      level: triageResult.level,
      reasons: triageResult.reasons,
      safetyFlags: triageResult.safetyFlags,
      emergencyProtocol: triageResult.emergencyProtocol,
      mentalHealthCrisis: triageResult.mentalHealthCrisis,
      conservativeBiasApplied: triageResult.conservativeBiasApplied
    },
    
    // Symptom Analysis
    symptoms: {
      detected: triageResult.detectedSymptoms || [],
      severity: triageResult.severityAssessment,
      categories: getCategorizedSymptoms(triageResult.detectedSymptoms || []),
      timeline: extractTimelineFromQuery(originalQuery)
    },
    
    // Emergency Assessment
    emergency: {
      isEmergency: emergencyDetection.isEmergency,
      emergencyType: emergencyDetection.emergencyType,
      severity: emergencyDetection.severity,
      triggeredPatterns: emergencyDetection.triggeredPatterns,
      requiresEmergencyServices: emergencyDetection.requiresEmergencyServices
    },
    
    // Clinical Decision Support
    clinicalFlags,
    
    // Recommended Actions
    recommendedActions: triageResult.recommendedActions || [],
    
    // Risk Assessment
    riskAssessment: {
      overallRisk: calculateOverallRisk(triageResult, emergencyDetection),
      specificRisks: identifySpecificRisks(triageResult, demographics),
      followUpUrgency: determineFollowUpUrgency(triageResult.level)
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
 * @param {object} structuredData - Structured medical data
 * @param {string[]} clinicalFlags - Clinical flags
 * @returns {string} Formatted message for healthcare provider
 */
function generateProviderMessage(structuredData, clinicalFlags) {
  const { patient, triage, symptoms, emergency, riskAssessment } = structuredData;
  
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
      message += `- ${symptom.name} (${symptom.severity}, ${symptom.category})\n`;
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
  if (structuredData.recommendedActions.length > 0) {
    message += "**RECOMMENDED ACTIONS:**\n";
    for (const action of structuredData.recommendedActions) {
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

function sanitizeQueryForProvider(query) {
  // Remove potential PII while keeping medical content
  return query.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
              .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE_REDACTED]')
              .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
}

function getCategorizedSymptoms(symptoms) {
  const categories = {};
  for (const symptom of symptoms) {
    if (!categories[symptom.category]) {
      categories[symptom.category] = [];
    }
    categories[symptom.category].push(symptom.name);
  }
  return categories;
}

function extractTimelineFromQuery(query) {
  const timePatterns = [
    { pattern: /(\d+)\s*(hour|hr)s?\s*ago/gi, type: "hours" },
    { pattern: /(\d+)\s*(day|dy)s?\s*ago/gi, type: "days" },
    { pattern: /(\d+)\s*(week|wk)s?\s*ago/gi, type: "weeks" },
    { pattern: /since\s*(yesterday|today|morning|evening)/gi, type: "relative" },
    { pattern: /(suddenly|gradually|slowly|quickly)/gi, type: "onset" }
  ];
  
  const timeline = [];
  for (const timePattern of timePatterns) {
    const matches = query.match(timePattern.pattern);
    if (matches) {
      timeline.push({ type: timePattern.type, matches });
    }
  }
  
  return timeline;
}

function calculateOverallRisk(triageResult, emergencyDetection) {
  if (emergencyDetection.isEmergency) return "HIGH";
  if (triageResult.level === "URGENT") return "MODERATE";
  if (triageResult.safetyFlags?.length > 2) return "MODERATE";
  return "LOW";
}

function identifySpecificRisks(triageResult, demographics) {
  const risks = [];
  
  if (demographics.age && demographics.age >= 65) {
    risks.push("Age-related complications");
  }
  
  if (demographics.age && demographics.age < 18) {
    risks.push("Pediatric considerations");
  }
  
  if (triageResult.safetyFlags?.includes("MULTIPLE_SYMPTOMS")) {
    risks.push("Complex symptom interaction");
  }
  
  return risks;
}

function determineFollowUpUrgency(triageLevel) {
  switch (triageLevel) {
    case "EMERGENCY": return "IMMEDIATE";
    case "URGENT": return "WITHIN_24_HOURS";
    default: return "ROUTINE";
  }
}

function calculateReliabilityScore(triageResult, originalQuery) {
  let score = 7; // Base reliability
  
  // Increase reliability for clear symptoms
  if (triageResult.symptomNames.length >= 3) score += 1;
  
  // Decrease for very short queries
  if (originalQuery.length < 50) score -= 2;
  
  // Increase for emergency detection consensus
  if (triageResult.emergencyProtocol) score += 1;
  
  // Decrease if conservative bias was heavily applied
  if (triageResult.conservativeBiasApplied) score -= 1;
  
  return Math.max(1, Math.min(10, score));
}