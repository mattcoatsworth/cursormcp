/**
 * Utility functions for handling chained/multi-step commands
 */
import { parseSlashCommand } from "./slashCommands";
import { processShopifyCommand } from "../integrations/shopify";
import { processSlackCommand } from "../integrations/slack";
import { classifyCommand, generateDataVisualization } from "../integrations/openai";

/**
 * Process a chained command that involves multiple services
 * Example: "/shopify get_sales from the last 30 days and send the info to /slack send #general"
 */
export async function processChainedCommand(commandText: string): Promise<any> {
  // Check if this is a chained command with both Shopify and Slack
  const hasShopify = commandText.toLowerCase().includes('/shopify');
  const hasSlack = commandText.toLowerCase().includes('/slack') || 
                   commandText.toLowerCase().includes('send to slack') || 
                   commandText.toLowerCase().includes('slack channel');
  
  // If doesn't have both Shopify and Slack, not a chained command
  if (!hasShopify || !hasSlack) {
    return null;
  }
  
  try {
    // Extract the Shopify part of the command
    let shopifyCommand = '';
    if (commandText.startsWith('/shopify')) {
      // If it starts with /shopify, extract until we find slack
      const slackIndex = commandText.toLowerCase().indexOf('/slack');
      const andSendIndex = commandText.toLowerCase().indexOf('and send');
      
      if (slackIndex > 0) {
        shopifyCommand = commandText.substring(0, slackIndex).trim();
      } else if (andSendIndex > 0) {
        shopifyCommand = commandText.substring(0, andSendIndex).trim();
      } else {
        // Can't parse properly
        return null;
      }
    } else {
      return null; // Not starting with /shopify
    }
    
    // Parse the Shopify command
    const shopifySlashCommand = parseSlashCommand(shopifyCommand);
    if (!shopifySlashCommand || shopifySlashCommand.service !== 'shopify') {
      return null;
    }
    
    // Get Shopify classification
    const shopifyClassification = {
      intent: shopifySlashCommand.command,
      primaryService: 'shopify',
      secondaryServices: [],
      parameters: {},
      confidence: 1.0
    };
    
    // Extract date range parameters
    if (shopifySlashCommand.command === 'get_sales') {
      // Check for time period patterns
      const timePeriodMatch = shopifySlashCommand.args.match(/from\s+the\s+(last\s+\d+\s+(?:day|days|week|weeks|month|months)|last\s+(?:day|week|month|year)|today|this\s+(?:week|month|year))/i);
      
      const params: Record<string, any> = { limit: 20 }; // Default limit
      
      if (timePeriodMatch && timePeriodMatch[1]) {
        params.time_period = timePeriodMatch[1];
      } else if (shopifySlashCommand.args.includes('last') && shopifySlashCommand.args.includes('days')) {
        const daysMatch = shopifySlashCommand.args.match(/last\s+(\d+)\s+days/i);
        if (daysMatch && daysMatch[1]) {
          params.days = parseInt(daysMatch[1]);
        }
      }
      
      shopifyClassification.parameters = params;
    }
    
    // Process the Shopify command to get data
    const shopifyResult = await processShopifyCommand(shopifyCommand, shopifyClassification);
    
    // Now extract the Slack part of the command
    let slackCommand = '';
    const slackIndex = commandText.toLowerCase().indexOf('/slack');
    
    if (slackIndex > 0) {
      // Extract explicit /slack command
      slackCommand = commandText.substring(slackIndex).trim();
    } else {
      // Look for "send to" patterns
      const sendToMatch = commandText.match(/(?:and\s+)?send\s+(?:the\s+)?(?:info|data|results|sales)?\s+to\s+(?:slack\s+)?(?:channel\s+)?([#@]\w+)/i);
      
      if (sendToMatch && sendToMatch[1]) {
        const channel = sendToMatch[1];
        slackCommand = `/slack send ${channel} `;
      } else {
        // Can't find a valid Slack channel
        return {
          success: false,
          error: "Could not find a valid Slack channel to send results to. Please use format like '/slack send #general' or 'send to #general'."
        };
      }
    }
    
    // Parse the Slack command
    const slackSlashCommand = parseSlashCommand(slackCommand);
    if (!slackSlashCommand || slackSlashCommand.service !== 'slack') {
      return {
        success: false,
        error: "Could not parse the Slack command. Please use format like '/slack send #general'."
      };
    }
    
    // Prepare a message for Slack with the Shopify data
    let slackMessage = '';
    
    // Check if this is a visualization request
    const isVisualizationRequest = commandText.toLowerCase().includes('visualization') || 
                                  commandText.toLowerCase().includes('visualize') || 
                                  commandText.toLowerCase().includes('graph') || 
                                  commandText.toLowerCase().includes('chart') || 
                                  commandText.toLowerCase().includes('analyze');
    
    // Determine chart type if visualization requested
    const chartType = commandText.toLowerCase().includes('bar') ? 'bar' : 'line';
    
    if (shopifyResult && shopifyResult.success) {
      // For visualization requests, generate a chart
      if (isVisualizationRequest && shopifyClassification.intent === 'get_sales' && shopifyResult.data && shopifyResult.data.orders) {
        // Generate a data visualization
        const visualization = await generateDataVisualization(shopifyResult, chartType);
        
        // Use the visualization as the Slack message
        slackMessage = visualization;
      }
      // Regular text formatting for standard requests
      else if (shopifyClassification.intent === 'get_sales' && shopifyResult.data && shopifyResult.data.orders) {
        // Get time period description
        const params = shopifyClassification.parameters as Record<string, any>;
        
        // Format time description with precise dates
        let timeDesc = '';
        
        if (params.time_period) {
          if (params.time_period.toLowerCase().includes('last') && 
              params.time_period.match(/last\s+(\d+)\s+(day|days|week|weeks|month|months)/i)) {
            const matches = params.time_period.match(/last\s+(\d+)\s+(day|days|week|weeks|month|months)/i);
            const amount = parseInt(matches[1]);
            const unit = matches[2].toLowerCase();
            
            // Calculate precise dates for description
            const now = new Date();
            const startDate = new Date(now);
            
            if (unit.startsWith('day')) {
              startDate.setDate(startDate.getDate() - amount);
              timeDesc = `last ${amount} days (${startDate.toLocaleDateString()} to ${now.toLocaleDateString()})`;
            } else if (unit.startsWith('week')) {
              startDate.setDate(startDate.getDate() - (amount * 7));
              timeDesc = `last ${amount} weeks (${startDate.toLocaleDateString()} to ${now.toLocaleDateString()})`;
            } else if (unit.startsWith('month')) {
              startDate.setMonth(startDate.getMonth() - amount);
              timeDesc = `last ${amount} months (${startDate.toLocaleDateString()} to ${now.toLocaleDateString()})`;
            }
          } else {
            // For other time periods, use as-is
            timeDesc = params.time_period;
          }
        } else if (params.days) {
          const daysAgo = parseInt(params.days);
          const now = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - daysAgo);
          timeDesc = `last ${params.days} days (${startDate.toLocaleDateString()} to ${now.toLocaleDateString()})`;
        } else {
          timeDesc = 'recent period';
        }
        
        // Calculate total sales
        const orders = shopifyResult.data.orders;
        const totalOrders = orders.length;
        let totalSales = 0;
        
        orders.forEach((order: any) => {
          totalSales += parseFloat(order.total_price) || 0;
        });
        
        // Format the message
        slackMessage = `*Shopify Sales Report (${timeDesc})*\n\n` +
                      `• Total Orders: ${totalOrders}\n` +
                      `• Total Sales: $${totalSales.toFixed(2)}\n\n` +
                      `*Recent Orders:*\n`;
        
        // Add up to 5 recent orders
        const recentOrders = orders.slice(0, 5);
        recentOrders.forEach((order: any, index: number) => {
          const orderDate = new Date(order.created_at).toLocaleDateString();
          slackMessage += `${index + 1}. Order #${order.order_number || order.name} - $${parseFloat(order.total_price).toFixed(2)} (${orderDate})\n`;
        });
        
        if (totalOrders > 5) {
          slackMessage += `\n_...and ${totalOrders - 5} more orders_`;
        }
      } else if (shopifyClassification.intent === 'get_products' && shopifyResult.data && shopifyResult.data.products) {
        const products = shopifyResult.data.products;
        const totalProducts = products.length;
        
        slackMessage = `*Shopify Products Report*\n\n` +
                      `• Total Products: ${totalProducts}\n\n` +
                      `*Recent Products:*\n`;
        
        // Add up to 5 products
        const recentProducts = products.slice(0, 5);
        recentProducts.forEach((product: any, index: number) => {
          slackMessage += `${index + 1}. ${product.title} - ${product.variants_count} variants\n`;
        });
        
        if (totalProducts > 5) {
          slackMessage += `\n_...and ${totalProducts - 5} more products_`;
        }
      } else {
        // Generic data
        slackMessage = `*Shopify Data*\n\nSuccessfully retrieved data from Shopify.`;
      }
    } else {
      slackMessage = "Error: Could not retrieve data from Shopify.";
    }
    
    // Add the formatted message to the Slack command
    if (slackSlashCommand.command === 'send') {
      // Add the message to the channel argument
      const slackChannel = slackSlashCommand.args.split(' ')[0];
      const updatedSlackCommand = `/slack send ${slackChannel} ${slackMessage}`;
      
      // Get Slack classification
      const slackClassification = {
        intent: 'send_message',
        primaryService: 'slack',
        secondaryServices: [],
        parameters: {
          channel: slackChannel,
          message: slackMessage
        },
        confidence: 1.0
      };
      
      // Process the Slack command
      const slackResult = await processSlackCommand(updatedSlackCommand, slackClassification);
      
      // Return the combined result with appropriate message
      let resultMessage = '';
      if (isVisualizationRequest) {
        const chartTypeText = chartType === 'bar' ? 'bar chart' : 'line graph';
        resultMessage = `Successfully created a ${chartTypeText} visualization of your Shopify ${shopifyClassification.intent} data and sent it to Slack channel ${slackChannel}`;
      } else {
        resultMessage = `Successfully sent Shopify ${shopifyClassification.intent} data to Slack channel ${slackChannel}`;
      }
      
      return {
        success: true,
        shopifyResult,
        slackResult,
        message: resultMessage,
        isVisualization: isVisualizationRequest,
        chartType
      };
    } else {
      return {
        success: false,
        error: "The Slack command must be a 'send' command to forward data from Shopify."
      };
    }
  } catch (error: any) {
    console.error("Error processing chained command:", error);
    return {
      success: false,
      error: `Error processing chained command: ${error?.message || String(error)}`
    };
  }
}