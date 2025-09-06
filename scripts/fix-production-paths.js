#!/usr/bin/env node
/**
 * Post-build script to fix relative paths in production index.html
 * Converts ./assets/ to /assets/ for proper serving
 */

import fs from 'fs';
import path from 'path';

const indexPath = path.resolve(process.cwd(), 'dist/public/index.html');

try {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Fix asset paths
  content = content.replace(/src="\.\/assets\//g, 'src="/assets/');
  content = content.replace(/href="\.\/assets\//g, 'href="/assets/');
  
  // Fix other common relative paths
  content = content.replace(/href="\.\/manifest\.json/g, 'href="/manifest.json');
  content = content.replace(/href="\.\/favicon/g, 'href="/favicon');
  content = content.replace(/href="\.\/apple-touch-icon/g, 'href="/apple-touch-icon');
  content = content.replace(/href="\.\/icons\//g, 'href="/icons/');
  
  fs.writeFileSync(indexPath, content);
  console.log('✅ Fixed production paths in index.html');
} catch (error) {
  console.error('❌ Error fixing production paths:', error.message);
  process.exit(1);
}