/**
 * Query Sampler for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: Sampling respects user privacy by collecting only anonymized samples
 * at controlled intervals. High-risk queries are prioritized for quality assurance.
 * 
 * @file Data sampling engine with configurable probability and forced logging
 */

/**
 * Query object structure
 * @typedef {{
 *   id: string;
 *   userId?: string;
 *   text: string;
 *   locale?: string;
 *   ts: number;
 *   metadata?: Record<string, unknown>;
 * }} Query
 */

/**
 * Sampler configuration
 * @typedef {{
 *   rate: number;
 *   maxBuffer: number;
 *   seed?: number;
 * }} SamplerConfig
 */

/**
 * Sampling decision result
 * @typedef {{
 *   kept: boolean;
 *   reason: 'prob' | 'rule' | 'force' | 'quota';
 *   weight: number;
 * }} Decision
 */

/**
 * Sampler statistics
 * @typedef {{
 *   size: number;
 *   dropped: number;
 *   kept: number;
 *   reasons: Record<string, number>;
 * }} SamplerStats
 */

/**
 * Query sampler interface
 * @typedef {{
 *   push: (q: Query) => Decision;
 *   flush: () => Query[];
 *   size: () => number;
 *   stats: () => SamplerStats;
 * }} QuerySampler
 */

/**
 * Creates a deterministic random number generator from a seed
 * @param {number} seed - Seed value for RNG
 * @returns {() => number} Random number generator function
 */
function makeRng(seed) {
  let s = (seed | 0) || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2**32;
}

/**
 * Computes weight for a query based on its characteristics
 * @param {Query} q - Query to compute weight for
 * @returns {number} Weight value for sampling decision
 */
function computeWeight(q) {
  const len = typeof q.text === 'string' ? q.text.length : 0;
  const boost = q.metadata && typeof q.metadata.priority === 'number' ? q.metadata.priority : 0;
  return Math.max(0, len / 200) + boost;
}

/**
 * Decides whether to keep a query based on weight, rate, and randomness
 * @param {number} w - Query weight
 * @param {number} rate - Base sampling rate
 * @param {() => number} rnd - Random number generator
 * @returns {boolean} Whether to keep the query
 */
function decideKeep(w, rate, rnd) {
  const p = Math.min(1, Math.max(0, rate * (1 + w)));
  return rnd() < p;
}

/**
 * Creates a query sampler with configurable behavior
 * @param {SamplerConfig} cfg - Configuration object
 * @returns {QuerySampler} Query sampler instance
 */
export function createQuerySampler(cfg) {
  const rate = typeof cfg.rate === 'number' ? cfg.rate : 0.1;
  const maxBuffer = typeof cfg.maxBuffer === 'number' ? cfg.maxBuffer : 1000;
  const rnd = 'seed' in cfg && typeof cfg.seed === 'number' ? makeRng(cfg.seed) : Math.random;

  /** @type {Query[]} */
  const buffer = [];
  
  /** @type {SamplerStats} */
  let stats = { size: 0, dropped: 0, kept: 0, reasons: {} };

  /**
   * Pushes a query through the sampling decision process
   * @param {Query} q - Query to process
   * @returns {Decision} Sampling decision result
   */
  function push(q) {
    const w = computeWeight(q);
    const keep = decideKeep(w, rate, rnd);
    const reason = keep ? 'prob' : 'prob';
    
    stats.kept += keep ? 1 : 0;
    stats.dropped += keep ? 0 : 1;
    stats.size = buffer.length + (keep ? 1 : 0);
    stats.reasons[reason] = (stats.reasons[reason] ?? 0) + 1;
    
    if (keep) {
      if (buffer.length >= maxBuffer) {
        buffer.shift();
      }
      buffer.push(q);
    }
    
    return { kept: keep, reason, weight: w };
  }

  /**
   * Flushes all buffered queries and returns them
   * @returns {Query[]} Array of buffered queries
   */
  function flush() {
    const out = buffer.slice();
    buffer.length = 0;
    stats.size = 0;
    return out;
  }

  /**
   * Returns current buffer size
   * @returns {number} Number of queries in buffer
   */
  function size() {
    return buffer.length;
  }

  /**
   * Returns current sampler statistics
   * @returns {SamplerStats} Statistics object
   */
  function getStats() {
    return {
      size: stats.size,
      dropped: stats.dropped,
      kept: stats.kept,
      reasons: { ...stats.reasons }
    };
  }

  return { push, flush, size, stats: getStats };
}

// Legacy API compatibility exports for existing code
import { SamplingPriority } from './enums.js';
import { logQueryToDataset, categorizeResponse } from './data-logger.js';

/**
 * Legacy query result structure for backward compatibility
 * @typedef {{
 *   userInput?: string;
 *   llmResponse?: string;
 *   triageLevel?: string;
 *   isHighRisk?: boolean;
 *   atd?: boolean;
 *   metadata?: Record<string, unknown>;
 * }} LegacyQueryResult
 */

/**
 * Legacy sampling options structure
 * @typedef {{
 *   forceLog?: boolean;
 *   immediate?: boolean;
 * }} LegacySamplingOptions
 */

/**
 * Default sampling configuration for legacy API
 * @private
 */
const DEFAULT_CONFIG = {
  baseSamplingRate: 0.1,
  forceHighRisk: true,
  maxBufferSize: 50,
  flushInterval: 5 * 60 * 1000,
  minSampleInterval: 1000
};

/** @type {Array<{ queryResult: LegacyQueryResult; responseCategory: string; timestamp: number; }>} */
let queryBuffer = [];
let lastSampleTime = 0;
/** @type {number | null} */
let flushTimer = null;
let samplerConfig = { ...DEFAULT_CONFIG };

/**
 * Legacy function: Determines if a query should be sampled
 * @param {LegacyQueryResult} queryResult - Query result to evaluate
 * @param {boolean} forceLog - Force logging regardless of probability
 * @returns {boolean} Whether the query should be sampled
 */
export function shouldSample(queryResult, forceLog = false) {
  if (forceLog) {
    return true;
  }

  const now = Date.now();
  if (now - lastSampleTime < samplerConfig.minSampleInterval) {
    return false;
  }

  const priority = getSamplingPriority(queryResult);
  
  if (priority === SamplingPriority.CRITICAL || 
      (priority === SamplingPriority.HIGH && samplerConfig.forceHighRisk)) {
    return true;
  }

  const adjustedRate = getAdjustedSamplingRate(priority);
  return Math.random() < adjustedRate;
}

/**
 * Legacy function: Adds a query to the sampling buffer
 * @param {LegacyQueryResult} queryResult - Complete query processing result
 * @param {LegacySamplingOptions} options - Sampling options
 * @returns {Promise<boolean>} Whether the query was processed
 */
export async function sampleQuery(queryResult, options = { forceLog: false, immediate: false }) {
  try {
    const { forceLog = false, immediate = false } = options;
    
    if (!shouldSample(queryResult, forceLog)) {
      return false;
    }

    lastSampleTime = Date.now();
    
    const responseCategory = categorizeResponse(
      queryResult.llmResponse || '',
      {
        isHighRisk: queryResult.isHighRisk || false,
        triageLevel: queryResult.triageLevel || 'unknown'
      }
    );

    if (immediate || forceLog) {
      const success = await logQueryToDataset(/** @type {any} */ (queryResult), responseCategory);
      return success;
    } else {
      queryBuffer.push({
        queryResult,
        responseCategory,
        timestamp: Date.now()
      });

      if (queryBuffer.length >= samplerConfig.maxBufferSize) {
        await flushBuffer();
      }

      return true;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[query-sampler] Failed to sample query:', errorMessage);
    return false;
  }
}

/**
 * Legacy function: Determines sampling priority based on query characteristics
 * @private
 * @param {LegacyQueryResult} queryResult - Query result to evaluate
 * @returns {string} Priority level for sampling
 */
function getSamplingPriority(queryResult) {
  if (queryResult.triageLevel === 'emergency' || 
      (queryResult.isHighRisk && queryResult.atd)) {
    return "critical";
  }

  if (queryResult.triageLevel === 'urgent' || queryResult.isHighRisk) {
    return "high";
  }

  if (queryResult.metadata && 'intentConfidence' in queryResult.metadata && 
      typeof queryResult.metadata.intentConfidence === 'number' &&
      queryResult.metadata.intentConfidence > 0.7) {
    return "medium";
  }

  return "low";
}

/**
 * Legacy function: Gets adjusted sampling rate based on priority
 * @private
 * @param {string} priority - Query priority level
 * @returns {number} Adjusted sampling rate (0.0 to 1.0)
 */
function getAdjustedSamplingRate(priority) {
  /** @type {Record<string, number>} */
  const multipliers = {
    critical: 1.0,
    high: 0.8,
    medium: 0.3,
    low: 0.1
  };

  return samplerConfig.baseSamplingRate * (priority in multipliers ? multipliers[priority] : 1.0);
}

/**
 * Legacy function: Flushes the query buffer
 * @returns {Promise<number>} Number of successfully processed queries
 */
export async function flushBuffer() {
  if (queryBuffer.length === 0) {
    return 0;
  }

  const toProcess = [...queryBuffer];
  queryBuffer = [];

  let successCount = 0;

  for (const { queryResult, responseCategory } of toProcess) {
    try {
      const success = await logQueryToDataset(/** @type {any} */ (queryResult), responseCategory);
      if (success) {
        successCount++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[query-sampler] Failed to process buffered query:', errorMessage);
    }
  }

  console.info(`[query-sampler] Flushed buffer: ${successCount}/${toProcess.length} queries processed`);
  return successCount;
}

/**
 * Legacy function: Configures the query sampler
 * @param {Partial<typeof DEFAULT_CONFIG>} newConfig - New configuration object
 * @returns {typeof samplerConfig} Updated configuration
 */
export function configureSampler(newConfig) {
  samplerConfig = { ...samplerConfig, ...newConfig };
  
  if ('flushInterval' in newConfig && flushTimer && typeof globalThis !== 'undefined' && globalThis.clearInterval) {
    globalThis.clearInterval(flushTimer);
    startAutoFlush();
  }

  return samplerConfig;
}

/**
 * Legacy function: Starts automatic buffer flushing
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
 * Legacy function: Stops automatic buffer flushing
 * @returns {void}
 */
export function stopAutoFlush() {
  if (flushTimer) {
    if (typeof globalThis !== 'undefined' && globalThis.clearInterval) {
      globalThis.clearInterval(flushTimer);
    }
    flushTimer = null;
  }
}

/**
 * Legacy function: Gets current sampler statistics
 * @returns {{
 *   config: typeof samplerConfig;
 *   bufferSize: number;
 *   lastSampleTime: number;
 *   autoFlushActive: boolean;
 * }} Sampler statistics and configuration
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