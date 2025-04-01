import { storage } from "../storage";
import { klaviyoMcpClient } from "./klaviyoMcp";

/**
 * Process commands related to Klaviyo
 */
export async function processKlaviyoCommand(
  command: string,
  classification: any
): Promise<any> {
  try {
    // Initialize client if needed
    await klaviyoMcpClient.initialize();

    // Process based on intent
    switch (classification.intent) {
      // Campaign operations
      case "get_campaigns":
        return await klaviyoMcpClient.getCampaigns(classification.parameters);
      case "create_campaign":
        return await klaviyoMcpClient.createCampaign(classification.parameters);
      case "get_campaign_messages":
        return await klaviyoMcpClient.getCampaignMessages(classification.parameters.campaignId);
      case "send_campaign":
        return await klaviyoMcpClient.createCampaignSendJob(classification.parameters.campaignId);
        
      // Segment operations
      case "get_segments":
        return await klaviyoMcpClient.getSegments(classification.parameters);
        
      // Metric operations
      case "get_metrics":
        return await klaviyoMcpClient.getMetrics(classification.parameters);
      
      // Flow operations
      case "get_flows":
        return await klaviyoMcpClient.getFlows(classification.parameters);
      case "get_flow":
        return await klaviyoMcpClient.getFlow(
          classification.parameters.flowId, 
          classification.parameters.includeDefinition
        );
      case "create_flow":
        return await klaviyoMcpClient.createFlow(classification.parameters.flow);
      case "get_flows_by_metric":
        return await klaviyoMcpClient.getFlowsTriggeredByMetric(classification.parameters.metricId);
        
      // Review operations
      case "get_reviews":
        return await klaviyoMcpClient.getClientReviews(classification.parameters);
      case "create_review":
        return await klaviyoMcpClient.createClientReview(classification.parameters.review);
        
      // Account operations
      case "get_account_info":
        return await klaviyoMcpClient.getAccountInfo();
        
      // Default handler for other commands  
      default:
        return await klaviyoMcpClient.processCommand(
          classification.intent,
          classification.parameters
        );
    }
  } catch (error) {
    console.error("Error processing Klaviyo command:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
