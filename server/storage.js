/**
 * @file Storage interface for the Anamnesis Medical AI Assistant
 * Includes in-memory storage implementation and Supabase storage implementation
 */

import { supabaseAdmin } from "../shared/supabase.js";

/**
 * @typedef {object} User
 * @property {number} id - User ID
 * @property {string} email - User email
 * @property {string} [name] - User's name
 * @property {object} [metadata] - Additional user metadata
 */

/**
 * @typedef {object} Message
 * @property {number|string} id - Message ID
 * @property {string} userId - ID of the user this message belongs to
 * @property {string} content - Content of the message
 * @property {boolean} isUser - Whether the message is from a user (vs AI)
 * @property {Date|string} timestamp - When the message was created
 * @property {object} [metadata] - Additional message metadata
 */

/**
 * @typedef {object} InsertUser
 * @property {string} email - User email
 * @property {string} password - User password
 * @property {string} [name] - User's name
 */

/**
 * @callback GetUserFn
 * @param {number} id - The user ID
 * @returns {Promise<User|undefined>} The user or undefined
 */

/**
 * @callback GetUserByUsernameFn
 * @param {string} username - The username
 * @returns {Promise<User|undefined>} The user or undefined
 */

/**
 * @callback CreateUserFn
 * @param {InsertUser} user - The user data
 * @returns {Promise<User>} The created user
 */

/**
 * @callback SaveMessageFn
 * @param {string} userId - The user ID
 * @param {string} content - The message content
 * @param {boolean} [isUser=true] - Whether the message is from a user (vs AI)
 * @param {object} [metadata={}] - Additional message metadata
 * @returns {Promise<Message>} The saved message
 */

/**
 * @callback GetMessagesFn
 * @param {string} userId - The user ID
 * @param {number} [limit=50] - Max number of messages to return
 * @returns {Promise<Array<Message>>} The messages
 */

/**
 * @callback SaveFeedbackFn
 * @param {object} feedbackData - The feedback data
 * @param {string} feedbackData.messageId - Reference to the message that was rated
 * @param {string} feedbackData.sessionId - Session identifier
 * @param {string} feedbackData.userId - User identifier
 * @param {string} feedbackData.feedbackType - 'helpful' or 'could_improve'
 * @param {string} feedbackData.userQuery - Original user question
 * @param {string} feedbackData.aiResponse - AI's response that was rated
 * @param {string} feedbackData.userRole - User role
 * @param {string} feedbackData.responseMetadata - JSON metadata about the response
 * @returns {Promise<object>} The saved feedback
 */

/**
 * @typedef {object} IStorage
 * @property {GetUserFn} getUser - Get a user by ID
 * @property {GetUserByUsernameFn} getUserByUsername - Get a user by username
 * @property {CreateUserFn} createUser - Create a new user
 * @property {SaveMessageFn} saveMessage - Save a message
 * @property {GetMessagesFn} getMessages - Get messages for a user
 * @property {SaveFeedbackFn} saveFeedback - Save user feedback
 */

/**
 * In-memory storage implementation
 * @implements {IStorage}
 */
class MemStorage {
  constructor() {
    /** @type {Map<number, object>} */
    this.users = new Map();
    
    /** @type {Map<string, Array<object>>} */
    this.messages = new Map();
    
    /** @type {Array<object>} */
    this.feedback = [];
    
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.currentFeedbackId = 1;
  }

  /**
   * Get a user by ID
   * @param {number} id - The user ID
   * @returns {Promise<object|undefined>} The user or undefined
   */
  async getUser(id) {
    return this.users.get(id);
  }

  /**
   * Get a user by username
   * @param {string} username - The username
   * @returns {Promise<object|undefined>} The user or undefined
   */
  async getUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.email === username) {
        return user;
      }
    }
    return undefined;
  }

  /**
   * Create a new user
   * @param {object} insertUser - The user data
   * @returns {Promise<object>} The created user
   */
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  /**
   * Save a message
   * @param {string} userId - The user ID
   * @param {string} content - The message content
   * @param {boolean} [isUser=true] - Whether the message is from a user (vs AI)
   * @param {object} [metadata={}] - Additional message metadata
   * @returns {Promise<object>} The saved message
   */
  async saveMessage(userId, content, isUser = true, metadata = {}) {
    if (!this.messages.has(userId)) {
      this.messages.set(userId, []);
    }

    const messageObj = {
      id: this.currentMessageId++,
      userId,
      content,
      isUser,
      metadata,
      timestamp: new Date(),
    };

    this.messages.get(userId).push(messageObj);
    return messageObj;
  }

  /**
   * Get messages for a user
   * @param {string} userId - The user ID
   * @param {number} [limit=50] - Max number of messages to return
   * @returns {Promise<Array<object>>} The messages
   */
  async getMessages(userId, limit = 50) {
    if (!this.messages.has(userId)) {
      return [];
    }
    return this.messages.get(userId).slice(-limit);
  }

  /**
   * Save user feedback
   * @param {object} feedbackData - The feedback data
   * @returns {Promise<object>} The saved feedback
   */
  async saveFeedback(feedbackData) {
    const feedbackObj = {
      id: this.currentFeedbackId++,
      ...feedbackData,
      timestamp: new Date(),
    };

    this.feedback.push(feedbackObj);
    return feedbackObj;
  }
}

/**
 * Supabase storage implementation (alternative to MemStorage).
 * Exported for use when switching from in-memory to persistent storage.
 * @implements {IStorage}
 */
export class SupabaseStorage {
  /**
   * Creates a new SupabaseStorage instance.
   * Initializes the connection to Supabase admin client.
   */
  constructor() {
    this.supabase = supabaseAdmin;
  }

  /**
   * Get a user by ID
   * @param {number} id - The user ID
   * @returns {Promise<object|undefined>} The user or undefined
   */
  async getUser(id) {
    const { data, error } = await this.supabase.auth.admin.getUserById(id);
    
    if (error || !data.user) {
      console.error("Get user error:", error?.message);
      return undefined;
    }
    
    return data.user;
  }

  /**
   * Get a user by username (email)
   * @param {string} username - The username (email)
   * @returns {Promise<object|undefined>} The user or undefined
   */
  async getUserByUsername(username) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', username)
      .single();
    
    if (error) {
      console.error("Get user by username error:", error.message);
      return undefined;
    }
    
    return data;
  }

  /**
   * Create a new user
   * @param {object} insertUser - The user data
   * @returns {Promise<object>} The created user
   */
  async createUser(insertUser) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email: insertUser.email,
      password: insertUser.password,
      email_confirm: true,
      user_metadata: {
        name: insertUser.name || ''
      }
    });
    
    if (error) {
      console.error("Create user error:", error.message);
      throw new Error(`Failed to create user: ${error.message}`);
    }
    
    return data.user;
  }

  /**
   * Save a message
   * @param {string} userId - The user ID
   * @param {string} content - The message content
   * @param {boolean} [isUser=true] - Whether the message is from a user (vs AI)
   * @param {object} [metadata={}] - Additional message metadata
   * @returns {Promise<object>} The saved message
   */
  async saveMessage(userId, content, isUser = true, metadata = {}) {
    // Prepare message data with metadata
    const messageData = {
      user_id: userId,
      content: content,
      is_user: isUser,
      timestamp: new Date().toISOString(),
      metadata: metadata
    };
    
    // Save message
    const { data, error } = await this.supabase
      .from('messages')
      .insert(messageData)
      .select();
    
    if (error) {
      console.error("Save message error:", error.message);
      throw new Error(`Failed to save message: ${error.message}`);
    }
    
    return data[0];
  }

  /**
   * Get messages for a user
   * @param {string} userId - The user ID
   * @param {number} [limit=50] - Max number of messages to return
   * @returns {Promise<Array<object>>} The messages
   */
  async getMessages(userId, limit = 50) {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error("Get messages error:", error.message);
      return [];
    }
    
    return data;
  }

  /**
   * Save user feedback
   * @param {object} feedbackData - The feedback data
   * @returns {Promise<object>} The saved feedback
   */
  async saveFeedback(feedbackData) {
    const { data, error } = await this.supabase
      .from('feedback')
      .insert({
        message_id: feedbackData.messageId,
        session_id: feedbackData.sessionId,
        user_id: feedbackData.userId,
        feedback_type: feedbackData.feedbackType,
        user_query: feedbackData.userQuery,
        ai_response: feedbackData.aiResponse,
        user_role: feedbackData.userRole,
        response_metadata: JSON.stringify(feedbackData.responseMetadata || {})
      })
      .select();
    
    if (error) {
      console.error("Save feedback error:", error.message);
      throw new Error(`Failed to save feedback: ${error.message}`);
    }
    
    return data[0];
  }
}

/**
 * Storage instance for the application.
 * Using in-memory storage for development, can be switched to Supabase for production.
 * @type {IStorage}
 */
export const storage = new MemStorage();

// Uncomment to use Supabase storage instead of memory storage
// export const storage = new SupabaseStorage();