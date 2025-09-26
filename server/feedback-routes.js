import { Router } from 'express';
import { storage } from './storage.js';

/**
 * Creates feedback routes for the API
 * @returns {Router} Express router with feedback endpoints
 */
export function createFeedbackRoutes() {
  const feedbackRouter = Router();

  /**
   * Feedback endpoint for collecting user feedback on AI responses
   */
  feedbackRouter.post("/", async (req, res) => {
    try {
      const {
        messageId,
        sessionId,
        feedbackType, // 'helpful' or 'could_improve'
        userQuery,
        aiResponse,
        userRole,
        responseMetadata
      } = req.body;

      // Validate required fields
      if (!messageId || !sessionId || !feedbackType || !userQuery || !aiResponse) {
        return res.status(400).json({
          success: false,
          message: "Missing required feedback fields"
        });
      }

      const userId = req.user?.id || "anonymous";
      
      console.info(`[${sessionId}] Receiving feedback: ${feedbackType} for message ${messageId}`);

      // Store feedback using storage layer
      const savedFeedback = await storage.saveFeedback({
        messageId,
        sessionId,
        userId,
        feedbackType,
        userQuery,
        aiResponse,
        userRole: userRole || 'general_public',
        responseMetadata: responseMetadata || {}
      });

      console.log(`[Feedback] Saved feedback ${feedbackType} for session ${sessionId}:`, {
        id: savedFeedback.id,
        messageId,
        feedbackType,
        userRole: userRole || 'general_public',
        timestamp: savedFeedback.timestamp || new Date().toISOString()
      });

      // Trigger ML learning process
      await triggerMLLearning({
        feedbackType,
        userQuery,
        aiResponse,
        userRole: userRole || 'general_public',
        sessionId
      });

      res.json({
        success: true,
        message: "Feedback received and processed"
      });
    } catch (error) {
      console.error(`[Feedback] Processing error for session ${req.body.sessionId}:`, {
        error: error.message,
        stack: error.stack,
        messageId: req.body.messageId,
        feedbackType: req.body.feedbackType
      });
      res.status(500).json({
        success: false,
        message: "Failed to process feedback",
        error: error.message
      });
    }
  });

  /**
   * Get ML insights endpoint for analytics
   */
  feedbackRouter.get("/ml-insights", async (req, res) => {
    try {
      const { Pool } = await import('@neondatabase/serverless');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      // Get top performing patterns
      const topPatterns = await pool.query(`
        SELECT query_pattern, response_pattern, user_role, accuracy, 
               positive_count, negative_count,
               (positive_count + negative_count) as total_feedback
        FROM learning_patterns 
        WHERE is_active = true AND (positive_count + negative_count) >= 5
        ORDER BY accuracy DESC, total_feedback DESC
        LIMIT 20
      `);

      // Get feedback summary
      const feedbackSummary = await pool.query(`
        SELECT 
          user_role,
          feedback_type,
          COUNT(*) as count,
          DATE_TRUNC('day', timestamp) as date
        FROM feedback 
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY user_role, feedback_type, DATE_TRUNC('day', timestamp)
        ORDER BY date DESC
      `);

      res.json({
        success: true,
        insights: {
          topPatterns: topPatterns.rows,
          feedbackSummary: feedbackSummary.rows,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("ML insights error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get ML insights"
      });
    }
  });

  return feedbackRouter;
}


/**
 * Machine Learning Engine for Processing Feedback
 * @param root0
 * @param root0.feedbackType
 * @param root0.userQuery
 * @param root0.aiResponse
 * @param root0.userRole
 * @param root0._sessionId
 */
async function triggerMLLearning({ feedbackType, userQuery, aiResponse, userRole, _sessionId }) {
  try {
    console.log(`[ML-Engine] Processing ${feedbackType} feedback for role: ${userRole}`);
    
    // Analyze query patterns
    const queryPatterns = extractQueryPatterns(userQuery);
    const responsePatterns = extractResponsePatterns(aiResponse);
    
    console.log('[ML-Engine] Patterns extracted:', {
      queryPatterns: queryPatterns.slice(0, 3), // Log first 3 patterns
      responsePatterns: responsePatterns.slice(0, 3),
      userRole,
      feedbackType
    });
    
    // For now, simulate ML learning without database
    console.log(`[ML-Engine] Successfully processed ${feedbackType} feedback for ${userRole}`);
    
    // Create pool connection for ML operations
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    for (const queryPattern of queryPatterns) {
      for (const responsePattern of responsePatterns) {
        // Check if pattern exists
        const existingPattern = await pool.query(`
          SELECT * FROM learning_patterns 
          WHERE query_pattern = $1 AND response_pattern = $2 AND user_role = $3
        `, [queryPattern, responsePattern, userRole]);
          
        if (existingPattern.rows.length > 0) {
          // Update existing pattern
          const existing = existingPattern.rows[0];
          const positiveCount = feedbackType === 'helpful' ? existing.positive_count + 1 : existing.positive_count;
          const negativeCount = feedbackType === 'could_improve' ? existing.negative_count + 1 : existing.negative_count;
          const totalCount = positiveCount + negativeCount;
          const accuracy = Math.round((positiveCount / totalCount) * 100);
          
          await pool.query(`
            UPDATE learning_patterns 
            SET positive_count = $1, negative_count = $2, accuracy = $3, last_updated = NOW()
            WHERE id = $4
          `, [positiveCount, negativeCount, accuracy, existing.id]);
            
          // Pattern accuracy updated
        } else {
          // Create new pattern
          const positiveCount = feedbackType === 'helpful' ? 1 : 0;
          const negativeCount = feedbackType === 'could_improve' ? 1 : 0;
          const accuracy = feedbackType === 'helpful' ? 100 : 0;
          
          await pool.query(`
            INSERT INTO learning_patterns (query_pattern, response_pattern, user_role, positive_count, negative_count, accuracy)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [queryPattern, responsePattern, userRole, positiveCount, negativeCount, accuracy]);
          
          // New learning pattern created
        }
      }
    }
  } catch (error) {
    console.error('[ML-Engine] Learning process failed:', error);
  }
}

/**
 * Extract meaningful patterns from user queries for ML learning
 * @param query
 * @returns {string[]} Array of extracted query patterns
 */
function extractQueryPatterns(query) {
  const patterns = [];
  const queryLower = query.toLowerCase();
  
  // Medical condition patterns
  const medicalTerms = ['treatment', 'protocol', 'symptoms', 'diagnosis', 'medication', 'therapy', 'procedure'];
  medicalTerms.forEach(term => {
    if (queryLower.includes(term)) {
      patterns.push(`medical_${term}`);
    }
  });
  
  // Question type patterns
  if (queryLower.startsWith('what is')) patterns.push('definition_query');
  if (queryLower.startsWith('how to')) patterns.push('instruction_query');
  if (queryLower.includes('protocol')) patterns.push('protocol_query');
  if (queryLower.includes('treatment')) patterns.push('treatment_query');
  if (queryLower.includes('symptoms')) patterns.push('symptom_query');
  
  // Complexity patterns
  if (query.length < 50) patterns.push('short_query');
  else if (query.length > 200) patterns.push('long_query');
  else patterns.push('medium_query');
  
  // Urgency patterns
  if (queryLower.includes('emergency') || queryLower.includes('urgent')) patterns.push('urgent_query');
  if (queryLower.includes('chronic') || queryLower.includes('ongoing')) patterns.push('chronic_query');
  
  return patterns.length > 0 ? patterns : ['general_query'];
}

/**
 * Extract meaningful patterns from AI responses for ML learning
 * @param response
 * @returns {string[]} Array of extracted response patterns
 */
function extractResponsePatterns(response) {
  const patterns = [];
  const responseLower = response.toLowerCase();
  
  // Response structure patterns
  if (responseLower.includes('brief answer:')) patterns.push('structured_response');
  if (responseLower.includes('key points:')) patterns.push('key_points_included');
  if (responseLower.includes('when to seek care:')) patterns.push('care_guidance_included');
  if (responseLower.includes('clinical overview:')) patterns.push('clinical_detail_response');
  if (responseLower.includes('treatment protocols:')) patterns.push('protocol_detail_response');
  
  // Content type patterns
  if (responseLower.includes('medication') || responseLower.includes('drug')) patterns.push('medication_response');
  if (responseLower.includes('emergency') || responseLower.includes('911')) patterns.push('emergency_response');
  if (responseLower.includes('protocol') || responseLower.includes('guideline')) patterns.push('protocol_response');
  if (responseLower.includes('dosing') || responseLower.includes('dose')) patterns.push('dosing_response');
  
  // Response completeness patterns
  if (response.length < 500) patterns.push('concise_response');
  else if (response.length > 1500) patterns.push('detailed_response');
  else patterns.push('standard_response');
  
  // Professional vs general patterns
  if (responseLower.includes('contraindication') || responseLower.includes('pharmacokinetics')) patterns.push('professional_language');
  if (responseLower.includes('simple terms') || responseLower.includes('everyday language')) patterns.push('general_language');
  
  return patterns.length > 0 ? patterns : ['general_response'];
}