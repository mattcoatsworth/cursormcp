import { storage } from "../storage";
import { processShopifyCommand } from "../integrations/shopify";
import { processShopifyMcpCommand } from "../integrations/shopifyMcp";
import { processKlaviyoCommand } from "../integrations/klaviyo";
import { processSlackCommand } from "../integrations/slack";
import { processSlackMcpCommand } from "../integrations/slackMcp";
import { processNotionCommand } from "../integrations/notion";
import { processNotionMcpCommand } from "../integrations/notionMcp";
import { classifyCommand, generateResponse, generateDataVisualization, generateDirectResponse } from "../integrations/openai";
import { GitHubCommandResult } from "../integrations/githubMcp";
import { 
  processGoogleCalendarCommand, 
  processAsanaCommand,
  processGDriveCommand,
  processFigmaCommand
} from "../processors/mcpProcessors";

// Type definitions for command processor
interface CommandClassification {
  service: string;
  intent: string;
  parameters: Record<string, any>;
}

type CommandResult = {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
};
// Import our new MCP processors
import { 
  processTripleWhaleCommand, 
  processPostscriptCommand,
  processNorthbeamCommand,
  processGorgiasCommand,
  processRecharmCommand,
  processPrescientAiCommand,
  processElevarCommand
} from "./mcpProcessors";
import { parseSlashCommand, classifySlashCommand } from "../utils/slashCommands";
import { processChainedCommand } from "../utils/chainedCommands";
import { processMultiServiceCommand, isMultiServiceCommand } from "../utils/multiServiceCommands";

// Command processor function
export async function processCommand(
  commandText: string,
  processingMessageId: number,
  commandHistoryId: number,
  quiet: boolean = false
): Promise<void> {
  try {
    // Only show processing messages if not in quiet mode
    if (!quiet && processingMessageId > 0) {
      await updateProcessingMessage(
        processingMessageId, 
        "Analyzing your command...",
        []
      );
      
      // Minimal delay for better UX, but fast enough for users
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Check if this is a direct general query (not a service-specific command)
    // We'll route all general questions to ChatGPT by default
    const isSlashCommand = commandText.startsWith('/');
    const hasAnyServiceKeyword = ['shopify', 'klaviyo', 'slack', 'notion', 'postscript', 
                                 'northbeam', 'triple whale', 'gorgias', 'recharm', 
                                 'prescient ai', 'elevar', 'google calendar', 'asana', 
                                 'gdrive', 'figma', 'github'].some(
      keyword => commandText.toLowerCase().includes(keyword)
    );
    
    // Check for multiple service keywords in the same command
    const matchedServices = ['shopify', 'klaviyo', 'slack', 'notion', 'postscript', 
                           'northbeam', 'triple whale', 'gorgias', 'recharm', 
                           'prescient ai', 'elevar', 'google calendar', 'asana', 
                           'gdrive', 'figma', 'github'].filter(
      keyword => commandText.toLowerCase().includes(keyword)
    );
    
    const hasMultipleServices = matchedServices.length > 1;
    
    // Route to ChatGPT if it's not a slash command and doesn't mention any specific service
    const isDirectChatGptQuery = !isSlashCommand && !hasAnyServiceKeyword;
    
    if (isDirectChatGptQuery) {
      if (!quiet && processingMessageId > 0) {
        await updateProcessingMessage(
          processingMessageId,
          "Processing your query with ChatGPT...",
          ["Analyzing your query ✓", "Routing to ChatGPT ✓"]
        );
      }
      
      try {
        // Generate a direct response from ChatGPT
        const response = await generateDirectResponse(commandText);
        
        // Update command history
        if (commandHistoryId > 0) {
          await storage.updateCommandHistoryEntry(commandHistoryId, {
            result: {
              success: true,
              service: "openai",
              data: { response }
            },
            status: "completed",
            processedAt: new Date()
          });
        }
        
        // Create a response message
        await storage.createChatMessage({
          role: "assistant",
          content: response,
          metadata: {
            deliveryStatus: "delivered",
            service: "openai",
            directResponse: true
          }
        });
        
        // Log for debugging
        console.log(`Processed direct ChatGPT query: "${commandText.substring(0, 50)}..."`);
        
        return; // Exit early since we've handled this query
      } catch (error) {
        console.error("Error processing direct ChatGPT query:", error);
        // Continue with normal command processing as fallback
      }
    }
    
    // First, check if this is a complex command with analysis/visualization
    // This expression covers retrieve, analyze, graph, visualization, etc.
    if ((commandText.toLowerCase().includes('analyze') || 
         commandText.toLowerCase().includes('graph') || 
         commandText.toLowerCase().includes('visualization') ||
         commandText.toLowerCase().includes('visualize') ||
         commandText.toLowerCase().includes('retrieve') ||
         commandText.toLowerCase().includes('get data from shopify')) && 
        (commandText.includes('/shopify') || commandText.includes('shopify') || 
         commandText.includes('/slack') || commandText.includes('slack'))) {
      
      if (!quiet && processingMessageId > 0) {
        await updateProcessingMessage(
          processingMessageId, 
          "Detected data visualization request...",
          ["Analyzing your command ✓"]
        );
      }
      
      // This is a visualization request
      // We'll handle it with a special response
      try {
        // Extract the key parts - assume shopify data + visualization + slack
        // Make the pattern more flexible to catch different variations
        const shopifySlashPattern = /\/shopify\s+get_sales.*?(\d+)\s+days/i;
        const shopifyNaturalPattern = /(?:get|retrieve|pull)\s+(?:shopify|sales|data).*?(?:for|from|of)\s+(?:the\s+)?(?:last\s+)?(\d+)\s+days/i;
        
        // Additional pattern to catch more variations of natural language
        const additionalPattern = /(?:shopify|sales).*?(?:last|past|previous)\s+(\d+)\s+days/i;
        
        const shopifySlashMatch = commandText.match(shopifySlashPattern);
        const shopifyNaturalMatch = commandText.match(shopifyNaturalPattern);
        const additionalMatch = commandText.match(additionalPattern);
        const shopifyMatch = shopifySlashMatch || shopifyNaturalMatch || additionalMatch;
        
        if (shopifyMatch) {
          const days = shopifyMatch[1] || "7"; // Default to 7 if not specified
          
          // Get channel for Slack - more comprehensive channel detection
          let channel = "#general"; // Default
          
          // Try different patterns to find channel mention
          // Pattern 1: Regular hashtag like #general or #sales
          const hashtagMatch = commandText.match(/#(\w+)/);
          // Pattern 2: "to slack" or "to channel" followed by word or hashtag
          const toSlackMatch = commandText.match(/to\s+(?:slack|channel)\s+(?:#)?(\w+)/i);
          // Pattern 3: "send to" followed by word or hashtag
          const sendToMatch = commandText.match(/send\s+to\s+(?:#)?(\w+)/i);
          // Pattern 4: "in" followed by word or hashtag
          const inChannelMatch = commandText.match(/in\s+(?:channel\s+)?(?:#)?(\w+)/i);
          
          // Use the first match found in order of specificity
          if (hashtagMatch) {
            channel = hashtagMatch[0]; // Use the full match with # symbol
          } else if (toSlackMatch) {
            channel = toSlackMatch[1].startsWith('#') ? toSlackMatch[1] : `#${toSlackMatch[1]}`;
          } else if (sendToMatch) {
            channel = sendToMatch[1].startsWith('#') ? sendToMatch[1] : `#${sendToMatch[1]}`;
          } else if (inChannelMatch) {
            channel = inChannelMatch[1].startsWith('#') ? inChannelMatch[1] : `#${inChannelMatch[1]}`;
          }
          
          // Special handling for user requesting ChatGPT visualization
          // In this case, if the command includes visualization keywords, assume we should use ChatGPT
          // This way we'll catch both explicit ChatGPT mentions and implied visualization requests
          const hasVisualizationKeywords = commandText.toLowerCase().includes('visualization') || 
                                          commandText.toLowerCase().includes('visualize') || 
                                          commandText.toLowerCase().includes('graph') || 
                                          commandText.toLowerCase().includes('chart');
          
          const explicitChatGpt = commandText.toLowerCase().includes('chatgpt') || 
                                 commandText.toLowerCase().includes('gpt') ||
                                 commandText.toLowerCase().includes('use ai') ||
                                 commandText.toLowerCase().includes('openai');
                                 
          // Check if this is a direct query to ChatGPT without service-specific data needs
          // This is the case when user just wants to chat with AI directly
          const isDirect = explicitChatGpt && 
                          !commandText.toLowerCase().includes('shopify') && 
                          !commandText.toLowerCase().includes('slack') && 
                          !commandText.toLowerCase().includes('klaviyo') &&
                          !commandText.toLowerCase().includes('notion');
          
          // Use direct ChatGPT mode if this is a direct query
          if (isDirect) {
            // Show processing message
            if (!quiet && processingMessageId > 0) {
              await updateProcessingMessage(
                processingMessageId,
                "Processing your query with ChatGPT...",
                ["Analyzing your command ✓", "Routing to ChatGPT ✓"]
              );
            }
            
            // Process with direct ChatGPT
            try {
              const response = await generateDirectResponse(commandText);
              
              // Create a result object
              const result = {
                success: true,
                service: "openai",
                data: { response }
              };
              
              // Update command history with the result
              if (commandHistoryId > 0) {
                await storage.updateCommandHistoryEntry(commandHistoryId, {
                  result,
                  status: "completed",
                  processedAt: new Date()
                });
              }
              
              // Create a response message
              await storage.createChatMessage({
                role: "assistant",
                content: response,
                metadata: {
                  deliveryStatus: "delivered",
                  service: "openai",
                  directResponse: true
                }
              });
              
              // Log for debugging
              console.log(`Processed direct ChatGPT query in visualization context: "${commandText.substring(0, 50)}..."`);
              
              return;
            } catch (error) {
              console.error("Error processing direct ChatGPT query:", error);
              
              // Fail gracefully by continuing with normal command processing
            }
          }
          
          // For data visualization or mixed service requests
          const useChatGpt = explicitChatGpt || hasVisualizationKeywords;
          
          if (useChatGpt) {
            // Show processing message
            if (!quiet && processingMessageId > 0) {
              await updateProcessingMessage(
                processingMessageId, 
                "Getting Shopify data for visualization...",
                ["Analyzing your command ✓", "Detecting visualization request ✓"]
              );
            }
            
            // 1. First, get data from Shopify
            const shopifyClassification = {
              intent: "get_sales",
              primaryService: "shopify",
              parameters: { 
                days: parseInt(days),
                time_period: `last ${days} days`
              },
              confidence: 1.0
            };
            
            const shopifyResult = await processShopifyCommand(commandText, shopifyClassification);
            
            if (!shopifyResult || !shopifyResult.success) {
              throw new Error(shopifyResult?.message || "Failed to retrieve Shopify data");
            }
            
            // 2. Process with visualization
            if (!quiet && processingMessageId > 0) {
              await updateProcessingMessage(
                processingMessageId, 
                "Generating visualization from sales data...",
                ["Analyzing your command ✓", "Retrieving Shopify data ✓"]
              );
            }
            
            // Generate the visualization
            const chartType = commandText.toLowerCase().includes('bar') ? 'bar' : 'line';
            const visualization = await generateDataVisualization(shopifyResult, chartType);
            
            // 3. Send to Slack
            if (!quiet && processingMessageId > 0) {
              await updateProcessingMessage(
                processingMessageId, 
                "Sending visualization to Slack...",
                ["Analyzing your command ✓", "Retrieving Shopify data ✓", "Creating visualization ✓"]
              );
            }
            
            // Prepare Slack message
            const slackClassification = {
              intent: "send_message",
              primaryService: "slack",
              parameters: {
                channel: channel,
                message: visualization
              },
              confidence: 1.0
            };
            
            // Send to Slack
            const slackResult = await processSlackCommand(commandText, slackClassification);
            
            if (!slackResult || !slackResult.success) {
              throw new Error(slackResult?.message || "Failed to send visualization to Slack");
            }
            
            // 4. Update command history and respond
            await storage.updateCommandHistoryEntry(commandHistoryId, {
              result: { 
                success: true,
                message: "Successfully created and shared visualization",
                shopifyResult,
                slackResult
              },
              status: "completed"
            });
            
            // Create summary response
            const responseContent = `✅ I've created a visualization of your Shopify sales data for the last ${days} days and sent it to Slack ${channel}.

The visualization shows your sales trends over time. You can view it in the Slack channel now.

Data summary:
- Time period: Last ${days} days
- Orders analyzed: ${shopifyResult.data?.orders?.length || 0}
- Visualization type: ${chartType} chart`;
            
            // Create response message
            await storage.createChatMessage({
              role: "assistant",
              content: responseContent,
              metadata: { 
                deliveryStatus: "delivered",
                isVisualizationRequest: true,
                shopifyResult,
                slackResult
              }
            });
            
            return; // Done processing this special case
          }
          
          // If not using ChatGPT, provide helpful response
          const responseContent = `I understand you want to visualize Shopify sales data for the last ${days} days and share it on Slack.

To complete this process, I would:
1. Retrieve sales data from Shopify for the past ${days} days
2. Generate a line graph showing sales trends
3. Send this visualization to Slack channel ${channel}

I can do this for you now using AI to create the visualization. Try adding "use ChatGPT" to your command, like:
"Get data from Shopify for the last ${days} days, use ChatGPT to create a line graph, and send it to Slack ${channel}"`;
          
          // Update command history entry
          await storage.updateCommandHistoryEntry(commandHistoryId, {
            result: { 
              success: true,
              message: "Processed visualization request",
              suggestedCommand: `Get data from Shopify for the last ${days} days, use ChatGPT to create a line graph, and send it to Slack ${channel}`
            },
            status: "completed"
          });
          
          // Create response message
          await storage.createChatMessage({
            role: "assistant",
            content: responseContent,
            metadata: { 
              deliveryStatus: "delivered",
              isVisualizationRequest: true
            }
          });
          
          return; // Done processing this special case
        }
      } catch (error) {
        console.error("Error processing visualization request:", error);
        // Fall through to regular processing
      }
    }
    
    // Check if this is a chained command (like shopify + slack)
    if (commandText.includes('/shopify') && 
        (commandText.includes('/slack') || 
         commandText.includes('send to') || 
         commandText.includes('slack channel'))) {
      
      if (!quiet && processingMessageId > 0) {
        await updateProcessingMessage(
          processingMessageId, 
          "Detected multi-step command between Shopify and Slack...",
          ["Analyzing your command ✓"]
        );
      }
      
      try {
        // Process as a chained command
        const chainedResult = await processChainedCommand(commandText);
        
        if (chainedResult && chainedResult.success) {
          // Successfully processed the chained command
          await storage.updateCommandHistoryEntry(commandHistoryId, {
            result: chainedResult,
            status: "completed"
          });
          
          // Create a response message
          const responseContent = chainedResult.message || 
            "Successfully processed your multi-step command between Shopify and Slack.";
          
          // Add additional info for visualizations
          let enhancedResponseContent = responseContent;
          if (chainedResult.isVisualization) {
            const chartTypeText = chainedResult.chartType === 'bar' ? 'bar chart' : 'line graph';
            enhancedResponseContent = `${responseContent}
            
Data summary:
- Time period: ${chainedResult.shopifyResult?.parameters?.time_period || 'recent period'}
- Orders analyzed: ${chainedResult.shopifyResult?.data?.orders?.length || 0}
- Visualization type: ${chartTypeText}`;
          }
          
          await storage.createChatMessage({
            role: "assistant",
            content: enhancedResponseContent,
            metadata: { 
              deliveryStatus: "delivered",
              result: chainedResult,
              isVisualizationRequest: chainedResult.isVisualization || false
            }
          });
          
          return; // We're done with this command
        }
      } catch (error) {
        console.error("Error processing chained command:", error);
        // Continue with regular command processing
      }
    }
    
    let classification;
    
    // Check if this is a slash command first
    const slashCommand = parseSlashCommand(commandText);
    
    if (!quiet && processingMessageId > 0) {
      await updateProcessingMessage(
        processingMessageId,
        slashCommand ? "Processing slash command..." : "Determining intent from natural language...",
        ["Analyzing your command ✓"]
      );
      
      // Minimal delay for better UX, but fast enough for users
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (slashCommand) {
      // It's a slash command, use direct classification instead of AI
      classification = classifySlashCommand(
        slashCommand.service, 
        slashCommand.command,
        slashCommand.args
      );
      
      if (!quiet && processingMessageId > 0) {
        await updateProcessingMessage(
          processingMessageId,
          `Parsing slash command for ${slashCommand.service}...`,
          ["Analyzing your command ✓", "Identifying command type ✓"]
        );
        
        // Minimal delay for better UX, but fast enough for users 
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // If we couldn't classify it specifically, fall back to AI
      if (!classification) {
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId,
            "Using AI to further analyze command intent...",
            ["Analyzing your command ✓", "Identifying command type ✓"]
          );
        }
        
        classification = await classifyCommand(commandText);
      }
    } else {
      // Not a slash command, use AI classification
      if (!quiet && processingMessageId > 0) {
        await updateProcessingMessage(
          processingMessageId,
          "Using AI to understand your request...",
          ["Analyzing your command ✓"]
        );
        
        // Minimal delay for better UX, but fast enough for users 
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      classification = await classifyCommand(commandText);
      
      // Special handling for today's sales/orders requests
      if (commandText.toLowerCase().includes("today") && 
          (commandText.toLowerCase().includes("sales") || 
           commandText.toLowerCase().includes("orders") || 
           commandText.toLowerCase().includes("total"))) {
        console.log("Today's sales/orders detected in natural language command");
        
        // Force the 'today' parameter to ensure we get strict today-only data
        if (!classification.parameters) classification.parameters = {};
        classification.parameters.today = true;
        classification.parameters.time_period = "today";
        
        console.log("Enforced today parameters for sales/orders query", classification.parameters);
      }
    }
    
    // Update command entry with initial result
    await storage.updateCommandHistoryEntry(commandHistoryId, {
      result: { classification }
    });

    // Only send step updates if not in quiet mode
    if (!quiet && processingMessageId > 0) {
      await updateProcessingMessage(
        processingMessageId, 
        `Command identified: ${classification.intent}`,
        ["Analyzing your command ✓"]
      );
    }

    // Check if this is a multi-service command that needs to interact with multiple APIs
    // Check for multiple service keywords in same command - prioritize this over standard slash commands
    if (hasMultipleServices || isMultiServiceCommand(classification, commandText)) {
      if (!quiet && processingMessageId > 0) {
        // Create a user-friendly message about the services being called
        const primaryService = classification.primaryService || 'unknown';
        const secondaryServicesText = Array.isArray(classification.secondaryServices) && classification.secondaryServices.length > 0 
          ? `and ${classification.secondaryServices.join(', ')}` 
          : matchedServices.length > 1 ? `and ${matchedServices.filter(s => s !== primaryService.toLowerCase()).join(', ')}` : '';
        
        await updateProcessingMessage(
          processingMessageId,
          `Processing multi-service command involving ${primaryService} ${secondaryServicesText}...`,
          ["Analyzing your command ✓", "Identifying services to call ✓"]
        );
      }
      
      try {
        // Process command across multiple services
        const multiServiceResult = await processMultiServiceCommand(commandText, classification);
        
        // Update command history with result
        await storage.updateCommandHistoryEntry(commandHistoryId, {
          result: multiServiceResult,
          status: "completed"
        });
        
        // Generate a summary of results for each service
        let serviceResults = '';
        multiServiceResult.results.forEach(serviceResult => {
          const statusIcon = serviceResult.success ? '✅' : '❌';
          const serviceName = serviceResult.service.charAt(0).toUpperCase() + serviceResult.service.slice(1);
          
          serviceResults += `\n${statusIcon} ${serviceName}: ${serviceResult.success 
            ? (serviceResult.result.message || 'Operation completed successfully') 
            : (serviceResult.error || 'Operation failed')}`;
        });
        
        // Create response message
        const responseContent = `${multiServiceResult.message}${serviceResults}`;
        
        await storage.createChatMessage({
          role: "assistant",
          content: responseContent,
          metadata: {
            deliveryStatus: "delivered",
            multiServiceResult
          }
        });
        
        return; // We're done with this command
      } catch (error) {
        console.error("Error processing multi-service command:", error);
        // Continue with regular processing as fallback
      }
    }

    // Process based on classification
    let result: any = {};
    switch (classification.primaryService) {
      case "shopify":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Shopify API...",
            ["Analyzing your command ✓", "Identifying service: Shopify ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        try {
          // Try to use the MCP client first
          result = await processShopifyMcpCommand(commandText, classification);
        } catch (error) {
          console.warn("MCP client failed, falling back to legacy Shopify client:", error);
          // Fall back to legacy client if MCP fails
          result = await processShopifyCommand(commandText, classification);
        }
        break;
      case "klaviyo":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Klaviyo API...",
            ["Analyzing your command ✓", "Identifying service: Klaviyo ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        try {
          // Import the MCP client and use it first
          const { klaviyoMcpClient } = await import("../integrations/klaviyoMcp");
          // Try to process using the MCP client
          result = await klaviyoMcpClient.processCommand(classification.intent, classification.parameters);
        } catch (error) {
          console.warn("Klaviyo MCP client failed, falling back to legacy client:", error);
          // Fall back to legacy client if MCP fails
          result = await processKlaviyoCommand(commandText, classification);
        }
        break;
      case "postscript":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Postscript API...",
            ["Analyzing your command ✓", "Identifying service: Postscript ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        try {
          // Try to use the MCP client first
          const { postscriptMcpClient } = await import("../integrations/fixedMcpClients");
          
          // Call the appropriate method based on the intent
          switch (classification.intent) {
            case 'get_subscribers':
              result = await postscriptMcpClient.getSubscribers(
                classification.parameters.limit, 
                classification.parameters.page
              );
              break;
            case 'search_subscriber':
              result = await postscriptMcpClient.searchSubscriber(classification.parameters.phone);
              break;
            case 'get_campaigns':
              result = await postscriptMcpClient.getCampaigns(
                classification.parameters.limit, 
                classification.parameters.page
              );
              break;
            case 'get_campaign_details':
              result = await postscriptMcpClient.getCampaignDetails(classification.parameters.id);
              break;
            case 'get_analytics':
              result = await postscriptMcpClient.getAnalytics(classification.parameters.period);
              break;
            case 'send_sms':
              result = await postscriptMcpClient.sendSms(
                classification.parameters.phone, 
                classification.parameters.message
              );
              break;
            case 'create_campaign':
              result = await postscriptMcpClient.createCampaign(
                classification.parameters.name, 
                classification.parameters.message, 
                classification.parameters.audienceId
              );
              break;
            case 'get_audiences':
              result = await postscriptMcpClient.getAudiences(
                classification.parameters.limit, 
                classification.parameters.page
              );
              break;
            case 'get_performance_summary':
              result = await postscriptMcpClient.getPerformanceSummary();
              break;
            default:
              // Fall back to legacy client for unknown intents
              result = await processPostscriptCommand(commandText, classification);
          }
        } catch (error) {
          console.warn("Postscript MCP client failed, falling back to legacy client:", error);
          // Fall back to legacy client if MCP fails
          result = await processPostscriptCommand(commandText, classification);
        }
        break;
      case "northbeam":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Northbeam API...",
            ["Analyzing your command ✓", "Identifying service: Northbeam ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        try {
          // Try to use the MCP client first
          const { northbeamMcpClient } = await import("../integrations/fixedMcpClients");
          
          // Ensure we have date parameters for most commands
          const startDate = classification.parameters.startDate || 
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const endDate = classification.parameters.endDate || 
            new Date().toISOString().split('T')[0];
          
          // Call the appropriate method based on the intent
          switch (classification.intent) {
            case 'get_performance':
              result = await northbeamMcpClient.getPerformance(startDate, endDate);
              break;
            case 'get_channel_metrics':
              result = await northbeamMcpClient.getChannelMetrics(
                startDate, 
                endDate, 
                classification.parameters.channel
              );
              break;
            case 'get_campaign_metrics':
              result = await northbeamMcpClient.getCampaignMetrics(
                startDate, 
                endDate, 
                classification.parameters.platform
              );
              break;
            case 'get_attribution':
              result = await northbeamMcpClient.getAttribution(
                startDate, 
                endDate, 
                classification.parameters.model
              );
              break;
            case 'get_roas':
              result = await northbeamMcpClient.getRoas(
                startDate, 
                endDate, 
                classification.parameters.channel
              );
              break;
            case 'get_performance_summary':
              result = await northbeamMcpClient.getPerformanceSummary(
                classification.parameters.days || 30
              );
              break;
            default:
              // Fall back to legacy client for unknown intents
              result = await processNorthbeamCommand(commandText, classification);
          }
        } catch (error) {
          console.warn("Northbeam MCP client failed, falling back to legacy client:", error);
          // Fall back to legacy client if MCP fails
          result = await processNorthbeamCommand(commandText, classification);
        }
        break;
      case "triplewhale":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Triple Whale API...",
            ["Analyzing your command ✓", "Identifying service: Triple Whale ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        try {
          // Try to use the MCP client first
          const { tripleWhaleMcpClient } = await import("../integrations/fixedMcpClients");
          
          // Call the appropriate method based on the intent
          switch (classification.intent) {
            case 'get_sales':
              result = await tripleWhaleMcpClient.getSales(classification.parameters.period || 'today');
              break;
            case 'get_attribution':
              result = await tripleWhaleMcpClient.getAttribution(classification.parameters.source);
              break;
            case 'get_campaigns':
              result = await tripleWhaleMcpClient.getCampaigns(classification.parameters.platform);
              break;
            case 'get_cohorts':
              result = await tripleWhaleMcpClient.getCohorts(classification.parameters.period);
              break;
            case 'get_ltv':
              result = await tripleWhaleMcpClient.getLtv();
              break;
            case 'get_performance_summary':
              result = await tripleWhaleMcpClient.getPerformanceSummary();
              break;
            default:
              // Fall back to legacy client for unknown intents
              result = await processTripleWhaleCommand(commandText, classification);
          }
        } catch (error) {
          console.warn("Triple Whale MCP client failed, falling back to legacy client:", error);
          // Fall back to legacy client if MCP fails
          result = await processTripleWhaleCommand(commandText, classification);
        }
        break;
      case "slack":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Slack API...",
            ["Analyzing your command ✓", "Identifying service: Slack ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        try {
          // Try to use the MCP client first
          result = await processSlackMcpCommand(commandText, classification);
        } catch (error) {
          console.warn("Slack MCP client failed, falling back to legacy Slack client:", error);
          // Fall back to legacy client if MCP fails
          result = await processSlackCommand(commandText, classification);
        }
        break;
      case "notion":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Notion API...",
            ["Analyzing your command ✓", "Identifying service: Notion ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        try {
          // Try to use the MCP client first
          result = await processNotionMcpCommand(commandText, classification);
        } catch (error) {
          console.warn("MCP client failed, falling back to legacy Notion client:", error);
          // Fall back to legacy client if MCP fails
          result = await processNotionCommand(commandText, classification);
        }
        break;
      case "system":
        // System commands don't need external API calls
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Processing system command...",
            ["Analyzing your command ✓", "Identifying service: System ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        result = {
          success: true,
          message: classification.parameters.message || "I've received your command."
        };
        break;
        
      case "gorgias":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Gorgias API...",
            ["Analyzing your command ✓", "Identifying service: Gorgias ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Try to use the MCP client first
          const { gorgiasMcpClient } = await import("../integrations/fixedMcpClients");
          
          // Call the appropriate method based on the intent
          const intent = classification.intent.toLowerCase();
          console.log(`Processing Gorgias command with intent: ${intent}`);
          
          switch (intent) {
            case "get_tickets":
              result = await gorgiasMcpClient.getTickets(classification.parameters);
              break;
            case "get_ticket":
              result = await gorgiasMcpClient.getTicket(classification.parameters.id);
              break;
            case "create_ticket":
              result = await gorgiasMcpClient.createTicket(classification.parameters);
              break;
            case "update_ticket":
              result = await gorgiasMcpClient.updateTicket(
                classification.parameters.id,
                classification.parameters
              );
              break;
            case "get_customers":
              result = await gorgiasMcpClient.getCustomers(classification.parameters);
              break;
            case "get_customer":
              result = await gorgiasMcpClient.getCustomer(classification.parameters.id);
              break;
            default:
              // Fall back to legacy client for unknown intents
              result = await processGorgiasCommand(commandText, classification);
          }
        } catch (error) {
          console.warn("Gorgias MCP client failed, falling back to legacy client:", error);
          // Fall back to legacy client if MCP fails
          result = await processGorgiasCommand(commandText, classification);
        }
        break;
        
      case "recharm":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Recharm API...",
            ["Analyzing your command ✓", "Identifying service: Recharm ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Try to use the MCP client first
          const { recharmMcpClient } = await import("../integrations/fixedMcpClients");
          
          // Call the appropriate method based on the intent
          const intent = classification.intent.toLowerCase();
          console.log(`Processing Recharm command with intent: ${intent}`);
          
          switch (intent) {
            case "get_recovery_campaigns":
              result = await recharmMcpClient.getRecoveryCampaigns(classification.parameters);
              break;
            case "get_recovery_campaign":
              result = await recharmMcpClient.getRecoveryCampaign(classification.parameters.id);
              break;
            case "get_abandoned_carts":
              result = await recharmMcpClient.getAbandonedCarts(classification.parameters);
              break;
            case "get_analytics":
              result = await recharmMcpClient.getAnalytics(classification.parameters);
              break;
            default:
              // Fall back to legacy client for unknown intents
              result = await processRecharmCommand(commandText, classification);
          }
        } catch (error) {
          console.warn("Recharm MCP client failed, falling back to legacy client:", error);
          // Fall back to legacy client if MCP fails
          result = await processRecharmCommand(commandText, classification);
        }
        break;
        
      case "prescientai":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Prescient AI API...",
            ["Analyzing your command ✓", "Identifying service: Prescient AI ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Try to use the MCP client first
          const { prescientAiMcpClient } = await import("../integrations/fixedMcpClients");
          
          // Call the appropriate method based on the intent
          const intent = classification.intent.toLowerCase();
          console.log(`Processing Prescient AI command with intent: ${intent}`);
          
          switch (intent) {
            case "get_predictions":
              result = await prescientAiMcpClient.getPredictions(classification.parameters);
              break;
            case "get_insights":
              result = await prescientAiMcpClient.getInsights(classification.parameters);
              break;
            case "get_forecast":
              result = await prescientAiMcpClient.getForecast(classification.parameters);
              break;
            default:
              // Fall back to legacy client for unknown intents
              result = await processPrescientAiCommand(commandText, classification);
          }
        } catch (error) {
          console.warn("Prescient AI MCP client failed, falling back to legacy client:", error);
          // Fall back to legacy client if MCP fails
          result = await processPrescientAiCommand(commandText, classification);
        }
        break;
        
      case "elevar":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Elevar API...",
            ["Analyzing your command ✓", "Identifying service: Elevar ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Try to use the MCP client first
          const { elevarMcpClient } = await import("../integrations/fixedMcpClients");
          
          // Call the appropriate method based on the intent
          const intent = classification.intent.toLowerCase();
          console.log(`Processing Elevar command with intent: ${intent}`);
          
          switch (intent) {
            case "get_utm_data":
              result = await elevarMcpClient.getUtmData(classification.parameters);
              break;
            case "get_ga_data":
              result = await elevarMcpClient.getGaData(classification.parameters);
              break;
            case "get_report":
              result = await elevarMcpClient.getReport(classification.parameters);
              break;
            default:
              // Fall back to legacy client for unknown intents
              result = await processElevarCommand(commandText, classification);
          }
        } catch (error) {
          console.warn("Elevar MCP client failed, falling back to legacy client:", error);
          // Fall back to legacy client if MCP fails
          result = await processElevarCommand(commandText, classification);
        }
        break;
        
      case "github":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to GitHub API...",
            ["Analyzing your command ✓", "Identifying service: GitHub ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Use the MCP client
          const { githubMcpClient } = await import("../integrations/fixedMcpClients");
          
          // Process GitHub command
          result = await processGitHubCommand(commandText, classification, githubMcpClient);
        } catch (error) {
          console.error("Error processing GitHub command:", error);
          result = {
            success: false,
            message: `Failed to process GitHub command: ${error.message || "Unknown error"}`,
            error
          };
        }
        break;
        
      case "googlecalendar":
      case "google-calendar":
      case "google_calendar":
      case "gcalendar":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Google Calendar API...",
            ["Analyzing your command ✓", "Identifying service: Google Calendar ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Process Google Calendar command
          result = await processGoogleCalendarCommand(commandText, classification.parameters);
        } catch (error) {
          console.error("Error processing Google Calendar command:", error);
          result = {
            success: false,
            message: `Failed to process Google Calendar command: ${error instanceof Error ? error.message : "Unknown error"}`,
            error
          };
        }
        break;
        
      case "asana":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Asana API...",
            ["Analyzing your command ✓", "Identifying service: Asana ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Process Asana command
          result = await processAsanaCommand(commandText, classification.parameters);
        } catch (error) {
          console.error("Error processing Asana command:", error);
          result = {
            success: false,
            message: `Failed to process Asana command: ${error instanceof Error ? error.message : "Unknown error"}`,
            error
          };
        }
        break;
        
      case "gdrive":
      case "google-drive":
      case "google_drive":
      case "googledrive":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Google Drive API...",
            ["Analyzing your command ✓", "Identifying service: Google Drive ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Process GDrive command
          result = await processGDriveCommand(commandText, classification.parameters);
        } catch (error) {
          console.error("Error processing Google Drive command:", error);
          result = {
            success: false,
            message: `Failed to process Google Drive command: ${error instanceof Error ? error.message : "Unknown error"}`,
            error
          };
        }
        break;
        
      case "figma":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Connecting to Figma API...",
            ["Analyzing your command ✓", "Identifying service: Figma ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Process Figma command
          result = await processFigmaCommand(commandText, classification.parameters);
        } catch (error) {
          console.error("Error processing Figma command:", error);
          result = {
            success: false,
            message: `Failed to process Figma command: ${error instanceof Error ? error.message : "Unknown error"}`,
            error
          };
        }
        break;
        
      case "openai":
      case "chatgpt":
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Processing with ChatGPT...",
            ["Analyzing your command ✓", "Routing to ChatGPT ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Generate direct response from ChatGPT
          const response = await generateDirectResponse(commandText);
          
          result = {
            success: true,
            service: "openai",
            data: { response }
          };
        } catch (error) {
          console.error("Error using ChatGPT for processing:", error);
          result = { 
            success: false,
            message: `I encountered an error while processing your request with ChatGPT: ${error instanceof Error ? error.message : "Unknown error"}`,
            error
          };
        }
        break;
        
      default:
        // If no specific service is identified, route to ChatGPT as fallback
        if (!quiet && processingMessageId > 0) {
          await updateProcessingMessage(
            processingMessageId, 
            "Processing with ChatGPT...",
            ["Analyzing your command ✓", "Routing to ChatGPT ✓"]
          );
          
          // Add a small delay to make the thinking state visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Generate direct response from ChatGPT
          const response = await generateDirectResponse(commandText);
          
          result = {
            success: true,
            service: "openai",
            data: { response }
          };
        } catch (error) {
          console.error("Error using ChatGPT as fallback:", error);
          // If ChatGPT fails, fall back to the original error message
          result = { 
            success: false,
            message: "I'm not sure which service to use for this command. Could you be more specific about which platform you'd like to interact with (Shopify, Slack, Klaviyo, Notion, Postscript, Northbeam, Triple Whale, Gorgias, Recharm, Prescient AI, Elevar, GitHub, Google Calendar, Asana, Google Drive, Figma, etc.)?" 
          };
        }
    }

    // Update command history entry
    await storage.updateCommandHistoryEntry(commandHistoryId, {
      result,
      status: "completed"
    });

    // For slash commands, especially Slack, we want a minimal UI
    // We already have isSlashCommand defined earlier, no need to redefine
    const isSlackCommand = commandText.startsWith('/slack');
    
    // For Slack send commands, we only want to update the message status
    if (isSlackCommand && 
        classification.intent === "send_message" && 
        result.success && 
        quiet && 
        processingMessageId > 0) {
      
      // Just update with a minimal "Delivered" status, no verbose content
      await storage.updateChatMessage(processingMessageId, {
        content: "", // Empty content so only the status shows
        metadata: { 
          deliveryStatus: "delivered",
          result,
          isProcessing: true, // Keep for compatibility
          completed: true // Add completed flag to ensure no animation
        }
      });
    } else {
      // For non-slash commands or commands that aren't Slack send_message,
      // use the regular OpenAI response generation
      const responseContent = await generateResponse(commandText, result);
      
      if (quiet && processingMessageId > 0) {
        // In quiet mode, just update the original message directly with the result
        // and add a "delivered" status with completed flag
        await storage.updateChatMessage(processingMessageId, {
          content: responseContent,
          metadata: { 
            deliveryStatus: "delivered",
            result,
            isProcessing: true, // Keep isProcessing for historical reference
            completed: true // Add this flag to stop animations
          }
        });
      } else if (processingMessageId > 0) {
        // In regular mode, replace the processing message with the actual response
        await storage.updateCommandHistoryEntry(processingMessageId, {
          result: {
            ...result,
            responseContent
          }
        });
        
        // Create a new chat message with the response
        await storage.createChatMessage({
          role: "assistant",
          content: responseContent,
          metadata: { 
            result,
            isProcessing: true, // For compatibility
            completed: true // Ensure animation doesn't persist
          }
        });
      } else {
        // If no processing message ID was provided, just create a new message
        await storage.createChatMessage({
          role: "assistant",
          content: responseContent,
          metadata: { 
            deliveryStatus: "delivered",
            result,
            isProcessing: true, // Include isProcessing for compatibility
            completed: true // Add completed flag to ensure no animation
          }
        });
      }
    }

    // No need to check for updatedMessage anymore as we're directly creating a chat message
  } catch (error: any) {
    console.error("Error processing command:", error);
    
    // Update command history to failed
    await storage.updateCommandHistoryEntry(commandHistoryId, {
      result: { error: error?.message || "Unknown error" },
      status: "failed"
    });

    // Create an error message
    const errorMessage = `Sorry, I encountered an error while processing your command: ${error?.message || "Unknown error"}`;
    await storage.createChatMessage({
      role: "assistant",
      content: errorMessage,
      metadata: {
        isProcessing: false,
        error: error?.message || "Unknown error"
      }
    });
  }
}

// Helper to update the processing message with new steps

/**
 * Process GitHub commands using the GitHub MCP client
 */
async function processGitHubCommand(commandText: string, classification: CommandClassification, githubClient: any): Promise<CommandResult> {
  try {
    // Handle common GitHub operations
    const intent = classification.intent.toLowerCase();
    console.log(`Processing GitHub command with intent: ${intent}`);
    
    // Extract parameters
    const params = classification.parameters || {};
    
    // Handle specific intents
    switch (intent) {
      case "get_repository":
        return await githubClient.getRepository(params.owner, params.repo);
        
      case "search_repositories":
        return await githubClient.searchRepositories(
          params.query || params.q || params.search,
          params.page || 1,
          params.perPage || params.per_page || 10
        );
        
      case "create_repository":
        return await githubClient.createRepository(params);
        
      case "get_file_contents":
        return await githubClient.getFileContents(
          params.owner,
          params.repo,
          params.path,
          params.branch || params.ref
        );
        
      case "create_or_update_file":
        return await githubClient.createOrUpdateFile(
          params.owner,
          params.repo,
          params.path,
          params.content,
          params.message || "Update file via MCP",
          params.branch,
          params.sha
        );
        
      case "push_files":
        return await githubClient.pushFiles(
          params.owner,
          params.repo,
          params.branch || "main",
          params.files || [],
          params.message || "Push files via MCP"
        );
        
      case "create_issue":
        return await githubClient.createIssue(
          params.owner,
          params.repo,
          params.options || {
            title: params.title,
            body: params.body,
            labels: params.labels,
            assignees: params.assignees
          }
        );
        
      case "create_pull_request":
        return await githubClient.createPullRequest({
          owner: params.owner,
          repo: params.repo,
          title: params.title,
          body: params.body,
          head: params.head || params.source_branch,
          base: params.base || params.target_branch || "main",
          draft: params.draft || false
        });
        
      case "list_issues":
        return await githubClient.listIssues(
          params.owner,
          params.repo,
          params.options || {
            state: params.state || "open",
            per_page: params.perPage || params.per_page || 10,
            page: params.page || 1
          }
        );
        
      case "create_branch":
        return await githubClient.createBranch(
          params.owner,
          params.repo,
          params.branch || params.new_branch,
          params.fromBranch || params.from_branch || params.source || "main"
        );
        
      case "search_code":
        return await githubClient.searchCode({
          query: params.query || params.q || params.search,
          page: params.page || 1,
          perPage: params.perPage || params.per_page || 10
        });
        
      default:
        // For unknown intents, pass directly to processCommand
        return await githubClient.processCommand(intent, params);
    }
  } catch (error: any) {
    console.error("Error processing GitHub command:", error);
    return {
      success: false,
      message: `Failed to process GitHub command: ${error?.message || "Unknown error"}`,
      error
    };
  }
}

async function updateProcessingMessage(
  messageId: number, 
  statusText: string, 
  completedSteps: string[] = [],
  isComplete = false
): Promise<void> {
  // Create a metadata object with animation indicators - comfortable animation speed
  const metadata = {
    isProcessing: !isComplete, // If complete, set this to false to stop animation
    currentStep: statusText,
    steps: [...completedSteps],
    animationSpeed: 600, // milliseconds per frame - back to original speed
    spinnerType: "dots",  // can be "dots", "bar", or "pulse"
    showStepProgress: true,
    progressPercentage: Math.min(100, Math.round((completedSteps.length / 4) * 100)), // Estimate progress
    completed: isComplete // Add completed flag to explicitly stop animation when done
  };
  
  // Update the existing message instead of creating a new one
  if (messageId > 0) {
    await storage.updateChatMessage(messageId, {
      content: statusText,
      metadata
    });
  } else {
    // If no messageId provided, create a new message (fallback)
    await storage.createChatMessage({
      role: "assistant",
      content: statusText,
      metadata
    });
  }
}
