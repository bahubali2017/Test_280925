/**
 * Debug flag helper for runtime tracing
 * Force-enabled for Medical AI platform monitoring
 * @returns {boolean}
 */
export function isDebug() {
  return true; // Force debug always on for medical AI platform
}

import { trace as serverTrace } from './trace-sink.js';

export function trace(label, data) {
  if (isDebug()) {
    serverTrace(label, data);
  }
}