/**
 * Utility functions for handling slash commands from the client
 */

/**
 * Interface for a slash command parameter
 */
export interface SlashCommandParameter {
  name: string;
  type: string;
  description: string;
  default?: any;
  optional?: boolean;
}

/**
 * Interface for a slash command definition
 */
export interface SlashCommand {
  command: string;
  description: string;
  parameters: SlashCommandParameter[];
  handler: (args: Record<string, any>) => Promise<any>;
}

/**
 * Check if the input is a valid slash command and parse it
 * @param input The user input to check
 * @returns Object with command parts if valid, null otherwise
 */
export function parseSlashCommand(input: string): { 
  service: string; 
  command: string;
  args: string;
} | null {
  // Basic validation
  if (!input || typeof input !== 'string' || !input.startsWith('/')) {
    return null;
  }

  // Remove leading slash and split by spaces
  const parts = input.slice(1).trim().split(' ');
  
  // Need at least a service
  if (parts.length < 1) {
    return null;
  }

  const service = parts[0].toLowerCase();
  
  // If service is a known service and has a command
  if (['slack', 'shopify', 'klaviyo', 'postscript', 'northbeam', 'notion', 'triplewhale', 
       'gorgias', 'recharm', 'prescientai', 'elevar'].includes(service)) {
    const command = parts.length > 1 ? parts[1].toLowerCase() : '';
    const args = parts.slice(2).join(' ');
    
    return { service, command, args };
  }
  
  // Not a recognized slash command
  return null;
}

/**
 * Generate a command classification from a slash command
 * This bypasses the need for AI classification for explicit slash commands
 */
export function classifySlashCommand(service: string, command: string, args: string) {
  // Handle Slack commands
  if (service === 'slack') {
    switch (command) {
      case 'channel':
        // Get channel info from args
        const channelName = args.trim();
        
        return {
          intent: 'get_channel_info',
          primaryService: 'slack',
          secondaryServices: [],
          parameters: {
            channel: channelName
          },
          confidence: 1.0 // High confidence as this is an explicit command
        };
      
      case 'send':
        // Parse channel and message from args
        const argsArray = args.split(' ');
        const channel = argsArray[0];
        const message = argsArray.slice(1).join(' ');
        
        return {
          intent: 'send_message',
          primaryService: 'slack',
          secondaryServices: [],
          parameters: {
            channel,
            message
          },
          confidence: 1.0 // High confidence as this is an explicit command
        };
        
      case 'messages':
        // Parse limit from args (if provided)
        const limit = args.trim() ? parseInt(args) : 10;
        
        return {
          intent: 'get_messages',
          primaryService: 'slack',
          secondaryServices: [],
          parameters: {
            limit: isNaN(limit) ? 10 : limit
          },
          confidence: 1.0
        };
        
      case 'channels':
        return {
          intent: 'list_channels',
          primaryService: 'slack',
          secondaryServices: [],
          parameters: {},
          confidence: 1.0
        };
        
      case 'users':
        return {
          intent: 'list_users',
          primaryService: 'slack',
          secondaryServices: [],
          parameters: {},
          confidence: 1.0
        };
        
      case 'status':
      case 'user_status':
        return {
          intent: 'get_status',
          primaryService: 'slack',
          secondaryServices: [],
          parameters: {},
          confidence: 1.0
        };
        
      case 'post_message':
        // Similar to send, but with more explicit interface
        const messageChannel = args.split(' ')[0];
        const messageText = args.split(' ').slice(1).join(' ');
        
        return {
          intent: 'send_message',
          primaryService: 'slack',
          secondaryServices: [],
          parameters: {
            channel: messageChannel,
            message: messageText
          },
          confidence: 1.0
        };
        
      case 'search':
        const query = args.trim();
        
        return {
          intent: 'search_messages',
          primaryService: 'slack',
          secondaryServices: [],
          parameters: {
            query: query
          },
          confidence: 1.0
        };
        
      case 'channel_members':
        const membersChannel = args.trim();
        
        return {
          intent: 'get_channel_members',
          primaryService: 'slack',
          secondaryServices: [],
          parameters: {
            channel: membersChannel
          },
          confidence: 1.0
        };
      
      case 'recent':
        return {
          intent: 'get_messages',
          primaryService: 'slack',
          secondaryServices: [],
          parameters: {
            limit: 10
          },
          confidence: 1.0
        };
        
      default:
        // Generic fallback for unknown slack commands
        return {
          intent: 'help',
          primaryService: 'slack',
          secondaryServices: [],
          parameters: {
            command
          },
          confidence: 0.7
        };
    }
  }
  
  // Handle Shopify commands
  if (service === 'shopify') {
    // Handle special case for questions and help requests
    if (command === '' || command === 'help' || command === 'info') {
      return {
        intent: 'help',
        primaryService: 'shopify',
        secondaryServices: [],
        parameters: { question: args },
        confidence: 1.0
      };
    }
    
    // Handle informational queries about sales data
    if (command === 'is' || command === 'are' || command === 'does' || command === 'do') {
      return {
        intent: 'info',
        primaryService: 'shopify',
        secondaryServices: [],
        parameters: { question: `${command} ${args}` },
        confidence: 1.0
      };
    }
    
    switch (command) {
      // Quick command handlers for popular shopify commands
      case 'today_sales':
        return {
          intent: 'get_sales',
          primaryService: 'shopify',
          secondaryServices: [],
          parameters: {
            time_period: 'today',
            today: true,
            most_recent: true
          },
          confidence: 1.0
        };
        
      case 'best_sellers':
        return {
          intent: 'get_products',
          primaryService: 'shopify',
          secondaryServices: [],
          parameters: {
            sort: 'bestselling',
            limit: 10
          },
          confidence: 1.0
        };
        
      case 'recent_orders':
        return {
          intent: 'get_orders',
          primaryService: 'shopify',
          secondaryServices: [],
          parameters: {
            limit: 10,
            most_recent: true
          },
          confidence: 1.0
        };
        
      case 'inventory_low':
        return {
          intent: 'get_inventory_low',
          primaryService: 'shopify',
          secondaryServices: [],
          parameters: {
            threshold: 5,
            limit: 20
          },
          confidence: 1.0
        };
      
      case 'sales_trend':
        const period = args.trim().toLowerCase() || 'monthly';
        return {
          intent: 'get_sales_trend',
          primaryService: 'shopify',
          secondaryServices: [],
          parameters: {
            period: period,
            chart_type: 'line'
          },
          confidence: 1.0
        };
        
      case 'products':
        const productParam = args.trim().toLowerCase();
        if (productParam === 'top') {
          return {
            intent: 'get_products',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              sort: 'bestselling',
              limit: 10
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_products',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      case 'customers':
        const customerParam = args.trim().toLowerCase();
        if (customerParam === 'new') {
          return {
            intent: 'get_customers',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              created_at_min: 'last_30_days',
              limit: 20
            },
            confidence: 1.0
          };
        } else if (customerParam === 'ltv') {
          return {
            intent: 'get_customer_ltv',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              period: 'lifetime'
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_customers',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      case 'collections':
        const collectionParam = args.trim().toLowerCase();
        if (collectionParam === 'popular') {
          return {
            intent: 'get_collections',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              sort: 'popular',
              limit: 10
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_collections',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      case 'checkouts':
        const checkoutParam = args.trim().toLowerCase();
        if (checkoutParam === 'abandoned') {
          return {
            intent: 'get_abandoned_checkouts',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_checkouts',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      case 'sales_by_location':
        return {
          intent: 'get_sales_by_location',
          primaryService: 'shopify',
          secondaryServices: [],
          parameters: {
            period: args.trim() || 'last 30 days'
          },
          confidence: 1.0
        };
        
      case 'orders':
        const ordersParam = args.trim().toLowerCase();
        if (ordersParam.startsWith('fulfillment_status')) {
          const status = ordersParam.split(' ')[1] || 'unfulfilled';
          return {
            intent: 'get_orders',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              fulfillment_status: status,
              limit: 20
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_orders',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      case 'discounts':
        const discountParam = args.trim().toLowerCase();
        if (discountParam === 'performance') {
          return {
            intent: 'get_discount_performance',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              period: 'last 30 days'
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_discounts',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      case 'refunds':
        const refundParam = args.trim().toLowerCase();
        if (refundParam === 'analysis') {
          return {
            intent: 'get_refunds_analysis',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              period: 'last 30 days'
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_refunds',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
      case 'get_products':
        // Parse limit from args (if provided)
        const productLimit = args.includes('limit') ? 
          parseInt(args.split('limit')[1].trim()) : 
          20;
        
        return {
          intent: 'get_products',
          primaryService: 'shopify',
          secondaryServices: [],
          parameters: {
            limit: isNaN(productLimit) ? 20 : productLimit
          },
          confidence: 1.0
        };
        
      case 'get_sales':
      case 'get_sales_report':
      case 'sales_report': 
      case 'sales_data':
      case 'generate_sales_report':
        // Parse date range parameters
        const params: any = {
          limit: 20 // Default limit
        };
        
        // Check for time period patterns
        const timePeriodMatch = args.match(/for\s+the\s+(last\s+\d+\s+(?:day|days|week|weeks|month|months)|last\s+(?:day|week|month|year)|today|this\s+(?:week|month|year))/i);
        
        // Special handling for today requests
        if (args.toLowerCase().includes('today')) {
          console.log("Today's sales/orders detected in slash command");
          // Set both params to ensure strict today-only filtering
          params.time_period = "today";
          params.today = true;
          console.log("Enforced strict today parameters:", params);
        }
        else if (timePeriodMatch && timePeriodMatch[1]) {
          // Use the more flexible time_period parameter
          params.time_period = timePeriodMatch[1];
          
          // If the time_period is "today", we should also set the today flag
          if (params.time_period.toLowerCase() === "today") {
            params.today = true;
          }
        }
        // Also look for "real-time" or "up-to-date" or "latest" keywords
        else if (args.includes('real-time') || args.includes('real time') || 
                args.includes('up-to-date') || args.includes('latest') || 
                args.includes('current') || args.includes('new') || 
                args.includes('recent')) {
          // Use a 24-hour time period for latest/real-time data
          params.time_period = 'last 1 day';
        }
        // Legacy support - check for "last X days" pattern
        else if (args.includes('last') && args.includes('days')) {
          const daysMatch = args.match(/last\s+(\d+)\s+days/i);
          if (daysMatch && daysMatch[1]) {
            params.days = parseInt(daysMatch[1]);
          }
        }
        
        // Always indicate we want the most recent data
        params.most_recent = true;
        
        // Check for specific limit
        if (args.includes('limit')) {
          const limitMatch = args.match(/limit\s+(\d+)/i);
          if (limitMatch && limitMatch[1]) {
            params.limit = parseInt(limitMatch[1]);
          }
        }
        
        // Check for status filter
        if (args.includes('status')) {
          const statusMatch = args.match(/status\s+(\w+)/i);
          if (statusMatch && statusMatch[1]) {
            params.status = statusMatch[1];
          }
        }
        
        // Debug logging
        console.log(`Parsed Shopify sales parameters:`, params);
        
        // Determine the correct intent based on the command
        let intent = 'get_sales';
        if (command === 'get_sales_report' || command === 'sales_report' || 
            command === 'generate_sales_report') {
          intent = 'get_sales_report';
        }
        
        return {
          intent: intent,
          primaryService: 'shopify',
          secondaryServices: [],
          parameters: params,
          confidence: 1.0
        };
        
      case 'update_inventory':
        // Parse product ID and quantity
        const parts = args.split(' ');
        if (parts.length >= 2) {
          const productId = parts[0];
          const quantity = parseInt(parts[1]);
          
          return {
            intent: 'update_inventory',
            primaryService: 'shopify',
            secondaryServices: [],
            parameters: {
              productId,
              quantity: isNaN(quantity) ? 0 : quantity
            },
            confidence: 1.0
          };
        }
        break;
    }
  }
  
  // Handle Triple Whale commands
  if (service === 'triplewhale') {
    switch (command) {
      case 'sales':
        // Parse period from args (if provided)
        const period = args.trim() ? args.trim() : 'today';
        
        return {
          intent: 'get_sales',
          primaryService: 'triplewhale',
          secondaryServices: [],
          parameters: {
            period
          },
          confidence: 1.0
        };
        
      case 'attribution':
        // Parse source from args (if provided)
        const source = args.trim() ? args.trim() : '';
        
        return {
          intent: 'get_attribution',
          primaryService: 'triplewhale',
          secondaryServices: [],
          parameters: {
            source
          },
          confidence: 1.0
        };
        
      case 'campaigns':
        // Parse platform from args (if provided)
        const platform = args.trim() ? args.trim() : '';
        
        return {
          intent: 'get_campaigns',
          primaryService: 'triplewhale',
          secondaryServices: [],
          parameters: {
            platform
          },
          confidence: 1.0
        };
        
      case 'cohorts':
        // Parse period from args (if provided)
        const cohortPeriod = args.trim() ? args.trim() : '30';
        
        return {
          intent: 'get_cohorts',
          primaryService: 'triplewhale',
          secondaryServices: [],
          parameters: {
            period: cohortPeriod
          },
          confidence: 1.0
        };
        
      case 'ltv':
        return {
          intent: 'get_ltv',
          primaryService: 'triplewhale',
          secondaryServices: [],
          parameters: {},
          confidence: 1.0
        };
        
      case 'summary':
        return {
          intent: 'get_performance_summary',
          primaryService: 'triplewhale',
          secondaryServices: [],
          parameters: {},
          confidence: 1.0
        };
        
      default:
        // Generic fallback for unknown Triple Whale commands
        return {
          intent: 'help',
          primaryService: 'triplewhale',
          secondaryServices: [],
          parameters: {
            command
          },
          confidence: 0.7
        };
    }
  }
  
  // Handle Klaviyo commands
  if (service === 'klaviyo') {
    switch (command) {
      case 'campaigns':
      case 'get_campaigns':
        const campaignParam = args.trim().toLowerCase();
        if (campaignParam === 'performance' || campaignParam === 'stats') {
          return {
            intent: 'get_campaigns',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              withStats: true,
              limit: 20
            },
            confidence: 1.0
          };
        } else if (campaignParam === 'create') {
          return {
            intent: 'create_campaign',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              campaign: {
                name: 'New Campaign',
                subject: 'New Campaign from MCP'
              }
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_campaigns',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      case 'flows':
        const flowParam = args.trim().toLowerCase();
        if (flowParam === 'performance' || flowParam === 'stats') {
          return {
            intent: 'get_flows',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              withPerformance: true,
              limit: 20
            },
            confidence: 1.0
          };
        } else if (flowParam === 'top') {
          return {
            intent: 'get_flows',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              top: true,
              limit: 10
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_flows',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      case 'subscribers':
      case 'get_subscribers':
        const subscriberParam = args.trim().toLowerCase();
        if (subscriberParam === 'growth') {
          return {
            intent: 'get_subscribers_growth',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              period: 'last 30 days'
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_subscribers',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      case 'segments':
        const segmentParam = args.trim().toLowerCase();
        if (segmentParam === 'analysis') {
          return {
            intent: 'analyze_segments',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              depth: 'detailed'
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_segments',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      case 'back_in_stock':
        return {
          intent: 'get_back_in_stock',
          primaryService: 'klaviyo',
          secondaryServices: [],
          parameters: {
            limit: 20
          },
          confidence: 1.0
        };
        
      case 'catalog':
        const catalogParam = args.trim().toLowerCase();
        if (catalogParam === 'items') {
          return {
            intent: 'get_catalog_items',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_catalogs',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      case 'email_metrics':
        return {
          intent: 'get_email_metrics',
          primaryService: 'klaviyo',
          secondaryServices: [],
          parameters: {
            period: 'last 30 days'
          },
          confidence: 1.0
        };
        
      case 'orders':
        const ordersParam = args.trim().toLowerCase();
        if (ordersParam === 'recent') {
          return {
            intent: 'get_recent_orders',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              limit: 10
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_orders',
            primaryService: 'klaviyo',
            secondaryServices: [],
            parameters: {
              limit: 20
            },
            confidence: 1.0
          };
        }
        
      default:
        // Generic fallback for unknown Klaviyo commands
        return {
          intent: 'help',
          primaryService: 'klaviyo',
          secondaryServices: [],
          parameters: {
            command
          },
          confidence: 0.7
        };
    }
  }
  
  // Handle Postscript commands
  if (service === 'postscript') {
    switch (command) {
      case 'subscribers':
        // Parse limit and page from args (if provided)
        const subArgs = args.split(' ');
        const limit = subArgs[0] && !isNaN(parseInt(subArgs[0])) ? parseInt(subArgs[0]) : 20;
        const page = subArgs[1] && !isNaN(parseInt(subArgs[1])) ? parseInt(subArgs[1]) : 1;
        
        return {
          intent: 'get_subscribers',
          primaryService: 'postscript',
          secondaryServices: [],
          parameters: {
            limit,
            page
          },
          confidence: 1.0
        };
        
      case 'search':
        // Parse phone number from args
        const phone = args.trim();
        
        if (!phone) {
          return {
            intent: 'error',
            primaryService: 'postscript',
            secondaryServices: [],
            parameters: {
              error: 'Phone number is required for subscriber search'
            },
            confidence: 1.0
          };
        }
        
        return {
          intent: 'search_subscriber',
          primaryService: 'postscript',
          secondaryServices: [],
          parameters: {
            phone
          },
          confidence: 1.0
        };
        
      case 'campaigns':
        // Parse limit and page from args (if provided)
        const campArgs = args.split(' ');
        const campLimit = campArgs[0] && !isNaN(parseInt(campArgs[0])) ? parseInt(campArgs[0]) : 20;
        const campPage = campArgs[1] && !isNaN(parseInt(campArgs[1])) ? parseInt(campArgs[1]) : 1;
        
        return {
          intent: 'get_campaigns',
          primaryService: 'postscript',
          secondaryServices: [],
          parameters: {
            limit: campLimit,
            page: campPage
          },
          confidence: 1.0
        };
        
      case 'campaign':
        // Parse campaign ID from args
        const campaignId = args.trim();
        
        if (!campaignId) {
          return {
            intent: 'error',
            primaryService: 'postscript',
            secondaryServices: [],
            parameters: {
              error: 'Campaign ID is required'
            },
            confidence: 1.0
          };
        }
        
        return {
          intent: 'get_campaign_details',
          primaryService: 'postscript',
          secondaryServices: [],
          parameters: {
            id: campaignId
          },
          confidence: 1.0
        };
        
      case 'analytics':
        // Parse period from args (if provided)
        const analyticsPeriod = args.trim() ? args.trim() : '30d';
        
        return {
          intent: 'get_analytics',
          primaryService: 'postscript',
          secondaryServices: [],
          parameters: {
            period: analyticsPeriod
          },
          confidence: 1.0
        };
        
      case 'send':
        // Parse phone and message from args
        const sendArgs = args.split(' ');
        const sendPhone = sendArgs[0];
        const sendMessage = sendArgs.slice(1).join(' ');
        
        if (!sendPhone || !sendMessage) {
          return {
            intent: 'error',
            primaryService: 'postscript',
            secondaryServices: [],
            parameters: {
              error: 'Phone number and message are required to send SMS'
            },
            confidence: 1.0
          };
        }
        
        return {
          intent: 'send_sms',
          primaryService: 'postscript',
          secondaryServices: [],
          parameters: {
            phone: sendPhone,
            message: sendMessage
          },
          confidence: 1.0
        };
        
      case 'create':
        // Parse campaign details from args
        const createArgs = args.split('|');
        const name = createArgs[0]?.trim();
        const message = createArgs[1]?.trim();
        const audienceId = createArgs[2]?.trim();
        
        if (!name || !message) {
          return {
            intent: 'error',
            primaryService: 'postscript',
            secondaryServices: [],
            parameters: {
              error: 'Campaign name and message are required'
            },
            confidence: 1.0
          };
        }
        
        return {
          intent: 'create_campaign',
          primaryService: 'postscript',
          secondaryServices: [],
          parameters: {
            name,
            message,
            audienceId
          },
          confidence: 1.0
        };
        
      case 'audiences':
        // Parse limit and page from args (if provided)
        const audArgs = args.split(' ');
        const audLimit = audArgs[0] && !isNaN(parseInt(audArgs[0])) ? parseInt(audArgs[0]) : 20;
        const audPage = audArgs[1] && !isNaN(parseInt(audArgs[1])) ? parseInt(audArgs[1]) : 1;
        
        return {
          intent: 'get_audiences',
          primaryService: 'postscript',
          secondaryServices: [],
          parameters: {
            limit: audLimit,
            page: audPage
          },
          confidence: 1.0
        };
        
      case 'summary':
        return {
          intent: 'get_performance_summary',
          primaryService: 'postscript',
          secondaryServices: [],
          parameters: {},
          confidence: 1.0
        };
        
      default:
        // Generic fallback for unknown Postscript commands
        return {
          intent: 'help',
          primaryService: 'postscript',
          secondaryServices: [],
          parameters: {
            command
          },
          confidence: 0.7
        };
    }
  }
  
  // Handle Northbeam commands
  if (service === 'northbeam') {
    // Helper function to parse date range arguments
    const parseDateRange = (argsStr: string) => {
      const args = argsStr.split(' ');
      let startDate, endDate, days;
      
      // Check if specific dates are provided
      if (args.length >= 2 && args[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
        startDate = args[0];
        endDate = args[1].match(/^\d{4}-\d{2}-\d{2}$/) ? args[1] : '';
      } 
      // Check if days are provided
      else if (args.length >= 1 && !isNaN(parseInt(args[0]))) {
        days = parseInt(args[0]);
      }
      
      // Generate dates if days are provided
      if (days && !startDate) {
        endDate = new Date().toISOString().split('T')[0];
        startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      
      // Default to last 30 days if no dates or days provided
      if (!startDate) {
        endDate = new Date().toISOString().split('T')[0];
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      
      return {
        startDate,
        endDate,
        days
      };
    };
    
    switch (command) {
      case 'performance':
        const perfDates = parseDateRange(args);
        
        return {
          intent: 'get_performance',
          primaryService: 'northbeam',
          secondaryServices: [],
          parameters: {
            startDate: perfDates.startDate,
            endDate: perfDates.endDate
          },
          confidence: 1.0
        };
        
      case 'channels':
        const argsArray = args.split('|');
        const channelDates = parseDateRange(argsArray[0]);
        const channel = argsArray.length > 1 ? argsArray[1].trim() : '';
        
        return {
          intent: 'get_channel_metrics',
          primaryService: 'northbeam',
          secondaryServices: [],
          parameters: {
            startDate: channelDates.startDate,
            endDate: channelDates.endDate,
            channel
          },
          confidence: 1.0
        };
        
      case 'campaigns':
        const campArgsArray = args.split('|');
        const campaignDates = parseDateRange(campArgsArray[0]);
        const platformName = campArgsArray.length > 1 ? campArgsArray[1].trim() : '';
        
        return {
          intent: 'get_campaign_metrics',
          primaryService: 'northbeam',
          secondaryServices: [],
          parameters: {
            startDate: campaignDates.startDate,
            endDate: campaignDates.endDate,
            platform: platformName
          },
          confidence: 1.0
        };
        
      case 'attribution':
        const attrArgsArray = args.split('|');
        const attrDates = parseDateRange(attrArgsArray[0]);
        const model = attrArgsArray.length > 1 ? attrArgsArray[1].trim() : 'default';
        
        return {
          intent: 'get_attribution',
          primaryService: 'northbeam',
          secondaryServices: [],
          parameters: {
            startDate: attrDates.startDate,
            endDate: attrDates.endDate,
            model
          },
          confidence: 1.0
        };
        
      case 'roas':
        const roasArgsArray = args.split('|');
        const roasDates = parseDateRange(roasArgsArray[0]);
        const roasChannel = roasArgsArray.length > 1 ? roasArgsArray[1].trim() : '';
        
        return {
          intent: 'get_roas',
          primaryService: 'northbeam',
          secondaryServices: [],
          parameters: {
            startDate: roasDates.startDate,
            endDate: roasDates.endDate,
            channel: roasChannel
          },
          confidence: 1.0
        };
        
      case 'summary':
        // Parse days from args (if provided)
        const summaryDays = args.trim() && !isNaN(parseInt(args.trim())) ? 
          parseInt(args.trim()) : 30;
        
        return {
          intent: 'get_performance_summary',
          primaryService: 'northbeam',
          secondaryServices: [],
          parameters: {
            days: summaryDays
          },
          confidence: 1.0
        };
        
      default:
        // Generic fallback for unknown Northbeam commands
        return {
          intent: 'help',
          primaryService: 'northbeam',
          secondaryServices: [],
          parameters: {
            command
          },
          confidence: 0.7
        };
    }
  }
  
  // Handle Notion commands
  if (service === 'notion') {
    switch (command) {
      case 'tasks':
        const taskParam = args.trim().toLowerCase();
        if (taskParam.startsWith('priority:')) {
          const priority = taskParam.split(':')[1]?.trim() || 'high';
          return {
            intent: 'get_tasks',
            primaryService: 'notion',
            secondaryServices: [],
            parameters: {
              priority: priority
            },
            confidence: 1.0
          };
        } else if (taskParam.startsWith('due:')) {
          const duePeriod = taskParam.split(':')[1]?.trim() || 'today';
          return {
            intent: 'get_tasks',
            primaryService: 'notion',
            secondaryServices: [],
            parameters: {
              due: duePeriod
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_tasks',
            primaryService: 'notion',
            secondaryServices: [],
            parameters: {},
            confidence: 1.0
          };
        }
        
      case 'add_task':
        return {
          intent: 'create_task',
          primaryService: 'notion',
          secondaryServices: [],
          parameters: {
            title: args.trim() || 'New Task'
          },
          confidence: 1.0
        };
        
      case 'database':
      case 'list_databases':
        return {
          intent: 'list_databases',
          primaryService: 'notion',
          secondaryServices: [],
          parameters: {},
          confidence: 1.0
        };
        
      case 'create_page':
        return {
          intent: 'create_page',
          primaryService: 'notion',
          secondaryServices: [],
          parameters: {
            title: args.trim() || 'New Page'
          },
          confidence: 1.0
        };
        
      case 'search':
        return {
          intent: 'search_content',
          primaryService: 'notion',
          secondaryServices: [],
          parameters: {
            query: args.trim()
          },
          confidence: 1.0
        };
        
      default:
        // Generic fallback for unknown Notion commands
        return {
          intent: 'help',
          primaryService: 'notion',
          secondaryServices: [],
          parameters: {
            command
          },
          confidence: 0.7
        };
    }
  }
  
  // Handle Gorgias commands
  if (service === 'gorgias') {
    switch (command) {
      case 'tickets':
        const ticketParam = args.trim().toLowerCase();
        if (ticketParam.startsWith('status:')) {
          const status = ticketParam.split(':')[1]?.trim() || 'open';
          return {
            intent: 'get_tickets',
            primaryService: 'gorgias',
            secondaryServices: [],
            parameters: {
              status: status
            },
            confidence: 1.0
          };
        } else if (ticketParam.startsWith('priority:')) {
          const priority = ticketParam.split(':')[1]?.trim() || 'high';
          return {
            intent: 'get_tickets',
            primaryService: 'gorgias',
            secondaryServices: [],
            parameters: {
              priority: priority
            },
            confidence: 1.0
          };
        } else if (ticketParam.startsWith('assigned:')) {
          const assignee = ticketParam.split(':')[1]?.trim() || 'me';
          return {
            intent: 'get_tickets',
            primaryService: 'gorgias',
            secondaryServices: [],
            parameters: {
              assignee: assignee
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'get_tickets',
            primaryService: 'gorgias',
            secondaryServices: [],
            parameters: {},
            confidence: 1.0
          };
        }
        
      case 'satisfaction':
        return {
          intent: 'get_satisfaction_metrics',
          primaryService: 'gorgias',
          secondaryServices: [],
          parameters: {
            period: args.trim() || 'last 30 days'
          },
          confidence: 1.0
        };
        
      case 'agent_stats':
        return {
          intent: 'get_agent_performance',
          primaryService: 'gorgias',
          secondaryServices: [],
          parameters: {
            agent: args.trim() || 'all',
            period: 'last 30 days'
          },
          confidence: 1.0
        };
        
      case 'create_ticket':
        return {
          intent: 'create_ticket',
          primaryService: 'gorgias',
          secondaryServices: [],
          parameters: {
            subject: args.trim() || 'New Support Ticket'
          },
          confidence: 1.0
        };
        
      case 'response_time':
        return {
          intent: 'get_response_time_metrics',
          primaryService: 'gorgias',
          secondaryServices: [],
          parameters: {
            period: args.trim() || 'last 30 days'
          },
          confidence: 1.0
        };
        
      default:
        // Generic fallback for unknown Gorgias commands
        return {
          intent: 'help',
          primaryService: 'gorgias',
          secondaryServices: [],
          parameters: {
            command
          },
          confidence: 0.7
        };
    }
  }
  
  // Handle Recharm commands
  if (service === 'recharm') {
    switch (command) {
      case 'abandoned_carts':
        return {
          intent: 'get_abandoned_carts',
          primaryService: 'recharm',
          secondaryServices: [],
          parameters: {
            limit: 20,
            period: args.trim() || 'last 7 days'
          },
          confidence: 1.0
        };
        
      case 'active_campaigns':
        return {
          intent: 'get_active_campaigns',
          primaryService: 'recharm',
          secondaryServices: [],
          parameters: {
            limit: 20
          },
          confidence: 1.0
        };
        
      case 'campaign_performance':
        return {
          intent: 'get_campaign_performance',
          primaryService: 'recharm',
          secondaryServices: [],
          parameters: {
            period: args.trim() || 'last 30 days'
          },
          confidence: 1.0
        };
        
      case 'email_metrics':
        return {
          intent: 'get_email_metrics',
          primaryService: 'recharm',
          secondaryServices: [],
          parameters: {
            period: args.trim() || 'last 30 days'
          },
          confidence: 1.0
        };
        
      case 'subscriber_growth':
        return {
          intent: 'get_subscriber_growth',
          primaryService: 'recharm',
          secondaryServices: [],
          parameters: {
            period: args.trim() || 'last 30 days'
          },
          confidence: 1.0
        };
        
      case 'create_campaign':
        return {
          intent: 'create_campaign',
          primaryService: 'recharm',
          secondaryServices: [],
          parameters: {
            name: args.trim() || 'New Recovery Campaign'
          },
          confidence: 1.0
        };
        
      default:
        // Generic fallback for unknown Recharm commands
        return {
          intent: 'help',
          primaryService: 'recharm',
          secondaryServices: [],
          parameters: {
            command
          },
          confidence: 0.7
        };
    }
  }
  
  // Handle Prescient AI commands
  if (service === 'prescientai') {
    switch (command) {
      case 'forecast':
        const forecastType = args.trim().toLowerCase();
        if (forecastType === 'sales') {
          return {
            intent: 'forecast_sales',
            primaryService: 'prescientai',
            secondaryServices: [],
            parameters: {
              period: 'next 30 days'
            },
            confidence: 1.0
          };
        } else if (forecastType === 'inventory') {
          return {
            intent: 'forecast_inventory',
            primaryService: 'prescientai',
            secondaryServices: [],
            parameters: {
              period: 'next 30 days'
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'forecast',
            primaryService: 'prescientai',
            secondaryServices: [],
            parameters: {
              type: 'general',
              period: 'next 30 days'
            },
            confidence: 1.0
          };
        }
        
      case 'analyze':
        const analysisType = args.trim().toLowerCase();
        if (analysisType === 'customer_behavior') {
          return {
            intent: 'analyze_customer_behavior',
            primaryService: 'prescientai',
            secondaryServices: [],
            parameters: {
              depth: 'detailed'
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'analyze',
            primaryService: 'prescientai',
            secondaryServices: [],
            parameters: {
              type: analysisType || 'general'
            },
            confidence: 1.0
          };
        }
        
      case 'optimize':
        const optimizationType = args.trim().toLowerCase();
        if (optimizationType === 'pricing') {
          return {
            intent: 'optimize_pricing',
            primaryService: 'prescientai',
            secondaryServices: [],
            parameters: {
              products: 'all'
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'optimize',
            primaryService: 'prescientai',
            secondaryServices: [],
            parameters: {
              type: optimizationType || 'general'
            },
            confidence: 1.0
          };
        }
        
      case 'trends':
        const trendsType = args.trim().toLowerCase();
        if (trendsType === 'market') {
          return {
            intent: 'analyze_market_trends',
            primaryService: 'prescientai',
            secondaryServices: [],
            parameters: {
              period: 'last 90 days'
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'analyze_trends',
            primaryService: 'prescientai',
            secondaryServices: [],
            parameters: {
              type: trendsType || 'general',
              period: 'last 90 days'
            },
            confidence: 1.0
          };
        }
        
      case 'predict':
        const predictionType = args.trim().toLowerCase();
        if (predictionType === 'demand') {
          return {
            intent: 'predict_demand',
            primaryService: 'prescientai',
            secondaryServices: [],
            parameters: {
              period: 'next 60 days'
            },
            confidence: 1.0
          };
        } else {
          return {
            intent: 'predict',
            primaryService: 'prescientai',
            secondaryServices: [],
            parameters: {
              type: predictionType || 'general'
            },
            confidence: 1.0
          };
        }
        
      default:
        // Generic fallback for unknown Prescient AI commands
        return {
          intent: 'help',
          primaryService: 'prescientai',
          secondaryServices: [],
          parameters: {
            command
          },
          confidence: 0.7
        };
    }
  }
  
  // Handle Elevar commands
  if (service === 'elevar') {
    switch (command) {
      case 'analytics':
        return {
          intent: 'get_analytics_overview',
          primaryService: 'elevar',
          secondaryServices: [],
          parameters: {
            period: args.trim() || 'last 30 days'
          },
          confidence: 1.0
        };
        
      case 'tracking_issues':
        return {
          intent: 'get_tracking_issues',
          primaryService: 'elevar',
          secondaryServices: [],
          parameters: {
            severity: 'all'
          },
          confidence: 1.0
        };
        
      case 'conversions':
        return {
          intent: 'get_conversion_metrics',
          primaryService: 'elevar',
          secondaryServices: [],
          parameters: {
            period: args.trim() || 'last 30 days'
          },
          confidence: 1.0
        };
        
      case 'utm_analysis':
        return {
          intent: 'analyze_utm_campaigns',
          primaryService: 'elevar',
          secondaryServices: [],
          parameters: {
            period: args.trim() || 'last 30 days'
          },
          confidence: 1.0
        };
        
      case 'tag_health':
        return {
          intent: 'check_tag_health',
          primaryService: 'elevar',
          secondaryServices: [],
          parameters: {},
          confidence: 1.0
        };
        
      case 'attribution_models':
        return {
          intent: 'get_attribution_models',
          primaryService: 'elevar',
          secondaryServices: [],
          parameters: {},
          confidence: 1.0
        };
        
      default:
        // Generic fallback for unknown Elevar commands
        return {
          intent: 'help',
          primaryService: 'elevar',
          secondaryServices: [],
          parameters: {
            command
          },
          confidence: 0.7
        };
    }
  }
  
  // Return null if we can't classify
  return null;
}