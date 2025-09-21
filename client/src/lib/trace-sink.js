// client/src/lib/trace-sink.js
// Debug Trace Sink: Redirects debug traces to the server

/**
 *
 * @param label
 * @param data
 */
export function trace(label, data) {
  try {
    fetch('/debug-trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label,
        data,
        ts: Date.now(),
        source: 'client',
      }),
    });
  } catch {
    // Fail silently — never break runtime if logging fails
  }
}