/**
 * Anonymization Utility for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: This module removes personally identifiable information (PII)
 * from medical queries before logging. All data processing follows privacy-first principles.
 * 
 * @file Anonymizes user input by removing names, emails, phone numbers, and entities
 */

/**
 * Regular expressions for detecting common PII patterns
 * @private
 */
const PII_PATTERNS = {
  /** Email addresses */
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  /** Phone numbers (various formats) */
  phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  /** Social Security Numbers */
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  /** Common name patterns (first + last name) */
  names: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
  /** Medical record numbers */
  mrn: /\b(MRN|ID|Patient)\s*[:#]?\s*[A-Z0-9-]{6,}\b/gi,
  /** Addresses (simplified pattern) */
  address: /\b\d+\s+[A-Za-z0-9\s,.-]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|place|pl)\b/gi
};

/**
 * Common replacement tokens for anonymized content
 * @private
 */
const REPLACEMENT_TOKENS = {
  email: "[EMAIL_REDACTED]",
  phone: "[PHONE_REDACTED]", 
  ssn: "[SSN_REDACTED]",
  names: "[NAME_REDACTED]",
  mrn: "[PATIENT_ID_REDACTED]",
  address: "[ADDRESS_REDACTED]"
};

/**
 * Anonymizes text by removing or replacing personally identifiable information
 * @param {string} text - Input text to anonymize
 * @param {object} options - Anonymization options
 * @param {boolean} options.preserveStructure - Whether to preserve text structure with placeholders
 * @returns {string} Anonymized text with PII removed or replaced
 */
export function anonymizeText(text, options = { preserveStructure: true }) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let anonymized = text;
  
  // Apply each PII pattern replacement
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (options.preserveStructure) {
      anonymized = anonymized.replace(pattern, REPLACEMENT_TOKENS[type]);
    } else {
      anonymized = anonymized.replace(pattern, '');
    }
  }

  // Remove extra whitespace created by removals
  if (!options.preserveStructure) {
    anonymized = anonymized.replace(/\s+/g, ' ').trim();
  }

  return anonymized;
}

/**
 * Anonymizes a complete query object for logging
 * @param {object} queryData - Query data object to anonymize
 * @param {string} queryData.userInput - User's input text
 * @param {string} queryData.finalPrompt - Final enhanced prompt
 * @param {string} [queryData.llmResponse] - LLM response if available
 * @returns {object & { _anonymized: string }} Anonymized query data object
 */
export function anonymizeQueryData(queryData) {
  if (!queryData || typeof queryData !== 'object') {
    return queryData;
  }

  /** @type {any} */
  const anonymized = { ...queryData };
  
  // Anonymize text fields
  const textFields = ['userInput', 'finalPrompt', 'enhancedPrompt', 'llmResponse'];
  
  for (const field of textFields) {
    if (anonymized[field] && typeof anonymized[field] === 'string') {
      anonymized[field] = anonymizeText(anonymized[field]);
    }
  }

  // Add anonymization timestamp
  anonymized._anonymized = new Date().toISOString();
  
  return anonymized;
}

/**
 * Checks if text contains potential PII that should be flagged for review
 * @param {string} text - Text to check for PII
 * @returns {object} Analysis result with PII detection flags
 */
export function detectPII(text) {
  if (!text || typeof text !== 'string') {
    return { hasPII: false, detectedTypes: [] };
  }

  const detectedTypes = [];
  
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(text)) {
      detectedTypes.push(type);
    }
  }

  return {
    hasPII: detectedTypes.length > 0,
    detectedTypes,
    needsReview: detectedTypes.length > 2 || detectedTypes.includes('ssn')
  };
}

/**
 * Sanitizes metadata object to ensure no PII in structured data
 * @param {object} metadata - Metadata object to sanitize
 * @returns {object} Sanitized metadata object
 */
export function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return metadata;
  }

  const sanitized = { ...metadata };
  
  // Remove any fields that might contain PII
  const sensitiveFields = ['userName', 'userEmail', 'sessionId', 'ipAddress'];
  sensitiveFields.forEach(field => {
    delete sanitized[field];
  });

  // Anonymize any string values that might contain PII
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      const piiCheck = detectPII(value);
      if (piiCheck.hasPII) {
        sanitized[key] = anonymizeText(value);
      }
    }
  }

  return sanitized;
}