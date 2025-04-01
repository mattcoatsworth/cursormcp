import { postscriptMcpClient } from './fixedMcpClients';

// Re-export the client for backward compatibility
export const processPostscriptCommand = async (commandText: string, classification: any) => {
  const intent = classification.intent;
  const params = classification.parameters || {};
  
  console.log(`Processing Postscript command: ${intent} with params:`, params);
  
  switch (intent) {
    case 'get_subscribers':
      return await postscriptMcpClient.getSubscribers(params.limit, params.page);
      
    case 'search_subscriber':
      if (!params.phone) {
        return {
          success: false,
          message: 'Phone number is required for subscriber search'
        };
      }
      return await postscriptMcpClient.searchSubscriber(params.phone);
      
    case 'get_campaigns':
      return await postscriptMcpClient.getCampaigns(params.limit, params.page);
      
    case 'get_campaign_details':
      if (!params.id) {
        return {
          success: false,
          message: 'Campaign ID is required'
        };
      }
      return await postscriptMcpClient.getCampaignDetails(params.id);
      
    case 'get_analytics':
      return await postscriptMcpClient.getAnalytics(params.period);
      
    case 'send_sms':
      if (!params.phone) {
        return {
          success: false,
          message: 'Phone number is required to send SMS'
        };
      }
      if (!params.message) {
        return {
          success: false,
          message: 'Message is required to send SMS'
        };
      }
      return await postscriptMcpClient.sendSms(params.phone, params.message);
      
    case 'create_campaign':
      if (!params.name) {
        return {
          success: false,
          message: 'Campaign name is required'
        };
      }
      if (!params.message) {
        return {
          success: false,
          message: 'Campaign message is required'
        };
      }
      return await postscriptMcpClient.createCampaign(params.name, params.message, params.audienceId);
      
    case 'get_audiences':
      return await postscriptMcpClient.getAudiences(params.limit, params.page);
      
    case 'get_performance_summary':
      return await postscriptMcpClient.getPerformanceSummary();
      
    default:
      return {
        success: false,
        message: `Unknown Postscript command: ${intent}`
      };
  }
};