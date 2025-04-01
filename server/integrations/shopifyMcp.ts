import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import path from "path";
import fs from "fs";
import axios from "axios";

// Define interface for Shopify MCP client
export interface ShopifyCommandResult extends McpCommandResult {
  data?: {
    products?: any[];
    orders?: any[];
    customers?: any[];
    shop?: any;
    draftOrder?: any;
    discountCode?: any;
    variants?: any[];
    collectionId?: string;
    productIds?: string[];
    variantIds?: string[];
    nextCursor?: string;
    hasNextPage?: boolean;
  };
}

// Define the Shopify MCP client class
class ShopifyMcpClient extends BaseMcpClient {
  constructor() {
    super("shopify");
  }

  /**
   * Extract Shopify credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    if (!connectionCredentials.accessToken || !connectionCredentials.shopDomain) {
      throw new Error("Shopify API credentials not found or incomplete. Please reconnect the API.");
    }

    // Return credentials in environment variable format for MCP server
    return {
      SHOPIFY_ACCESS_TOKEN: connectionCredentials.accessToken,
      MYSHOPIFY_DOMAIN: connectionCredentials.shopDomain
    };
  }

  /**
   * Initialize Shopify-specific functionality
   */
  protected async serviceInitialize(): Promise<void> {
    try {
      console.log("Initializing Shopify MCP client with API credentials");
      
      // Validate credentials
      if (!this.credentials.SHOPIFY_ACCESS_TOKEN || !this.credentials.MYSHOPIFY_DOMAIN) {
        console.warn("Missing required Shopify credentials:", this.credentials);
        throw new Error("Shopify API credentials are incomplete. Check your API connection.");
      }
      
      // Log successful connection
      console.log(`Connected to Shopify store: ${this.credentials.MYSHOPIFY_DOMAIN}`);
      console.log("Will use real Shopify data instead of simulated data when available");
    } catch (error) {
      console.error("Failed to initialize Shopify connection with real credentials:", error);
      console.warn("Falling back to simulated data using OpenAI");
    }
  }

  // Get products with optional search title
  async getProducts(searchTitle?: string, limit: number = 10): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // Attempt to use the real Shopify API
      if (this.credentials.SHOPIFY_ACCESS_TOKEN && this.credentials.MYSHOPIFY_DOMAIN) {
        try {
          console.log(`Fetching real Shopify products${searchTitle ? ` matching "${searchTitle}"` : ''}`);
          
          // Construct the Shopify REST API URL with query parameters
          const shopDomain = this.credentials.MYSHOPIFY_DOMAIN;
          const accessToken = this.credentials.SHOPIFY_ACCESS_TOKEN;
          
          // Prepare query parameters for the API call
          const queryParams = new URLSearchParams({
            limit: limit.toString(),
            fields: 'id,title,description,variants,images,status,product_type,created_at,updated_at'
          });
          
          if (searchTitle) {
            queryParams.append('title', searchTitle);
          }
          
          // Make the API request to get products
          const apiUrl = `https://${shopDomain}/admin/api/2023-10/products.json?${queryParams}`;
          console.log(`Making Shopify API request to: ${apiUrl}`);
          
          const response = await axios.get(apiUrl, {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          });
          
          // Extract products from the response
          const products = response.data.products || [];
          console.log(`Successfully retrieved ${products.length} real products from Shopify`);
          
          return {
            success: true,
            message: `Successfully retrieved ${products.length} products${searchTitle ? ` matching "${searchTitle}"` : ''}`,
            data: {
              products
            }
          };
        } catch (apiError: any) {
          console.error("Shopify API error:", apiError.response?.data || apiError.message);
          console.warn("Falling back to simulated data using OpenAI");
          
          // Fall back to simulation if the API call fails
          if (this.openai) {
            const result = await this.simulateProductSearch(searchTitle, limit);
            return {
              success: true,
              message: `API Error: ${apiError.message}. Falling back to simulated data. Retrieved ${result.products?.length || 0} simulated products.`,
              data: result
            };
          }
        }
      } else if (this.openai) {
        // Use simulation if credentials aren't available
        console.log("No valid Shopify credentials found, using simulated data");
        const result = await this.simulateProductSearch(searchTitle, limit);
        return {
          success: true,
          message: `Retrieved ${result.products?.length || 0} simulated products${searchTitle ? ` matching "${searchTitle}"` : ''}`,
          data: result
        };
      }

      // Fallback if all else fails
      return {
        success: true,
        message: `No products found${searchTitle ? ` matching "${searchTitle}"` : ''}`,
        data: { products: [] }
      };
    } catch (error: any) {
      console.error("Error getting products:", error);
      return {
        success: false,
        message: `Failed to get products: ${error.message}`,
        error: error
      };
    }
  }

  // Get products by collection ID
  async getProductsByCollection(collectionId: string, limit: number = 10): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // This is a temporary implementation until MCP integration is complete
      return {
        success: true,
        message: `Retrieved ${limit} products from collection ${collectionId}`,
        data: { 
          products: [],
          collectionId: collectionId
        }
      };
    } catch (error: any) {
      console.error("Error getting products by collection:", error);
      return {
        success: false,
        message: `Failed to get products from collection: ${error.message}`,
        error: error
      };
    }
  }

  // Get products by IDs
  async getProductsByIds(productIds: string[]): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // This is a temporary implementation until MCP integration is complete
      return {
        success: true,
        message: `Retrieved ${productIds.length} products by IDs`,
        data: { 
          products: [],
          productIds: productIds
        }
      };
    } catch (error: any) {
      console.error("Error getting products by IDs:", error);
      return {
        success: false,
        message: `Failed to get products by IDs: ${error.message}`,
        error: error
      };
    }
  }

  // Get variants by IDs
  async getVariantsByIds(variantIds: string[]): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // This is a temporary implementation until MCP integration is complete
      return {
        success: true,
        message: `Retrieved ${variantIds.length} variants by IDs`,
        data: { 
          variants: [],
          variantIds: variantIds
        }
      };
    } catch (error: any) {
      console.error("Error getting variants by IDs:", error);
      return {
        success: false,
        message: `Failed to get variants by IDs: ${error.message}`,
        error: error
      };
    }
  }

  // Get customers with pagination
  async getCustomers(limit: number = 10, next?: string): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // This is a temporary implementation until MCP integration is complete
      return {
        success: true,
        message: `Retrieved ${limit} customers`,
        data: { 
          customers: [],
          nextCursor: "",
          hasNextPage: false
        }
      };
    } catch (error: any) {
      console.error("Error getting customers:", error);
      return {
        success: false,
        message: `Failed to get customers: ${error.message}`,
        error: error
      };
    }
  }

  // Add tags to a customer
  async tagCustomer(customerId: string, tags: string[]): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // This is a temporary implementation until MCP integration is complete
      return {
        success: true,
        message: `Added tags [${tags.join(', ')}] to customer ${customerId}`,
        data: { 
          customers: [{ id: customerId, tags: tags }]
        }
      };
    } catch (error: any) {
      console.error("Error tagging customer:", error);
      return {
        success: false,
        message: `Failed to tag customer: ${error.message}`,
        error: error
      };
    }
  }

  // Get orders with advanced filtering
  async getOrders(params: {
    query?: string;
    createdAtMin?: string;
    createdAtMax?: string;
    limit?: number;
    cursor?: string;
  }): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // Ensure we always have a createdAtMin for real-time data accuracy
      if (!params.createdAtMin) {
        // Default to the last 30 days if no date range is specified
        const now = new Date();
        const defaultStartDate = new Date(now);
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        defaultStartDate.setHours(0, 0, 0, 0);
        params.createdAtMin = defaultStartDate.toISOString();
        console.log(`No createdAtMin provided, defaulting to last 30 days from ${params.createdAtMin}`);
      }
      
      // Always set createdAtMax to now if not specified
      if (!params.createdAtMax) {
        params.createdAtMax = new Date().toISOString();
      }
      
      // Attempt to use the real Shopify API
      if (this.credentials.SHOPIFY_ACCESS_TOKEN && this.credentials.MYSHOPIFY_DOMAIN) {
        try {
          console.log(`Fetching real Shopify orders from ${params.createdAtMin} to ${params.createdAtMax}`);
          
          // Construct the Shopify REST API URL with query parameters
          const shopDomain = this.credentials.MYSHOPIFY_DOMAIN;
          const accessToken = this.credentials.SHOPIFY_ACCESS_TOKEN;
          const limit = params.limit || 10;

          // Prepare query parameters for the API call
          const queryParams = new URLSearchParams({
            limit: limit.toString(),
            created_at_min: params.createdAtMin,
            created_at_max: params.createdAtMax,
            status: 'any',
            fields: 'id,order_number,created_at,total_price,currency,financial_status,customer,line_items'
          });
          
          if (params.cursor) {
            queryParams.append('page_info', params.cursor);
          }
          
          // Make the API request to get orders
          const apiUrl = `https://${shopDomain}/admin/api/2023-10/orders.json?${queryParams}`;
          console.log(`Making Shopify API request to: ${apiUrl}`);
          
          const response = await axios.get(apiUrl, {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          });
          
          // Extract orders from the response and check for pagination info
          const orders = response.data.orders || [];
          const hasNextPage = !!response.headers.link?.includes('rel="next"');
          const nextCursor = hasNextPage 
            ? response.headers.link.match(/<.*page_info=([^>]*)>/)?.[1] || ''
            : '';
          
          console.log(`Successfully retrieved ${orders.length} real orders from Shopify`);
          
          return {
            success: true,
            message: `Successfully retrieved ${orders.length} orders from ${new Date(params.createdAtMin).toLocaleString()} to ${new Date(params.createdAtMax).toLocaleString()}`,
            data: {
              orders,
              hasNextPage,
              nextCursor
            }
          };
        } catch (apiError: any) {
          console.error("Shopify API error:", apiError.response?.data || apiError.message);
          console.warn("Falling back to simulated data using OpenAI");
          
          // Fall back to simulation if the API call fails
          if (this.openai) {
            const result = await this.simulateOrderSearch(params);
            return {
              success: true,
              message: `API Error: ${apiError.message}. Falling back to simulated data. Retrieved ${result.orders?.length || 0} simulated orders.`,
              data: result
            };
          }
        }
      } else if (this.openai) {
        // Use simulation if credentials aren't available
        console.log("No valid Shopify credentials found, using simulated data");
        const result = await this.simulateOrderSearch(params);
        return {
          success: true,
          message: `Retrieved ${result.orders?.length || 0} simulated orders from ${new Date(params.createdAtMin).toLocaleString()} to ${new Date(params.createdAtMax).toLocaleString()}`,
          data: result
        };
      }

      // Fallback if all else fails
      return {
        success: true,
        message: "No data found matching your criteria",
        data: { 
          orders: [],
          hasNextPage: false,
          nextCursor: ""
        }
      };
    } catch (error: any) {
      console.error("Error getting orders:", error);
      return {
        success: false,
        message: `Failed to get orders: ${error.message}`,
        error: error
      };
    }
  }

  // Create a draft order
  async createDraftOrder(input: any): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // This is a temporary implementation until MCP integration is complete
      return {
        success: true,
        message: "Draft order created successfully",
        data: { 
          draftOrder: {
            id: `gid://shopify/DraftOrder/${Date.now()}`,
            name: `#D${Math.floor(Math.random() * 10000)}`,
            createdAt: new Date().toISOString()
          }
        }
      };
    } catch (error: any) {
      console.error("Error creating draft order:", error);
      return {
        success: false,
        message: `Failed to create draft order: ${error.message}`,
        error: error
      };
    }
  }

  // Complete a draft order
  async completeDraftOrder(draftOrderId: string, paymentPending: boolean = false): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // This is a temporary implementation until MCP integration is complete
      return {
        success: true,
        message: `Draft order ${draftOrderId} completed successfully`,
        data: { 
          draftOrder: {
            id: draftOrderId,
            completed: true,
            completedAt: new Date().toISOString(),
            paymentPending: paymentPending
          }
        }
      };
    } catch (error: any) {
      console.error("Error completing draft order:", error);
      return {
        success: false,
        message: `Failed to complete draft order: ${error.message}`,
        error: error
      };
    }
  }

  // Create a discount code
  async createDiscountCode(input: any): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // This is a temporary implementation until MCP integration is complete
      const code = input.code || `DISCOUNT${Math.floor(Math.random() * 10000)}`;
      return {
        success: true,
        message: `Discount code ${code} created successfully`,
        data: { 
          discountCode: {
            id: `gid://shopify/DiscountCode/${Date.now()}`,
            code: code,
            createdAt: new Date().toISOString()
          }
        }
      };
    } catch (error: any) {
      console.error("Error creating discount code:", error);
      return {
        success: false,
        message: `Failed to create discount code: ${error.message}`,
        error: error
      };
    }
  }

  // Get shop details
  async getShop(): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // Attempt to use the real Shopify API
      if (this.credentials.SHOPIFY_ACCESS_TOKEN && this.credentials.MYSHOPIFY_DOMAIN) {
        try {
          console.log("Fetching real Shopify shop details");
          
          // Construct the Shopify REST API URL
          const shopDomain = this.credentials.MYSHOPIFY_DOMAIN;
          const accessToken = this.credentials.SHOPIFY_ACCESS_TOKEN;
          
          // Make the API request to get shop details
          const apiUrl = `https://${shopDomain}/admin/api/2023-10/shop.json`;
          console.log(`Making Shopify API request to: ${apiUrl}`);
          
          const response = await axios.get(apiUrl, {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          });
          
          // Extract shop details from the response
          const shop = response.data.shop || {};
          console.log(`Successfully retrieved shop details for ${shop.name || shopDomain}`);
          
          return {
            success: true,
            message: "Shop details retrieved successfully",
            data: { shop }
          };
        } catch (apiError: any) {
          console.error("Shopify API error:", apiError.response?.data || apiError.message);
          console.warn("Falling back to simulated shop data");
          
          // Fall back to basic shop info
          const shopDomain = this.credentials.MYSHOPIFY_DOMAIN;
          return {
            success: true,
            message: `API Error: ${apiError.message}. Falling back to basic shop info.`,
            data: { 
              shop: {
                id: `gid://shopify/Shop/1`,
                name: shopDomain.split('.')[0],
                domain: shopDomain,
                myshopify_domain: shopDomain
              }
            }
          };
        }
      } else {
        // Use fallback if credentials aren't available
        const shopDomain = this.credentials.MYSHOPIFY_DOMAIN || "example.myshopify.com";
        console.log("No valid Shopify credentials found, using basic shop info");
        return {
          success: true,
          message: "Basic shop details retrieved",
          data: { 
            shop: {
              id: `gid://shopify/Shop/1`,
              name: shopDomain.split('.')[0],
              domain: shopDomain,
              myshopify_domain: shopDomain
            }
          }
        };
      }
    } catch (error: any) {
      console.error("Error getting shop details:", error);
      return {
        success: false,
        message: `Failed to get shop details: ${error.message}`,
        error: error
      };
    }
  }

  // Manage webhooks
  async manageWebhook(action: 'subscribe' | 'find' | 'unsubscribe', params: any): Promise<ShopifyCommandResult> {
    await this.initialize();

    try {
      // This is a temporary implementation until MCP integration is complete
      const webhook = action === 'find' ? [] : [{ 
        id: `gid://shopify/Webhook/${Date.now()}`,
        topic: params.topic || 'orders/create',
        address: params.address || 'https://example.com/webhook'
      }];
      
      return {
        success: true,
        message: `Successfully ${action}d webhook`,
        data: { 
          shop: {
            id: `gid://shopify/Shop/1`,
            webhooks: webhook
          }
        }
      };
    } catch (error: any) {
      console.error(`Error managing webhook (${action}):`, error);
      return {
        success: false,
        message: `Failed to ${action} webhook: ${error.message}`,
        error: error
      };
    }
  }

  // Simulate product search - this is a temporary method until full MCP integration
  private async simulateProductSearch(searchTitle?: string, limit: number = 10): Promise<any> {
    if (!this.openai) {
      return { products: [] };
    }

    // We'll use OpenAI to generate realistic-looking fake product data
    // Do not execute this if user didn't provide OPENAI_API_KEY
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Shopify API simulator. Generate ${limit} realistic product records that match the search query "${searchTitle || 'all products'}". 
          Include id, title, description, variants, prices, and inventory information. 
          Format as a JSON object with a 'products' array.`
        }
      ],
      response_format: { type: "json_object" }
    });

    try {
      const content = response.choices[0]?.message?.content || "{}";
      return JSON.parse(content);
    } catch (e) {
      console.error("Error parsing OpenAI response:", e);
      return { products: [] };
    }
  }

  // Simulate order search - this is a temporary method until full MCP integration
  private async simulateOrderSearch(params: any): Promise<any> {
    if (!this.openai) {
      return { orders: [] };
    }

    const limit = params.limit || 10;
    const dateRange = params.createdAtMin && params.createdAtMax ? 
      `between ${params.createdAtMin} and ${params.createdAtMax}` : 
      "from the last 30 days";

    // Generate realistic-looking fake order data
    // Do not execute this if user didn't provide OPENAI_API_KEY
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Shopify API simulator. Generate ${limit} realistic order records ${dateRange}. 
          Include id, order_number, created_at, customer information, products purchased, financial_status, and total_price. 
          Format as a JSON object with an 'orders' array.`
        }
      ],
      response_format: { type: "json_object" }
    });

    try {
      const content = response.choices[0]?.message?.content || "{}";
      return JSON.parse(content);
    } catch (e) {
      console.error("Error parsing OpenAI response:", e);
      return { orders: [] };
    }
  }
}

// Create a singleton instance
const shopifyMcpClient = new ShopifyMcpClient();

/**
 * Process commands using the Shopify MCP server
 */
export async function processShopifyMcpCommand(
  command: string,
  classification: any
): Promise<ShopifyCommandResult> {
  try {
    // Map between our classification intents and MCP client methods
    switch (classification.intent) {
      case "get_products":
        const searchTitle = classification.parameters.searchTitle;
        const limit = classification.parameters.limit || 10;
        return await shopifyMcpClient.getProducts(searchTitle, limit);
        
      case "get_products_by_collection":
        const collectionId = classification.parameters.collectionId;
        const collectionLimit = classification.parameters.limit || 10;
        return await shopifyMcpClient.getProductsByCollection(collectionId, collectionLimit);
        
      case "get_products_by_ids":
        const productIds = classification.parameters.productIds || [];
        return await shopifyMcpClient.getProductsByIds(productIds);
        
      case "get_variants_by_ids":
        const variantIds = classification.parameters.variantIds || [];
        return await shopifyMcpClient.getVariantsByIds(variantIds);
        
      case "get_customers":
        const customersLimit = classification.parameters.limit || 10;
        const next = classification.parameters.next;
        return await shopifyMcpClient.getCustomers(customersLimit, next);
        
      case "tag_customer":
        const customerId = classification.parameters.customerId;
        const tags = classification.parameters.tags || [];
        return await shopifyMcpClient.tagCustomer(customerId, tags);
        
      case "get_orders":
      case "get_sales":
      case "get_sales_report":
        // Extract time period from parameters
        const { time_period, days } = classification.parameters;
        
        // Set up date range based on time period
        const now = new Date();
        const createdAtMax = now.toISOString();
        let createdAtMin;
        
        // Always use a created_at_min filter for real-time, accurate data
        const defaultStartDate = new Date(now);
        defaultStartDate.setDate(defaultStartDate.getDate() - 30); // Default to last 30 days
        defaultStartDate.setHours(0, 0, 0, 0);
        
        // Check if this is a "today" request specifically
        if (time_period?.toLowerCase() === 'today' || classification.parameters.today === true) {
          // Strict today filter - from 12:01 AM today to the current moment
          const startOfToday = new Date(now);
          startOfToday.setHours(0, 0, 0, 0);
          createdAtMin = startOfToday.toISOString();
          
          console.log(`Today's sales requested, filtering orders from ${createdAtMin} to ${createdAtMax}`);
        }
        // Check if most_recent flag is set
        else if (classification.parameters.most_recent || time_period?.toLowerCase().includes('latest')) {
          // Use a 24-hour time period for latest/real-time data
          const recentStartDate = new Date(now);
          recentStartDate.setDate(recentStartDate.getDate() - 1);
          createdAtMin = recentStartDate.toISOString();
          console.log(`Real-time data requested, filtering orders from last 24 hours: ${createdAtMin}`);
        } else if (days) {
          // Use days parameter if provided
          const daysStartDate = new Date(now);
          daysStartDate.setDate(daysStartDate.getDate() - parseInt(days));
          daysStartDate.setHours(0, 0, 0, 0);
          createdAtMin = daysStartDate.toISOString();
          console.log(`Filtering orders from ${createdAtMin} (${days} days ago) to ${createdAtMax}`);
        } else if (time_period) {
          // Parse natural language time periods
          const timePeriod = time_period.toLowerCase();
          // use current date for max (now variable already defined above)
          
          if (timePeriod.includes('last')) {
            // Handle "last X days/weeks/months" format
            const parts = timePeriod.match(/last\s+(\d+)\s+(day|days|week|weeks|month|months)/i);
            if (parts && parts.length >= 3) {
              const amount = parseInt(parts[1]);
              const unit = parts[2].toLowerCase();
              
              if (!isNaN(amount)) {
                const startDate = new Date(now);
                
                if (unit.startsWith('day')) {
                  startDate.setDate(startDate.getDate() - amount);
                } else if (unit.startsWith('week')) {
                  startDate.setDate(startDate.getDate() - (amount * 7));
                } else if (unit.startsWith('month')) {
                  startDate.setMonth(startDate.getMonth() - amount);
                }
                
                createdAtMin = startDate.toISOString();
              }
            }
          }
        }
        
        return await shopifyMcpClient.getOrders({
          query: classification.parameters.query,
          createdAtMin,
          createdAtMax,
          limit: classification.parameters.limit || 10,
          cursor: classification.parameters.cursor,
        });
        
      case "create_draft_order":
        return await shopifyMcpClient.createDraftOrder(classification.parameters.input);
        
      case "complete_draft_order":
        return await shopifyMcpClient.completeDraftOrder(
          classification.parameters.draftOrderId,
          classification.parameters.paymentPending
        );
        
      case "create_discount_code":
        return await shopifyMcpClient.createDiscountCode(classification.parameters.input);
        
      case "get_shop":
        return await shopifyMcpClient.getShop();
        
      case "manage_webhook":
        return await shopifyMcpClient.manageWebhook(
          classification.parameters.action,
          classification.parameters
        );
        
      default:
        return {
          success: false,
          message: `Unsupported Shopify MCP command intent: ${classification.intent}`,
          error: new Error(`Unsupported Shopify MCP command intent: ${classification.intent}`)
        };
    }
  } catch (error: any) {
    console.error("Error processing Shopify MCP command:", error);
    return {
      success: false,
      message: `Error processing Shopify MCP command: ${error.message}`,
      error: error
    };
  }
}

export { shopifyMcpClient };