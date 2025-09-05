/**
 * Metrics Evaluator for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: All metrics evaluation preserves user privacy by working
 * with anonymized data only. Performance metrics focus on system accuracy
 * without exposing personal health information.
 * 
 * @file Evaluates triage accuracy, precision/recall, and disclaimer usage metrics
 */

import triageStandards from './benchmarks/triage-standards.json' with { type: 'json' };

/**
 * Evaluation metrics results structure
 * @typedef {{
 *   accuracy: number;
 *   precision: number;
 *   recall: number;
 *   falsePositives: number;
 *   falseNegatives: number;
 *   truePositives: number;
 *   trueNegatives: number;
 *   totalEvaluated: number;
 *   disclaimerRatio: number;
 *   confidenceScore: number;
 *   highRiskDetected: number;
 *   triageAccuracy: number;
 * }} EvaluationMetrics
 */

/**
 * Triage accuracy levels for severity mapping
 * @private
 */
const TRIAGE_SEVERITY = {
  'emergency': 3,
  'urgent': 2, 
  'non_urgent': 1
};

/**
 * Evaluates triage accuracy against benchmark standards
 * @param {string} condition - Medical condition or symptom description
 * @param {string} actualTriage - Actual triage level assigned by system
 * @returns {object} Evaluation result with accuracy details
 */
export function evaluateTriageAccuracy(condition, actualTriage) {
  // Normalize condition for lookup
  const normalizedCondition = condition.toLowerCase().trim();
  
  // Find expected triage from benchmarks
  const expectedTriage = triageStandards[normalizedCondition];
  
  if (!expectedTriage) {
    return {
      isAccurate: null,
      error: 'Condition not found in benchmarks',
      condition: normalizedCondition,
      actualTriage,
      expectedTriage: null
    };
  }
  
  const isAccurate = actualTriage === expectedTriage;
  const severityDiff = Math.abs(
    TRIAGE_SEVERITY[actualTriage] - TRIAGE_SEVERITY[expectedTriage]
  );
  
  return {
    isAccurate,
    condition: normalizedCondition,
    actualTriage,
    expectedTriage,
    severityDifference: severityDiff,
    isOverTriage: TRIAGE_SEVERITY[actualTriage] > TRIAGE_SEVERITY[expectedTriage],
    isUnderTriage: TRIAGE_SEVERITY[actualTriage] < TRIAGE_SEVERITY[expectedTriage]
  };
}

/**
 * Calculates comprehensive evaluation metrics from a dataset
 * @param {Array<{userInput: string, triageLevel: string, isHighRisk: boolean, disclaimers?: string[]}>} evaluationData - Array of query results to evaluate
 * @returns {EvaluationMetrics} Comprehensive metrics evaluation
 */
export function calculateMetrics(evaluationData) {
  let truePositives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let totalWithDisclaimers = 0;
  let totalHighRisk = 0;
  let accurateTriages = 0;
  let totalEvaluated = 0;
  
  for (const data of evaluationData) {
    if (!data.userInput || !data.triageLevel) {
      continue;
    }
    
    totalEvaluated++;
    
    // Evaluate triage accuracy
    const triageEval = evaluateTriageAccuracy(data.userInput, data.triageLevel);
    if (triageEval.isAccurate === true) {
      accurateTriages++;
    }
    
    // Calculate high-risk detection metrics
    const isHighRiskExpected = triageEval.expectedTriage === 'emergency';
    const isHighRiskActual = data.isHighRisk || data.triageLevel === 'emergency';
    
    if (isHighRiskExpected && isHighRiskActual) {
      truePositives++;
    } else if (!isHighRiskExpected && !isHighRiskActual) {
      trueNegatives++;
    } else if (!isHighRiskExpected && isHighRiskActual) {
      falsePositives++;
    } else if (isHighRiskExpected && !isHighRiskActual) {
      falseNegatives++;
    }
    
    // Track disclaimer usage
    if (data.disclaimers && data.disclaimers.length > 0) {
      totalWithDisclaimers++;
    }
    
    if (isHighRiskActual) {
      totalHighRisk++;
    }
  }
  
  // Calculate derived metrics
  const precision = truePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
  const recall = truePositives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
  const accuracy = totalEvaluated > 0 ? accurateTriages / totalEvaluated : 0;
  const disclaimerRatio = totalEvaluated > 0 ? totalWithDisclaimers / totalEvaluated : 0;
  
  // Calculate F1 score as confidence metric
  const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  
  return {
    accuracy,
    precision,
    recall,
    falsePositives,
    falseNegatives,
    truePositives,
    trueNegatives,
    totalEvaluated,
    disclaimerRatio,
    confidenceScore: f1Score,
    highRiskDetected: totalHighRisk,
    triageAccuracy: accuracy
  };
}

/**
 * Evaluates disclaimer usage appropriateness
 * @param {string} triageLevel - Triage level assigned
 * @param {Array<string>} disclaimers - Disclaimers shown to user
 * @param {boolean} isHighRisk - Whether query was flagged as high risk
 * @returns {object} Disclaimer usage evaluation
 */
export function evaluateDisclaimerUsage(triageLevel, disclaimers = [], isHighRisk = false) {
  const hasDisclaimers = disclaimers.length > 0;
  const shouldHaveDisclaimers = triageLevel === 'emergency' || isHighRisk;
  
  return {
    appropriate: shouldHaveDisclaimers === hasDisclaimers,
    hasDisclaimers,
    shouldHaveDisclaimers,
    disclaimerCount: disclaimers.length,
    triageLevel,
    isHighRisk,
    severity: shouldHaveDisclaimers ? 'high' : 'low'
  };
}

/**
 * Generates a detailed evaluation report
 * @param {Array<object>} dataset - Dataset to evaluate
 * @returns {object} Comprehensive evaluation report
 */
export function generateEvaluationReport(dataset) {
  const metrics = calculateMetrics(dataset);
  const timestamp = new Date().toISOString();
  
  // Calculate additional insights
  const emergencyQueries = dataset.filter(d => d.triageLevel === 'emergency').length;
  const urgentQueries = dataset.filter(d => d.triageLevel === 'urgent').length;
  const nonUrgentQueries = dataset.filter(d => d.triageLevel === 'non_urgent').length;
  
  return {
    reportId: `eval_${Date.now()}`,
    timestamp,
    dataset: {
      totalQueries: dataset.length,
      emergencyQueries,
      urgentQueries,
      nonUrgentQueries,
      evaluatedQueries: metrics.totalEvaluated
    },
    performance: {
      overallAccuracy: metrics.accuracy,
      triageAccuracy: metrics.triageAccuracy,
      highRiskPrecision: metrics.precision,
      highRiskRecall: metrics.recall,
      confidenceScore: metrics.confidenceScore
    },
    quality: {
      disclaimerCoverage: metrics.disclaimerRatio,
      falsePositiveRate: metrics.totalEvaluated > 0 ? metrics.falsePositives / metrics.totalEvaluated : 0,
      falseNegativeRate: metrics.totalEvaluated > 0 ? metrics.falseNegatives / metrics.totalEvaluated : 0
    },
    recommendations: generateRecommendations(metrics)
  };
}

/**
 * Generates improvement recommendations based on metrics
 * @private
 * @param {EvaluationMetrics} metrics - Calculated metrics
 * @returns {Array<string>} Array of recommendation strings
 */
function generateRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.accuracy < 0.8) {
    recommendations.push('Overall accuracy below 80% - review triage logic');
  }
  
  if (metrics.precision < 0.7) {
    recommendations.push('High false positive rate - tighten high-risk detection criteria');
  }
  
  if (metrics.recall < 0.9) {
    recommendations.push('Missing high-risk cases - broaden emergency detection patterns');
  }
  
  if (metrics.disclaimerRatio < 0.5) {
    recommendations.push('Low disclaimer usage - ensure safety warnings for medical advice');
  }
  
  if (metrics.falseNegatives > metrics.falsePositives * 2) {
    recommendations.push('Prioritize reducing false negatives over false positives for safety');
  }
  
  return recommendations;
}

/**
 * Loads evaluation data from the training dataset
 * @returns {Promise<Array<object>>} Evaluation dataset
 */
export async function loadEvaluationDataset() {
  try {
    // Try to load from training dataset
    const fs = await import('fs');
    const path = 'client/src/training-dataset/layer-decisions.jsonl';
    
    if (!fs.existsSync(path)) {
      console.warn('[metrics-evaluator] Training dataset not found, using empty dataset');
      return [];
    }
    
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
  } catch (error) {
    console.error('[metrics-evaluator] Failed to load dataset:', error.message);
    return [];
  }
}