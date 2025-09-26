/**
 * Feedback API client for machine learning system
 */

/**
 * Submit feedback for AI response
 * @param {object} feedbackData - Feedback data
 * @param {string} feedbackData.messageId - Message ID
 * @param {string} feedbackData.sessionId - Session ID
 * @param {string} feedbackData.feedbackType - 'helpful' or 'could_improve'
 * @param {string} feedbackData.userQuery - Original user question
 * @param {string} feedbackData.aiResponse - AI's response
 * @param {string} feedbackData.userRole - User role (healthcare_professional or general_public)
 * @param {object} feedbackData.responseMetadata - Response metadata
 * @returns {Promise<object>} API response
 */
export async function submitFeedback(feedbackData) {
  try {
    console.debug(`[Feedback-API] Submitting ${feedbackData.feedbackType} feedback for message ${feedbackData.messageId}`);
    
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit feedback');
    }

    console.debug(`[Feedback-API] Feedback submitted successfully:`, result);
    return result;
  } catch (error) {
    console.error('[Feedback-API] Failed to submit feedback:', error);
    throw error;
  }
}

/**
 * Get ML insights and patterns
 * @returns {Promise<object>} ML insights data
 */
export async function getMLInsights() {
  try {
    const response = await fetch('/api/feedback/ml-insights');
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to get ML insights');
    }

    return result.insights;
  } catch (error) {
    console.error('[Feedback-API] Failed to get ML insights:', error);
    throw error;
  }
}

