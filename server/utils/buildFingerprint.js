/**
 * @file Build Fingerprinting Utility
 * Generates unique deployment identifiers for copy tracing
 */

import crypto from 'crypto';

/**
 * Generate a unique build fingerprint
 * @returns {string} Unique build identifier
 */
export function generateBuildFingerprint() {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const nodeVersion = process.version;
  const platform = process.platform;
  
  const fingerprintData = {
    timestamp,
    random: randomBytes,
    nodeVersion,
    platform,
    version: '1.0.0'
  };
  
  return Buffer.from(JSON.stringify(fingerprintData)).toString('base64');
}

/**
 * Get build information for injection into frontend
 * @returns {object} Build information object
 */
export function getBuildInfo() {
  const fingerprint = generateBuildFingerprint();
  const buildTime = new Date().toISOString();
  const commit = process.env.REPL_ID || 'local-dev';
  
  return {
    fingerprint,
    buildTime,
    commit,
    environment: process.env.NODE_ENV || 'development'
  };
}

/**
 * Create build fingerprint middleware
 * Injects build info into HTML responses
 * @param req
 * @param res
 * @param next
 */
export function buildFingerprintMiddleware(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(body) {
    if (res.get('Content-Type')?.includes('text/html') && typeof body === 'string') {
      const buildInfo = getBuildInfo();
      const fingerprintComment = `<!-- Build: ${buildInfo.fingerprint} | Time: ${buildInfo.buildTime} | Env: ${buildInfo.environment} -->`;
      
      // Inject before closing head tag
      body = body.replace('</head>', `${fingerprintComment}\n</head>`);
    }
    
    originalSend.call(this, body);
  };
  
  next();
}