import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import path from "path";
import fs from "fs";
import axios from "axios";

/**
 * Notion-specific MCP command result
 */
export interface NotionCommandResult extends McpCommandResult {
  data?: {
    pages?: any[];
    blocks?: any[];
    databases?: any[];
    page?: any;
    database?: any;
    block?: any;
    nextCursor?: string;
    hasNextPage?: boolean;
  };
}

/**
 * Notion MCP client implementation
 */
export class NotionMcpClient extends BaseMcpClient {
  private notionToken: string | null = null;

  constructor() {
    super("notion");
  }

  /**
   * Extract Notion credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    if (!connectionCredentials.notionToken) {
      throw new Error("Notion token not found. Please reconnect the Notion API.");
    }

    // Return credentials in environment variable format for MCP server
    return {
      NOTION_TOKEN: connectionCredentials.notionToken
    };
  }

  /**
   * Initialize Notion-specific functionality
   */
  protected async serviceInitialize(): Promise<void> {
    // Initialize the Notion client
    if (!this.credentials.NOTION_TOKEN) {
      throw new Error("Notion token not available. Cannot initialize Notion client.");
    }

    this.notionToken = this.credentials.NOTION_TOKEN;
    console.log("Notion MCP client initialized successfully");
  }

  /**
   * Get a list of databases
   */
  async listDatabases(limit: number = 10, cursor?: string): Promise<NotionCommandResult> {
    await this.initialize();

    if (!this.notionToken) {
      return {
        success: false,
        message: "Notion client not initialized",
        error: new Error("Notion client not initialized")
      };
    }

    try {
      // Using the GitHub MCP server for Notion
      const serverPath = path.join(process.cwd(), 'mcp-notion-server', 'notionServer.js');
      
      // If server executable exists, use it
      if (this.checkServerExecutable(serverPath)) {
        const result = await this.runServerCommand('list_databases', {
          limit,
          cursor
        });
        
        return result;
      }
      
      // Otherwise use direct API call as fallback
      const response = await axios.get('https://api.notion.com/v1/databases', {
        headers: {
          'Authorization': `Bearer ${this.notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        params: {
          page_size: limit,
          start_cursor: cursor
        }
      });

      const data = response.data;
      
      return {
        success: true,
        message: `Retrieved ${data.results.length} databases`,
        data: {
          databases: data.results,
          hasNextPage: data.has_more,
          nextCursor: data.next_cursor
        }
      };
    } catch (error: any) {
      console.error("Error listing Notion databases:", error);
      return {
        success: false,
        message: `Failed to list databases: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get pages from a database
   */
  async queryDatabase(
    databaseId: string, 
    filter?: any, 
    sorts?: any[], 
    limit: number = 10, 
    cursor?: string
  ): Promise<NotionCommandResult> {
    await this.initialize();

    if (!this.notionToken) {
      return {
        success: false,
        message: "Notion client not initialized",
        error: new Error("Notion client not initialized")
      };
    }

    try {
      // Using the GitHub MCP server for Notion
      const serverPath = path.join(process.cwd(), 'mcp-notion-server', 'notionServer.js');
      
      // If server executable exists, use it
      if (this.checkServerExecutable(serverPath)) {
        const result = await this.runServerCommand('query_database', {
          databaseId,
          filter,
          sorts,
          limit,
          cursor
        });
        
        return result;
      }
      
      // Otherwise use direct API call as fallback
      const response = await axios.post(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        filter,
        sorts,
        page_size: limit,
        start_cursor: cursor
      }, {
        headers: {
          'Authorization': `Bearer ${this.notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      return {
        success: true,
        message: `Retrieved ${data.results.length} pages from database`,
        data: {
          pages: data.results,
          hasNextPage: data.has_more,
          nextCursor: data.next_cursor
        }
      };
    } catch (error: any) {
      console.error("Error querying Notion database:", error);
      return {
        success: false,
        message: `Failed to query database: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get a database by ID
   */
  async getDatabase(databaseId: string): Promise<NotionCommandResult> {
    await this.initialize();

    if (!this.notionToken) {
      return {
        success: false,
        message: "Notion client not initialized",
        error: new Error("Notion client not initialized")
      };
    }

    try {
      // Using the GitHub MCP server for Notion
      const serverPath = path.join(process.cwd(), 'mcp-notion-server', 'notionServer.js');
      
      // If server executable exists, use it
      if (this.checkServerExecutable(serverPath)) {
        const result = await this.runServerCommand('get_database', {
          databaseId
        });
        
        return result;
      }
      
      // Otherwise use direct API call as fallback
      const response = await axios.get(`https://api.notion.com/v1/databases/${databaseId}`, {
        headers: {
          'Authorization': `Bearer ${this.notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      return {
        success: true,
        message: `Retrieved database ${data.title?.[0]?.plain_text || databaseId}`,
        data: {
          database: data
        }
      };
    } catch (error: any) {
      console.error("Error getting Notion database:", error);
      return {
        success: false,
        message: `Failed to get database: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get a page by ID
   */
  async getPage(pageId: string): Promise<NotionCommandResult> {
    await this.initialize();

    if (!this.notionToken) {
      return {
        success: false,
        message: "Notion client not initialized",
        error: new Error("Notion client not initialized")
      };
    }

    try {
      // Using the GitHub MCP server for Notion
      const serverPath = path.join(process.cwd(), 'mcp-notion-server', 'notionServer.js');
      
      // If server executable exists, use it
      if (this.checkServerExecutable(serverPath)) {
        const result = await this.runServerCommand('get_page', {
          pageId
        });
        
        return result;
      }
      
      // Otherwise use direct API call as fallback
      const response = await axios.get(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: {
          'Authorization': `Bearer ${this.notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      return {
        success: true,
        message: `Retrieved page ${pageId}`,
        data: {
          page: data
        }
      };
    } catch (error: any) {
      console.error("Error getting Notion page:", error);
      return {
        success: false,
        message: `Failed to get page: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Create a page in a database
   */
  async createPage(
    databaseId: string, 
    properties: any, 
    children?: any[]
  ): Promise<NotionCommandResult> {
    await this.initialize();

    if (!this.notionToken) {
      return {
        success: false,
        message: "Notion client not initialized",
        error: new Error("Notion client not initialized")
      };
    }

    try {
      // Using the GitHub MCP server for Notion
      const serverPath = path.join(process.cwd(), 'mcp-notion-server', 'notionServer.js');
      
      // If server executable exists, use it
      if (this.checkServerExecutable(serverPath)) {
        const result = await this.runServerCommand('create_page', {
          databaseId,
          properties,
          children
        });
        
        return result;
      }
      
      // Otherwise use direct API call as fallback
      const payload: any = {
        parent: { database_id: databaseId },
        properties
      };
      
      if (children && children.length > 0) {
        payload.children = children;
      }
      
      const response = await axios.post('https://api.notion.com/v1/pages', payload, {
        headers: {
          'Authorization': `Bearer ${this.notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      return {
        success: true,
        message: `Created page in database ${databaseId}`,
        data: {
          page: data
        }
      };
    } catch (error: any) {
      console.error("Error creating Notion page:", error);
      return {
        success: false,
        message: `Failed to create page: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Update a page
   */
  async updatePage(
    pageId: string, 
    properties: any
  ): Promise<NotionCommandResult> {
    await this.initialize();

    if (!this.notionToken) {
      return {
        success: false,
        message: "Notion client not initialized",
        error: new Error("Notion client not initialized")
      };
    }

    try {
      // Using the GitHub MCP server for Notion
      const serverPath = path.join(process.cwd(), 'mcp-notion-server', 'notionServer.js');
      
      // If server executable exists, use it
      if (this.checkServerExecutable(serverPath)) {
        const result = await this.runServerCommand('update_page', {
          pageId,
          properties
        });
        
        return result;
      }
      
      // Otherwise use direct API call as fallback
      const response = await axios.patch(`https://api.notion.com/v1/pages/${pageId}`, {
        properties
      }, {
        headers: {
          'Authorization': `Bearer ${this.notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      return {
        success: true,
        message: `Updated page ${pageId}`,
        data: {
          page: data
        }
      };
    } catch (error: any) {
      console.error("Error updating Notion page:", error);
      return {
        success: false,
        message: `Failed to update page: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get block children
   */
  async getBlockChildren(
    blockId: string, 
    limit: number = 10, 
    cursor?: string
  ): Promise<NotionCommandResult> {
    await this.initialize();

    if (!this.notionToken) {
      return {
        success: false,
        message: "Notion client not initialized",
        error: new Error("Notion client not initialized")
      };
    }

    try {
      // Using the GitHub MCP server for Notion
      const serverPath = path.join(process.cwd(), 'mcp-notion-server', 'notionServer.js');
      
      // If server executable exists, use it
      if (this.checkServerExecutable(serverPath)) {
        const result = await this.runServerCommand('get_block_children', {
          blockId,
          limit,
          cursor
        });
        
        return result;
      }
      
      // Otherwise use direct API call as fallback
      const response = await axios.get(`https://api.notion.com/v1/blocks/${blockId}/children`, {
        headers: {
          'Authorization': `Bearer ${this.notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        params: {
          page_size: limit,
          start_cursor: cursor
        }
      });

      const data = response.data;
      
      return {
        success: true,
        message: `Retrieved ${data.results.length} block children`,
        data: {
          blocks: data.results,
          hasNextPage: data.has_more,
          nextCursor: data.next_cursor
        }
      };
    } catch (error: any) {
      console.error("Error getting Notion block children:", error);
      return {
        success: false,
        message: `Failed to get block children: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Run a command through the MCP server
   */
  private async runServerCommand(command: string, params: any): Promise<NotionCommandResult> {
    try {
      // Ensure we're using the latest server executable
      const serverPath = path.join(process.cwd(), 'mcp-notion-server', 'notionServer.js');
      
      if (!this.checkServerExecutable(serverPath)) {
        throw new Error(`Notion MCP server executable not found at ${serverPath}`);
      }
      
      // Prepare the environment for the child process
      const env = this.getServerEnvironment();

      // Execute the command via MCP server
      const { spawn } = require('cross-spawn');
      const child = spawn('node', [serverPath, command, JSON.stringify(params)], {
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      return new Promise((resolve, reject) => {
        let stdoutData = '';
        let stderrData = '';
        
        child.stdout.on('data', (data: Buffer) => {
          stdoutData += data.toString();
        });
        
        child.stderr.on('data', (data: Buffer) => {
          stderrData += data.toString();
        });
        
        child.on('close', (code: number) => {
          if (code !== 0) {
            console.error(`Notion MCP server exited with code ${code}`);
            console.error(`stderr: ${stderrData}`);
            
            reject(new Error(`Notion MCP server command failed: ${stderrData || 'Unknown error'}`));
            return;
          }
          
          try {
            const result = JSON.parse(stdoutData);
            resolve({
              success: true,
              message: result.message || `Successfully executed ${command}`,
              data: result.data
            });
          } catch (err: any) {
            reject(new Error(`Failed to parse Notion MCP server response: ${err.message}`));
          }
        });
        
        child.on('error', (err: Error) => {
          reject(new Error(`Failed to execute Notion MCP server: ${err.message}`));
        });
      });
    } catch (error: any) {
      console.error("Error running Notion MCP server command:", error);
      return {
        success: false,
        message: `Failed to run Notion MCP server command: ${error.message}`,
        error: error
      };
    }
  }
}

// Create a singleton instance
const notionMcpClient = new NotionMcpClient();

/**
 * Process commands related to Notion using the MCP client
 */
export async function processNotionMcpCommand(
  command: string,
  classification: any
): Promise<NotionCommandResult> {
  try {
    // Map between our classification intents and MCP client methods
    switch (classification.intent) {
      case "list_databases":
        const listLimit = classification.parameters.limit || 10;
        const listCursor = classification.parameters.cursor;
        
        return await notionMcpClient.listDatabases(listLimit, listCursor);
        
      case "query_database":
      case "get_database_pages":
        const databaseId = classification.parameters.databaseId;
        const filter = classification.parameters.filter;
        const sorts = classification.parameters.sorts;
        const queryLimit = classification.parameters.limit || 10;
        const queryCursor = classification.parameters.cursor;
        
        if (!databaseId) {
          return {
            success: false,
            message: "Database ID is required but was not provided",
            error: new Error("Database ID is required")
          };
        }
        
        return await notionMcpClient.queryDatabase(
          databaseId, 
          filter,
          sorts,
          queryLimit,
          queryCursor
        );
        
      case "get_database":
        const getDatabaseId = classification.parameters.databaseId;
        
        if (!getDatabaseId) {
          return {
            success: false,
            message: "Database ID is required but was not provided",
            error: new Error("Database ID is required")
          };
        }
        
        return await notionMcpClient.getDatabase(getDatabaseId);
        
      case "get_page":
        const pageId = classification.parameters.pageId;
        
        if (!pageId) {
          return {
            success: false,
            message: "Page ID is required but was not provided",
            error: new Error("Page ID is required")
          };
        }
        
        return await notionMcpClient.getPage(pageId);
        
      case "create_page":
        const createDatabaseId = classification.parameters.databaseId;
        const properties = classification.parameters.properties;
        const children = classification.parameters.children;
        
        if (!createDatabaseId) {
          return {
            success: false,
            message: "Database ID is required but was not provided",
            error: new Error("Database ID is required")
          };
        }
        
        if (!properties) {
          return {
            success: false,
            message: "Page properties are required but were not provided",
            error: new Error("Page properties are required")
          };
        }
        
        return await notionMcpClient.createPage(createDatabaseId, properties, children);
        
      case "update_page":
        const updatePageId = classification.parameters.pageId;
        const updateProperties = classification.parameters.properties;
        
        if (!updatePageId) {
          return {
            success: false,
            message: "Page ID is required but was not provided",
            error: new Error("Page ID is required")
          };
        }
        
        if (!updateProperties) {
          return {
            success: false,
            message: "Page properties are required but were not provided",
            error: new Error("Page properties are required")
          };
        }
        
        return await notionMcpClient.updatePage(updatePageId, updateProperties);
        
      case "get_block_children":
        const blockId = classification.parameters.blockId;
        const blockLimit = classification.parameters.limit || 10;
        const blockCursor = classification.parameters.cursor;
        
        if (!blockId) {
          return {
            success: false,
            message: "Block ID is required but was not provided",
            error: new Error("Block ID is required")
          };
        }
        
        return await notionMcpClient.getBlockChildren(blockId, blockLimit, blockCursor);
        
      default:
        return {
          success: false,
          message: `Unsupported Notion command intent: ${classification.intent}`,
          error: new Error(`Unsupported Notion command intent: ${classification.intent}`)
        };
    }
  } catch (error: any) {
    console.error("Error processing Notion command:", error);
    return {
      success: false,
      message: `Error processing Notion command: ${error.message}`,
      error: error
    };
  }
}

export { notionMcpClient };