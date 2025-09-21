/**
 * @file Expansion Prompts Helper
 * Role-aware and type-aware expansion prompts for detailed responses
 */

/**
 * Build appropriate expansion prompt based on question type and user role
 * @param {object} params - Parameters for expansion
 * @param {string} params.questionType - Type of question (medication, symptom, educational, general)
 * @param {string} params.query - Original user query
 * @param {string} [params.role='public'] - User role (doctor, public, etc.)
 * @returns {object} System and user prompts for expansion
 */
export function buildExpansionPrompt({ questionType, query, role = 'public' }) {
  
  if (questionType === "medication") {
    const isHealthcareProfessional = role === "doctor" || role === "verified_healthcare";
    
    return {
      systemPrompt: [
        "You are a medical assistant providing detailed medication information.",
        isHealthcareProfessional 
          ? "Assume professional healthcare reader. Use clinical terminology and provide comprehensive reference data."
          : "Assume general public reader. Use clear, patient-friendly language.",
        "Provide complete medication reference covering all aspects.",
        "Include appropriate disclaimers for the target audience."
      ].join("\n"),
      
      userPrompt: isHealthcareProfessional
        ? `Provide detailed clinical reference for: ${query}\n\nInclude: dosage ranges with adjustment criteria, pharmacokinetics, contraindications, drug interactions, monitoring parameters, clinical pearls, and prescribing considerations.`
        : `Provide detailed information about: ${query}\n\nInclude: standard dosages, common side effects, important interactions, contraindications, how to take properly, when to contact healthcare provider, and safety precautions.`
    };
  }
  
  if (questionType === "symptom") {
    const isHealthcareProfessional = role === "doctor" || role === "verified_healthcare";
    
    return {
      systemPrompt: [
        "You are a medical assistant providing detailed symptom analysis.",
        isHealthcareProfessional
          ? "Assume healthcare professional reader. Include differential diagnosis and clinical decision-making."
          : "Assume general public reader. Focus on practical guidance and when to seek care.",
        "Provide comprehensive symptom evaluation."
      ].join("\n"),
      
      userPrompt: isHealthcareProfessional
        ? `Detailed analysis of: ${query}\n\nCover: differential diagnosis (common and serious causes), red flag symptoms, diagnostic approach, immediate management, and triage considerations.`
        : `Detailed information about: ${query}\n\nCover: possible causes (common and concerning), warning signs requiring urgent care, self-care measures, when to see a doctor, and what to expect during evaluation.`
    };
  }
  
  // Educational or general topics
  const isHealthcareProfessional = role === "doctor" || role === "verified_healthcare";
  
  return {
    systemPrompt: [
      "You are a medical assistant providing detailed educational information.",
      isHealthcareProfessional
        ? "Assume healthcare professional reader. Include clinical context and evidence-based information."
        : "Assume general public reader. Use accessible language and practical context.",
      "Provide comprehensive educational content."
    ].join("\n"),
    
    userPrompt: isHealthcareProfessional
      ? `Detailed clinical overview of: ${query}\n\nInclude: pathophysiology, clinical presentation, diagnostic criteria, treatment algorithms, prognosis, and current evidence.`
      : `Detailed explanation of: ${query}\n\nInclude: definition, causes, risk factors, symptoms, complications, treatment options, prevention strategies, and when to seek medical care.`
  };
}

/**
 * Generate UI expansion invitation text based on question type and role
 * @param {string} questionType - Type of question
 * @param {string} [role='public'] - User role
 * @returns {string} Invitation text for UI display
 */
export function getExpansionInvitationText(questionType, role = 'public') {
  const isHealthcareProfessional = role === "doctor" || role === "verified_healthcare";
  
  if (questionType === "medication") {
    return isHealthcareProfessional
      ? "Expand with clinical details (algorithms, monitoring, pearls)?"
      : "Would you like more details (side effects, interactions, precautions)?";
  }
  
  if (questionType === "symptom") {
    return isHealthcareProfessional
      ? "Expand with differential diagnosis and clinical approach?"
      : "Would you like more detailed information about this condition and when to seek medical care?";
  }
  
  // Educational or general
  return isHealthcareProfessional
    ? "Expand with clinical context and evidence-based details?"
    : "Would you like more detailed information about this topic?";
}