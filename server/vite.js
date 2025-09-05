/**
 * @file Vite configuration and setup for the Anamnesis Medical AI Assistant
 */

import { createServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import express from "express";

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Logger function for server events
 * @param {string} message - The message to log
 * @param {string} [source="express"] - The source of the log message
 */
export function log(message, source = "express") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}

/**
 * Sets up Vite development server
 * @param {import('express').Express} app - The Express application 
 * @returns {Promise<import('http').Server>} The HTTP server
 */
export async function setupVite(app) {
  const root = path.resolve(__dirname, "../client");
  
  if (!fs.existsSync(root)) {
    throw new Error(`Vite root directory does not exist: ${root}`);
  }
  
  // Create Vite server
  const vite = await createServer({
    root,
    server: {
      middlewareMode: true,
      hmr: {
        server: app
      },
      // Using true for allowedHosts to accept all hosts
      allowedHosts: true
    },
    appType: "spa"
  });
  
  // Use Vite middleware
  app.use(vite.middlewares);
  
  return app;
}

/**
 * Serves static files in production
 * @param {import('express').Express} app - The Express application
 */
export function serveStatic(app) {
  const clientDist = path.resolve(__dirname, "../client/dist");
  
  // Serve static files from the client/dist directory
  app.use(express.static(clientDist));
  
  // Serve index.html for all routes (SPA support)
  app.get("*", (req, res) => {
    // Skip API routes
    if (req.path.startsWith("/api")) return;
    
    // Serve index.html for all other routes
    res.sendFile(path.join(clientDist, "index.html"));
  });
}