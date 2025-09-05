/**
 * Environment-aware logger with scoped categories.
 * Never log PHI or raw user text at info/warn/error levels.
 */

/**
 * @typedef {"debug"|"info"|"warn"|"error"} LogLevel
 */

/**
 * Create a scoped logger.
 * @param {string} [scope="layer"]
 * @returns {{debug:(...a:any[])=>void, info:(...a:any[])=>void, warn:(...a:any[])=>void, error:(...a:any[])=>void, child:(childScope:string)=>ReturnType<typeof createLogger>}}
 */
export function createLogger(scope = "layer") {
  // Browser-safe environment variable access
  const level = (typeof process !== 'undefined' && process.env?.LOG_LEVEL || "info").toLowerCase();

  /**
   * @param {LogLevel} lvl @param {...any} args
   * @param {...any} args
   */
  function log(lvl, ...args) {
    const order = ["debug", "info", "warn", "error"];
    if (order.indexOf(lvl) < order.indexOf(level)) return;
    const ts = new Date().toISOString();
     
    console[lvl === "debug" ? "log" : lvl](`[${ts}] [${scope}] [${lvl}]`, ...args);
  }

  return {
    debug: (...a) => log("debug", ...a),
    info:  (...a) => log("info", ...a),
    warn:  (...a) => log("warn", ...a),
    error: (...a) => log("error", ...a),
    child(childScope) { return createLogger(`${scope}:${childScope}`); },
  };
}

/**
 *
 */
export const adminAccessLogger = createLogger("admin-remote-access");