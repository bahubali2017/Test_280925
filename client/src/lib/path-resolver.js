/**
 * @file Path resolver utility
 * This file provides a workaround for import path issues
 * by re-exporting modules from their actual locations
 */

// Re-export utils to fix @/lib/utils imports
/**
 *
 */
export { cn } from './utils.js';

// Other common re-exports can be added here as needed