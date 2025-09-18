/* global setInterval */
/**
 * @file Enhanced Rate Limiting Middleware for Anamnesis Medical AI Platform
 * 
 * CONFIGURATION MODES:
 * - BETA TESTING MODE: Set DISABLE_RATE_LIMIT=true to completely bypass all rate limiting
 * - PRODUCTION MODE: Full rate limiting with tiered access controls
 * - DEVELOPMENT MODE: Relaxed limits for localhost development
 * 
 * MONETIZATION READY:
 * - User-based rate limiting infrastructure in place
 * - Token-based limits for different subscription tiers
 * - WebSocket connection limits for real-time features
 * - Easy configuration for premium access levels
 * 
 * ENVIRONMENT VARIABLES:
 * - DISABLE_RATE_LIMIT=true: Completely disables all rate limiting (BETA MODE)
 * - NODE_ENV=production: Enables stricter production limits
 * 
 * @version 1.2.0
 * @author Anamnesis Development Team
 */

/**
 * Masks sensitive tokens for safe logging
 * @param {string} token - Raw token to mask
 * @returns {string} Masked token showing only first 4 and last 4 characters
 */
function maskToken(token) {
  if (!token || typeof token !== 'string' || token === 'unknown') {
    return token;
  }
  
  if (token.length <= 8) {
    return '*'.repeat(token.length);
  }
  
  return token.slice(0, 4) + '*'.repeat(token.length - 8) + token.slice(-4);
}

/**
 * Simple in-memory rate limiter
 */
class RateLimiter {
  constructor() {
    /**
     * @type {Map<string, Array<number>>}
     */
    this.ipRequests = new Map();
    
    /**
     * @type {Map<string, Array<number>>}
     */
    this.tokenRequests = new Map();
    
    /**
     * @type {Map<string, number>}
     */
    this.webSocketConnections = new Map();
    
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }
  
  /**
   * Check IP-based rate limit
   * @param {string} ip - Client IP address
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} Whether request is allowed
   */
  checkIPLimit(ip, maxRequests, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.ipRequests.has(ip)) {
      this.ipRequests.set(ip, []);
    }
    
    const requests = this.ipRequests.get(ip);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => time > windowStart);
    this.ipRequests.set(ip, recentRequests);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    return true;
  }
  
  /**
   * Check token-based rate limit
   * @param {string} token - Admin token (masked)
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} Whether request is allowed
   */
  checkTokenLimit(token, maxRequests, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.tokenRequests.has(token)) {
      this.tokenRequests.set(token, []);
    }
    
    const requests = this.tokenRequests.get(token);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => time > windowStart);
    this.tokenRequests.set(token, recentRequests);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    return true;
  }
  
  /**
   * Check WebSocket connection limit
   * @param {string} token - Admin token (masked)
   * @param {number} maxConnections - Maximum concurrent connections
   * @returns {boolean} Whether connection is allowed
   */
  checkWebSocketLimit(token, maxConnections) {
    const currentConnections = this.webSocketConnections.get(token) || 0;
    return currentConnections < maxConnections;
  }
  
  /**
   * Increment WebSocket connection count
   * @param {string} token - Admin token (masked)
   */
  incrementWebSocketConnections(token) {
    const current = this.webSocketConnections.get(token) || 0;
    this.webSocketConnections.set(token, current + 1);
  }
  
  /**
   * Decrement WebSocket connection count
   * @param {string} token - Admin token (masked)
   */
  decrementWebSocketConnections(token) {
    const current = this.webSocketConnections.get(token) || 0;
    if (current > 0) {
      this.webSocketConnections.set(token, current - 1);
    }
  }
  
  /**
   * Clean up old rate limit entries
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    // Clean IP requests
    for (const [ip, requests] of this.ipRequests.entries()) {
      const recentRequests = requests.filter(time => now - time < maxAge);
      if (recentRequests.length === 0) {
        this.ipRequests.delete(ip);
      } else {
        this.ipRequests.set(ip, recentRequests);
      }
    }
    
    // Clean token requests
    for (const [token, requests] of this.tokenRequests.entries()) {
      const recentRequests = requests.filter(time => now - time < maxAge);
      if (recentRequests.length === 0) {
        this.tokenRequests.delete(token);
      } else {
        this.tokenRequests.set(token, recentRequests);
      }
    }
    
    // Clean up WebSocket connections with 0 count
    for (const [token, count] of this.webSocketConnections.entries()) {
      if (count <= 0) {
        this.webSocketConnections.delete(token);
      }
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * RATE LIMITING CONFIGURATION FOR MONETIZATION
 * 
 * These configurations are designed to support future tiered access models:
 * - Free Tier: Basic limits for general users
 * - Premium Tier: Higher limits for paying customers  
 * - Enterprise Tier: Minimal limits for enterprise clients
 * - Admin Tier: High limits for administrative access
 */
const RATE_LIMIT_TIERS = {
  free: {
    requestsPerMinute: 100,
    requestsPer5Minutes: 300,
    websocketConnections: 2
  },
  premium: {
    requestsPerMinute: 500,
    requestsPer5Minutes: 1500,
    websocketConnections: 5
  },
  enterprise: {
    requestsPerMinute: 2000,
    requestsPer5Minutes: 6000,
    websocketConnections: 10
  },
  admin: {
    requestsPerMinute: 500,
    requestsPer5Minutes: 1500,
    websocketConnections: 5
  }
};

/**
 * Check if rate limiting is globally disabled for beta testing
 * @returns {boolean} True if rate limiting should be bypassed
 */
function isRateLimitingDisabled() {
  return process.env.DISABLE_RATE_LIMIT === 'true';
}

/**
 * Get rate limit configuration for a specific user tier
 * @param {string} tier - User tier (free, premium, enterprise, admin)
 * @returns {object} Rate limit configuration for the tier
 */
function getTierLimits(tier = 'free') {
  return RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.free;
}

// Track logged messages to prevent spam
const loggedMessages = new Set();

/**
 * Log rate limiting action with context (reduced verbosity in beta mode)
 * @param {string} action - Type of rate limiting action
 * @param {string} details - Additional details about the action
 */
function logRateLimitAction(action, details) {
  const mode = isRateLimitingDisabled() ? 'BETA-MODE' : 'PRODUCTION-MODE';
  
  // In beta mode, only log unique messages once to prevent console spam
  if (mode === 'BETA-MODE') {
    const messageKey = `${action}:${details.split(' ')[0]}`;
    if (loggedMessages.has(messageKey)) return;
    loggedMessages.add(messageKey);
  }
  
  console.log(`[RATE-LIMIT] [${mode}] ${action}: ${details}`);
}

/**
 * Rate limiter for system status endpoint (10 req/min per IP)
 * 
 * BETA TESTING: Completely bypassed when DISABLE_RATE_LIMIT=true
 * PRODUCTION: 10 requests per minute per IP address
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object  
 * @param {import('express').NextFunction} next - Next middleware function
 * @returns {void}
 */
export function systemStatusRateLimit(req, res, next) {
  // BETA TESTING MODE: Completely bypass rate limiting
  if (isRateLimitingDisabled()) {
    logRateLimitAction('BYPASS', 'System status endpoint - Beta testing mode active');
    return next();
  }
  
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (!rateLimiter.checkIPLimit(clientIP, 10, 60000)) { // 10 requests per minute
    console.warn(`[RATE-LIMIT] System status rate limit exceeded for IP ${clientIP}`);
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Maximum 10 requests per minute.',
      retryAfter: 60
    });
  }
  
  next();
}

/**
 * Rate limiter for admin endpoints (500 req/min per token)
 * 
 * BETA TESTING: Completely bypassed when DISABLE_RATE_LIMIT=true
 * PRODUCTION: 500 requests per minute per admin token
 * MONETIZATION: Ready for tiered admin access levels
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object  
 * @param {import('express').NextFunction} next - Next middleware function
 * @returns {void}
 */
export function adminEndpointRateLimit(req, res, next) {
  // BETA TESTING MODE: Completely bypass rate limiting
  if (isRateLimitingDisabled()) {
    logRateLimitAction('BYPASS', 'Admin endpoint - Beta testing mode active');
    return next();
  }
  
  const adminToken = req.admin?.token || 'unknown';
  
  if (!rateLimiter.checkTokenLimit(adminToken, 500, 60000)) { // 500 requests per minute
    console.warn(`[RATE-LIMIT] Admin endpoint rate limit exceeded for token ${maskToken(adminToken)}`);
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Maximum 500 requests per minute.',
      retryAfter: 60
    });
  }
  
  next();
}

/**
 * Check WebSocket connection limit (5 concurrent per token)
 * 
 * BETA TESTING: Always allows connection when DISABLE_RATE_LIMIT=true
 * PRODUCTION: Enforces connection limits based on user tier
 * MONETIZATION: Supports different connection limits per subscription tier
 * 
 * @param {string} token - Admin token (masked)
 * @param {string} userTier - User subscription tier (free, premium, enterprise, admin)
 * @returns {boolean} Whether connection is allowed
 */
export function checkWebSocketRateLimit(token, userTier = 'admin') {
  // BETA TESTING MODE: Allow unlimited WebSocket connections
  if (isRateLimitingDisabled()) {
    logRateLimitAction('BYPASS', `WebSocket connection check for token ${maskToken(token)} - Beta testing mode`);
    return true;
  }
  
  const tierLimits = getTierLimits(userTier);
  const allowed = rateLimiter.checkWebSocketLimit(token, tierLimits.websocketConnections);
  
  if (!allowed) {
    logRateLimitAction('BLOCK', `WebSocket connection limit exceeded for ${userTier} tier token ${maskToken(token)}`);
  }
  
  return allowed;
}

/**
 * Increment WebSocket connection count
 * 
 * BETA TESTING: Still tracks connections for analytics even when limits disabled
 * PRODUCTION: Tracks connections for rate limiting enforcement
 * 
 * @param {string} token - Admin token (masked)
 */
export function incrementWebSocketConnections(token) {
  rateLimiter.incrementWebSocketConnections(token);
  
  if (isRateLimitingDisabled()) {
    logRateLimitAction('TRACK', `WebSocket connection opened for token ${maskToken(token)} - Beta mode (tracking only)`);
  } else {
    logRateLimitAction('TRACK', `WebSocket connection opened for token ${maskToken(token)}`);
  }
}

/**
 * Decrement WebSocket connection count
 * 
 * BETA TESTING: Still tracks connections for analytics even when limits disabled
 * PRODUCTION: Tracks connections for rate limiting enforcement
 * 
 * @param {string} token - Admin token (masked)
 */
export function decrementWebSocketConnections(token) {
  rateLimiter.decrementWebSocketConnections(token);
  
  if (isRateLimitingDisabled()) {
    logRateLimitAction('TRACK', `WebSocket connection closed for token ${maskToken(token)} - Beta mode (tracking only)`);
  } else {
    logRateLimitAction('TRACK', `WebSocket connection closed for token ${maskToken(token)}`);
  }
}

/**
 * Enhanced rate limiting for chat endpoints with monetization support
 * 
 * BETA TESTING: Completely bypassed when DISABLE_RATE_LIMIT=true for unlimited AI access
 * PRODUCTION: Enforces limits based on user subscription tier for monetization
 * FUTURE: Will support premium users with higher limits and free users with basic limits
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Next middleware function
 * @param {string} userTier - User subscription tier (free, premium, enterprise)
 * @returns {void}
 */
export function chatEndpointRateLimit(req, res, next, userTier = 'free') {
  // BETA TESTING MODE: Completely bypass rate limiting for unlimited AI access
  if (isRateLimitingDisabled()) {
    logRateLimitAction('BYPASS', `Chat endpoint ${req.path} from IP ${req.ip} - Beta testing mode (unlimited AI access)`);
    return next();
  }
  
  // PRODUCTION MODE: Apply tier-based rate limiting for monetization
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const tierLimits = getTierLimits(userTier);
  
  // Check rate limit based on user tier
  if (!rateLimiter.checkIPLimit(clientIP, tierLimits.requestsPerMinute, 60000)) {
    logRateLimitAction('BLOCK', `Chat rate limit exceeded for ${userTier} tier from IP ${clientIP}`);
    return res.status(429).json({
      success: false,
      message: `Rate limit exceeded for ${userTier} tier. Maximum ${tierLimits.requestsPerMinute} requests per minute.`,
      retryAfter: 60,
      tier: userTier,
      upgradeMessage: userTier === 'free' ? 'Upgrade to Premium for higher limits!' : null
    });
  }
  
  logRateLimitAction('ALLOW', `Chat request from ${userTier} tier IP ${clientIP}`);
  next();
}

/**
 * Check if a request path matches a critical endpoint with precise matching
 * @param {string} requestPath - The incoming request path
 * @param {Array<{path: string, exact?: boolean}>} criticalEndpoints - Array of critical endpoint definitions
 * @returns {boolean} Whether the path matches a critical endpoint
 */
function isCriticalEndpoint(requestPath, criticalEndpoints) {
  return criticalEndpoints.some(endpoint => {
    const { path, exact = false } = typeof endpoint === 'string' ? { path: endpoint } : endpoint;
    
    if (exact) {
      return requestPath === path;
    } else {
      // For prefix matching, ensure we match segment boundaries
      return requestPath === path || 
             (requestPath.startsWith(path) && 
              (path.endsWith('/') || requestPath[path.length] === '/' || requestPath[path.length] === '?'));
    }
  });
}

/**
 * Selective rate limiting middleware - excludes critical endpoints
 * 
 * BETA TESTING: Completely bypassed when DISABLE_RATE_LIMIT=true
 * PRODUCTION: Applies smart rate limiting to non-critical endpoints only
 * MONETIZATION: Preserves critical functionality while enforcing limits on premium features
 * 
 * Only applies to non-essential endpoints to maintain security without blocking core functionality
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Next middleware function
 * @returns {void}
 */
export function selectiveRateLimit(req, res, next) {
  // BETA TESTING MODE: Completely bypass all rate limiting
  if (isRateLimitingDisabled()) {
    logRateLimitAction('BYPASS', `Selective rate limit bypassed for ${req.path} - Beta testing mode`);
    return next();
  }
  
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'localhost' || clientIP.includes('127.0.0.1');
  
  // For localhost, be VERY permissive - bypass ALL API endpoints
  if (isLocalhost && req.path.startsWith('/api/')) {
    console.log(`[RATE-LIMIT] Bypassing rate limit for localhost API request: ${req.path} from ${clientIP}`);
    return next();
  }
  
  // Critical endpoints that should NEVER be rate limited
  const criticalEndpoints = [
    { path: '/api/auth', exact: false }, // All authentication endpoints (prefix)
    { path: '/api/chat', exact: false }, // ALL AI chat endpoints (prefix) - FIXED to include all chat routes
    { path: '/api/health', exact: true }, // Health checks (exact)
    { path: '/api/app-config.json', exact: true }, // App configuration (exact)
    { path: '/api/feedback', exact: false } // Feedback endpoints (prefix)
  ];
  
  // Check if this is a critical endpoint with precise matching
  const isCritical = isCriticalEndpoint(req.path, criticalEndpoints);
  
  if (isCritical) {
    console.log(`[RATE-LIMIT] Bypassing rate limit for critical endpoint: ${req.path}`);
    return next();
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && !isLocalhost) {
    // Reasonable limits for production (non-critical endpoints only, non-localhost only)
    if (!rateLimiter.checkIPLimit(clientIP, 1000, 300000)) { // Increased to 1000 requests per 5 minutes for production
      console.warn(`[RATE-LIMIT] Production rate limit exceeded for IP ${clientIP} on ${req.path}`);
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please wait before making more requests.',
        retryAfter: 300
      });
    }
  } else {
    // Very lenient limits for development or localhost
    if (!rateLimiter.checkIPLimit(clientIP, 10000, 60000)) { // 10000 requests per minute for dev/localhost
      console.warn(`[RATE-LIMIT] Development/localhost rate limit exceeded for IP ${clientIP} on ${req.path}`);
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded (development/localhost mode).',
        retryAfter: 60
      });
    }
  }
  
  next();
}

/**
 * Legacy function name alias for backward compatibility
 * @deprecated Use selectiveRateLimit instead
 */
export const productionRateLimit = selectiveRateLimit;

/**
 * USER-BASED RATE LIMITING FOR FUTURE MONETIZATION
 * 
 * This function will be used to implement user-specific rate limiting based on
 * subscription tiers, user accounts, and payment status.
 * 
 * @param {string} userId - Unique user identifier
 * @param {string} userTier - User subscription tier (free, premium, enterprise)
 * @param {string} endpoint - The API endpoint being accessed
 * @returns {object} Rate limiting decision and tier information
 */
export function checkUserRateLimit(userId, userTier = 'free', endpoint = 'general') {
  // BETA TESTING MODE: Always allow access
  if (isRateLimitingDisabled()) {
    return {
      allowed: true,
      tier: userTier,
      remaining: 'unlimited',
      resetTime: null,
      betaMode: true
    };
  }
  
  const tierLimits = getTierLimits(userTier);
  const userKey = `user:${userId}:${endpoint}`;
  
  // Check user-specific rate limit
  const allowed = rateLimiter.checkIPLimit(userKey, tierLimits.requestsPerMinute, 60000);
  
  if (!allowed) {
    logRateLimitAction('BLOCK', `User ${userId} (${userTier} tier) exceeded rate limit for ${endpoint}`);
  }
  
  return {
    allowed,
    tier: userTier,
    remaining: tierLimits.requestsPerMinute,
    resetTime: Date.now() + 60000,
    betaMode: false
  };
}

/**
 * EXPORT CONFIGURATION FOR EXTERNAL USE
 */
export {
  isRateLimitingDisabled,
  getTierLimits,
  RATE_LIMIT_TIERS
};

// Export rate limiter functions (no router needed)