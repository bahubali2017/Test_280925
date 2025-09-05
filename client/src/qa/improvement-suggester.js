/**
 * Improvement Suggester for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: Improvement analysis operates on anonymized feedback and
 * performance data to identify system enhancement opportunities while
 * protecting user privacy.
 * 
 * @file Analyzes patterns and suggests system improvements
 */

import { loadRecentFeedback, analyzeFeedbackTrends } from './feedback-handler.js';
import { loadEvaluationDataset, calculateMetrics } from './metrics-evaluator.js';

/**
 * Improvement suggestion structure
 * @typedef {{
 *   id: string;
 *   category: string;
 *   priority: "low" | "medium" | "high" | "critical";
 *   description: string;
 *   evidence: Array<string>;
 *   implementationNotes: string;
 *   estimatedImpact: "minor" | "moderate" | "significant" | "major";
 *   suggestedBy: string;
 *   timestamp: string;
 * }} ImprovementSuggestion
 */

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
 * Analyzes system performance and generates improvement suggestions
 * @param {object} [options] - Analysis options
 * @param {number} options.feedbackDays - Days of feedback to analyze (default: 30)
 * @param {number} options.minOccurrences - Minimum pattern occurrences to suggest (default: 3)
 * @returns {Promise<Array<ImprovementSuggestion>>} Array of improvement suggestions
 */
export async function generateImprovementSuggestions(options = { feedbackDays: 30, minOccurrences: 3 }) {
  const {
    feedbackDays = 30,
    minOccurrences = 3
  } = options;
  
  try {
    console.log('[improvement-suggester] Starting analysis...');
    
    // Load analysis data
    const feedbackData = await loadRecentFeedback(feedbackDays * 10); // Approximate daily volume
    const evaluationData = await loadEvaluationDataset();
    
    // Perform analysis
    const feedbackAnalysis = analyzeFeedbackTrends(feedbackData);
    const metricsAnalysis = calculateMetrics(evaluationData);
    
    // Generate suggestions from different analysis paths
    const suggestions = [
      ...analyzeTriageDisagreements(evaluationData, minOccurrences),
      ...analyzeFeedbackPatterns(feedbackData, feedbackAnalysis, minOccurrences),
      ...analyzePerformanceMetrics(metricsAnalysis),
      ...analyzeFallbackPatterns(evaluationData, minOccurrences),
      ...analyzeDisclaimerGaps(evaluationData, metricsAnalysis)
    ];
    
    // Sort by priority and impact
    const prioritizedSuggestions = prioritizeSuggestions(suggestions);
    
    console.log(`[improvement-suggester] Generated ${prioritizedSuggestions.length} suggestions`);
    
    return prioritizedSuggestions;
    
  } catch (error) {
    console.error('[improvement-suggester] Failed to generate suggestions:', error.message);
    return [];
  }
}

/**
 * Analyzes repeated triage disagreements from evaluation data
 * @private
 * @param {Array<object>} evaluationData - Evaluation dataset
 * @param {number} minOccurrences - Minimum occurrences to flag
 * @returns {Array<ImprovementSuggestion>} Triage-related suggestions
 */
function analyzeTriageDisagreements(evaluationData, minOccurrences) {
  /** @type {Array<import('./improvement-suggester.js').ImprovementSuggestion>} */
  const suggestions = [];
  const disagreements = {};
  
  // Track disagreement patterns
  evaluationData.forEach(data => {
    if (data.userInput && data.triageLevel) {
      // Simplify to check for common patterns
      const inputWords = data.userInput.toLowerCase().split(' ');
      const keySymptoms = inputWords.filter(word => 
        ['pain', 'headache', 'chest', 'heart', 'breathing', 'fever', 'dizzy'].includes(word)
      );
      
      if (keySymptoms.length > 0) {
        const pattern = keySymptoms.join(' ');
        if (!disagreements[pattern]) {
          disagreements[pattern] = [];
        }
        disagreements[pattern].push(data.triageLevel);
      }
    }
  });
  
  // Identify inconsistent triage patterns
  Object.entries(disagreements).forEach(([pattern, triages]) => {
    if (triages.length >= minOccurrences) {
      const uniqueTriages = [...new Set(triages)];
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
 * @private
 * @param {Array<object>} feedbackData - User feedback data
 * @param {object} feedbackAnalysis - Aggregated feedback analysis
 * @param {number} minOccurrences - Minimum occurrences to flag
 * @returns {Array<ImprovementSuggestion>} Feedback-based suggestions
 */
function analyzeFeedbackPatterns(feedbackData, feedbackAnalysis, minOccurrences) {
  /** @type {Array<import('./improvement-suggester.js').ImprovementSuggestion>} */
  const suggestions = [];
  
  // Check for high volume of low accuracy feedback
  if (feedbackAnalysis.trends.accuracy.low >= minOccurrences) {
    suggestions.push({
      id: `accuracy_feedback_${Date.now()}`,
      category: ImprovementCategory.RESPONSE_QUALITY,
      priority: 'high',
      description: 'High volume of low accuracy feedback received',
      evidence: [
        `${feedbackAnalysis.trends.accuracy.low} low accuracy ratings out of ${feedbackAnalysis.totalFeedback} total`,
        `Average accuracy rating: ${feedbackAnalysis.averageAccuracy.toFixed(2)}/3.0`
      ],
      implementationNotes: 'Review recent responses flagged as low accuracy and identify common failure patterns',
      estimatedImpact: 'major',
      suggestedBy: 'feedback_analysis',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check for safety-related feedback
  const safetyFeedback = feedbackData.filter(f => 
    f.analysis?.category === 'safety' || 
    (f.feedbackText && f.feedbackText.toLowerCase().includes('unsafe'))
  );
  
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
  const clarityFeedback = feedbackData.filter(f => 
    f.analysis?.category === 'clarity' ||
    (f.feedbackText && f.feedbackText.toLowerCase().includes('confus'))
  );
  
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
 * @private
 * @param {object} metrics - Performance metrics
 * @returns {Array<ImprovementSuggestion>} Performance-based suggestions
 */
function analyzePerformanceMetrics(metrics) {
  /** @type {Array<import('./improvement-suggester.js').ImprovementSuggestion>} */
  const suggestions = [];
  
  // Check overall accuracy
  if (metrics.accuracy < 0.8) {
    suggestions.push({
      id: `low_accuracy_${Date.now()}`,
      category: ImprovementCategory.TRIAGE_ACCURACY,
      priority: metrics.accuracy < 0.6 ? 'critical' : 'high',
      description: 'Overall system accuracy below acceptable threshold',
      evidence: [
        `Current accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`,
        `Target accuracy: 80%+`
      ],
      implementationNotes: 'Comprehensive review of triage logic and prompt engineering needed',
      estimatedImpact: 'major',
      suggestedBy: 'metrics_analysis',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check precision for high-risk detection
  if (metrics.precision < 0.7) {
    suggestions.push({
      id: `low_precision_${Date.now()}`,
      category: ImprovementCategory.TRIAGE_ACCURACY,
      priority: 'high',
      description: 'High false positive rate in emergency detection',
      evidence: [
        `Current precision: ${(metrics.precision * 100).toFixed(1)}%`,
        `False positives: ${metrics.falsePositives}`
      ],
      implementationNotes: 'Tighten emergency detection criteria to reduce false alarms',
      estimatedImpact: 'significant',
      suggestedBy: 'metrics_analysis',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check recall for high-risk detection
  if (metrics.recall < 0.9) {
    suggestions.push({
      id: `low_recall_${Date.now()}`,
      category: ImprovementCategory.SAFETY_PROTOCOLS,
      priority: 'critical',
      description: 'Missing emergency cases - safety risk',
      evidence: [
        `Current recall: ${(metrics.recall * 100).toFixed(1)}%`,
        `False negatives: ${metrics.falseNegatives}`
      ],
      implementationNotes: 'Broaden emergency detection patterns - prioritize safety over precision',
      estimatedImpact: 'major',
      suggestedBy: 'safety_metrics',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check disclaimer usage
  if (metrics.disclaimerRatio < 0.5) {
    suggestions.push({
      id: `low_disclaimers_${Date.now()}`,
      category: ImprovementCategory.DISCLAIMER_COVERAGE,
      priority: 'medium',
      description: 'Low disclaimer usage may indicate insufficient safety warnings',
      evidence: [
        `Current disclaimer ratio: ${(metrics.disclaimerRatio * 100).toFixed(1)}%`,
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
 * @private
 * @param {Array<object>} evaluationData - Evaluation dataset
 * @param {number} minOccurrences - Minimum occurrences to flag
 * @returns {Array<ImprovementSuggestion>} Fallback-related suggestions
 */
function analyzeFallbackPatterns(evaluationData, minOccurrences) {
  /** @type {Array<import('./improvement-suggester.js').ImprovementSuggestion>} */
  const suggestions = [];
  
  // Count fallback responses
  const fallbacks = evaluationData.filter(data => 
    data.responseCategory === 'fallback' ||
    (data.llmResponse && data.llmResponse.includes('I apologize'))
  );
  
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
 * @private
 * @param {Array<object>} evaluationData - Evaluation dataset
 * @param {object} _metrics - Performance metrics (unused)
 * @returns {Array<ImprovementSuggestion>} Disclaimer-related suggestions
 */
function analyzeDisclaimerGaps(evaluationData, _metrics) {
  /** @type {Array<import('./improvement-suggester.js').ImprovementSuggestion>} */
  const suggestions = [];
  
  // Find high-risk cases without disclaimers
  const highRiskWithoutDisclaimers = evaluationData.filter(data => 
    (data.triageLevel === 'emergency' || data.isHighRisk) &&
    (!data.disclaimers || data.disclaimers.length === 0)
  );
  
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
 * @private
 * @param {Array<ImprovementSuggestion>} suggestions - Raw suggestions
 * @returns {Array<ImprovementSuggestion>} Prioritized suggestions
 */
function prioritizeSuggestions(suggestions) {
  const priorityWeight = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };
  
  const impactWeight = {
    'major': 4,
    'significant': 3,
    'moderate': 2,
    'minor': 1
  };
  
  return suggestions
    .map(suggestion => ({
      ...suggestion,
      _score: (priorityWeight[suggestion.priority] || 1) + (impactWeight[suggestion.estimatedImpact] || 1)
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
    const suggestionsByCategory = suggestions.reduce((acc, suggestion) => {
      const category = suggestion.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(suggestion);
      return acc;
    }, {});
    
    // Calculate urgency metrics
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
    console.error('[improvement-suggester] Failed to generate improvement report:', error.message);
    return {
      error: 'Failed to generate improvement report',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generates next steps based on suggestions
 * @private
 * @param {Array<ImprovementSuggestion>} suggestions - All suggestions
 * @returns {Array<string>} Next step recommendations
 */
function generateNextSteps(suggestions) {
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