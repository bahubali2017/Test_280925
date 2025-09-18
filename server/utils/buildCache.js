
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_FILE = path.join(__dirname, '../../.build-cache.json');

class BuildCache {
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

  static shouldRebuild(currentHash) {
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

  static generateBuildId() {
    return crypto.randomBytes(8).toString('hex');
  }

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

  static checkBuildNecessity() {
    const importantFiles = [
      path.join(__dirname, '../../package.json'),
      path.join(__dirname, '../../vite.config.ts'),
      path.join(__dirname, '../../client/src/main.jsx'),
      path.join(__dirname, '../index.ts')
    ];
    
    const currentHash = this.generateFileHash(importantFiles);
    return this.shouldRebuild(currentHash);
  }

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
        path.join(__dirname, '../index.ts')
      ];
      info.hash = this.generateFileHash(importantFiles);
    }
    
    this.setBuildInfo(info);
  }

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

module.exports = { BuildCache };
