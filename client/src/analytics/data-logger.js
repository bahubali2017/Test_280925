/**
 * Data Logger for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: All logged data is anonymized before storage. 
 * No personally identifiable information is preserved in training datasets.
 * 
 * @file Core logging utility for medical query analytics and training data
 */

import { anonymizeQueryData } from './anonymizer.js';

/**
 * Path to the main training dataset file
 * @private
 * @type {string}
 */
const DATASET_PATH = 'client/src/training-dataset/layer-decisions.jsonl';

/**
 * @typedef {{
 *   userInput: string;
 *   enhancedPrompt: string;
 *   finalPrompt?: string;
 *   llmResponse?: string;
 *   triageLevel: "emergency" | "urgent" | "non_urgent";
 *   isHighRisk: boolean;
 *   atd?: string[];
 *   disclaimers?: string[];
 *   suggestions?: string[];
 *   metadata: any;
 * }} AIQueryResult
 */

/**
 * Logs a processed query to the training dataset with full anonymization
 * @param {AIQueryResult} queryResult - Complete query processing result
 * @param {string} responseCategory - Response categorization
 * @returns {Promise<boolean>} Success status of logging operation
 */
export async function logQueryToDataset(queryResult, responseCategory = "generic") {
  try {
    // Validate input parameters
    if (!queryResult || typeof queryResult !== 'object') {
      console.warn('[data-logger] Invalid query result provided for logging');
      return false;
    }

    // Create the log entry structure
    const logEntry = {
      timestamp: new Date().toISOString(),
      userInput: queryResult.userInput || '',
      finalPrompt: queryResult.enhancedPrompt || '',
      llmResponse: queryResult.llmResponse || '',
      triageLevel: queryResult.triageLevel || 'unknown',
      isHighRisk: Boolean(queryResult.isHighRisk),
      responseCategory: responseCategory,
      metadata: {
        processingTime: queryResult.metadata?.processingTime || 0,
        intentConfidence: queryResult.metadata?.intentConfidence || 0,
        bodySystem: queryResult.metadata?.bodySystem || 'unknown',
        stageTimings: queryResult.metadata?.stageTimings || {},
        // Additional metadata fields
        hasAtd: Boolean(queryResult.atd || false),
        disclaimerCount: Array.isArray(queryResult.disclaimers) ? queryResult.disclaimers.length : 0,
        suggestionCount: Array.isArray(queryResult.suggestions) ? queryResult.suggestions.length : 0
      }
    };

    // Anonymize the complete log entry
    const anonymizedEntry = anonymizeQueryData(logEntry);
    
    // Convert to JSONL format (one JSON object per line)
    const jsonlLine = JSON.stringify(anonymizedEntry) + '\n';

    // Append to dataset file
    await appendToDatasetFile(jsonlLine);
    
    return true;

  } catch (error) {
    console.error('[data-logger] Failed to log query to dataset:', error.message);
    return false;
  }
}

/**
 * Categorizes an LLM response based on content analysis
 * @param {string} response - LLM response text to categorize
 * @param {object} context - Query context for categorization hints
 * @param {boolean} context.isHighRisk - Whether query was high risk
 * @param {string} context.triageLevel - Triage level classification
 * @returns {string} Categorized response type
 */
export function categorizeResponse(response, context = { isHighRisk: false, triageLevel: 'unknown' }) {
  if (!response || typeof response !== 'string') {
    return "fallback";
  }

  const lowerResponse = response.toLowerCase();
  
  // Flag responses for manual review
  if (context.isHighRisk || context.triageLevel === 'emergency') {
    return "flagged";
  }

  // Educational medical content
  const educationalKeywords = [
    'symptom', 'condition', 'treatment', 'diagnosis', 'medical', 'health',
    'consult', 'doctor', 'physician', 'healthcare', 'medication'
  ];
  
  const hasEducationalContent = educationalKeywords.some(keyword => 
    lowerResponse.includes(keyword)
  );

  if (hasEducationalContent) {
    return "educational";
  }

  // Generic conversational responses
  const genericKeywords = [
    'hello', 'thanks', 'welcome', 'help', 'assist', 'understand'
  ];
  
  const hasGenericContent = genericKeywords.some(keyword => 
    lowerResponse.includes(keyword)
  );

  if (hasGenericContent) {
    return "generic";
  }

  // Default to educational for medical queries
  return "educational";
}

/**
 * Appends data to the JSONL dataset file with error handling
 * @private
 * @param {string} jsonlData - JSONL formatted data to append
 * @returns {Promise<void>}
 */
async function appendToDatasetFile(jsonlData) {
  // In a Replit environment, we need to handle file operations carefully
  if (typeof window !== 'undefined') {
    // Browser environment - cannot write files directly
    console.warn('[data-logger] Browser environment detected - dataset logging disabled');
    return;
  }

  try {
    // For Node.js environment
    const fs = await import('fs');
    const path = await import('path');
    
    // Ensure directory exists
    const dir = path.dirname(DATASET_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Append to file
    fs.appendFileSync(DATASET_PATH, jsonlData, 'utf8');
    
  } catch {
    console.error('[data-logger] File operation failed');
    // Gracefully degrade - don't throw in production
  }
}

/**
 * Retrieves dataset statistics for monitoring
 * @returns {Promise<object>} Dataset statistics object
 */
export async function getDatasetStats() {
  try {
    if (typeof window !== 'undefined') {
      return { error: 'Not available in browser environment' };
    }

    const fs = await import('fs');
    
    if (!fs.existsSync(DATASET_PATH)) {
      return { 
        totalEntries: 0, 
        fileSize: 0, 
        lastModified: null 
      };
    }

    const stats = fs.statSync(DATASET_PATH);
    const content = fs.readFileSync(DATASET_PATH, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);

    return {
      totalEntries: lines.length,
      fileSize: stats.size,
      lastModified: stats.mtime.toISOString(),
      filePath: DATASET_PATH
    };

  } catch {
    console.error('[data-logger] Failed to get dataset stats');
    return { error: 'Failed to get stats' };
  }
}

/**
 * Validates JSONL format of a dataset entry
 * @param {string} jsonlLine - JSONL line to validate
 * @returns {boolean} Whether the line is valid JSONL
 */
export function validateJSONL(jsonlLine) {
  try {
    const parsed = JSON.parse(jsonlLine.trim());
    
    // Validate required fields
    const requiredFields = ['timestamp', 'userInput', 'finalPrompt', 'triageLevel', 'responseCategory'];
    
    for (const field of requiredFields) {
      if (!(field in parsed)) {
        return false;
      }
    }

    return true;
    
  } catch {
    return false;
  }
}