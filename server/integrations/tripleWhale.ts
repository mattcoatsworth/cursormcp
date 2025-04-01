import { tripleWhaleMcpClient } from './fixedMcpClients';

// Re-export the client for backward compatibility
export const processTripleWhaleCommand = async (commandText: string, classification: any) => {
  const intent = classification.intent;
  const params = classification.parameters || {};
  
  console.log(`Processing Triple Whale command: ${intent} with params:`, params);
  
  switch (intent) {
    case 'get_sales':
      return await tripleWhaleMcpClient.getSales(params.period || 'today');
      
    case 'get_attribution':
      return await tripleWhaleMcpClient.getAttribution(params.source);
      
    case 'get_campaigns':
      return await tripleWhaleMcpClient.getCampaigns(params.platform);
      
    case 'get_cohorts':
      return await tripleWhaleMcpClient.getCohorts(params.period);
      
    case 'get_ltv':
      return await tripleWhaleMcpClient.getLtv();
      
    case 'get_performance_summary':
      return await tripleWhaleMcpClient.getPerformanceSummary();
      
    default:
      return {
        success: false,
        message: `Unknown Triple Whale command: ${intent}`
      };
  }
};