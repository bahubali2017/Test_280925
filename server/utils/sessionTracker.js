/**
 * @file Session state tracking for admin monitoring
 * Manages AI session lifecycle and metrics collection
 */

/**
 * @typedef {Object} Session
 * @property {string} sessionId - Unique session identifier
 * @property {number} startTime - Session start timestamp
 * @property {number|null} endTime - Session end timestamp
 * @property {number} messageCount - Number of messages in session
 * @property {boolean} flagged - Whether session has been flagged
 * @property {string[]} flagReasons - Reasons for flagging
 * @property {string} userRole - Role of the user (general_public, medical_professional, etc.)
 * @property {string} status - Session status (active, completed, terminated)
 * @property {Object} metrics - Performance metrics
 */

class SessionTracker {
  constructor() {
    /**
     * @type {Map<string, Session>}
     */
    this.activeSessions = new Map();
    
    /**
     * @type {Session[]}
     */
    this.completedSessions = [];
    
    /**
     * @type {Function[]}
     */
    this.eventListeners = [];
    
    // Clean up old completed sessions every hour
    setInterval(() => this.cleanupOldSessions(), 3600000);
  }
  
  /**
   * Start tracking a new session
   * @param {string} sessionId - Unique session identifier
   * @param {string} userRole - Role of the user
   * @returns {Session} Created session object
   */
  startSession(sessionId, userRole = 'general_public') {
    const session = {
      sessionId,
      startTime: Date.now(),
      endTime: null,
      messageCount: 0,
      flagged: false,
      flagReasons: [],
      userRole,
      status: 'active',
      metrics: {
        totalLatency: 0,
        avgLatency: 0,
        maxLatency: 0,
        errors: 0
      }
    };
    
    this.activeSessions.set(sessionId, session);
    
    console.info(`[SESSION-TRACKER] Started session ${sessionId} for ${userRole}`);
    
    // Emit session started event
    this.emitEvent('session_started', {
      sessionId,
      userRole,
      timestamp: new Date().toISOString()
    });
    
    return session;
  }
  
  /**
   * Update session with message activity
   * @param {string} sessionId - Session identifier
   * @param {number} latency - Response latency in milliseconds
   * @param {boolean} isError - Whether this was an error response
   */
  updateSession(sessionId, latency = 0, isError = false) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    session.messageCount++;
    session.metrics.totalLatency += latency;
    session.metrics.avgLatency = session.metrics.totalLatency / session.messageCount;
    session.metrics.maxLatency = Math.max(session.metrics.maxLatency, latency);
    
    if (isError) {
      session.metrics.errors++;
    }
    
    console.debug(`[SESSION-TRACKER] Updated session ${sessionId}: ${session.messageCount} messages, avg latency ${Math.round(session.metrics.avgLatency)}ms`);
  }
  
  /**
   * Flag a session for admin attention
   * @param {string} sessionId - Session identifier
   * @param {string} reason - Reason for flagging
   * @param {string} severity - Severity level (low, medium, high)
   */
  flagSession(sessionId, reason, severity = 'medium') {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    session.flagged = true;
    session.flagReasons.push(reason);
    
    console.warn(`[SESSION-TRACKER] Flagged session ${sessionId}: ${reason} (${severity})`);
    
    // Emit session flagged event
    this.emitEvent('session_flagged', {
      sessionId,
      flagType: reason,
      severity,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * End a session and move to completed
   * @param {string} sessionId - Session identifier
   * @param {string} outcome - Session outcome (completed, terminated, error)
   */
  endSession(sessionId, outcome = 'completed') {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    session.endTime = Date.now();
    session.status = outcome;
    
    const duration = session.endTime - session.startTime;
    
    console.info(`[SESSION-TRACKER] Ended session ${sessionId}: ${outcome}, duration ${duration}ms, ${session.messageCount} messages`);
    
    // Move to completed sessions
    this.completedSessions.push({ ...session });
    this.activeSessions.delete(sessionId);
    
    // Emit session ended event
    this.emitEvent('session_ended', {
      sessionId,
      duration,
      messageCount: session.messageCount,
      outcome,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Get current system metrics
   * @returns {Object} System metrics object
   */
  getSystemMetrics() {
    const activeSessionCount = this.activeSessions.size;
    const flaggedSessionCount = Array.from(this.activeSessions.values())
      .filter(session => session.flagged).length;
    
    // Calculate aggregate metrics from recent completed sessions (last 1000)
    const recentSessions = this.completedSessions.slice(-1000);
    const totalSessions = this.completedSessions.length;
    
    let avgDuration = 0;
    let successRate = 100;
    let avgLatency = 0;
    
    if (recentSessions.length > 0) {
      const totalDuration = recentSessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
      avgDuration = totalDuration / recentSessions.length;
      
      const successfulSessions = recentSessions.filter(s => s.status === 'completed').length;
      successRate = (successfulSessions / recentSessions.length) * 100;
      
      const totalAvgLatency = recentSessions.reduce((sum, s) => sum + s.metrics.avgLatency, 0);
      avgLatency = totalAvgLatency / recentSessions.length;
    }
    
    return {
      total_sessions: totalSessions,
      active_sessions: activeSessionCount,
      flagged_sessions: flaggedSessionCount,
      avg_session_duration: Math.round(avgDuration),
      success_rate: Math.round(successRate * 10) / 10,
      error_rate: Math.round((100 - successRate) * 10) / 10,
      avg_latency: Math.round(avgLatency)
    };
  }
  
  /**
   * Get detailed AI metrics for admin dashboard
   * @returns {Object} Detailed metrics object
   */
  getDetailedMetrics() {
    const baseMetrics = this.getSystemMetrics();
    const recentSessions = this.completedSessions.slice(-1000);
    
    // Calculate response time percentiles
    const latencies = recentSessions
      .map(s => s.metrics.avgLatency)
      .filter(l => l > 0)
      .sort((a, b) => a - b);
    
    const responseTimePercentiles = {
      p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
      p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99: latencies[Math.floor(latencies.length * 0.99)] || 0
    };
    
    // Count high-risk queries and ATD escalations
    const highRiskQueries = recentSessions.filter(s => 
      s.flagReasons.some(reason => reason.includes('high_risk'))
    ).length;
    
    const atdEscalations = recentSessions.filter(s => 
      s.flagReasons.some(reason => reason.includes('atd') || reason.includes('escalation'))
    ).length;
    
    return {
      ...baseMetrics,
      high_risk_queries: highRiskQueries,
      atd_escalations: atdEscalations,
      response_times: responseTimePercentiles
    };
  }
  
  /**
   * Add event listener for session events
   * @param {Function} listener - Event listener function
   */
  addEventListener(listener) {
    this.eventListeners.push(listener);
  }
  
  /**
   * Remove event listener
   * @param {Function} listener - Event listener function to remove
   */
  removeEventListener(listener) {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }
  
  /**
   * Emit event to all listeners
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data payload
   */
  emitEvent(eventType, eventData) {
    this.eventListeners.forEach(listener => {
      try {
        listener(eventType, eventData);
      } catch (error) {
        console.error('[SESSION-TRACKER] Event listener error:', error);
      }
    });
  }
  
  /**
   * Clean up old completed sessions to prevent memory leaks
   */
  cleanupOldSessions() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    const originalLength = this.completedSessions.length;
    
    this.completedSessions = this.completedSessions.filter(session => 
      session.endTime > cutoffTime
    );
    
    const cleaned = originalLength - this.completedSessions.length;
    if (cleaned > 0) {
      console.info(`[SESSION-TRACKER] Cleaned up ${cleaned} old sessions`);
    }
  }
  
  /**
   * Report system error for admin monitoring
   * @param {string} component - Component where error occurred
   * @param {string} error - Error message
   * @param {string} severity - Error severity (low, medium, high)
   */
  reportError(component, error, severity = 'medium') {
    console.error(`[SESSION-TRACKER] System error in ${component}: ${error}`);
    
    this.emitEvent('error_occurred', {
      component,
      error,
      severity,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const sessionTracker = new SessionTracker();