/**
 * Feedback Handler for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: User feedback is anonymized before storage to protect
 * personal health information while enabling system improvement analysis.
 * 
 * @file Captures and logs user feedback for continuous improvement
 */

import { anonymizeText } from '../analytics/anonymizer.js';

/**
 * User feedback structure
 * @typedef {{
 *   query: string;
 *   perceivedAccuracy: "low" | "medium" | "high";
 *   feedbackText: string;
 *   userType: "doctor" | "patient" | "unknown";
 *   timestamp: string;
 *   sessionId?: string;
 *   responseQuality?: "poor" | "fair" | "good" | "excellent";
 *   suggestions?: string[];
 * }} UserFeedback
 */

/**
 * Query context for feedback reference
 * @typedef {{
 *   userInput: string;
 *   triageLevel: string;
 *   llmResponse: string;
 * }} QueryContext
 */

/**
 * Enriched feedback entry for storage
 * @typedef {{
 *   query: string;
 *   perceivedAccuracy: "low" | "medium" | "high";
 *   feedbackText: string;
 *   userType: "doctor" | "patient" | "unknown";
 *   responseQuality: "poor" | "fair" | "good" | "excellent" | null;
 *   suggestions: string[];
 *   timestamp: string;
 *   sessionId: string;
 *   feedbackId: string;
 *   context: {
 *     originalQuery: string;
 *     systemTriage: string;
 *     systemResponse: string | null;
 *   } | null;
 *   analysis: {
 *     category: string;
 *     severity: string;
 *     actionRequired: boolean;
 *   };
 * }} FeedbackEntry
 */

/**
 * Feedback handler configuration
 * @typedef {{
 *   apiEndpoint?: string;
 *   retries?: number;
 *   timeout?: number;
 * }} FeedbackHandlerConfig
 */

/**
 * Feedback operation result
 * @typedef {{
 *   success: boolean;
 *   error?: string;
 *   feedbackId?: string;
 * }} FeedbackResult
 */

/**
 * Feedback analytics trends structure
 * @typedef {{
 *   accuracy: Record<string, number>;
 *   userTypes: Record<string, number>;
 *   categories: Record<string, number>;
 *   severities: Record<string, number>;
 * }} FeedbackTrends
 */

/**
 * Feedback analytics summary
 * @typedef {{
 *   totalFeedback: number;
 *   trends: FeedbackTrends;
 *   averageAccuracy: number;
 *   categories: Record<string, number>;
 *   severities: Record<string, number>;
 *   actionRequired: number;
 *   timeRange: {
 *     earliest?: string;
 *     latest?: string;
 *   };
 * }} FeedbackAnalytics
 */

/**
 * Feedback validation result
 * @typedef {{
 *   isValid: boolean;
 *   errors: string[];
 * }} FeedbackValidation
 */

/**
 * Feedback categories for analysis
 * @readonly
 */
export const FeedbackCategory = {
  ACCURACY: 'accuracy',
  COMPLETENESS: 'completeness', 
  CLARITY: 'clarity',
  SAFETY: 'safety',
  RELEVANCE: 'relevance'
};

/**
 * Feedback severity levels
 * @readonly
 */
export const FeedbackSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Path to feedback dataset file
 * @private
 */
const FEEDBACK_PATH = 'client/src/training-dataset/feedback.jsonl';

/**
 * Captures and processes user feedback
 * @param {UserFeedback} feedback - User feedback object
 * @param {QueryContext} [queryContext] - Original query context for reference
 * @returns {Promise<FeedbackResult>} Result of feedback capture operation
 */
export async function captureFeedback(feedback, queryContext) {
  try {
    // Validate required fields
    if (!feedback || typeof feedback !== 'object') {
      console.warn('[feedback-handler] Invalid feedback object provided');
      return { success: false, error: 'Invalid feedback object provided' };
    }
    
    if (!feedback.query || !feedback.perceivedAccuracy) {
      console.warn('[feedback-handler] Missing required feedback fields');
      return { success: false, error: 'Missing required feedback fields' };
    }
    
    // Validate feedback structure
    const validation = validateFeedback(feedback);
    if (!validation.isValid) {
      console.warn('[feedback-handler] Feedback validation failed:', validation.errors);
      return { success: false, error: `Validation failed: ${validation.errors.join(', ')}` };
    }
    
    // Create enriched feedback entry
    const feedbackEntry = /** @type {FeedbackEntry} */ ({
      // Core feedback data (anonymized)
      query: anonymizeText(feedback.query),
      perceivedAccuracy: feedback.perceivedAccuracy,
      feedbackText: feedback.feedbackText ? anonymizeText(feedback.feedbackText) : '',
      userType: feedback.userType || 'unknown',
      responseQuality: feedback.responseQuality || null,
      suggestions: feedback.suggestions || [],
      
      // System metadata
      timestamp: feedback.timestamp || new Date().toISOString(),
      sessionId: feedback.sessionId || generateSessionId(),
      feedbackId: generateFeedbackId(),
      
      // Query context (anonymized if provided)
      context: queryContext ? {
        originalQuery: anonymizeText(queryContext.userInput),
        systemTriage: queryContext.triageLevel,
        systemResponse: queryContext.llmResponse ? anonymizeText(queryContext.llmResponse) : null
      } : null,
      
      // Analysis metadata
      analysis: {
        category: categorizeFeedback(feedback),
        severity: assessFeedbackSeverity(feedback),
        actionRequired: requiresAction(feedback)
      }
    });
    
    // Log to feedback dataset
    await appendToFeedbackDataset(feedbackEntry);
    
    console.info('[feedback-handler] Feedback captured successfully:', feedbackEntry.feedbackId);
    return { success: true, feedbackId: feedbackEntry.feedbackId };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[feedback-handler] Failed to capture feedback:', errorMessage);
    return { success: false, error: `Failed to capture feedback: ${errorMessage}` };
  }
}

/**
 * Categorizes feedback based on content analysis
 * @private
 * @param {UserFeedback} feedback - Feedback to categorize
 * @returns {string} Primary feedback category
 */
function categorizeFeedback(feedback) {
  const text = (feedback.feedbackText || '').toLowerCase();
  
  // Keyword-based categorization
  if (text.includes('wrong') || text.includes('inaccurate') || text.includes('incorrect')) {
    return FeedbackCategory.ACCURACY;
  }
  
  if (text.includes('incomplete') || text.includes('missing') || text.includes('more info')) {
    return FeedbackCategory.COMPLETENESS;
  }
  
  if (text.includes('confusing') || text.includes('unclear') || text.includes('hard to understand')) {
    return FeedbackCategory.CLARITY;
  }
  
  if (text.includes('dangerous') || text.includes('unsafe') || text.includes('emergency')) {
    return FeedbackCategory.SAFETY;
  }
  
  if (text.includes('irrelevant') || text.includes('not helpful') || text.includes('off-topic')) {
    return FeedbackCategory.RELEVANCE;
  }
  
  // Default based on accuracy rating
  return feedback.perceivedAccuracy === 'low' ? FeedbackCategory.ACCURACY : FeedbackCategory.RELEVANCE;
}

/**
 * Assesses feedback severity for prioritization
 * @private
 * @param {UserFeedback} feedback - Feedback to assess
 * @returns {string} Severity level
 */
function assessFeedbackSeverity(feedback) {
  const text = (feedback.feedbackText || '').toLowerCase();
  
  // Critical safety issues
  if (text.includes('dangerous') || text.includes('could harm') || text.includes('emergency')) {
    return FeedbackSeverity.CRITICAL;
  }
  
  // High priority issues
  if (feedback.perceivedAccuracy === 'low' || text.includes('completely wrong')) {
    return FeedbackSeverity.HIGH;
  }
  
  // Medium priority issues
  if (feedback.perceivedAccuracy === 'medium' || text.includes('somewhat')) {
    return FeedbackSeverity.MEDIUM;
  }
  
  // Low priority feedback
  return FeedbackSeverity.LOW;
}

/**
 * Determines if feedback requires immediate action
 * @private
 * @param {UserFeedback} feedback - Feedback to evaluate
 * @returns {boolean} Whether action is required
 */
function requiresAction(feedback) {
  const severity = assessFeedbackSeverity(feedback);
  const category = categorizeFeedback(feedback);
  
  return severity === FeedbackSeverity.CRITICAL || 
         (severity === FeedbackSeverity.HIGH && category === FeedbackCategory.SAFETY);
}

/**
 * Appends feedback entry to JSONL dataset
 * @private
 * @param {FeedbackEntry} feedbackEntry - Processed feedback entry
 * @returns {Promise<void>}
 */
async function appendToFeedbackDataset(feedbackEntry) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Ensure directory exists
    const dir = path.dirname(FEEDBACK_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Convert to JSONL format
    const jsonlLine = JSON.stringify(feedbackEntry) + '\n';
    
    // Append to file
    fs.appendFileSync(FEEDBACK_PATH, jsonlLine, 'utf8');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[feedback-handler] Failed to write feedback to dataset:', errorMessage);
    throw new Error(`Failed to write feedback to dataset: ${errorMessage}`);
  }
}

/**
 * Loads and analyzes recent feedback data
 * @param {number} [limit=100] - Maximum number of feedback entries to load
 * @returns {Promise<FeedbackEntry[]>} Recent feedback entries
 */
export async function loadRecentFeedback(limit = 100) {
  try {
    const fs = await import('fs');
    
    if (!fs.existsSync(FEEDBACK_PATH)) {
      return [];
    }
    
    const content = fs.readFileSync(FEEDBACK_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Get most recent entries
    const recentLines = lines.slice(-limit);
    
    /** @type {FeedbackEntry[]} */
    const feedbackEntries = [];
    
    for (const line of recentLines) {
      try {
        const parsed = JSON.parse(line);
        feedbackEntries.push(/** @type {FeedbackEntry} */ (parsed));
      } catch {
        console.warn('[feedback-handler] Failed to parse feedback line:', line);
      }
    }
    
    return feedbackEntries;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[feedback-handler] Failed to load feedback data:', errorMessage);
    return [];
  }
}

/**
 * Generates feedback analytics summary
 * @param {FeedbackEntry[]} feedbackData - Feedback data to analyze
 * @returns {FeedbackAnalytics} Analytics summary
 */
export function analyzeFeedbackTrends(feedbackData) {
  if (!feedbackData || feedbackData.length === 0) {
    return {
      totalFeedback: 0,
      trends: {
        accuracy: {},
        userTypes: {},
        categories: {},
        severities: {}
      },
      averageAccuracy: 0,
      categories: {},
      severities: {},
      actionRequired: 0,
      timeRange: {}
    };
  }
  
  /** @type {FeedbackTrends} */
  const trends = {
    accuracy: { low: 0, medium: 0, high: 0 },
    userTypes: { doctor: 0, patient: 0, unknown: 0 },
    categories: {},
    severities: {}
  };
  
  let totalAccuracy = 0;
  let actionRequiredCount = 0;
  
  feedbackData.forEach(feedback => {
    // Accuracy trends - safely access perceivedAccuracy
    const accuracy = feedback.perceivedAccuracy;
    if (accuracy && (accuracy === 'low' || accuracy === 'medium' || accuracy === 'high')) {
      trends.accuracy[accuracy] = (trends.accuracy[accuracy] || 0) + 1;
      totalAccuracy += accuracy === 'high' ? 3 : accuracy === 'medium' ? 2 : 1;
    }
    
    // User type trends - safely access userType
    const userType = feedback.userType;
    if (userType && (userType === 'doctor' || userType === 'patient' || userType === 'unknown')) {
      trends.userTypes[userType] = (trends.userTypes[userType] || 0) + 1;
    }
    
    // Category analysis - safely access nested properties
    const category = feedback.analysis && typeof feedback.analysis === 'object' && 'category' in feedback.analysis
      ? String(feedback.analysis.category)
      : 'unknown';
    trends.categories[category] = (trends.categories[category] || 0) + 1;
    
    // Severity analysis - safely access nested properties
    const severity = feedback.analysis && typeof feedback.analysis === 'object' && 'severity' in feedback.analysis
      ? String(feedback.analysis.severity)
      : 'unknown';
    trends.severities[severity] = (trends.severities[severity] || 0) + 1;
    
    // Action required count - safely access nested properties
    const actionRequired = feedback.analysis && typeof feedback.analysis === 'object' && 'actionRequired' in feedback.analysis
      ? Boolean(feedback.analysis.actionRequired)
      : false;
    if (actionRequired) {
      actionRequiredCount++;
    }
  });
  
  return {
    totalFeedback: feedbackData.length,
    trends,
    averageAccuracy: feedbackData.length > 0 ? totalAccuracy / feedbackData.length : 0,
    categories: trends.categories,
    severities: trends.severities,
    actionRequired: actionRequiredCount,
    timeRange: {
      earliest: feedbackData.length > 0 ? feedbackData[0]?.timestamp : undefined,
      latest: feedbackData.length > 0 ? feedbackData[feedbackData.length - 1]?.timestamp : undefined
    }
  };
}

/**
 * Generates a unique session ID
 * @private
 * @returns {string} Session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique feedback ID
 * @private
 * @returns {string} Feedback ID
 */
function generateFeedbackId() {
  return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validates feedback object structure
 * @param {UserFeedback} feedback - Feedback object to validate
 * @returns {FeedbackValidation} Validation result
 */
export function validateFeedback(feedback) {
  /** @type {string[]} */
  const errors = [];
  
  if (!feedback) {
    errors.push('Feedback object is required');
    return { isValid: false, errors };
  }
  
  if (!feedback.query || typeof feedback.query !== 'string') {
    errors.push('Query field is required and must be a string');
  }
  
  if (!feedback.perceivedAccuracy || !['low', 'medium', 'high'].includes(feedback.perceivedAccuracy)) {
    errors.push('perceivedAccuracy must be "low", "medium", or "high"');
  }
  
  if (feedback.userType && !['doctor', 'patient', 'unknown'].includes(feedback.userType)) {
    errors.push('userType must be "doctor", "patient", or "unknown"');
  }
  
  if (feedback.responseQuality && !['poor', 'fair', 'good', 'excellent'].includes(feedback.responseQuality)) {
    errors.push('responseQuality must be "poor", "fair", "good", or "excellent"');
  }
  
  if (feedback.suggestions && !Array.isArray(feedback.suggestions)) {
    errors.push('suggestions must be an array of strings');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}