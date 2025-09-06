#!/usr/bin/env node
/**
 * @file Compatibility wrapper for server/index.ts
 * This file exists only for workflow compatibility and should not be edited directly.
 * All changes should be made to server/index.ts
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Starting TypeScript server via tsx...');

const tsFile = join(__dirname, 'index.ts');
const child = spawn('npx', ['tsx', tsFile], {
  stdio: 'inherit',
  env: process.env
});

child.on('error', (err) => {
  console.error('Failed to start TypeScript server:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});

// Handle signals
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});