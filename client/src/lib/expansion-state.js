/**
 * @file Expansion State Management
 * Single source of truth for expansion context in Anamnesis
 * Prevents cross-topic expansion bleed and manages concise->detailed flow
 */

/**
 * @typedef {object} ExpandableContext
 * @property {string} messageId - ID of the message that can be expanded
 * @property {string} questionType - Type of question (medication, symptom, educational, general)
 * @property {string} query - Original user query
 * @property {string} role - User role (doctor, public, etc.)
 * @property {number} createdAt - Timestamp when context was created
 */

// Single source of truth for expansion context
/** @type {ExpandableContext|null} */
let lastExpandable = null;

/** @type {boolean} */
let pendingExpansion = false;

/**
 * Set the last expandable context for potential future expansion
 * @param {object} ctx - Context object
 * @param {string} ctx.messageId - Message ID
 * @param {string} ctx.questionType - Question type
 * @param {string} ctx.query - Original query
 * @param {string} ctx.role - User role
 */
export function setLastExpandable(ctx) {
  console.log('🟢 [EXPANSION-STATE] setLastExpandable called:', ctx);
  lastExpandable = { 
    ...ctx, 
    createdAt: Date.now() 
  };
}

/**
 * Clear the expansion state completely
 */
export function clearLastExpandable() {
  console.log('🔴 [EXPANSION-STATE] clearLastExpandable called');
  lastExpandable = null;
  pendingExpansion = false;
}

/**
 * Mark whether an expansion is pending (after concise response)
 * @param {boolean} [on=true] - Whether expansion is pending
 */
export function markPendingExpansion(on = true) {
  pendingExpansion = !!on;
}

/**
 * Get the current expansion state
 * @returns {object} Current expansion state
 */
export function getExpansionState() {
  return { 
    lastExpandable: lastExpandable ? { ...lastExpandable } : null, 
    pendingExpansion 
  };
}

/**
 * Check if user input is an affirmative expansion request
 * @param {string} text - User input text
 * @returns {boolean} True if this is an expansion request
 */
export function isAffirmativeExpansion(text) {
  if (!text) return false;
  
  const t = text.trim().toLowerCase();
  const expansionTriggers = [
    "yes", "expand", "more", "more details", "details", "tell me more"
  ];
  
  const isExpansion = expansionTriggers.some(trigger => 
    t === trigger || t.startsWith(trigger)
  );
  
  console.log('🔍 [EXPANSION-STATE] isAffirmativeExpansion check:', { text, normalized: t, isExpansion });
  return isExpansion;
}

/**
 * Check if expansion state is valid and not expired
 * @param {number} [maxAgeMs=300000] - Maximum age in milliseconds (default 5 minutes)
 * @returns {boolean} True if expansion state is valid
 */
export function isExpansionStateValid(maxAgeMs = 300000) {
  if (!lastExpandable) return false;
  
  const age = Date.now() - lastExpandable.createdAt;
  return age <= maxAgeMs;
}