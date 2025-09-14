#!/usr/bin/env node

/**
 * @file Service Worker Version Updater
 * @description Automatically updates Service Worker cache versions with build timestamp and hash.
 * This ensures PWA users get fresh updates without manual version bumping.
 * 
 * Usage: node scripts/update-sw-version.js
 * Called automatically by build process in package.json
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const SW_PATH = path.join(__dirname, '../client/public/sw.js');
const PACKAGE_PATH = path.join(__dirname, '../package.json');

/**
 * Generate a short hash from current timestamp and package version
 * @returns {string} 8-character hash
 */
function generateBuildHash() {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
  const timestamp = Date.now().toString();
  const version = packageJson.version || '1.0.0';
  
  return crypto
    .createHash('sha256')
    .update(`${version}-${timestamp}`)
    .digest('hex')
    .substring(0, 8);
}

/**
 * Update Service Worker with current build information
 */
function updateServiceWorker() {
  try {
    // Generate build info
    const buildTimestamp = new Date().toISOString();
    const buildHash = generateBuildHash();
    
    console.log(`📱 Updating PWA Service Worker:`);
    console.log(`   Build Time: ${buildTimestamp}`);
    console.log(`   Build Hash: ${buildHash}`);
    
    // Read current service worker
    let swContent = fs.readFileSync(SW_PATH, 'utf8');
    
    // Replace placeholders with actual values
    swContent = swContent
      .replace('{{BUILD_TIMESTAMP}}', buildTimestamp)
      .replace('{{BUILD_HASH}}', buildHash);
    
    // Write updated service worker
    fs.writeFileSync(SW_PATH, swContent);
    
    console.log(`✅ Service Worker updated: ${SW_PATH}`);
    console.log(`🎯 PWA will auto-update with build hash: ${buildHash}`);
    
  } catch (error) {
    console.error('❌ Failed to update Service Worker:', error.message);
    process.exit(1);
  }
}

// Run the update
updateServiceWorker();