/**
 * Debug flag helper for runtime tracing
 * Checks URL param ?debug=1 or localStorage.DEBUG_AI === "1"
 */
export function isDebug() {
  try {
    if (new URLSearchParams(window.location.search).get("debug") === "1") return true;
    return localStorage.getItem("DEBUG_AI") === "1";
  } catch { return false; }
}