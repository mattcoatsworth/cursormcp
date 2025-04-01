import { McpCommandResult } from '../integrations/baseMcp';
import { 
  tripleWhaleMcpClient, 
  postscriptMcpClient, 
  northbeamMcpClient,
  gorgiasMcpClient,
  recharmMcpClient,
  prescientAiMcpClient,
  elevarMcpClient,
  githubMcpClient,
  googleCalendarMcpClient,
  asanaMcpClient,
  gdriveMcpClient,
  figmaMcpClient
} from '../integrations/fixedMcpClients';

/**
 * Process Triple Whale commands
 */
export async function processTripleWhaleCommand(
  command: string,
  args: Record<string, any> = {}
): Promise<McpCommandResult> {
  console.log(`Processing Triple Whale command: ${command}`, args);

  switch (command.toLowerCase()) {
    case 'sales':
      return await tripleWhaleMcpClient.getSales(args.period || 'today');
    
    case 'attribution':
      return await tripleWhaleMcpClient.getAttribution(args.source);
    
    case 'campaigns':
      return await tripleWhaleMcpClient.getCampaigns(args.platform);
    
    case 'cohorts':
      return await tripleWhaleMcpClient.getCohorts(args.period);
    
    case 'ltv':
      return await tripleWhaleMcpClient.getLtv();
    
    case 'summary':
      return await tripleWhaleMcpClient.getPerformanceSummary();
    
    default:
      return {
        success: false,
        message: `Unknown Triple Whale command: ${command}`
      };
  }
}

/**
 * Process Postscript commands
 */
export async function processPostscriptCommand(
  command: string,
  args: Record<string, any> = {}
): Promise<McpCommandResult> {
  console.log(`Processing Postscript command: ${command}`, args);

  switch (command.toLowerCase()) {
    case 'subscribers':
      return await postscriptMcpClient.getSubscribers(args.limit, args.page);
    
    case 'search':
      if (!args.phone) {
        return {
          success: false,
          message: 'Phone number is required for subscriber search'
        };
      }
      return await postscriptMcpClient.searchSubscriber(args.phone);
    
    case 'campaigns':
      return await postscriptMcpClient.getCampaigns(args.limit, args.page);
    
    case 'campaign':
      if (!args.id) {
        return {
          success: false,
          message: 'Campaign ID is required'
        };
      }
      return await postscriptMcpClient.getCampaignDetails(args.id);
    
    case 'analytics':
      return await postscriptMcpClient.getAnalytics(args.period);
    
    case 'send':
      if (!args.phone) {
        return {
          success: false,
          message: 'Phone number is required to send SMS'
        };
      }
      if (!args.message) {
        return {
          success: false,
          message: 'Message is required to send SMS'
        };
      }
      return await postscriptMcpClient.sendSms(args.phone, args.message);
    
    case 'create':
      if (!args.name) {
        return {
          success: false,
          message: 'Campaign name is required'
        };
      }
      if (!args.message) {
        return {
          success: false,
          message: 'Campaign message is required'
        };
      }
      return await postscriptMcpClient.createCampaign(args.name, args.message, args.audienceId);
    
    case 'audiences':
      return await postscriptMcpClient.getAudiences(args.limit, args.page);
    
    case 'summary':
      return await postscriptMcpClient.getPerformanceSummary();
    
    default:
      return {
        success: false,
        message: `Unknown Postscript command: ${command}`
      };
  }
}

/**
 * Process Northbeam commands
 */
export async function processNorthbeamCommand(
  command: string,
  args: Record<string, any> = {}
): Promise<McpCommandResult> {
  console.log(`Processing Northbeam command: ${command}`, args);

  // Dates default to last 30 days if not provided
  const endDate = args.endDate || new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const startDate = args.startDate || defaultStartDate;

  switch (command.toLowerCase()) {
    case 'performance':
      return await northbeamMcpClient.getPerformance(startDate, endDate);
    
    case 'channels':
      return await northbeamMcpClient.getChannelMetrics(startDate, endDate, args.channel);
    
    case 'campaigns':
      return await northbeamMcpClient.getCampaignMetrics(startDate, endDate, args.platform);
    
    case 'attribution':
      return await northbeamMcpClient.getAttribution(startDate, endDate, args.model);
    
    case 'roas':
      return await northbeamMcpClient.getRoas(startDate, endDate, args.channel);
    
    case 'summary':
      return await northbeamMcpClient.getPerformanceSummary(args.days || 30);
    
    default:
      return {
        success: false,
        message: `Unknown Northbeam command: ${command}`
      };
  }
}

/**
 * Process Gorgias commands
 */
export async function processGorgiasCommand(
  command: string,
  args: Record<string, any> = {}
): Promise<McpCommandResult> {
  console.log(`Processing Gorgias command: ${command}`, args);

  switch (command.toLowerCase()) {
    case 'tickets':
      return await gorgiasMcpClient.getTickets(
        args.limit || 20, 
        args.offset || 0, 
        args.status
      );
    
    case 'ticket':
      if (!args.id) {
        return {
          success: false,
          message: 'Ticket ID is required'
        };
      }
      return await gorgiasMcpClient.getTicket(args.id);
    
    case 'customer':
      if (!args.email) {
        return {
          success: false,
          message: 'Customer email is required'
        };
      }
      return await gorgiasMcpClient.getCustomer(args.email);
    
    case 'metrics':
      return await gorgiasMcpClient.getPerformanceMetrics(args.days || 30);
    
    case 'summary':
      return await gorgiasMcpClient.getPerformanceSummary();
    
    default:
      return {
        success: false,
        message: `Unknown Gorgias command: ${command}`
      };
  }
}

/**
 * Process Recharm commands
 */
export async function processRecharmCommand(
  command: string,
  args: Record<string, any> = {}
): Promise<McpCommandResult> {
  console.log(`Processing Recharm command: ${command}`, args);

  switch (command.toLowerCase()) {
    case 'campaigns':
      return await recharmMcpClient.getCampaigns(args.limit || 20, args.offset || 0);
    
    case 'campaign':
      if (!args.id) {
        return {
          success: false,
          message: 'Campaign ID is required'
        };
      }
      return await recharmMcpClient.getCampaign(args.id);
    
    case 'abandonment':
      return await recharmMcpClient.getAbandonmentStats(args.days || 30);
    
    case 'recovery':
      return await recharmMcpClient.getRecoveryStats(args.days || 30);
    
    case 'carts':
      return await recharmMcpClient.getAbandonedCarts(args.limit || 10, args.page || 1);
    
    case 'impact':
      return await recharmMcpClient.getRevenueImpact(args.days || 30);
    
    case 'summary':
      return await recharmMcpClient.getPerformanceSummary();
    
    default:
      return {
        success: false,
        message: `Unknown Recharm command: ${command}`
      };
  }
}

/**
 * Process Prescient AI commands
 */
export async function processPrescientAiCommand(
  command: string,
  args: Record<string, any> = {}
): Promise<McpCommandResult> {
  console.log(`Processing Prescient AI command: ${command}`, args);

  switch (command.toLowerCase()) {
    case 'models':
      return await prescientAiMcpClient.getModels(args.limit || 10);
    
    case 'products':
      return await prescientAiMcpClient.getProductForecasts(args.days || 30, args.top || 10);
    
    case 'revenue':
      return await prescientAiMcpClient.getRevenueForecasts(args.days || 90);
    
    case 'inventory':
      return await prescientAiMcpClient.getInventoryRecommendations();
    
    case 'pricing':
      return await prescientAiMcpClient.getPricingRecommendations(args.top || 10);
    
    case 'anomalies':
      return await prescientAiMcpClient.getAnomalyDetection(args.days || 30);
    
    case 'product':
      if (!args.id) {
        return {
          success: false,
          message: 'Product ID is required'
        };
      }
      return await prescientAiMcpClient.getProductDetails(args.id);
    
    case 'summary':
      return await prescientAiMcpClient.getPerformanceSummary();
    
    default:
      return {
        success: false,
        message: `Unknown Prescient AI command: ${command}`
      };
  }
}

/**
 * Process Elevar commands
 */
export async function processElevarCommand(
  command: string,
  args: Record<string, any> = {}
): Promise<McpCommandResult> {
  console.log(`Processing Elevar command: ${command}`, args);

  switch (command.toLowerCase()) {
    case 'issues':
      return await elevarMcpClient.getTrackingIssues(
        args.days || 7, 
        args.severity || 'all'
      );
    
    case 'analytics':
      return await elevarMcpClient.getAnalyticsOverview(args.days || 30);
    
    case 'attribution':
      return await elevarMcpClient.getAttribution(args.days || 30);
    
    case 'quality':
      return await elevarMcpClient.getDataQualityReport();
    
    case 'campaigns':
      return await elevarMcpClient.getCampaignPerformance(
        args.days || 30, 
        args.platform || 'all'
      );
    
    case 'channels':
      return await elevarMcpClient.getChannelPerformance(args.days || 30);
    
    case 'funnel':
      return await elevarMcpClient.getConversionFunnel(args.days || 30);
    
    case 'summary':
      return await elevarMcpClient.getPerformanceSummary();
    
    default:
      return {
        success: false,
        message: `Unknown Elevar command: ${command}`
      };
  }
}

/**
 * Process Google Calendar commands
 */
export async function processGoogleCalendarCommand(
  command: string,
  args: Record<string, any> = {}
): Promise<McpCommandResult> {
  console.log(`Processing Google Calendar command: ${command}`, args);

  try {
    // Pass all commands directly to the GoogleCalendarMcpClient
    // This implementation allows the MCP client to handle command routing internally
    return await googleCalendarMcpClient.processCommand(command, args);
  } catch (error) {
    console.error(`Error processing Google Calendar command ${command}:`, error);
    return {
      success: false,
      message: `Failed to process Google Calendar command: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    };
  }
}

/**
 * Process Asana commands
 */
export async function processAsanaCommand(
  command: string,
  args: Record<string, any> = {}
): Promise<McpCommandResult> {
  console.log(`Processing Asana command: ${command}`, args);

  switch (command.toLowerCase()) {
    case 'workspaces':
      return await asanaMcpClient.getWorkspaces({
        limit: args.limit
      });
      
    case 'projects':
      return await asanaMcpClient.getProjects({
        workspaceGid: args.workspaceGid,
        limit: args.limit
      });
      
    case 'project':
      if (!args.projectGid) {
        return {
          success: false,
          message: 'Project GID is required'
        };
      }
      return await asanaMcpClient.getProject({
        projectGid: args.projectGid
      });
      
    case 'tasks':
      return await asanaMcpClient.getTasks({
        projectGid: args.projectGid,
        workspaceGid: args.workspaceGid,
        assigneeGid: args.assigneeGid,
        completed: args.completed,
        limit: args.limit
      });
      
    case 'task':
      if (!args.taskGid) {
        return {
          success: false,
          message: 'Task GID is required'
        };
      }
      return await asanaMcpClient.getTask({
        taskGid: args.taskGid
      });
      
    case 'create_task':
      if (!args.name) {
        return {
          success: false,
          message: 'Task name is required'
        };
      }
      return await asanaMcpClient.createTask({
        name: args.name,
        projectGid: args.projectGid,
        workspaceGid: args.workspaceGid,
        notes: args.notes,
        dueOn: args.dueOn,
        assigneeGid: args.assigneeGid
      });
      
    case 'update_task':
      if (!args.taskGid) {
        return {
          success: false,
          message: 'Task GID is required'
        };
      }
      return await asanaMcpClient.updateTask({
        taskGid: args.taskGid,
        name: args.name,
        notes: args.notes,
        dueOn: args.dueOn,
        completed: args.completed,
        assigneeGid: args.assigneeGid
      });
      
    default:
      return {
        success: false,
        message: `Unknown Asana command: ${command}`
      };
  }
}

/**
 * Process Google Drive commands
 */
export async function processGDriveCommand(
  command: string,
  args: Record<string, any> = {}
): Promise<McpCommandResult> {
  console.log(`Processing Google Drive command: ${command}`, args);

  switch (command.toLowerCase()) {
    case 'list':
    case 'files':
      return await gdriveMcpClient.listFiles({
        query: args.query,
        pageSize: args.pageSize,
        folderId: args.folderId,
        orderBy: args.orderBy,
        pageToken: args.pageToken
      });
      
    case 'file':
    case 'get_file':
      if (!args.fileId) {
        return {
          success: false,
          message: 'File ID is required'
        };
      }
      return await gdriveMcpClient.getFile({
        fileId: args.fileId
      });
      
    case 'create_folder':
      if (!args.name) {
        return {
          success: false,
          message: 'Folder name is required'
        };
      }
      return await gdriveMcpClient.createFolder({
        name: args.name,
        parentId: args.parentId
      });
      
    case 'search':
      if (!args.query) {
        return {
          success: false,
          message: 'Search query is required'
        };
      }
      return await gdriveMcpClient.searchFiles({
        query: args.query,
        pageSize: args.pageSize,
        pageToken: args.pageToken
      });
      
    case 'content':
    case 'get_content':
      if (!args.fileId) {
        return {
          success: false,
          message: 'File ID is required'
        };
      }
      return await gdriveMcpClient.getFileContent({
        fileId: args.fileId,
        mimeType: args.mimeType
      });
      
    case 'share':
      if (!args.fileId) {
        return {
          success: false,
          message: 'File ID is required'
        };
      }
      if (!args.email) {
        return {
          success: false,
          message: 'Email address is required'
        };
      }
      if (!args.role) {
        return {
          success: false,
          message: 'Role is required (reader, writer, commenter, or owner)'
        };
      }
      return await gdriveMcpClient.shareFile({
        fileId: args.fileId,
        email: args.email,
        role: args.role,
        type: args.type,
        transferOwnership: args.transferOwnership
      });
      
    default:
      return {
        success: false,
        message: `Unknown Google Drive command: ${command}`
      };
  }
}

/**
 * Process Figma commands
 */
export async function processFigmaCommand(
  command: string,
  args: Record<string, any> = {}
): Promise<McpCommandResult> {
  console.log(`Processing Figma command: ${command}`, args);

  switch (command.toLowerCase()) {
    case 'file':
    case 'get_file':
      if (!args.fileKey) {
        return {
          success: false,
          message: 'File key is required'
        };
      }
      return await figmaMcpClient.getFile({
        fileKey: args.fileKey,
        depth: args.depth
      });
      
    case 'node':
    case 'get_node':
      if (!args.fileKey) {
        return {
          success: false,
          message: 'File key is required'
        };
      }
      if (!args.nodeId) {
        return {
          success: false,
          message: 'Node ID is required'
        };
      }
      return await figmaMcpClient.getNode({
        fileKey: args.fileKey,
        nodeId: args.nodeId,
        depth: args.depth
      });
      
    case 'images':
    case 'get_images':
      if (!args.fileKey) {
        return {
          success: false,
          message: 'File key is required'
        };
      }
      if (!args.nodes || !Array.isArray(args.nodes) || args.nodes.length === 0) {
        return {
          success: false,
          message: 'Node IDs are required as an array'
        };
      }
      return await figmaMcpClient.getImages({
        fileKey: args.fileKey,
        nodes: args.nodes,
        format: args.format,
        scale: args.scale
      });
      
    case 'image_fills':
    case 'get_image_fills':
      if (!args.fileKey) {
        return {
          success: false,
          message: 'File key is required'
        };
      }
      return await figmaMcpClient.getImageFills({
        fileKey: args.fileKey
      });
      
    case 'comments':
    case 'get_comments':
      if (!args.fileKey) {
        return {
          success: false,
          message: 'File key is required'
        };
      }
      return await figmaMcpClient.getComments({
        fileKey: args.fileKey
      });
      
    case 'comment':
    case 'post_comment':
      if (!args.fileKey) {
        return {
          success: false,
          message: 'File key is required'
        };
      }
      if (!args.message) {
        return {
          success: false,
          message: 'Comment message is required'
        };
      }
      return await figmaMcpClient.postComment({
        fileKey: args.fileKey,
        message: args.message,
        clientMeta: args.clientMeta
      });
      
    default:
      return {
        success: false,
        message: `Unknown Figma command: ${command}`
      };
  }
}