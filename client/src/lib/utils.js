import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines Tailwind CSS classes with clsx and twMerge
 * @param {...import('clsx').ClassValue} inputs - Class values to merge
 * @returns {string} Merged and optimized class string
 */
export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}