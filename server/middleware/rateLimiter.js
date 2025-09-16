/**
 * @file Rate limiting middleware for admin endpoints
 * Protects admin endpoints from abuse and ensures system stability
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
 * Rate limiter for system status endpoint (10 req/min per IP)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object  
 * @param {import('express').NextFunction} next - Next middleware function
 */
export function systemStatusRateLimit(req, res, next) {
  // Check for global rate limit disable
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    console.log('[RATE-LIMIT] Rate limiting disabled via environment variable');
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
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object  
 * @param {import('express').NextFunction} next - Next middleware function
 */
export function adminEndpointRateLimit(req, res, next) {
  // Check for global rate limit disable
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    console.log('[RATE-LIMIT] Rate limiting disabled via environment variable');
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
 * @param {string} token - Admin token (masked)
 * @returns {boolean} Whether connection is allowed
 */
export function checkWebSocketRateLimit(token) {
  return rateLimiter.checkWebSocketLimit(token, 5);
}

/**
 * Increment WebSocket connection count
 * @param {string} token - Admin token (masked)
 */
export function incrementWebSocketConnections(token) {
  rateLimiter.incrementWebSocketConnections(token);
}

/**
 * Decrement WebSocket connection count
 * @param {string} token - Admin token (masked)
 */
export function decrementWebSocketConnections(token) {
  rateLimiter.decrementWebSocketConnections(token);
}

/**
 * Enhanced rate limiting for chat endpoints - REMOVED for unlimited AI availability
 * This function now acts as a pass-through to ensure unlimited access to AI chat
 */
export function chatEndpointRateLimit(req, res, next) {
  // Chat endpoints should have unlimited availability for optimal user experience
  console.log(`[RATE-LIMIT] Allowing unlimited access to chat endpoint: ${req.path}`);
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
 * Only applies to non-essential endpoints to maintain security without blocking core functionality
 */
export function selectiveRateLimit(req, res, next) {
  // Check for global rate limit disable
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    console.log('[RATE-LIMIT] Rate limiting disabled via environment variable');
    return next();
  }
  
  // Critical endpoints that should NEVER be rate limited
  const criticalEndpoints = [
    { path: '/api/auth/', exact: false }, // All authentication endpoints (prefix)
    { path: '/api/chat', exact: true }, // AI chat endpoint (exact)
    { path: '/api/chat/', exact: false }, // AI chat sub-endpoints (prefix)
    { path: '/api/health', exact: true }, // Health checks (exact)
    { path: '/api/app-config.json', exact: true } // App configuration (exact)
  ];
  
  // Check if this is a critical endpoint with precise matching
  const isCritical = isCriticalEndpoint(req.path, criticalEndpoints);
  
  if (isCritical) {
    console.log(`[RATE-LIMIT] Bypassing rate limit for critical endpoint: ${req.path}`);
    return next();
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (isProduction) {
    // Reasonable limits for production (non-critical endpoints only)
    if (!rateLimiter.checkIPLimit(clientIP, 200, 300000)) { // 200 requests per 5 minutes
      console.warn(`[RATE-LIMIT] Production rate limit exceeded for IP ${clientIP} on ${req.path}`);
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please wait before making more requests.',
        retryAfter: 300
      });
    }
  } else {
    // Very lenient limits for development
    if (!rateLimiter.checkIPLimit(clientIP, 2000, 60000)) { // 2000 requests per minute in dev
      console.warn(`[RATE-LIMIT] Development rate limit exceeded for IP ${clientIP} on ${req.path}`);
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded (development mode).',
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

// Export rate limiter functions (no router needed)