/**
 * @file Utility functions for UI components
 * This file resolves path dependency issues by providing direct access to utility functions
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines Tailwind CSS classes with clsx and twMerge
 * @param {...import('clsx').ClassValue[]} inputs - Class values to merge
 * @returns {string} Merged and optimized class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}