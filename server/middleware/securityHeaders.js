/**
 * @file Security Headers Middleware
 * Provides comprehensive security headers for production deployment
 */

/**
 * Production-grade security headers middleware
 * Implements HSTS, CSP, and other security best practices
 */
export function securityHeadersMiddleware(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Strict Transport Security (HSTS)
  if (isProduction) {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy (CSP) for Autoscale deployments
  // NOTE: Autoscale deployments require CSP in code, not .replit file
  if (isProduction) {
    const cspPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Block external scripts like replit.com
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.deepseek.com https://*.supabase.co wss: ws:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    res.header('Content-Security-Policy', cspPolicy);
  }
  
  // Prevent clickjacking
  res.header('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.header('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (legacy browsers)
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (Feature Policy replacement)
  res.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
}

/**
 * Production CORS configuration
 * Dynamically allows Replit preview domains and custom domains
 */
export function productionCorsMiddleware(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';
  const origin = req.headers.origin;
  
  // Helper function to check if origin matches allowed patterns
  function isOriginAllowed(origin, allowedPatterns) {
    if (!origin) return true; // Allow requests without origin (server-to-server)
    
    return allowedPatterns.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      } else if (typeof pattern === 'string') {
        return origin === pattern || origin.includes(pattern);
      }
      return false;
    });
  }
  
  let allowedPatterns = [];
  
  if (isProduction) {
    // Production allowed origins with regex patterns for dynamic Replit domains
    allowedPatterns = [
      // Regex patterns for Replit preview domains
      /^https:\/\/.*\.repl\.co$/,
      /^https:\/\/.*\.replit\.dev$/,
      
      // Specific production domains (exact matches)
      'https://mvp.anamnesis.health',
      'https://anamnesis-mvp.replit.app',
      'https://admin.anamnesis.health',
      
      // Legacy Replit domains (string contains for backward compatibility)
      '.replit.app',
      
      // Custom domain patterns
      'anamnesis.health',
      
      // Localhost for Replit webview preview
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];
  } else {
    // Development - allow all common development origins
    allowedPatterns = [
      /^https:\/\/.*\.repl\.co$/,
      /^https:\/\/.*\.replit\.dev$/,
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'https://admin.anamnesis.health'
    ];
  }
  
  const isAllowed = isOriginAllowed(origin, allowedPatterns);
  
  if (isProduction && origin && !isAllowed) {
    console.warn(`[SECURITY] CORS violation: Blocked request from unauthorized origin: ${origin}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied: Invalid origin',
      code: 'CORS_VIOLATION'
    });
  }
  
  if (isAllowed || !isProduction) {
    // Log successful authorization
    if (origin) {
      const matchType = allowedPatterns.find(pattern => {
        if (pattern instanceof RegExp) return pattern.test(origin);
        return origin === pattern || origin.includes(pattern);
      });
      
      if (matchType instanceof RegExp) {
        console.log(`[SECURITY] Production CORS: Allowing Replit preview origin (regex): ${origin}`);
      } else {
        console.log(`[SECURITY] Production CORS: Allowing authorized origin: ${origin}`);
      }
    } else {
      console.log(`[SECURITY] Production CORS: Allowing server requests`);
    }
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Admin-Role, X-Session-ID'
    );
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}

/**
 * Request logging middleware for security monitoring
 */
export function securityLoggingMiddleware(req, res, next) {
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const origin = req.headers.origin || 'none';
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    '/admin',
    '/api/internal',
    '/config',
    '/.env',
    '/wp-admin',
    '/phpmyadmin',
    'eval(',
    '<script',
    'javascript:',
    'data:text/html'
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    req.url.toLowerCase().includes(pattern.toLowerCase()) ||
    req.body && JSON.stringify(req.body).toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isSuspicious) {
    console.warn(`[SECURITY] Suspicious request detected:`, {
      timestamp,
      ip: clientIP,
      method: req.method,
      url: req.url,
      origin,
      userAgent: userAgent.substring(0, 100)
    });
  }
  
  next();
}