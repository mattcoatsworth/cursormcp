#!/usr/bin/env node

/**
 * Notion MCP Server
 * 
 * A bridge between the MCP and the Notion API
 */

// Check if NOTION_TOKEN is available
if (!process.env.NOTION_TOKEN) {
  console.error("NOTION_TOKEN environment variable is required");
  process.exit(1);
}

// Get command line arguments
const command = process.argv[2];
const paramsJson = process.argv[3];

if (!command) {
  console.error("Command argument is required");
  process.exit(1);
}

// Parse params if provided
let params = {};
if (paramsJson) {
  try {
    params = JSON.parse(paramsJson);
  } catch (error) {
    console.error("Failed to parse params JSON:", error.message);
    process.exit(1);
  }
}

// Import the Notion Client
const { Client } = require('@notionhq/client');

// Initialize Notion client with the token from environment variable
const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

/**
 * List databases
 */
async function listDatabases(params = {}) {
  const { limit = 10, cursor } = params;
  
  try {
    const response = await notion.databases.list({
      page_size: limit,
      start_cursor: cursor
    });
    
    return {
      data: {
        databases: response.results,
        hasNextPage: response.has_more,
        nextCursor: response.next_cursor
      }
    };
  } catch (error) {
    console.error("Error listing databases:", error.message);
    throw error;
  }
}

/**
 * Query a database
 */
async function queryDatabase(params = {}) {
  const { databaseId, filter, sorts, limit = 10, cursor } = params;
  
  if (!databaseId) {
    throw new Error("Database ID is required");
  }
  
  try {
    const queryParams = {
      database_id: databaseId,
      page_size: limit
    };
    
    if (filter) {
      queryParams.filter = filter;
    }
    
    if (sorts) {
      queryParams.sorts = sorts;
    }
    
    if (cursor) {
      queryParams.start_cursor = cursor;
    }
    
    const response = await notion.databases.query(queryParams);
    
    return {
      data: {
        pages: response.results,
        hasNextPage: response.has_more,
        nextCursor: response.next_cursor
      }
    };
  } catch (error) {
    console.error("Error querying database:", error.message);
    throw error;
  }
}

/**
 * Get a database by ID
 */
async function getDatabase(params = {}) {
  const { databaseId } = params;
  
  if (!databaseId) {
    throw new Error("Database ID is required");
  }
  
  try {
    const response = await notion.databases.retrieve({
      database_id: databaseId
    });
    
    return {
      data: {
        database: response
      }
    };
  } catch (error) {
    console.error("Error getting database:", error.message);
    throw error;
  }
}

/**
 * Get a page by ID
 */
async function getPage(params = {}) {
  const { pageId } = params;
  
  if (!pageId) {
    throw new Error("Page ID is required");
  }
  
  try {
    const response = await notion.pages.retrieve({
      page_id: pageId
    });
    
    return {
      data: {
        page: response
      }
    };
  } catch (error) {
    console.error("Error getting page:", error.message);
    throw error;
  }
}

/**
 * Create a page in a database
 */
async function createPage(params = {}) {
  const { databaseId, properties, children } = params;
  
  if (!databaseId) {
    throw new Error("Database ID is required");
  }
  
  if (!properties) {
    throw new Error("Page properties are required");
  }
  
  try {
    const createParams = {
      parent: {
        database_id: databaseId
      },
      properties
    };
    
    if (children && children.length > 0) {
      createParams.children = children;
    }
    
    const response = await notion.pages.create(createParams);
    
    return {
      data: {
        page: response
      }
    };
  } catch (error) {
    console.error("Error creating page:", error.message);
    throw error;
  }
}

/**
 * Update a page
 */
async function updatePage(params = {}) {
  const { pageId, properties } = params;
  
  if (!pageId) {
    throw new Error("Page ID is required");
  }
  
  if (!properties) {
    throw new Error("Page properties are required");
  }
  
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      properties
    });
    
    return {
      data: {
        page: response
      }
    };
  } catch (error) {
    console.error("Error updating page:", error.message);
    throw error;
  }
}

/**
 * Get block children
 */
async function getBlockChildren(params = {}) {
  const { blockId, limit = 10, cursor } = params;
  
  if (!blockId) {
    throw new Error("Block ID is required");
  }
  
  try {
    const queryParams = {
      block_id: blockId,
      page_size: limit
    };
    
    if (cursor) {
      queryParams.start_cursor = cursor;
    }
    
    const response = await notion.blocks.children.list(queryParams);
    
    return {
      data: {
        blocks: response.results,
        hasNextPage: response.has_more,
        nextCursor: response.next_cursor
      }
    };
  } catch (error) {
    console.error("Error getting block children:", error.message);
    throw error;
  }
}

// Command router
async function executeCommand() {
  try {
    let result;
    
    switch (command) {
      case 'list_databases':
        result = await listDatabases(params);
        break;
      case 'query_database':
        result = await queryDatabase(params);
        break;
      case 'get_database':
        result = await getDatabase(params);
        break;
      case 'get_page':
        result = await getPage(params);
        break;
      case 'create_page':
        result = await createPage(params);
        break;
      case 'update_page':
        result = await updatePage(params);
        break;
      case 'get_block_children':
        result = await getBlockChildren(params);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
    
    // Output result as JSON
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

// Run the command
executeCommand();