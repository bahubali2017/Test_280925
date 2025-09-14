/**
 * @file Rate limiting middleware for admin endpoints
 * Protects admin endpoints from abuse and ensures system stability
 */

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
 * Rate limiter for admin endpoints (20 req/min per token)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object  
 * @param {import('express').NextFunction} next - Next middleware function
 */
export function adminEndpointRateLimit(req, res, next) {
  const adminToken = req.admin?.token || 'unknown';
  
  if (!rateLimiter.checkTokenLimit(adminToken, 20, 60000)) { // 20 requests per minute
    console.warn(`[RATE-LIMIT] Admin endpoint rate limit exceeded for token ${adminToken}`);
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Maximum 20 requests per minute.',
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
 * Enhanced rate limiting for chat endpoints
 */
export function chatEndpointRateLimit(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Different limits for different endpoints
  const limits = {
    '/api/chat': { requests: 100, window: 60000 }, // 100 requests per minute for regular chat
    '/api/chat/stream': { requests: 100, window: 60000 }, // 100 requests per minute for streaming
    default: { requests: 50, window: 60000 } // 50 requests per minute for other endpoints
  };
  
  const endpoint = req.path;
  const limit = limits[endpoint] || limits.default;
  
  if (!rateLimiter.checkIPLimit(clientIP, limit.requests, limit.window)) {
    console.warn(`[RATE-LIMIT] Chat endpoint rate limit exceeded for IP ${clientIP} on ${endpoint}`);
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please wait before making more requests.',
      retryAfter: Math.ceil(limit.window / 1000),
      endpoint: endpoint
    });
  }
  
  next();
}

/**
 * Adaptive rate limiting - strict in production, lenient in development
 */
export function productionRateLimit(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (isProduction) {
    // Strict limits for production
    if (!rateLimiter.checkIPLimit(clientIP, 100, 300000)) { // 100 requests per 5 minutes
      console.warn(`[RATE-LIMIT] Production rate limit exceeded for IP ${clientIP}`);
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please wait before making more requests.',
        retryAfter: 300
      });
    }
  } else {
    // Very lenient limits for development
    if (!rateLimiter.checkIPLimit(clientIP, 1000, 60000)) { // 1000 requests per minute in dev
      console.warn(`[RATE-LIMIT] Development rate limit exceeded for IP ${clientIP}`);
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded (development mode).',
        retryAfter: 60
      });
    }
  }
  
  next();
}

// Export rate limiter functions (no router needed)