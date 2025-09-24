/**
 * @file LLM preference logic with auto-selection capabilities
 * Phase 8: Intelligent model routing and fallback management
 */

/* global setTimeout */

import { selectOptimalModel, determineFallbackStrategy, recordModelPerformance } from "./llm-adapter.js";

/**
 * @typedef {object} ModelPerformanceMetrics
 * @property {number} avgResponseTime - Average response time in milliseconds
 * @property {number} accuracyScore - Accuracy score from 1-10
 * @property {number} successRate - Success rate from 0-1
 * @property {Date} lastUsed - Last time model was used
 */

/**
 * @typedef {object} CircuitBreakerState
 * @property {"closed"|"open"|"half_open"} state - Current circuit breaker state
 * @property {number} failureCount - Number of consecutive failures
 * @property {Date|null} lastFailure - Last failure timestamp
 * @property {Date} nextAttempt - Next retry attempt time
 */

/**
 * @typedef {object} ModelScore
 * @property {string} modelId - Model identifier
 * @property {number} score - Calculated selection score
 */

/**
 * @typedef {object} ModelSelectionResult
 * @property {string} modelId - Selected model identifier
 * @property {number} confidence - Selection confidence 0-1
 * @property {string} reasoning - Selection reasoning explanation
 * @property {string[]} fallbacks - Fallback model identifiers
 */

/**
 * @typedef {object} QueryExecutionResult
 * @property {string} response - Model response text
 * @property {string} modelUsed - Model that was actually used
 * @property {number} responseTime - Total response time in milliseconds
 * @property {boolean} successful - Whether execution succeeded
 * @property {string[]} fallbacksUsed - Models that failed and were tried
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {object} UserPreferences
 * @property {string[]} [preferredModels] - Preferred model identifiers
 * @property {string[]} [avoidModels] - Models to avoid
 */

/**
 * @typedef {object} QueryOptions
 * @property {string[]} [availableModels] - Available model identifiers
 * @property {UserPreferences} [preferences] - User preferences
 */

/**
 * @typedef {object} FallbackStrategy
 * @property {boolean} shouldRetry - Whether to retry with fallback
 * @property {"immediate"|"exponential_backoff"} [retryStrategy] - Retry strategy type
 */

/**
 * @typedef {object} ErrorWithType
 * @property {string} message - Error message
 * @property {string} [type] - Error type classification
 */

/**
 * @typedef {object} ModelDashboardMetrics
 * @property {number} avgResponseTime - Average response time (rounded)
 * @property {number} accuracyScore - Accuracy score (1 decimal)
 * @property {number} successRate - Success rate as percentage
 * @property {string} lastUsed - Last used timestamp ISO string
 */

/**
 * @typedef {object} CircuitBreakerDashboard
 * @property {"closed"|"open"|"half_open"} state - Circuit breaker state
 * @property {number} failureCount - Number of failures
 * @property {boolean} available - Whether model is available
 */

/**
 * @typedef {object} PerformanceDashboard
 * @property {Record<string, ModelDashboardMetrics>} models - Model performance data
 * @property {Record<string, CircuitBreakerDashboard>} circuitBreakers - Circuit breaker states
 * @property {string} timestamp - Dashboard generation timestamp
 */

/**
 * Preference weights for model selection criteria
 * @type {Record<string, number>}
 */
const SELECTION_WEIGHTS = {
  specialty_match: 0.4,      // How well the model matches the query specialty
  cost_efficiency: 0.2,      // Cost per token considerations  
  response_speed: 0.2,       // Historical response time performance
  accuracy_score: 0.15,      // Historical accuracy ratings
  availability: 0.05         // Current availability status
};

/**
 * Model performance history tracking
 * @type {Map<string, ModelPerformanceMetrics>}
 */
const modelPerformanceCache = new Map();

/**
 * Circuit breaker states for model availability
 * @type {Map<string, CircuitBreakerState>}
 */
const circuitBreakerStates = new Map();

/**
 * Initialize model performance tracking
 * @param {string} modelId - Model identifier
 * @returns {void}
 */
function initializeModelPerformance(modelId) {
  if (!modelPerformanceCache.has(modelId)) {
    modelPerformanceCache.set(modelId, {
      avgResponseTime: 1000, // Default 1 second
      accuracyScore: 7.0,    // Default 7/10
      successRate: 0.95,     // Default 95% success
      lastUsed: new Date()
    });
  }
}

/**
 * Update model performance metrics
 * @param {string} modelId - Model identifier  
 * @param {number} responseTime - Response time in milliseconds
 * @param {number} accuracyScore - Quality score 1-10
 * @param {boolean} successful - Whether the request succeeded
 * @returns {void}
 */
function updateModelPerformance(modelId, responseTime, accuracyScore, successful) {
  initializeModelPerformance(modelId);
  const current = modelPerformanceCache.get(modelId);
  
  if (!current) return; // Type guard, should not happen after initialization
  
  // Exponential weighted moving average for response time
  const alpha = 0.2;
  current.avgResponseTime = (alpha * responseTime) + ((1 - alpha) * current.avgResponseTime);
  
  // Update accuracy score (moving average)
  if (accuracyScore > 0) {
    current.accuracyScore = (alpha * accuracyScore) + ((1 - alpha) * current.accuracyScore);
  }
  
  // Update success rate (moving average)
  const successValue = successful ? 1 : 0;
  current.successRate = (alpha * successValue) + ((1 - alpha) * current.successRate);
  
  current.lastUsed = new Date();
  
  // Record in the adapter system
  recordModelPerformance(modelId, "unknown", responseTime, accuracyScore, successful);
}

/**
 * Circuit breaker logic for handling model failures
 * @param {string} modelId - Model identifier
 * @param {boolean} requestSuccessful - Whether the last request succeeded
 * @returns {boolean} Whether the model should be available for use
 */
function updateCircuitBreaker(modelId, requestSuccessful) {
  if (!circuitBreakerStates.has(modelId)) {
    circuitBreakerStates.set(modelId, {
      state: 'closed',
      failureCount: 0,
      lastFailure: null,
      nextAttempt: new Date()
    });
  }
  
  const breaker = circuitBreakerStates.get(modelId);
  if (!breaker) return false; // Type guard
  
  const now = new Date();
  
  if (requestSuccessful) {
    // Reset on successful request
    breaker.state = 'closed';
    breaker.failureCount = 0;
    return true;
  } else {
    breaker.failureCount++;
    breaker.lastFailure = now;
    
    // Open circuit breaker after 3 consecutive failures
    if (breaker.failureCount >= 3) {
      breaker.state = 'open';
      breaker.nextAttempt = new Date(now.getTime() + 30000); // 30 second timeout
      return false;
    }
    
    return breaker.state === 'closed';
  }
}

/**
 * Check if model is available based on circuit breaker state
 * @param {string} modelId - Model identifier
 * @returns {boolean} Whether model is available
 */
function isModelAvailable(modelId) {
  if (!circuitBreakerStates.has(modelId)) {
    return true;
  }
  
  const breaker = circuitBreakerStates.get(modelId);
  if (!breaker) return true; // Type guard
  
  const now = new Date();
  
  switch (breaker.state) {
    case 'closed':
      return true;
    case 'open':
      if (now >= breaker.nextAttempt) {
        breaker.state = 'half_open';
        return true;
      }
      return false;
    case 'half_open':
      return true;
    default:
      return true;
  }
}

/**
 * Calculate model selection score based on multiple criteria
 * @param {string} modelId - Model identifier
 * @param {string} queryType - Type of medical query
 * @param {"emergency"|"urgent"|"non_urgent"} urgencyLevel - Query urgency
 * @param {UserPreferences} [preferences] - User/system preferences
 * @returns {number} Selection score (higher is better)
 */
function calculateModelScore(modelId, queryType, urgencyLevel, preferences = {}) {
  initializeModelPerformance(modelId);
  const performance = modelPerformanceCache.get(modelId);
  
  if (!performance) return 0; // Type guard
  
  let score = 0;
  
  // Specialty match scoring
  const modelConfig = { specialties: ["general_medical"] }; // Would come from model registry
  const specialtyMatch = modelConfig.specialties.includes(queryType) || 
                         modelConfig.specialties.includes("general_medical");
  score += (specialtyMatch ? 10 : 5) * SELECTION_WEIGHTS.specialty_match;
  
  // Cost efficiency scoring (lower cost = higher score)
  const costScore = Math.max(0, 10 - (0.001 * 10000)); // Normalize cost to 0-10 scale
  score += costScore * SELECTION_WEIGHTS.cost_efficiency;
  
  // Response speed scoring (faster = higher score)
  const speedScore = Math.max(0, 10 - (performance.avgResponseTime / 1000));
  score += speedScore * SELECTION_WEIGHTS.response_speed;
  
  // Accuracy scoring
  score += performance.accuracyScore * SELECTION_WEIGHTS.accuracy_score;
  
  // Availability scoring
  const availabilityScore = isModelAvailable(modelId) ? 10 : 0;
  score += availabilityScore * SELECTION_WEIGHTS.availability;
  
  // Urgency multipliers
  if (urgencyLevel === "emergency") {
    score *= 1.2; // Boost reliable models for emergencies
  }
  
  // Apply user preferences
  if (preferences.preferredModels && preferences.preferredModels.includes(modelId)) {
    score *= 1.3;
  }
  
  if (preferences.avoidModels && preferences.avoidModels.includes(modelId)) {
    score *= 0.7;
  }
  
  return score;
}

/**
 * Intelligent model selection with preference learning
 * @param {string} queryType - Type of medical query
 * @param {"emergency"|"urgent"|"non_urgent"} urgencyLevel - Query urgency  
 * @param {string[]} [availableModels] - Currently available models
 * @param {UserPreferences} [preferences] - Selection preferences
 * @returns {Promise<ModelSelectionResult>} Model selection result
 */
export async function selectModelWithPreferences(queryType, urgencyLevel, availableModels = [], preferences = {}) {
  // Get base model selection
  const baseSelection = selectOptimalModel(queryType, urgencyLevel, availableModels, preferences);
  
  // Calculate scores for all available models
  /** @type {ModelScore[]} */
  const modelScores = [];
  const modelsToEvaluate = availableModels.length > 0 ? availableModels : ["deepseek"];
  
  for (const modelId of modelsToEvaluate) {
    if (isModelAvailable(modelId)) {
      const score = calculateModelScore(modelId, queryType, urgencyLevel, preferences);
      modelScores.push({ modelId, score });
    }
  }
  
  // Sort by score (descending)
  modelScores.sort((a, b) => b.score - a.score);
  
  if (modelScores.length === 0) {
    // Fallback to base selection if no models available
    return {
      modelId: baseSelection.modelId,
      confidence: 0.5,
      reasoning: "Fallback selection - no models passed availability check",
      fallbacks: []
    };
  }
  
  const selectedModel = modelScores[0];
  const fallbacks = modelScores.slice(1, 4).map(m => m.modelId); // Top 3 fallbacks
  
  // Calculate confidence based on score gap
  const confidence = Math.min(1.0, selectedModel.score / 10);
  
  const reasoning = `Selected ${selectedModel.modelId} (score: ${selectedModel.score.toFixed(2)}) ` +
    `for ${queryType} ${urgencyLevel} query. ` +
    `Fallbacks: ${fallbacks.join(", ")}`;
  
  return {
    modelId: selectedModel.modelId,
    confidence,
    reasoning,
    fallbacks
  };
}

/**
 * Execute query with automatic fallback and performance tracking
 * @param {string} queryType - Type of medical query
 * @param {"emergency"|"urgent"|"non_urgent"} urgencyLevel - Query urgency
 * @param {string} prompt - The prompt to send to the model
 * @param {QueryOptions} [options] - Query options and preferences
 * @returns {Promise<QueryExecutionResult>} Query execution result
 */
export async function executeQueryWithFallback(queryType, urgencyLevel, prompt, options = {}) {
  const startTime = Date.now();
  const selection = await selectModelWithPreferences(queryType, urgencyLevel, options.availableModels, options.preferences);
  
  const attempts = [selection.modelId, ...selection.fallbacks];
  let lastError = null;
  /** @type {string[]} */
  const fallbacksUsed = [];
  
  for (let i = 0; i < attempts.length; i++) {
    const modelId = attempts[i];
    
    if (!isModelAvailable(modelId)) {
      continue;
    }
    
    try {
      const modelStartTime = Date.now();
      
      // This would integrate with the actual LLM API call
      // For now, simulate the call
      const response = await simulateModelCall(modelId, prompt, options);
      
      const responseTime = Date.now() - modelStartTime;
      const totalTime = Date.now() - startTime;
      
      // Update performance metrics
      updateModelPerformance(modelId, responseTime, 8.0, true); // Assume good quality for simulation
      updateCircuitBreaker(modelId, true);
      
      return {
        response,
        modelUsed: modelId,
        responseTime: totalTime,
        successful: true,
        fallbacksUsed
      };
      
    } catch (error) {
      const errorTyped = /** @type {ErrorWithType} */ (error);
      lastError = errorTyped;
      fallbacksUsed.push(modelId);
      
      // Update performance metrics for failure
      const responseTime = Date.now() - startTime;
      updateModelPerformance(modelId, responseTime, 0, false);
      updateCircuitBreaker(modelId, false);
      
      // Determine if we should continue with fallbacks
      const fallbackStrategy = determineFallbackStrategy(modelId, errorTyped.type || "api_error", queryType, urgencyLevel);
      
      if (!fallbackStrategy.shouldRetry) {
        break;
      }
      
      // Add delay for rate limiting
      if (fallbackStrategy.retryStrategy === "exponential_backoff") {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }
  
  // All models failed
  const totalTime = Date.now() - startTime;
  /** @type {QueryExecutionResult} */
  const result = {
    response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment or seek direct medical attention if this is urgent.",
    modelUsed: "none",
    responseTime: totalTime,
    successful: false,
    fallbacksUsed
  };
  
  // Add error information if available
  if (lastError && lastError.message) {
    result.error = lastError.message;
  }
  
  return result;
}

/**
 * Simulate model API call (would be replaced with actual API integration)
 * @param {string} modelId - Model to call
 * @param {string} prompt - Prompt to send
 * @param {QueryOptions} _options - Call options (unused)
 * @returns {Promise<string>} Model response
 */
async function simulateModelCall(modelId, prompt, _options) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // Simulate occasional failures
  if (Math.random() < 0.05) { // 5% failure rate
    throw new Error("Simulated API error");
  }
  
  return `Response from ${modelId}: This is a simulated medical response for the query: ${prompt.substring(0, 100)}...`;
}

/**
 * Get model performance dashboard data
 * @returns {PerformanceDashboard} Performance metrics for all models
 */
export function getModelPerformanceDashboard() {
  /** @type {PerformanceDashboard} */
  const dashboard = {
    models: {},
    circuitBreakers: {},
    timestamp: new Date().toISOString()
  };
  
  // Convert performance cache to dashboard format
  const performanceEntries = Array.from(modelPerformanceCache.entries());
  for (const [modelId, performance] of performanceEntries) {
    dashboard.models[modelId] = {
      avgResponseTime: Math.round(performance.avgResponseTime),
      accuracyScore: Math.round(performance.accuracyScore * 10) / 10,
      successRate: Math.round(performance.successRate * 1000) / 10, // Convert to percentage
      lastUsed: performance.lastUsed.toISOString()
    };
  }
  
  // Convert circuit breaker states
  const circuitBreakerEntries = Array.from(circuitBreakerStates.entries());
  for (const [modelId, breaker] of circuitBreakerEntries) {
    dashboard.circuitBreakers[modelId] = {
      state: breaker.state,
      failureCount: breaker.failureCount,
      available: isModelAvailable(modelId)
    };
  }
  
  return dashboard;
}

/**
 * Reset model performance metrics (for testing or maintenance)
 * @param {string|null} [modelId] - Model to reset, or null for all models
 * @returns {void}
 */
export function resetModelMetrics(modelId = null) {
  if (modelId) {
    modelPerformanceCache.delete(modelId);
    circuitBreakerStates.delete(modelId);
  } else {
    modelPerformanceCache.clear();
    circuitBreakerStates.clear();
  }
}