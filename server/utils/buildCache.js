
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, '../../.build-cache.json');

/**
 *
 */
class BuildCache {
  /**
   * Retrieves cached build information from the build cache file.
   * @returns {object|null} The cached build info object or null if not found
   */
  static getBuildInfo() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      }
    } catch (error) {
      console.warn('[BUILD-CACHE] Failed to read cache:', error.message);
    }
    return null;
  }

  /**
   *
   * @param info
   */
  static setBuildInfo(info) {
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({
        ...info,
        timestamp: Date.now(),
        nodeEnv: process.env.NODE_ENV,
        buildId: this.generateBuildId()
      }, null, 2));
      console.log('[BUILD-CACHE] Cache updated successfully');
    } catch (error) {
      console.warn('[BUILD-CACHE] Failed to write cache:', error.message);
    }
  }

  /**
   * Determines if a rebuild is required based on cache age and hash comparison.
   * @param {string} currentHash - The current hash to compare against cached version
   * @returns {boolean} True if rebuild is required, false otherwise
   */
  static shouldRebuild(currentHash) {
    // Restore normal cache logic
    
    const cached = this.getBuildInfo();
    if (!cached) {
      console.log('[BUILD-CACHE] No cache found, rebuild required');
      return true;
    }
    
    const age = Date.now() - cached.timestamp;
    const isStale = age > 5 * 60 * 1000; // 5 minutes
    const hashChanged = cached.hash !== currentHash;
    
    if (isStale) {
      console.log('[BUILD-CACHE] Cache is stale, rebuild required');
      return true;
    }
    
    if (hashChanged) {
      console.log('[BUILD-CACHE] Hash changed, rebuild required');
      return true;
    }
    
    console.log('[BUILD-CACHE] Cache is valid, skipping rebuild');
    return false;
  }

  /**
   * Generates a unique build identifier.
   * @returns {string} A random hex string as build ID
   */
  static generateBuildId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Generates a hash based on the contents of specified files.
   * @param {string[]} filePaths - Array of file paths to hash
   * @returns {string} A shortened hash string of the file contents
   */
  static generateFileHash(filePaths) {
    const hash = crypto.createHash('sha256');
    
    filePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        hash.update(content);
      }
    });
    
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Checks if a build is necessary by comparing current file hashes.
   * @returns {boolean} True if build is necessary, false otherwise
   */
  static checkBuildNecessity() {
    const importantFiles = [
      path.join(__dirname, '../../package.json'),
      path.join(__dirname, '../../vite.config.ts'),
      path.join(__dirname, '../../client/src/main.jsx'),
      path.join(__dirname, '../index.ts'),
      // Include cleanup and formatting files that affect response processing
      path.join(__dirname, '../routes.js'),
      path.join(__dirname, '../../client/src/components/MessageBubble.jsx'),
      path.join(__dirname, '../../client/src/lib/medical-safety-processor.js')
    ];
    
    const currentHash = this.generateFileHash(importantFiles);
    return this.shouldRebuild(currentHash);
  }

  /**
   *
   * @param success
   */
  static markBuildComplete(success = true) {
    const info = {
      success,
      completed: Date.now(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    if (success) {
      // Generate hash of important files for future comparison
      const importantFiles = [
        path.join(__dirname, '../../package.json'),
        path.join(__dirname, '../../vite.config.ts'),
        path.join(__dirname, '../../client/src/main.jsx'),
        path.join(__dirname, '../index.ts'),
        // Include cleanup and formatting files that affect response processing
        path.join(__dirname, '../routes.js'),
        path.join(__dirname, '../../client/src/components/MessageBubble.jsx'),
        path.join(__dirname, '../../client/src/lib/medical-safety-processor.js')
      ];
      info.hash = this.generateFileHash(importantFiles);
    }
    
    this.setBuildInfo(info);
  }

  /**
   *
   */
  static clearCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
        console.log('[BUILD-CACHE] Cache cleared successfully');
      }
    } catch (error) {
      console.warn('[BUILD-CACHE] Failed to clear cache:', error.message);
    }
  }
}

/**
 *
 */
export { BuildCache };
