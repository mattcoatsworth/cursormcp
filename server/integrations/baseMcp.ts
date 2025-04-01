import OpenAI from "openai";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import crossSpawn from "cross-spawn";
import { storage } from "../storage";

/**
 * Base interface for MCP command results
 */
export interface McpCommandResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
}

/**
 * Interface for MCP credential configurations
 */
export interface McpCredentials {
  [key: string]: string | undefined;
}

/**
 * Base class for MCP clients
 */
export abstract class BaseMcpClient {
  protected initialized: boolean = false;
  protected initializing: boolean = false;
  protected openai: OpenAI | null = null;
  protected credentials: McpCredentials = {};
  protected serviceType: string;

  constructor(serviceType: string) {
    this.serviceType = serviceType;
  }

  /**
   * Initialize the MCP client
   */
  async initialize(): Promise<void> {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;

    try {
      // Get API connection from database
      const serviceConnection = await storage.getApiConnectionByType(this.serviceType);
      
      if (!serviceConnection || !serviceConnection.isConnected) {
        throw new Error(`${this.serviceType} API is not connected. Please connect it first.`);
      }
      
      // Extract credentials from the connection
      const connectionCredentials = serviceConnection.credentials as any;
      
      if (!connectionCredentials) {
        throw new Error(`${this.serviceType} API credentials not found. Please reconnect the API.`);
      }

      // Initialize credentials - specific implementations will validate these
      this.credentials = this.extractCredentials(connectionCredentials);

      // Initialize OpenAI for fallback functionality if needed
      // First try environment variable
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      } else {
        // Then try to get from API connections
        try {
          const openaiConnection = await storage.getApiConnectionByType("openai");
          if (openaiConnection && openaiConnection.isConnected && 
              openaiConnection.credentials && openaiConnection.credentials.apiKey) {
            this.openai = new OpenAI({ apiKey: openaiConnection.credentials.apiKey as string });
            console.log(`${this.serviceType} MCP client using OpenAI API key from database connection`);
          } else {
            console.warn("OpenAI API key not found in environment or database. Using basic fallback implementations.");
          }
        } catch (connectionError) {
          console.warn("Could not get OpenAI connection from database:", connectionError);
        }
      }

      // Perform service-specific initialization
      await this.serviceInitialize();

      this.initialized = true;
      console.log(`${this.serviceType} MCP client initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize ${this.serviceType} MCP client:`, error);
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Check if a server executable exists at the given path
   */
  protected checkServerExecutable(serverPath: string): boolean {
    return fs.existsSync(serverPath);
  }

  /**
   * Get environment variables for MCP server process
   */
  protected getServerEnvironment(): NodeJS.ProcessEnv {
    return {
      ...process.env,
      ...this.credentials
    };
  }

  /**
   * Extract credentials from API connection
   */
  protected abstract extractCredentials(connectionCredentials: any): McpCredentials;

  /**
   * Service-specific initialization
   */
  protected abstract serviceInitialize(): Promise<void>;
}