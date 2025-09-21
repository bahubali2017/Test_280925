/**
 * @file Expansion Handler
 * Manages automatic expansion flow from concise to detailed responses
 * Detects expansion requests and builds appropriate prompts
 */

import { AI_FLAGS, EXPANSION_SETTINGS } from "@/config/ai-flags";

/**
 * Detects if user input is requesting expansion of previous response
 * @param {string} userInput - User's message input
 * @returns {boolean} - True if expansion is requested
 */
export function detectExpansionRequest(userInput) {
  if (!AI_FLAGS.ENABLE_EXPANSION_PROMPT) return false;
  
  const lowered = userInput.toLowerCase().trim();
  return EXPANSION_SETTINGS.EXPANSION_KEYWORDS.some(keyword => 
    lowered.includes(keyword)
  );
}

/**
 * Builds expansion prompt for detailed follow-up response
 * @param {string} originalQuery - The original medical query
 * @param {string} userRole - User role (doctor/public)
 * @param {string} [questionType="general"] - Question type for context-aware expansion
 * @returns {string} - Enhanced expansion prompt
 */
export function buildExpansionPrompt(originalQuery, userRole, questionType = "general") {
  let expansionLine;
  
  if (userRole === "doctor") {
    expansionLine = "Provide a detailed, structured clinical explanation with algorithms, monitoring, contraindications, and references.";
  } else {
    // Context-aware expansion for public users
    switch (questionType) {
      case "medication":
        expansionLine = "Provide a detailed medication reference: dosage ranges, side effects, interactions, contraindications, monitoring.";
        break;
      case "symptom":
        expansionLine = "Provide a detailed explanation of possible causes, red flags, and when to seek care.";
        break;
      case "educational":
        expansionLine = "Provide a detailed educational explanation: definitions, causes, risk factors, complications, and management overview.";
        break;
      case "general":
      default:
        expansionLine = "Provide a more detailed explanation suitable for general understanding.";
        break;
    }
  }

  return `
[Expansion Mode Active]
Original Query: "${originalQuery}"
${expansionLine}
Always include: ⚠️ Informational purposes only. Not a substitute for professional medical advice.
  `.trim();
}

/**
 * Checks if a response contains expansion prompts/questions
 * @param {string} responseText - AI response text
 * @returns {boolean} - True if contains expansion indicators
 */
export function containsExpansionPrompt(responseText) {
  const expansionIndicators = [
    "would you like me to provide",
    "want more details",
    "would you like to expand",
    "need more information",
    "suggested follow-up questions"
  ];
  
  const lowered = responseText.toLowerCase();
  return expansionIndicators.some(indicator => lowered.includes(indicator));
}

/**
 * Extracts original query from expansion context if available
 * @param {object} conversationHistory - Previous messages
 * @returns {string|null} - Original query or null
 */
export function extractOriginalQuery(conversationHistory) {
  if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
    return null;
  }
  
  // Look for the last user message that wasn't an expansion request
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const message = conversationHistory[i];
    if (message.role === 'user' && !detectExpansionRequest(message.content)) {
      return message.content;
    }
  }
  
  return null;
}