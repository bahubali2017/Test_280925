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

console.log("✅ Routes mounted: /api/chat, /api/feedback, /api/system, /api/admin");

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

    const startServer = (port: number) => {
      try {
        const server = httpServer.listen(port, "0.0.0.0", () => {
          console.log(`🚀 Production server started on port ${port}`);
          console.log(`📁 Static files served from: ${staticPath}`);
        });
        server.requestTimeout = 10000;
        server.headersTimeout = 12000;
        server.keepAliveTimeout = 5000;
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
  }
})();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
