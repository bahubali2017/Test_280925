/**
 * @file Usage pattern tracking and feedback integration system
 * Phase 8: Analytics and learning loops for system improvement
 */

/**
 * Usage pattern tracking data
 * @type {Map<string, {count: number, lastUsed: Date, patterns: object[], outcomes: string[]}>}
 */
const usagePatterns = new Map();

/**
 * Feedback data collection
 * @type {Array<{sessionId: string, queryType: string, urgency: string, userFeedback: number, timestamp: Date, improvements: string[]}>}
 */
const feedbackCollection = [];

/**
 * Learning metrics for system improvement
 * @type {Map<string, {accuracy: number, userSatisfaction: number, avgResponseTime: number, successRate: number, sampleCount: number}>}
 */
const learningMetrics = new Map();

/**
 * Track user query patterns and medical domain usage
 * @param {string} sessionId - Session identifier
 * @param {string} queryType - Type of medical query
 * @param {'emergency'|'urgent'|'non_urgent'} urgency - Query urgency level
 * @param {string[]} symptoms - Detected symptoms
 * @param {string} triageResult - Triage classification result
 * @param {number} responseTime - Time taken to process query
 */
export function trackQueryPattern(sessionId, queryType, urgency, symptoms, triageResult, responseTime) {
  const patternKey = `${queryType}_${urgency}`;
  
  if (!usagePatterns.has(patternKey)) {
    usagePatterns.set(patternKey, {
      count: 0,
      lastUsed: new Date(),
      patterns: [],
      outcomes: []
    });
  }
  
  const pattern = usagePatterns.get(patternKey);
  pattern.count++;
  pattern.lastUsed = new Date();
  
  // Store pattern data (keep only recent 50 entries per pattern)
  pattern.patterns.push({
    sessionId,
    symptoms,
    responseTime,
    timestamp: new Date()
  });
  
  if (pattern.patterns.length > 50) {
    pattern.patterns = pattern.patterns.slice(-50);
  }
  
  // Store triage outcomes
  pattern.outcomes.push(triageResult);
  if (pattern.outcomes.length > 100) {
    pattern.outcomes = pattern.outcomes.slice(-100);
  }
  
  console.log(`[Usage Tracker] Recorded pattern: ${patternKey}, Total: ${pattern.count}`);
}

/**
 * Record user feedback for system learning
 * @param {string} sessionId - Session identifier
 * @param {string} queryType - Type of query that received feedback
 * @param {'emergency'|'urgent'|'non_urgent'} urgency - Query urgency level
 * @param {number} userFeedback - User satisfaction rating (1-10)
 * @param {string[]} improvements - Suggested improvements from user
 * @param {object} additionalData - Additional feedback context
 */
export function recordUserFeedback(sessionId, queryType, urgency, userFeedback, improvements = [], additionalData = {}) {
  const feedback = {
    sessionId,
    queryType,
    urgency,
    userFeedback,
    improvements,
    timestamp: new Date(),
    ...additionalData
  };
  
  feedbackCollection.push(feedback);
  
  // Keep only recent 1000 feedback entries
  if (feedbackCollection.length > 1000) {
    feedbackCollection.splice(0, feedbackCollection.length - 1000);
  }
  
  // Update learning metrics
  updateLearningMetrics(queryType, urgency, userFeedback, additionalData);
  
  console.log(`[Feedback] Recorded rating ${userFeedback}/10 for ${queryType} (${urgency})`);
}

/**
 * Update system learning metrics based on feedback
 * @param {string} queryType - Type of query
 * @param {'emergency'|'urgent'|'non_urgent'} urgency - Query urgency
 * @param {number} userFeedback - User satisfaction rating
 * @param {object} additionalData - Additional context data
 */
function updateLearningMetrics(queryType, urgency, userFeedback, additionalData) {
  const metricsKey = `${queryType}_${urgency}`;
  
  if (!learningMetrics.has(metricsKey)) {
    learningMetrics.set(metricsKey, {
      accuracy: 0,
      userSatisfaction: 0,
      avgResponseTime: 0,
      successRate: 0,
      sampleCount: 0
    });
  }
  
  const metrics = learningMetrics.get(metricsKey);
  const alpha = 0.1; // Learning rate for exponential moving average
  
  // Update user satisfaction score
  metrics.userSatisfaction = (alpha * userFeedback) + ((1 - alpha) * metrics.userSatisfaction);
  
  // Update accuracy if provided
  if (additionalData.accuracyRating) {
    metrics.accuracy = (alpha * additionalData.accuracyRating) + ((1 - alpha) * metrics.accuracy);
  }
  
  // Update response time if provided
  if (additionalData.responseTime) {
    metrics.avgResponseTime = (alpha * additionalData.responseTime) + ((1 - alpha) * metrics.avgResponseTime);
  }
  
  // Update success rate based on feedback threshold
  const wasSuccessful = userFeedback >= 7 ? 1 : 0; // 7/10 or above considered successful
  metrics.successRate = (alpha * wasSuccessful) + ((1 - alpha) * metrics.successRate);
  
  metrics.sampleCount++;
}

/**
 * Analyze usage patterns to identify trends and improvement opportunities
 * @param {number} timeWindowDays - Number of days to analyze (default 7)
 * @returns {object} Analysis results with trends and recommendations
 */
export function analyzeUsagePatterns(timeWindowDays = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);
  
  const analysis = {
    timeWindow: timeWindowDays,
    totalQueries: 0,
    queryDistribution: {},
    urgencyDistribution: { emergency: 0, urgent: 0, non_urgent: 0 },
    trends: [],
    recommendations: []
  };
  
  // Analyze usage patterns
  for (const [patternKey, pattern] of usagePatterns.entries()) {
    if (pattern.lastUsed < cutoffDate) continue;
    
    const [queryType, urgency] = patternKey.split('_');
    
    // Count recent patterns
    const recentPatterns = pattern.patterns.filter(p => p.timestamp >= cutoffDate);
    analysis.totalQueries += recentPatterns.length;
    
    // Query type distribution
    if (!analysis.queryDistribution[queryType]) {
      analysis.queryDistribution[queryType] = 0;
    }
    analysis.queryDistribution[queryType] += recentPatterns.length;
    
    // Urgency distribution
    analysis.urgencyDistribution[urgency] += recentPatterns.length;
    
    // Calculate average response time for this pattern
    const avgResponseTime = recentPatterns.reduce((sum, p) => sum + p.responseTime, 0) / recentPatterns.length;
    
    if (avgResponseTime > 1000) { // Slow response times
      analysis.recommendations.push(`Optimize ${queryType} processing - average response time: ${Math.round(avgResponseTime)}ms`);
    }
  }
  
  // Identify trends
  if (analysis.urgencyDistribution.emergency > analysis.totalQueries * 0.1) {
    analysis.trends.push("High emergency query volume - review triage sensitivity");
  }
  
  if (analysis.urgencyDistribution.non_urgent > analysis.totalQueries * 0.7) {
    analysis.trends.push("Majority non-urgent queries - opportunity for self-service features");
  }
  
  // Most common query types
  const sortedQueries = Object.entries(analysis.queryDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  analysis.trends.push(`Top query types: ${sortedQueries.map(([type, count]) => `${type}(${count})`).join(', ')}`);
  
  return analysis;
}

/**
 * Generate feedback insights and system learning recommendations
 * @returns {object} Feedback analysis and learning insights
 */
export function generateFeedbackInsights() {
  const insights = {
    totalFeedback: feedbackCollection.length,
    avgSatisfaction: 0,
    satisfactionByType: {},
    commonImprovements: {},
    learningMetrics: {},
    recommendations: []
  };
  
  if (feedbackCollection.length === 0) {
    return { ...insights, recommendations: ["Insufficient feedback data for analysis"] };
  }
  
  // Calculate overall satisfaction
  const totalSatisfaction = feedbackCollection.reduce((sum, f) => sum + f.userFeedback, 0);
  insights.avgSatisfaction = Math.round((totalSatisfaction / feedbackCollection.length) * 10) / 10;
  
  // Satisfaction by query type
  const satisfactionByType = {};
  const countByType = {};
  
  for (const feedback of feedbackCollection) {
    if (!satisfactionByType[feedback.queryType]) {
      satisfactionByType[feedback.queryType] = 0;
      countByType[feedback.queryType] = 0;
    }
    satisfactionByType[feedback.queryType] += feedback.userFeedback;
    countByType[feedback.queryType]++;
  }
  
  for (const [queryType, totalSatisfaction] of Object.entries(satisfactionByType)) {
    insights.satisfactionByType[queryType] = Math.round((totalSatisfaction / countByType[queryType]) * 10) / 10;
  }
  
  // Common improvement suggestions
  for (const feedback of feedbackCollection) {
    for (const improvement of feedback.improvements) {
      if (!insights.commonImprovements[improvement]) {
        insights.commonImprovements[improvement] = 0;
      }
      insights.commonImprovements[improvement]++;
    }
  }
  
  // Convert learning metrics to insights format
  for (const [key, metrics] of learningMetrics.entries()) {
    insights.learningMetrics[key] = {
      userSatisfaction: Math.round(metrics.userSatisfaction * 10) / 10,
      accuracy: Math.round(metrics.accuracy * 10) / 10,
      avgResponseTime: Math.round(metrics.avgResponseTime),
      successRate: Math.round(metrics.successRate * 100),
      sampleCount: metrics.sampleCount
    };
  }
  
  // Generate recommendations based on insights
  if (insights.avgSatisfaction < 7) {
    insights.recommendations.push("Overall user satisfaction below target (7/10) - review system responses");
  }
  
  // Find worst performing query types
  for (const [queryType, satisfaction] of Object.entries(insights.satisfactionByType)) {
    if (satisfaction < 6) {
      insights.recommendations.push(`Low satisfaction for ${queryType} queries (${satisfaction}/10) - needs improvement`);
    }
  }
  
  // Top improvement suggestions
  const topImprovements = Object.entries(insights.commonImprovements)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  for (const [improvement, count] of topImprovements) {
    insights.recommendations.push(`Frequent suggestion (${count} times): ${improvement}`);
  }
  
  return insights;
}

/**
 * Track system error patterns for learning
 * @param {string} errorType - Type of error that occurred
 * @param {string} context - Context where error occurred
 * @param {string} userQuery - Original user query that caused error
 * @param {object} errorDetails - Detailed error information
 */
export function trackErrorPattern(errorType, context, userQuery, errorDetails = {}) {
  const errorKey = `${errorType}_${context}`;
  
  if (!usagePatterns.has(`error_${errorKey}`)) {
    usagePatterns.set(`error_${errorKey}`, {
      count: 0,
      lastUsed: new Date(),
      patterns: [],
      outcomes: []
    });
  }
  
  const errorPattern = usagePatterns.get(`error_${errorKey}`);
  errorPattern.count++;
  errorPattern.lastUsed = new Date();
  
  errorPattern.patterns.push({
    userQuery,
    errorDetails,
    timestamp: new Date()
  });
  
  // Keep only recent 25 error patterns per type
  if (errorPattern.patterns.length > 25) {
    errorPattern.patterns = errorPattern.patterns.slice(-25);
  }
  
  console.warn(`[Error Tracking] Recorded error: ${errorKey}, Total: ${errorPattern.count}`);
}

/**
 * Get usage analytics dashboard data
 * @returns {object} Complete analytics dashboard data
 */
export function getUsageAnalyticsDashboard() {
  const dashboard = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPatterns: usagePatterns.size,
      totalFeedback: feedbackCollection.length,
      avgSatisfaction: 0
    },
    usage: analyzeUsagePatterns(7),
    feedback: generateFeedbackInsights(),
    errors: getErrorAnalysis(),
    performance: getLearningMetricsOverview()
  };
  
  // Calculate average satisfaction if feedback exists
  if (feedbackCollection.length > 0) {
    const totalSatisfaction = feedbackCollection.reduce((sum, f) => sum + f.userFeedback, 0);
    dashboard.summary.avgSatisfaction = Math.round((totalSatisfaction / feedbackCollection.length) * 10) / 10;
  }
  
  return dashboard;
}

/**
 * Get error analysis from tracked error patterns
 * @returns {object} Error analysis results
 */
function getErrorAnalysis() {
  const errorAnalysis = {
    totalErrors: 0,
    errorsByType: {},
    recentErrors: [],
    recommendations: []
  };
  
  // Analyze error patterns
  for (const [patternKey, pattern] of usagePatterns.entries()) {
    if (!patternKey.startsWith('error_')) continue;
    
    const errorType = patternKey.replace('error_', '');
    errorAnalysis.totalErrors += pattern.count;
    
    if (!errorAnalysis.errorsByType[errorType]) {
      errorAnalysis.errorsByType[errorType] = 0;
    }
    errorAnalysis.errorsByType[errorType] += pattern.count;
    
    // Get recent errors (last 7 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    const recentErrorPatterns = pattern.patterns.filter(p => p.timestamp >= cutoffDate);
    errorAnalysis.recentErrors.push(...recentErrorPatterns.map(p => ({
      type: errorType,
      query: p.userQuery,
      timestamp: p.timestamp
    })));
  }
  
  // Sort recent errors by timestamp
  errorAnalysis.recentErrors.sort((a, b) => b.timestamp - a.timestamp);
  errorAnalysis.recentErrors = errorAnalysis.recentErrors.slice(0, 10); // Keep only 10 most recent
  
  // Generate error-based recommendations
  const sortedErrors = Object.entries(errorAnalysis.errorsByType)
    .sort(([,a], [,b]) => b - a);
  
  for (const [errorType, count] of sortedErrors.slice(0, 3)) {
    errorAnalysis.recommendations.push(`Address frequent error: ${errorType} (${count} occurrences)`);
  }
  
  return errorAnalysis;
}

/**
 * Get overview of learning metrics
 * @returns {object} Learning metrics summary
 */
function getLearningMetricsOverview() {
  const overview = {
    totalMetrics: learningMetrics.size,
    topPerformers: [],
    needsImprovement: [],
    avgMetrics: {
      userSatisfaction: 0,
      accuracy: 0,
      successRate: 0
    }
  };
  
  if (learningMetrics.size === 0) {
    return overview;
  }
  
  let totalSatisfaction = 0, totalAccuracy = 0, totalSuccessRate = 0, count = 0;
  
  for (const [key, metrics] of learningMetrics.entries()) {
    totalSatisfaction += metrics.userSatisfaction;
    totalAccuracy += metrics.accuracy;
    totalSuccessRate += metrics.successRate;
    count++;
    
    // Identify top performers (satisfaction >= 8)
    if (metrics.userSatisfaction >= 8) {
      overview.topPerformers.push({ type: key, satisfaction: metrics.userSatisfaction });
    }
    
    // Identify areas needing improvement (satisfaction < 6)
    if (metrics.userSatisfaction < 6) {
      overview.needsImprovement.push({ type: key, satisfaction: metrics.userSatisfaction });
    }
  }
  
  // Calculate averages
  overview.avgMetrics = {
    userSatisfaction: Math.round((totalSatisfaction / count) * 10) / 10,
    accuracy: Math.round((totalAccuracy / count) * 10) / 10,
    successRate: Math.round((totalSuccessRate / count) * 100) / 100
  };
  
  return overview;
}

/**
 * Export usage data for external analysis (anonymized)
 * @param {string} format - Export format ('json' | 'csv')
 * @returns {string} Exported data
 */
export function exportUsageData(format = 'json') {
  const exportData = {
    timestamp: new Date().toISOString(),
    patterns: [],
    feedback: [],
    learningMetrics: Object.fromEntries(learningMetrics)
  };
  
  // Anonymize and export usage patterns
  for (const [patternKey, pattern] of usagePatterns.entries()) {
    exportData.patterns.push({
      type: patternKey,
      count: pattern.count,
      avgResponseTime: pattern.patterns.reduce((sum, p) => sum + p.responseTime, 0) / pattern.patterns.length || 0,
      recentUsage: pattern.lastUsed
    });
  }
  
  // Anonymize and export feedback (remove session IDs)
  for (const feedback of feedbackCollection) {
    exportData.feedback.push({
      queryType: feedback.queryType,
      urgency: feedback.urgency,
      rating: feedback.userFeedback,
      improvements: feedback.improvements,
      timestamp: feedback.timestamp
    });
  }
  
  if (format === 'json') {
    return JSON.stringify(exportData, null, 2);
  }
  
  // CSV format would require more complex conversion
  return JSON.stringify(exportData, null, 2);
}

/**
 * Reset analytics data (for testing or privacy compliance)
 * @param {boolean} includePatterns - Whether to reset usage patterns
 * @param {boolean} includeFeedback - Whether to reset feedback data
 * @param {boolean} includeLearning - Whether to reset learning metrics
 */
export function resetAnalyticsData(includePatterns = true, includeFeedback = true, includeLearning = true) {
  if (includePatterns) {
    usagePatterns.clear();
    console.log('[Analytics] Usage patterns reset');
  }
  
  if (includeFeedback) {
    feedbackCollection.splice(0, feedbackCollection.length);
    console.log('[Analytics] Feedback collection reset');
  }
  
  if (includeLearning) {
    learningMetrics.clear();
    console.log('[Analytics] Learning metrics reset');
  }
}