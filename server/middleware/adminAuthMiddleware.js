/* global URL */
/**
 * @file Authentication middleware for admin endpoints
 * Validates Bearer tokens for admin dashboard access
 */

/**
 * Middleware to authenticate admin requests via Bearer token
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object  
 * @param {import('express').NextFunction} next - Next middleware function
 * @returns {void}
 */
export function adminAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    // Check for Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Valid admin token required.'
      });
    }
    
    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const expectedToken = process.env.ADMIN_API_TOKEN;
    
    // Validate token exists in environment
    if (!expectedToken) {
      console.error('ADMIN_API_TOKEN environment variable not set');
      return res.status(500).json({
        success: false,
        message: 'Admin authentication not configured'
      });
    }
    
    // Validate token matches
    if (token !== expectedToken) {
      // Log failed authentication attempt
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const maskedToken = token.length > 8 ? `${token.substring(0, 4)}***${token.substring(token.length - 4)}` : '***';
      
      console.warn(`[ADMIN-AUTH] Failed authentication attempt from ${clientIP} with token ${maskedToken}`);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }
    
    // Log successful authentication
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const maskedToken = token.length > 8 ? `${token.substring(0, 4)}***${token.substring(token.length - 4)}` : '***';
    
    console.info(`[ADMIN-AUTH] Authenticated admin request from ${clientIP} with token ${maskedToken}`);
    
    // Add admin context to request
    req.admin = {
      authenticated: true,
      ip: clientIP,
      token: maskedToken,
      timestamp: new Date().toISOString()
    };
    
    next();
  } catch (error) {
    console.error('[ADMIN-AUTH] Middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication system error'
    });
  }
}

/**
 * Validate admin token for WebSocket authentication (security-focused)
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @returns {boolean} Whether token is valid
 */
export function validateAdminWebSocketToken(req) {
  try {
    // SECURITY: Only use Authorization header in production for WebSocket auth
    // Query params can leak in logs and intermediaries
    const isProduction = process.env.NODE_ENV === 'production';
    
    const token = isProduction 
      ? req.headers.authorization?.substring(7) // Only header in production
      : (req.headers.authorization?.substring(7) || 
         (req.url?.includes('token=') ? new URL(req.url, 'http://localhost').searchParams.get('token') : null));
    
    const expectedToken = process.env.ADMIN_API_TOKEN;
    
    if (!expectedToken || !token || token !== expectedToken) {
      const clientIP = req.connection?.remoteAddress || 'unknown';
      console.warn(`[ADMIN-WS] Authentication failed from ${clientIP}`);
      return false;
    }
    
    const clientIP = req.connection?.remoteAddress || 'unknown';
    const maskedToken = token.length > 8 ? `${token.substring(0, 4)}***${token.substring(token.length - 4)}` : '***';
    
    console.info(`[ADMIN-WS] Authenticated WebSocket connection from ${clientIP} with token ${maskedToken}`);
    
    return true;
  } catch (error) {
    console.error('[ADMIN-WS] Authentication error:', error);
    return false;
  }
}

/**
 * WebSocket authentication for admin connections (legacy - use validateAdminWebSocketToken)
 * @param {WebSocket} ws - WebSocket connection
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @returns {boolean} Whether authentication was successful
 */
export function authenticateAdminWebSocket(ws, req) {
  const isValid = validateAdminWebSocketToken(req);
  
  if (!isValid && ws) {
    ws.close(4001, 'Unauthorized');
  }
  
  return isValid;
}