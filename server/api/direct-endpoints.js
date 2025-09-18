/**
 * @file Direct API endpoints for the Anamnesis Medical AI Assistant
 * Contains streamlined implementations that avoid router mounting issues
 */


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
 *
 */
export default router;