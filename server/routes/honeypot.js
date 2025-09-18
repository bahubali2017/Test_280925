/**
 * @file Honeypot Endpoints for Intrusion Detection
 * Creates fake endpoints to detect unauthorized access attempts
 */

import express from 'express';

const router = express.Router();

/**
 * Log security incident
 * @param {string} type - Type of incident
 * @param {object} req - Express request object
 * @param {object} details - Additional details
 * @returns {object} The logged security incident object
 */
function logSecurityIncident(type, req, details = {}) {
  const incident = {
    timestamp: new Date().toISOString(),
    type,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body,
    ...details
  };
  
  console.warn(`[SECURITY-INCIDENT] ${type}:`, JSON.stringify(incident));
  
  // In production, this would trigger alerts and potentially auto-ban IPs
  return incident;
}

/**
 * Generic honeypot response
 * @param {import("express").Request} req - Express request object
 * @param {import("express").Response} res - Express response object
 * @param {string} endpointType - Type of endpoint being accessed
 * @returns {void} Sends a JSON response, no return value
 */
function honeypotResponse(req, res, endpointType) {
  logSecurityIncident('HONEYPOT_TRIGGERED', req, { endpointType });
  
  // Return a realistic-looking error to avoid detection
  res.status(401).json({
    success: false,
    message: 'Authentication required',
    code: 'UNAUTHORIZED'
  });
}

// Fake admin endpoints
router.all('/api/internal/*', (req, res) => {
  honeypotResponse(req, res, 'internal_api');
});

router.all('/admin/*', (req, res) => {
  honeypotResponse(req, res, 'admin_panel');
});

router.all('/wp-admin/*', (req, res) => {
  honeypotResponse(req, res, 'wordpress_admin');
});

router.all('/phpmyadmin/*', (req, res) => {
  honeypotResponse(req, res, 'phpmyadmin');
});

// Fake configuration endpoints
router.all('/.env', (req, res) => {
  honeypotResponse(req, res, 'env_file');
});

router.all('/config*', (req, res) => {
  honeypotResponse(req, res, 'config_file');
});

router.all('/api/config*', (req, res) => {
  honeypotResponse(req, res, 'api_config');
});

// Fake model/AI configuration endpoints
router.all('/api/model-config', (req, res) => {
  honeypotResponse(req, res, 'model_config');
});

router.all('/api/ai-settings', (req, res) => {
  honeypotResponse(req, res, 'ai_settings');
});

router.all('/api/keys', (req, res) => {
  honeypotResponse(req, res, 'api_keys');
});

// Fake database endpoints
router.all('/database/*', (req, res) => {
  honeypotResponse(req, res, 'database');
});

router.all('/api/db/*', (req, res) => {
  honeypotResponse(req, res, 'database_api');
});

// Fake backup endpoints
router.all('/backup/*', (req, res) => {
  honeypotResponse(req, res, 'backup');
});

router.all('/api/backup/*', (req, res) => {
  honeypotResponse(req, res, 'backup_api');
});

// Fake debug endpoints
router.all('/debug/*', (req, res) => {
  honeypotResponse(req, res, 'debug');
});

router.all('/api/debug/*', (req, res) => {
  honeypotResponse(req, res, 'debug_api');
});

// Fake test endpoints
router.all('/test/*', (req, res) => {
  honeypotResponse(req, res, 'test');
});

router.all('/api/test/*', (req, res) => {
  honeypotResponse(req, res, 'test_api');
});

/**
 *
 */
export default router;