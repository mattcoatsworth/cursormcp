import { northbeamMcpClient } from './fixedMcpClients';

// Re-export the client for backward compatibility
export const processNorthbeamCommand = async (commandText: string, classification: any) => {
  const intent = classification.intent;
  const params = classification.parameters || {};
  
  console.log(`Processing Northbeam command: ${intent} with params:`, params);
  
  // Ensure we have date parameters for most commands
  const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = params.endDate || new Date().toISOString().split('T')[0];
  
  switch (intent) {
    case 'get_performance':
      return await northbeamMcpClient.getPerformance(startDate, endDate);
      
    case 'get_channel_metrics':
      return await northbeamMcpClient.getChannelMetrics(startDate, endDate, params.channel);
      
    case 'get_campaign_metrics':
      return await northbeamMcpClient.getCampaignMetrics(startDate, endDate, params.platform);
      
    case 'get_attribution':
      return await northbeamMcpClient.getAttribution(startDate, endDate, params.model);
      
    case 'get_roas':
      return await northbeamMcpClient.getRoas(startDate, endDate, params.channel);
      
    case 'get_performance_summary':
      return await northbeamMcpClient.getPerformanceSummary(params.days || 30);
      
    default:
      return {
        success: false,
        message: `Unknown Northbeam command: ${intent}`
      };
  }
};