/**
 * @file Tests for the message API routes
 * Verifies message saving and fetching operations
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import messageApiRouter from '../server/api/message-api.js';
import { storage } from '../server/storage.js';

// Mock the storage methods
jest.mock('../server/storage.js', () => ({
  storage: {
    saveMessage: jest.fn(),
    getMessages: jest.fn()
  }
}));

// Create a test app with the message API routes
const app = express();
app.use(express.json());
app.use('/api/messages', messageApiRouter);

/**
 * Message API tests
 */
describe('Message API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * POST /api/messages tests
   */
  describe('POST /api/messages', () => {
    /**
     * Test successful message creation
     */
    it('should save a valid message', async () => {
      // Mock the saveMessage function to return a canned response
      const mockMessage = {
        id: '123',
        userId: 'user1',
        content: 'Hello, world!',
        isUser: true,
        timestamp: new Date().toISOString()
      };
      storage.saveMessage.mockResolvedValue(mockMessage);

      // Make the request
      const response = await request(app)
        .post('/api/messages')
        .send({
          userId: 'user1',
          content: 'Hello, world!'
        });

      // Verify the response
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMessage);

      // Verify that saveMessage was called with the correct parameters
      expect(storage.saveMessage).toHaveBeenCalledWith(
        'user1',
        'Hello, world!',
        true,
        {}
      );
    });

    /**
     * Test validation error handling
     */
    it('should reject a message with missing userId', async () => {
      // Make the request with missing userId
      const response = await request(app)
        .post('/api/messages')
        .send({
          content: 'Hello, world!'
        });

      // Verify the response
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      
      // Verify that saveMessage was not called
      expect(storage.saveMessage).not.toHaveBeenCalled();
    });

    /**
     * Test validation error handling
     */
    it('should reject a message with missing content', async () => {
      // Make the request with missing content
      const response = await request(app)
        .post('/api/messages')
        .send({
          userId: 'user1'
        });

      // Verify the response
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      
      // Verify that saveMessage was not called
      expect(storage.saveMessage).not.toHaveBeenCalled();
    });

    /**
     * Test error handling
     */
    it('should handle storage errors', async () => {
      // Mock saveMessage to throw an error
      storage.saveMessage.mockRejectedValue(new Error('Database error'));

      // Make the request
      const response = await request(app)
        .post('/api/messages')
        .send({
          userId: 'user1',
          content: 'Hello, world!'
        });

      // Verify the response
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  /**
   * GET /api/messages/:userId tests
   */
  describe('GET /api/messages/:userId', () => {
    /**
     * Test successful message fetching
     */
    it('should fetch messages for a valid userId', async () => {
      // Mock the getMessages function to return a canned response
      const mockMessages = [
        {
          id: '123',
          userId: 'user1',
          content: 'Hello, world!',
          isUser: true,
          timestamp: new Date().toISOString()
        },
        {
          id: '124',
          userId: 'user1',
          content: 'How are you?',
          isUser: false,
          timestamp: new Date().toISOString()
        }
      ];
      storage.getMessages.mockResolvedValue(mockMessages);

      // Make the request
      const response = await request(app)
        .get('/api/messages/user1');

      // Verify the response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMessages);

      // Verify that getMessages was called with the correct parameters
      expect(storage.getMessages).toHaveBeenCalledWith('user1', 50);
    });

    /**
     * Test limit parameter
     */
    it('should respect the limit parameter', async () => {
      // Mock the getMessages function
      storage.getMessages.mockResolvedValue([]);

      // Make the request with a limit
      const response = await request(app)
        .get('/api/messages/user1?limit=10');

      // Verify that getMessages was called with the correct limit
      expect(storage.getMessages).toHaveBeenCalledWith('user1', 10);
    });

    /**
     * Test error handling
     */
    it('should handle storage errors', async () => {
      // Mock getMessages to throw an error
      storage.getMessages.mockRejectedValue(new Error('Database error'));

      // Make the request
      const response = await request(app)
        .get('/api/messages/user1');

      // Verify the response
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});