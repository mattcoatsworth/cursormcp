import OpenAI from "openai";
import { storage } from "../storage";

// Initialize OpenAI client with fallback for missing API key
let openai: OpenAI | null = null;

// This declaration allows us to access the in-memory key from routes.ts
declare global {
  var inMemoryOpenAIKey: string;
}

// Initialize the global variable if it doesn't exist
if (typeof global.inMemoryOpenAIKey === 'undefined') {
  global.inMemoryOpenAIKey = '';
}

async function initOpenAI() {
  try {
    // First try to get API key from environment variable
    if (process.env.OPENAI_API_KEY) {
      openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log("OpenAI initialized with API key from environment variable");
      return;
    }
    
    // Check if we have an in-memory key (from settings page)
    if (global.inMemoryOpenAIKey) {
      openai = new OpenAI({ apiKey: global.inMemoryOpenAIKey });
      console.log("OpenAI initialized with in-memory API key");
      return;
    }
    
    // If not available in environment or memory, try to get from API connections
    try {
      const openaiConnection = await storage.getApiConnectionByType("openai");
      if (openaiConnection && openaiConnection.isConnected && 
          openaiConnection.credentials && openaiConnection.credentials.apiKey) {
        openai = new OpenAI({ apiKey: openaiConnection.credentials.apiKey as string });
        console.log("OpenAI initialized with API key from database connection");
        return;
      }
    } catch (connectionError) {
      console.warn("Could not get OpenAI connection from database:", connectionError);
    }
    
    console.warn("OpenAI API key not found in environment, memory, or database. OpenAI features will be disabled.");
  } catch (error) {
    console.error("Error initializing OpenAI client:", error);
  }
}

// Initialize OpenAI
initOpenAI().catch(err => {
  console.error("Failed to initialize OpenAI:", err);
});

// Helper function to truncate API responses for OpenAI to prevent token limit errors
function truncateApiResponse(data: any): any {
  if (!data) return data;
  
  // Create a deep copy
  const result = JSON.parse(JSON.stringify(data));
  
  // If there's orders data, limit it
  if (result.data && result.data.orders && Array.isArray(result.data.orders)) {
    const totalOrders = result.data.orders.length;
    
    // Only keep essential order information for first 10 orders
    result.data.orders = result.data.orders.slice(0, 10).map((order: any) => ({
      id: order.id,
      order_number: order.order_number || order.name,
      created_at: order.created_at,
      total_price: order.total_price,
      currency: order.currency,
      financial_status: order.financial_status,
      customer: order.customer ? { 
        id: order.customer.id,
        email: order.customer.email,
        name: `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
      } : null,
      line_items_count: order.line_items ? order.line_items.length : 0,
    }));
    
    // Add a summary if there are more orders
    if (totalOrders > 10) {
      result.summary = `Showing 10 of ${totalOrders} orders. Use parameters to narrow your search.`;
    }
  }
  
  // If there's products data, limit it
  if (result.data && result.data.products && Array.isArray(result.data.products)) {
    const totalProducts = result.data.products.length;
    
    // Only keep essential product information for first 10 products
    result.data.products = result.data.products.slice(0, 10).map((product: any) => ({
      id: product.id,
      title: product.title,
      created_at: product.created_at,
      product_type: product.product_type,
      vendor: product.vendor,
      status: product.status,
      variants_count: product.variants ? product.variants.length : 0,
    }));
    
    // Add a summary if there are more products
    if (totalProducts > 10) {
      result.summary = `Showing 10 of ${totalProducts} products. Use parameters to narrow your search.`;
    }
  }
  
  return result;
}

// Define classification schema
interface CommandClassification {
  intent: string;
  primaryService: string;
  secondaryServices?: string[];
  parameters: Record<string, any>;
  confidence: number;
}

/**
 * Classify a user command using OpenAI
 */
export async function classifyCommand(command: string): Promise<CommandClassification> {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      console.warn("OpenAI client not initialized. Returning fallback classification.");
      return {
        intent: "echo",
        primaryService: "system",
        secondaryServices: [],
        parameters: { message: command },
        confidence: 0.1
      };
    }

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a command classifier for a Multi-Channel Platform. 
          Your job is to analyze user commands and determine:
          1. The primary intent of the command
          2. Which API service should be used (shopify, klaviyo, postscript, northbeam, slack, notion, chatgpt, openai)
          3. Any parameters needed to execute the command
          
          ROUTING INSTRUCTIONS:
          - If the command doesn't clearly mention any specific service, use "openai" as the primaryService.
          - If the command is a general question or conversation without a specific API action, use "openai" as the primaryService.
          - Only classify commands for specific services (shopify, klaviyo, etc.) when the user explicitly mentions them.
          
          IMPORTANT: The platform supports multi-service commands where a single instruction can interact with multiple APIs simultaneously.
          - When a command mentions multiple services (e.g., "get shopify sales and send to slack, then update a notion page"), you MUST identify ALL services involved.
          - Use the 'primaryService' field for the main service being called
          - Use the 'secondaryServices' array for ALL other services mentioned in the command
          - Be generous in identifying secondary services - any service mentioned in the command should be included
          
          TIME-SPECIFIC INSTRUCTIONS:
          - When a command specifically asks for "today's data", "sales today", or any other data for the current day, ALWAYS set both:
            1. "time_period": "today"
            2. "today": true
          - For commands like "show me the total sales today" or "get today's Shopify orders", these parameters MUST be included.
          - This ensures proper time filtering from 12:01 AM today to the current moment when the command is issued.
          
          Examples of multi-service commands:
          1. "Get Shopify sales for last week and create a Notion page with the data" 
             (primaryService: "shopify", secondaryServices: ["notion"])
          2. "Fetch customer data from Klaviyo, check engagement in Northbeam, and send a summary to Slack" 
             (primaryService: "klaviyo", secondaryServices: ["northbeam", "slack"])
          3. "Get Shopify products, post a message to Slack, and update our Notion database"
             (primaryService: "shopify", secondaryServices: ["slack", "notion"])
          4. "Show me the total sales today from Shopify"
             (primaryService: "shopify", parameters: {"time_period": "today", "today": true})
          5. "What's the weather like today?"
             (primaryService: "openai", intent: "general_question")
          6. "Tell me about the history of artificial intelligence"
             (primaryService: "openai", intent: "general_question")
          
          Return your analysis as a JSON object with these fields:
          - intent: a short string describing the primary action (e.g. "get_sales", "create_campaign", "send_message", "general_question")
          - primaryService: the main service needed (e.g. "shopify", "klaviyo", "slack", "openai")
          - secondaryServices: array of other services that are involved (e.g. ["slack", "notion"])
          - parameters: an object with any parameters extracted from the command
          - confidence: a number from 0 to 1 indicating how confident you are in this classification`
        },
        {
          role: "user",
          content: command || ""
        }
      ],
      response_format: { type: "json_object" }
    });

    const responseContent = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(responseContent);
    
    return {
      intent: result.intent || "unknown",
      primaryService: result.primaryService || "unknown",
      secondaryServices: result.secondaryServices || [],
      parameters: result.parameters || {},
      confidence: result.confidence || 0.5
    };
  } catch (error: any) {
    console.error("Error classifying command:", error);
    // Return a fallback classification rather than throwing
    return {
      intent: "error",
      primaryService: "system",
      secondaryServices: [],
      parameters: { error: error?.message || "Unknown error" },
      confidence: 0
    };
  }
}

/**
 * Generate a formatted response based on command results
 */
/**
 * Generate a data visualization (chart/graph) from Shopify data
 */
export async function generateDataVisualization(data: any, type: string = 'line'): Promise<string> {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      console.warn("OpenAI client not initialized. Cannot generate visualization.");
      return "Unable to generate visualization: OpenAI API key is not configured.";
    }

    // Extract and prepare data for visualization
    const orders = data?.data?.orders || [];
    
    if (orders.length === 0) {
      return "No data available to create a visualization.";
    }

    // Process orders to extract date and sales information
    const salesByDate: {[key: string]: number} = {};
    
    // Sort orders by date first
    const sortedOrders = [...orders].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    // Group sales by day
    sortedOrders.forEach(order => {
      try {
        const date = new Date(order.created_at);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!salesByDate[dateStr]) {
          salesByDate[dateStr] = 0;
        }
        
        const amount = parseFloat(order.total_price || '0');
        if (!isNaN(amount)) {
          salesByDate[dateStr] += amount;
        }
      } catch (err) {
        console.error("Error processing order:", err, order);
        // Continue processing other orders
      }
    });

    // Convert to arrays for easier processing in prompt
    const dates = Object.keys(salesByDate);
    const sales = Object.values(salesByDate);
    
    if (dates.length === 0) {
      return "No valid sales data available to create a visualization.";
    }
    
    // Get date range for the title
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    const totalSales = sales.reduce((sum, val) => sum + val, 0).toFixed(2);
    
    // Create sample data if needed (this is only for formatting purposes)
    let sampleData = '';
    if (dates.length > 10) {
      // If we have a lot of dates, just show a subset
      sampleData = dates.slice(0, 10).map((date, i) => `${date}: $${sales[i].toFixed(2)}`).join('\n') + 
        `\n... and ${dates.length - 10} more days`;
    } else {
      sampleData = dates.map((date, i) => `${date}: $${sales[i].toFixed(2)}`).join('\n');
    }
    
    // Prepare a prompt that asks for generating ASCII art representation of the data
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a data visualization expert. Generate a text-based ${type} graph of the sales data using ASCII art or Unicode box drawing characters.
          
          The visualization should:
          1. Show a clear trend line
          2. Include axis labels
          3. Show the date range and total sales in the title
          4. Be well-formatted for display in Slack (monospace formatting)
          
          Make sure the visualization is clear and professional looking.
          
          IMPORTANT: Always wrap your visualization in triple backticks (\`\`\`) to ensure proper formatting in Slack.`
        },
        {
          role: "user",
          content: `Please create a ${type} graph visualization of the following Shopify sales data:
          
          Date range: ${startDate} to ${endDate}
          Number of days: ${dates.length}
          Total sales: $${totalSales}
          
          Data sample:
          ${sampleData}
          
          Create a professional-looking ${type} chart that clearly shows the sales trend over time.
          
          Make sure you format the result as a monospace code block using triple backticks (\`\`\`).`
        }
      ]
    });

    // Get the generated text representation of the chart
    const chart = response.choices[0]?.message?.content || "Could not generate visualization.";
    
    // Ensure chart has code block formatting
    if (!chart.includes("```")) {
      return "```\n" + chart + "\n```";
    }
    
    return chart;
  } catch (error: any) {
    console.error("Error generating visualization:", error);
    return `Error generating visualization: ${error?.message || "Unknown error"}`;
  }
}

/**
 * Generate a direct response from ChatGPT
 * Used when the user explicitly wants to talk to ChatGPT
 * All responses are from an e-commerce perspective
 */
export async function generateDirectResponse(query: string): Promise<string> {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      console.warn("OpenAI client not initialized. Returning fallback response.");
      return `I received your query, but the OpenAI API key is not configured. Please add your OpenAI API key in the settings to enable ChatGPT integration.`;
    }

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an e-commerce expert AI assistant integrated into a Multi-Channel Platform (MCP) that connects with multiple enterprise services.
          
          ALL responses should be from an e-commerce perspective, focusing on online retail, digital marketing, customer engagement, conversion optimization, and sales growth.
          
          Answer the user's questions in a helpful, concise, and friendly manner, always contextualizing within e-commerce.
          
          If the user asks about specific data or actions that would require accessing specific services (like Shopify, Klaviyo, Slack, etc.), 
          mention that they can directly query those services by using slash commands or mentioning the service name.
          
          For example, you can suggest:
          - "To get Shopify sales data, you can say '/shopify today_sales' or 'Show me Shopify sales for the past week'"
          - "To check email campaign performance, try '/klaviyo campaigns' or 'How are my Klaviyo campaigns performing?'"
          
          IMPORTANT: 
          1. Assume ALL questions are related to e-commerce, even if not explicitly stated.
          2. Keep responses focused on e-commerce business insights and practical advice.
          3. Be concise and direct - avoid lengthy explanations unless specifically requested.`
        },
        {
          role: "user",
          content: query
        }
      ]
    });

    return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error: any) {
    console.error("Error generating direct response:", error);
    return `I encountered an error while processing your query: ${error?.message || "Unknown error"}. Please try again later.`;
  }
}

export async function generateResponse(command: string, result: any): Promise<string> {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      console.warn("OpenAI client not initialized. Returning fallback response.");
      return `I received your command: "${command}". However, the OpenAI API key is not configured, so I'm unable to process it fully. Please add your OpenAI API key to enable all features.`;
    }

    // Truncate large API responses to prevent token limit errors
    const truncatedResult = truncateApiResponse(result);
    
    // Check if we're dealing with a Shopify command
    const isShopifyCommand = command.toLowerCase().includes('shopify');
    let systemPrompt = `You are an e-commerce expert assistant for a Multi-Channel Platform. 
      Your task is to generate a clear, concise, e-commerce-focused response to the user based on 
      the command they issued and the result of processing that command.
      
      ALL responses should be from an e-commerce perspective, focusing on online retail, digital marketing, 
      customer engagement, conversion optimization, and sales growth.
      
      Be conversational but professional. Highlight key information.
      If there was an error, explain it clearly and suggest how to fix it.
      
      For specific Slack errors:
      - If you see "not_in_channel", explain that the bot needs to be invited to the channel first
        and tell the user to go to the channel and type "/invite @[bot name]".
      - If you see "channel_not_found", explain that the channel ID might be incorrect.
      
      If the command was successful, summarize what was done.
      
      IMPORTANT: 
      1. Assume ALL commands and queries are related to e-commerce, even if not explicitly stated.
      2. Keep responses focused on e-commerce business insights and practical advice.
      3. Be concise and direct - avoid lengthy explanations unless specifically requested.
      4. When integrating non-e-commerce services like Slack or Notion, relate them to e-commerce operations and workflows.`;
      
    // Add specifics for Shopify data formatting if needed
    if (isShopifyCommand) {
      systemPrompt += `\n\nFor Shopify commands:
        - VERY IMPORTANT: Always prominently display the TOTAL REVENUE at the top of your response in a clear, large format
        - Calculate the total revenue by summing all order totals and highlight it as "Total Revenue: $X,XXX.XX"
        - Present order data in a clear tabular format if possible, but make sure the total comes first
        - Summarize the total number of orders/products and the time period if available
        - Show key metrics including total revenue, average order value, etc.
        - If data was truncated, mention to the user that they can narrow their search with more specific parameters
        - For "today" requests, explicitly emphasize that you're only showing sales from 12:01 AM today up to the current moment
        - For weekend requests, calculate only orders from Saturday and Sunday`;
    }

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `User command: "${command}"\n\nResult: ${JSON.stringify(truncatedResult)}`
        }
      ],
      max_tokens: 1000 // Limit response size to avoid token limit errors
    });

    return response.choices[0]?.message?.content || "No response received from OpenAI.";
  } catch (error: any) {
    console.error("Error generating response:", error);
    
    // Check if it's a token limit error and provide a more specific response
    if (error.message && error.message.includes("token")) {
      // Create a very simplified summary for token limit errors
      let simpleSummary = "I processed your request, but the response was too large for me to format nicely. ";
      
      if (result && result.data) {
        if (result.data.orders) {
          // Calculate total revenue for orders
          let totalRevenue = 0;
          for (const order of result.data.orders) {
            if (order.total_price) {
              totalRevenue += parseFloat(order.total_price);
            }
          }
          
          // Format the revenue as currency
          const formattedRevenue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(totalRevenue);
          
          simpleSummary += `\n\n✅ TOTAL REVENUE: ${formattedRevenue}\n\nI found ${result.data.orders.length} orders. `;
          
          if (result.data.orders.length > 0) {
            simpleSummary += `The most recent order is #${result.data.orders[0].order_number || 'N/A'} from ${result.data.orders[0].created_at || 'N/A'}. `;
          }
          simpleSummary += "Try narrowing your search with more specific date parameters.";
        } else if (result.data.products) {
          simpleSummary += `I found ${result.data.products.length} products. `;
          simpleSummary += "Try using a limit parameter to see fewer results at once.";
        }
      }
      
      return simpleSummary;
    }
    
    return `I processed your request, but encountered an error while formatting the response: ${error?.message || "Unknown error"}. Please try a more specific query.`;
  }
}
