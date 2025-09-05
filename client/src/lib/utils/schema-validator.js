/**
 * Lightweight schema validator for progressive checks.
 */

/**
 *
 */
export class ValidationError extends Error {
  /**
   * @param {string} message
   * @param {{path?: string, code?: string}} [meta]
   */
  constructor(message, meta = {}) {
    super(message);
    this.name = "ValidationError";
    this.path = meta.path || "";
    this.code = meta.code || "VALIDATION_ERROR";
  }
}

/**
 * @param {unknown} v
 * @returns {v is string}
 */
export function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * @param {unknown} v
 * @returns {v is number}
 */
export function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * @template T
 * @param {unknown} v
 * @param {(x:any)=>x is T} predicate
 * @returns {v is T[]}
 */
export function isArrayOf(v, predicate) {
  return Array.isArray(v) && v.every(predicate);
}

/**
 * Progressive validator.
 * @param {any} ctx
 * @param {{strict?: boolean}} [opts]
 * @returns {{ok: boolean, errors: ValidationError[]}}
 */
export function validateLayerSchema(ctx, opts = {}) {
  const strict = !!opts.strict;
  /** @type {ValidationError[]} */
  const errors = [];

  if (typeof ctx?.userInput !== 'string') {
    errors.push(new ValidationError("userInput must be a string", { path: "userInput" }));
  }

  if (strict) {
    if (!ctx?.intent || !isNonEmptyString(ctx.intent.type)) {
      errors.push(new ValidationError("intent.type must be a non-empty string", { path: "intent.type" }));
    }
    if (!Array.isArray(ctx?.symptoms)) {
      errors.push(new ValidationError("symptoms must be an array", { path: "symptoms" }));
    }
    if (!ctx?.triage || !isNonEmptyString(ctx.triage.level)) {
      errors.push(new ValidationError("triage.level must be a non-empty string", { path: "triage.level" }));
    }
  }

  return { ok: errors.length === 0, errors };
}