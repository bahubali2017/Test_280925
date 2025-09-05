/**
 * Metadata Logger for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: Metadata logging excludes all PII and focuses on system performance
 * and quality metrics for continuous improvement of medical AI responses.
 * 
 * @file Enhanced metadata logging with detailed timing and quality metrics
 */

import { LogRotation } from './enums.js';
import { sanitizeMetadata } from './anonymizer.js';

/**
 * Base path for metadata log files
 * @private
 * @type {string}
 */
const LOGS_BASE_PATH = 'client/src/training-dataset/logs';

/**
 * Current log rotation configuration
 * @private
 */
let rotationConfig = {
  /** @type {"daily" | "hourly" | "weekly"} */
  interval: LogRotation.DAILY,
  maxFiles: 30,
  compress: false
};

/**
 * Logs enriched metadata with detailed timing and quality metrics
 * @param {object} queryResult - Complete query processing result
 * @param {object} additionalMetrics - Additional performance metrics
 * @param {number} additionalMetrics.parseTime - Intent parsing time in ms
 * @param {number} additionalMetrics.triageTime - Triage processing time in ms  
 * @param {number} additionalMetrics.promptTime - Prompt enhancement time in ms
 * @param {number} additionalMetrics.totalTime - Total processing time in ms
 * @returns {Promise<boolean>} Success status of metadata logging
 */
export async function logEnrichedMetadata(queryResult, additionalMetrics = { parseTime: 0, triageTime: 0, promptTime: 0, totalTime: 0 }) {
  try {
    const timestamp = new Date();
    
    // Create enriched metadata object
    const enrichedMetadata = {
      timestamp: timestamp.toISOString(),
      sessionId: generateSessionId(),
      
      // Performance metrics
      timing: {
        parseTime: additionalMetrics.parseTime || queryResult.metadata?.stageTimings?.parseIntent || 0,
        triageTime: additionalMetrics.triageTime || queryResult.metadata?.stageTimings?.triage || 0,
        promptTime: additionalMetrics.promptTime || queryResult.metadata?.stageTimings?.enhancePrompt || 0,
        totalTime: additionalMetrics.totalTime || queryResult.metadata?.processingTime || 0
      },
      
      // Quality metrics
      quality: {
        intentConfidence: queryResult.metadata?.intentConfidence || 0,
        triageLevel: queryResult.triageLevel || 'unknown',
        isHighRisk: Boolean(queryResult.isHighRisk),
        hasAtdNotices: Boolean(queryResult.atd),
        bodySystemDetected: queryResult.metadata?.bodySystem || 'unknown'
      },
      
      // Response characteristics
      response: {
        disclaimerCount: Array.isArray(queryResult.disclaimers) ? queryResult.disclaimers.length : 0,
        suggestionCount: Array.isArray(queryResult.suggestions) ? queryResult.suggestions.length : 0,
        enhancedPromptLength: queryResult.enhancedPrompt ? queryResult.enhancedPrompt.length : 0,
        userInputLength: queryResult.userInput ? queryResult.userInput.length : 0
      },
      
      // System health indicators
      system: {
        memoryUsage: getMemoryUsage(),
        errorFlags: detectErrorConditions(queryResult),
        performanceRating: calculatePerformanceRating(queryResult, additionalMetrics)
      }
    };

    // Sanitize metadata to ensure no PII
    const sanitizedMetadata = sanitizeMetadata(enrichedMetadata);
    
    // Add missing field flags
    sanitizedMetadata.validation = flagMissingFields(queryResult);
    
    // Write to rotating log file
    await writeToLogFile(sanitizedMetadata, timestamp);
    
    return true;

  } catch (error) {
    console.error('[metadata-logger] Failed to log enriched metadata:', error.message);
    return false;
  }
}

/**
 * Flags missing or incomplete key fields in query result
 * @private
 * @param {object} queryResult - Query result to validate
 * @returns {object} Validation flags object
 */
function flagMissingFields(queryResult) {
  const validation = {
    missingFields: [],
    incompleteFields: [],
    qualityScore: 1.0
  };

  // Check required fields
  const requiredFields = ['userInput', 'enhancedPrompt', 'triageLevel', 'metadata'];
  
  for (const field of requiredFields) {
    if (!queryResult[field]) {
      validation.missingFields.push(field);
      validation.qualityScore -= 0.2;
    }
  }

  // Check metadata completeness
  if (queryResult.metadata) {
    const metadataFields = ['processingTime', 'intentConfidence', 'bodySystem'];
    
    for (const field of metadataFields) {
      if (queryResult.metadata[field] === undefined || queryResult.metadata[field] === null) {
        validation.incompleteFields.push(`metadata.${field}`);
        validation.qualityScore -= 0.1;
      }
    }
  }

  // Ensure quality score doesn't go below 0
  validation.qualityScore = Math.max(0, validation.qualityScore);
  
  return validation;
}

/**
 * Detects error conditions in query processing
 * @private
 * @param {object} queryResult - Query result to analyze
 * @returns {Array<string>} Array of detected error conditions
 */
function detectErrorConditions(queryResult) {
  const errors = [];

  // Check for processing failures
  if (!queryResult.metadata?.processingTime || queryResult.metadata.processingTime > 5000) {
    errors.push('slow_processing');
  }

  // Check for low confidence
  if (queryResult.metadata?.intentConfidence < 0.3) {
    errors.push('low_confidence');
  }

  // Check for missing triage
  if (!queryResult.triageLevel || queryResult.triageLevel === 'unknown') {
    errors.push('triage_failure');
  }

  // Check for empty responses
  if (!queryResult.enhancedPrompt || queryResult.enhancedPrompt.length < 50) {
    errors.push('insufficient_enhancement');
  }

  return errors;
}

/**
 * Calculates overall performance rating for the query processing
 * @private
 * @param {object} queryResult - Query result to rate
 * @param {object} additionalMetrics - Additional timing metrics
 * @returns {number} Performance rating from 0.0 to 1.0
 */
function calculatePerformanceRating(queryResult, additionalMetrics) {
  let rating = 1.0;
  
  // Timing performance (30% of rating)
  const totalTime = additionalMetrics.totalTime || queryResult.metadata?.processingTime || 0;
  if (totalTime > 2000) rating -= 0.2;      // Slow
  else if (totalTime > 1000) rating -= 0.1; // Moderate
  
  // Confidence performance (25% of rating)
  const confidence = queryResult.metadata?.intentConfidence || 0;
  if (confidence < 0.5) rating -= 0.15;
  else if (confidence < 0.7) rating -= 0.1;
  
  // Triage accuracy (25% of rating)
  if (!queryResult.triageLevel || queryResult.triageLevel === 'unknown') {
    rating -= 0.2;
  }
  
  // Response completeness (20% of rating)
  if (!queryResult.enhancedPrompt || queryResult.enhancedPrompt.length < 100) {
    rating -= 0.1;
  }
  
  return Math.max(0, rating);
}

/**
 * Writes metadata to a rotating log file
 * @private
 * @param {object} metadata - Metadata to write
 * @param {Date} timestamp - Current timestamp
 * @returns {Promise<void>}
 */
async function writeToLogFile(metadata, timestamp) {
  // Skip file operations in browser environment
  if (typeof window !== 'undefined') {
    console.warn('[metadata-logger] Browser environment - file logging disabled');
    return;
  }

  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Generate log filename based on rotation config
    const logFilename = generateLogFilename(timestamp);
    const logPath = path.join(LOGS_BASE_PATH, logFilename);
    
    // Ensure logs directory exists
    if (!fs.existsSync(LOGS_BASE_PATH)) {
      fs.mkdirSync(LOGS_BASE_PATH, { recursive: true });
    }
    
    // Create log entry
    const logEntry = JSON.stringify(metadata) + '\n';
    
    // Append to log file
    fs.appendFileSync(logPath, logEntry, 'utf8');
    
    // Check if log rotation is needed
    await rotateLogsIfNeeded();
    
  } catch (error) {
    console.error('[metadata-logger] File operation failed:', error.message);
  }
}

/**
 * Generates log filename based on rotation interval and timestamp
 * @private
 * @param {Date} timestamp - Current timestamp
 * @returns {string} Generated log filename
 */
function generateLogFilename(timestamp) {
  const date = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
  
  switch (rotationConfig.interval) {
    case 'hourly': {
      const hour = timestamp.getUTCHours().toString().padStart(2, '0');
      return `metadata-${date}-${hour}.log`;
    }
      
    case 'weekly': {
      const weekStart = getWeekStart(timestamp);
      return `metadata-week-${weekStart}.log`;
    }
      
    case 'daily':
    default:
      return `metadata-${date}.log`;
  }
}

/**
 * Gets the start of the week for a given date
 * @private
 * @param {Date} date - Date to get week start for
 * @returns {string} Week start date in YYYY-MM-DD format
 */
function getWeekStart(date) {
  const weekStart = new Date(date);
  const day = weekStart.getUTCDay();
  const diff = weekStart.getUTCDate() - day;
  weekStart.setUTCDate(diff);
  return weekStart.toISOString().split('T')[0];
}

/**
 * Rotates log files if needed based on configuration
 * @private
 * @returns {Promise<void>}
 */
async function rotateLogsIfNeeded() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    if (!fs.existsSync(LOGS_BASE_PATH)) {
      return;
    }
    
    // Get all log files
    const files = fs.readdirSync(LOGS_BASE_PATH)
      .filter(file => file.startsWith('metadata-') && file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: path.join(LOGS_BASE_PATH, file),
        stats: fs.statSync(path.join(LOGS_BASE_PATH, file))
      }))
      .sort((a, b) => {
        const timeA = a.stats.mtimeMs ?? 0;
        const timeB = b.stats.mtimeMs ?? 0;
        return timeB - timeA; // Newest first
      });
    
    // Remove old files if exceeding maxFiles
    if (files.length > rotationConfig.maxFiles) {
      const filesToDelete = files.slice(rotationConfig.maxFiles);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
      }
    }
    
  } catch (error) {
    console.error('[metadata-logger] Log rotation failed:', error.message);
  }
}

/**
 * Configures log rotation settings
 * @param {object} config - Rotation configuration
 * @param {string} config.interval - Rotation interval
 * @param {number} config.maxFiles - Maximum number of files to keep
 * @param {boolean} config.compress - Whether to compress old files
 * @returns {object} Updated rotation configuration
 */
export function configureLogRotation(config) {
  /** @type {any} */
  const newConfig = { ...rotationConfig, ...config };
  rotationConfig = newConfig;
  return rotationConfig;
}

/**
 * Gets current memory usage metrics
 * @private
 * @returns {object} Memory usage information
 */
function getMemoryUsage() {
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024) // MB
      };
    }
    
    return { available: false };
    
  } catch {
    return { error: 'Unable to get memory usage' };
  }
}

/**
 * Generates a session ID for grouping related queries
 * @private
 * @returns {string} Generated session ID
 */
function generateSessionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `session_${timestamp}_${random}`;
}

/**
 * Gets metadata logger statistics
 * @returns {Promise<object>} Logger statistics and configuration
 */
export async function getLoggerStats() {
  try {
    if (typeof window !== 'undefined') {
      return { error: 'Not available in browser environment' };
    }

    const fs = await import('fs');
    const path = await import('path');
    
    if (!fs.existsSync(LOGS_BASE_PATH)) {
      return {
        logFiles: 0,
        totalSize: 0,
        rotationConfig: rotationConfig
      };
    }
    
    const files = fs.readdirSync(LOGS_BASE_PATH)
      .filter(file => file.startsWith('metadata-') && file.endsWith('.log'));
    
    let totalSize = 0;
    for (const file of files) {
      const stats = fs.statSync(path.join(LOGS_BASE_PATH, file));
      totalSize += stats.size;
    }
    
    return {
      logFiles: files.length,
      totalSize: Math.round(totalSize / 1024), // KB
      rotationConfig: rotationConfig,
      logsPath: LOGS_BASE_PATH
    };
    
  } catch (error) {
    return { error: error.message };
  }
}