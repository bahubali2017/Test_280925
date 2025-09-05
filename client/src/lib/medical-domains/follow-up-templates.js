/**
 * @file Follow-up suggestion templates tailored by condition type and triage level
 * Phase 8: Dynamic follow-up questions based on medical domain and urgency
 */

/**
 * Follow-up templates organized by condition type and triage level
 * @type {Record<string, Record<'emergency'|'urgent'|'non_urgent', string[]>>}
 */
export const FOLLOW_UP_TEMPLATES = {
  "cardiovascular": {
    "emergency": [
      "Are you experiencing crushing, squeezing, or tight chest pain?",
      "Is the pain radiating to your arm, neck, jaw, or back?",
      "Do you have shortness of breath, sweating, or nausea with the pain?",
      "When did the chest pain start exactly?"
    ],
    "urgent": [
      "How would you describe the chest pain - sharp, dull, or pressure-like?",
      "Does the pain get worse with activity or improve with rest?",
      "Have you had similar episodes before?",
      "Any family history of heart problems or heart attacks?"
    ],
    "non_urgent": [
      "What activities or situations trigger the symptoms?",
      "How long have you been experiencing these symptoms?",
      "Any changes in your exercise tolerance or daily activities?",
      "Are you taking any heart medications currently?"
    ]
  },
  "respiratory": {
    "emergency": [
      "Are you having severe difficulty breathing right now?",
      "Is your breathing getting worse rapidly?",
      "Are your lips or fingernails blue or gray?",
      "Can you speak in full sentences?"
    ],
    "urgent": [
      "How long have you been short of breath?",
      "Does the breathing difficulty come on with activity or at rest?",
      "Are you coughing up blood or colored sputum?",
      "Any chest pain with breathing?"
    ],
    "non_urgent": [
      "What makes your breathing better or worse?",
      "Do you have seasonal allergies or asthma?",
      "Any recent upper respiratory illness or cold?",
      "How is your breathing during sleep?"
    ]
  },
  "neurological": {
    "emergency": [
      "When exactly did these symptoms start?",
      "Are you experiencing facial drooping or arm weakness?",
      "Any problems with speech or understanding words?",
      "Have you lost consciousness or had a seizure?"
    ],
    "urgent": [
      "How severe is your headache on a scale of 1-10?",
      "Any nausea, vomiting, or sensitivity to light?",
      "Have you had similar headaches before?",
      "Any recent head trauma or injuries?"
    ],
    "non_urgent": [
      "What triggers seem to bring on these symptoms?",
      "How long do the episodes typically last?",
      "Any patterns you've noticed with timing or activities?",
      "Are you taking any medications for this condition?"
    ]
  },
  "gastrointestinal": {
    "emergency": [
      "Are you vomiting blood or having bloody stools?",
      "Is the abdominal pain severe and constant?",
      "Any signs of dehydration like dizziness or dry mouth?",
      "When did you last have a bowel movement?"
    ],
    "urgent": [
      "Where exactly is the pain located in your abdomen?",
      "Does the pain move or radiate anywhere?",
      "Any fever, nausea, or changes in bowel habits?",
      "How long has this been going on?"
    ],
    "non_urgent": [
      "What foods or activities seem to trigger symptoms?",
      "How are your regular bowel habits?",
      "Any recent dietary changes or new medications?",
      "Do antacids or other remedies help?"
    ]
  },
  "mental_health": {
    "emergency": [
      "Are you having thoughts of hurting yourself or others?",
      "Do you have a specific plan or means to harm yourself?",
      "Is there anyone with you right now for support?",
      "Have you been using alcohol or drugs?"
    ],
    "urgent": [
      "How long have you been feeling this way?",
      "What triggered these feelings or thoughts?",
      "Do you have support from family or friends?",
      "Are you currently seeing a mental health professional?"
    ],
    "non_urgent": [
      "What coping strategies have you tried?",
      "How is this affecting your daily activities?",
      "Any recent major life changes or stressors?",
      "Are you interested in counseling or support resources?"
    ]
  },
  "autoimmune": {
    "emergency": [
      "Are you experiencing sudden worsening of multiple symptoms?",
      "Any difficulty breathing or swallowing?",
      "Signs of severe infection like high fever or confusion?",
      "Any new neurological symptoms like weakness or vision changes?"
    ],
    "urgent": [
      "How do your current symptoms compare to your usual baseline?",
      "Any new or worsening joint pain, swelling, or stiffness?",
      "Changes in skin rashes or new skin lesions?",
      "Are your current medications controlling your condition?"
    ],
    "non_urgent": [
      "What helps manage your symptoms day-to-day?",
      "Any recent changes in stress levels or lifestyle?",
      "How often do you see your rheumatologist or specialist?",
      "Are you having any medication side effects?"
    ]
  },
  "pediatric": {
    "emergency": [
      "What is the child's age?",
      "Is the child responsive and alert?",
      "Any difficulty breathing or blue color around lips?",
      "When did you first notice these symptoms?"
    ],
    "urgent": [
      "How is the child's activity level compared to normal?",
      "Is the child eating and drinking normally?",
      "Any fever and what was the highest temperature?",
      "How long have these symptoms been present?"
    ],
    "non_urgent": [
      "Are there any other children in the family with similar symptoms?",
      "Any recent changes in behavior or development?",
      "Is the child up to date with vaccinations?",
      "Any concerns about growth or development milestones?"
    ]
  },
  "geriatric": {
    "emergency": [
      "Has there been a sudden change in mental status or confusion?",
      "Any recent falls or injuries?",
      "Difficulty breathing or chest pain?",
      "Is the person able to care for themselves today?"
    ],
    "urgent": [
      "How do these symptoms compare to baseline functioning?",
      "Any recent medication changes or new prescriptions?",
      "Changes in appetite, weight, or sleep patterns?",
      "Is there adequate support at home?"
    ],
    "non_urgent": [
      "What daily activities are becoming more difficult?",
      "Any concerns about memory or thinking abilities?",
      "How is mobility and risk of falling?",
      "Are there social connections and support systems in place?"
    ]
  }
};

/**
 * Get condition-specific follow-up questions
 * @param {string} conditionType - Type of medical condition
 * @param {'emergency'|'urgent'|'non_urgent'} urgencyLevel - Triage urgency level
 * @param {string[]} detectedSymptoms - Symptoms that were detected
 * @returns {string[]} Array of relevant follow-up questions
 */
export function getConditionFollowUp(conditionType, urgencyLevel, detectedSymptoms = []) {
  const templates = FOLLOW_UP_TEMPLATES[conditionType.toLowerCase()];
  if (!templates) {
    return getGenericFollowUp(urgencyLevel, detectedSymptoms);
  }
  
  const urgencyQuestions = templates[urgencyLevel] || templates["non_urgent"];
  
  // Add symptom-specific questions
  const symptomSpecificQuestions = getSymptomSpecificQuestions(detectedSymptoms, urgencyLevel);
  
  return [...urgencyQuestions, ...symptomSpecificQuestions];
}

/**
 * Get symptom-specific follow-up questions
 * @param {string[]} symptoms - Detected symptoms
 * @param {'emergency'|'urgent'|'non_urgent'} urgencyLevel - Triage urgency level
 * @returns {string[]} Array of symptom-specific questions
 */
function getSymptomSpecificQuestions(symptoms, urgencyLevel) {
  const questions = [];
  
  if (symptoms.includes("pain")) {
    if (urgencyLevel === "emergency") {
      questions.push("On a scale of 1-10, how severe is your pain?");
      questions.push("Is the pain constant or does it come and go?");
    } else {
      questions.push("What makes the pain better or worse?");
      questions.push("How long have you had this pain?");
    }
  }
  
  if (symptoms.includes("fever")) {
    questions.push("What was the highest temperature you recorded?");
    questions.push("How long have you had the fever?");
    if (urgencyLevel !== "emergency") {
      questions.push("What symptoms are you having along with the fever?");
    }
  }
  
  if (symptoms.includes("nausea") || symptoms.includes("vomiting")) {
    questions.push("Are you able to keep fluids down?");
    if (urgencyLevel === "emergency") {
      questions.push("Are you vomiting blood or coffee-ground material?");
    }
  }
  
  if (symptoms.includes("headache")) {
    if (urgencyLevel === "emergency") {
      questions.push("Is this the worst headache of your life?");
    }
    questions.push("Where exactly is the headache located?");
    questions.push("What type of pain - throbbing, sharp, or pressure-like?");
  }
  
  return questions;
}

/**
 * Get generic follow-up questions when specific condition type is unknown
 * @param {'emergency'|'urgent'|'non_urgent'} urgencyLevel - Triage urgency level
 * @param {string[]} detectedSymptoms - Symptoms that were detected
 * @returns {string[]} Array of generic follow-up questions
 */
function getGenericFollowUp(urgencyLevel, detectedSymptoms = []) {
  const genericQuestions = {
    "emergency": [
      "When did these symptoms start?",
      "Are the symptoms getting worse rapidly?",
      "Are you having any difficulty breathing?",
      "Do you need emergency medical attention right now?"
    ],
    "urgent": [
      "How long have you been experiencing these symptoms?",
      "Have you had similar symptoms before?",
      "What makes the symptoms better or worse?",
      "Are you taking any medications for this?"
    ],
    "non_urgent": [
      "Can you describe your symptoms in more detail?",
      "What prompted you to seek medical advice today?",
      "Have you tried any home remedies or treatments?",
      "Any other symptoms you haven't mentioned?"
    ]
  };
  
  const baseQuestions = genericQuestions[urgencyLevel] || genericQuestions["non_urgent"];
  const symptomQuestions = getSymptomSpecificQuestions(detectedSymptoms, urgencyLevel);
  
  return [...baseQuestions, ...symptomQuestions];
}

/**
 * Get age-appropriate follow-up questions
 * @param {number|null} patientAge - Patient's age in years
 * @param {'emergency'|'urgent'|'non_urgent'} urgencyLevel - Triage urgency level
 * @param {string[]} symptoms - Detected symptoms
 * @returns {string[]} Array of age-appropriate follow-up questions
 */
export function getAgeAppropriateFollowUp(patientAge, urgencyLevel, symptoms = []) {
  if (patientAge !== null && patientAge < 18) {
    return getConditionFollowUp("pediatric", urgencyLevel, symptoms);
  }
  
  if (patientAge !== null && patientAge >= 65) {
    return getConditionFollowUp("geriatric", urgencyLevel, symptoms);
  }
  
  return getGenericFollowUp(urgencyLevel, symptoms);
}

/**
 * Combine multiple follow-up question sets and prioritize by relevance
 * @param {string[][]} questionSets - Multiple arrays of follow-up questions
 * @param {number} maxQuestions - Maximum number of questions to return
 * @returns {string[]} Prioritized and deduplicated questions
 */
export function prioritizeFollowUpQuestions(questionSets, maxQuestions = 5) {
  const allQuestions = questionSets.flat();
  const uniqueQuestions = [...new Set(allQuestions)];
  
  // Prioritize emergency questions first, then urgent, then general
  const priorityOrder = [
    "Are you having thoughts of hurting yourself",
    "difficulty breathing",
    "chest pain", 
    "When did",
    "How severe",
    "Any fever",
    "What makes",
    "How long"
  ];
  
  const prioritized = [];
  const remaining = [...uniqueQuestions];
  
  // Add high-priority questions first
  for (const priority of priorityOrder) {
    const matchingQuestions = remaining.filter(q => 
      q.toLowerCase().includes(priority.toLowerCase())
    );
    prioritized.push(...matchingQuestions);
    
    // Remove added questions from remaining
    matchingQuestions.forEach(q => {
      const index = remaining.indexOf(q);
      if (index > -1) remaining.splice(index, 1);
    });
    
    if (prioritized.length >= maxQuestions) break;
  }
  
  // Add remaining questions up to the limit
  while (prioritized.length < maxQuestions && remaining.length > 0) {
    prioritized.push(remaining.shift());
  }
  
  return prioritized.slice(0, maxQuestions);
}