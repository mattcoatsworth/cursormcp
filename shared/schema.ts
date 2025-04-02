import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// API connection schema
export const apiConnections = pgTable("api_connections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // shopify, klaviyo, postscript, northbeam, slack, notion, chatgpt
  isConnected: boolean("is_connected").notNull().default(false),
  isMock: boolean("is_mock").notNull().default(false), // indicates if this is a mock connection
  credentials: jsonb("credentials").notNull().default({}),
  lastConnected: timestamp("last_connected"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApiConnectionSchema = createInsertSchema(apiConnections).omit({
  id: true,
  createdAt: true,
  lastConnected: true,
});

// Chat message schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // user, system, assistant
  content: text("content").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Command history schema
export const commandHistory = pgTable("command_history", {
  id: serial("id").primaryKey(),
  command: text("command").notNull(),
  result: jsonb("result").notNull().default({}),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommandHistorySchema = createInsertSchema(commandHistory).omit({
  id: true,
  processedAt: true,
  createdAt: true,
});

// API endpoints schema
export const apiEndpoints = pgTable("api_endpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  service: text("service").notNull(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  method: text("method").notNull(),
  path: text("path").notNull(),
  parameters: jsonb("parameters").default({}).notNull(),
  authType: text("auth_type").notNull(),
  authKey: text("auth_key").notNull(),
  rateLimit: text("rate_limit").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertApiEndpointSchema = createInsertSchema(apiEndpoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type ApiConnection = typeof apiConnections.$inferSelect;
export type InsertApiConnection = z.infer<typeof insertApiConnectionSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Define an interface that matches ChatMessage structure but allows string ID for temporary messages
export interface ChatMessageWithStringId {
  id: string | number;
  role: string;
  content: string;
  metadata: unknown;
  createdAt: Date | string;
}

export type CommandHistoryEntry = typeof commandHistory.$inferSelect;
export type InsertCommandHistoryEntry = z.infer<typeof insertCommandHistorySchema>;

// Training data table schema
export const trainingData = pgTable("training_data", {
  id: text("id").primaryKey().notNull(),
  tool: text("tool").notNull(),
  intent: text("intent").notNull(),
  query: text("query").notNull(),
  response: text("response").notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  isMultiService: boolean("is_multi_service").default(false),
  // Note: search_vector is managed by PostgreSQL and not directly by Drizzle
});

export const insertTrainingDataSchema = createInsertSchema(trainingData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TrainingData = typeof trainingData.$inferSelect;
export type InsertTrainingData = z.infer<typeof insertTrainingDataSchema>;

// API endpoint types
export type ApiEndpoint = typeof apiEndpoints.$inferSelect;
export type InsertApiEndpoint = z.infer<typeof insertApiEndpointSchema>;
