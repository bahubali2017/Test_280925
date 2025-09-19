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

// BETA TESTING: Disable rate limiting for unlimited AI access
process.env.DISABLE_RATE_LIMIT = 'true';
console.log('🎯 [BETA-TESTING] Rate limiting disabled for unlimited AI access');

// CRITICAL: Determine NODE_ENV for proper asset serving
// For Replit compatibility, we run production mode with built assets
process.env.NODE_ENV = "production";

// Build cache integration
import { BuildCache } from './utils/buildCache.js';

// Check if rebuild is necessary
const needsRebuild = BuildCache.checkBuildNecessity();
if (needsRebuild) {
  console.log('[BUILD] Rebuild required - assets may be outdated');
} else {
  console.log('[BUILD] Using cached build - assets are current');
}

// Build fingerprinting to track rebuild necessity
const BUILD_TIMESTAMP = Date.now();
console.log(`[ENV-OVERRIDE] NODE_ENV set to: ${process.env.NODE_ENV}`);
console.log(`[BUILD] Build timestamp: ${BUILD_TIMESTAMP}`);

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

// Block access to source files to prevent security issues
app.use((req, res, next) => {
  // Block direct access to source files
  if (req.path.startsWith("/src/") || req.path.startsWith("/client/src/")) {
    console.log(`[SECURITY] Blocked access to source file: ${req.path}`);
    return res.status(404).json({ error: "Source files not accessible" });
  }
  next();
});

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
  const NODE_ENV = process.env.NODE_ENV;
  const PORT = parseInt(process.env.PORT || "5000", 10);

  console.log(`[BOOT] Server running in ${NODE_ENV} mode on port ${PORT}`);

  if (NODE_ENV === "development") {
    setupVite(app)
      .then(() => {
        // Simple development server startup
        httpServer.listen(PORT, "0.0.0.0", () => {
          console.log(`🚀 Dev server started on port ${PORT}`);
          log(`serving on port ${PORT}`);
        });
        
        httpServer.on('error', (err: any) => {
          console.error("Failed to start server:", err);
          process.exit(1);
        });
      })
      .catch((err) => {
        console.error("Error setting up Vite:", err);
        process.exit(1);
      });
  } else {
    // Production mode - serve built static files
    const staticPath = path.resolve(__dirname, "public");
    console.log(`[PRODUCTION] Serving static files from: ${staticPath}`);

    // Serve static files with explicit MIME types and cache headers
    app.use(express.static(staticPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
          // Cache JS files aggressively (they should be hashed)
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
          // Cache CSS files aggressively (they should be hashed)
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (filePath.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html');
          // Don't cache HTML files
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (filePath.match(/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
          // Cache static assets aggressively
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));

    // Explicit /assets/* handler with MIME types and aggressive caching
    app.get("/assets/*", (req, res, next) => {
      const filePath = path.join(staticPath, req.path);
      
      // Set correct MIME type and aggressive cache headers for assets
      if (req.path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (req.path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      
      // Assets should be cached aggressively (they are hashed)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('ETag', 'strong');
      
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`[PRODUCTION] Asset not found: ${filePath}`);
          res.status(404).send('Asset not found');
        }
      });
    });

    // Service Worker route - must come before SPA fallback
    app.get("/sw.js", (req, res) => {
      const swPath = path.join(staticPath, "sw.js");
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Service-Worker-Allowed', '/');
      res.sendFile(swPath, (err) => {
        if (err) {
          console.error(`[PRODUCTION] Service Worker not found: ${swPath}`);
          res.status(404).send('Service Worker not found');
        }
      });
    });

    // SPA fallback - serve index.html with no-cache headers for all non-API routes
    app.get("*", (req, res, next) => {
      // Skip API, admin, and service worker routes
      if (req.path.startsWith("/api") || req.path.startsWith("/admin") || req.path === "/sw.js") {
        return next();
      }
      
      const indexPath = path.join(staticPath, "index.html");
      
      // Set no-cache headers for index.html to ensure it's always fresh
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`[PRODUCTION] index.html not found: ${indexPath}`);
          res.status(500).send('Application not found');
        }
      });
    });

    // Simple cloud-friendly server startup
    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Production server started on port ${port}`);
      console.log(`📁 Static files served from: ${staticPath}`);
      
      // Mark build as completed successfully
      BuildCache.markBuildComplete(true);
    });
    
    // Handle server errors
    httpServer.on('error', (err: any) => {
      console.error("Server error:", err);
      process.exit(1);
    });
  }
})();











