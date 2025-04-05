import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { SupabaseStorage } from "./storage.supabase";
import { migrateTables } from "./utils/migrateTables";
import { z } from "zod";
import { 
  insertChatMessageSchema, 
  insertCommandHistorySchema, 
  insertApiConnectionSchema,
  insertTrainingDataSchema
} from "@shared/schema";
import { processCommand } from "./processors/commandProcessor";
// Database connection now handled through Supabase only
import { supabase, TABLES } from "./supabase";
import OpenAI from "openai";
import session from "express-session";

// Helper to handle errors in a type-safe way
function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

import { setMockMode, isMockModeEnabled, resetApiConnectionsForMockMode } from './mockData/mockApiWrapper';

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Mock Mode APIs
  router.get("/mock-mode", (req, res) => {
    res.json({ 
      enabled: isMockModeEnabled(),
      success: true 
    });
  });

  router.post("/mock-mode", async (req, res) => {
    try {
      const { enabled } = req.body;
      
      // Set the mock mode
      setMockMode(enabled);
      
      // Update API connections based on the new mock mode setting
      await resetApiConnectionsForMockMode();
      
      res.json({ 
        enabled, 
        success: true,
        message: `Mock mode ${enabled ? 'enabled' : 'disabled'} successfully` 
      });
    } catch (error) {
      console.error('Error setting mock mode:', error);
      res.status(500).json({
        success: false,
        enabled: false,
        message: `Error setting mock mode: ${handleError(error)}`
      });
    }
  });

  // Get API connections
  router.get("/api-connections", async (req, res) => {
    try {
      const connections = await storage.getApiConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch API connections", error: handleError(error) });
    }
  });
  
  // Create a new API connection
  router.post("/api-connections", async (req, res) => {
    try {
      const connectionType = req.body.type?.toLowerCase() || '';
      
      // Create a base schema for API connection
      const baseConnectionSchema = insertApiConnectionSchema.extend({
        credentials: z.any(),
      });
      
      // Define schemas for different API types
      const shopifyCredentialsSchema = z.object({
        apiKey: z.string().min(1, "API Key is required"),
        apiSecretKey: z.string().min(1, "API Secret Key is required"),
        shopDomain: z.string().min(1, "Shop Domain is required"),
        accessToken: z.string().min(1, "Access Token is required"),
      });
      
      const slackCredentialsSchema = z.object({
        botToken: z.string().min(1, "Bot Token is required"),
        channelId: z.string().min(1, "Channel ID is required"),
        appToken: z.string().optional(),
      });
      
      const notionCredentialsSchema = z.object({
        notionToken: z.string().min(1, "Integration Token is required"),
        databaseId: z.string().optional(),
      });
      
      const klaviyoCredentialsSchema = z.object({
        apiKey: z.string().min(1, "Private API Key is required"),
        publicKey: z.string().min(1, "Public API Key is required"),
      });
      
      // Determine which schema to use based on connection type
      let validationSchema;
      if (connectionType === 'shopify') {
        validationSchema = baseConnectionSchema.extend({
          credentials: shopifyCredentialsSchema,
        });
      } else if (connectionType === 'slack') {
        validationSchema = baseConnectionSchema.extend({
          credentials: slackCredentialsSchema,
        });
      } else if (connectionType === 'notion') {
        validationSchema = baseConnectionSchema.extend({
          credentials: notionCredentialsSchema,
        });
      } else if (connectionType === 'klaviyo') {
        validationSchema = baseConnectionSchema.extend({
          credentials: klaviyoCredentialsSchema,
        });
      } else if (connectionType === 'openai') {
        validationSchema = baseConnectionSchema.extend({
          credentials: z.object({
            apiKey: z.string().min(1, "API Key is required"),
          }),
        });
      } else {
        // Default for other types
        validationSchema = baseConnectionSchema;
      }
      
      // Validate the request body with the appropriate schema
      const validatedData = validationSchema.parse(req.body);
      
      // Create the API connection
      const connection = await storage.createApiConnection(validatedData);
      
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid API connection data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create API connection", error: handleError(error) });
      }
    }
  });

  // Get chat messages
  router.get("/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const messages = await storage.getChatMessages(limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages", error: handleError(error) });
    }
  });

  // Create a new message and process command if from user
  router.post("/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(validatedData);

      // Log user message to user_data using the Python script
      if (validatedData.role === "user") {
        try {
          const { spawn } = require('child_process');
          const userId = req.session?.user?.id || "anonymous-user";
          
          // Execute the Python script to log the message
          const logProcess = spawn('python', [
            'scripts/log_chat_to_user_data.py',
            '--user_id', userId,
            '--content', validatedData.content,
            '--role', validatedData.role,
            '--metadata', JSON.stringify(validatedData.metadata || {})
          ]);
          
          // Handle script output for debugging
          logProcess.stdout.on('data', (data) => {
            console.log(`log_chat_to_user_data output: ${data}`);
          });
          
          logProcess.stderr.on('data', (data) => {
            console.error(`log_chat_to_user_data error: ${data}`);
          });
          
          // Store the user_id in the message metadata for response updating
          message.metadata = {
            ...message.metadata,
            user_data_logged: true,
            user_id: userId,
            query: validatedData.content
          };
          await storage.updateChatMessage(message.id, message);
        } catch (loggingError) {
          console.error('Error logging chat to user_data:', loggingError);
        }
      }

      // Process commands
      if (validatedData.role === "user") {
        const commandEntry = await storage.createCommandHistoryEntry({
          command: validatedData.content,
          result: {},
          status: "pending"
        });

        const isCommand = validatedData.content.trim().startsWith('/');
        
        // Create a message for the response
        const assistantMessage = await storage.createChatMessage({
          role: "assistant",
          content: isCommand 
            ? `Processing command: ${validatedData.content}` 
            : "Thinking...",
          metadata: { 
            isProcessing: true,
            originalCommand: validatedData.content,
            steps: [],
            currentStep: isCommand 
              ? `Analyzing command: ${validatedData.content.split(' ')[0]}` 
              : "Starting to process your request..."
          }
        });

        // Process the command
        processCommand(validatedData.content, assistantMessage.id, commandEntry.id, false)
          .then(async (llmResponse) => {
            // Update user_data with the response
            if (message.metadata?.user_data_logged) {
              try {
                const { spawn } = require('child_process');
                const userId = message.metadata.user_id || "anonymous-user";
                const query = message.metadata.query || validatedData.content;
                
                // Prepare execution details
                const executionDetails = llmResponse.execution_details || [];
                const systems = llmResponse.systems || [];
                
                // Execute the Python script to update with response
                const updateProcess = spawn('python', [
                  'scripts/update_user_data_response.py',
                  '--user_id', userId,
                  '--query', query,
                  '--response', llmResponse.content || "",
                  '--execution_details', JSON.stringify(executionDetails),
                  '--systems', JSON.stringify(systems)
                ]);
                
                updateProcess.stdout.on('data', (data) => {
                  console.log(`update_user_data_response output: ${data}`);
                });
                
                updateProcess.stderr.on('data', (data) => {
                  console.error(`update_user_data_response error: ${data}`);
                });
              } catch (updateError) {
                console.error('Error updating user_data with response:', updateError);
              }
            }
          })
          .catch(error => {
            console.error("Error processing command:", error);
            
            storage.updateChatMessage(assistantMessage.id, {
              content: `Error processing command: ${error.message}`,
              metadata: {
                isProcessing: false,
                error: error.message,
                originalCommand: validatedData.content
              }
            }).catch(updateError => {
              console.error("Failed to update message with error:", updateError);
            });
          });
      }

      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Failed to create message", error: handleError(error) });
    }
  });
  
  // Execute command directly (for widgets and silent API calls)
  router.post("/command", async (req, res) => {
    try {
      const { content, metadata = {} } = req.body;
      
      if (!content) {
        return res.status(400).json({ success: false, message: "Command content is required" });
      }
      
      // Create command history entry
      const commandEntry = await storage.createCommandHistoryEntry({
        command: content,
        result: {},
        status: "pending"
      });
      
      try {
        // Direct command processing
        const result = await processCommand(content, 0, commandEntry.id, true);
        
        // Update command history with result
        await storage.updateCommandHistoryEntry(commandEntry.id, {
          result,
          status: "completed",
          processedAt: new Date()
        });
        
        // Return success response with data
        return res.json({
          success: true,
          message: "Command processed successfully",
          data: result
        });
      } catch (cmdError) {
        console.error("Error processing widget command:", cmdError);
        
        // Update command history with error
        await storage.updateCommandHistoryEntry(commandEntry.id, {
          result: { error: handleError(cmdError) },
          status: "error",
          processedAt: new Date()
        });
        
        return res.status(500).json({
          success: false,
          message: `Command processing error: ${handleError(cmdError)}`,
          error: handleError(cmdError)
        });
      }
    } catch (error) {
      console.error("Error in command endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process command",
        error: handleError(error)
      });
    }
  });

  // Get command history
  router.get("/commands", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const commands = await storage.getCommandHistory(limit);
      res.json(commands);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch command history", error: handleError(error) });
    }
  });
  
  // Training Data API Endpoints
  
  // Get multi-service training data
  router.get("/training/multi-service", async (req, res) => {
    try {
      // Import the executeSql function directly
      const { executeSql } = await import('../execute_sql_tool');
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      // Try to get multi-service examples with two approaches:
      // 1. First try with tool = 'Multi-Service' which is how we're now storing them
      // 2. Then as fallback, use metadata.is_multi_service = true for backward compatibility
      
      // First try: Using the tool name
      let sql = `
        SELECT * FROM training_data
        WHERE tool = 'Multi-Service'
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      
      // Execute the query
      try {
        console.log('Executing multi-service query using tool name');
        let response = await executeSql(sql);
        
        // If no results, try the metadata approach
        if (!response || !Array.isArray(response) || response.length === 0) {
          console.log('No results with tool = Multi-Service, trying metadata approach');
          
          // Build a query that looks for multi-service examples using metadata
          // Need to use JSON operators to find is_multi_service: true
          sql = `
            SELECT * FROM training_data
            WHERE (metadata->'is_multi_service')::boolean = true
            ORDER BY created_at DESC
            LIMIT ${limit}
          `;
          
          response = await executeSql(sql);
        }
        
        if (response && Array.isArray(response)) {
          // Transform the data to the expected format
          const data = response.map(item => ({
            id: item.id,
            tool: item.tool,
            intent: item.intent,
            query: item.query,
            response: item.response,
            metadata: item.metadata || {},
            createdAt: item.created_at,
            updatedAt: item.updated_at
          }));
          
          return res.json(data);
        }
        
        return res.json([]);
      } catch (sqlError) {
        console.error('SQL execution error for multi-service query:', sqlError);
        
        try {
          // Try a direct SQL approach with a simpler query as fallback
          const simpleResponse = await executeSql(
            `SELECT * FROM training_data 
             WHERE tool = 'Multi-Service' 
             OR tool ILIKE '%multi%' 
             ORDER BY created_at DESC 
             LIMIT ${limit}`
          );
          
          if (simpleResponse && Array.isArray(simpleResponse) && simpleResponse.length > 0) {
            // Transform the data to the expected format
            const data = simpleResponse.map(item => ({
              id: item.id,
              tool: item.tool,
              intent: item.intent,
              query: item.query,
              response: item.response,
              metadata: item.metadata || {},
              createdAt: item.created_at,
              updatedAt: item.updated_at
            }));
            
            return res.json(data);
          }
        } catch (finalSqlError) {
          console.error('Final SQL fallback failed:', finalSqlError);
        }
        
        // Return empty array as last resort
        return res.json([]);
      }
    } catch (error) {
      console.error('Error fetching multi-service training data:', error);
      res.status(500).json({ 
        message: "Failed to fetch multi-service training data", 
        error: handleError(error) 
      });
    }
  });

  // Get training data with optional filters
  router.get("/training", async (req, res) => {
    try {
      const options = {
        tool: req.query.tool as string | undefined,
        intent: req.query.intent as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };
      
      // Remove undefined options to avoid filtering by them
      Object.keys(options).forEach(key => {
        if (options[key as keyof typeof options] === undefined) {
          delete options[key as keyof typeof options];
        }
      });
      
      // Use direct SQL query since it's more reliable with the current setup
      console.log('Using direct SQL query for training data');
      try {
        const data = await directTrainingDataQuery(options);
        return res.json(data);
      } catch (sqlError) {
        console.error('SQL execution error:', sqlError);
        
        // Try storage interface as fallback
        try {
          console.log('Falling back to storage interface');
          const trainingData = await storage.getTrainingData(options);
          return res.json(trainingData);
        } catch (storageError) {
          console.error('Error using storage interface:', storageError);
          return res.json([]);
        }
      }
    } catch (error) {
      console.error('Final training data error:', error);
      res.status(500).json({ 
        message: "Failed to fetch training data", 
        error: handleError(error) 
      });
    }
  });
  
  // Helper function for direct database query
  async function directTrainingDataQuery(options: { tool?: string, intent?: string, limit?: number }) {
    // Import the getTrainingData function directly from the SQL tool
    const { getTrainingData } = await import('../execute_sql_tool');
    
    console.log('Using specialized training data function with options:', options);
    
    try {
      // Use the specialized function that handles Supabase connections properly
      const response = await getTrainingData({
        tool: options.tool,
        intent: options.intent,
        limit: options.limit || 50
      });
      
      // The response is already formatted correctly by the getTrainingData function
      return response;
    } catch (error) {
      console.error('Error in directTrainingDataQuery:', error);
      throw error; // Re-throw to allow the route handler to try fallbacks
    }
  }
  
  // Search training data
  router.get("/training/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      if (!query) {
        return res.status(400).json({ 
          message: "Query parameter 'q' is required"
        });
      }
      
      console.log(`Searching training data with query "${query}"`);
      
      // Use specialized getTrainingData function with search parameter
      try {
        // Import the getTrainingData function directly
        const { getTrainingData } = await import('../execute_sql_tool');
        
        console.log('Using specialized training data function for search');
        
        // Use the specialized function with the search query
        const results = await getTrainingData({
          searchQuery: query,
          limit: limit
        });
        
        console.log(`Found ${results.length} training data entries matching query "${query}"`);
        return res.json(results);
      } catch (searchError) {
        console.error('Error searching training data:', searchError);
        
        // Include debugging information in the response when in development
        if (process.env.NODE_ENV !== 'production') {
          res.status(500).json({
            message: "Error when searching training data",
            error: handleError(searchError),
            apiResponse: {
              isLoading: false,
              hasError: true,
              records: []
            },
            debug: {
              error: searchError
            }
          });
        } else {
          // In production, don't expose error details
          res.json([]);
        }
      }
    } catch (error) {
      console.error('Final training search error:', error);
      res.status(500).json({ 
        message: "Failed to search training data", 
        error: handleError(error) 
      });
    }
  });
  
  // Get unique tools and intents
  router.get("/training/metadata", async (req, res) => {
    try {
      // Import the getTrainingData function directly from SQL tool
      const { getTrainingData } = await import('../execute_sql_tool');
      
      console.log('Getting training data metadata using specialized function');
      
      try {
        // Get all training data with direct Supabase access (limited to 1000 for performance)
        const trainingData = await getTrainingData({ limit: 1000 });
        
        if (trainingData && Array.isArray(trainingData) && trainingData.length > 0) {
          console.log(`Retrieved ${trainingData.length} training data records for metadata`);
          
          // Extract unique tools (without using Set to avoid downlevel iteration issues)
          const toolsSet: Record<string, boolean> = {};
          trainingData.forEach(item => {
            if (item.tool) {
              toolsSet[item.tool] = true;
            }
          });
          const tools = Object.keys(toolsSet);
          
          // Group intents by tool
          const intents: Record<string, string[]> = {};
          
          trainingData.forEach(item => {
            if (!item.tool || !item.intent) return;
            
            if (!intents[item.tool]) {
              intents[item.tool] = [];
            }
            
            if (!intents[item.tool].includes(item.intent)) {
              intents[item.tool].push(item.intent);
            }
          });
          
          // Get total count
          const totalExamples = trainingData.length;
          
          return res.json({
            tools,
            intents,
            totalExamples
          });
        } else {
          console.log('No training data found, returning empty metadata');
          return res.json({
            tools: [],
            intents: {},
            totalExamples: 0
          });
        }
      } catch (dataError) {
        console.error('Error retrieving training data:', dataError);
        
        // Return empty results as fallback
        return res.json({
          tools: [],
          intents: {},
          totalExamples: 0
        });
      }
    } catch (error) {
      console.error('Final metadata error:', error);
      res.status(500).json({ 
        message: "Failed to fetch training data metadata", 
        error: handleError(error) 
      });
    }
  });
  
  // Create training data
  router.post("/training", async (req, res) => {
    try {
      const { tool, intent, query, response, metadata } = req.body;
      
      // Validate required fields
      if (!tool || !intent || !query || !response) {
        return res.status(400).json({ 
          message: "Missing required fields: tool, intent, query, and response are required" 
        });
      }
      
      console.log(`Received training data: Tool: ${tool}, Intent: ${intent}, Query: ${query.substring(0, 30)}...`);
      
      // Generate a random ID
      const id = `training-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      try {
        // First attempt: Try using the storage interface
        const newEntry = await storage.createTrainingData({
          tool,
          intent,
          query,
          response,
          metadata: metadata || {}
        });
        
        res.status(201).json(newEntry);
      } catch (storageError) {
        console.error('Error using storage interface:', storageError);
        
        try {
          // Second attempt: Direct SQL query using the database URL
          // Use fetch to send a request to a serverless function that will handle the database query
          console.log('Unable to use direct pg module import, attempting direct SQL execution');
          
          // Using direct PostgreSQL execute with prepared statement
          try {
            // Execute the SQL directly with the existing database connection from storage
            const result = await supabase.rpc('execute_sql', {
              query: `
                INSERT INTO training_data (id, tool, intent, query, response, metadata, created_at, updated_at)
                VALUES ('${id}', '${tool}', '${intent}', '${query.replace(/'/g, "''")}', '${response.replace(/'/g, "''")}', '${JSON.stringify(metadata || {})}', NOW(), NOW())
                RETURNING *;
              `
            });
            
            if (result.error) {
              console.error('Error executing direct SQL:', result.error);
              throw new Error(`Failed to execute direct SQL: ${result.error.message}`);
            }
          } catch (directSqlError) {
            console.error('Error with direct SQL execution:', directSqlError);
            
            // Last resort: Use a fetch request to a serverless function
            console.log('Attempting to use fetch API with the Database URL directly...');
            
            // We'll skip this approach for now as it requires additional setup
            throw new Error('Direct database operations failed');
          }
          
          // Try the simplest direct insertion method with the available database
          // We'll execute a direct SQL query through the PostgreSQL connection
          console.log('Attempting final method: direct database insertion via SQL');
          
          // Create a mock response since we can't get the actual result
          const directEntry = {
            id: id,
            tool: tool,
            intent: intent,
            query: query,
            response: response,
            metadata: metadata || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Execute direct SQL with pg-promise or another method if needed
          // This is a fallback if all other methods fail
          
          res.status(201).json(directEntry);
        } catch (directDbError) {
          console.error('Error with direct database insertion:', directDbError);
          throw new Error(`Failed with both methods: ${storageError.message} AND ${directDbError.message}`);
        }
      }
    } catch (error) {
      console.error('Error creating training data:', error);
      res.status(500).json({ 
        message: "Failed to create training data", 
        error: handleError(error) 
      });
    }
  });
  
  // Execute SQL query directly (for internal use only)
  router.post("/execute-sql", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({
          message: "Query parameter is required"
        });
      }
      
      // For security, restrict this to SELECT queries
      if (!query.trim().toLowerCase().startsWith('select')) {
        return res.status(403).json({
          message: "Only SELECT queries are allowed for security reasons"
        });
      }
      
      // Execute SQL directly using PostgreSQL client
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      try {
        const result = await pool.query(query);
        await pool.end();
        
        res.json(result.rows);
      } catch (pgError) {
        console.error('Error executing SQL query:', pgError);
        res.status(500).json({
          message: "Failed to execute SQL query",
          error: handleError(pgError)
        });
        await pool.end();
      }
    } catch (error) {
      console.error('Error in execute-sql endpoint:', error);
      res.status(500).json({
        message: "Failed to execute SQL query",
        error: handleError(error)
      });
    }
  });

  // Update API connection
  router.put("/api-connections/:id", async (req, res) => {
    try {
      // Don't parse as int - keep the ID as a string for UUID compatibility
      const id = req.params.id; 
      const { isConnected, credentials, type } = req.body;
      console.log("Updating API connection:", { id, isConnected, type });
      
      // SAFEGUARD: First get the EXACT connection by ID to ensure we have the right data
      // This prevents potential issues with getApiConnectionByType() matching the wrong connection
      const connectionById = await getExistingConnection(id);
      
      if (!connectionById) {
        console.error(`API connection with ID ${id} not found`);
        return res.status(404).json({ message: "API connection not found" });
      }
      
      console.log("Found existing connection:", connectionById);
      
      // If we're just toggling the connection status, don't touch the credentials
      if (req.body.hasOwnProperty('isConnected') && !req.body.credentials) {
        console.log("This is a toggle connection request - preserving existing credentials");
        
        // SAFEGUARD: Create an update object with ONLY the isConnected field
        // This ensures we don't accidentally clear credentials
        const toggleUpdate = {
          isConnected: isConnected
        };
        
        // Update the connection
        const updatedConnection = await storage.updateApiConnection(id, toggleUpdate);
        
        if (!updatedConnection) {
          return res.status(404).json({ message: "API connection not found after toggle attempt" });
        }
        
        return res.json(updatedConnection);
      }
      
      // For credential updates, get the connection type from the existing connection
      // SAFEGUARD: Use the type from the connection we already found by ID instead of the request
      const connectionType = connectionById.type?.toLowerCase() || '';
      
      // Create a base schema for the request body
      const baseUpdateSchema = z.object({
        isConnected: z.boolean().optional(),
        credentials: z.any().optional(),
        type: z.string().optional(),
      });
      
      // Determine which credentials schema to use based on the connection type
      let updateSchema;
      if (connectionType === 'shopify') {
        updateSchema = baseUpdateSchema.extend({
          credentials: z.object({
            apiKey: z.string().min(1, "API Key is required"),
            apiSecretKey: z.string().min(1, "API Secret Key is required"),
            shopDomain: z.string().min(1, "Shop Domain is required"),
            accessToken: z.string().min(1, "Access Token is required"),
          }).optional(),
        });
      } else if (connectionType === 'slack') {
        updateSchema = baseUpdateSchema.extend({
          credentials: z.object({
            botToken: z.string().min(1, "Bot Token is required"),
            channelId: z.string().min(1, "Channel ID is required"),
            appToken: z.string().optional(),
          }).optional(),
        });
      } else if (connectionType === 'notion') {
        updateSchema = baseUpdateSchema.extend({
          credentials: z.object({
            notionToken: z.string().min(1, "Integration Token is required"),
            databaseId: z.string().optional(),
          }).optional(),
        });
      } else if (connectionType === 'klaviyo') {
        updateSchema = baseUpdateSchema.extend({
          credentials: z.object({
            apiKey: z.string().min(1, "Private API Key is required"),
            publicKey: z.string().min(1, "Public API Key is required"),
          }).optional(),
        });
      } else if (connectionType === 'openai') {
        updateSchema = baseUpdateSchema.extend({
          credentials: z.object({
            apiKey: z.string().min(1, "API Key is required"),
          }).optional(),
        });
      } else {
        // For other API types, or if type can't be determined
        updateSchema = baseUpdateSchema;
      }
      
      // Validate the request body
      const validatedData = updateSchema.parse(req.body);
      
      // SAFEGUARD: If we're updating credentials, ensure we're not accidentally clearing them
      if (validatedData.credentials && Object.keys(validatedData.credentials).length === 0) {
        console.warn("Attempted to update with empty credentials - preserving existing credentials");
        delete validatedData.credentials;
      }
      
      // If credentials is empty or not provided, don't try to update it
      // This preserves existing credentials when we're only toggling connection
      console.log("Updating connection with validated data:", JSON.stringify(validatedData));
      
      // Update the connection
      const updatedConnection = await storage.updateApiConnection(id, validatedData);
      
      if (!updatedConnection) {
        return res.status(404).json({ message: "API connection not found" });
      }
      
      console.log("Successfully updated connection:", updatedConnection.id);
      res.json(updatedConnection);
    } catch (error) {
      console.error("Error updating API connection:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update API connection", error: handleError(error) });
      }
    }
  });
  
  // Helper function to get an existing connection by ID
  async function getExistingConnection(id: string | number): Promise<ApiConnection | undefined> {
    try {
      let data;
      let error;
      
      // Check if id is a type name (like 'openai', 'slack', etc.)
      if (typeof id === 'string' && isNaN(parseInt(id, 10)) && !id.includes('-')) {
        // Look up by API type
        console.log(`Looking up connection by type: ${id}`);
        const result = await supabase
          .from(TABLES.API_CONNECTIONS)
          .select('*')
          .ilike('api_name', id)
          .limit(1);
          
        if (result.error) {
          error = result.error;
        } else if (result.data && result.data.length > 0) {
          data = result.data[0];
        }
      } else {
        // Look up by ID
        const result = await supabase
          .from(TABLES.API_CONNECTIONS)
          .select('*')
          .eq('id', id.toString())
          .single();
          
        data = result.data;
        error = result.error;
      }
        
      if (error) {
        console.error(`Error finding API connection with ID ${id}:`, error);
        return undefined;
      }
      
      if (!data) {
        return undefined;
      }
      
      // Transform from Supabase format to our schema format if needed
      if ('type' in data) {
        return data as ApiConnection;
      }
      
      return {
        id: data.id,
        name: data.api_name || '',
        type: data.api_name ? data.api_name.toLowerCase() : '',
        isConnected: data.is_connected || false,
        credentials: data.credentials || {},
        lastConnected: data.updated_at || null,
        createdAt: data.created_at || new Date().toISOString()
      } as ApiConnection;
    } catch (error) {
      console.error("Error in getExistingConnection:", error);
      return undefined;
    }
  }

  // Manual setup endpoint to create the tables directly
  router.post("/setup-database", async (req, res) => {
    try {
      console.log('Starting manual database setup...');
      
      // We're using Supabase for all database operations
      if (supabase) {
        console.log('Setting up Supabase tables...');
        
        // Use direct SQL to create tables
        const apiConnectionsSQL = `
          CREATE TABLE IF NOT EXISTS api_connections (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            is_connected BOOLEAN NOT NULL DEFAULT false,
            credentials JSONB NOT NULL DEFAULT '{}'::jsonb
          );
        `;
        
        const chatMessagesSQL = `
          CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb
          );
        `;
        
        const commandHistorySQL = `
          CREATE TABLE IF NOT EXISTS command_history (
            id SERIAL PRIMARY KEY,
            command TEXT NOT NULL,
            result JSONB NOT NULL DEFAULT '{}'::jsonb,
            status TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        
        // Try to execute the SQL statements
        try {
          console.log('Creating tables in Supabase...');
          
          // Create tables using Supabase SQL
          const createTables = async () => {
            try {
              // Use the Supabase REST API to execute SQL directly
              await supabase.rpc('exec_sql', { query: apiConnectionsSQL });
              console.log('Created api_connections table');
              
              await supabase.rpc('exec_sql', { query: chatMessagesSQL });
              console.log('Created chat_messages table');
              
              await supabase.rpc('exec_sql', { query: commandHistorySQL });
              console.log('Created command_history table');
              
              return true;
            } catch (err) {
              console.error('Error creating tables with Supabase:', err);
              return false;
            }
          };
          
          const tablesCreated = await createTables();
          
          if (tablesCreated) {
            console.log('All tables created successfully!');
            
            // Seed default data
            console.log('Seeding default data...');
            const supabaseStorage = new SupabaseStorage();
            await supabaseStorage.initializeSupabaseTables(); // This will seed default data
            
            res.json({ 
              success: true, 
              message: 'Database tables created and initialized successfully!' 
            });
          } else {
            throw new Error('Failed to create tables');
          }
        } catch (error) {
          console.error('Error creating tables:', error);
          res.status(500).json({ 
            success: false, 
            message: `Failed to create tables: ${error instanceof Error ? error.message : String(error)}` 
          });
        }
      } else {
        // We're using PostgreSQL directly
        console.log('Using direct PostgreSQL connection...');
        
        // Use the migrateTables utility
        const result = await migrateTables();
        res.json(result);
      }
    } catch (error) {
      console.error('Error in setup endpoint:', error);
      res.status(500).json({ 
        success: false, 
        message: `Setup failed: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  });
  
  // Migration endpoint to migrate data from PostgreSQL to Supabase
  router.post("/migrate-data", async (req, res) => {
    try {
      console.log('Starting data migration from PostgreSQL to Supabase...');
      
      if (!supabase) {
        return res.status(400).json({
          success: false,
          message: 'Supabase is not configured. Please provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
        });
      }
      
      // Execute the migration
      const result = await migrateTables();
      
      res.json({
        success: true,
        message: 'Data migration completed successfully',
        details: result
      });
    } catch (error) {
      console.error('Error in data migration:', error);
      res.status(500).json({
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  // Logout endpoint
  router.post("/logout", async (req: Request & { session?: session.Session & { destroy: (callback: (err?: any) => void) => void } }, res) => {
    try {
      console.log('User logging out');
      
      // Clear session if it exists
      if (req.session) {
        // Destroy the server-side session
        req.session.destroy((err) => {
          if (err) {
            console.error('Error destroying session:', err);
          }
          
          // Clear the session cookie
          res.clearCookie('connect.sid');
          
          res.json({
            success: true,
            message: 'Logged out successfully'
          });
        });
      } else {
        // No session to destroy
        res.json({
          success: true,
          message: 'Logged out successfully'
        });
      }
    } catch (error) {
      console.error('Error in logout:', error);
      res.status(500).json({
        success: false,
        message: `Logout failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });
  
  // Global in-memory storage for OpenAI key when database fails
  // Initialize if it doesn't exist
  if (typeof global.inMemoryOpenAIKey === 'undefined') {
    global.inMemoryOpenAIKey = process.env.OPENAI_API_KEY || '';
  }
  
  // Special route for OpenAI connection to work around database credential column issues
  router.post("/connect/openai", async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey || !apiKey.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: "API key is required" 
        });
      }
      
      // Validate the API key by attempting to connect to OpenAI
      try {
        const openai = new OpenAI({ apiKey });
        // Simple test call to validate the API key
        await openai.models.list();
        
        // Store the key in memory (safer than a broken DB)
        global.inMemoryOpenAIKey = apiKey;
        console.log("Valid OpenAI API key stored in memory");
        
        // Try to update the existing connection if possible, but don't fail if it doesn't work
        try {
          // Get existing OpenAI connection if any
          const existingConnection = await getExistingConnection('openai');
          
          if (existingConnection) {
            // Try to update the existing connection, but don't throw if it fails
            try {
              await storage.updateApiConnection(existingConnection.id, {
                isConnected: true,
                // Don't try to update credentials in the database since there's a column issue
              });
              console.log("Updated OpenAI connection status in DB");
            } catch (dbUpdateError) {
              console.warn("Could not update OpenAI connection in database, but key is valid and stored in memory:", dbUpdateError.message);
            }
          }
        } catch (connectionLookupError) {
          console.warn("Could not find OpenAI connection in database, but key is valid and stored in memory:", connectionLookupError.message);
        }
        
        // Instead of returning a database object that might not exist, just confirm success
        return res.json({
          success: true,
          message: "OpenAI API key validated and stored successfully. You can now use OpenAI features.",
          isConnected: true
        });
      } catch (validationError) {
        console.error('Error validating OpenAI API key:', validationError);
        return res.status(400).json({
          success: false,
          message: "Invalid OpenAI API key. Please check and try again."
        });
      }
    } catch (error) {
      console.error('Error setting up OpenAI connection:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to set up OpenAI connection", 
        error: handleError(error) 
      });
    }
  });
  
  // Get current OpenAI connection status (memory-based fallback)
  router.get("/openai-status", (req, res) => {
    const hasValidKey = !!process.env.OPENAI_API_KEY || !!global.inMemoryOpenAIKey;
    
    res.json({
      success: true,
      isConnected: hasValidKey,
      usesFallback: !process.env.OPENAI_API_KEY && !!global.inMemoryOpenAIKey
    });
  });

  // Mock mode endpoints
  router.get("/mock-mode", async (req, res) => {
    try {
      res.json({
        enabled: isMockModeEnabled()
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get mock mode status", 
        error: handleError(error) 
      });
    }
  });

  router.post("/mock-mode", async (req, res) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ message: "Missing 'enabled' boolean parameter" });
      }
      
      // Set mock mode and refresh connections
      setMockMode(enabled);
      await resetApiConnectionsForMockMode();
      
      res.json({
        enabled: isMockModeEnabled(),
        message: `Mock mode ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to set mock mode", 
        error: handleError(error) 
      });
    }
  });

  app.use("/api", router);

  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  // Map to store known user IDs to names (for Slack)
  const userIdToNameMap = new Map<string, string>([
    ['U06HWJJTW2E', 'Matt'],
    ['U08L0L7E9B6', 'Connected Chaos']
  ]);
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    // Send a welcome message
    ws.send(JSON.stringify({ 
      type: 'connection', 
      status: 'connected',
      message: 'Connected to MCP WebSocket server'
    }));
    
    // Utility function to get channel name from ID
    // Declare here so it's available in the message handlers
    async function getChannelName(slack: any, channelId: string): Promise<string> {
      try {
        // First check if it's a direct message (starts with D)
        if (channelId.startsWith('D')) {
          return 'Direct Message';
        }
        
        const result = await slack.conversations.info({ channel: channelId });
        if (result.channel && result.channel.name) {
          return result.channel.name;
        }
        return channelId; // Fallback to ID if name not found
      } catch (error) {
        console.error('Error fetching channel info:', error);
        return channelId; // Fallback to ID on error
      }
    }
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types from client
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } 
        // Request Slack messages (manual refresh)
        else if (data.type === 'request_slack_messages') {
          try {
            // Import Slack API directly because we only need it here
            const { WebClient } = await import('@slack/web-api');
            
            if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_CHANNEL_ID) {
              ws.send(JSON.stringify({
                type: 'slack_error',
                message: 'Slack credentials not configured',
                timestamp: Date.now()
              }));
              return;
            }
            
            const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
            const channelId = process.env.SLACK_CHANNEL_ID;
            
            const result = await slack.conversations.history({
              channel: channelId,
              limit: 20
            });
            
            if (result.messages && result.messages.length > 0) {
              // Transform the messages to our format
              const formattedMessages = await Promise.all(
                result.messages.map(async (msg) => {
                  // Extract as much information as we can from the message
                  let sender = 'Unknown';
                  
                  // First try to use the username if it's available (for bots and apps)
                  if (msg.username) {
                    sender = msg.username;
                  }
                  // Try to use any message profile info if available
                  else if ((msg as any).user_profile?.display_name) {
                    sender = (msg as any).user_profile.display_name;
                  }
                  // Try to use any profile real name if available
                  else if ((msg as any).user_profile?.real_name) {
                    sender = (msg as any).user_profile.real_name;
                  }
                  // Fall back to a friendly name if we have a user ID
                  else if (msg.user) {
                    // Check if we can extract a name from the user ID (Some Slack clients send this)
                    if (msg.text && msg.text.includes(`<@${msg.user}>`)) {
                      // Try to extract name from message text
                      const nameMatch = msg.text.match(/<@([A-Z0-9]+)\|([^>]+)>/);
                      if (nameMatch && nameMatch[2]) {
                        sender = nameMatch[2];
                      } else {
                        // Check our map of known user IDs first
                        if (userIdToNameMap.has(msg.user)) {
                          sender = userIdToNameMap.get(msg.user) || 'Unknown User';
                        } else {
                          // Convert Slack ID to a more friendly format
                          sender = `User-${msg.user.slice(-4)}`;
                        }
                      }
                    } else {
                      // Check our map of known user IDs first
                      if (userIdToNameMap.has(msg.user)) {
                        sender = userIdToNameMap.get(msg.user) || 'Unknown User';
                      } else {
                        // Convert Slack ID to a more friendly format
                        sender = `User-${msg.user.slice(-4)}`;
                      }
                    }
                    
                    // Only try to fetch user info if we need more information
                    try {
                      // Note: This will only work if the bot has users:read permission
                      const userInfo = await slack.users.info({ user: msg.user });
                      if (userInfo.ok && userInfo.user) {
                        if (userInfo.user.profile?.display_name && userInfo.user.profile.display_name.trim() !== '') {
                          sender = userInfo.user.profile.display_name;
                        } else if (userInfo.user.real_name && userInfo.user.real_name.trim() !== '') {
                          sender = userInfo.user.real_name;
                        } else if (userInfo.user.name) {
                          sender = userInfo.user.name;
                        }
                      }
                    } catch (error) {
                      // If we get a missing_scope error, just use our fallback and don't log
                      if (typeof error === 'object' && error !== null && 
                          'data' in error && typeof error.data === 'object' && error.data !== null &&
                          'error' in error.data && error.data.error !== 'missing_scope') {
                        console.error('Error fetching user info:', error);
                      }
                    }
                  }
                  
                  return {
                    text: msg.text || '',
                    sender: sender,
                    timestamp: msg.ts || (Date.now() / 1000).toString(),
                    reactions: msg.reactions || []
                  };
                })
              );
              
              // Send messages to the client
              ws.send(JSON.stringify({
                type: 'slack_message',
                source: 'slack_update',
                channel: channelId,
                channelName: await getChannelName(slack, channelId),
                messages: formattedMessages,
                timestamp: Date.now()
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'slack_message',
                source: 'slack_update',
                channel: channelId,
                channelName: await getChannelName(slack, channelId),
                messages: [],
                timestamp: Date.now()
              }));
            }
          } catch (error) {
            console.error('Error fetching Slack messages:', error);
            ws.send(JSON.stringify({
              type: 'slack_error',
              message: 'Failed to fetch Slack messages',
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now()
            }));
          }
        }
        // Send a message to Slack
        else if (data.type === 'send_slack_message') {
          try {
            if (!data.text || !data.channel) {
              ws.send(JSON.stringify({
                type: 'slack_error',
                message: 'Missing text or channel for Slack message',
                timestamp: Date.now()
              }));
              return;
            }
            
            // Import Slack API directly
            const { WebClient } = await import('@slack/web-api');
            
            if (!process.env.SLACK_BOT_TOKEN) {
              ws.send(JSON.stringify({
                type: 'slack_error',
                message: 'Slack credentials not configured',
                timestamp: Date.now()
              }));
              return;
            }
            
            const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
            const channelId = data.channel || process.env.SLACK_CHANNEL_ID;
            
            // Send message to Slack
            const result = await slack.chat.postMessage({
              channel: channelId,
              text: data.text,
              unfurl_links: true,
              unfurl_media: true
            });
            
            if (result.ok) {
              // Confirm message was sent
              ws.send(JSON.stringify({
                type: 'slack_message_sent',
                messageId: result.ts,
                channel: channelId,
                timestamp: Date.now()
              }));
              
              // Fetch the updated messages after sending
              setTimeout(async () => {
                try {
                  const messagesResult = await slack.conversations.history({
                    channel: channelId,
                    limit: 20
                  });
                  
                  if (messagesResult.messages && messagesResult.messages.length > 0) {
                    // Transform the messages to our format
                    const formattedMessages = await Promise.all(
                      messagesResult.messages.map(async (msg) => {
                        // Extract as much information as we can from the message
                        let sender = 'Unknown';
                        
                        // First try to use the username if it's available (for bots and apps)
                        if (msg.username) {
                          sender = msg.username;
                        }
                        // Try to use any message profile info if available
                        else if ((msg as any).user_profile?.display_name) {
                          sender = (msg as any).user_profile.display_name;
                        }
                        // Try to use any profile real name if available
                        else if ((msg as any).user_profile?.real_name) {
                          sender = (msg as any).user_profile.real_name;
                        }
                        // Fall back to a friendly name if we have a user ID
                        else if (msg.user) {
                          // Get user info from the Slack API - with better error handling
                          try {
                            // Note: This will only work if the bot has users:read permission
                            console.log(`Fetching user info for: ${msg.user}`);
                            const userInfo = await slack.users.info({ user: msg.user });
                            
                            if (userInfo.ok && userInfo.user) {
                              // More detailed logging to help debug
                              console.log(`User info for ${msg.user}:`, {
                                display_name: userInfo.user.profile?.display_name,
                                real_name: userInfo.user.real_name,
                                name: userInfo.user.name
                              });
                              
                              // Use the best name we can find
                              if (userInfo.user.profile?.display_name && userInfo.user.profile.display_name.trim() !== '') {
                                sender = userInfo.user.profile.display_name;
                              } else if (userInfo.user.real_name && userInfo.user.real_name.trim() !== '') {
                                sender = userInfo.user.real_name;
                              } else if (userInfo.user.name) {
                                sender = userInfo.user.name;
                              } else {
                                // If no name info found, check our map first
                                if (userIdToNameMap.has(msg.user)) {
                                  sender = userIdToNameMap.get(msg.user) || 'Unknown User';
                                } else {
                                  // Fallback to a friendly ID format
                                  sender = `User-${msg.user.slice(-4)}`;
                                }
                              }
                            } else {
                              // Log failed info request and use a friendly format 
                              console.log(`Failed to get user info for ${msg.user}:`, userInfo);
                              // Check our map first for known users
                              if (userIdToNameMap.has(msg.user)) {
                                sender = userIdToNameMap.get(msg.user) || 'Unknown User';
                              } else {
                                // Fallback to a friendly ID format
                                sender = `User-${msg.user.slice(-4)}`;
                              }
                            }
                          } catch (error) {
                            // Better error handling with logs
                            if (typeof error === 'object' && error !== null && 
                                'data' in error && typeof error.data === 'object' && error.data !== null &&
                                'error' in error.data) {
                              if (error.data.error === 'missing_scope') {
                                console.warn(`Missing permission scope to get user info. Need users:read permission for ${msg.user}`);
                                // Use our predefined map of user IDs to names if available
                                if (userIdToNameMap.has(msg.user)) {
                                  sender = userIdToNameMap.get(msg.user) || 'Unknown User';
                                } else {
                                  // Fallback to a more friendly ID format
                                  sender = `User-${msg.user.slice(-4)}`;
                                }
                              } else {
                                console.error('Error fetching user info:', error);
                                // Use our predefined map of user IDs to names if available
                                if (userIdToNameMap.has(msg.user)) {
                                  sender = userIdToNameMap.get(msg.user) || 'Unknown User';
                                } else {
                                  // Fallback to a more friendly ID format
                                  sender = `User-${msg.user.slice(-4)}`;
                                }
                              }
                            } else {
                              console.error('Unknown error fetching user info:', error);
                              // Use our predefined map of user IDs to names if available
                              if (userIdToNameMap.has(msg.user)) {
                                sender = userIdToNameMap.get(msg.user) || 'Unknown User';
                              } else {
                                // Fallback to a more friendly ID format
                                sender = `User-${msg.user.slice(-4)}`;
                              }
                            }
                          }
                        }
                        
                        return {
                          text: msg.text || '',
                          sender: sender,
                          timestamp: msg.ts || (Date.now() / 1000).toString(),
                          reactions: msg.reactions || []
                        };
                      })
                    );
                    
                    // Send updated messages to all clients
                    broadcastMessage({
                      type: 'slack_message',
                      source: 'slack_update',
                      channel: channelId,
                      channelName: await getChannelName(slack, channelId),
                      messages: formattedMessages,
                      timestamp: Date.now()
                    });
                  }
                } catch (error) {
                  console.error('Error fetching updated Slack messages:', error);
                }
              }, 1000); // Wait 1 second before refreshing messages
            } else {
              ws.send(JSON.stringify({
                type: 'slack_error',
                message: 'Failed to send Slack message',
                error: 'API reported failure',
                timestamp: Date.now()
              }));
            }
          } catch (error) {
            console.error('Error sending Slack message:', error);
            ws.send(JSON.stringify({
              type: 'slack_error',
              message: 'Failed to send Slack message',
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now()
            }));
          }
        }
        // Request Klaviyo campaigns data
        else if (data.type === 'request_klaviyo_campaigns') {
          try {
            // Import the Klaviyo MCP client
            const { klaviyoMcpClient } = await import('./integrations/klaviyoMcp');
            
            // Check if the client is initialized
            if (!klaviyoMcpClient.isInitialized()) {
              await klaviyoMcpClient.initialize();
            }
            
            // Get campaigns from Klaviyo
            const result = await klaviyoMcpClient.getCampaigns({
              limit: data.limit || 20
            });
            
            // Send campaigns to the client
            ws.send(JSON.stringify({
              type: 'klaviyo_campaigns',
              source: 'klaviyo_update',
              campaigns: result.data?.campaigns || [],
              success: result.success,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.error('Error fetching Klaviyo campaigns:', error);
            ws.send(JSON.stringify({
              type: 'klaviyo_error',
              message: 'Failed to fetch Klaviyo campaigns',
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now()
            }));
          }
        }
        // Request Klaviyo segments data
        else if (data.type === 'request_klaviyo_segments') {
          try {
            // Import the Klaviyo MCP client
            const { klaviyoMcpClient } = await import('./integrations/klaviyoMcp');
            
            // Check if the client is initialized
            if (!klaviyoMcpClient.isInitialized()) {
              await klaviyoMcpClient.initialize();
            }
            
            // Get segments from Klaviyo
            const result = await klaviyoMcpClient.getSegments({
              limit: data.limit || 20
            });
            
            // Send segments to the client
            ws.send(JSON.stringify({
              type: 'klaviyo_segments',
              source: 'klaviyo_update',
              segments: result.data?.segments || [],
              success: result.success,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.error('Error fetching Klaviyo segments:', error);
            ws.send(JSON.stringify({
              type: 'klaviyo_error',
              message: 'Failed to fetch Klaviyo segments',
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now()
            }));
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle WebSocket close event
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
    
    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      // Don't delete the client here, wait for the close event
    });
    
    // Send a ping every 30 seconds to keep the connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });
  
  // Function to broadcast message to all connected clients
  const broadcastMessage = (message: any) => {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  };
  
  // Export the broadcast functions so they can be used from service integrations
  (global as any).broadcastSlackMessage = (message: any) => {
    broadcastMessage({
      type: 'slack_message',
      timestamp: Date.now(),
      ...message // Spread the message properties directly
    });
  };
  
  // Add broadcast capability for Klaviyo as well
  (global as any).broadcastKlaviyoUpdate = (message: any) => {
    broadcastMessage({
      type: 'klaviyo_update',
      timestamp: Date.now(),
      ...message // Spread the message properties directly
    });
  };
  
  return httpServer;
}
