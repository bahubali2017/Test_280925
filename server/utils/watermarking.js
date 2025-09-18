/* global Buffer */
/**
 * @file AI Output Watermarking Utility
 * Implements zero-width character injection for AI response tracing
 */

/**
 * Zero-width Unicode characters for invisible watermarking
 */
const ZERO_WIDTH_CHARS = {
  SPACE: '\u200B',      // Zero Width Space
  JOINER: '\u200D',     // Zero Width Joiner
  NON_JOINER: '\u200C', // Zero Width Non-Joiner
  LTR_MARK: '\u200E',   // Left-to-Right Mark
  RTL_MARK: '\u200F'    // Right-to-Left Mark
};

/**
 * Generate a unique watermark token for a session
 * @param {string} sessionId - The session identifier
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Base64 encoded watermark
 */
function generateWatermarkToken(sessionId, timestamp) {
  const data = {
    session: sessionId,
    timestamp: timestamp,
    version: '1.0'
  };
  
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Convert text to zero-width character sequence
 * @param {string} text - Text to encode
 * @returns {string} Zero-width character sequence
 */
function textToZeroWidth(text) {
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    let result = '';
    
    // Convert character code to binary and map to zero-width chars
    const binary = code.toString(2).padStart(8, '0');
    for (const bit of binary) {
      result += bit === '1' ? ZERO_WIDTH_CHARS.JOINER : ZERO_WIDTH_CHARS.NON_JOINER;
    }
    
    return result + ZERO_WIDTH_CHARS.SPACE;
  }).join('');
}

/**
 * Inject watermark into AI response text
 * @param {string} text - Original AI response
 * @param {string} sessionId - Session identifier
 * @param {object} options - Watermarking options
 * @returns {string} Watermarked text
 */
export function injectWatermark(text, sessionId, options = {}) {
  if (!text || !sessionId) {
    console.warn('[WATERMARK] Missing text or sessionId for watermarking');
    return text;
  }
  
  const {
    enabled = process.env.WATERMARKING_ENABLED === 'true',
    frequency = 3 // Insert watermark every N sentences
  } = options;
  
  if (!enabled) {
    return text;
  }
  
  try {
    const timestamp = new Date().toISOString();
    const watermarkToken = generateWatermarkToken(sessionId, timestamp);
    const zeroWidthWatermark = textToZeroWidth(watermarkToken.substring(0, 16)); // Limit length
    
    // Split text into sentences and inject watermark
    const sentences = text.split(/([.!?]+\s)/);
    let watermarkedText = '';
    
    for (let i = 0; i < sentences.length; i++) {
      watermarkedText += sentences[i];
      
      // Inject watermark after every Nth sentence
      if (i > 0 && i % (frequency * 2) === 0 && sentences[i].match(/[.!?]+\s/)) {
        watermarkedText += zeroWidthWatermark;
      }
    }
    
    // Log watermarking for audit trail
    console.log(`[WATERMARK] Applied to session ${sessionId}, token: ${watermarkToken.substring(0, 8)}...`);
    
    return watermarkedText;
    
  } catch (error) {
    console.error('[WATERMARK] Error applying watermark:', error);
    return text; // Return original text if watermarking fails
  }
}

/**
 * Extract watermark from text (for verification)
 * @param {string} text - Watermarked text
 * @returns {object|null} Extracted watermark data or null
 */
export function extractWatermark(text) {
  try {
    // Find zero-width character sequences
    const zeroWidthPattern = new RegExp(`(?:${Object.values(ZERO_WIDTH_CHARS).join('|')})+`, 'gu');
    const matches = text.match(zeroWidthPattern);
    
    if (!matches || matches.length === 0) {
      return null;
    }
    
    // Decode the first watermark found
    const watermarkSequence = matches[0];
    // Implementation would reverse the textToZeroWidth process
    // This is complex and mainly for forensic analysis
    
    return {
      found: true,
      sequence: watermarkSequence,
      length: watermarkSequence.length
    };
    
  } catch (error) {
    console.error('[WATERMARK] Error extracting watermark:', error);
    return null;
  }
}

/**
 * Hash and log AI response for audit trail
 * @param {string} response - AI response text
 * @param {string} sessionId - Session identifier
 * @param {object} metadata - Additional metadata
 * @returns {Promise<string|null>} Response hash or null if error
 */
export async function logAIResponse(response, sessionId, metadata = {}) {
  try {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(response).digest('hex');
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId,
      responseHash: hash,
      responseLength: response.length,
      watermarked: metadata.watermarked || false,
      model: metadata.model || 'unknown',
      ...metadata
    };
    
    // In production, this would go to a secure logging service
    console.log('[AI-AUDIT]', JSON.stringify(logEntry));
    
    return hash;
    
  } catch (error) {
    console.error('[AI-AUDIT] Error logging response:', error);
    return null;
  }
}