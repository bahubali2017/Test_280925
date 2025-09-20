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
 * @returns {string} - Enhanced expansion prompt
 */
export function buildExpansionPrompt(originalQuery, userRole) {
  const expansionLine = (userRole === "doctor")
    ? "Provide a detailed, structured clinical explanation with algorithms, monitoring, contraindications, and references."
    : "Provide a more detailed, patient-friendly explanation with side effects, interactions, precautions, and references.";

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