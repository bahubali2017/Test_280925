/**
 * @file Direct API endpoints for the Anamnesis Medical AI Assistant
 * Contains streamlined implementations that avoid router mounting issues
 */

/* global setTimeout */

import express from 'express';
import { storage } from '../storage.js';

const router = express.Router();

/**
 * GET /api/direct/messages/:userId - Get messages for a user
 * @param {string} req.params.userId - The user ID
 * @param {number} [req.query.limit=50] - Optional limit on number of messages to fetch
 */
router.get('/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    console.log(`Direct endpoint: Fetching messages for user ${userId} with limit ${limit}`);
    
    // Fetch messages from database
    const messages = await storage.getMessages(userId, limit);
    
    console.log(`Direct endpoint: Retrieved ${messages.length} messages for user ${userId}`);
    
    return res.json({
      success: true,
      data: messages
    });
  } catch (err) {
    console.error('Failed to fetch messages:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch messages',
      error: err.message
    });
  }
});

/**
 * REMOVED: Duplicate /api/chat/stream route that was causing conflicts
 * This route is now exclusively handled in server/routes.js
 */

/**
 * Generates a simulated medical response based on user query
 * @param {string} userMessage - The user's message
 * @param {boolean} isHighRisk - Whether the message is flagged as high risk
 * @returns {string} The simulated AI response
 */
function generateMedicalResponse(userMessage, isHighRisk) {
  // Add emergency disclaimer for high-risk messages
  let response = '';
  
  if (isHighRisk) {
    response += '**IMPORTANT MEDICAL DISCLAIMER**: If you are experiencing a medical emergency, please call emergency services immediately (911 in the US) or go to your nearest emergency room. This information is not a substitute for professional medical advice or treatment.\n\n';
  }
  
  // Based on the message, generate an appropriate response
  if (userMessage.toLowerCase().includes('headache')) {
    response += 'Headaches are common and can have various causes ranging from stress and dehydration to more serious conditions.\n\n';
    response += 'Common types include:\n• Tension headaches (most common)\n• Migraines\n• Cluster headaches\n• Sinus headaches\n\n';
    response += 'For occasional headaches, proper hydration, rest, and over-the-counter pain relievers may help. However, if you experience severe, sudden, or persistent headaches, it\'s important to consult with a healthcare provider for proper evaluation.\n\n';
    response += 'Remember that this information is educational and not a substitute for professional medical advice or diagnosis.';
  } 
  else if (userMessage.toLowerCase().includes('fever')) {
    response += 'A fever is typically defined as a body temperature above 98.6°F (37°C) and is often a sign that your body is fighting an infection.\n\n';
    response += 'Common causes include:\n• Viral infections\n• Bacterial infections\n• Inflammatory conditions\n• Certain medications\n\n';
    response += 'For mild fevers, rest, hydration, and fever-reducing medications may help manage symptoms. However, high fevers (above 103°F/39.4°C for adults) or fevers accompanied by severe symptoms warrant prompt medical attention.\n\n';
    response += 'Remember that this information is educational and not a substitute for professional medical advice or diagnosis.';
  }
  else if (userMessage.toLowerCase().includes('diet') || userMessage.toLowerCase().includes('nutrition')) {
    response += 'A balanced diet is fundamental to good health and includes a variety of nutrients from different food groups.\n\n';
    response += 'Key components of a healthy diet include:\n• Fruits and vegetables\n• Whole grains\n• Lean proteins\n• Healthy fats\n• Adequate hydration\n\n';
    response += 'Individual nutritional needs can vary based on age, sex, activity level, and underlying health conditions. A registered dietitian can provide personalized guidance for your specific situation.\n\n';
    response += 'Remember that this information is educational and not a substitute for professional medical advice or diagnosis.';
  }
  else {
    response += 'Thank you for your health-related question. As a medical AI assistant, I can provide general information on various health topics including conditions, symptoms, wellness strategies, and preventive care.\n\n';
    response += 'For personalized medical advice, diagnosis, or treatment recommendations, it\'s important to consult with a qualified healthcare provider who can consider your specific medical history and circumstances.\n\n';
    response += 'If you\'d like to ask about a specific health concern or topic, please feel free to provide more details, and I\'ll do my best to provide educational information on the subject.\n\n';
    response += 'Remember that this information is educational and not a substitute for professional medical advice or diagnosis.';
  }
  
  return response;
}

/**
 * Simulates text chunks for streaming by breaking a response into smaller pieces
 * @param {string} text - The full text to be chunked
 * @returns {string[]} Array of text chunks
 */
function simulateTextChunks(text) {
  // Simple chunking by sentences or punctuation
  const chunks = [];
  let currentPos = 0;
  const chunkSize = 20; // characters per chunk, adjust as needed
  
  while (currentPos < text.length) {
    // Try to find a good breaking point (sentence or punctuation)
    let endPos = Math.min(currentPos + chunkSize, text.length);
    
    // If we're not at the end, try to break at a natural point
    if (endPos < text.length) {
      // Look for natural break points like periods, commas, etc.
      const nextPeriod = text.indexOf('.', currentPos + 5);
      const nextComma = text.indexOf(',', currentPos + 5);
      const nextNewline = text.indexOf('\n', currentPos + 5);
      
      // Find the closest break point that's after currentPos+5 (to ensure some content)
      const breakPoints = [nextPeriod, nextComma, nextNewline]
        .filter(pos => pos > currentPos + 5 && pos <= currentPos + chunkSize * 2);
      
      if (breakPoints.length > 0) {
        // Use the closest break point
        endPos = Math.min(...breakPoints) + 1; // Include the punctuation
      }
    }
    
    chunks.push(text.substring(currentPos, endPos));
    currentPos = endPos;
  }
  
  return chunks;
}

/**
 *
 */
export default router;