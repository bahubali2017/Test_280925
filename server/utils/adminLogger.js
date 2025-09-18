/**
 * @file Admin access logging system
 * Provides audit trail for all administrative access and actions
 */

import { promises as fs } from 'fs';
import path from 'path';

class AdminLogger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs', 'admin');
    this.ensureLogDirectory();
  }
  
  /**
   * Ensure log directory exists
   */
  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('[ADMIN-LOGGER] Failed to create log directory:', error);
    }
  }
  
  /**
   * Log admin access event
   * @param {object} logData - Log data object
   * @param {string} logData.endpoint - API endpoint accessed
   * @param {string} logData.method - HTTP method
   * @param {string} logData.adminToken - Masked admin token
   * @param {string} logData.sourceIP - Source IP address
   * @param {string} logData.userAgent - User agent string
   * @param {number} logData.responseStatus - HTTP response status
   * @param {number} logData.responseTime - Response time in milliseconds
   */
  async logAccess(logData) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        endpoint: logData.endpoint,
        method: logData.method,
        adminToken: logData.adminToken,
        sourceIP: logData.sourceIP,
        userAgent: logData.userAgent || 'unknown',
        responseStatus: logData.responseStatus,
        responseTime: logData.responseTime,
        level: 'info',
        type: 'admin_access'
      };
      
      // Get today's log file path
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const logFile = path.join(this.logDir, `admin-access-${today}.log`);
      
      // Append log entry as JSON line
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logFile, logLine);
      
      // Also log to console if in development
      if (process.env.NODE_ENV === 'development') {
        console.info(`[ADMIN-ACCESS] ${logData.method} ${logData.endpoint} - ${logData.responseStatus} (${logData.responseTime}ms) from ${logData.sourceIP}`);
      }
    } catch (error) {
      console.error('[ADMIN-LOGGER] Failed to write access log:', error);
    }
  }
  
  /**
   * Log admin error event
   * @param {object} errorData - Error data object
   * @param {string} errorData.component - Component where error occurred
   * @param {string} errorData.error - Error message
   * @param {string} errorData.severity - Error severity
   * @param {string} errorData.sessionId - Related session ID (if any)
   */
  async logError(errorData) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        component: errorData.component,
        error: errorData.error,
        severity: errorData.severity,
        sessionId: errorData.sessionId || null,
        level: 'error',
        type: 'admin_error'
      };
      
      // Get today's log file path
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const logFile = path.join(this.logDir, `admin-errors-${today}.log`);
      
      // Append log entry as JSON line
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logFile, logLine);
      
      // Always log errors to console
      console.error(`[ADMIN-ERROR] ${errorData.component}: ${errorData.error} (${errorData.severity})`);
    } catch (error) {
      console.error('[ADMIN-LOGGER] Failed to write error log:', error);
    }
  }
  
  /**
   * Get recent log entries for admin dashboard
   * @param {string} logType - Type of logs to retrieve (access, error)
   * @param {number} hours - Number of hours to look back (default 24)
   * @returns {Promise<object[]>} Array of log entries
   */
  async getRecentLogs(logType = 'access', hours = 24) {
    try {
      const logs = [];
      const now = new Date();
      
      // Check logs for the last N hours
      for (let i = 0; i < Math.ceil(hours / 24); i++) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = date.toISOString().split('T')[0];
        const logFile = path.join(this.logDir, `admin-${logType}-${dateStr}.log`);
        
        try {
          const content = await fs.readFile(logFile, 'utf8');
          const lines = content.trim().split('\n').filter(line => line);
          
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              const entryTime = new Date(entry.timestamp);
              
              // Only include entries within the specified time window
              if (now.getTime() - entryTime.getTime() <= hours * 60 * 60 * 1000) {
                logs.push(entry);
              }
            } catch (parseError) {
              console.warn('[ADMIN-LOGGER] Failed to parse log entry:', line, parseError.message);
            }
          }
        } catch {
          // Log file doesn't exist for this date, skip
          continue;
        }
      }
      
      // Sort by timestamp descending (newest first)
      return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('[ADMIN-LOGGER] Failed to retrieve logs:', error);
      return [];
    }
  }
  
  /**
   * Clean up old log files to prevent disk space issues
   * @param {number} retentionDays - Number of days to retain logs (default 30)
   */
  async cleanupOldLogs(retentionDays = 30) {
    try {
      const files = await fs.readdir(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      for (const file of files) {
        if (file.startsWith('admin-') && file.endsWith('.log')) {
          // Extract date from filename (admin-access-YYYY-MM-DD.log)
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            const fileDate = new Date(dateMatch[1]);
            if (fileDate < cutoffDate) {
              const filePath = path.join(this.logDir, file);
              await fs.unlink(filePath);
              console.info(`[ADMIN-LOGGER] Cleaned up old log file: ${file}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('[ADMIN-LOGGER] Failed to cleanup old logs:', error);
    }
  }
}

// Export singleton instance
/**
 *
 */
export const adminLogger = new AdminLogger();