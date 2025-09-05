/**
 * Query Sampler for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: Sampling respects user privacy by collecting only anonymized samples
 * at controlled intervals. High-risk queries are prioritized for quality assurance.
 * 
 * @file Data sampling engine with configurable probability and forced logging
 */

/* eslint-env browser, node */
/* global clearInterval, global */

import { SamplingPriority } from './enums.js';
import { logQueryToDataset, categorizeResponse } from './data-logger.js';

/**
 * Default sampling configuration
 * @private
 */
const DEFAULT_CONFIG = {
  /** Base sampling probability (0.0 to 1.0) */
  baseSamplingRate: 0.1,
  /** Always sample high-risk queries */
  forceHighRisk: true,
  /** Maximum queries to buffer before forced flush */
  maxBufferSize: 50,
  /** Time interval for automatic buffer flush (ms) */
  flushInterval: 5 * 60 * 1000, // 5 minutes
  /** Minimum time between samples to avoid spam */
  minSampleInterval: 1000 // 1 second
};

/**
 * Query buffer for batched processing
 * @private
 */
let queryBuffer = [];
let lastSampleTime = 0;
let flushTimer = null;
let samplerConfig = { ...DEFAULT_CONFIG };

/**
 * Determines if a query should be sampled based on priority and probability
 * @param {object} queryResult - Query result to evaluate for sampling
 * @param {boolean} forceLog - Force logging regardless of probability
 * @returns {boolean} Whether the query should be sampled
 */
export function shouldSample(queryResult, forceLog = false) {
  // Always sample if forced
  if (forceLog) {
    return true;
  }

  // Check minimum time interval to prevent spam
  const now = Date.now();
  if (now - lastSampleTime < samplerConfig.minSampleInterval) {
    return false;
  }

  // Determine sampling priority
  const priority = getSamplingPriority(queryResult);
  
  // Force sample critical and high priority queries
  if (priority === SamplingPriority.CRITICAL || 
      (priority === SamplingPriority.HIGH && samplerConfig.forceHighRisk)) {
    return true;
  }

  // Probability-based sampling for lower priority queries
  const adjustedRate = getAdjustedSamplingRate(priority);
  return Math.random() < adjustedRate;
}

/**
 * Adds a query to the sampling buffer with optional immediate processing
 * @param {object} queryResult - Complete query processing result
 * @param {object} options - Sampling options
 * @param {boolean} options.forceLog - Force immediate logging
 * @param {boolean} options.immediate - Process immediately instead of buffering
 * @returns {Promise<boolean>} Whether the query was processed
 */
export async function sampleQuery(queryResult, options = { forceLog: false, immediate: false }) {
  try {
    const { forceLog = false, immediate = false } = options;
    
    // Check if query should be sampled
    if (!shouldSample(queryResult, forceLog)) {
      return false;
    }

    // Update last sample time
    lastSampleTime = Date.now();
    
    // Categorize the response for logging
    const responseCategory = categorizeResponse(
      queryResult.llmResponse,
      {
        isHighRisk: queryResult.isHighRisk,
        triageLevel: queryResult.triageLevel
      }
    );

    if (immediate || forceLog) {
      // Process immediately
      const success = await logQueryToDataset(queryResult, responseCategory);
      return success;
    } else {
      // Add to buffer for batch processing
      queryBuffer.push({
        queryResult,
        responseCategory,
        timestamp: Date.now()
      });

      // Check if buffer needs flushing
      if (queryBuffer.length >= samplerConfig.maxBufferSize) {
        await flushBuffer();
      }

      return true;
    }

  } catch (error) {
    console.error('[query-sampler] Failed to sample query:', error.message);
    return false;
  }
}

/**
 * Determines sampling priority based on query characteristics
 * @private
 * @param {object} queryResult - Query result to evaluate
 * @returns {string} Priority level for sampling
 */
function getSamplingPriority(queryResult) {
  // Critical: Emergency situations
  if (queryResult.triageLevel === 'emergency' || 
      (queryResult.isHighRisk && queryResult.atd)) {
    return "critical";
  }

  // High: Urgent medical queries
  if (queryResult.triageLevel === 'urgent' || queryResult.isHighRisk) {
    return "high";
  }

  // Medium: Standard medical queries
  if (queryResult.metadata?.intentConfidence > 0.7) {
    return "medium";
  }

  // Low: General or unclear queries
  return "low";
}

/**
 * Gets adjusted sampling rate based on priority
 * @private
 * @param {string} priority - Query priority level
 * @returns {number} Adjusted sampling rate (0.0 to 1.0)
 */
function getAdjustedSamplingRate(priority) {
  const multipliers = {
    critical: 1.0,  // Always sample
    high: 0.8,     // High probability
    medium: 0.3,   // Medium probability
    low: 0.1       // Low probability
  };

  return samplerConfig.baseSamplingRate * (multipliers[priority] || 1.0);
}

/**
 * Flushes the query buffer by processing all pending samples
 * @returns {Promise<number>} Number of successfully processed queries
 */
export async function flushBuffer() {
  if (queryBuffer.length === 0) {
    return 0;
  }

  const toProcess = [...queryBuffer];
  queryBuffer = []; // Clear buffer immediately

  let successCount = 0;

  for (const { queryResult, responseCategory } of toProcess) {
    try {
      const success = await logQueryToDataset(queryResult, responseCategory);
      if (success) {
        successCount++;
      }
    } catch (error) {
      console.error('[query-sampler] Failed to process buffered query:', error.message);
    }
  }

  console.info(`[query-sampler] Flushed buffer: ${successCount}/${toProcess.length} queries processed`);
  return successCount;
}

/**
 * Configures the query sampler with new settings
 * @param {object} newConfig - New configuration object
 * @param {number} newConfig.baseSamplingRate - Base sampling probability
 * @param {boolean} newConfig.forceHighRisk - Force sampling of high-risk queries
 * @param {number} newConfig.maxBufferSize - Maximum buffer size
 * @param {number} newConfig.flushInterval - Auto-flush interval in ms
 * @returns {object} Updated configuration
 */
export function configureSampler(newConfig) {
  samplerConfig = { ...samplerConfig, ...newConfig };
  
  // Restart flush timer if interval changed
  if (newConfig.flushInterval && flushTimer && typeof globalThis !== 'undefined' && globalThis.clearInterval) {
    globalThis.clearInterval(flushTimer);
    startAutoFlush();
  }

  return samplerConfig;
}

/**
 * Starts automatic buffer flushing at configured intervals
 * @returns {void}
 */
export function startAutoFlush() {
  if (flushTimer) {
    clearInterval(flushTimer);
  }

  if (typeof globalThis !== 'undefined' && globalThis.setInterval) {
    flushTimer = globalThis.setInterval(async () => {
      if (queryBuffer.length > 0) {
        await flushBuffer();
      }
    }, samplerConfig.flushInterval);
  }
}

/**
 * Stops automatic buffer flushing
 * @returns {void}
 */
export function stopAutoFlush() {
  if (flushTimer) {
    if (typeof window === 'undefined' && typeof global !== 'undefined' && global.clearInterval) {
      global.clearInterval(flushTimer);
    } else if (typeof window !== 'undefined' && window.clearInterval) {
      window.clearInterval(flushTimer);
    }
    flushTimer = null;
  }
}

/**
 * Gets current sampler statistics
 * @returns {object} Sampler statistics and configuration
 */
export function getSamplerStats() {
  return {
    config: { ...samplerConfig },
    bufferSize: queryBuffer.length,
    lastSampleTime: lastSampleTime,
    autoFlushActive: Boolean(flushTimer)
  };
}

// Initialize auto-flush on module load
startAutoFlush();