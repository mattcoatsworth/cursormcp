/**
 * Utility functions for handling multi-service commands
 * This extends the chained commands concept to support any combination of services
 */
import { processShopifyMcpCommand } from "../integrations/shopifyMcp";
import { processShopifyCommand } from "../integrations/shopify";
import { processSlackMcpCommand } from "../integrations/slackMcp";
import { processSlackCommand } from "../integrations/slack";
import { processNotionMcpCommand } from "../integrations/notionMcp";
import { processNotionCommand } from "../integrations/notion";
import { processKlaviyoCommand } from "../integrations/klaviyo";
import { classifyCommand } from "../integrations/openai";

interface ServiceResult {
  service: string;
  success: boolean;
  result: any;
  error?: any;
}

/**
 * Process a multi-service command that involves multiple APIs
 * For commands that need to interact with multiple services simultaneously
 */
export async function processMultiServiceCommand(
  commandText: string,
  classification: any
): Promise<{
  success: boolean;
  message: string;
  results: ServiceResult[];
  error?: any;
}> {
  try {
    const results: ServiceResult[] = [];
    let primaryResult: any = null;
    
    // Extract secondary services, handling both API classification and natural language detection
    let secondaryServices = classification.secondaryServices || [];
    
    // If no secondaryServices are defined but we're in this function,
    // it might be because we detected multiple services in the command text
    if (secondaryServices.length === 0) {
      // Look for service keywords in the command
      const serviceKeywords = ['shopify', 'klaviyo', 'slack', 'notion', 'postscript',
                            'northbeam', 'triple whale', 'gorgias', 'recharm',
                            'prescient ai', 'elevar', 'google calendar', 'asana',
                            'gdrive', 'figma', 'github'];
      
      // Filter to services mentioned in the command
      const mentionedServices = serviceKeywords.filter(keyword => 
        commandText.toLowerCase().includes(keyword)
      );
      
      // Use these as secondary services, excluding the primary service
      secondaryServices = mentionedServices.filter(
        service => service !== classification.primaryService?.toLowerCase()
      );
    }
    
    const { primaryService } = classification;
    
    // Process the primary service first
    try {
      let primaryServiceResult;
      
      switch (primaryService) {
        case "shopify":
          try {
            // Try to use the MCP client first
            primaryServiceResult = await processShopifyMcpCommand(commandText, classification);
          } catch (error) {
            console.warn("MCP client failed, falling back to legacy Shopify client:", error);
            // Fall back to legacy client if MCP fails
            primaryServiceResult = await processShopifyCommand(commandText, classification);
          }
          break;
          
        case "slack":
          try {
            // Try to use the MCP client first
            primaryServiceResult = await processSlackMcpCommand(commandText, classification);
          } catch (error) {
            console.warn("Slack MCP client failed, falling back to legacy Slack client:", error);
            // Fall back to legacy client if MCP fails
            primaryServiceResult = await processSlackCommand(commandText, classification);
          }
          break;
          
        case "notion":
          try {
            // Try to use the MCP client first
            primaryServiceResult = await processNotionMcpCommand(commandText, classification);
          } catch (error) {
            console.warn("Notion MCP client failed, falling back to legacy Notion client:", error);
            // Fall back to legacy client if MCP fails
            primaryServiceResult = await processNotionCommand(commandText, classification);
          }
          break;
          
        case "klaviyo":
          try {
            // Import the MCP client and use it first
            const { klaviyoMcpClient } = await import("../integrations/klaviyoMcp");
            // Try to process using the MCP client
            primaryServiceResult = await klaviyoMcpClient.processCommand(classification.intent, classification.parameters);
          } catch (error) {
            console.warn("Klaviyo MCP client failed, falling back to legacy client:", error);
            // Fall back to legacy client if MCP fails
            primaryServiceResult = await processKlaviyoCommand(commandText, classification);
          }
          break;
          
        default:
          throw new Error(`Unsupported primary service: ${primaryService}`);
      }
      
      primaryResult = primaryServiceResult;
      results.push({
        service: primaryService,
        success: primaryServiceResult.success,
        result: primaryServiceResult
      });
    } catch (error) {
      console.error(`Error processing primary service ${primaryService}:`, error);
      results.push({
        service: primaryService,
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Process each secondary service with the relevant part of the classification
    if (secondaryServices && secondaryServices.length > 0) {
      for (const secondaryService of secondaryServices) {
        try {
          // Create a modified classification for the secondary service
          const secondaryClassification = {
            ...classification,
            primaryService: secondaryService,
            // Don't pass secondaryServices to avoid infinite loop
            secondaryServices: []
          };
          
          let secondaryServiceResult;
          
          switch (secondaryService) {
            case "shopify":
              try {
                secondaryServiceResult = await processShopifyMcpCommand(commandText, secondaryClassification);
              } catch (error) {
                console.warn("MCP client failed, falling back to legacy Shopify client:", error);
                secondaryServiceResult = await processShopifyCommand(commandText, secondaryClassification);
              }
              break;
              
            case "slack":
              try {
                secondaryServiceResult = await processSlackMcpCommand(commandText, secondaryClassification);
              } catch (error) {
                console.warn("Slack MCP client failed, falling back to legacy Slack client:", error);
                secondaryServiceResult = await processSlackCommand(commandText, secondaryClassification);
              }
              break;
              
            case "notion":
              try {
                secondaryServiceResult = await processNotionMcpCommand(commandText, secondaryClassification);
              } catch (error) {
                console.warn("Notion MCP client failed, falling back to legacy Notion client:", error);
                secondaryServiceResult = await processNotionCommand(commandText, secondaryClassification);
              }
              break;
              
            case "klaviyo":
              try {
                // Import the MCP client and use it first
                const { klaviyoMcpClient } = await import("../integrations/klaviyoMcp");
                // Try to process using the MCP client
                secondaryServiceResult = await klaviyoMcpClient.processCommand(secondaryClassification.intent, secondaryClassification.parameters);
              } catch (error) {
                console.warn("Klaviyo MCP client failed, falling back to legacy client:", error);
                // Fall back to legacy client if MCP fails
                secondaryServiceResult = await processKlaviyoCommand(commandText, secondaryClassification);
              }
              break;
              
            default:
              throw new Error(`Unsupported secondary service: ${secondaryService}`);
          }
          
          results.push({
            service: secondaryService,
            success: secondaryServiceResult.success,
            result: secondaryServiceResult
          });
        } catch (error) {
          console.error(`Error processing secondary service ${secondaryService}:`, error);
          results.push({
            service: secondaryService,
            success: false,
            result: null,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
    
    // Check if we have at least some successful results
    const successfulResults = results.filter(r => r.success);
    const overallSuccess = successfulResults.length > 0;
    
    // Generate a message summarizing the results
    let message = "";
    if (overallSuccess) {
      if (successfulResults.length === results.length) {
        message = `Successfully processed your request across ${results.length} services (${results.map(r => r.service).join(', ')}).`;
      } else {
        const successful = successfulResults.map(r => r.service).join(', ');
        const failed = results.filter(r => !r.success).map(r => r.service).join(', ');
        message = `Partially processed your request. Successful: ${successful}. Failed: ${failed}.`;
      }
    } else {
      message = `Failed to process your request for any of the services (${results.map(r => r.service).join(', ')}).`;
    }
    
    return {
      success: overallSuccess,
      message,
      results
    };
  } catch (error) {
    console.error("Error processing multi-service command:", error);
    return {
      success: false,
      message: `Error processing multi-service command: ${error instanceof Error ? error.message : String(error)}`,
      results: [],
      error
    };
  }
}

/**
 * Check if a command can be processed as a multi-service command
 */
export function isMultiServiceCommand(classification: any, commandText?: string): boolean {
  // Handle cases where secondaryServices might be undefined
  if (!classification || !classification.primaryService) {
    return false;
  }
  
  // Ensure secondaryServices exists and has at least one service
  const hasSecondaryServices = Array.isArray(classification.secondaryServices) && 
                               classification.secondaryServices.length > 0;
  
  // Confidence threshold to avoid false positives
  const hasHighConfidence = typeof classification.confidence === 'number' && 
                           classification.confidence > 0.5;
  
  // If a command text is provided, check for multiple service mentions
  if (commandText) {
    const serviceKeywords = ['shopify', 'klaviyo', 'slack', 'notion', 'postscript',
                          'northbeam', 'triple whale', 'gorgias', 'recharm',
                          'prescient ai', 'elevar', 'google calendar', 'asana',
                          'gdrive', 'figma', 'github'];
    
    // Count how many different services are mentioned
    const mentionedServices = serviceKeywords.filter(keyword => 
      commandText.toLowerCase().includes(keyword)
    );
    
    // If multiple services are mentioned, treat it as a multi-service command
    if (mentionedServices.length > 1) {
      // If classification doesn't already have secondary services, add them
      if (!hasSecondaryServices) {
        // Add all mentioned services except the primary one as secondary services
        classification.secondaryServices = mentionedServices.filter(
          service => service !== classification.primaryService.toLowerCase()
        );
      }
      return true;
    }
  }
  
  return hasSecondaryServices && hasHighConfidence;
}