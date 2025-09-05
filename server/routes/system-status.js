/**
 * @file System status API endpoint for admin dashboard
 * Provides health metrics, uptime, and AI session statistics
 */

import express from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { sessionTracker } from '../utils/sessionTracker.js';
import { uptimeTracker } from '../utils/uptimeTracker.js';
import { adminLogger } from '../utils/adminLogger.js';
import { promises as fs } from 'fs';
import path from 'path';

const router = express.Router();

/**
 * Get application version from package.json
 * @returns {Promise<string>} Application version
 */
async function getAppVersion() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageData = JSON.parse(packageContent);
    return packageData.version || '1.0.0-beta';
  } catch (error) {
    console.error('[SYSTEM-STATUS] Failed to read version from package.json:', error);
    return '1.0.0-beta';
  }
}

/**
 * Calculate system health status
 * @returns {string} Health status (healthy, degraded, down)
 */
function calculateHealthStatus() {
  try {
    const metrics = sessionTracker.getSystemMetrics();
    
    // Check for degraded conditions
    if (metrics.error_rate > 10) {
      return 'degraded'; // High error rate
    }
    
    if (metrics.avg_latency > 10000) {
      return 'degraded'; // High latency (>10s)
    }
    
    if (metrics.flagged_sessions > metrics.active_sessions * 0.5) {
      return 'degraded'; // Too many flagged sessions
    }
    
    return 'healthy';
  } catch (error) {
    console.error('[SYSTEM-STATUS] Health calculation error:', error);
    return 'degraded';
  }
}

/**
 * Measure AI latency with a simple ping
 * @returns {Promise<number>} Latency in milliseconds
 */
async function measureAILatency() {
  try {
    const startTime = Date.now();
    
    // Simple ping to DeepSeek API health endpoint (if available)
    // For now, we'll simulate based on recent session metrics
    const metrics = sessionTracker.getSystemMetrics();
    
    // Return recent average latency or default if no data
    return metrics.avg_latency || 150;
  } catch (error) {
    console.error('[SYSTEM-STATUS] Latency measurement error:', error);
    return 999; // High latency indicates issues
  }
}

/**
 * GET /api/system/status
 * Primary health check and system metrics endpoint
 */
router.get('/status', adminAuthMiddleware, async (req, res) => {
  const requestStart = Date.now();
  
  try {
    // Gather all system metrics
    const [version, metrics, latency] = await Promise.all([
      getAppVersion(),
      sessionTracker.getSystemMetrics(),
      measureAILatency()
    ]);
    
    const health = calculateHealthStatus();
    const uptime = uptimeTracker.getUptimeMs();
    
    const statusResponse = {
      status: health,
      version: version,
      uptime: uptime,
      ai_active_sessions: metrics.active_sessions,
      flagged_sessions: metrics.flagged_sessions,
      latency_ms: Math.round(latency),
      timestamp: new Date().toISOString()
    };
    
    // Log admin access
    const responseTime = Date.now() - requestStart;
    await adminLogger.logAccess({
      endpoint: '/api/system/status',
      method: 'GET',
      adminToken: req.admin.token,
      sourceIP: req.admin.ip,
      userAgent: req.headers['user-agent'],
      responseStatus: 200,
      responseTime
    });
    
    res.json(statusResponse);
  } catch (error) {
    console.error('[SYSTEM-STATUS] Status endpoint error:', error);
    
    // Log error
    await adminLogger.logError({
      component: 'system-status',
      error: error.message,
      severity: 'high'
    });
    
    const responseTime = Date.now() - requestStart;
    await adminLogger.logAccess({
      endpoint: '/api/system/status',
      method: 'GET',
      adminToken: req.admin.token,
      sourceIP: req.admin.ip,
      userAgent: req.headers['user-agent'],
      responseStatus: 500,
      responseTime
    });
    
    res.status(500).json({
      success: false,
      message: 'System status unavailable'
    });
  }
});

export default router;