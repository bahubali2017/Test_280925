#!/usr/bin/env node
/**
 * @file Direct server entry point for cloud deployment
 * Simplified wrapper that directly imports the TypeScript server
 */

// Import and run the TypeScript server directly
import('./index.ts').catch(console.error);