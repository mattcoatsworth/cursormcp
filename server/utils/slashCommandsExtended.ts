import { SlashCommand } from './slashCommands';
import { 
  gorgiasMcpClient, 
  recharmMcpClient,
  prescientAiMcpClient,
  elevarMcpClient
} from '../integrations/fixedMcpClients';

/**
 * Define slash commands for Gorgias
 */
export const gorgiasCommands: SlashCommand[] = [
  {
    command: 'gorgias tickets',
    description: 'Get tickets from Gorgias',
    parameters: [
      { name: 'limit', type: 'number', description: 'Maximum number of tickets to retrieve', default: 20 },
      { name: 'offset', type: 'number', description: 'Ticket offset for pagination', default: 0 },
      { name: 'status', type: 'string', description: 'Filter by ticket status (e.g., open, pending, closed)', optional: true }
    ],
    handler: async (args) => {
      const limit = Number(args.limit) || 20;
      const offset = Number(args.offset) || 0;
      const status = args.status as string | undefined;
      
      return await gorgiasMcpClient.getTickets(limit, offset, status);
    }
  },
  {
    command: 'gorgias ticket',
    description: 'Get a single ticket by ID',
    parameters: [
      { name: 'id', type: 'string', description: 'Ticket ID' }
    ],
    handler: async (args) => {
      const id = args.id as string;
      if (!id) {
        return { success: false, message: 'Ticket ID is required', error: 'Missing parameter' };
      }
      
      return await gorgiasMcpClient.getTicket(id);
    }
  },
  {
    command: 'gorgias customer',
    description: 'Get customer information by email',
    parameters: [
      { name: 'email', type: 'string', description: 'Customer email' }
    ],
    handler: async (args) => {
      const email = args.email as string;
      if (!email) {
        return { success: false, message: 'Customer email is required', error: 'Missing parameter' };
      }
      
      return await gorgiasMcpClient.getCustomer(email);
    }
  },
  {
    command: 'gorgias metrics',
    description: 'Get performance metrics',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to analyze', default: 30 }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 30;
      
      return await gorgiasMcpClient.getPerformanceMetrics(days);
    }
  },
  {
    command: 'gorgias summary',
    description: 'Get summary of current helpdesk status',
    parameters: [],
    handler: async () => {
      return await gorgiasMcpClient.getPerformanceSummary();
    }
  }
];

/**
 * Define slash commands for Recharm
 */
export const recharmCommands: SlashCommand[] = [
  {
    command: 'recharm campaigns',
    description: 'Get campaigns from Recharm',
    parameters: [
      { name: 'limit', type: 'number', description: 'Maximum number of campaigns to retrieve', default: 20 },
      { name: 'offset', type: 'number', description: 'Campaign offset for pagination', default: 0 }
    ],
    handler: async (args) => {
      const limit = Number(args.limit) || 20;
      const offset = Number(args.offset) || 0;
      
      return await recharmMcpClient.getCampaigns(limit, offset);
    }
  },
  {
    command: 'recharm campaign',
    description: 'Get a single campaign by ID',
    parameters: [
      { name: 'id', type: 'string', description: 'Campaign ID' }
    ],
    handler: async (args) => {
      const id = args.id as string;
      if (!id) {
        return { success: false, message: 'Campaign ID is required', error: 'Missing parameter' };
      }
      
      return await recharmMcpClient.getCampaign(id);
    }
  },
  {
    command: 'recharm abandonment',
    description: 'Get abandonment stats for a period',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to analyze', default: 30 }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 30;
      
      return await recharmMcpClient.getAbandonmentStats(days);
    }
  },
  {
    command: 'recharm recovery',
    description: 'Get recovery stats',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to analyze', default: 30 }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 30;
      
      return await recharmMcpClient.getRecoveryStats(days);
    }
  },
  {
    command: 'recharm carts',
    description: 'Get abandoned carts',
    parameters: [
      { name: 'limit', type: 'number', description: 'Maximum number of carts to retrieve', default: 10 },
      { name: 'page', type: 'number', description: 'Page number for pagination', default: 1 }
    ],
    handler: async (args) => {
      const limit = Number(args.limit) || 10;
      const page = Number(args.page) || 1;
      
      return await recharmMcpClient.getAbandonedCarts(limit, page);
    }
  },
  {
    command: 'recharm impact',
    description: 'Get revenue impact over time',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to analyze', default: 30 }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 30;
      
      return await recharmMcpClient.getRevenueImpact(days);
    }
  },
  {
    command: 'recharm summary',
    description: 'Get complete summary of Recharm performance',
    parameters: [],
    handler: async () => {
      return await recharmMcpClient.getPerformanceSummary();
    }
  }
];

/**
 * Define slash commands for Prescient AI
 */
export const prescientAiCommands: SlashCommand[] = [
  {
    command: 'prescientai models',
    description: 'Get predictive models',
    parameters: [
      { name: 'limit', type: 'number', description: 'Maximum number of models to retrieve', default: 10 }
    ],
    handler: async (args) => {
      const limit = Number(args.limit) || 10;
      
      return await prescientAiMcpClient.getModels(limit);
    }
  },
  {
    command: 'prescientai products',
    description: 'Get product forecasts',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to forecast', default: 30 },
      { name: 'top', type: 'number', description: 'Number of top products to include', default: 10 }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 30;
      const top = Number(args.top) || 10;
      
      return await prescientAiMcpClient.getProductForecasts(days, top);
    }
  },
  {
    command: 'prescientai revenue',
    description: 'Get revenue forecast',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to forecast', default: 90 }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 90;
      
      return await prescientAiMcpClient.getRevenueForecasts(days);
    }
  },
  {
    command: 'prescientai inventory',
    description: 'Get inventory recommendations',
    parameters: [],
    handler: async () => {
      return await prescientAiMcpClient.getInventoryRecommendations();
    }
  },
  {
    command: 'prescientai pricing',
    description: 'Get pricing recommendations',
    parameters: [
      { name: 'top', type: 'number', description: 'Number of top recommendations to include', default: 10 }
    ],
    handler: async (args) => {
      const top = Number(args.top) || 10;
      
      return await prescientAiMcpClient.getPricingRecommendations(top);
    }
  },
  {
    command: 'prescientai anomalies',
    description: 'Get anomaly detection',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to analyze', default: 30 }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 30;
      
      return await prescientAiMcpClient.getAnomalyDetection(days);
    }
  },
  {
    command: 'prescientai product',
    description: 'Get product details and forecasts',
    parameters: [
      { name: 'id', type: 'string', description: 'Product ID' }
    ],
    handler: async (args) => {
      const id = args.id as string;
      if (!id) {
        return { success: false, message: 'Product ID is required', error: 'Missing parameter' };
      }
      
      return await prescientAiMcpClient.getProductDetails(id);
    }
  },
  {
    command: 'prescientai summary',
    description: 'Get complete summary of Prescient AI insights',
    parameters: [],
    handler: async () => {
      return await prescientAiMcpClient.getPerformanceSummary();
    }
  }
];

/**
 * Define slash commands for Elevar
 */
export const elevarCommands: SlashCommand[] = [
  {
    command: 'elevar issues',
    description: 'Get tracking issues',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to analyze', default: 7 },
      { name: 'severity', type: 'string', description: 'Filter by severity (all, low, medium, high)', default: 'all' }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 7;
      const severity = (args.severity as string) || 'all';
      
      return await elevarMcpClient.getTrackingIssues(days, severity);
    }
  },
  {
    command: 'elevar analytics',
    description: 'Get analytics overview',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to analyze', default: 30 }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 30;
      
      return await elevarMcpClient.getAnalyticsOverview(days);
    }
  },
  {
    command: 'elevar attribution',
    description: 'Get attribution data',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to analyze', default: 30 }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 30;
      
      return await elevarMcpClient.getAttribution(days);
    }
  },
  {
    command: 'elevar quality',
    description: 'Get data quality report',
    parameters: [],
    handler: async () => {
      return await elevarMcpClient.getDataQualityReport();
    }
  },
  {
    command: 'elevar campaigns',
    description: 'Get campaign performance',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to analyze', default: 30 },
      { name: 'platform', type: 'string', description: 'Filter by platform (all, facebook, google, etc.)', default: 'all' }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 30;
      const platform = (args.platform as string) || 'all';
      
      return await elevarMcpClient.getCampaignPerformance(days, platform);
    }
  },
  {
    command: 'elevar channels',
    description: 'Get channel performance',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to analyze', default: 30 }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 30;
      
      return await elevarMcpClient.getChannelPerformance(days);
    }
  },
  {
    command: 'elevar funnel',
    description: 'Get conversion funnel data',
    parameters: [
      { name: 'days', type: 'number', description: 'Number of days to analyze', default: 30 }
    ],
    handler: async (args) => {
      const days = Number(args.days) || 30;
      
      return await elevarMcpClient.getConversionFunnel(days);
    }
  },
  {
    command: 'elevar summary',
    description: 'Get complete summary of Elevar metrics and insights',
    parameters: [],
    handler: async () => {
      return await elevarMcpClient.getPerformanceSummary();
    }
  }
];

// Export all the extended slash commands
export const extendedSlashCommands: SlashCommand[] = [
  ...gorgiasCommands,
  ...recharmCommands,
  ...prescientAiCommands,
  ...elevarCommands
];