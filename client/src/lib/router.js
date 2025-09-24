import { createLogger } from "./utils/logger.js";
import { createLayerContext, updateLayerContext, validateLayerContext } from "./layer-context.js";
import { parseIntent } from "./intent-parser.js";
import { performTriage } from "./triage-checker.js";
import { enhancePrompt } from "./prompt-enhancer.js";
import { StageTimer, now } from "./utils/perf.js";
import { normalizeRouterResult } from "./output-spec.js";

const log = createLogger("layer:router");

/**
 * Orchestrate the Interpretation Layer for a single user query.
 * Always returns standardized output; on error, falls back safely.
 *
 * @param {string} userInput
 * @returns {Promise<import("./output-spec.js").LayeredResponse>}
 */
export async function routeMedicalQuery(userInput) {
  const t0 = now();
  const t = new StageTimer();
  const ctx = createLayerContext(userInput);

  try {
    const v0 = validateLayerContext(ctx, { strict: false });
    if (!v0.ok) {
      log.warn("validation:phase0_failed", { errors: v0.errors.map(e => ({ path: e.path, code: e.code })) });
      throw new Error("Invalid input");
    }

    t.start("parseIntent");
    const { intent, symptoms } = parseIntent(ctx.userInput);
    t.stop("parseIntent");
    updateLayerContext(ctx, { intent, symptoms });

    t.start("triage");
    const triage = performTriage(ctx);
    t.stop("triage");
    updateLayerContext(ctx, { triage });

    t.start("enhancePrompt");
    const { systemPrompt, enhancedPrompt, atdNotices, disclaimers } = enhancePrompt(ctx);
    t.stop("enhancePrompt");
    updateLayerContext(ctx, { prompt: { systemPrompt, enhancedPrompt } });

    const processingTime = Math.max(0, Math.round(now() - t0));
    const normalized = normalizeRouterResult({
      userInput: ctx.userInput,
      enhancedPrompt,
      isHighRisk: !!ctx.triage?.isHighRisk,
      disclaimers,
      atd: atdNotices && atdNotices.length ? atdNotices : null,
      suggestions: ctx.triage?.isHighRisk
        ? ["If symptoms worsen, seek urgent care.", "Consider calling emergency services if severe."]
        : ["Can you share duration, severity, and associated symptoms?", "Any triggers or relieving factors?"],
      metadata: {
        processingTime,
        intentConfidence: intent?.confidence,
        triageLevel: ctx.triage?.level ? /** @type {"emergency"|"urgent"|"non_urgent"} */(ctx.triage.level.toLowerCase()) : undefined,
        symptoms: ctx.triage?.symptomNames || [],
        stageTimings: t.toJSON()
      }
    });

    if (!normalized.ok) {
      log.warn("router:normalize_warn", { errors: normalized.errors, safe: true });
    }
    return normalized.result;
  } catch (err) {
    const processingTime = Math.max(0, Math.round(now() - t0));
    log.error("router_failed", { message: String(err?.message || err), safe: true });

    const fallback = normalizeRouterResult({
      userInput: String(userInput || ""),
      enhancedPrompt: "System fallback: Provide general, low‑risk educational guidance and suggest appropriate next steps. Include red‑flag checklist and advise contacting a clinician if concerned.",
      isHighRisk: false,
      disclaimers: [], // Let fallback-engine handle disclaimers via selectDisclaimers()
      suggestions: ["Describe symptoms, duration, severity, and any red flags (e.g., chest pain, shortness of breath)."],
      metadata: { processingTime, stageTimings: t.toJSON() }
    });

    if (!fallback.ok) {
      log.warn("router:fallback_normalize_warn", { errors: fallback.errors, safe: true });
    }
    return fallback.result;
  }
}

/* Optional Express route for quick manual testing:

import express from "express";
const app = express();
app.use(express.json());
app.get("/api/layer/preview", async (req, res) => {
  const input = String(req.query.input || "");
  const result = await routeMedicalQuery(input);
  res.json(result);
});
app.listen(5055, () => console.log("Layer preview on :5055"));
*/