/**
 * @file AI metrics API endpoint for admin dashboard
 * Provides detailed analytics for AI session performance and outcomes
 */

import express from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { sessionTracker } from '../utils/sessionTracker.js';
import { adminLogger } from '../utils/adminLogger.js';

const router = express.Router();

/**
 * GET /api/admin/ai-metrics
 * Detailed analytics for AI session performance and outcomes
 */
router.get('/ai-metrics', adminAuthMiddleware, async (req, res) => {
  const requestStart = Date.now();
  
  try {
    // Get time window from query parameter (default 24 hours)
    const hoursParam = req.query.hours;
    const hours = hoursParam ? parseInt(hoursParam, 10) : 24;
    
    // Validate hours parameter
    if (isNaN(hours) || hours < 1 || hours > 168) { // Max 1 week
      return res.status(400).json({
        success: false,
        message: 'Invalid hours parameter. Must be between 1 and 168.'
      });
    }
    
    // Get detailed metrics from session tracker
    const metrics = sessionTracker.getDetailedMetrics();
    
    // Calculate additional metrics for the specified time window
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const recentSessions = sessionTracker.completedSessions.filter(session => 
      session.endTime && session.endTime > cutoffTime
    );
    
    // Time-windowed calculations
    const windowMetrics = {
      total_sessions: recentSessions.length,
      avg_session_duration: recentSessions.length > 0 
        ? Math.round(recentSessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / recentSessions.length)
        : 0,
      success_rate: recentSessions.length > 0
        ? Math.round((recentSessions.filter(s => s.status === 'completed').length / recentSessions.length) * 1000) / 10
        : 100,
      error_rate: recentSessions.length > 0
        ? Math.round((recentSessions.filter(s => s.status !== 'completed').length / recentSessions.length) * 1000) / 10
        : 0,
      flagged_sessions: recentSessions.filter(s => s.flagged).length,
      high_risk_queries: recentSessions.filter(s => 
        s.flagReasons.some(reason => reason.includes('high_risk'))
      ).length,
      atd_escalations: recentSessions.filter(s => 
        s.flagReasons.some(reason => reason.includes('atd') || reason.includes('escalation'))
      ).length
    };
    
    // Calculate response time percentiles for the time window
    const latencies = recentSessions
      .map(s => s.metrics.avgLatency)
      .filter(l => l > 0)
      .sort((a, b) => a - b);
    
    const responseTimePercentiles = {
      p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
      p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99: latencies[Math.floor(latencies.length * 0.99)] || 0
    };
    
    const metricsResponse = {
      ...windowMetrics,
      response_times: responseTimePercentiles,
      time_window_hours: hours,
      current_active_sessions: metrics.active_sessions,
      timestamp: new Date().toISOString()
    };
    
    // Log admin access
    const responseTime = Date.now() - requestStart;
    await adminLogger.logAccess({
      endpoint: '/api/admin/ai-metrics',
      method: 'GET',
      adminToken: req.admin.token,
      sourceIP: req.admin.ip,
      userAgent: req.headers['user-agent'],
      responseStatus: 200,
      responseTime
    });
    
    res.json({
      success: true,
      data: metricsResponse
    });
  } catch (error) {
    console.error('[ADMIN-METRICS] Metrics endpoint error:', error);
    
    // Log error
    await adminLogger.logError({
      component: 'admin-metrics',
      error: error.message,
      severity: 'high'
    });
    
    const responseTime = Date.now() - requestStart;
    await adminLogger.logAccess({
      endpoint: '/api/admin/ai-metrics',
      method: 'GET',
      adminToken: req.admin.token,
      sourceIP: req.admin.ip,
      userAgent: req.headers['user-agent'],
      responseStatus: 500,
      responseTime
    });
    
    res.status(500).json({
      success: false,
      message: 'AI metrics unavailable'
    });
  }
});

/**
 * GET /api/admin/sessions
 * Get active sessions with basic information
 */
router.get('/sessions', adminAuthMiddleware, async (req, res) => {
  const requestStart = Date.now();
  
  try {
    const activeSessions = Array.from(sessionTracker.activeSessions.values()).map(session => ({
      sessionId: session.sessionId,
      startTime: session.startTime,
      messageCount: session.messageCount,
      flagged: session.flagged,
      flagReasons: session.flagReasons,
      userRole: session.userRole,
      status: session.status,
      avgLatency: Math.round(session.metrics.avgLatency)
    }));
    
    // Log admin access
    const responseTime = Date.now() - requestStart;
    await adminLogger.logAccess({
      endpoint: '/api/admin/sessions',
      method: 'GET',
      adminToken: req.admin.token,
      sourceIP: req.admin.ip,
      userAgent: req.headers['user-agent'],
      responseStatus: 200,
      responseTime
    });
    
    res.json({
      success: true,
      data: {
        active_sessions: activeSessions,
        count: activeSessions.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[ADMIN-SESSIONS] Sessions endpoint error:', error);
    
    // Log error
    await adminLogger.logError({
      component: 'admin-sessions',
      error: error.message,
      severity: 'medium'
    });
    
    const responseTime = Date.now() - requestStart;
    await adminLogger.logAccess({
      endpoint: '/api/admin/sessions',
      method: 'GET',
      adminToken: req.admin.token,
      sourceIP: req.admin.ip,
      userAgent: req.headers['user-agent'],
      responseStatus: 500,
      responseTime
    });
    
    res.status(500).json({
      success: false,
      message: 'Sessions data unavailable'
    });
  }
});


export default router;