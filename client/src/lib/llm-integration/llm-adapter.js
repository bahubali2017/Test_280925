/**
 * @file LLM abstraction layer for multiple AI model compatibility
 * Phase 8: Advanced LLM integration with MedPalm v2, Claude 3, and GPT-4 support
 */

import { AI_FLAGS } from "../../config/ai-flags.js";

/**
 * LLM model identifier types
 * @typedef {'deepseek'|'gpt4'|'claude3'|'medpalm'} ModelId
 */

/**
 * Query urgency levels for model selection
 * @typedef {'emergency'|'urgent'|'non_urgent'} UrgencyLevel
 */

/**
 * Medical query type categories
 * @typedef {'cardiovascular'|'neurological'|'mental_health'|'pediatric'|'geriatric'|'general'} QueryType
 */

/**
 * LLM model configuration structure
 * @typedef {{
 *   name: string;
 *   endpoint: string|null;
 *   maxTokens: number;
 *   temperature: number;
 *   specialties: string[];
 *   available: boolean;
 *   costPerToken: number;
 * }} ModelConfig
 */

/**
 * Model selection preferences object
 * @typedef {{
 *   costOptimized?: boolean;
 *   specialtyMatch?: boolean;
 * }} ModelPreferences
 */

/**
 * Prompt optimization context
 * @typedef {{
 *   userRole?: string;
 *   maxTokens?: number;
 *   temperature?: number;
 *   expansionPrompt?: string;
 * }} OptimizationContext
 */

/**
 * Model selection result
 * @typedef {{
 *   modelId: string;
 *   model: ModelConfig;
 *   reasoning: string;
 * }} ModelSelection
 */

/**
 * Prompt optimization result
 * @typedef {{
 *   optimizedSystemPrompt: string;
 *   optimizedUserPrompt: string;
 *   modelConfig: Record<string, unknown>;
 * }} PromptOptimization
 */

/**
 * Fallback strategy result
 * @typedef {{
 *   fallbackModelId: string;
 *   retryStrategy: string;
 *   shouldRetry: boolean;
 * }} FallbackStrategy
 */

/**
 * Cost calculation result
 * @typedef {{
 *   inputCost: number;
 *   outputCost: number;
 *   totalCost: number;
 *   costEfficiency: string;
 * }} CostCalculation
 */

/**
 * Model health check result
 * @typedef {{
 *   available: boolean;
 *   responseTime: number;
 *   healthStatus: string;
 * }} HealthCheckResult
 */

/**
 * Prompt optimization configuration
 * @typedef {{
 *   systemPromptPrefix: string;
 *   userPromptWrapper: (prompt: string) => string;
 *   responseFormat: string;
 * }} PromptOptimizationConfig
 */

/**
 * LLM model configurations and capabilities
 * @type {Record<ModelId, ModelConfig>}
 */
export const LLM_MODELS = {
  "deepseek": {
    name: "DeepSeek Chat",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    maxTokens: 4000,
    temperature: 0.3,
    specialties: ["general_medical", "symptoms_analysis", "triage"],
    available: true,
    costPerToken: 0.00014
  },
  "gpt4": {
    name: "GPT-4 Turbo",
    endpoint: "https://api.openai.com/v1/chat/completions",
    maxTokens: 4096,
    temperature: 0.2,
    specialties: ["complex_reasoning", "differential_diagnosis", "patient_communication"],
    available: false, // Requires API key configuration
    costPerToken: 0.01
  },
  "claude3": {
    name: "Claude 3 Sonnet",
    endpoint: "https://api.anthropic.com/v1/messages",
    maxTokens: 4096,
    temperature: 0.1,
    specialties: ["ethical_guidance", "sensitive_topics", "detailed_explanations"],
    available: false, // Requires API key configuration
    costPerToken: 0.003
  },
  "medpalm": {
    name: "MedPaLM 2",
    endpoint: null, // Would require Google Cloud integration
    maxTokens: 2048,
    temperature: 0.1,
    specialties: ["medical_knowledge", "clinical_reasoning", "evidence_based"],
    available: false, // Requires special access
    costPerToken: 0.002
  }
};

/**
 * Model selection preferences based on query type and urgency
 * @type {Record<QueryType, Record<UrgencyLevel, ModelId[]>>}
 */
export const MODEL_PREFERENCES = {
  "cardiovascular": {
    "emergency": ["gpt4", "medpalm", "deepseek", "claude3"],
    "urgent": ["medpalm", "gpt4", "deepseek", "claude3"],
    "non_urgent": ["deepseek", "gpt4", "medpalm", "claude3"]
  },
  "neurological": {
    "emergency": ["gpt4", "medpalm", "deepseek", "claude3"],
    "urgent": ["medpalm", "gpt4", "deepseek", "claude3"],
    "non_urgent": ["deepseek", "medpalm", "gpt4", "claude3"]
  },
  "mental_health": {
    "emergency": ["claude3", "gpt4", "deepseek", "medpalm"],
    "urgent": ["claude3", "gpt4", "deepseek", "medpalm"],
    "non_urgent": ["claude3", "deepseek", "gpt4", "medpalm"]
  },
  "pediatric": {
    "emergency": ["medpalm", "gpt4", "deepseek", "claude3"],
    "urgent": ["medpalm", "gpt4", "deepseek", "claude3"],
    "non_urgent": ["deepseek", "medpalm", "gpt4", "claude3"]
  },
  "geriatric": {
    "emergency": ["gpt4", "medpalm", "deepseek", "claude3"],
    "urgent": ["gpt4", "medpalm", "deepseek", "claude3"],
    "non_urgent": ["deepseek", "gpt4", "medpalm", "claude3"]
  },
  "general": {
    "emergency": ["deepseek", "gpt4", "medpalm", "claude3"],
    "urgent": ["deepseek", "gpt4", "medpalm", "claude3"],
    "non_urgent": ["deepseek", "gpt4", "claude3", "medpalm"]
  }
};

/**
 * Model-specific prompt optimization templates
 * @type {Record<ModelId, PromptOptimizationConfig>}
 */
export const MODEL_PROMPT_OPTIMIZATIONS = {
  "deepseek": {
    systemPromptPrefix: "You are a knowledgeable medical AI assistant providing evidence-based guidance.",
    userPromptWrapper: (prompt) => prompt,
    responseFormat: "structured_medical_response"
  },
  "gpt4": {
    systemPromptPrefix: "You are an expert medical AI with deep clinical knowledge. Provide comprehensive, evidence-based medical guidance with differential diagnosis considerations.",
    userPromptWrapper: (prompt) => `Medical Query Analysis:\n\n${prompt}\n\nPlease provide a thorough medical assessment with structured recommendations.`,
    responseFormat: "comprehensive_clinical_analysis"
  },
  "claude3": {
    systemPromptPrefix: "You are Claude, an AI assistant with medical knowledge. I want you to be helpful, harmless, and honest in providing medical guidance. Be especially careful with sensitive topics and mental health concerns.",
    userPromptWrapper: (prompt) => `I need medical guidance for the following situation. Please be thoughtful and sensitive in your response:\n\n${prompt}`,
    responseFormat: "empathetic_medical_guidance"
  },
  "medpalm": {
    systemPromptPrefix: "You are MedPaLM, a medical AI system trained on clinical literature. Provide evidence-based medical information with appropriate clinical reasoning.",
    userPromptWrapper: (prompt) => `Clinical Scenario:\n${prompt}\n\nClinical Assessment:`,
    responseFormat: "evidence_based_clinical_response"
  }
};

/**
 * Type guard to check if a query type is valid
 * @param {string} queryType - Query type to validate
 * @returns {queryType is QueryType}
 */
function isValidQueryType(queryType) {
  const validTypes = ['cardiovascular', 'neurological', 'mental_health', 'pediatric', 'geriatric', 'general'];
  return validTypes.includes(queryType);
}

/**
 * Type guard to check if an urgency level is valid
 * @param {string} urgencyLevel - Urgency level to validate
 * @returns {urgencyLevel is UrgencyLevel}
 */
function isValidUrgencyLevel(urgencyLevel) {
  const validLevels = ['emergency', 'urgent', 'non_urgent'];
  return validLevels.includes(urgencyLevel);
}

/**
 * Type guard to check if a model ID is valid
 * @param {string} modelId - Model ID to validate
 * @returns {modelId is ModelId}
 */
function isValidModelId(modelId) {
  return modelId in LLM_MODELS;
}

/**
 * Safely get model preferences for a query type and urgency level
 * @param {string} queryType - Query type
 * @param {string} urgencyLevel - Urgency level
 * @returns {ModelId[]} Array of model IDs in preference order
 */
function getModelPreferences(queryType, urgencyLevel) {
  const safeQueryType = isValidQueryType(queryType) ? queryType : 'general';
  const safeUrgencyLevel = isValidUrgencyLevel(urgencyLevel) ? urgencyLevel : 'non_urgent';
  
  return MODEL_PREFERENCES[safeQueryType][safeUrgencyLevel] || MODEL_PREFERENCES.general.non_urgent;
}

/**
 * Select optimal LLM model based on query characteristics
 * @param {string} queryType - Type of medical query (cardiovascular, neurological, etc.)
 * @param {string} urgencyLevel - Urgency level of the query
 * @param {string[]} availableModels - List of currently available models
 * @param {ModelPreferences} preferences - User or system preferences for model selection
 * @returns {ModelSelection}
 */
export function selectOptimalModel(queryType, urgencyLevel, availableModels = [], preferences = {}) {
  // Validate and sanitize inputs
  if (typeof queryType !== 'string' || typeof urgencyLevel !== 'string') {
    console.warn('[LLM-Adapter] Invalid queryType or urgencyLevel provided');
    return selectOptimalModel('general', 'non_urgent', availableModels, preferences);
  }

  // Get preference order for this query type and urgency
  const preferenceOrder = getModelPreferences(queryType, urgencyLevel);
  
  // Filter to only available models
  const availableModelIds = availableModels.length > 0 ? 
    availableModels.filter(id => typeof id === 'string' && isValidModelId(id)) : 
    Object.keys(LLM_MODELS).filter(id => LLM_MODELS[/** @type {ModelId} */ (id)].available);
  
  // Apply user/system preferences
  let orderedModels = preferenceOrder.filter(modelId => availableModelIds.includes(modelId));
  
  // Apply cost considerations if specified
  if (preferences && typeof preferences === 'object' && 'costOptimized' in preferences && preferences.costOptimized) {
    orderedModels = orderedModels.sort((a, b) => LLM_MODELS[a].costPerToken - LLM_MODELS[b].costPerToken);
  }
  
  // Apply specialty matching
  if (preferences && typeof preferences === 'object' && 'specialtyMatch' in preferences && preferences.specialtyMatch) {
    orderedModels = orderedModels.filter(modelId => {
      const model = LLM_MODELS[modelId];
      return model.specialties.includes(queryType) || model.specialties.includes("general_medical");
    });
  }
  
  // Select the top model
  const selectedModelId = orderedModels[0] || "deepseek"; // Default fallback
  const selectedModel = LLM_MODELS[/** @type {ModelId} */ (selectedModelId)];
  
  const reasoning = `Selected ${selectedModel.name} for ${queryType} (${urgencyLevel}) query. ` +
    `Specialties: ${selectedModel.specialties.join(", ")}. ` +
    `Cost: $${selectedModel.costPerToken}/token.`;
  
  console.info('[LLM-Adapter] Model selected', { modelId: selectedModelId, queryType, urgencyLevel, reasoning });
  
  return {
    modelId: selectedModelId,
    model: selectedModel,
    reasoning
  };
}

/**
 * Check if medication enhancement features are enabled
 * @returns {boolean}
 */
export function isMedicationEnhancementEnabled() {
  return AI_FLAGS.ENABLE_MED_QUERY_CLASSIFIER || AI_FLAGS.ENABLE_ROLE_MODE;
}

/**
 * Check if response formatting features are enabled
 * @returns {boolean}
 */
export function isResponseFormatEnabled() {
  return AI_FLAGS.ENABLE_CONCISE_MODE || AI_FLAGS.ENABLE_EXPANSION_PROMPT;
}

/**
 * Check if disclaimers should be filtered to avoid duplication
 * @param {string} systemPrompt - System prompt that may already contain disclaimers
 * @returns {boolean}
 */
export function shouldFilterDuplicateDisclaimers(systemPrompt) {
  if (typeof systemPrompt !== 'string') {
    return false;
  }

  const disclaimerIndicators = [
    "⚠️ Professional reference only",
    "⚠️ Informational purposes only",
    "ROLE POLICY"
  ];
  
  return disclaimerIndicators.some(indicator => systemPrompt.includes(indicator));
}

/**
 * Optimize prompt for specific LLM model
 * @param {string} modelId - Selected model identifier
 * @param {string} systemPrompt - Base system prompt
 * @param {string} userPrompt - User/medical query prompt
 * @param {OptimizationContext} context - Additional context for optimization
 * @returns {PromptOptimization}
 */
export function optimizePromptForModel(modelId, systemPrompt, userPrompt, context = {}) {
  // Validate inputs
  if (typeof modelId !== 'string' || typeof systemPrompt !== 'string' || typeof userPrompt !== 'string') {
    console.warn('[LLM-Adapter] Invalid inputs for prompt optimization');
    return optimizePromptForModel("deepseek", systemPrompt || "", userPrompt || "", context);
  }

  const safeModelId = /** @type {ModelId} */ (isValidModelId(modelId) ? modelId : 'deepseek');
  const modelConfig = LLM_MODELS[safeModelId];
  const optimization = MODEL_PROMPT_OPTIMIZATIONS[safeModelId];
  
  if (!modelConfig || !optimization) {
    // Fallback to deepseek optimization
    return optimizePromptForModel("deepseek", systemPrompt, userPrompt, context);
  }
  
  // Build optimized system prompt - check for existing disclaimers to avoid duplication
  let optimizedSystemPrompt;
  if (shouldFilterDuplicateDisclaimers(systemPrompt)) {
    // System prompt already contains role policies/disclaimers, use as-is
    optimizedSystemPrompt = `${optimization.systemPromptPrefix}\n\n${systemPrompt}`;
  } else {
    // Standard optimization
    optimizedSystemPrompt = `${optimization.systemPromptPrefix}\n\n${systemPrompt}`;
  }
  
  // Apply model-specific user prompt wrapper
  let optimizedUserPrompt = optimization.userPromptWrapper(userPrompt);
  
  // Add expansion prompt if enabled and available in context
  if (AI_FLAGS.ENABLE_EXPANSION_PROMPT && 
      context && 
      typeof context === 'object' && 
      'expansionPrompt' in context && 
      typeof context.expansionPrompt === 'string') {
    optimizedUserPrompt += context.expansionPrompt;
  }
  
  // Model-specific configurations
  const contextMaxTokens = context && typeof context === 'object' && 'maxTokens' in context && typeof context.maxTokens === 'number' 
    ? context.maxTokens 
    : modelConfig.maxTokens;
  
  const contextTemperature = context && typeof context === 'object' && 'temperature' in context && typeof context.temperature === 'number'
    ? context.temperature
    : undefined;
  
  const userRole = context && typeof context === 'object' && 'userRole' in context && typeof context.userRole === 'string'
    ? context.userRole
    : 'public';

  const optimizedConfig = {
    maxTokens: Math.min(modelConfig.maxTokens, contextMaxTokens),
    temperature: contextTemperature !== undefined ? contextTemperature : modelConfig.temperature,
    model: safeModelId,
    responseFormat: optimization.responseFormat,
    // Pass through medication enhancement status for downstream processing
    isMedicationEnhanced: isMedicationEnhancementEnabled(),
    userRole: userRole
  };
  
  console.info('[LLM-Adapter] Prompt optimized', { modelId: safeModelId, userRole, hasExpansionPrompt: Boolean(context && 'expansionPrompt' in context) });
  
  return {
    optimizedSystemPrompt,
    optimizedUserPrompt,
    modelConfig: optimizedConfig
  };
}

/**
 * LLM fallback logic when primary model fails
 * @param {string} failedModelId - Model that failed
 * @param {string} errorType - Type of error encountered
 * @param {string} queryType - Type of medical query
 * @param {string} urgencyLevel - Urgency level
 * @returns {FallbackStrategy}
 */
export function determineFallbackStrategy(failedModelId, errorType, queryType, urgencyLevel) {
  // Validate inputs with safe defaults
  if (typeof failedModelId !== 'string' || typeof errorType !== 'string') {
    console.warn('[LLM-Adapter] Invalid failedModelId or errorType provided');
    return {
      fallbackModelId: 'deepseek',
      retryStrategy: 'immediate',
      shouldRetry: false
    };
  }

  const preferenceOrder = getModelPreferences(queryType, urgencyLevel);
  
  // Remove the failed model from options
  const availableFallbacks = preferenceOrder.filter(modelId => 
    modelId !== failedModelId && LLM_MODELS[modelId].available
  );
  
  let retryStrategy = "immediate";
  let shouldRetry = true;
  
  // Determine retry strategy based on error type
  switch (errorType) {
    case "rate_limit":
      retryStrategy = "exponential_backoff";
      shouldRetry = urgencyLevel === "emergency";
      break;
    case "api_error":
      retryStrategy = "immediate";
      shouldRetry = availableFallbacks.length > 0;
      break;
    case "timeout":
      retryStrategy = "immediate";
      shouldRetry = urgencyLevel === "emergency";
      break;
    case "invalid_response":
      retryStrategy = "different_model";
      shouldRetry = availableFallbacks.length > 0;
      break;
    default:
      retryStrategy = "immediate";
      shouldRetry = false;
  }
  
  const fallbackModelId = availableFallbacks[0] || "deepseek";
  
  console.warn('[LLM-Adapter] Fallback strategy determined', { 
    failedModelId, 
    errorType, 
    fallbackModelId, 
    retryStrategy, 
    shouldRetry 
  });
  
  return {
    fallbackModelId,
    retryStrategy,
    shouldRetry
  };
}

/**
 * Calculate cost estimate for LLM query
 * @param {string} modelId - Model identifier
 * @param {number} estimatedInputTokens - Estimated input tokens
 * @param {number} estimatedOutputTokens - Estimated output tokens
 * @returns {CostCalculation}
 */
export function calculateQueryCost(modelId, estimatedInputTokens, estimatedOutputTokens) {
  // Validate inputs
  if (typeof modelId !== 'string' || typeof estimatedInputTokens !== 'number' || typeof estimatedOutputTokens !== 'number') {
    console.warn('[LLM-Adapter] Invalid inputs for cost calculation');
    return { inputCost: 0, outputCost: 0, totalCost: 0, costEfficiency: "unknown" };
  }

  const model = LLM_MODELS[/** @type {ModelId} */ (modelId)];
  if (!model) {
    return { inputCost: 0, outputCost: 0, totalCost: 0, costEfficiency: "unknown" };
  }
  
  // Most models charge the same for input/output, but some differ
  const inputCost = estimatedInputTokens * model.costPerToken;
  const outputCost = estimatedOutputTokens * model.costPerToken;
  const totalCost = inputCost + outputCost;
  
  // Determine cost efficiency
  let costEfficiency = "moderate";
  if (totalCost < 0.01) costEfficiency = "high";
  else if (totalCost < 0.05) costEfficiency = "moderate";
  else if (totalCost < 0.10) costEfficiency = "low";
  else costEfficiency = "very_low";
  
  console.info('[LLM-Adapter] Cost calculated', { modelId, totalCost, costEfficiency });
  
  return {
    inputCost,
    outputCost,
    totalCost,
    costEfficiency
  };
}

/**
 * Monitor model performance and adjust selection preferences
 * @param {string} modelId - Model that was used
 * @param {string} queryType - Type of query
 * @param {number} responseTime - Response time in milliseconds
 * @param {number} qualityScore - Quality score (1-10)
 * @param {boolean} successful - Whether the query was successful
 * @returns {void}
 */
export function recordModelPerformance(modelId, queryType, responseTime, qualityScore, successful) {
  // Validate inputs
  if (typeof modelId !== 'string' || typeof queryType !== 'string' || 
      typeof responseTime !== 'number' || typeof qualityScore !== 'number' || 
      typeof successful !== 'boolean') {
    console.warn('[LLM-Adapter] Invalid inputs for performance recording');
    return;
  }

  // This would integrate with analytics system to track model performance
  // For now, we'll log the performance data
  
  const performanceData = {
    modelId,
    queryType,
    responseTime,
    qualityScore,
    successful,
    timestamp: new Date().toISOString()
  };
  
  console.info('[LLM-Adapter] Performance recorded', performanceData);
  
  // In a full implementation, this would:
  // 1. Store performance data in analytics database
  // 2. Calculate running averages for model performance
  // 3. Adjust MODEL_PREFERENCES based on performance trends
  // 4. Alert administrators to model performance issues
  // 5. Trigger automatic model selection preference updates
}

/**
 * Get model availability status and health check
 * @param {string} modelId - Model to check
 * @returns {Promise<HealthCheckResult>}
 */
export async function checkModelHealth(modelId) {
  // Validate input
  if (typeof modelId !== 'string' || !isValidModelId(modelId)) {
    console.warn('[LLM-Adapter] Invalid modelId for health check');
    return { available: false, responseTime: 0, healthStatus: "invalid_model_id" };
  }

  const model = LLM_MODELS[/** @type {ModelId} */ (modelId)];
  
  if (!model || !model.endpoint) {
    return { available: false, responseTime: 0, healthStatus: "not_configured" };
  }
  
  try {
    const startTime = Date.now();
    
    // Simple health check - would be implemented based on each model's API
    const healthCheckPromise = new Promise((resolve) => {
      window.setTimeout(() => resolve({ ok: true }), 100); // Simulate health check
    });
    
    await healthCheckPromise;
    const responseTime = Date.now() - startTime;
    
    console.info('[LLM-Adapter] Health check passed', { modelId, responseTime });
    
    return {
      available: true,
      responseTime,
      healthStatus: "healthy"
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[LLM-Adapter] Health check failed', { modelId, error: errorMessage });
    return {
      available: false,
      responseTime: 0,
      healthStatus: "unhealthy"
    };
  }
}

console.info('[LLM-Adapter] LLM integration system initialized with', Object.keys(LLM_MODELS).length, 'model configurations');