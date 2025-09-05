import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Users table schema
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

/**
 * Messages table schema
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: text("metadata").notNull().default('{}'),
});

/**
 * Feedback table schema for machine learning
 */
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").notNull(), // Reference to the message that was rated
  sessionId: text("session_id").notNull(),
  userId: text("user_id").notNull().default('anonymous'),
  feedbackType: text("feedback_type").notNull(), // 'helpful' or 'could_improve'
  userQuery: text("user_query").notNull(), // Original user question
  aiResponse: text("ai_response").notNull(), // AI's response that was rated
  userRole: text("user_role").notNull().default('general_public'), // 'healthcare_professional' or 'general_public'
  responseMetadata: text("response_metadata").notNull().default('{}'), // JSON metadata about the response
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

/**
 * Learning patterns table for ML analysis
 */
export const learningPatterns = pgTable("learning_patterns", {
  id: serial("id").primaryKey(),
  queryPattern: text("query_pattern").notNull(), // Pattern detected in queries
  responsePattern: text("response_pattern").notNull(), // Pattern in successful responses
  userRole: text("user_role").notNull(), // Target user role
  positiveCount: integer("positive_count").notNull().default(0), // Helpful feedback count
  negativeCount: integer("negative_count").notNull().default(0), // Could improve feedback count
  accuracy: integer("accuracy").notNull().default(0), // Success rate (0-100)
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

/**
 * Schema for user creation
 */
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

/**
 * Schema for message creation
 */
export const insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  content: true,
  isUser: true,
  metadata: true,
});

/**
 * Schema for feedback creation
 */
export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  messageId: true,
  sessionId: true,
  userId: true,
  feedbackType: true,
  userQuery: true,
  aiResponse: true,
  userRole: true,
  responseMetadata: true,
});

/**
 * Schema for learning patterns creation
 */
export const insertLearningPatternSchema = createInsertSchema(learningPatterns).pick({
  queryPattern: true,
  responsePattern: true,
  userRole: true,
  positiveCount: true,
  negativeCount: true,
  accuracy: true,
  isActive: true,
});

/**
 * Types for inserting data
 */
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type InsertLearningPattern = z.infer<typeof insertLearningPatternSchema>;

/**
 * Types for retrieving data
 */
export type User = typeof users.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type LearningPattern = typeof learningPatterns.$inferSelect;
