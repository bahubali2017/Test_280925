/**
 * Version Tracker for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: Version tracking logs system changes and updates without
 * storing any user data or personal health information.
 * 
 * @file Tracks medical logic changes and maintains changelog for audit trail
 */

/**
 * Change log entry structure
 * @typedef {object} ChangeLogEntry
 * @property {string} version - Version identifier
 * @property {string} author - Author of the change
 * @property {"prompt_update"|"triage_logic"|"safety_protocol"|"feature_addition"|"bug_fix"|"performance"} changeType - Type of change
 * @property {string} reason - Reason for the change
 * @property {string} date - ISO timestamp
 * @property {"low"|"medium"|"high"|"critical"} impact - Impact level
 * @property {string[]} affectedComponents - Components affected by change
 * @property {string|null} [rollbackPlan] - Plan for rolling back if needed
 * @property {string|null} [testingNotes] - Testing and validation notes
 * @property {string} [logId] - Unique log identifier
 * @property {string} [environment] - Environment where logged
 * @property {AuditInfo} [audit] - Audit information
 */

/**
 * @typedef {object} AuditInfo
 * @property {string} loggedBy - System that logged the change
 * @property {string} loggedAt - When the change was logged
 * @property {string} changeHash - Hash for integrity verification
 */

/**
 * @typedef {object} ChangeInput
 * @property {string} version - Version identifier
 * @property {string} author - Author of the change
 * @property {string} changeType - Type of change from ChangeType enum
 * @property {string} reason - Reason for the change
 * @property {string} [impact] - Impact level (default: 'medium')
 * @property {string[]} [affectedComponents] - Components affected
 * @property {string} [rollbackPlan] - Plan for rolling back if needed
 * @property {string} [testingNotes] - Testing and validation notes
 */

/**
 * @typedef {object} TimeRange
 * @property {string} startDate - Start date ISO string
 * @property {string} endDate - End date ISO string
 * @property {number} days - Number of days in range
 */

/**
 * @typedef {object} TrendAnalysis
 * @property {Record<string, number>} dailyChanges - Changes per day
 * @property {boolean} frequencyIncrease - Whether frequency is increasing
 * @property {string|null} mostActiveWeek - Most active week
 * @property {number} changeVelocity - Changes per day
 * @property {string} [mostActiveDay] - Most active day
 */

/**
 * @typedef {object} ChangeAnalytics
 * @property {number} totalChanges - Total number of changes
 * @property {TimeRange} timeRange - Time range analyzed
 * @property {Record<string, number>} changeTypes - Changes by type
 * @property {Record<string, number>} impactLevels - Changes by impact
 * @property {Record<string, number>} authors - Changes by author
 * @property {Record<string, number>} components - Changes by component
 * @property {TrendAnalysis} trends - Trend analysis
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {object} ValidationResult
 * @property {boolean} isValid - Whether data is valid
 * @property {string[]} errors - List of validation errors
 */

/**
 * @typedef {object} ImpactAssessment
 * @property {string} suggestedImpact - Suggested impact level
 * @property {string[]} riskFactors - List of risk factors
 * @property {boolean} requiresExtensiveTesting - Whether extensive testing needed
 * @property {boolean} requiresGradualRollout - Whether gradual rollout needed
 */

/**
 * @typedef {object} ReportPeriod
 * @property {number} days - Number of days in period
 * @property {string} startDate - Start date ISO string
 * @property {string} endDate - End date ISO string
 */

/**
 * @typedef {object} ReportSummary
 * @property {number} totalChanges - Total changes in period
 * @property {number} changeVelocity - Change velocity
 * @property {string} [mostActiveDay] - Most active day
 */

/**
 * @typedef {object} ReportBreakdown
 * @property {Record<string, number>} byType - Changes by type
 * @property {Record<string, number>} byImpact - Changes by impact
 * @property {Record<string, number>} byAuthor - Changes by author
 */

/**
 * @typedef {object} ChangeReport
 * @property {string} reportId - Unique report identifier
 * @property {string} timestamp - Report generation timestamp
 * @property {ReportPeriod} period - Report period details
 * @property {ReportSummary} summary - Summary statistics
 * @property {ReportBreakdown} breakdown - Detailed breakdown
 * @property {ChangeLogEntry[]} notableChanges - Notable changes in period
 * @property {string[]} recommendations - Generated recommendations
 * @property {string} [error] - Error message if failed
 */

/**
 * Change types for categorization
 * @readonly
 * @type {Record<string, string>}
 */
export const ChangeType = {
  PROMPT_UPDATE: 'prompt_update',
  TRIAGE_LOGIC: 'triage_logic', 
  SAFETY_PROTOCOL: 'safety_protocol',
  FEATURE_ADDITION: 'feature_addition',
  BUG_FIX: 'bug_fix',
  PERFORMANCE: 'performance'
};

/**
 * Impact levels for change assessment
 * @readonly
 * @type {Record<string, string>}
 */
export const ImpactLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Path to change log file
 * @private
 * @type {string}
 */
const CHANGELOG_PATH = 'client/src/training-dataset/layer-change-log.jsonl';

/**
 * Logs a change to the medical logic system
 * @param {ChangeInput} changeData - Change information
 * @returns {Promise<boolean>} Success status of logging operation
 */
export async function logSystemChange(changeData) {
  try {
    // Validate required fields
    if (!changeData || typeof changeData !== 'object') {
      console.warn('[version-tracker] Invalid change data provided');
      return false;
    }
    
    const requiredFields = ['version', 'author', 'changeType', 'reason'];
    for (const field of requiredFields) {
      const fieldValue = /** @type {any} */ (changeData)[field];
      if (!fieldValue) {
        console.warn(`[version-tracker] Missing required field: ${field}`);
        return false;
      }
    }
    
    // Create change log entry
    /** @type {ChangeLogEntry} */
    const changeEntry = {
      // Core change information
      version: changeData.version,
      author: changeData.author,
      changeType: /** @type {ChangeLogEntry['changeType']} */ (changeData.changeType),
      reason: changeData.reason,
      date: new Date().toISOString(),
      
      // Impact and scope
      impact: /** @type {ChangeLogEntry['impact']} */ (changeData.impact || ImpactLevel.MEDIUM),
      affectedComponents: changeData.affectedComponents || [],
      
      // Additional metadata
      rollbackPlan: changeData.rollbackPlan || null,
      testingNotes: changeData.testingNotes || null,
      
      // System metadata
      logId: generateLogId(),
      environment: process.env.NODE_ENV || 'development',
      
      // Audit information
      audit: {
        loggedBy: 'version-tracker',
        loggedAt: new Date().toISOString(),
        changeHash: generateChangeHash(changeData)
      }
    };
    
    // Append to change log
    await appendToChangeLog(changeEntry);
    
    console.info('[version-tracker] Change logged successfully:', changeEntry.logId);
    return true;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[version-tracker] Failed to log system change:', errorMessage);
    return false;
  }
}

/**
 * Appends change entry to the JSONL change log file
 * @private
 * @param {ChangeLogEntry} changeEntry - Change entry to log
 * @returns {Promise<void>}
 */
async function appendToChangeLog(changeEntry) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Ensure directory exists
    const dir = path.dirname(CHANGELOG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Convert to JSONL format
    const jsonlLine = JSON.stringify(changeEntry) + '\n';
    
    // Append to change log file
    fs.appendFileSync(CHANGELOG_PATH, jsonlLine, 'utf8');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[version-tracker] Failed to write to change log:', errorMessage);
    throw error;
  }
}

/**
 * Loads recent change log entries
 * @param {number} [limit=50] - Maximum number of entries to load
 * @returns {Promise<ChangeLogEntry[]>} Recent change log entries
 */
export async function loadChangeHistory(limit = 50) {
  try {
    const fs = await import('fs');
    
    if (!fs.existsSync(CHANGELOG_PATH)) {
      return [];
    }
    
    const content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Get most recent entries
    const recentLines = lines.slice(-limit);
    
    /** @type {ChangeLogEntry[]} */
    const entries = [];
    
    for (const line of recentLines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed && typeof parsed === 'object') {
          entries.push(/** @type {ChangeLogEntry} */ (parsed));
        }
      } catch {
        // Skip invalid lines
      }
    }
    
    return entries;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[version-tracker] Failed to load change history:', errorMessage);
    return [];
  }
}

/**
 * Gets change statistics and analytics
 * @param {number} [days=30] - Number of days to analyze
 * @returns {Promise<ChangeAnalytics>} Change analytics
 */
export async function getChangeAnalytics(days = 30) {
  try {
    const changeHistory = await loadChangeHistory(days * 10); // Approximate daily volume
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Filter to specified time period
    const recentChanges = changeHistory.filter(change => 
      new Date(change.date) >= cutoffDate
    );
    
    // Analyze change patterns
    /** @type {ChangeAnalytics} */
    const analytics = {
      totalChanges: recentChanges.length,
      timeRange: {
        startDate: cutoffDate.toISOString(),
        endDate: new Date().toISOString(),
        days
      },
      changeTypes: {},
      impactLevels: {},
      authors: {},
      components: {},
      trends: calculateChangeTrends(recentChanges)
    };
    
    // Group by change type
    for (const change of recentChanges) {
      analytics.changeTypes[change.changeType] = (analytics.changeTypes[change.changeType] || 0) + 1;
      analytics.impactLevels[change.impact] = (analytics.impactLevels[change.impact] || 0) + 1;
      analytics.authors[change.author] = (analytics.authors[change.author] || 0) + 1;
      
      // Track affected components
      for (const component of change.affectedComponents) {
        analytics.components[component] = (analytics.components[component] || 0) + 1;
      }
    }
    
    return analytics;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[version-tracker] Failed to generate change analytics:', errorMessage);
    return {
      error: 'Failed to generate analytics',
      totalChanges: 0,
      timeRange: {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        days
      },
      changeTypes: {},
      impactLevels: {},
      authors: {},
      components: {},
      trends: {
        dailyChanges: {},
        frequencyIncrease: false,
        mostActiveWeek: null,
        changeVelocity: 0
      }
    };
  }
}

/**
 * Calculates change trends over time
 * @private
 * @param {ChangeLogEntry[]} changes - Change history
 * @returns {TrendAnalysis} Trend analysis
 */
function calculateChangeTrends(changes) {
  /** @type {TrendAnalysis} */
  const trends = {
    dailyChanges: {},
    frequencyIncrease: false,
    mostActiveWeek: null,
    changeVelocity: 0
  };
  
  // Group changes by day
  for (const change of changes) {
    const day = change.date.split('T')[0]; // YYYY-MM-DD
    trends.dailyChanges[day] = (trends.dailyChanges[day] || 0) + 1;
  }
  
  // Calculate change velocity (changes per day)
  const totalDays = Object.keys(trends.dailyChanges).length;
  trends.changeVelocity = totalDays > 0 ? changes.length / totalDays : 0;
  
  // Find most active period
  const dailyCounts = Object.values(trends.dailyChanges);
  if (dailyCounts.length > 0) {
    const maxChanges = Math.max(...dailyCounts);
    const mostActiveDay = Object.keys(trends.dailyChanges).find(
      day => trends.dailyChanges[day] === maxChanges
    );
    if (mostActiveDay) {
      trends.mostActiveDay = mostActiveDay;
    }
  }
  
  return trends;
}

/**
 * Validates a change log entry structure
 * @param {unknown} changeData - Change data to validate
 * @returns {ValidationResult} Validation result
 */
export function validateChangeData(changeData) {
  /** @type {string[]} */
  const errors = [];
  
  if (!changeData) {
    errors.push('Change data is required');
    return { isValid: false, errors };
  }
  
  if (typeof changeData !== 'object') {
    errors.push('Change data must be an object');
    return { isValid: false, errors };
  }
  
  const data = /** @type {Record<string, unknown>} */ (changeData);
  
  // Check required fields
  const requiredFields = ['version', 'author', 'changeType', 'reason'];
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  }
  
  // Validate change type
  if (data.changeType && !Object.values(ChangeType).includes(String(data.changeType))) {
    errors.push(`Invalid changeType. Must be one of: ${Object.values(ChangeType).join(', ')}`);
  }
  
  // Validate impact level
  if (data.impact && !Object.values(ImpactLevel).includes(String(data.impact))) {
    errors.push(`Invalid impact level. Must be one of: ${Object.values(ImpactLevel).join(', ')}`);
  }
  
  // Validate affected components (should be array)
  if (data.affectedComponents && !Array.isArray(data.affectedComponents)) {
    errors.push('affectedComponents must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generates a rollback plan template
 * @param {string} changeType - Type of change
 * @param {string[]} [affectedComponents] - Components that will be affected
 * @returns {string} Rollback plan template
 */
export function generateRollbackPlan(changeType, affectedComponents = []) {
  /** @type {Record<string, string>} */
  const plans = {
    [ChangeType.PROMPT_UPDATE]: 'Revert to previous prompt version in system configuration',
    [ChangeType.TRIAGE_LOGIC]: 'Restore previous triage decision tree and test with sample cases',
    [ChangeType.SAFETY_PROTOCOL]: 'CRITICAL: Immediate reversion required - restore previous safety logic',
    [ChangeType.FEATURE_ADDITION]: 'Disable new feature flags and remove new code paths',
    [ChangeType.BUG_FIX]: 'Revert fix and re-implement previous behavior if needed',
    [ChangeType.PERFORMANCE]: 'Restore previous algorithm implementation'
  };
  
  const basePlan = plans[changeType] || 'Create custom rollback plan for this change type';
  
  if (affectedComponents.length > 0) {
    return `${basePlan}\n\nAffected components to check:\n- ${affectedComponents.join('\n- ')}`;
  }
  
  return basePlan;
}

/**
 * Generates change impact assessment
 * @param {string} changeType - Type of change
 * @param {string[]} [affectedComponents] - Components affected
 * @returns {ImpactAssessment} Impact assessment
 */
export function assessChangeImpact(changeType, affectedComponents = []) {
  const highImpactTypes = [ChangeType.TRIAGE_LOGIC, ChangeType.SAFETY_PROTOCOL];
  const criticalComponents = ['triage', 'safety', 'emergency-detection'];
  
  let suggestedImpact = ImpactLevel.MEDIUM;
  /** @type {string[]} */
  const riskFactors = [];
  
  // Check change type risk
  if (highImpactTypes.includes(changeType)) {
    suggestedImpact = ImpactLevel.HIGH;
    riskFactors.push('High-impact change type affecting core medical logic');
  }
  
  // Check component risk
  const hasCriticalComponents = affectedComponents.some(component => 
    criticalComponents.some(critical => component.toLowerCase().includes(critical))
  );
  
  if (hasCriticalComponents) {
    suggestedImpact = ImpactLevel.CRITICAL;
    riskFactors.push('Changes affect critical medical safety components');
  }
  
  return {
    suggestedImpact,
    riskFactors,
    requiresExtensiveTesting: suggestedImpact === ImpactLevel.CRITICAL || suggestedImpact === ImpactLevel.HIGH,
    requiresGradualRollout: suggestedImpact === ImpactLevel.CRITICAL
  };
}

/**
 * Generates a unique log ID
 * @private
 * @returns {string} Unique log identifier
 */
function generateLogId() {
  return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a hash for change data integrity
 * @private
 * @param {ChangeInput} changeData - Change data to hash
 * @returns {string} Change hash
 */
function generateChangeHash(changeData) {
  const hashInput = JSON.stringify({
    version: changeData.version,
    changeType: changeData.changeType,
    reason: changeData.reason,
    timestamp: Date.now()
  });
  
  // Simple hash function (for development - use crypto in production)
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Creates a system change report
 * @param {number} [days=7] - Days to include in report
 * @returns {Promise<ChangeReport>} Change report
 */
export async function generateChangeReport(days = 7) {
  try {
    const analytics = await getChangeAnalytics(days);
    const recentChanges = await loadChangeHistory(days * 5);
    
    // Filter to specified time period
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const periodChanges = recentChanges.filter(change => 
      new Date(change.date) >= cutoffDate
    );
    
    // Identify notable changes
    const notableChanges = periodChanges.filter(change => 
      change.impact === ImpactLevel.HIGH || change.impact === ImpactLevel.CRITICAL
    );
    
    return {
      reportId: `change_report_${Date.now()}`,
      timestamp: new Date().toISOString(),
      period: {
        days,
        startDate: cutoffDate.toISOString(),
        endDate: new Date().toISOString()
      },
      summary: {
        totalChanges: analytics.totalChanges,
        changeVelocity: analytics.trends.changeVelocity,
        mostActiveDay: analytics.trends.mostActiveDay
      },
      breakdown: {
        byType: analytics.changeTypes,
        byImpact: analytics.impactLevels,
        byAuthor: analytics.authors
      },
      notableChanges: notableChanges.slice(0, 10),
      recommendations: generateChangeRecommendations(analytics)
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[version-tracker] Failed to generate change report:', errorMessage);
    return {
      reportId: `change_report_${Date.now()}`,
      timestamp: new Date().toISOString(),
      error: 'Failed to generate change report',
      period: {
        days,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString()
      },
      summary: {
        totalChanges: 0,
        changeVelocity: 0
      },
      breakdown: {
        byType: {},
        byImpact: {},
        byAuthor: {}
      },
      notableChanges: [],
      recommendations: []
    };
  }
}

/**
 * Generates recommendations based on change patterns
 * @private
 * @param {ChangeAnalytics} analytics - Change analytics
 * @returns {string[]} Recommendations
 */
function generateChangeRecommendations(analytics) {
  /** @type {string[]} */
  const recommendations = [];
  
  if (analytics.trends.changeVelocity > 2) {
    recommendations.push('High change velocity detected - consider stabilization period');
  }
  
  const criticalChanges = analytics.impactLevels[ImpactLevel.CRITICAL] || 0;
  if (criticalChanges > 1) {
    recommendations.push('Multiple critical changes - enhanced monitoring recommended');
  }
  
  const triageChanges = analytics.changeTypes[ChangeType.TRIAGE_LOGIC] || 0;
  if (triageChanges > 2) {
    recommendations.push('Frequent triage logic changes - review decision criteria stability');
  }
  
  if (analytics.totalChanges === 0) {
    recommendations.push('No recent changes logged - ensure proper change tracking');
  }
  
  return recommendations;
}