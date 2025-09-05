/**
 * Monotonic clock usable in browser/Node.
 * @returns {number} milliseconds
 */
export function now() {
  const p = typeof globalThis !== "undefined" ? globalThis.performance : undefined;
  return p && typeof p.now === "function" ? p.now() : Date.now();
}

/**
 * Simple stage timer.
 */
export class StageTimer {
  /**
   * Create a new stage timer
   */
  constructor() { this._marks = Object.create(null); }
  /**
   * Start timing for a stage
   * @param {string} key - The stage name to start timing
   * @returns {void}
   */
  start(key) { this._marks[key] = { t0: now(), dt: undefined }; }
  /**
   * Stop timing for a stage and return the elapsed time
   * @param {string} key - The stage name to stop timing
   * @returns {number|undefined} The elapsed time in milliseconds, or undefined if stage not found
   */
  stop(key) {
    const m = this._marks[key];
    if (!m || m.dt != null) return m?.dt;
    m.dt = Math.max(0, Math.round(now() - m.t0));
    return m.dt;
  }
  /** @returns {Record<string, number>} */
  toJSON() {
    /** @type {Record<string, number>} */
    const out = {};
    for (const [k, v] of Object.entries(this._marks)) {
      if (typeof v.dt === "number") out[k] = v.dt;
    }
    return out;
  }
}