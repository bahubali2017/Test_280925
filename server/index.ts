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
import { log, setupVite, serveStatic } from "./vite.js";
import { testSupabaseConnection, startHealthMonitoring, getSupabaseHealthStatus } from './test-connection.js';
import watchdog from './supabase-watchdog.js';
import systemStatusRoutes from './routes/system-status.js';
import adminMetricsRoutes from './routes/admin-metrics.js';
import { systemStatusRateLimit, adminEndpointRateLimit, chatEndpointRateLimit, productionRateLimit } from './middleware/rateLimiter.js';
import { adminWebSocketServer } from './websocket/adminMonitoring.js';
import { uptimeTracker } from './utils/uptimeTracker.js';
import { securityHeadersMiddleware, productionCorsMiddleware, securityLoggingMiddleware } from './middleware/securityHeaders.js';
import { buildFingerprintMiddleware } from './utils/buildFingerprint.js';
import honeypotRoutes from './routes/honeypot.js';

// Removed unused imports: path, fileURLToPath

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.locals.supabaseHealthy = false;

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    supabase: getSupabaseHealthStatus() ? 'up' : 'down',
    time: new Date().toISOString(),
  });
});

// Watchdog metrics endpoint
app.get('/api/ops/supabase-watchdog', (_req, res) => {
  const metrics = watchdog.getMetrics();
  res.json(metrics);
});

// Mount the circuit breaker globally for Supabase-dependent APIs
app.use((req, res, next) => {
  if (watchdog.isCircuitBreakerOpen()) {
    return res.status(503).json(watchdog.getDemoModeResponse());
  }
  next();
});

// Enhanced security middleware layer
app.use(securityLoggingMiddleware);
app.use(productionCorsMiddleware);
app.use(securityHeadersMiddleware);

// Apply buildFingerprintMiddleware only to HTML responses, not static assets
app.use((req, res, next) => {
  // Skip buildFingerprintMiddleware for static assets
  if (req.path.startsWith('/assets/') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }
  buildFingerprintMiddleware(req, res, next);
});

app.use(productionRateLimit);

// Mount honeypot routes before other routes (but skip for assets)
app.use((req, res, next) => {
  // Skip honeypot for static assets
  if (req.path.startsWith('/assets/') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
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

// Test Supabase connection on startup and start monitoring
(async () => {
  const cfg = {
    url: process.env.SUPABASE_URL,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    environment: process.env.NODE_ENV || 'development',
  };
  console.log('Configuration loaded successfully', cfg);

  console.log('Testing Supabase connection...');
  const res = await testSupabaseConnection();
  app.locals.supabaseHealthy = !!res.ok;
  
  if (res.ok) {
    console.log(`✅ Supabase connection OK${res.method ? ` (via ${res.method})` : ''}`);
  } else {
    console.warn('Supabase connection test failed:', res.reason);
    console.warn('⚠️ Supabase not accessible - authentication will be limited');
  }

  // Start continuous health monitoring
  startHealthMonitoring((healthy: boolean, result: any) => {
    app.locals.supabaseHealthy = healthy;
    if (healthy) {
      console.log(`✅ Supabase connection restored${result.method ? ` (via ${result.method})` : ''}`);
    } else {
      console.warn(`❌ Supabase connection lost: ${result.reason}`);
      console.warn('⚠️ Supabase not accessible - authentication will be limited');
    }
  });

  // Start the watchdog monitoring system
  watchdog.start();
})();

// Set up server with clean route mounting
const httpServer = createServer(app);

// Initialize admin WebSocket server
adminWebSocketServer.initialize(httpServer);

// Start server
(() => {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const PORT = parseInt(process.env.PORT || '5000', 10);
  
  console.log(`[BOOT] Server running in ${NODE_ENV} mode on port ${PORT}`);
  
  // Set up Vite in development or serve static files in production FIRST
  if (NODE_ENV === "development") {
    setupVite(app)
      .then(() => {
        const startServer = (port: number) => {
          try {
            httpServer.listen(port, '0.0.0.0', () => {
              console.log(`🚀 Server successfully started on port ${port}`);
              log(`serving on port ${port}`);
            });
          } catch (err: any) {
            if (err.code === 'EADDRINUSE') {
              console.warn(`⚠️ Port ${port} is in use, trying ${port + 1}`);
              startServer(port + 1);
            } else {
              console.error('Failed to start server:', err);
              process.exit(1);
            }
          }
        };

        startServer(PORT);
      })
      .catch((err) => {
        console.error("Error setting up server:", err);
        process.exit(1);
      });
  } else {
    // Serve static files in production FIRST - before any API routes
    console.log(`[PRODUCTION] Serving static files from dist/public/`);
    
    // Serve ALL static files from dist/public - this must come BEFORE API routes
    // When running from dist/index.js, __dirname is 'dist', so we need './public'
    const staticPath = path.resolve(__dirname, "./public");
    console.log(`[PRODUCTION] Static path resolved to: ${staticPath}`);
    app.use(express.static(staticPath));
    
    // Explicitly handle assets with proper error handling and correct path
    app.get("/assets/*", (req, res, next) => {
      const filePath = path.resolve(staticPath, req.path.substring(1)); // Remove leading slash
      console.log(`[ASSETS] Serving ${req.path} from ${filePath}`);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`Asset not found: ${filePath}`);
          next(); // Let it fall through to catch-all
        }
      });
    });

    const startServer = (port: number) => {
      try {
        const server = httpServer.listen(port, '0.0.0.0', () => {
          console.log(`🚀 Server successfully started on port ${port}`);
        });
        
        // Shorten low-level timeouts to avoid long hangs
        server.requestTimeout = 10000;   // 10s
        server.headersTimeout = 12000;   // 12s  
        server.keepAliveTimeout = 5000;  // 5s
      } catch (err: any) {
        if (err.code === 'EADDRINUSE') {
          console.warn(`⚠️ Port ${port} is in use, trying ${port + 1}`);
          startServer(port + 1);
        } else {
          console.error('Failed to start server:', err);
          process.exit(1);
        }
      }
    };

    startServer(PORT);
  }
  
  // Mount API routes AFTER static file serving is set up
  // Mount chat routes at /api
  app.use("/api", chatRoutes);

  // Mount feedback routes at /api/feedback
  const feedbackRouter = createFeedbackRoutes();
  app.use("/api/feedback", feedbackRouter);

  // Mount admin routes with rate limiting
  app.use("/api/system", systemStatusRateLimit, systemStatusRoutes);
  app.use("/api/admin", adminEndpointRateLimit, adminMetricsRoutes);

  console.log("✅ Chat routes mounted at /api/chat, /api/chat/stream");
  console.log("✅ Feedback routes mounted at /api/feedback");
  console.log("✅ Admin routes mounted at /api/system, /api/admin");

  // Add debug routes directly to app for /admin paths  
  const debugRouter = express.Router();
  debugRouter.get('/debug/:sessionId', async (req, res) => {
    res.json({ 
      debug: true, 
      sessionId: req.params.sessionId,
      message: "Debug endpoint active" 
    });
  });
  app.use("/admin", debugRouter);
  
  // Add SPA fallback routing for production (MUST be last)
  if (NODE_ENV === "production") {
    app.get("*", (req, res, next) => {
      // Skip API routes  
      if (req.path.startsWith("/api") || req.path.startsWith("/admin")) {
        return next();
      }
      res.sendFile(path.resolve(__dirname, "./public/index.html"));
    });
  }
})();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});