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
  
  // Create Vite server with proper custom domain support
  const vite = await createServer({
    root,
    server: {
      middlewareMode: true,
      hmr: {
        server: app
      },
      // Allow all hosts for custom domains
      allowedHosts: true,
      host: '0.0.0.0',
      // Remove origin restriction to allow custom domains
      cors: {
        origin: true,
        credentials: true
      }
    },
    appType: "spa",
    // Ensure proper base path handling
    base: '/'
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
  // Use process.cwd() to ensure we're always relative to the project root
  const clientDist = path.resolve(process.cwd(), "dist/public");
  
  // Add error handling for missing files
  if (!fs.existsSync(clientDist)) {
    console.error(`[ERROR] Static files directory does not exist: ${clientDist}`);
    console.log(`[INFO] Current working directory: ${process.cwd()}`);
    console.log(`[INFO] __dirname: ${__dirname}`);
    console.log(`[INFO] Available directories:`);
    try {
      const dirs = fs.readdirSync(path.resolve(__dirname, "../"));
      dirs.forEach(dir => console.log(`  - ${dir}`));
    } catch (e) {
      console.error(`[ERROR] Failed to list directories: ${e.message}`);
    }
  }
  
  // Serve static files from the dist/public directory
  app.use(express.static(clientDist));
  
  // Serve index.html for all routes (SPA support)
  app.get("*", (req, res) => {
    // Skip API routes
    if (req.path.startsWith("/api")) return;
    
    const indexPath = path.join(clientDist, "index.html");
    
    // Check if index.html exists before serving
    if (!fs.existsSync(indexPath)) {
      console.error(`[ERROR] index.html not found at: ${indexPath}`);
      return res.status(404).send(`
        <h1>Application Not Found</h1>
        <p>The static files could not be located.</p>
        <p>Expected path: ${indexPath}</p>
      `);
    }
    
    // Serve index.html for all other routes
    res.sendFile(indexPath);
  });
}