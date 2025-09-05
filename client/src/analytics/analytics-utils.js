/**
 * Analytics Utilities for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: All analysis functions operate on anonymized data only.
 * Pattern detection focuses on system improvement without exposing user information.
 * 
 * @file Pattern analysis helpers and query categorization utilities
 */

import { QueryCategory } from './enums.js';

/**
 * Detects outlier patterns in query structures that may indicate issues
 * @param {object} queryResult - Query result to analyze for outliers
 * @returns {object} Outlier detection result with flags and scores
 */
export function detectOutliers(queryResult) {
  const outliers = {
    flags: [],
    score: 0, // 0 = normal, 1 = major outlier
    details: {}
  };

  try {
    // Check processing time outliers
    const processingTime = queryResult.metadata?.processingTime || 0;
    if (processingTime > 5000) {
      outliers.flags.push('excessive_processing_time');
      outliers.score += 0.3;
      outliers.details.processingTime = processingTime;
    } else if (processingTime < 1) {
      outliers.flags.push('suspiciously_fast_processing');
      outliers.score += 0.2;
    }

    // Check confidence score outliers
    const confidence = queryResult.metadata?.intentConfidence || 0;
    if (confidence < 0.1) {
      outliers.flags.push('extremely_low_confidence');
      outliers.score += 0.4;
      outliers.details.confidence = confidence;
    } else if (confidence > 0.99) {
      outliers.flags.push('suspiciously_high_confidence');
      outliers.score += 0.2;
    }

    // Check input length outliers
    const inputLength = queryResult.userInput ? queryResult.userInput.length : 0;
    if (inputLength > 1000) {
      outliers.flags.push('excessively_long_input');
      outliers.score += 0.2;
      outliers.details.inputLength = inputLength;
    } else if (inputLength < 3) {
      outliers.flags.push('extremely_short_input');
      outliers.score += 0.3;
    }

    // Check response enhancement ratio
    const promptLength = queryResult.enhancedPrompt ? queryResult.enhancedPrompt.length : 0;
    const enhancementRatio = inputLength > 0 ? promptLength / inputLength : 0;
    
    if (enhancementRatio > 20) {
      outliers.flags.push('excessive_prompt_enhancement');
      outliers.score += 0.2;
      outliers.details.enhancementRatio = enhancementRatio;
    } else if (enhancementRatio < 1.5 && inputLength > 10) {
      outliers.flags.push('insufficient_prompt_enhancement');
      outliers.score += 0.1;
    }

    // Check triage consistency
    if (queryResult.isHighRisk && queryResult.triageLevel === 'non_urgent') {
      outliers.flags.push('inconsistent_risk_triage');
      outliers.score += 0.3;
    }

    // Check missing critical data
    if (!queryResult.metadata?.bodySystem || queryResult.metadata.bodySystem === 'unknown') {
      outliers.flags.push('missing_body_system_detection');
      outliers.score += 0.1;
    }

    // Cap score at 1.0
    outliers.score = Math.min(1.0, outliers.score);

  } catch {
    outliers.flags.push('analysis_error');
    outliers.score = 0.5;
    outliers.details.error = 'Analysis failed';
  }

  return outliers;
}

/**
 * Categorizes queries based on content analysis and keyword detection
 * @param {string} userInput - User input text to categorize
 * @param {object} context - Additional context for categorization
 * @param {string} context.triageLevel - Triage level classification
 * @param {boolean} context.isHighRisk - High risk flag
 * @returns {string} Inferred query category
 */
export function tagQueryCategory(userInput, context = { triageLevel: 'unknown', isHighRisk: false }) {
  if (!userInput || typeof userInput !== 'string') {
    return QueryCategory.UNCLEAR;
  }

  const lowerInput = userInput.toLowerCase();

  // Crisis category - emergency situations
  const crisisKeywords = [
    'emergency', 'crisis', 'suicide', 'kill myself', 'end my life',
    'overdose', 'chest pain', 'can\'t breathe', 'unconscious',
    'severe bleeding', 'heart attack', 'stroke'
  ];

  if (crisisKeywords.some(keyword => lowerInput.includes(keyword)) ||
      context.triageLevel === 'emergency') {
    return "crisis";
  }

  // Symptom-focused category
  const symptomKeywords = [
    'pain', 'ache', 'hurt', 'fever', 'headache', 'nausea', 'vomiting',
    'dizziness', 'fatigue', 'rash', 'swelling', 'bleeding', 'cough',
    'shortness', 'difficulty', 'symptom', 'feel', 'experiencing'
  ];

  const symptomCount = symptomKeywords.filter(keyword => 
    lowerInput.includes(keyword)
  ).length;

  if (symptomCount >= 2 || (symptomCount >= 1 && context.isHighRisk)) {
    return "symptom_focused";
  }

  // Prevention category
  const preventionKeywords = [
    'prevent', 'avoid', 'reduce risk', 'healthy', 'wellness', 'diet',
    'exercise', 'lifestyle', 'screening', 'vaccine', 'immunization',
    'how to', 'what should', 'best practices'
  ];

  if (preventionKeywords.some(keyword => lowerInput.includes(keyword))) {
    return "preventive";
  }

  // Informational category
  const infoKeywords = [
    'what is', 'what are', 'tell me about', 'explain', 'information',
    'learn', 'understand', 'definition', 'cause', 'treatment',
    'medication', 'condition', 'disease', 'disorder'
  ];

  if (infoKeywords.some(keyword => lowerInput.includes(keyword))) {
    return "informational";
  }

  // Default to unclear if no clear category
  return "unclear";
}

/**
 * Analyzes input to detect if symptoms are mentioned and flags missing symptom data
 * @param {string} userInput - User input to analyze
 * @param {object} extractedData - Extracted symptom data from intent parser
 * @returns {object} Analysis result with missing symptom flags
 */
export function flagMissingSymptoms(userInput, extractedData = {}) {
  const analysis = {
    hasPotentialSymptoms: false,
    missingSymptomData: [],
    suggestions: [],
    confidence: 0
  };

  if (!userInput || typeof userInput !== 'string') {
    return analysis;
  }

  const lowerInput = userInput.toLowerCase();

  // Detect potential symptom mentions
  const symptomIndicators = [
    'pain', 'ache', 'hurt', 'sore', 'tender',
    'fever', 'temperature', 'hot', 'chills',
    'nausea', 'sick', 'vomit', 'throw up',
    'tired', 'fatigue', 'exhausted', 'weak',
    'dizzy', 'lightheaded', 'faint',
    'headache', 'migraine', 'head',
    'cough', 'congestion', 'runny nose',
    'rash', 'itchy', 'red', 'swollen',
    'bleeding', 'blood', 'bruise'
  ];

  const detectedIndicators = symptomIndicators.filter(indicator => 
    lowerInput.includes(indicator)
  );

  analysis.hasPotentialSymptoms = detectedIndicators.length > 0;
  analysis.confidence = Math.min(1.0, detectedIndicators.length * 0.2);

  if (analysis.hasPotentialSymptoms) {
    // Check for missing duration information
    const durationKeywords = ['for', 'since', 'ago', 'started', 'began', 'days', 'hours', 'weeks'];
    const hasDuration = durationKeywords.some(keyword => lowerInput.includes(keyword));
    
    if (!hasDuration && !extractedData.duration) {
      analysis.missingSymptomData.push('duration');
      analysis.suggestions.push('Consider asking about symptom duration');
    }

    // Check for missing severity information
    const severityKeywords = ['mild', 'moderate', 'severe', 'intense', 'sharp', 'dull', 'throbbing'];
    const hasSeverity = severityKeywords.some(keyword => lowerInput.includes(keyword));
    
    if (!hasSeverity && !extractedData.severity) {
      analysis.missingSymptomData.push('severity');
      analysis.suggestions.push('Consider asking about symptom severity');
    }

    // Check for missing location information for pain-related symptoms
    if (detectedIndicators.some(indicator => ['pain', 'ache', 'hurt', 'sore'].includes(indicator))) {
      const locationKeywords = ['head', 'chest', 'back', 'stomach', 'leg', 'arm', 'neck'];
      const hasLocation = locationKeywords.some(keyword => lowerInput.includes(keyword));
      
      if (!hasLocation && !extractedData.location) {
        analysis.missingSymptomData.push('location');
        analysis.suggestions.push('Consider asking about pain location');
      }
    }

    // Check for missing associated symptoms
    if (detectedIndicators.length === 1) {
      analysis.missingSymptomData.push('associated_symptoms');
      analysis.suggestions.push('Consider asking about other associated symptoms');
    }
  }

  return analysis;
}

/**
 * Calculates query complexity score based on multiple factors
 * @param {object} queryResult - Complete query result to analyze
 * @returns {object} Complexity analysis with score and breakdown
 */
export function calculateQueryComplexity(queryResult) {
  const complexity = {
    score: 0, // 0 = simple, 1 = very complex
    factors: {},
    level: 'simple' // simple, moderate, complex, very_complex
  };

  try {
    let totalScore = 0;

    // Input length complexity (20% weight)
    const inputLength = queryResult.userInput ? queryResult.userInput.length : 0;
    const lengthScore = Math.min(1.0, inputLength / 500);
    complexity.factors.inputLength = lengthScore;
    totalScore += lengthScore * 0.2;

    // Medical terminology density (25% weight)
    const medicalTerms = countMedicalTerms(queryResult.userInput || '');
    const termDensity = inputLength > 0 ? medicalTerms / (inputLength / 100) : 0;
    const terminologyScore = Math.min(1.0, termDensity);
    complexity.factors.terminology = terminologyScore;
    totalScore += terminologyScore * 0.25;

    // Symptom count complexity (20% weight)
    const symptomCount = countSymptoms(queryResult.userInput || '');
    const symptomScore = Math.min(1.0, symptomCount / 5);
    complexity.factors.symptoms = symptomScore;
    totalScore += symptomScore * 0.2;

    // Processing complexity (20% weight)
    const processingTime = queryResult.metadata?.processingTime || 0;
    const processingScore = Math.min(1.0, processingTime / 2000);
    complexity.factors.processing = processingScore;
    totalScore += processingScore * 0.2;

    // Risk level complexity (15% weight)
    const riskScore = queryResult.isHighRisk ? 0.8 : 0.2;
    complexity.factors.risk = riskScore;
    totalScore += riskScore * 0.15;

    complexity.score = totalScore;

    // Determine complexity level
    if (complexity.score < 0.3) {
      complexity.level = 'simple';
    } else if (complexity.score < 0.6) {
      complexity.level = 'moderate';
    } else if (complexity.score < 0.8) {
      complexity.level = 'complex';
    } else {
      complexity.level = 'very_complex';
    }

  } catch {
    complexity.score = 0.5;
    complexity.level = 'moderate';
    // Error in complexity calculation
  }

  return complexity;
}

/**
 * Counts medical terminology in text
 * @private
 * @param {string} text - Text to analyze
 * @returns {number} Count of medical terms
 */
function countMedicalTerms(text) {
  const medicalTerms = [
    'symptom', 'diagnosis', 'treatment', 'medication', 'disease', 'condition',
    'infection', 'inflammation', 'chronic', 'acute', 'syndrome', 'disorder',
    'therapy', 'prescription', 'dosage', 'side effect', 'allergy', 'immune',
    'cardiovascular', 'respiratory', 'neurological', 'gastrointestinal'
  ];

  const lowerText = text.toLowerCase();
  return medicalTerms.filter(term => lowerText.includes(term)).length;
}

/**
 * Counts potential symptoms mentioned in text
 * @private
 * @param {string} text - Text to analyze
 * @returns {number} Count of potential symptoms
 */
function countSymptoms(text) {
  const symptoms = [
    'pain', 'ache', 'fever', 'nausea', 'fatigue', 'headache', 'dizziness',
    'cough', 'rash', 'swelling', 'bleeding', 'vomiting', 'diarrhea',
    'constipation', 'insomnia', 'anxiety', 'depression', 'shortness'
  ];

  const lowerText = text.toLowerCase();
  return symptoms.filter(symptom => lowerText.includes(symptom)).length;
}

/**
 * Analyzes query patterns for trend detection
 * @param {Array<object>} queryHistory - Array of recent query results
 * @returns {object} Pattern analysis with trends and insights
 */
export function analyzeQueryPatterns(queryHistory) {
  const patterns = {
    trends: {},
    insights: [],
    recommendations: []
  };

  if (!Array.isArray(queryHistory) || queryHistory.length === 0) {
    return patterns;
  }

  try {
    // Analyze processing time trends
    const processingTimes = queryHistory.map(q => q.metadata?.processingTime || 0);
    const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    patterns.trends.avgProcessingTime = avgProcessingTime;

    if (avgProcessingTime > 1000) {
      patterns.insights.push('Processing times are above optimal threshold');
      patterns.recommendations.push('Consider performance optimization');
    }

    // Analyze confidence trends
    const confidenceScores = queryHistory.map(q => q.metadata?.intentConfidence || 0);
    const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
    patterns.trends.avgConfidence = avgConfidence;

    if (avgConfidence < 0.6) {
      patterns.insights.push('Intent confidence is below recommended threshold');
      patterns.recommendations.push('Review intent parsing algorithms');
    }

    // Analyze triage distribution
    const triageLevels = queryHistory.map(q => q.triageLevel);
    const triageDistribution = triageLevels.reduce((acc, level) => {
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
    
    patterns.trends.triageDistribution = triageDistribution;

    // Analyze query categories
    const categories = queryHistory.map(q => 
      tagQueryCategory(q.userInput, { 
        triageLevel: q.triageLevel, 
        isHighRisk: q.isHighRisk 
      })
    );
    
    const categoryDistribution = categories.reduce((acc, category) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    patterns.trends.categoryDistribution = categoryDistribution;

  } catch {
    patterns.insights.push('Error analyzing query patterns');
    patterns.recommendations.push('Review pattern analysis implementation');
  }

  return patterns;
}