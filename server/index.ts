/**
 * @file Entry point for the Anamnesis Medical AI Assistant server
 */

import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import chatRoutes from "./routes.js";
import { createFeedbackRoutes } from "./feedback-routes.js";
import { log, setupVite } from "./vite.js";
import { testSupabaseConnection, startHealthMonitoring, getSupabaseHealthStatus } from "./test-connection.js";
import watchdog from "./supabase-watchdog.js";
import systemStatusRoutes from "./routes/system-status.js";
import adminMetricsRoutes from "./routes/admin-metrics.js";
import { systemStatusRateLimit, adminEndpointRateLimit, chatEndpointRateLimit, productionRateLimit } from "./middleware/rateLimiter.js";
import { adminWebSocketServer } from "./websocket/adminMonitoring.js";
import { uptimeTracker } from "./utils/uptimeTracker.js";
import { securityHeadersMiddleware, productionCorsMiddleware, securityLoggingMiddleware } from "./middleware/securityHeaders.js";
import { buildFingerprintMiddleware } from "./utils/buildFingerprint.js";
import honeypotRoutes from "./routes/honeypot.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.locals.supabaseHealthy = false;

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    supabase: getSupabaseHealthStatus() ? "up" : "down",
    time: new Date().toISOString(),
  });
});

// Watchdog metrics endpoint
app.get("/api/ops/supabase-watchdog", (_req, res) => {
  const metrics = watchdog.getMetrics();
  res.json(metrics);
});

// Circuit breaker for Supabase-dependent APIs
app.use((req, res, next) => {
  if (watchdog.isCircuitBreakerOpen()) {
    return res.status(503).json(watchdog.getDemoModeResponse());
  }
  next();
});

// Security middleware
app.use(securityLoggingMiddleware);
app.use(productionCorsMiddleware);
app.use(securityHeadersMiddleware);

// Apply buildFingerprintMiddleware only to HTML responses
app.use((req, res, next) => {
  if (
    req.path.startsWith("/assets/") ||
    req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
  ) {
    return next();
  }
  buildFingerprintMiddleware(req, res, next);
});

app.use(productionRateLimit);

// Honeypot routes (skip for assets)
app.use((req, res, next) => {
  if (
    req.path.startsWith("/assets/") ||
    req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
  ) {
    return next();
  }
  honeypotRoutes(req, res, next);
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ error: message });
});

// Test Supabase connection on startup
(async () => {
  const cfg = {
    url: process.env.SUPABASE_URL,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    environment: process.env.NODE_ENV || "development",
  };
  console.log("Configuration loaded successfully", cfg);

  console.log("Testing Supabase connection...");
  const res = await testSupabaseConnection();
  app.locals.supabaseHealthy = !!res.ok;

  if (res.ok) {
    console.log(`✅ Supabase connection OK${res.method ? ` (via ${res.method})` : ""}`);
  } else {
    console.warn("Supabase connection test failed:", res.reason);
    console.warn("⚠️ Supabase not accessible - authentication will be limited");
  }

  startHealthMonitoring((healthy: boolean, result: any) => {
    app.locals.supabaseHealthy = healthy;
    if (healthy) {
      console.log(`✅ Supabase connection restored${result.method ? ` (via ${result.method})` : ""}`);
    } else {
      console.warn(`❌ Supabase connection lost: ${result.reason}`);
    }
  });

  watchdog.start();
})();

// Mount API routes BEFORE starting server
app.use("/api", chatRoutes);
const feedbackRouter = createFeedbackRoutes();
app.use("/api/feedback", feedbackRouter);
app.use("/api/system", systemStatusRateLimit, systemStatusRoutes);
app.use("/api/admin", adminEndpointRateLimit, adminMetricsRoutes);

// Mount specific AI stats endpoint at /api/ai/stats as required by admin dashboard
import { adminAuthMiddleware } from './middleware/adminAuthMiddleware.js';
import { sessionTracker } from './utils/sessionTracker.js';
import { adminLogger } from './utils/adminLogger.js';

app.get('/api/ai/stats', adminEndpointRateLimit, adminAuthMiddleware, async (req, res) => {
  const requestStart = Date.now();
  
  try {
    const metrics = sessionTracker.getDetailedMetrics();
    const allSessions = [...sessionTracker.activeSessions.values(), ...sessionTracker.completedSessions];
    
    // Calculate last 7 days of requests
    const requestsPerDay = {};
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      requestsPerDay[dateStr] = allSessions.filter(session => 
        session.startTime >= dayStart.getTime() && session.startTime <= dayEnd.getTime()
      ).length;
    }
    
    // Calculate metrics from real session data
    const completedSessionsLast24h = sessionTracker.completedSessions.filter(session => 
      session.endTime && session.endTime > (Date.now() - 24 * 60 * 60 * 1000)
    );
    
    const totalRequests = completedSessionsLast24h.length;
    const failedSessions = completedSessionsLast24h.filter(s => s.status !== 'completed');
    const successfulSessions = completedSessionsLast24h.filter(s => s.status === 'completed');
    const flaggedSessions = completedSessionsLast24h.filter(s => s.flagged);
    
    const successRate = totalRequests > 0 ? Math.round((successfulSessions.length / totalRequests) * 100) : 100;
    const failureRate = 100 - successRate;
    
    // Calculate average response time from all completed sessions
    const responseTimes = completedSessionsLast24h
      .map(s => s.metrics.avgLatency)
      .filter(time => time > 0);
    const averageResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0;
    
    const aiStatsResponse = {
      activeSessions: sessionTracker.activeSessions.size,
      failedResponses: failedSessions.length,
      successRate: successRate,
      averageResponseTime: averageResponseTime,
      totalSessions: allSessions.length,
      flaggedRegressions: flaggedSessions.length,
      failureRate: failureRate,
      requestsPerDay: requestsPerDay,
      timestamp: new Date().toISOString(),
      source: "mvp-live-data"
    };
    
    // Log admin access
    const responseTime = Date.now() - requestStart;
    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.substring(7) : 'unknown';
    const maskedToken = token.length > 8 ? `${token.substring(0, 4)}***${token.substring(token.length - 4)}` : '***';
    
    await adminLogger.logAccess({
      endpoint: '/api/ai/stats',
      method: 'GET',
      adminToken: maskedToken,
      sourceIP: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      responseStatus: 200,
      responseTime
    });
    
    res.json(aiStatsResponse);
  } catch (error) {
    console.error('[AI-STATS] Stats endpoint error:', error);
    
    // Log error
    await adminLogger.logError({
      component: 'ai-stats',
      error: error.message || 'Unknown error',
      severity: 'high',
      sessionId: 'ai-stats-endpoint'
    });
    
    const responseTime = Date.now() - requestStart;
    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.substring(7) : 'unknown';
    const maskedToken = token.length > 8 ? `${token.substring(0, 4)}***${token.substring(token.length - 4)}` : '***';
    
    await adminLogger.logAccess({
      endpoint: '/api/ai/stats',
      method: 'GET',
      adminToken: maskedToken,
      sourceIP: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      responseStatus: 500,
      responseTime
    });
    
    res.status(500).json({
      success: false,
      message: 'AI statistics unavailable'
    });
  }
});

console.log("✅ Routes mounted: /api/chat, /api/feedback, /api/system, /api/admin, /api/ai");

const debugRouter = express.Router();
debugRouter.get("/debug/:sessionId", async (req, res) => {
  res.json({
    debug: true,
    sessionId: req.params.sessionId,
    message: "Debug endpoint active",
  });
});
app.use("/admin", debugRouter);

// HTTP server
const httpServer = createServer(app);
adminWebSocketServer.initialize(httpServer);

// Start server
(() => {
  const NODE_ENV = process.env.NODE_ENV || "development";
  const PORT = parseInt(process.env.PORT || "5000", 10);

  console.log(`[BOOT] Server running in ${NODE_ENV} mode on port ${PORT}`);

  if (NODE_ENV === "development") {
    setupVite(app)
      .then(() => {
        const startServer = (port: number) => {
          try {
            httpServer.listen(port, "0.0.0.0", () => {
              console.log(`🚀 Dev server started on port ${port}`);
              log(`serving on port ${port}`);
            });
          } catch (err: any) {
            if (err.code === "EADDRINUSE") {
              console.warn(`⚠️ Port ${port} in use, trying ${port + 1}`);
              startServer(port + 1);
            } else {
              console.error("Failed to start server:", err);
              process.exit(1);
            }
          }
        };
        startServer(PORT);
      })
      .catch((err) => {
        console.error("Error setting up Vite:", err);
        process.exit(1);
      });
  } else {
    // Production mode - serve built static files
    const staticPath = path.resolve(__dirname, "public");
    console.log(`[PRODUCTION] Serving static files from: ${staticPath}`);

    // Serve static files with explicit MIME types
    app.use(express.static(staticPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html');
        }
      }
    }));

    // Explicit /assets/* handler with MIME types
    app.get("/assets/*", (req, res, next) => {
      const filePath = path.join(staticPath, req.path);
      
      // Set correct MIME type based on file extension
      if (req.path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (req.path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`[PRODUCTION] Asset not found: ${filePath}`);
          res.status(404).send('Asset not found');
        }
      });
    });

    // SPA fallback - serve index.html for all non-API routes
    app.get("*", (req, res, next) => {
      // Skip API and admin routes
      if (req.path.startsWith("/api") || req.path.startsWith("/admin")) {
        return next();
      }
      
      const indexPath = path.join(staticPath, "index.html");
      res.setHeader('Content-Type', 'text/html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`[PRODUCTION] index.html not found: ${indexPath}`);
          res.status(500).send('Application not found');
        }
      });
    });

    const startServer = async (port: number, retries: number = 3) => {
      try {
        // Check if port is in use and attempt cleanup
        await cleanupExistingProcess(port);
        
        // Create PID file before attempting to listen
        createPidFile(process.pid);
        
        const server = httpServer.listen(port, "0.0.0.0", () => {
          console.log(`🚀 Production server started on port ${port}`);
          console.log(`📁 Static files served from: ${staticPath}`);
          
          // Store server reference for graceful shutdown
          global.httpServer = server;
        });
        
        server.requestTimeout = 10000;
        server.headersTimeout = 12000;
        server.keepAliveTimeout = 5000;
        
        server.on('error', async (err: any) => {
          if (err.code === "EADDRINUSE" && retries > 0) {
            console.warn(`⚠️ Port ${port} still in use after cleanup, retrying (${retries} attempts left)`);
            // Remove PID file since we're retrying
            removePidFile();
            // Wait a bit and retry with more aggressive cleanup
            await new Promise(resolve => setTimeout(resolve, 2000));
            startServer(port, retries - 1);
          } else if (err.code === "EADDRINUSE") {
            console.error(`❌ Port ${port} remains in use after ${3} cleanup attempts. Exiting.`);
            removePidFile();
            process.exit(1);
          } else {
            console.error("Server error:", err);
            removePidFile();
            process.exit(1);
          }
        });
        
      } catch (err: any) {
        console.error("Failed to start server:", err);
        process.exit(1);
      }
    };
    
    startServer(PORT);
  }
})();

// ============================================================================
// COMPREHENSIVE PROCESS MANAGEMENT & CLEANUP SYSTEM
// ============================================================================

import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';
const execAsync = promisify(exec);

// Add global type for server reference
declare global {
  var httpServer: any;
}

/**
 * Process lock and PID file management for single instance enforcement
 */
const PID_FILE = '/tmp/anamnesis-server.pid';
const LOCK_FILE = '/tmp/anamnesis-server.lock';

/**
 * Acquire process lock to prevent multiple instances
 */
function acquireProcessLock(): boolean {
  try {
    // Check if lock file exists
    if (fs.existsSync(LOCK_FILE)) {
      const lockData = fs.readFileSync(LOCK_FILE, 'utf8');
      const { pid, timestamp } = JSON.parse(lockData);
      
      // Check if the process is still running
      try {
        process.kill(parseInt(pid), 0); // Test signal
        const age = Date.now() - timestamp;
        
        // If lock is older than 30 seconds and process exists, it might be stuck
        if (age > 30000) {
          console.log(`[PROCESS-MGMT] Stale lock detected (${Math.round(age/1000)}s old), attempting cleanup...`);
          try {
            process.kill(parseInt(pid), 'SIGKILL');
            removeLockFile();
          } catch (e) {
            // Process might already be dead
            removeLockFile();
          }
        } else {
          console.warn(`[PROCESS-MGMT] Another server instance is running (PID: ${pid})`);
          return false;
        }
      } catch (e) {
        // Process not running, remove stale lock
        console.log(`[PROCESS-MGMT] Removing stale lock file (process ${pid} not running)`);
        removeLockFile();
      }
    }
    
    // Create new lock file
    const lockData = {
      pid: process.pid,
      timestamp: Date.now(),
      startTime: new Date().toISOString()
    };
    
    fs.writeFileSync(LOCK_FILE, JSON.stringify(lockData, null, 2));
    console.log(`[PROCESS-MGMT] Process lock acquired for PID: ${process.pid}`);
    return true;
    
  } catch (err) {
    console.error(`[PROCESS-MGMT] Failed to acquire process lock:`, err);
    return false;
  }
}

function removeLockFile() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      console.log(`[PROCESS-MGMT] Lock file removed: ${LOCK_FILE}`);
    }
  } catch (err) {
    console.warn(`[PROCESS-MGMT] Failed to remove lock file:`, err);
  }
}

function createPidFile(pid: number) {
  try {
    fs.writeFileSync(PID_FILE, pid.toString());
    console.log(`[PROCESS-MGMT] PID file created: ${PID_FILE} (${pid})`);
  } catch (err) {
    console.warn(`[PROCESS-MGMT] Failed to create PID file:`, err);
  }
}

function removePidFile() {
  try {
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
      console.log(`[PROCESS-MGMT] PID file removed: ${PID_FILE}`);
    }
  } catch (err) {
    console.warn(`[PROCESS-MGMT] Failed to remove PID file:`, err);
  }
}

/**
 * Cleanup existing processes that might be holding the port
 */
async function cleanupExistingProcess(port: number): Promise<void> {
  console.log(`[PROCESS-MGMT] Checking for existing processes on port ${port}`);
  
  try {
    // Check PID file first
    if (fs.existsSync(PID_FILE)) {
      const oldPid = fs.readFileSync(PID_FILE, 'utf8').trim();
      console.log(`[PROCESS-MGMT] Found PID file with PID: ${oldPid}`);
      
      try {
        // Check if process is still running
        process.kill(parseInt(oldPid), 0); // Test signal, doesn't kill
        console.log(`[PROCESS-MGMT] Old process ${oldPid} still running, terminating...`);
        
        // Try graceful shutdown first
        process.kill(parseInt(oldPid), 'SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force kill if still running
        try {
          process.kill(parseInt(oldPid), 0);
          console.log(`[PROCESS-MGMT] Force killing old process ${oldPid}`);
          process.kill(parseInt(oldPid), 'SIGKILL');
        } catch (e) {
          // Process already dead
        }
      } catch (e) {
        // Process not running, remove stale PID file
        removePidFile();
      }
    }
    
    // Kill any processes using the target port
    try {
      const { stdout } = await execAsync(`netstat -tlnp 2>/dev/null | grep :${port} || true`);
      if (stdout.trim()) {
        console.log(`[PROCESS-MGMT] Found process using port ${port}, cleaning up...`);
        
        // Extract PIDs and kill them
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const match = line.match(/(\d+)\/node/);
          if (match) {
            const pid = match[1];
            console.log(`[PROCESS-MGMT] Killing process ${pid} using port ${port}`);
            try {
              process.kill(parseInt(pid), 'SIGTERM');
              await new Promise(resolve => setTimeout(resolve, 1000));
              try {
                process.kill(parseInt(pid), 'SIGKILL');
              } catch (e) { /* Already dead */ }
            } catch (e) {
              console.warn(`[PROCESS-MGMT] Failed to kill PID ${pid}:`, e);
            }
          }
        }
      }
    } catch (e) {
      // netstat might not be available, continue anyway
      console.log(`[PROCESS-MGMT] netstat unavailable, proceeding with startup`);
    }
    
    // Additional cleanup: kill any node processes with "dist/index.js"
    try {
      const { stdout } = await execAsync(`pgrep -f "dist/index.js" || true`);
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        for (const pid of pids) {
          if (pid && pid !== process.pid.toString()) {
            console.log(`[PROCESS-MGMT] Killing orphaned server process: ${pid}`);
            try {
              process.kill(parseInt(pid), 'SIGTERM');
              await new Promise(resolve => setTimeout(resolve, 1000));
              process.kill(parseInt(pid), 'SIGKILL');
            } catch (e) { /* Already dead */ }
          }
        }
      }
    } catch (e) {
      // pgrep might not be available
    }
    
    console.log(`[PROCESS-MGMT] Cleanup completed for port ${port}`);
    
  } catch (error) {
    console.warn(`[PROCESS-MGMT] Cleanup error (non-fatal):`, error);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string) {
  console.log(`\n[PROCESS-MGMT] Received ${signal}, initiating graceful shutdown...`);
  
  // Close HTTP server if it exists
  if (global.httpServer) {
    console.log(`[PROCESS-MGMT] Closing HTTP server...`);
    global.httpServer.close((err) => {
      if (err) {
        console.error(`[PROCESS-MGMT] Error closing server:`, err);
      } else {
        console.log(`[PROCESS-MGMT] HTTP server closed`);
      }
    });
  }
  
  // Close WebSocket connections
  try {
    if (adminWebSocketServer && adminWebSocketServer.wss) {
      adminWebSocketServer.wss.close();
      console.log(`[PROCESS-MGMT] WebSocket server closed`);
    }
  } catch (err) {
    console.warn(`[PROCESS-MGMT] Error closing WebSocket:`, err);
  }
  
  // Clean up PID and lock files
  removePidFile();
  removeLockFile();
  
  console.log(`[PROCESS-MGMT] Graceful shutdown completed`);
  
  // Force exit after timeout
  setTimeout(() => {
    console.log(`[PROCESS-MGMT] Force exit after timeout`);
    process.exit(0);
  }, 5000);
}

// Register signal handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// Enhanced error handling
process.on("uncaughtException", (err) => {
  console.error("[PROCESS-MGMT] Uncaught Exception:", err);
  removePidFile();
  removeLockFile();
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[PROCESS-MGMT] Unhandled Rejection at:", promise, "reason:", reason);
  removePidFile();
  removeLockFile();
  process.exit(1);
});

// Cleanup on normal exit
process.on('exit', (code) => {
  console.log(`[PROCESS-MGMT] Process exiting with code: ${code}`);
  removePidFile();
  removeLockFile();
});

// Initialize process management - acquire lock BEFORE everything else
console.log(`[PROCESS-MGMT] Initializing process management for PID: ${process.pid}`);

if (!acquireProcessLock()) {
  console.error(`[PROCESS-MGMT] Failed to acquire process lock - another instance may be running`);
  process.exit(1);
}

console.log(`[PROCESS-MGMT] Process management initialized successfully`);
