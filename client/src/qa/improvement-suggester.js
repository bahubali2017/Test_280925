/**
 * Improvement Suggester for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: Improvement analysis operates on anonymized feedback and
 * performance data to identify system enhancement opportunities while
 * protecting user privacy.
 * 
 * @file Analyzes patterns and suggests system improvements
 */

/** @typedef {{[k: string]: number}} NumDict */
/** @typedef {{[k: string]: string}} StringDict */

/**
 * @typedef {'low'|'medium'|'high'|'critical'} Severity
 */

/**
 * @typedef SuggestionContext
 * @property {string} sessionId
 * @property {string} userId
 * @property {{ model?: string, route?: string, locale?: string }=} meta
 * @property {{ processingTime?: number, confidence?: number, triageLevel?: string, isHighRisk?: boolean }=} metrics
 * @property {{ userInput?: string, enhancedPrompt?: string, symptoms?: string[] }=} text
 */

/**
 * @typedef SuggestionRule
 * @property {string} id
 * @property {string} description
 * @property {(ctx: SuggestionContext) => boolean} predicate
 * @property {Severity} severity
 * @property {string} recommendation
 * @property {StringDict=} tags
 */

/**
 * @typedef ImprovementSuggestion
 * @property {string} id
 * @property {string} title
 * @property {string} message
 * @property {Severity} severity
 * @property {StringDict=} tags
 */

/**
 * @typedef SuggesterConfig
 * @property {number} maxPerRun
 * @property {Severity=} minSeverity
 * @property {StringDict=} defaults
 */

/**
 * @typedef SuggesterReport
 * @property {ImprovementSuggestion[]} suggestions
 * @property {NumDict} countsBySeverity
 */

/**
 * @typedef LegacyImprovementSuggestion
 * @property {string} id
 * @property {string} category
 * @property {"low" | "medium" | "high" | "critical"} priority
 * @property {string} description
 * @property {Array<string>} evidence
 * @property {string} implementationNotes
 * @property {"minor" | "moderate" | "significant" | "major"} estimatedImpact
 * @property {string} suggestedBy
 * @property {string} timestamp
 */

/**
 * @typedef EvaluationDataItem
 * @property {string} userInput
 * @property {string} triageLevel
 * @property {boolean} isHighRisk
 * @property {Array<string>=} disclaimers
 * @property {string=} responseCategory
 * @property {string=} llmResponse
 */

/**
 * @typedef FeedbackDataItem
 * @property {string=} feedbackText
 * @property {{category?: string}=} analysis
 */

/**
 * @typedef FeedbackAnalysis
 * @property {{accuracy: {low: number}}} trends
 * @property {number} totalFeedback
 * @property {number} averageAccuracy
 */

/**
 * @typedef MetricsAnalysis
 * @property {number} accuracy
 * @property {number} precision
 * @property {number} recall
 * @property {number} falsePositives
 * @property {number} falseNegatives
 * @property {number} disclaimerRatio
 */

import { loadRecentFeedback, analyzeFeedbackTrends } from './feedback-handler.js';
import { loadEvaluationDataset, calculateMetrics } from './metrics-evaluator.js';

/**
 * Analysis categories for improvement suggestions
 * @readonly
 */
export const ImprovementCategory = {
  TRIAGE_ACCURACY: 'triage_accuracy',
  RESPONSE_QUALITY: 'response_quality',
  SAFETY_PROTOCOLS: 'safety_protocols',
  USER_EXPERIENCE: 'user_experience',
  PROMPT_ENGINEERING: 'prompt_engineering',
  DISCLAIMER_COVERAGE: 'disclaimer_coverage'
};


/**
 * Simple logger function
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {...unknown} args - Additional arguments
 * @returns {void}
 */
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [improvement-suggester] ${message}`;
  
  if (level === 'error') {
    console.error(logMessage, ...args);
  } else if (level === 'warn') {
    console.warn(logMessage, ...args);
  } else {
    console.info(logMessage, ...args);
  }
}

/**
 * Analyzes system performance and generates improvement suggestions
 * @param {object} [options] - Analysis options
 * @param {number} [options.feedbackDays] - Days of feedback to analyze (default: 30)
 * @param {number} [options.minOccurrences] - Minimum pattern occurrences to suggest (default: 3)
 * @returns {Promise<Array<LegacyImprovementSuggestion>>} Array of improvement suggestions
 */
export async function generateImprovementSuggestions(options = { feedbackDays: 30, minOccurrences: 3 }) {
  const {
    feedbackDays = 30,
    minOccurrences = 3
  } = options;
  
  try {
    log('info', 'Starting analysis...');
    
    // Load analysis data
    const feedbackData = await loadRecentFeedback(feedbackDays * 10); // Approximate daily volume
    const evaluationData = await loadEvaluationDataset();
    
    // Perform analysis
    const feedbackAnalysis = analyzeFeedbackTrends(feedbackData);
    const metricsAnalysis = calculateMetrics(/** @type {Array<EvaluationDataItem>} */ (evaluationData));
    
    // Generate suggestions from different analysis paths
    /** @type {LegacyImprovementSuggestion[]} */
    const suggestions = [
      ...analyzeTriageDisagreements(/** @type {Array<EvaluationDataItem>} */ (evaluationData), minOccurrences),
      ...analyzeFeedbackPatterns(feedbackData, /** @type {FeedbackAnalysis} */ (feedbackAnalysis), minOccurrences),
      ...analyzePerformanceMetrics(/** @type {MetricsAnalysis} */ (metricsAnalysis)),
      ...analyzeFallbackPatterns(/** @type {Array<EvaluationDataItem>} */ (evaluationData), minOccurrences),
      ...analyzeDisclaimerGaps(/** @type {Array<EvaluationDataItem>} */ (evaluationData), /** @type {MetricsAnalysis} */ (metricsAnalysis))
    ];
    
    // Sort by priority and impact
    const prioritizedSuggestions = prioritizeSuggestions(suggestions);
    
    log('info', `Generated ${prioritizedSuggestions.length} suggestions`);
    
    return prioritizedSuggestions;
    
  } catch (error) {
    log('error', 'Failed to generate suggestions:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Analyzes repeated triage disagreements from evaluation data
 * @param {Array<EvaluationDataItem>} evaluationData - Evaluation dataset
 * @param {number} minOccurrences - Minimum occurrences to flag
 * @returns {Array<LegacyImprovementSuggestion>} Triage-related suggestions
 */
function analyzeTriageDisagreements(evaluationData, minOccurrences) {
  /** @type {Array<LegacyImprovementSuggestion>} */
  const suggestions = [];
  /** @type {{[k: string]: string[]}} */
  const disagreements = {};
  
  // Track disagreement patterns
  evaluationData.forEach(data => {
    const userInput = data && typeof data.userInput === 'string' ? data.userInput : '';
    const triageLevel = data && typeof data.triageLevel === 'string' ? data.triageLevel : '';
    
    if (userInput && triageLevel) {
      // Simplify to check for common patterns
      const inputWords = userInput.toLowerCase().split(' ');
      const keySymptoms = inputWords.filter(word => 
        ['pain', 'headache', 'chest', 'heart', 'breathing', 'fever', 'dizzy'].includes(word)
      );
      
      if (keySymptoms.length > 0) {
        const pattern = keySymptoms.join(' ');
        if (!disagreements[pattern]) {
          disagreements[pattern] = [];
        }
        disagreements[pattern].push(triageLevel);
      }
    }
  });
  
  // Identify inconsistent triage patterns
  Object.entries(disagreements).forEach(([pattern, triages]) => {
    if (triages.length >= minOccurrences) {
      const uniqueTriages = Array.from(new Set(triages));
      if (uniqueTriages.length > 1) {
        suggestions.push({
          id: `triage_${pattern.replace(/\s+/g, '_')}_${Date.now()}`,
          category: ImprovementCategory.TRIAGE_ACCURACY,
          priority: 'high',
          description: `Inconsistent triage decisions for "${pattern}" symptoms`,
          evidence: [
            `Found ${triages.length} cases with ${uniqueTriages.length} different triage levels`,
            `Triage distribution: ${uniqueTriages.map(t => `${t}: ${triages.filter(x => x === t).length}`).join(', ')}`
          ],
          implementationNotes: 'Review triage logic for these symptom patterns and establish consistent criteria',
          estimatedImpact: 'significant',
          suggestedBy: 'pattern_analysis',
          timestamp: new Date().toISOString()
        });
      }
    }
  });
  
  return suggestions;
}

/**
 * Analyzes user feedback patterns for improvement opportunities
 * @param {Array<FeedbackDataItem>} feedbackData - User feedback data
 * @param {FeedbackAnalysis} feedbackAnalysis - Aggregated feedback analysis
 * @param {number} minOccurrences - Minimum occurrences to flag
 * @returns {Array<LegacyImprovementSuggestion>} Feedback-based suggestions
 */
function analyzeFeedbackPatterns(feedbackData, feedbackAnalysis, minOccurrences) {
  /** @type {Array<LegacyImprovementSuggestion>} */
  const suggestions = [];
  
  // Check for high volume of low accuracy feedback
  const trends = feedbackAnalysis && feedbackAnalysis.trends ? feedbackAnalysis.trends : { accuracy: { low: 0 } };
  const lowAccuracyCount = trends.accuracy && typeof trends.accuracy.low === 'number' ? trends.accuracy.low : 0;
  
  if (lowAccuracyCount >= minOccurrences) {
    const totalFeedback = feedbackAnalysis && typeof feedbackAnalysis.totalFeedback === 'number' ? feedbackAnalysis.totalFeedback : 0;
    const averageAccuracy = feedbackAnalysis && typeof feedbackAnalysis.averageAccuracy === 'number' ? feedbackAnalysis.averageAccuracy : 0;
    
    suggestions.push({
      id: `accuracy_feedback_${Date.now()}`,
      category: ImprovementCategory.RESPONSE_QUALITY,
      priority: 'high',
      description: 'High volume of low accuracy feedback received',
      evidence: [
        `${lowAccuracyCount} low accuracy ratings out of ${totalFeedback} total`,
        `Average accuracy rating: ${averageAccuracy.toFixed(2)}/3.0`
      ],
      implementationNotes: 'Review recent responses flagged as low accuracy and identify common failure patterns',
      estimatedImpact: 'major',
      suggestedBy: 'feedback_analysis',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check for safety-related feedback
  const safetyFeedback = feedbackData.filter(f => {
    const analysis = f && f.analysis ? f.analysis : {};
    const category = analysis && typeof analysis.category === 'string' ? analysis.category : '';
    const feedbackText = f && typeof f.feedbackText === 'string' ? f.feedbackText : '';
    
    return category === 'safety' || feedbackText.toLowerCase().includes('unsafe');
  });
  
  if (safetyFeedback.length >= 1) { // Even one safety concern is important
    suggestions.push({
      id: `safety_concern_${Date.now()}`,
      category: ImprovementCategory.SAFETY_PROTOCOLS,
      priority: 'critical',
      description: 'Safety concerns raised in user feedback',
      evidence: [
        `${safetyFeedback.length} safety-related feedback entries`,
        'User feedback indicates potential safety issues with responses'
      ],
      implementationNotes: 'Immediate review of safety protocols and disclaimer coverage required',
      estimatedImpact: 'major',
      suggestedBy: 'safety_analysis',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check for clarity issues
  const clarityFeedback = feedbackData.filter(f => {
    const analysis = f && f.analysis ? f.analysis : {};
    const category = analysis && typeof analysis.category === 'string' ? analysis.category : '';
    const feedbackText = f && typeof f.feedbackText === 'string' ? f.feedbackText : '';
    
    return category === 'clarity' || feedbackText.toLowerCase().includes('confus');
  });
  
  if (clarityFeedback.length >= minOccurrences) {
    suggestions.push({
      id: `clarity_improvement_${Date.now()}`,
      category: ImprovementCategory.USER_EXPERIENCE,
      priority: 'medium',
      description: 'Users report confusion or clarity issues with responses',
      evidence: [
        `${clarityFeedback.length} clarity-related feedback entries`,
        'Common keywords: confusing, unclear, hard to understand'
      ],
      implementationNotes: 'Simplify response language and improve structure for better readability',
      estimatedImpact: 'moderate',
      suggestedBy: 'clarity_analysis',
      timestamp: new Date().toISOString()
    });
  }
  
  return suggestions;
}

/**
 * Analyzes performance metrics for improvement opportunities
 * @param {MetricsAnalysis} metrics - Performance metrics
 * @returns {Array<LegacyImprovementSuggestion>} Performance-based suggestions
 */
function analyzePerformanceMetrics(metrics) {
  /** @type {Array<LegacyImprovementSuggestion>} */
  const suggestions = [];
  
  const accuracy = metrics && typeof metrics.accuracy === 'number' ? metrics.accuracy : 0;
  const precision = metrics && typeof metrics.precision === 'number' ? metrics.precision : 0;
  const recall = metrics && typeof metrics.recall === 'number' ? metrics.recall : 0;
  const falsePositives = metrics && typeof metrics.falsePositives === 'number' ? metrics.falsePositives : 0;
  const falseNegatives = metrics && typeof metrics.falseNegatives === 'number' ? metrics.falseNegatives : 0;
  const disclaimerRatio = metrics && typeof metrics.disclaimerRatio === 'number' ? metrics.disclaimerRatio : 0;
  
  // Check overall accuracy
  if (accuracy < 0.8) {
    suggestions.push({
      id: `low_accuracy_${Date.now()}`,
      category: ImprovementCategory.TRIAGE_ACCURACY,
      priority: accuracy < 0.6 ? 'critical' : 'high',
      description: 'Overall system accuracy below acceptable threshold',
      evidence: [
        `Current accuracy: ${(accuracy * 100).toFixed(1)}%`,
        `Target accuracy: 80%+`
      ],
      implementationNotes: 'Comprehensive review of triage logic and prompt engineering needed',
      estimatedImpact: 'major',
      suggestedBy: 'metrics_analysis',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check precision for high-risk detection
  if (precision < 0.7) {
    suggestions.push({
      id: `low_precision_${Date.now()}`,
      category: ImprovementCategory.TRIAGE_ACCURACY,
      priority: 'high',
      description: 'High false positive rate in emergency detection',
      evidence: [
        `Current precision: ${(precision * 100).toFixed(1)}%`,
        `False positives: ${falsePositives}`
      ],
      implementationNotes: 'Tighten emergency detection criteria to reduce false alarms',
      estimatedImpact: 'significant',
      suggestedBy: 'metrics_analysis',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check recall for high-risk detection
  if (recall < 0.9) {
    suggestions.push({
      id: `low_recall_${Date.now()}`,
      category: ImprovementCategory.SAFETY_PROTOCOLS,
      priority: 'critical',
      description: 'Missing emergency cases - safety risk',
      evidence: [
        `Current recall: ${(recall * 100).toFixed(1)}%`,
        `False negatives: ${falseNegatives}`
      ],
      implementationNotes: 'Broaden emergency detection patterns - prioritize safety over precision',
      estimatedImpact: 'major',
      suggestedBy: 'safety_metrics',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check disclaimer usage
  if (disclaimerRatio < 0.5) {
    suggestions.push({
      id: `low_disclaimers_${Date.now()}`,
      category: ImprovementCategory.DISCLAIMER_COVERAGE,
      priority: 'medium',
      description: 'Low disclaimer usage may indicate insufficient safety warnings',
      evidence: [
        `Current disclaimer ratio: ${(disclaimerRatio * 100).toFixed(1)}%`,
        'Target: 50%+ for medical advice responses'
      ],
      implementationNotes: 'Review disclaimer triggers and ensure appropriate safety warnings',
      estimatedImpact: 'moderate',
      suggestedBy: 'safety_compliance',
      timestamp: new Date().toISOString()
    });
  }
  
  return suggestions;
}

/**
 * Analyzes fallback response patterns
 * @param {Array<EvaluationDataItem>} evaluationData - Evaluation dataset
 * @param {number} minOccurrences - Minimum occurrences to flag
 * @returns {Array<LegacyImprovementSuggestion>} Fallback-related suggestions
 */
function analyzeFallbackPatterns(evaluationData, minOccurrences) {
  /** @type {Array<LegacyImprovementSuggestion>} */
  const suggestions = [];
  
  // Count fallback responses
  const fallbacks = evaluationData.filter(data => {
    const responseCategory = data && typeof data.responseCategory === 'string' ? data.responseCategory : '';
    const llmResponse = data && typeof data.llmResponse === 'string' ? data.llmResponse : '';
    
    return responseCategory === 'fallback' || llmResponse.includes('I apologize');
  });
  
  if (fallbacks.length >= minOccurrences) {
    const fallbackRate = fallbacks.length / evaluationData.length;
    
    suggestions.push({
      id: `high_fallback_rate_${Date.now()}`,
      category: ImprovementCategory.PROMPT_ENGINEERING,
      priority: fallbackRate > 0.1 ? 'high' : 'medium',
      description: 'High rate of fallback responses indicates prompt engineering issues',
      evidence: [
        `${fallbacks.length} fallback responses out of ${evaluationData.length} total`,
        `Fallback rate: ${(fallbackRate * 100).toFixed(1)}%`
      ],
      implementationNotes: 'Review and improve prompts to handle edge cases better',
      estimatedImpact: 'significant',
      suggestedBy: 'fallback_analysis',
      timestamp: new Date().toISOString()
    });
  }
  
  return suggestions;
}

/**
 * Analyzes disclaimer coverage gaps
 * @param {Array<EvaluationDataItem>} evaluationData - Evaluation dataset
 * @param {MetricsAnalysis} _metrics - Performance metrics (unused)
 * @returns {Array<LegacyImprovementSuggestion>} Disclaimer-related suggestions
 */
function analyzeDisclaimerGaps(evaluationData, _metrics) {
  /** @type {Array<LegacyImprovementSuggestion>} */
  const suggestions = [];
  
  // Find high-risk cases without disclaimers
  const highRiskWithoutDisclaimers = evaluationData.filter(data => {
    const triageLevel = data && typeof data.triageLevel === 'string' ? data.triageLevel : '';
    const isHighRisk = data && typeof data.isHighRisk === 'boolean' ? data.isHighRisk : false;
    const disclaimers = data && Array.isArray(data.disclaimers) ? data.disclaimers : [];
    
    return (triageLevel === 'emergency' || isHighRisk) && disclaimers.length === 0;
  });
  
  if (highRiskWithoutDisclaimers.length > 0) {
    suggestions.push({
      id: `disclaimer_gaps_${Date.now()}`,
      category: ImprovementCategory.DISCLAIMER_COVERAGE,
      priority: 'high',
      description: 'High-risk responses lacking appropriate disclaimers',
      evidence: [
        `${highRiskWithoutDisclaimers.length} high-risk responses without disclaimers`,
        'Emergency and high-risk responses should always include safety warnings'
      ],
      implementationNotes: 'Implement mandatory disclaimers for all emergency-level responses',
      estimatedImpact: 'significant',
      suggestedBy: 'disclaimer_analysis',
      timestamp: new Date().toISOString()
    });
  }
  
  return suggestions;
}

/**
 * Prioritizes suggestions based on impact and urgency
 * @param {Array<LegacyImprovementSuggestion>} suggestions - Raw suggestions
 * @returns {Array<LegacyImprovementSuggestion>} Prioritized suggestions
 */
function prioritizeSuggestions(suggestions) {
  /** @type {NumDict} */
  const priorityWeight = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };
  
  /** @type {NumDict} */
  const impactWeight = {
    'major': 4,
    'significant': 3,
    'moderate': 2,
    'minor': 1
  };
  
  return suggestions
    .map(suggestion => ({
      ...suggestion,
      _score: (priorityWeight[suggestion.priority] ?? 1) + (impactWeight[suggestion.estimatedImpact] ?? 1)
    }))
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...suggestion }) => suggestion);
}

/**
 * Generates an improvement report with actionable insights
 * @param {object} [options] - Report options
 * @returns {Promise<object>} Comprehensive improvement report
 */
export async function generateImprovementReport(options = {}) {
  try {
    const suggestions = await generateImprovementSuggestions(options);
    const feedbackData = await loadRecentFeedback();
    const evaluationData = await loadEvaluationDataset();
    
    // Group suggestions by category
    /** @type {{[k: string]: LegacyImprovementSuggestion[]}} */
    const suggestionsByCategory = {};
    for (const suggestion of suggestions) {
      const category = suggestion.category;
      if (!suggestionsByCategory[category]) suggestionsByCategory[category] = [];
      suggestionsByCategory[category].push(suggestion);
    }
    
    // Calculate urgency metrics
    /** @type {NumDict} */
    const urgencyMetrics = {
      critical: suggestions.filter(s => s.priority === 'critical').length,
      high: suggestions.filter(s => s.priority === 'high').length,
      medium: suggestions.filter(s => s.priority === 'medium').length,
      low: suggestions.filter(s => s.priority === 'low').length
    };
    
    return {
      reportId: `improvement_${Date.now()}`,
      timestamp: new Date().toISOString(),
      summary: {
        totalSuggestions: suggestions.length,
        urgencyMetrics,
        datasetSize: {
          feedback: feedbackData.length,
          evaluation: evaluationData.length
        }
      },
      suggestions: suggestions.slice(0, 20), // Top 20 suggestions
      categorizedSuggestions: suggestionsByCategory,
      actionItems: suggestions
        .filter(s => s.priority === 'critical' || s.priority === 'high')
        .slice(0, 10),
      nextSteps: generateNextSteps(suggestions)
    };
    
  } catch (error) {
    log('error', 'Failed to generate improvement report:', error instanceof Error ? error.message : String(error));
    return {
      error: 'Failed to generate improvement report',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generates next steps based on suggestions
 * @param {Array<LegacyImprovementSuggestion>} suggestions - All suggestions
 * @returns {Array<string>} Next step recommendations
 */
function generateNextSteps(suggestions) {
  /** @type {string[]} */
  const steps = [];
  
  const criticalSuggestions = suggestions.filter(s => s.priority === 'critical');
  if (criticalSuggestions.length > 0) {
    steps.push('🚨 Address critical safety and accuracy issues immediately');
  }
  
  const highPriority = suggestions.filter(s => s.priority === 'high');
  if (highPriority.length > 0) {
    steps.push('⚡ Review high-priority improvements within 1-2 weeks');
  }
  
  const triageIssues = suggestions.filter(s => s.category === ImprovementCategory.TRIAGE_ACCURACY);
  if (triageIssues.length > 0) {
    steps.push('🎯 Audit triage logic and update decision criteria');
  }
  
  const promptIssues = suggestions.filter(s => s.category === ImprovementCategory.PROMPT_ENGINEERING);
  if (promptIssues.length > 0) {
    steps.push('📝 Review and enhance prompt engineering for better responses');
  }
  
  steps.push('📊 Schedule weekly review of improvement suggestions');
  steps.push('🔄 Implement continuous monitoring of key performance metrics');
  
  return steps;
}