/**
 * Tailored disclaimers and ATD (Advice To Doctor) utilities.
 * JSDoc types align with LayerContext.
 */

/**
 * @typedef {"emergency"|"urgent"|"non_urgent"} TriageLevel
 */

/**
 * @typedef {object} DisclaimerPack
 * @property {string[]} disclaimers
 * @property {string[]} atdNotices
 */

/**
 * @param {TriageLevel} level
 * @param {string[]} [symptomNames]  // lowercased names e.g. ["chest pain","headache"]
 * @returns {DisclaimerPack}
 */
export function selectDisclaimers(level, symptomNames = []) {
  const s = new Set(symptomNames.map((x) => String(x).toLowerCase()));

  /** @type {DisclaimerPack} */
  const base = {
    disclaimers: [
      "This assistant is informational and not a diagnostic tool.",
      "Responses may include general medical information and should not replace a professional evaluation."
    ],
    atdNotices: []
  };

  // Mental health crisis - highest priority override (only true crises)
  if (s.has("suicidal ideation") || s.has("homicidal ideation")) {
    return {
      disclaimers: [
        "This may be a mental health emergency. Do not delay seeking professional help.",
        ...base.disclaimers
      ],
      atdNotices: [
        "ATD: This is a mental health crisis requiring immediate medical attention.",
        "Crisis intervention needed - call 988 (National Suicide Prevention Lifeline).",
        "If you are in immediate danger, contact emergency services now."
      ]
    };
  }
  
  if (level === "emergency") {
    return {
      disclaimers: [
        "This may be a medical emergency. Do not delay seeking professional help.",
        ...base.disclaimers
      ],
      atdNotices: [
        "ATD: Call emergency services for immediate medical attention.",
        "If you are alone, consider contacting a neighbor or family member for assistance."
      ]
    };
  }

  if (level === "urgent") {
    const notices = ["ATD: Seek urgent medical evaluation as soon as possible."];
    // Add targeted notes for common high-risk symptoms
    if (s.has("chest pain")) notices.push("Chest pain can indicate serious heart or lung issues.");
    if (s.has("shortness of breath")) notices.push("Shortness of breath can indicate cardiopulmonary compromise.");
    if (s.has("severe headache")) notices.push("Severe headache with other symptoms may indicate neurological concerns.");
    if (s.has("difficulty breathing")) notices.push("Breathing difficulties require immediate medical attention.");
    if (s.has("self harm")) notices.push("Self-harm behavior requires urgent mental health intervention.");
    if (s.has("depression")) notices.push("Severe depression requires urgent mental health evaluation.");  
    if (s.has("hopelessness")) notices.push("Mental health professional consultation recommended.");
    if (s.has("anxiety")) notices.push("Severe anxiety with physical symptoms requires mental health evaluation.");
    
    return {
      disclaimers: [
        "Potentially concerning symptoms reported.",
        ...base.disclaimers
      ],
      atdNotices: notices
    };
  }

  // non_urgent
  const nonUrgent = {
    disclaimers: [
      "Symptoms described appear non-urgent based on limited information.",
      ...base.disclaimers
    ],
    atdNotices: []
  };

  // Check for depression/anxiety symptoms that might need attention
  if (s.has("depression") || s.has("anxiety") || s.has("panic attacks")) {
    nonUrgent.atdNotices.push("Consider speaking with a mental health professional if symptoms persist or worsen.");
  }

  return nonUrgent;
}

/**
 * Deduplicate disclaimer array by removing exact duplicates
 * @param {string[]} disclaimers - Array of disclaimer strings
 * @returns {string[]} Deduplicated array
 */
export function dedupeDisclaimers(disclaimers) {
  return [...new Set(disclaimers.map(d => d.trim()))];
}