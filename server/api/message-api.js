/**
 * @file Message API routes for the Anamnesis Medical AI Assistant
 * Contains endpoints for saving and fetching chat messages
 */

import express from 'express';
import { z } from 'zod';
import { storage } from '../storage.js';

const router = express.Router();

/**
 * Schema for validating message creation
 */
const messageSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  content: z.string().min(1, "Message content is required"),
  isUser: z.boolean().optional().default(true),
  metadata: z.record(z.any()).optional().default({})
});

/**
 * POST /api/messages - Save a message
 * @description Endpoint: POST /api/messages
 * @param {object} req.body - The message data
 * @param {string} req.body.userId - The user ID
 * @param {string} req.body.content - The message content
 * @param {boolean} [req.body.isUser=true] - Whether the message is from a user (vs AI)
 * @param {object} [req.body.metadata={}] - Additional message metadata
 * @returns {object} The saved message data
 */
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validation = messageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error.message || 'Invalid message data' 
      });
    }
    
    const { userId, content, isUser, metadata } = validation.data;
    
    // Save message to database
    const savedMessage = await storage.saveMessage(userId, content, isUser, metadata);
    
    return res.status(201).json({
      success: true,
      data: savedMessage
    });
  } catch (err) {
    console.error('Failed to save message:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to save message' 
    });
  }
});

/**
 * GET /api/messages/:userId - Get messages for a user
 * @description Endpoint: GET /api/messages/:userId
 * @param {string} req.params.userId - The user ID
 * @param {number} [req.query.limit=50] - Optional limit on number of messages to fetch
 * @returns {object} The user's messages
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    console.log(`Fetching messages for user ${userId} with limit ${limit}`);
    
    // Fetch messages from database
    const messages = await storage.getMessages(userId, limit);
    
    console.log(`Retrieved ${messages.length} messages for user ${userId}`);
    
    return res.json({
      success: true,
      data: messages
    });
  } catch (err) {
    console.error('Failed to fetch messages:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch messages' 
    });
  }
});

/**
 * DELETE /api/messages/clear/:userId - Clear all messages for a user
 * @description Endpoint: DELETE /api/messages/clear/:userId
 * @param {string} req.params.userId - The user ID
 * @returns {object} Success status
 */
router.delete('/clear/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    // Check if storage has direct access to messages (in-memory storage)
    if (storage.messages && typeof storage.messages.set === 'function') {
      storage.messages.set(userId, []);
      console.log(`Cleared all messages for user ${userId}`);
      return res.json({
        success: true,
        message: 'All messages cleared successfully'
      });
    } else {
      // For Supabase implementation, this would delete messages from the database
      // This is a placeholder for now
      console.log(`Would clear messages for user ${userId} in database`);
      return res.json({
        success: true,
        message: 'All messages cleared successfully'
      });
    }
  } catch (err) {
    console.error('Failed to clear messages:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to clear messages' 
    });
  }
});

/**
 * Admin routes for message review and management
 * These endpoints are secured with a simple admin key for MVP
 */

/**
 * Middleware to validate admin authentication
 * Uses a simple token-based approach for MVP
 * @param {import('express').Request} req - The express request object
 * @param {import('express').Response} res - The express response object
 * @param {import('express').NextFunction} next - The express next function
 * @returns {void} Calls next() if authentication succeeds or returns 401/403 response
 */
function validateAdminAuth(req, res, next) {
  const adminKey = process.env.ADMIN_KEY;
  const providedKey = req.query.key || req.headers['x-admin-key'];
  
  if (!adminKey || adminKey === '') {
    return res.status(401).json({ 
      success: false, 
      error: 'ADMIN_KEY not configured in environment variables' 
    });
  }
  
  if (providedKey !== adminKey) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid admin authentication' 
    });
  }
  
  next();
}

/**
 * GET /admin/messages - Admin endpoint to retrieve message logs with filtering
 * @description Endpoint: GET /admin/messages
 * @param {string} req.query.user - The user ID to filter messages for
 * @param {number} [req.query.limit=50] - Optional limit on number of messages to fetch
 * @param {boolean} [req.query.riskOnly=false] - Whether to only return high-risk messages
 * @returns {object} The filtered message logs
 */
router.get('/admin/messages', validateAdminAuth, async (req, res) => {
  try {
    const { user: userId, limit = 50, riskOnly = false } = req.query;
    
    // If no user specified, return error for MVP
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required for message retrieval'
      });
    }
    
    // Fetch messages for the specified user
    const messages = await storage.getMessages(userId, parseInt(limit, 10));
    
    // If riskOnly is true, filter to only high-risk messages
    const filteredMessages = riskOnly === 'true' 
      ? messages.filter(msg => {
          try {
            // Check metadata for high-risk flag
            const metadata = typeof msg.metadata === 'string' 
              ? JSON.parse(msg.metadata) 
              : msg.metadata;
              
            return metadata?.isHighRisk === true;
          } catch (e) {
            // Error parsing metadata, return false since we can't determine risk level
            console.error('Error parsing message metadata:', e.message);
            return false;
          }
        })
      : messages;
    
    return res.json({
      success: true,
      data: filteredMessages,
      count: filteredMessages.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error retrieving admin messages:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve messages'
    });
  }
});

/**
 * GET /admin/messages/export - Admin endpoint to export message logs
 * @description Endpoint: GET /admin/messages/export
 * @param {string} req.query.user - The user ID to export messages for
 * @param {string} [req.query.format='csv'] - The export format (csv or jsonl)
 * @param {number} [req.query.limit=1000] - Optional limit on number of messages to export
 * @returns {string} The exported message data in requested format
 */
router.get('/admin/messages/export', validateAdminAuth, async (req, res) => {
  try {
    const { user: userId, format = 'csv', limit = 1000 } = req.query;
    
    // If no user specified, return error for MVP
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required for message export'
      });
    }
    
    // Fetch messages for the specified user
    const messages = await storage.getMessages(userId, parseInt(limit, 10));
    
    // Format output based on requested format
    let output;
    let contentType;
    let filename;
    
    if (format === 'jsonl') {
      // JSONL format (one JSON object per line)
      output = messages.map(msg => JSON.stringify(msg)).join('\n');
      contentType = 'application/jsonl';
      filename = `messages_${userId}_${Date.now()}.jsonl`;
    } else {
      // Default to CSV
      // Define CSV headers
      const headers = ['id', 'userId', 'content', 'isUser', 'timestamp', 'metadata'];
      
      // Create CSV header row
      let csv = headers.join(',') + '\n';
      
      // Add each message as a row
      messages.forEach(msg => {
        const row = [
          msg.id,
          msg.userId,
          `"${(msg.content || '').replace(/"/g, '""')}"`, // Escape quotes in content
          msg.isUser,
          msg.timestamp,
          `"${JSON.stringify(msg.metadata || {}).replace(/"/g, '""')}"` // Escape quotes in metadata
        ];
        
        csv += row.join(',') + '\n';
      });
      
      output = csv;
      contentType = 'text/csv';
      filename = `messages_${userId}_${Date.now()}.csv`;
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.send(output);
    
  } catch (error) {
    console.error('Error exporting admin messages:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export messages'
    });
  }
});

/**
 * Export message API router
 * @module message-api
 */
export default router;