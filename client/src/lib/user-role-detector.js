/**
 * User Role Detector - Identifies healthcare professionals vs general users
 * Based on query patterns, terminology, and user indicators
 */

/**
 * Medical professional terminology patterns
 */
const PROFESSIONAL_INDICATORS = {
  // Clinical terminology
  clinical_terms: [
    'protocol', 'algorithm', 'differential diagnosis', 'pathophysiology', 
    'contraindication', 'pharmacokinetics', 'therapeutic index', 'bioavailability',
    'etiology', 'prognosis', 'mortality rate', 'morbidity', 'comorbidity',
    'adverse drug reaction', 'drug interaction', 'therapeutic window',
    'evidence-based', 'clinical guideline', 'treatment protocol', 'clinical pathway'
  ],
  
  // Medication details
  medication_specific: [
    'dosing regimen', 'titration', 'maintenance dose', 'loading dose',
    'contraindications', 'black box warning', 'therapeutic monitoring',
    'drug levels', 'pharmacodynamics', 'half-life', 'clearance',
    'bioequivalence', 'generic substitution'
  ],
  
  // Diagnostic terminology
  diagnostic_terms: [
    'differential', 'workup', 'diagnostic criteria', 'clinical presentation',
    'physical examination', 'assessment and plan', 'clinical impression',
    'rule out', 'working diagnosis', 'provisional diagnosis'
  ],
  
  // Professional contexts
  professional_contexts: [
    'in my practice', 'my patients', 'clinical experience', 'patient care',
    'medical decision', 'clinical judgment', 'standard of care',
    'quality measures', 'clinical outcomes', 'patient safety'
  ],
  
  // Advanced medical concepts
  advanced_concepts: [
    'mechanism of action', 'receptor binding', 'metabolic pathway',
    'inflammatory cascade', 'immune response', 'cellular mechanism',
    'molecular target', 'genetic polymorphism', 'phenotype expression'
  ]
};

/**
 * General public terminology patterns
 */
const GENERAL_PUBLIC_INDICATORS = {
  // Basic symptom descriptions
  basic_symptoms: [
    'i feel', 'i have', 'my body', 'what should i do', 'is it normal',
    'should i worry', 'home remedy', 'natural treatment', 'over the counter'
  ],
  
  // Personal concerns
  personal_concerns: [
    'my health', 'my symptoms', 'worried about', 'concerned about',
    'family history', 'prevention', 'lifestyle', 'diet and exercise'
  ],
  
  // Simple medical questions
  simple_questions: [
    'what is', 'what causes', 'how do you get', 'is it contagious',
    'how long does', 'when to see doctor', 'emergency room'
  ]
};

/**
 * Analyze query to determine if user is likely a healthcare professional
 * @param {string} query - The user's medical query
 * @returns {Object} Analysis results
 */
export function detectUserRole(query) {
  const queryLower = query.toLowerCase();
  
  let professionalScore = 0;
  let generalScore = 0;
  
  // Count professional indicators
  Object.values(PROFESSIONAL_INDICATORS).forEach(termArray => {
    termArray.forEach(term => {
      if (queryLower.includes(term.toLowerCase())) {
        professionalScore += 2;
      }
    });
  });
  
  // Count general public indicators
  Object.values(GENERAL_PUBLIC_INDICATORS).forEach(termArray => {
    termArray.forEach(term => {
      if (queryLower.includes(term.toLowerCase())) {
        generalScore += 1;
      }
    });
  });
  
  // Additional scoring factors
  
  // Professional language patterns
  if (queryLower.includes('treatment protocol') || queryLower.includes('clinical protocol')) {
    professionalScore += 5;
  }
  
  if (queryLower.includes('evidence-based') || queryLower.includes('guideline')) {
    professionalScore += 3;
  }
  
  // Drug names with specific dosing questions indicate professional context
  if (queryLower.match(/\d+\s*(mg|mcg|ml|units)/)) {
    professionalScore += 2;
  }
  
  // Personal pronouns suggest general public
  if (queryLower.match(/\b(i|my|me)\b/g)) {
    generalScore += 1;
  }
  
  // Determine role
  const isProfessional = professionalScore >= 3 && professionalScore > generalScore;
  const confidence = Math.min(100, Math.max(professionalScore, generalScore) * 10);
  
  return {
    role: isProfessional ? 'healthcare_professional' : 'general_public',
    confidence: confidence,
    professionalScore: professionalScore,
    generalScore: generalScore,
    indicators: {
      professional: professionalScore > 0,
      general: generalScore > 0
    }
  };
}

/**
 * Get response instructions based on detected user role
 * @param {string} role - Detected user role
 * @returns {string} Response instructions for the AI
 */
export function getResponseInstructions(role) {
  if (role === 'healthcare_professional') {
    return `
You are responding to a healthcare professional. Provide detailed clinical information:

PROFESSIONAL RESPONSE FORMAT:
- Clinical Overview: Pathophysiology and mechanism
- Diagnostic Criteria: Evidence-based guidelines and diagnostic tools
- Treatment Protocols: Detailed step-by-step clinical algorithms
- Pharmacotherapy: Specific medications, dosing, contraindications
- Monitoring: Clinical parameters and follow-up requirements
- Complications: Potential adverse outcomes and management
- Evidence Base: Recent guidelines and research references

Use medical terminology appropriate for healthcare professionals.
Include specific protocols, dosing guidelines, and clinical decision-making criteria.
Reference current medical guidelines (AHA, ESC, ACC, etc.) when applicable.
    `;
  } else {
    return `
You are responding to a general public user. Provide educational information:

GENERAL PUBLIC FORMAT:
- Simple Explanation: What the condition means in everyday terms
- Common Symptoms: What people typically experience
- When to Seek Care: Clear guidance on when to see a doctor
- General Management: Lifestyle and general care recommendations
- Prevention: How to reduce risk factors

Use plain language that non-medical people can understand.
Focus on when to seek professional medical care rather than specific treatments.
Emphasize the importance of consulting with healthcare providers.
    `;
  }
}

/**
 * Enhance query analysis with role-specific context
 * @param {string} query - Original query
 * @param {Object} roleAnalysis - Role detection results
 * @returns {Object} Enhanced query context
 */
export function enhanceQueryContext(query, roleAnalysis) {
  const context = {
    originalQuery: query,
    detectedRole: roleAnalysis.role,
    confidence: roleAnalysis.confidence,
    responseInstructions: getResponseInstructions(roleAnalysis.role)
  };
  
  // Add role-specific query enhancements
  if (roleAnalysis.role === 'healthcare_professional') {
    context.enhanced_query = `${query}\n\n[CLINICAL CONTEXT: Provide detailed clinical protocols and evidence-based guidelines suitable for healthcare professionals]`;
  } else {
    context.enhanced_query = `${query}\n\n[PATIENT EDUCATION: Provide educational information in simple terms suitable for general public]`;
  }
  
  return context;
}