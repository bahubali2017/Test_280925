/* global setInterval, clearInterval */
/**
 * @file Admin WebSocket server for real-time monitoring
 * Provides live updates to admin dashboard about system events
 */

const { URL } = require("url");
import { WebSocket, WebSocketServer } from 'ws';
import { validateAdminWebSocketToken } from '../middleware/adminAuthMiddleware.js';
import { checkWebSocketRateLimit, incrementWebSocketConnections, decrementWebSocketConnections } from '../middleware/rateLimiter.js';
import { sessionTracker } from '../utils/sessionTracker.js';
import { adminLogger } from '../utils/adminLogger.js';

class AdminWebSocketServer {
  constructor() {
    /**
     * @type {Set<WebSocket>}
     */
    this.connectedClients = new Set();
    
    /**
     * @type {Map<WebSocket, object>}
     */
    this.clientInfo = new Map();
    
    this.setupEventListeners();
    
    console.info('[ADMIN-WS] Admin WebSocket server initialized');
  }
  
  /**
   * Initialize WebSocket server and attach to HTTP server
   * @param {import('http').Server} httpServer - HTTP server instance
   */
  initialize(httpServer) {
    this.wss = new WebSocketServer({
      server: httpServer,
      path: '/ws/admin',
      verifyClient: (info) => {
        // Verify authentication before establishing connection
        return this.verifyClient(info);
      }
    });
    
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
    
    console.info('[ADMIN-WS] WebSocket server attached to HTTP server at /ws/admin');
  }
  
  /**
   * Verify client authentication and rate limits
   * @param {object} info - WebSocket connection info
   * @returns {boolean} Whether client is authorized
   */
  verifyClient(info) {
    try {
      // Check basic authentication (security-focused token validation)
      if (!validateAdminWebSocketToken(info.req)) {
        return false;
      }
      
      // Extract token for rate limiting
      const token = info.req.url?.includes('token=') 
        ? new URL(info.req.url, 'http://localhost').searchParams.get('token')
        : info.req.headers.authorization?.substring(7);
      
      const maskedToken = token && token.length > 8 
        ? `${token.substring(0, 4)}***${token.substring(token.length - 4)}` 
        : '***';
      
      // Check connection rate limit
      if (!checkWebSocketRateLimit(maskedToken)) {
        console.warn(`[ADMIN-WS] Connection rate limit exceeded for token ${maskedToken}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[ADMIN-WS] Client verification error:', error);
      return false;
    }
  }
  
  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {import('http').IncomingMessage} req - HTTP request
   */
  handleConnection(ws, req) {
    try {
      // Extract client info
      const clientIP = req.connection.remoteAddress || 'unknown';
      const token = req.url?.includes('token=') 
        ? new URL(req.url, 'http://localhost').searchParams.get('token')
        : req.headers.authorization?.substring(7);
      
      const maskedToken = token && token.length > 8 
        ? `${token.substring(0, 4)}***${token.substring(token.length - 4)}` 
        : '***';
      
      // Store client info
      const clientInfo = {
        ip: clientIP,
        token: maskedToken,
        connectedAt: Date.now(),
        lastHeartbeat: Date.now()
      };
      
      this.clientInfo.set(ws, clientInfo);
      this.connectedClients.add(ws);
      
      // Increment connection count for rate limiting
      incrementWebSocketConnections(maskedToken);
      
      console.info(`[ADMIN-WS] New admin connection from ${clientIP} (${this.connectedClients.size} total)`);
      
      // Send welcome message with current status
      this.sendToClient(ws, {
        type: 'connection_established',
        data: {
          timestamp: new Date().toISOString(),
          connectedClients: this.connectedClients.size,
          ...sessionTracker.getSystemMetrics()
        }
      });
      
      // Set up heartbeat
      this.setupHeartbeat(ws);
      
      // Handle connection close
      ws.on('close', (code, reason) => {
        this.handleDisconnection(ws, code, reason);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error(`[ADMIN-WS] WebSocket error for ${clientIP}:`, error);
        this.handleDisconnection(ws, 1006, 'Connection Error');
      });
      
      // Handle incoming messages (for future interactive features)
      ws.on('message', (data) => {
        this.handleMessage(ws, data);
      });
      
      // Log connection
      adminLogger.logAccess({
        endpoint: '/ws/admin',
        method: 'WebSocket',
        adminToken: maskedToken,
        sourceIP: clientIP,
        userAgent: req.headers['user-agent'],
        responseStatus: 101, // WebSocket upgrade
        responseTime: 0
      });
      
    } catch (error) {
      console.error('[ADMIN-WS] Connection handling error:', error);
      ws.close(4000, 'Connection Error');
    }
  }
  
  /**
   * Handle WebSocket disconnection
   * @param {WebSocket} ws - WebSocket connection
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  handleDisconnection(ws, code, _reason) {
    const clientInfo = this.clientInfo.get(ws);
    
    if (clientInfo) {
      // Decrement connection count
      decrementWebSocketConnections(clientInfo.token);
      
      const duration = Date.now() - clientInfo.connectedAt;
      console.info(`[ADMIN-WS] Admin disconnected from ${clientInfo.ip} after ${Math.round(duration/1000)}s (code: ${code})`);
    }
    
    this.connectedClients.delete(ws);
    this.clientInfo.delete(ws);
  }
  
  /**
   * Set up heartbeat for WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   */
  setupHeartbeat(ws) {
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const clientInfo = this.clientInfo.get(ws);
        if (clientInfo) {
          clientInfo.lastHeartbeat = Date.now();
          this.sendToClient(ws, {
            type: 'heartbeat',
            data: {
              timestamp: new Date().toISOString(),
              uptime: Date.now() - clientInfo.connectedAt
            }
          });
        }
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // 30 seconds
    
    // Store interval for cleanup
    ws.heartbeatInterval = heartbeatInterval;
    
    // Clean up interval on close
    ws.on('close', () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    });
  }
  
  /**
   * Handle incoming WebSocket messages
   * @param {WebSocket} ws - WebSocket connection
   * @param {Buffer} data - Message data
   */
  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());
      const clientInfo = this.clientInfo.get(ws);
      
      console.debug(`[ADMIN-WS] Received message from ${clientInfo?.ip}: ${message.type}`);
      
      // Handle different message types
      switch (message.type) {
        case 'auth':
          // Authentication message (already handled during connection)
          this.sendToClient(ws, {
            type: 'auth_success',
            data: { 
              timestamp: new Date().toISOString(),
              userId: message.userId || 'admin',
              role: message.role || 'admin'
            }
          });
          break;
          
        case 'subscribe': {
          // Subscribe to specific event types
          const events = message.events || ['ai_session_update', 'ai_session_flagged', 'ai_metrics_update'];
          this.clientInfo.get(ws).subscribedEvents = events;
          this.sendToClient(ws, {
            type: 'subscription_success',
            data: { 
              events: events,
              timestamp: new Date().toISOString()
            }
          });
          break;
        }
          
        case 'ping':
          this.sendToClient(ws, {
            type: 'pong',
            data: { timestamp: new Date().toISOString() }
          });
          break;
          
        case 'request_status':
          this.sendToClient(ws, {
            type: 'status_update',
            data: sessionTracker.getSystemMetrics()
          });
          break;
          
        default:
          console.warn(`[ADMIN-WS] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[ADMIN-WS] Message handling error:', error);
    }
  }
  
  /**
   * Send message to specific client
   * @param {WebSocket} ws - WebSocket connection
   * @param {object} message - Message object
   */
  sendToClient(ws, message) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('[ADMIN-WS] Failed to send message to client:', error);
    }
  }
  
  /**
   * Broadcast message to all connected admin clients
   * @param {object} message - Message object to broadcast
   */
  broadcast(message) {
    const messageStr = JSON.stringify(message);
    let successCount = 0;
    
    for (const ws of this.connectedClients) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
          successCount++;
        }
      } catch (error) {
        console.error('[ADMIN-WS] Failed to broadcast to client:', error);
        // Remove failed connection
        this.handleDisconnection(ws, 1006, 'Send Error');
      }
    }
    
    if (this.connectedClients.size > 0) {
      console.debug(`[ADMIN-WS] Broadcast ${message.type} to ${successCount}/${this.connectedClients.size} clients`);
    }
  }
  
  /**
   * Set up event listeners for session tracker events
   */
  setupEventListeners() {
    // Listen for session tracker events and transform them to admin dashboard format
    sessionTracker.addEventListener((eventType, eventData) => {
      this.handleSessionEvent(eventType, eventData);
    });
    
    // Set up periodic metrics updates (every 30 seconds)
    setInterval(() => {
      this.broadcastMetricsUpdate();
    }, 30000);
  }
  
  /**
   * Handle session events and broadcast in admin dashboard format
   * @param {string} eventType - Type of session event
   * @param {object} eventData - Event data
   */
  handleSessionEvent(eventType, eventData) {
    let adminEvent = null;
    
    switch (eventType) {
      case 'session_started':
        adminEvent = {
          type: 'ai_session_update',
          sessionId: eventData.sessionId,
          status: 'started',
          timestamp: eventData.timestamp,
          userId: eventData.userId || 'anonymous',
          responseTime: null
        };
        break;
        
      case 'session_completed':
        adminEvent = {
          type: 'ai_session_update',
          sessionId: eventData.sessionId,
          status: 'completed',
          timestamp: eventData.timestamp,
          userId: eventData.userId || 'anonymous',
          responseTime: eventData.responseTime || null
        };
        break;
        
      case 'session_failed':
        adminEvent = {
          type: 'ai_session_update',
          sessionId: eventData.sessionId,
          status: 'failed',
          timestamp: eventData.timestamp,
          userId: eventData.userId || 'anonymous',
          responseTime: eventData.responseTime || null
        };
        break;
        
      case 'session_flagged':
        adminEvent = {
          type: 'ai_session_flagged',
          sessionId: eventData.sessionId,
          flagReason: eventData.flagReason || 'quality_concern',
          flaggedBy: eventData.flaggedBy || 'system',
          timestamp: eventData.timestamp
        };
        break;
    }
    
    if (adminEvent) {
      this.broadcast(adminEvent);
    }
  }
  
  /**
   * Broadcast periodic metrics updates to admin dashboard
   */
  broadcastMetricsUpdate() {
    const metrics = sessionTracker.getDetailedMetrics();
    
    const metricsUpdate = {
      type: 'ai_metrics_update',
      metrics: {
        activeSessions: metrics.active_sessions || 0,
        successRate: Math.round(metrics.success_rate || 100),
        averageResponseTime: Math.round(metrics.avg_response_time || 0)
      },
      timestamp: new Date().toISOString()
    };
    
    this.broadcast(metricsUpdate);
  }
  
  /**
   * Get connection statistics
   * @returns {object} Connection statistics
   */
  getConnectionStats() {
    return {
      connectedClients: this.connectedClients.size,
      clientDetails: Array.from(this.clientInfo.values()).map(info => ({
        ip: info.ip,
        token: info.token,
        connectedAt: info.connectedAt,
        uptime: Date.now() - info.connectedAt,
        lastHeartbeat: info.lastHeartbeat
      }))
    };
  }
}

// Export singleton instance
/**
 *
 */
export const adminWebSocketServer = new AdminWebSocketServer();