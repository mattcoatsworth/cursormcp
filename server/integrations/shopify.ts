import { storage } from "../storage";
import axios from "axios";

// Define Shopify API base URLs
const SHOPIFY_API_VERSION = "2023-10"; // Use appropriate API version

/**
 * Process commands related to Shopify
 */
export async function processShopifyCommand(
  command: string,
  classification: any
): Promise<any> {
  // Check if Shopify API is connected
  const shopifyConnection = await storage.getApiConnectionByType("shopify");
  
  if (!shopifyConnection || !shopifyConnection.isConnected) {
    throw new Error("Shopify API is not connected. Please connect it first.");
  }

  // Process based on intent
  switch (classification.intent) {
    case "get_sales":
    case "get_sales_report":  // Add support for get_sales_report intent
    case "sales_data":
    case "sales_report":
    case "generate_sales_report":
      return await getSalesData(classification.parameters);
    case "get_products":
      return await getProducts(classification.parameters);
    case "update_inventory":
      return await updateInventory(
        classification.parameters.productId,
        classification.parameters.quantity
      );
    case "help":
    case "info":
      // Provide helpful information about Shopify commands
      return {
        success: true,
        message: "Here's how to use Shopify commands:",
        data: {
          commands: [
            {
              name: "/shopify get_sales",
              description: "Get sales data with various time period options",
              examples: [
                "/shopify get_sales for the last 7 days",
                "/shopify get_sales for the last month",
                "/shopify get_sales for this week",
                "/shopify get_sales limit 10"
              ]
            },
            {
              name: "/shopify get_products",
              description: "Get product data with optional limit",
              examples: [
                "/shopify get_products",
                "/shopify get_products limit 20"
              ]
            }
          ],
          timeOptions: {
            description: "Time period options to use with get_sales",
            options: [
              "today", 
              "this week", 
              "this month", 
              "this year",
              "last day",
              "last week", 
              "last month", 
              "last year",
              "last X days/weeks/months (e.g., 'last 7 days', 'last 2 weeks')"
            ],
            note: "By default, the current day is included in all time periods."
          }
        }
      };
    default:
      // For all other intents, try to guess what the user was asking for
      if (classification.intent.includes("check") || 
          classification.intent.includes("today") || 
          classification.intent.includes("info")) {
        // Provide helpful information
        return {
          success: true,
          message: "I think you're asking about Shopify sales data. To check sales, try one of these commands:",
          examples: [
            "/shopify get_sales for today",
            "/shopify get_sales for this week",
            "/shopify get_sales for the last 7 days"
          ]
        };
      }
      
      throw new Error(`Unsupported Shopify command intent: ${classification.intent}. Try '/shopify help' for available commands.`);
  }
}

/**
 * Get sales data from Shopify
 */
async function getSalesData(params: any): Promise<any> {
  try {
    const shopifyConnection = await storage.getApiConnectionByType("shopify");
    
    if (!shopifyConnection || !shopifyConnection.isConnected) {
      throw new Error("Shopify API is not connected. Please connect it first.");
    }
    
    // Access credentials property directly
    const credentials = shopifyConnection.credentials as any;
    
    if (!credentials || !credentials.shopDomain || !credentials.accessToken) {
      throw new Error("Shopify API credentials not found or incomplete. Please reconnect the API.");
    }

    const { shopDomain, accessToken } = credentials;
    const endpoint = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/orders.json`;
    
    // Set up the query parameters based on the input parameters
    const queryParams = new URLSearchParams();
    
    // Always use created_at_min/max for accuracy and real-time data
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Always set the maximum date to now to ensure we get the latest data
    queryParams.append('created_at_max', endOfToday.toISOString());
    
    // Handle date ranges for filtering orders
    if (params.time_period) {
      // Parse natural language time periods
      const timePeriod = params.time_period.toLowerCase();
      const now = new Date();
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      
      // Always set the maximum date to now to ensure precise ranges
      queryParams.append('created_at_max', endOfToday.toISOString());
      
      if (timePeriod.includes('last')) {
        // Handle "last X days/weeks/months" format
        const parts = timePeriod.match(/last\s+(\d+)\s+(day|days|week|weeks|month|months)/i);
        if (parts && parts.length >= 3) {
          const amount = parseInt(parts[1]);
          const unit = parts[2].toLowerCase();
          
          if (!isNaN(amount)) {
            const startDate = new Date(now);
            
            if (unit.startsWith('day')) {
              // For precise X days, go back exactly X days and start at beginning of that day
              startDate.setDate(startDate.getDate() - amount);
              startDate.setHours(0, 0, 0, 0);
            } else if (unit.startsWith('week')) {
              startDate.setDate(startDate.getDate() - (amount * 7));
              startDate.setHours(0, 0, 0, 0);
            } else if (unit.startsWith('month')) {
              startDate.setMonth(startDate.getMonth() - amount);
              startDate.setDate(1); // First day of the month
              startDate.setHours(0, 0, 0, 0);
            }
            
            const formattedStartDate = startDate.toISOString();
            queryParams.append('created_at_min', formattedStartDate);
            console.log(`Filtering orders from ${formattedStartDate} to ${endOfToday.toISOString()}`);
          }
        } else if (timePeriod === 'last week') {
          // Previous week (exact 7 days ago to today)
          const startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          queryParams.append('created_at_min', startDate.toISOString());
        } else if (timePeriod === 'last month') {
          // Previous month
          const startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          startDate.setDate(1); // First day of previous month
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(now);
          endDate.setDate(0); // Last day of previous month
          endDate.setHours(23, 59, 59, 999);
          
          queryParams.set('created_at_min', startDate.toISOString());
          queryParams.set('created_at_max', endDate.toISOString());
        } else if (timePeriod === 'last year') {
          // Previous year
          const startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1, 0, 1); // Jan 1 of last year
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(now);
          endDate.setFullYear(endDate.getFullYear() - 1, 11, 31); // Dec 31 of last year
          endDate.setHours(23, 59, 59, 999);
          
          queryParams.set('created_at_min', startDate.toISOString());
          queryParams.set('created_at_max', endDate.toISOString());
        }
      } else if (timePeriod === 'today') {
        // Today only - from start of today (12:01 am) to the current moment
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 1, 0, 0); // Set to 12:01:00.000 AM
        
        // Use precise timestamps for exact daily data
        queryParams.set('created_at_min', startOfToday.toISOString());
        queryParams.set('created_at_max', now.toISOString()); // Current time right now
        
        console.log(`Strict today filter: from ${startOfToday.toISOString()} to ${now.toISOString()}`);
      } else if (timePeriod === 'this weekend' || timePeriod === 'weekend') {
        // Weekend only - from Saturday at 12:01 AM to the current moment on Sunday (if we're in the weekend)
        const day = now.getDay(); // 0 is Sunday, 6 is Saturday
        
        // First check if we're currently in a weekend
        if (day !== 0 && day !== 6) {
          throw new Error("Weekend sales can only be queried during the weekend (Saturday or Sunday).");
        }
        
        // Determine start of weekend (Saturday at 12:01 AM)
        const startOfWeekend = new Date(now);
        
        if (day === 0) { // If today is Sunday
          // Go back to Saturday
          startOfWeekend.setDate(now.getDate() - 1);
        }
        
        // Set to beginning of Saturday at 12:01 AM
        startOfWeekend.setHours(0, 1, 0, 0); // 00:01:00
        
        // Use precise timestamps with current moment as the end
        queryParams.set('created_at_min', startOfWeekend.toISOString());
        queryParams.set('created_at_max', now.toISOString()); // Current time right now
        
        // Format dates for logging
        const options: Intl.DateTimeFormatOptions = { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        
        const startFormatted = startOfWeekend.toLocaleDateString('en-US', options);
        const endFormatted = now.toLocaleDateString('en-US', options);
        
        console.log(`Weekend sales filter: from ${startFormatted} to ${endFormatted}`);
        console.log(`Precise timestamps: ${startOfWeekend.toISOString()} to ${now.toISOString()}`);
      } else if (timePeriod === 'this week') {
        // This week - from Monday to today
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to get Monday
        const monday = new Date(now);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        queryParams.append('created_at_min', monday.toISOString());
      } else if (timePeriod === 'this month') {
        // This month - from 1st of month to today
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        queryParams.append('created_at_min', firstDayOfMonth.toISOString());
      } else if (timePeriod === 'this year') {
        // This year - from Jan 1 to today
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        firstDayOfYear.setHours(0, 0, 0, 0);
        queryParams.append('created_at_min', firstDayOfYear.toISOString());
      }
    } else if (params.days) {
      // Legacy support for days parameter
      const daysAgo = parseInt(params.days);
      if (!isNaN(daysAgo)) {
        const now = new Date();
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        
        // Set start date to beginning of day X days ago (12:01 AM)
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysAgo);
        startDate.setHours(0, 1, 0, 0); // 12:01 AM
        
        // Set both min and max for precise date range
        queryParams.append('created_at_min', startDate.toISOString());
        queryParams.append('created_at_max', endOfToday.toISOString());
        
        console.log(`Filtering orders from ${startDate.toISOString()} to ${endOfToday.toISOString()}`);
      }
    } else if (params.date_min) {
      // Direct date filters with ISO format
      queryParams.append('created_at_min', params.date_min);
    } else {
      // If no time period or specific date filter was set, default to the last 30 days
      // This ensures we always get recent, relevant data
      const defaultStartDate = new Date(now);
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
      defaultStartDate.setHours(0, 1, 0, 0); // 12:01 AM
      queryParams.append('created_at_min', defaultStartDate.toISOString());
      console.log(`No time period specified, defaulting to last 30 days from ${defaultStartDate.toISOString()}`);
    }
    
    if (params.date_max) {
      queryParams.append('created_at_max', params.date_max);
    }
    
    // Standard parameters
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    } else {
      // Default limit if not specified
      queryParams.append('limit', '50');
    }
    
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
    if (params.since_id) {
      queryParams.append('since_id', params.since_id);
    }
    
    console.log(`Fetching Shopify orders with params: ${queryParams.toString()}`);
    
    // Make the API request
    const response = await axios.get(`${endpoint}?${queryParams.toString()}`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      success: true,
      endpoint,
      parameters: params,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching Shopify sales data:', error);
    throw error;
  }
}

/**
 * Get products from Shopify
 */
async function getProducts(params: any): Promise<any> {
  try {
    const shopifyConnection = await storage.getApiConnectionByType("shopify");
    
    if (!shopifyConnection || !shopifyConnection.isConnected) {
      throw new Error("Shopify API is not connected. Please connect it first.");
    }
    
    // Access credentials property directly
    const credentials = shopifyConnection.credentials as any;
    
    if (!credentials || !credentials.shopDomain || !credentials.accessToken) {
      throw new Error("Shopify API credentials not found or incomplete. Please reconnect the API.");
    }

    const { shopDomain, accessToken } = credentials;
    const endpoint = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/products.json`;
    
    // Set up the query parameters based on the input parameters
    const queryParams = new URLSearchParams();
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params.ids) {
      queryParams.append('ids', params.ids);
    }
    
    if (params.since_id) {
      queryParams.append('since_id', params.since_id);
    }
    
    // Make the API request
    const response = await axios.get(`${endpoint}?${queryParams.toString()}`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      success: true,
      endpoint,
      parameters: params,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    throw error;
  }
}

/**
 * Update inventory for a product
 */
async function updateInventory(productId: string, quantity: number): Promise<any> {
  try {
    const shopifyConnection = await storage.getApiConnectionByType("shopify");
    
    if (!shopifyConnection || !shopifyConnection.isConnected) {
      throw new Error("Shopify API is not connected. Please connect it first.");
    }
    
    // Access credentials property directly
    const credentials = shopifyConnection.credentials as any;
    
    if (!credentials || !credentials.shopDomain || !credentials.accessToken) {
      throw new Error("Shopify API credentials not found or incomplete. Please reconnect the API.");
    }

    const { shopDomain, accessToken } = credentials;
    
    // First, we need to get the inventory item ID for the product
    const productEndpoint = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/products/${productId}.json`;
    
    const productResponse = await axios.get(productEndpoint, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    // Get the inventory item ID from the first variant
    if (!productResponse.data.product.variants || productResponse.data.product.variants.length === 0) {
      throw new Error("Product has no variants, cannot update inventory.");
    }
    
    const inventoryItemId = productResponse.data.product.variants[0].inventory_item_id;
    
    if (!inventoryItemId) {
      throw new Error("Could not find inventory item ID for product.");
    }
    
    // Now update the inventory level
    const inventoryEndpoint = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/inventory_levels/set.json`;
    
    const inventoryResponse = await axios.post(inventoryEndpoint, {
      location_id: productResponse.data.product.variants[0].inventory_management === 'shopify' ? 
                   productResponse.data.product.variants[0].inventory_quantity : null,
      inventory_item_id: inventoryItemId,
      available: quantity
    }, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      success: true,
      endpoint: inventoryEndpoint,
      parameters: { productId, quantity },
      data: inventoryResponse.data
    };
  } catch (error) {
    console.error('Error updating Shopify inventory:', error);
    throw error;
  }
}
