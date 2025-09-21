/**
 * @file Expansion Handler
 * Manages automatic expansion flow from concise to detailed responses
 * Detects expansion requests and builds appropriate prompts
 * Tracks conversation state for proper expansion context
 */

import { AI_FLAGS, EXPANSION_SETTINGS } from "@/config/ai-flags";
import { classifyQuestionType } from "@/lib/prompt-enhancer";

/**
 * Conversation state tracker for expansion context
 * @type {{lastExpandableQuery: {type: string, query: string, responseId: string, timestamp: number} | null}}
 */
const conversationState = {
  lastExpandableQuery: null
};

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
 * Updates the conversation state with the last expandable query
 * @param {string} query - The user query
 * @param {string} questionType - The classified question type
 * @param {string} responseId - Unique response identifier
 */
export function updateLastExpandableQuery(query, questionType, responseId) {
  conversationState.lastExpandableQuery = {
    type: questionType,
    query: query.trim(),
    responseId,
    timestamp: Date.now()
  };
}

/**
 * Gets the last expandable query from conversation state
 * @returns {{type: string, query: string, responseId: string, timestamp: number} | null}
 */
export function getLastExpandableQuery() {
  return conversationState.lastExpandableQuery;
}

/**
 * Checks if the last expandable query is recent (within 1 conversation step)
 * @param {number} maxAge - Maximum age in milliseconds (default: 5 minutes)
 * @returns {boolean}
 */
export function isLastExpandableQueryRecent(maxAge = 5 * 60 * 1000) {
  const lastQuery = conversationState.lastExpandableQuery;
  if (!lastQuery) return false;
  
  const age = Date.now() - lastQuery.timestamp;
  return age <= maxAge;
}

/**
 * Builds specific expansion prompt for symptom queries
 * @returns {string} - Symptom-specific expansion instructions
 */
export function buildSymptomExpansionPrompt() {
  return `Provide detailed medical expansion for the reported symptom:
• Potential causes (common and serious)
• Red flag signs requiring immediate medical attention
• When to seek immediate medical care vs. urgent care vs. routine care
• General lifestyle and monitoring advice
• Diagnostic pathways and typical evaluations
Add appropriate medical disclaimer at the end.`;
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
        expansionLine = "Provide a detailed medication reference: dosage ranges, side effects, interactions, contraindications, monitoring parameters, and patient counseling points.";
        break;
      case "symptom":
        expansionLine = buildSymptomExpansionPrompt();
        break;
      case "educational":
        expansionLine = "Provide a detailed educational explanation: definitions, causes, risk factors, complications, diagnostic approaches, and management overview.";
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
 * Extracts original query with improved context awareness
 * @param {object} conversationHistory - Previous messages
 * @param {string} currentUserInput - Current user input message
 * @returns {{query: string, type: string} | null} - Original query with type or null
 */
export function extractOriginalQuery(conversationHistory, currentUserInput = '') {
  // First priority: Check if we have a recent expandable query in state
  if (isLastExpandableQueryRecent()) {
    const lastQuery = getLastExpandableQuery();
    return {
      query: lastQuery.query,
      type: lastQuery.type
    };
  }
  
  // Second priority: Check if current input is expansion but no recent state
  if (detectExpansionRequest(currentUserInput) && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    // Look for the most recent user message that wasn't an expansion request
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const message = conversationHistory[i];
      if (message.role === 'user' && !detectExpansionRequest(message.content)) {
        const queryType = classifyQuestionType(message.content);
        return {
          query: message.content,
          type: queryType
        };
      }
    }
  }
  
  // Fallback: No expansion context found
  return null;
}

/**
 * Handles expansion request with proper context resolution
 * @param {string} userInput - Current user input
 * @param {object} conversationHistory - Previous messages
 * @param {string} userRole - User role for response formatting
 * @returns {{isExpansion: boolean, prompt: string | null, context: object | null}}
 */
export function handleExpansionRequest(userInput, conversationHistory, userRole = 'public') {
  const isExpansion = detectExpansionRequest(userInput);
  
  if (!isExpansion) {
    return {
      isExpansion: false,
      prompt: null,
      context: null
    };
  }
  
  const originalContext = extractOriginalQuery(conversationHistory, userInput);
  
  if (!originalContext) {
    // No valid expansion context found - treat as regular query
    return {
      isExpansion: false,
      prompt: null,
      context: null
    };
  }
  
  const expansionPrompt = buildExpansionPrompt(
    originalContext.query,
    userRole,
    originalContext.type
  );
  
  return {
    isExpansion: true,
    prompt: expansionPrompt,
    context: originalContext
  };
}

/**
 * Validates expansion context to prevent misalignment
 * @param {object} conversationHistory - Previous messages
 * @param {number} maxStepsBack - Maximum steps to look back (default: 2)
 * @returns {boolean} - True if expansion context is valid
 */
export function validateExpansionContext(conversationHistory, maxStepsBack = 2) {
  if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
    return false;
  }
  
  // Check if we have a recent expandable query in state
  if (isLastExpandableQueryRecent()) {
    return true;
  }
  
  // Check if there's a non-expansion user message within maxStepsBack
  let userMessageCount = 0;
  for (let i = conversationHistory.length - 1; i >= 0 && userMessageCount < maxStepsBack; i--) {
    const message = conversationHistory[i];
    if (message.role === 'user') {
      userMessageCount++;
      if (!detectExpansionRequest(message.content)) {
        return true;
      }
    }
  }
  
  return false;
}