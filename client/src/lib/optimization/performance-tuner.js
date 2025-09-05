/**
 * @file System optimization and performance tuning enhancements
 * Phase 8: Performance improvements and caching optimizations
 */

/* global setTimeout, setInterval, performance */

/**
 * Performance monitoring metrics
 * @type {Map<string, {totalTime: number, count: number, avgTime: number, maxTime: number, minTime: number}>}
 */
const performanceMetrics = new Map();

/**
 * Advanced caching layer with intelligent eviction
 * @type {Map<string, {data: any, timestamp: number, accessCount: number, lastAccessed: number, ttl: number}>}
 */
const enhancedCache = new Map();

/**
 * Cache configuration settings
 */
const CACHE_CONFIG = {
  MAX_CACHE_SIZE: 200,          // Increased from 50
  DEFAULT_TTL: 10 * 60 * 1000,  // 10 minutes (increased from 5)
  CLEANUP_INTERVAL: 2 * 60 * 1000, // 2 minutes
  LRU_EVICTION_RATIO: 0.2       // Remove 20% of least used when at capacity
};

/**
 * Performance tracking decorators
 */
let performanceCleanupInterval = null;

/**
 * Initialize performance monitoring and cache cleanup
 */
function initializePerformanceMonitoring() {
  if (performanceCleanupInterval) return;
  
  performanceCleanupInterval = setInterval(() => {
    cleanupExpiredCache();
    optimizePerformanceMetrics();
  }, CACHE_CONFIG.CLEANUP_INTERVAL);
  
  console.log('[Performance] Monitoring initialized');
}

/**
 * Performance measurement wrapper for functions
 * @param {string} operationName - Name of the operation being measured
 * @param {Function} operation - Function to measure
 * @param {any[]} args - Arguments for the function
 * @returns {Promise<any>} Result of the operation
 */
export async function measurePerformance(operationName, operation, ...args) {
  const startTime = performance.now();
  
  try {
    const result = await operation(...args);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    updatePerformanceMetrics(operationName, duration);
    
    // Log slow operations
    if (duration > 1000) { // More than 1 second
      console.warn(`[Performance] Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    updatePerformanceMetrics(`${operationName}_error`, duration);
    throw error;
  }
}

/**
 * Update performance metrics for an operation
 * @param {string} operationName - Name of the operation
 * @param {number} duration - Duration in milliseconds
 */
function updatePerformanceMetrics(operationName, duration) {
  if (!performanceMetrics.has(operationName)) {
    performanceMetrics.set(operationName, {
      totalTime: 0,
      count: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity
    });
  }
  
  const metrics = performanceMetrics.get(operationName);
  metrics.totalTime += duration;
  metrics.count += 1;
  metrics.avgTime = metrics.totalTime / metrics.count;
  metrics.maxTime = Math.max(metrics.maxTime, duration);
  metrics.minTime = Math.min(metrics.minTime, duration);
}

/**
 * Advanced cache with intelligent eviction and access patterns
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} customTTL - Custom TTL in milliseconds
 * @returns {boolean} Whether the data was cached successfully
 */
export function setCacheWithIntelligence(key, data, customTTL = CACHE_CONFIG.DEFAULT_TTL) {
  const now = Date.now();
  
  // Check if we need to evict items before adding new one
  if (enhancedCache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
    performIntelligentEviction();
  }
  
  enhancedCache.set(key, {
    data,
    timestamp: now,
    accessCount: 0,
    lastAccessed: now,
    ttl: customTTL
  });
  
  return true;
}

/**
 * Retrieve data from enhanced cache with access tracking
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if not found/expired
 */
export function getCacheWithIntelligence(key) {
  const cached = enhancedCache.get(key);
  
  if (!cached) {
    return null;
  }
  
  const now = Date.now();
  
  // Check if expired
  if (now - cached.timestamp > cached.ttl) {
    enhancedCache.delete(key);
    return null;
  }
  
  // Update access patterns
  cached.accessCount++;
  cached.lastAccessed = now;
  
  return cached.data;
}

/**
 * Intelligent cache eviction based on access patterns and age
 */
function performIntelligentEviction() {
  const now = Date.now();
  const entries = Array.from(enhancedCache.entries());
  
  // Score each entry for eviction (lower score = more likely to evict)
  const scoredEntries = entries.map(([key, cached]) => {
    const age = now - cached.timestamp;
    const timeSinceLastAccess = now - cached.lastAccessed;
    const accessFrequency = cached.accessCount / (age / (60 * 1000)); // Access per minute
    
    // Scoring algorithm: recent access and frequency are good, age is bad
    const score = (accessFrequency * 100) - (timeSinceLastAccess / 1000) - (age / 10000);
    
    return { key, score, cached };
  });
  
  // Sort by score (ascending - lowest scores evicted first)
  scoredEntries.sort((a, b) => a.score - b.score);
  
  // Remove the lowest scoring entries
  const evictionCount = Math.floor(CACHE_CONFIG.MAX_CACHE_SIZE * CACHE_CONFIG.LRU_EVICTION_RATIO);
  for (let i = 0; i < evictionCount && i < scoredEntries.length; i++) {
    enhancedCache.delete(scoredEntries[i].key);
  }
  
  console.log(`[Cache] Evicted ${evictionCount} entries using intelligent algorithm`);
}

/**
 * Clean up expired cache entries
 */
function cleanupExpiredCache() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, cached] of enhancedCache.entries()) {
    if (now - cached.timestamp > cached.ttl) {
      enhancedCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[Cache] Cleaned up ${cleanedCount} expired entries`);
  }
}

/**
 * Optimize performance metrics storage
 */
function optimizePerformanceMetrics() {
  // Keep only the most recent 100 operation types to prevent memory leak
  if (performanceMetrics.size > 100) {
    const entries = Array.from(performanceMetrics.entries());
    const toDelete = entries.slice(0, entries.length - 100);
    
    for (const [key] of toDelete) {
      performanceMetrics.delete(key);
    }
  }
}

/**
 * Memory usage optimization for large objects
 * @param {any} data - Data to optimize
 * @returns {any} Optimized data structure
 */
export function optimizeMemoryUsage(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  // Deep clone to avoid modifying original
  const optimized = JSON.parse(JSON.stringify(data));
  
  // Remove null/undefined values to save space
  function removeEmpty(obj) {
    if (Array.isArray(obj)) {
      return obj.filter(item => item !== null && item !== undefined).map(removeEmpty);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined) {
          cleaned[key] = removeEmpty(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }
  
  return removeEmpty(optimized);
}

/**
 * Batch processing optimization for multiple operations
 * @param {any[]} items - Items to process
 * @param {(item: any, index?: number) => any} processor - Processing function
 * @param {number} batchSize - Size of each batch
 * @param {number} delayBetweenBatches - Delay in milliseconds between batches
 * @returns {Promise<any[]>} Results from all batches
 */
export async function processBatches(items, processor, batchSize = 10, delayBetweenBatches = 0) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchStartTime = performance.now();
    
    try {
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
      
      const batchTime = performance.now() - batchStartTime;
      updatePerformanceMetrics('batch_processing', batchTime);
      
      // Optional delay between batches to prevent overwhelming the system
      if (delayBetweenBatches > 0 && i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    } catch (error) {
      console.error(`[Batch Processing] Error in batch starting at index ${i}:`, error);
      throw error;
    }
  }
  
  return results;
}

/**
 * Get comprehensive performance report
 * @returns {object} Performance metrics and cache statistics
 */
export function getPerformanceReport() {
  const now = Date.now();
  
  // Performance metrics summary
  const metricsReport = {};
  for (const [operation, metrics] of performanceMetrics.entries()) {
    metricsReport[operation] = {
      avgTime: Math.round(metrics.avgTime * 100) / 100,
      maxTime: Math.round(metrics.maxTime * 100) / 100,
      minTime: Math.round(metrics.minTime * 100) / 100,
      totalCalls: metrics.count,
      totalTime: Math.round(metrics.totalTime * 100) / 100
    };
  }
  
  // Cache statistics
  const cacheStats = {
    size: enhancedCache.size,
    maxSize: CACHE_CONFIG.MAX_CACHE_SIZE,
    utilization: Math.round((enhancedCache.size / CACHE_CONFIG.MAX_CACHE_SIZE) * 100),
    entries: []
  };
  
  // Cache entry details
  for (const [key, cached] of enhancedCache.entries()) {
    const age = now - cached.timestamp;
    const timeSinceAccess = now - cached.lastAccessed;
    
    cacheStats.entries.push({
      key,
      ageMinutes: Math.round(age / (60 * 1000)),
      accessCount: cached.accessCount,
      minutesSinceAccess: Math.round(timeSinceAccess / (60 * 1000)),
      ttlMinutes: Math.round(cached.ttl / (60 * 1000))
    });
  }
  
  // Sort cache entries by access count (descending)
  cacheStats.entries.sort((a, b) => b.accessCount - a.accessCount);
  
  return {
    timestamp: new Date().toISOString(),
    performance: metricsReport,
    cache: cacheStats,
    memoryEstimate: estimateMemoryUsage()
  };
}

/**
 * Estimate memory usage of performance monitoring systems
 * @returns {object} Memory usage estimates
 */
function estimateMemoryUsage() {
  // Rough estimates in bytes
  const metricsMemory = performanceMetrics.size * 200; // ~200 bytes per metric entry
  const cacheMemory = enhancedCache.size * 1000; // ~1KB per cache entry (rough average)
  
  return {
    performanceMetrics: Math.round(metricsMemory / 1024), // KB
    cache: Math.round(cacheMemory / 1024), // KB
    total: Math.round((metricsMemory + cacheMemory) / 1024) // KB
  };
}

/**
 * Reset all performance monitoring data
 * @param {boolean} includeCache - Whether to also clear the cache
 */
export function resetPerformanceData(includeCache = false) {
  performanceMetrics.clear();
  
  if (includeCache) {
    enhancedCache.clear();
  }
  
  console.log('[Performance] Monitoring data reset');
}

/**
 * Optimize specific operation based on historical performance
 * @param {string} operationName - Name of the operation to optimize
 * @returns {object} Optimization recommendations
 */
export function getOptimizationRecommendations(operationName) {
  const metrics = performanceMetrics.get(operationName);
  
  if (!metrics) {
    return { recommendations: ["No performance data available for this operation"] };
  }
  
  const recommendations = [];
  
  // Analyze performance patterns
  if (metrics.avgTime > 1000) {
    recommendations.push("Consider breaking this operation into smaller chunks");
    recommendations.push("Implement caching if this operation involves repeated calculations");
  }
  
  if (metrics.maxTime > metrics.avgTime * 3) {
    recommendations.push("High variance detected - investigate outlier cases");
    recommendations.push("Consider implementing timeout handling");
  }
  
  if (metrics.count > 1000 && metrics.avgTime > 100) {
    recommendations.push("High frequency operation with significant cost - prime candidate for optimization");
    recommendations.push("Consider implementing batch processing");
  }
  
  return {
    operationName,
    currentPerformance: {
      avgTime: Math.round(metrics.avgTime * 100) / 100,
      maxTime: Math.round(metrics.maxTime * 100) / 100,
      minTime: Math.round(metrics.minTime * 100) / 100,
      callCount: metrics.count
    },
    recommendations
  };
}

// Initialize performance monitoring when module loads
initializePerformanceMonitoring();