/**
 * @file API routes for the Anamnesis Medical AI Assistant
 */

import express from "express";
import { createServer } from "http";
import { storage } from "./storage.js";
import { z } from "zod";
import { authenticateUser, createUser, verifyToken } from "./auth-api.js";
import messageApiRouter from "./api/message-api.js";
import directEndpoints from "./api/direct-endpoints.js";
import { setTimeout } from "timers";
import { TextDecoder } from "util";
import { sessionTracker } from "./utils/sessionTracker.js";
import { injectWatermark, logAIResponse } from "./utils/watermarking.js";
import { chatEndpointRateLimit } from "./middleware/rateLimiter.js";

// Import the test connection function
import { testSupabaseConnection } from "./test-connection.js";
import watchdog from "./supabase-watchdog.js";

/**
 * Circuit breaker middleware for Supabase-dependent APIs
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object  
 * @param {import('express').NextFunction} next - Next middleware function
 * @returns {void}
 */
const circuitBreakerMiddleware = (req, res, next) => {
  if (watchdog.isCircuitBreakerOpen()) {
    return res.status(503).json(watchdog.getDemoModeResponse());
  }
  next();
};

/**
 * Process AI response to ensure completeness and clean formatting
 * @param {string} response - Raw AI response
 * @param {string} sessionId - Session ID for logging
 * @returns {string} Processed response
 */
async function processAIResponse(response, sessionId) {
  if (!response) return response;
  
  // Remove all # symbols and markdown formatting
  let cleaned = response.replace(/#/g, '').replace(/\*\*/g, '');
  
  // Check if response seems incomplete (ends abruptly in middle of sentence/list)
  const trimmed = cleaned.trim();
  const lastChar = trimmed.slice(-1);
  const lastWords = trimmed.split(' ').slice(-5).join(' ').toLowerCase();
  
  // Signs of incomplete response
  const endsAbruptly = (
    lastChar === ':' || // Ends with colon (incomplete section)
    lastWords.includes('final recommend') || // Incomplete "Final Recommendations"
    lastWords.includes('monitor for') || // Incomplete monitoring
    trimmed.endsWith('1.') || trimmed.endsWith('2.') || trimmed.endsWith('3.') || // Incomplete numbered list
    trimmed.endsWith('-') // Incomplete bullet point
  );
  
  if (endsAbruptly) {
    console.warn(`[${sessionId}] Detected incomplete response, adding completion note`);
    cleaned += '\n\nNote: This information provides key medical guidance. For complete protocols and specific dosing, please consult current medical guidelines and healthcare professionals.';
  }
  
  // Apply watermarking and logging
  const watermarkedResponse = injectWatermark(cleaned, sessionId, { enabled: true });
  await logAIResponse(watermarkedResponse, sessionId, { 
    model: 'deepseek', 
    watermarked: true,
    originalLength: response.length,
    processedLength: watermarkedResponse.length 
  });
  
  return watermarkedResponse;
}

/**
 * Schema for validating chat API requests with enhanced options for Phase 4
 * @type {import('zod').ZodObject<{
 *   message: import('zod').ZodString,
 *   conversationHistory: import('zod').ZodArray<import('zod').ZodObject<{
 *     role: import('zod').ZodString,
 *     content: import('zod').ZodString
 *   }>>,
 *   isHighRisk: import('zod').ZodBoolean
 * }>}
 */
const chatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(4000, "Message is too long"),
  conversationHistory: z.array(
    z.object({
      role: z.string().min(1),
      content: z.string().min(1)
    })
  ).optional().default([]),
  isHighRisk: z.boolean().optional().default(false)
});

/**
 * Schema for validating login requests
 * @type {import('zod').ZodObject<{email: import('zod').ZodString, password: import('zod').ZodString}>}
 */
const loginRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * Schema for validating registration requests
 * @type {import('zod').ZodObject<{email: import('zod').ZodString, password: import('zod').ZodString, name: import('zod').ZodString}>}
 */
const registerRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

/**
 * Schema for validating token verification requests
 * @type {import('zod').ZodObject<{token: import('zod').ZodString}>}
 */
const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

/**
 * Gets DeepSeek configuration from environment variables
 * @returns {object} The DeepSeek configuration
 */
function getDeepSeekConfig() {
  // Configuration is now defined inline
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    model: "deepseek-chat",
    temperature: 0.4, // Balanced temperature for comprehensive yet focused responses
    maxTokens: 3000, // Increased token limit for complete medical explanations
    endpoint: "https://api.deepseek.com/v1/chat/completions",
  };
}

// Create router for chat-related API routes
const router = express.Router();

// Run the test connection on startup (non-blocking)
testSupabaseConnection()
  .then(result => {
    if (result.success) {
      console.log('✅ Supabase connection verified');
    } else {
      console.warn('⚠️ Supabase not accessible - authentication will be limited');
    }
  })
  .catch(() => {
    // Silently handle connection failures - Supabase might not be configured
    console.warn('⚠️ Supabase not configured - running with limited functionality');
  });

  /**
   * Health check endpoint
   */
router.get("/health", (req, res) => {
    const config = getDeepSeekConfig();
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      api: {
        deepseek: {
          available: !!config.apiKey,
          model: config.model
        },
        routes: {
          chat: "/api/chat",
          chat_stream: "/api/chat/stream",
          messages: "/api/messages"
        }
      }
    });
  });
  
  /**
   * Chat API test endpoint to check if the API routes are correctly mounted
   */
  router.get("/chat/test", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Chat API is available",
      routes: {
        standard: "/api/chat",
        streaming: "/api/chat/stream"
      },
      timestamp: new Date().toISOString() 
    });
  });

/**
 * Generate app version hash based on package version and build timestamp
 * @returns {Promise<string>} 8-character version hash
 */
async function generateAppVersionHash() {
  const crypto = await import('crypto');
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    // Read package.json for version info
    const packagePath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Use timestamp as build identifier (could be replaced with git commit hash in CI/CD)
    const buildTimestamp = process.env.BUILD_TIMESTAMP || Date.now().toString();
    const version = packageJson.version || '1.0.0';
    
    return crypto.default
      .createHash('sha256')
      .update(`${version}-${buildTimestamp}`)
      .digest('hex')
      .substring(0, 8);
  } catch (error) {
    console.error('Failed to generate version hash:', error);
    // Fallback to timestamp-based hash
    return Date.now().toString().slice(-8);
  }
}

/**
 * App configuration endpoint for version checking
 * Returns current app version with no-cache headers to ensure freshness
 */
router.get("/app-config.json", async (req, res) => {
  try {
    // Set no-cache headers to ensure fresh version checks
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const versionHash = await generateAppVersionHash();
    const timestamp = new Date().toISOString();
    
    // Basic app configuration with version info
    const config = {
      version: versionHash,
      timestamp: timestamp,
      mustRefresh: false, // Can be set to true if forced refresh needed
      swKillSwitch: false, // Emergency kill switch for problematic service workers
      buildInfo: {
        nodeEnv: process.env.NODE_ENV || 'development',
        buildTime: timestamp
      }
    };
    
    // Log version requests for debugging
    console.log(`[Version Check] Client requested app-config.json, serving version: ${versionHash}`);
    
    res.json(config);
  } catch (error) {
    console.error('Error serving app-config.json:', error);
    res.status(500).json({
      error: 'Failed to get app configuration',
      version: 'unknown',
      timestamp: new Date().toISOString(),
      mustRefresh: false,
      swKillSwitch: false
    });
  }
});

  /**
   * Authentication endpoints
   */
  router.post("/auth/login", circuitBreakerMiddleware, async (req, res) => {
    try {
      // Validate request
      const validation = loginRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: validation.error.errors,
        });
      }

      const { email, password } = validation.data;
      const result = await authenticateUser(email, password);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          message: result.error || "Authentication failed",
        });
      }

      return res.json({
        success: true,
        message: "Authentication successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.user_metadata?.name || "",
        },
        token: result.token,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  router.post("/auth/register", circuitBreakerMiddleware, async (req, res) => {
    try {
      // Validate request
      const validation = registerRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: validation.error.errors,
        });
      }

      const { email, password, name } = validation.data;
      const result = await createUser(email, password, { name });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error || "Registration failed",
        });
      }

      return res.json({
        success: true,
        message: "Registration successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.user_metadata?.name || "",
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  router.post("/auth/verify", circuitBreakerMiddleware, async (req, res) => {
    try {
      // Validate request
      const validation = verifyTokenSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: validation.error.errors,
        });
      }

      const { token } = validation.data;
      const result = await verifyToken(token);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          message: result.error || "Token verification failed",
        });
      }

      return res.json({
        success: true,
        message: "Token verification successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.user_metadata?.name || "",
        },
      });
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  /**
   * Authentication debug endpoint - returns comprehensive auth state information
   * Helps troubleshoot authentication issues in production
   */
  router.get("/auth/debug", async (req, res) => {
    try {
      const timestamp = new Date().toISOString();
      const authHeader = req.headers.authorization;
      
      // Initialize response object
      const debugInfo = {
        timestamp,
        authenticated: false,
        user: null,
        session: null,
        supabase_status: null,
        environment: process.env.NODE_ENV || "development",
        auth_header_present: !!authHeader,
        circuit_breaker_open: watchdog.isCircuitBreakerOpen()
      };

      // Check Supabase health status
      try {
        const { testSupabaseConnection } = await import("./test-connection.js");
        const healthResult = await testSupabaseConnection();
        debugInfo.supabase_status = healthResult.ok ? "connected" : "disconnected";
        debugInfo.supabase_method = healthResult.method || null;
        debugInfo.supabase_error = healthResult.reason || null;
      } catch (error) {
        debugInfo.supabase_status = "error";
        debugInfo.supabase_error = error.message;
      }

      // If no auth header, return early with connection info
      if (!authHeader) {
        debugInfo.message = "No authorization header provided";
        return res.json(debugInfo);
      }

      // Extract token from Bearer header
      const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
      
      if (!token) {
        debugInfo.message = "No token found in authorization header";
        return res.json(debugInfo);
      }

      // Mask token for security (show first 4 and last 4 characters)
      debugInfo.token_preview = token.length > 8 
        ? `${token.substring(0, 4)}***${token.substring(token.length - 4)}`
        : "***";

      // Verify token using existing auth function
      if (!watchdog.isCircuitBreakerOpen()) {
        try {
          const result = await verifyToken(token);
          
          if (result.success) {
            debugInfo.authenticated = true;
            debugInfo.user = {
              id: result.user.id,
              email: result.user.email,
              name: result.user.user_metadata?.name || "",
              created_at: result.user.created_at,
              last_sign_in_at: result.user.last_sign_in_at
            };
            debugInfo.message = "Authentication successful";
          } else {
            debugInfo.auth_error = result.error;
            debugInfo.message = "Token verification failed";
          }
        } catch (error) {
          debugInfo.auth_error = error.message;
          debugInfo.message = "Error during token verification";
        }
      } else {
        debugInfo.message = "Circuit breaker open - Supabase unavailable";
      }

      return res.json(debugInfo);
    } catch (error) {
      console.error("Auth debug error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during auth debug",
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  /**
   * Simple session check endpoint - returns basic authentication status
   * Lightweight endpoint for frontend auth state verification
   */
  router.get("/auth/session", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      // Initialize response
      const sessionInfo = {
        authenticated: false,
        user: null,
        timestamp: new Date().toISOString()
      };

      // Check if we have auth header
      if (!authHeader) {
        return res.json(sessionInfo);
      }

      // Extract token
      const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
      
      if (!token) {
        return res.json(sessionInfo);
      }

      // Check circuit breaker
      if (watchdog.isCircuitBreakerOpen()) {
        return res.status(503).json({
          ...sessionInfo,
          error: "Authentication service temporarily unavailable"
        });
      }

      // Verify token
      try {
        const result = await verifyToken(token);
        
        if (result.success) {
          sessionInfo.authenticated = true;
          sessionInfo.user = {
            id: result.user.id,
            email: result.user.email,
            name: result.user.user_metadata?.name || ""
          };
        }
      } catch (error) {
        console.warn("Session check error:", error.message);
        // Return unauthenticated state on any error
      }

      return res.json(sessionInfo);
    } catch (error) {
      console.error("Session endpoint error:", error);
      return res.status(500).json({
        authenticated: false,
        user: null,
        timestamp: new Date().toISOString(),
        error: "Internal server error"
      });
    }
  });

  /**
   * Chat endpoint for processing messages with DeepSeek API
   * Enhanced for Phase 4 with conversation history, retry logic, safety features, and streaming support
   */
  router.post("/chat", chatEndpointRateLimit, async (req, res) => {
    try {
      // Start timing the request for analytics
      const startTime = Date.now();
      
      // Generate a unique session ID if not provided
      const sessionId = req.headers['x-session-id'] || `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Validate request
      const validation = chatRequestSchema.safeParse(req.body);
      if (!validation.success) {
        console.warn("Invalid chat request:", validation.error.errors);
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: validation.error.errors,
        });
      }

      const { message, conversationHistory, isHighRisk } = validation.data;
      const config = getDeepSeekConfig();

      if (!config.apiKey) {
        console.error("Missing DeepSeek API key");
        return res.status(500).json({
          success: false,
          message: "DeepSeek API key is missing. Please set the DEEPSEEK_API_KEY environment variable.",
        });
      }
      
      // Log the incoming request for analytics
      // Detect user role for appropriate response level
      const { detectUserRole, getResponseInstructions } = await import('../client/src/lib/user-role-detector.js');
      const roleAnalysis = detectUserRole(message);
      const responseInstructions = getResponseInstructions(roleAnalysis.role);
      
      console.info(`[${sessionId}] Processing chat request${isHighRisk ? ' (HIGH RISK)' : ''} [${roleAnalysis.role.toUpperCase()}]: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
      
      // Start session tracking for admin monitoring
      sessionTracker.startSession(sessionId, roleAnalysis.role);
      
      // Flag high-risk sessions immediately
      if (isHighRisk) {
        sessionTracker.flagSession(sessionId, 'high_risk_query', 'high');
      }
      
      // Prepare messages array with enhanced system context and conversation history
      const medicalContext = `You are MAIA, a medical AI assistant. Provide complete, concise medical information in plain text format.
        ${isHighRisk ? 'IMPORTANT: The user may describe an urgent medical situation. Emphasize the importance of seeking immediate professional medical attention for emergencies.' : ''}

        USER TYPE: ${roleAnalysis.role} (confidence: ${roleAnalysis.confidence}%)
        ${responseInstructions}

        CRITICAL RULES:
        1. NO # symbols or markdown
        2. Complete ALL responses 
        3. Use simple headers with colons
        4. Educational information only
        
        Format: Brief answer, key points, recommendations.`;
      
      const messages = [
        { role: "system", content: medicalContext }
      ];
      
      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        // Add only the last 10 messages to avoid token limits
        messages.push(...conversationHistory.slice(-10));
      }
      
      // Add the current message
      messages.push({ role: "user", content: message });
      
      // Make API request with timeout and retry logic - optimized for comprehensive responses
      const maxRetries = 1; // Single retry for faster failure handling
      const timeoutMs = 90000; // 90 seconds timeout for comprehensive medical responses
      
      let lastError = null;
      let attemptsMade = 0;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        attemptsMade++;
        
        try {
          // Create timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
          });
          
          // Create fetch promise with all messages
          const fetchPromise = fetch(config.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.model,
              messages: messages,
              temperature: 0.3, // Lower temperature for more consistent, complete responses
              max_tokens: 4096, // Maximum tokens for complete medical explanations
            }),
          });
          
          // Race the promises
          const deepSeekResponse = await Promise.race([fetchPromise, timeoutPromise]);
          
          if (!deepSeekResponse.ok) {
            const errorData = await deepSeekResponse.text();
            console.error(`[${sessionId}] DeepSeek API error (attempt ${attempt + 1}/${maxRetries + 1}):`, errorData);
            
            // For certain status codes, we don't retry
            if (deepSeekResponse.status === 401 || deepSeekResponse.status === 403) {
              return res.status(deepSeekResponse.status).json({
                success: false,
                message: `Authentication error with DeepSeek API: ${deepSeekResponse.statusText}`,
                error_type: "authentication",
              });
            }
            
            lastError = new Error(`DeepSeek API error: ${deepSeekResponse.statusText}`);
            // Continue to retry for other error types
          } else {
            // Success - process the response
            const data = await deepSeekResponse.json();
            let aiResponse = data.choices[0]?.message?.content;
            
            if (!aiResponse) {
              console.error(`[${sessionId}] Empty response from DeepSeek API`);
              return res.status(500).json({
                success: false,
                message: "No response generated from DeepSeek API",
                error_type: "empty_response",
              });
            }

            // Clean and ensure complete response
            aiResponse = await processAIResponse(aiResponse, sessionId);
            
            // Log the response time
            const requestDuration = Date.now() - startTime;
            console.info(`[${sessionId}] DeepSeek API request completed in ${requestDuration}ms (attempt ${attempt + 1})`);
            
            // Update session with completion metrics
            sessionTracker.updateSession(sessionId, requestDuration, false);
            sessionTracker.endSession(sessionId, 'completed');
            
            // Use authenticated user ID if available, otherwise default to anonymous
            const userId = req.user?.id || "anonymous";
            
            // Create metadata for messages
            const messageMetadata = { 
              timestamp: new Date(),
              sessionId,
              isHighRisk,
              requestTime: requestDuration,
            };
            
            // Save user message with metadata
            await storage.saveMessage(userId, message, true, {
              ...messageMetadata,
              type: 'user_message'
            });
            
            // Save AI response with metadata including tokens
            await storage.saveMessage(userId, aiResponse, false, {
              ...messageMetadata,
              type: 'ai_response',
              promptTokens: data.usage?.prompt_tokens,
              completionTokens: data.usage?.completion_tokens,
              totalTokens: data.usage?.total_tokens
            });
            
            // Return success response with full metadata
            return res.json({
              success: true,
              response: aiResponse,
              metadata: {
                sessionId,
                isHighRisk,
                requestTime: requestDuration,
                attemptsMade,
                modelName: data.model || config.model,
              },
              usage: {
                prompt_tokens: data.usage?.prompt_tokens,
                completion_tokens: data.usage?.completion_tokens,
                total_tokens: data.usage?.total_tokens
              }
            });
          }
        } catch (error) {
          console.error(`[${sessionId}] Error during attempt ${attempt + 1}/${maxRetries + 1}:`, error);
          lastError = error;
          
          // If this isn't the last attempt, wait before retrying
          if (attempt < maxRetries) {
            const retryDelay = 1000 * Math.pow(2, attempt); // Exponential backoff
            console.info(`[${sessionId}] Retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      // If we got here, all attempts failed
      console.error(`[${sessionId}] All ${maxRetries + 1} attempts failed.`);
      
      // Return a friendly error message
      return res.status(500).json({
        success: false,
        message: "We're having trouble connecting to our AI service. Please try again in a moment.",
        error_type: lastError?.name === 'AbortError' || lastError?.message?.includes('timed out') 
          ? "timeout" 
          : "service_unavailable",
        metadata: {
          sessionId,
          isHighRisk,
          attemptsMade,
          requestTime: Date.now() - startTime,
        }
      });
    } catch (error) {
      console.error("Chat API error:", error);
      return res.status(500).json({
        success: false,
        message: `We encountered an unexpected problem. Please try again.`,
        detail: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * Streaming chat endpoint for real-time message processing
   * Implements Server-Sent Events (SSE) for streaming responses
   */
  /**
   * GET /api/messages/:userId - Direct API endpoint to get messages for a user
   * Added directly in routes.js to ensure availability
   */
  router.get("/messages/:userId", circuitBreakerMiddleware, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'User ID is required' 
        });
      }
      
      console.log(`Direct route: Fetching messages for user ${userId} with limit ${limit}`);
      
      // Fetch messages from database
      const messages = await storage.getMessages(userId, limit);
      
      console.log(`Direct route: Retrieved ${messages.length} messages for user ${userId}`);
      
      return res.json({
        success: true,
        data: messages
      });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch messages' 
      });
    }
  });
  
  /**
   * Streaming chat endpoint for real-time message processing
   * Implements Server-Sent Events (SSE) for streaming responses
   */
  router.post("/chat/stream", chatEndpointRateLimit, async (req, res) => {
    try {
      // Start timing the request for analytics
      const startTime = Date.now();
      
      // Generate a unique session ID if not provided
      const sessionId = req.headers['x-session-id'] || `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Validate request body against schema
      const validation = chatRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        console.error(`[${sessionId}] Validation failed:`, validation.error);
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
          errors: validation.error.errors,
        });
      }
      
      const { message, conversationHistory, isHighRisk } = validation.data;
      const config = getDeepSeekConfig();
      
      if (!config.apiKey) {
        console.error("Missing DeepSeek API key");
        return res.status(500).json({
          success: false,
          message: "DeepSeek API key is missing. Please set the DEEPSEEK_API_KEY environment variable.",
        });
      }

      // Set up SSE headers with no-transform to prevent proxy buffering
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // Flush the headers to establish SSE connection
      
      // Set reasonable timeout for SSE connection (removed aggressive 1s timeout)
      res.setTimeout(120000); // 2 minutes for complete medical responses

      // Log the incoming streaming request for analytics
      // Detect user role for appropriate response level
  const { detectUserRole, getResponseInstructions } = await import('../client/src/lib/user-role-detector.js');
  const roleAnalysis = detectUserRole(message);
  const responseInstructions = getResponseInstructions(roleAnalysis.role);
  
  console.info(`[${sessionId}] Processing streaming chat request${isHighRisk ? ' (HIGH RISK)' : ''} [${roleAnalysis.role.toUpperCase()}]: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);

      // Start session tracking for admin monitoring
      sessionTracker.startSession(sessionId, roleAnalysis.role);
      
      // Flag high-risk sessions immediately
      if (isHighRisk) {
        sessionTracker.flagSession(sessionId, 'high_risk_query', 'high');
      }

      // Prepare messages for the LLM
      let promptMessages = [];
      
      // Add system message with safety instructions and role information
      promptMessages.push({
        role: "system",
        content: `You are MAIA (Medical AI Assistant) from Anamnesis. Provide complete medical information in plain text format.
        ${isHighRisk ? 'IMPORTANT: The user may describe an urgent medical situation. Emphasize the importance of seeking immediate professional medical attention for emergencies.' : ''}

        USER TYPE: ${roleAnalysis.role} (confidence: ${roleAnalysis.confidence}%)
        ${responseInstructions}

        CRITICAL RULES:
        1. NO # symbols or markdown
        2. Complete ALL responses - finish every thought and section
        3. Use simple headers with colons  
        4. Educational information only
        5. If response is getting long, prioritize the most important information first
        
        CRITICAL: Always complete your response fully. If you must be concise due to length, focus on the most essential medical information first.`
      });
      
      // Add conversation history for context
      if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        // Limit history to last 10 messages to avoid token limits
        const recentHistory = conversationHistory.slice(-10);
        promptMessages = [...promptMessages, ...recentHistory];
      }
      
      // Add the current user message
      promptMessages.push({
        role: "user",
        content: message
      });
      
      // Send the request to DeepSeek API with streaming enabled
      const deepSeekUrl = "https://api.deepseek.com/v1/chat/completions";
      
      // Create AbortController for immediate cancellation
      const ac = new AbortController();
      let closed = false;
      
      // Unified abort handler - triggers on user Stop AI or connection close
      const handleAbort = (reason) => {
        if (closed) return; // Guard against multiple calls
        closed = true;
        
        console.log(`[${sessionId}] [SSE] STOPPED_BY_USER flushed + closed immediately - ${new Date().toISOString()}`);
        
        // Update session tracking for stopped session
        sessionTracker.updateSession(sessionId, Date.now() - startTime, false);
        sessionTracker.endSession(sessionId, 'stopped');
        
        // Immediate client flush BEFORE upstream cleanup
        try {
          if (!res.destroyed && !res.closed) {
            res.write(`event: STOPPED_BY_USER\ndata: ${JSON.stringify({
              stopped: true,
              reason: reason,
              timestamp: Date.now()
            })}\n\n`);
            
            // Immediate flush to push response to client
            res.flushHeaders();
            if (res.flush) res.flush();
            
            // End response immediately
            res.end();
          }
        } catch (writeError) {
          console.debug(`[${sessionId}] Could not send STOPPED_BY_USER event:`, writeError.message);
        }
        
        // Immediate socket destruction for instant Network tab cancellation
        if (res.socket && !res.socket.destroyed) {
          res.socket.destroy();
        }
        
        // Abort upstream fetch (fire-and-forget)
        ac.abort();
        
        // Background cleanup - silently detached (no logging to avoid delays)
        process.nextTick(() => {
          // Fire-and-forget upstream cleanup happens here
        });
      };
      
      // IMMEDIATE client abort handlers - triggers on user Stop AI
      req.on("close", () => {
        console.log("[SSE] Client closed – aborting upstream fetch");
        ac.abort();       // abort DeepSeek fetch
        try { 
          if (!res.writableEnded) {
            res.end(); 
          }
          if (res.socket && !res.socket.destroyed) {
            res.socket.destroy(); 
          }
        } catch {}
        handleAbort('connection_close');
      });
      
      req.on("aborted", () => {
        console.log("[SSE] Request aborted – forcing termination");
        ac.abort();
        try { 
          if (!res.writableEnded) {
            res.end(); 
          }
          if (res.socket && !res.socket.destroyed) {
            res.socket.destroy(); 
          }
        } catch {}
        handleAbort('connection_aborted');
      });
      
      // Create fire-and-forget upstream fetch (detached from SSE lifecycle)
      const upstreamFetch = () => fetch(deepSeekUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || "deepseek-chat",
          messages: promptMessages,
          temperature: 0.2, // Lower temperature for more consistent, complete responses
          max_tokens: 4096, // Maximum tokens for complete medical explanations
          top_p: 0.95, // High top_p for comprehensive coverage
          frequency_penalty: 0.1, // Slight penalty to encourage varied language
          presence_penalty: 0.1, // Slight penalty to encourage topic completion
          stream: true
        }),
        signal: ac.signal // MUST pass the AbortSignal
      });
      
      // Normal upstream fetch without artificial timeouts
      
      // Execute upstream fetch with normal streaming
      (async () => {
        try {
          console.log(`[${sessionId}] [SSE] STREAM_STARTED - ${new Date().toISOString()}`);
          const deepSeekResponse = await upstreamFetch();
          if (closed || !deepSeekResponse) return; // Don't process if already closed
          
          try {
        
        if (!deepSeekResponse.ok) {
          throw new Error(`API error: ${deepSeekResponse.status} ${deepSeekResponse.statusText}`);
        }
        
        const reader = deepSeekResponse.body.getReader();
        const decoder = new TextDecoder("utf-8");
        
        let buffer = '';
        let responseText = '';
        
        // Save user and AI message to database
        const userId = req.user?.id || "anonymous";
        
        // Read the stream chunk by chunk with abort signal checking
        try {
          while (true) {
            if (ac.signal.aborted) throw new Error('aborted');
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            // Decode the chunk
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines in the buffer
            let lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last partial line in the buffer
            
            for (const line of lines) {
              // Skip empty lines and :keep-alive comments
              if (!line || line.trim() === '' || line.startsWith(':')) {
                continue;
              }
              
              // Lines starting with "data:" contain the streamed content
              if (line.startsWith('data:')) {
                const jsonPart = line.slice(5).trim();
                
                // Check for the "[DONE]" marker
                if (jsonPart === '[DONE]') {
                  continue;
                }
                
                try {
                  const data = JSON.parse(jsonPart);
                  const content = data.choices?.[0]?.delta?.content || '';
                  
                  if (content) {
                    // Clean content before sending and accumulating
                    const cleanedContent = content.replace(/#/g, '');
                    
                    // Accumulate response text
                    responseText += cleanedContent;
                    
                    // Send the cleaned chunk to the client using event-based format for SSE
                    if (!closed && !res.writableEnded) {
                      res.write(`event: chunk\ndata: ${JSON.stringify({ text: cleanedContent })}\n\n`);
                      // Flush to ensure immediate delivery
                      if (res.flush) res.flush();
                    }
                  }
                } catch (error) {
                  console.error(`[${sessionId}] Error parsing chunk:`, error, jsonPart);
                }
              }
            }
          }
        } finally {
          // Fire-and-forget upstream cleanup - do NOT await
          try { reader.cancel(); } catch {}
          try { response.body?.cancel(); } catch {}
        }
        
        if (!closed) {
          // Finalize the streaming response and apply final processing
          responseText = await processAIResponse(responseText, sessionId);
          const requestDuration = Date.now() - startTime;
          // Only log completion if client is still connected
          if (!closed) {
            console.log(`[${sessionId}] [SSE] STREAM_ENDED - completed in ${requestDuration}ms - ${new Date().toISOString()}`);
          }
          
          // Save the messages to the database
          try {
            if (userId !== "anonymous" && responseText) {
              await storage.saveMessage(userId, message, responseText);
            }
          } catch (dbError) {
            console.error(`[${sessionId}] Error saving messages:`, dbError);
          }
          
          // Send configuration data for the client
          if (!closed && !res.writableEnded) {
            res.write(`event: config\ndata: ${JSON.stringify({
              model: config.model || "deepseek-chat",
              sessionId: sessionId,
              requestTime: requestDuration,
              tokensEstimate: Math.round(responseText.split(' ').length * 1.3)
            })}\n\n`);
          }
          
          // Send completion event
          if (!closed && !res.writableEnded) {
            res.write(`event: done\ndata: ${JSON.stringify({
              completed: true,
              requestTime: requestDuration
            })}\n\n`);
          }
          
          // Update session with completion metrics
          sessionTracker.updateSession(sessionId, requestDuration, false);
          sessionTracker.endSession(sessionId, 'completed');
          
          // End the response safely
          if (!res.writableEnded) {
            res.end();
          }
        }
        } catch (apiError) {
          if (!closed) {
            console.error(`[${sessionId}] Streaming error:`, apiError);
            // Send error event with proper SSE formatting
            try {
              res.write(`event: error\ndata: ${JSON.stringify({ 
                error: apiError.message,
                code: 'streaming_error' 
              })}\n\n`);
              
              // Send done event to complete the stream
              res.write(`event: done\ndata: ${JSON.stringify({
                completed: false,
                error: true,
                requestTime: Date.now() - startTime
              })}\n\n`);
              
              // Update session with error metrics
              sessionTracker.updateSession(sessionId, Date.now() - startTime, true);
              sessionTracker.endSession(sessionId, 'error');
              
              res.end();
            } catch (writeError) {
              console.debug(`[${sessionId}] Could not send error event:`, writeError.message);
            }
          }
        }
      } catch (fetchError) {
        // Handle fetch/connection errors
        if (fetchError.name === 'AbortError' || fetchError.message === 'aborted') {
          console.debug(`[${sessionId}] Upstream fetch aborted (expected)`);
        } else {
          console.error(`[${sessionId}] Fetch error:`, fetchError.message);
        }
      }
    })().catch((error) => {
          // Fire-and-forget error handling - upstream fetch cleanup runs silently
          if (error.name === 'AbortError') {
            console.log(`[${sessionId}] [SSE] Upstream fetch aborted (expected)`);
          } else {
            console.log(`[${sessionId}] [SSE] Upstream fetch error (silently handled):`, error.message);
          }
        });
    } catch (error) {
      console.error("Streaming endpoint error:", error);
      
      // Check if headers have already been sent (we might have started streaming)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "An error occurred while processing your request",
          error: error.message
        });
      } else {
        // If headers were already sent, we need to use SSE format
        try {
          if (!res.destroyed && !res.closed) {
            res.write(`event: error\ndata: ${JSON.stringify({ 
              error: error.message,
              code: 'request_error' 
            })}\n\n`);
          }
          
          // Handle error completion event - Create timestamp directly since we may not have access
          // to the original startTime variable in this context
          if (!res.destroyed && !res.closed) {
            res.write(`event: done\ndata: ${JSON.stringify({
              completed: false,
              error: true,
              requestTime: 0 // Unable to calculate accurate request time in error state
            })}\n\n`);
          }
        } catch (writeError) {
          console.error("Error sending error message via SSE:", writeError);
        }
        
        res.end();
      }
    }
  });

  // Register message API routes with circuit breaker protection
  router.use("/messages", circuitBreakerMiddleware, messageApiRouter);
  
  // Register direct endpoints with circuit breaker protection for Supabase-dependent routes
  router.use("/direct/messages", circuitBreakerMiddleware);
  router.use("/direct", directEndpoints);

  // Register API routes under /api prefix
  // Router is exported, no need to mount here

  // Phase 7: Visual Trace Debugging System
  const debugRouter = express.Router();
  
  debugRouter.get('/debug/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    
    try {
      // Create demo debug data for visualization
      const debugData = {
        sessionId: sessionId,
        userInput: "I've been having chest pain for 2 days",
        timestamp: new Date().toISOString(),
        processingStages: {
          parseIntent: {
            duration: 12,
            result: {
              symptoms: ['chest pain'],
              bodyLocation: 'chest',
              duration: '2 days',
              intentConfidence: 0.85
            }
          },
          triage: {
            duration: 8,
            result: {
              triageLevel: 'urgent',
              isHighRisk: true,
              redFlags: ['chest pain']
            }
          },
          enhancePrompt: {
            duration: 15,
            result: {
              enhancedPrompt: "User reporting chest pain for 2 days...",
              disclaimers: ["Chest pain may indicate serious cardiac conditions"],
              atd: {
                atdReason: "Chest pain requires immediate medical evaluation"
              }
            }
          }
        },
        llmResponse: {
          duration: 2340,
          content: "Chest pain lasting 2 days requires prompt medical attention. This could be related to cardiac, pulmonary, or musculoskeletal causes and should be evaluated by a healthcare professional immediately to rule out serious conditions such as heart attack, pulmonary embolism, or other life-threatening issues.",
          modelUsed: "deepseek-chat",
          tokensUsed: 450
        },
        totalProcessingTime: 2375
      };

      // Generate HTML visualization
      const stageColors = {
        parseIntent: '#06b6d4',
        triage: '#f97316',
        enhancePrompt: '#8b5cf6',
        llmResponse: '#10b981'
      };
      
      const htmlResponse = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧠 Medical AI Debug Trace</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 30px; }
        .stage { margin: 25px 0; border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden; transition: all 0.2s ease; }
        .stage:hover { border-color: #06b6d4; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(6, 182, 212, 0.1); }
        .stage-header { padding: 15px 20px; font-weight: 600; color: white; display: flex; justify-content: space-between; align-items: center; }
        .stage-content { padding: 20px; background: #f9fafb; }
        .json-display { background: #1f2937; color: #10b981; padding: 15px; border-radius: 6px; font-family: Monaco, Menlo, monospace; font-size: 13px; overflow-x: auto; white-space: pre-wrap; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px; border-left: 4px solid #06b6d4; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
        .input-display { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .input-display h3 { margin: 0 0 10px 0; color: #1e40af; }
        .timeline { display: flex; align-items: center; margin: 30px 0; }
        .timeline-item { flex: 1; text-align: center; position: relative; }
        .timeline-item:not(:last-child):after { content: '→'; position: absolute; right: -10px; font-size: 20px; color: #9ca3af; }
        .timeline-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 Medical Query Debug Trace</h1>
            <p>Session: ${debugData.sessionId} | ${new Date(debugData.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="content">
            <div class="input-display">
                <h3>User Input</h3>
                <p><strong>"${debugData.userInput}"</strong></p>
            </div>
            
            <div class="timeline">
                ${Object.keys(debugData.processingStages).map(stage => 
                  `<div class="timeline-item">
                    <div style="background-color: ${stageColors[stage]}; color: white; padding: 8px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                      ${stage.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </div>
                    <div class="timeline-label">${debugData.processingStages[stage].duration}ms</div>
                  </div>`
                ).join('')}
            </div>
            
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">${debugData.totalProcessingTime}ms</div>
                    <div class="metric-label">Total Time</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Object.keys(debugData.processingStages).length}</div>
                    <div class="metric-label">Processing Stages</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${debugData.llmResponse.tokensUsed}</div>
                    <div class="metric-label">Tokens Used</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${debugData.processingStages.triage.result.triageLevel.toUpperCase()}</div>
                    <div class="metric-label">Triage Level</div>
                </div>
            </div>
            
            ${Object.entries(debugData.processingStages).map(([stageName, stageData]) => 
              `<div class="stage">
                <div class="stage-header" style="background-color: ${stageColors[stageName]};">
                  <span>${stageName.replace(/([A-Z])/g, ' $1')} Stage</span>
                  <span>${stageData.duration}ms</span>
                </div>
                <div class="stage-content">
                  <div class="json-display">${JSON.stringify(stageData.result, null, 2)}</div>
                </div>
              </div>`
            ).join('')}
            
            <div class="stage">
                <div class="stage-header" style="background-color: ${stageColors.llmResponse};">
                    <span>LLM Response</span>
                    <span>${debugData.llmResponse.duration}ms</span>
                </div>
                <div class="stage-content">
                    <p><strong>Model:</strong> ${debugData.llmResponse.modelUsed}</p>
                    <p><strong>Tokens Used:</strong> ${debugData.llmResponse.tokensUsed}</p>
                    <p><strong>Response Content:</strong></p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb;">
                        ${debugData.llmResponse.content}
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlResponse);
      
    } catch (error) {
      console.error('Debug endpoint error:', error);
      res.status(500).json({ 
        error: 'Failed to load debug data',
        sessionId: sessionId,
        message: error.message 
      });
    }
  });
  
// Debug and feedback routes are mounted in server/index.js
console.log("✅ Chat routes prepared for mounting");

// Export the router for mounting in server/index.js
// Legal document routes
router.get('/api/legal/terms', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const termsPath = path.join(process.cwd(), 'public', 'TERMS.md');
    
    if (fs.existsSync(termsPath)) {
      const content = fs.readFileSync(termsPath, 'utf8');
      res.set('Content-Type', 'text/plain');
      res.send(content);
    } else {
      res.status(404).json({ error: 'Terms document not found' });
    }
  } catch (error) {
    console.error('Error serving terms:', error);
    res.status(500).json({ error: 'Failed to load terms document' });
  }
});

router.get('/api/legal/license', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const licensePath = path.join(process.cwd(), 'public', 'LICENSE.txt');
    
    if (fs.existsSync(licensePath)) {
      const content = fs.readFileSync(licensePath, 'utf8');
      res.set('Content-Type', 'text/plain');
      res.send(content);
    } else {
      res.status(404).json({ error: 'License document not found' });
    }
  } catch (error) {
    console.error('Error serving license:', error);
    res.status(500).json({ error: 'Failed to load license document' });
  }
});

export default router;