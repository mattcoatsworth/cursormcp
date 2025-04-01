import OpenAI from "openai";
import axios, { AxiosRequestConfig } from "axios";
import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import { storage } from "../storage";

/**
 * Klaviyo API Revision Header
 * Used to specify which version of the API to use
 */
enum KlaviyoApiRevision {
  STANDARD = "2025-01-15",
  BETA = "2025-01-15.pre",
  FLOWS_BETA = "2024-10-15.pre"
}

/**
 * Klaviyo Catalog Item Interface
 */
export interface KlaviyoCatalogItem {
  id?: string;
  type: string;
  attributes: {
    external_id: string;
    integration_type?: string;
    title: string;
    price?: number;
    description: string;
    url: string;
    image_full_url?: string;
    image_thumbnail_url?: string;
    images?: string[];
    catalog_type?: string;
    custom_metadata?: Record<string, any>;
    published?: boolean;
  };
  relationships?: {
    categories?: {
      data: Array<{
        type: string;
        id: string;
      }>;
    };
  };
}

/**
 * Klaviyo Catalog Item Creation Interface
 */
export interface KlaviyoCatalogItemCreate {
  type: string;
  attributes: {
    external_id: string;
    integration_type?: string;
    title: string;
    price?: number;
    description: string;
    url: string;
    image_full_url?: string;
    image_thumbnail_url?: string;
    images?: string[];
    catalog_type?: string;
    custom_metadata?: Record<string, any>;
    published?: boolean;
  };
  relationships?: {
    categories?: {
      data: Array<{
        type: string;
        id: string;
      }>;
    };
  };
}

/**
 * Klaviyo Catalog Item Update Interface
 */
export interface KlaviyoCatalogItemUpdate {
  id: string;
  type: string;
  attributes?: {
    title?: string;
    price?: number;
    description?: string;
    url?: string;
    image_full_url?: string;
    image_thumbnail_url?: string;
    images?: string[];
    custom_metadata?: Record<string, any>;
    published?: boolean;
  };
  relationships?: {
    categories?: {
      data: Array<{
        type: string;
        id: string;
      }>;
    };
  };
}

/**
 * Klaviyo-specific MCP command result
 */
export interface KlaviyoCommandResult extends McpCommandResult {
  data?: {
    campaigns?: any[];
    segments?: any[];
    campaign?: any;
    segment?: any;
    metrics?: any[];
    flows?: any[];
    flow?: any;
    reviews?: any[];
    review?: any;
    templates?: any[];
    template?: any;
    image?: any;
    account?: any;
    campaignMessages?: any[];
    campaignMessage?: any;
    campaignSendJob?: any;
    campaignClone?: any;
    campaignRecipientEstimation?: any;
    campaignRecipientEstimationJob?: any;
    tags?: any[];
    tagIds?: any[];
    messageIds?: any[];
    listId?: string;
    nextCursor?: string;
    hasNextPage?: boolean;
    aiSuggestion?: string;
    catalogItems?: KlaviyoCatalogItem[];
    catalogItem?: KlaviyoCatalogItem;
    subscription?: any;
    bulkCreateJobs?: any[];
    bulkCreateJob?: any;
    bulkUpdateJobs?: any[];
    bulkUpdateJob?: any;
    bulkDeleteJobs?: any[];
    bulkDeleteJob?: any;
    catalogCategories?: any[];
    catalogCategory?: any;
    categoryItems?: any[];
    categoryIds?: any[];
  };
}

/**
 * Interface for Klaviyo campaign parameters
 */
interface KlaviyoCampaignParams {
  limit?: number;
  page?: number;
  cursor?: string;
  status?: string;
  sort?: string;
  filter?: string;
}

/**
 * Interface for Klaviyo flow parameters
 */
interface KlaviyoFlowParams {
  limit?: number;
  page?: number;
  cursor?: string;
  status?: string;
  sort?: string;
  filter?: string;
  'additional-fields'?: string[];
  include_definition?: boolean;
}

/**
 * Interface for Klaviyo review parameters
 */
interface KlaviyoReviewParams {
  limit?: number;
  page?: number;
  cursor?: string;
  filter?: string;
  sort?: string;
}

/**
 * Interface for Klaviyo campaign message parameters
 */
interface KlaviyoMessageParams {
  fields?: {
    'campaign-message'?: string[];
    'campaign'?: string[];
    'image'?: string[];
    'template'?: string[];
    [key: string]: string[] | undefined;
  };
  include?: string[];
}

/**
 * Interface for Klaviyo catalog parameters
 */
interface KlaviyoCatalogParams {
  limit?: number;
  page?: number;
  cursor?: string;
  filter?: string;
  sort?: string;
  fields?: {
    'catalog-item'?: string[];
    'catalog-variant'?: string[];
    'catalog-category'?: string[];
    [key: string]: string[] | undefined;
  };
  include?: string[];
}

/**
 * Interface for Klaviyo back in stock subscription parameters
 */
interface KlaviyoBackInStockParams {
  channels: string[];
  profile: {
    email?: string;
    phone_number?: string;
    external_id?: string;
  };
  variant_id: string;
}

/**
 * Klaviyo MCP client implementation
 */
export class KlaviyoMcpClient extends BaseMcpClient {
  private apiEndpoint = "https://a.klaviyo.com/api";
  private apiV2Endpoint = "https://a.klaviyo.com/api/v2";
  private clientEndpoint = "https://a.klaviyo.com/client";
  private apiKey: string | undefined;
  private publicKey: string | undefined;
  private accountId: string | undefined;

  constructor() {
    super("klaviyo");
  }

  /**
   * Check if the client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Extract Klaviyo credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    const apiKey = connectionCredentials.apiKey || connectionCredentials.api_key;
    const publicKey = connectionCredentials.publicKey || connectionCredentials.public_key;

    if (!apiKey) {
      throw new Error("Klaviyo API key is required");
    }

    return {
      KLAVIYO_API_KEY: apiKey,
      KLAVIYO_PUBLIC_KEY: publicKey
    };
  }

  /**
   * Initialize Klaviyo-specific functionality
   */
  protected async serviceInitialize(): Promise<void> {
    this.apiKey = this.credentials.KLAVIYO_API_KEY;
    this.publicKey = this.credentials.KLAVIYO_PUBLIC_KEY;

    if (!this.apiKey) {
      throw new Error("Klaviyo API key is required for initialization");
    }

    // Test the connection to Klaviyo API and fetch account info
    try {
      // First, get account information to validate the API key and get the account ID
      await this.getAccountInfo();
      console.log("Klaviyo API connection successful");
    } catch (error) {
      console.error("Failed to connect to Klaviyo API:", error);
      throw new Error("Failed to connect to Klaviyo API: " + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Helper function to safely extract cursor from URL
   * Returns a string or undefined (never null)
   */
  private extractCursorFromUrl(url: string): string | undefined {
    try {
      const cursor = new URL(url).searchParams.get('page[cursor]');
      return cursor !== null ? cursor : undefined;
    } catch (error) {
      console.error("Error extracting cursor from URL:", error);
      return undefined;
    }
  }
  
  /**
   * Helper method to make authenticated requests to the JSON:API compliant Klaviyo API
   */
  private async makeApiRequest<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    params?: any,
    revision: KlaviyoApiRevision = KlaviyoApiRevision.STANDARD,
    useClientAuth: boolean = false
  ): Promise<T> {
    if (!this.apiKey && !useClientAuth) {
      throw new Error("Klaviyo API key is not set");
    }
    
    if (!this.publicKey && useClientAuth) {
      throw new Error("Klaviyo Public key is not set");
    }
    
    const baseUrl = useClientAuth ? this.clientEndpoint : this.apiEndpoint;
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    
    const config: AxiosRequestConfig = {
      method,
      url,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "revision": revision
      },
      params
    };
    
    // Add authorization
    if (useClientAuth) {
      config.headers = {
        ...config.headers,
        "Authorization": `Klaviyo-API-Key ${this.publicKey}`
      };
    } else {
      config.headers = {
        ...config.headers,
        "Authorization": `Klaviyo-API-Key ${this.apiKey}`
      };
    }
    
    // Add request body if provided
    if (data) {
      config.data = data;
    }
    
    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Klaviyo API error:", error.response.status, error.response.data);
        throw new Error(`Klaviyo API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
  
  /**
   * Get account information
   */
  async getAccountInfo(): Promise<KlaviyoCommandResult> {
    try {
      // Make API request to get account information
      const response = await this.makeApiRequest('get', 'accounts');
      
      if (response.data && response.data.length > 0) {
        // Store the account ID for later use
        this.accountId = response.data[0].id;
        
        return {
          success: true,
          data: {
            account: response.data[0]
          }
        };
      }
      
      return {
        success: false,
        message: "No account information found"
      };
    } catch (error) {
      console.error("Error getting account information:", error);
      return {
        success: false,
        message: "Failed to get account information",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get campaigns from Klaviyo
   */
  async getCampaigns(params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      if (!this.apiKey) {
        throw new Error("Klaviyo API key is not set");
      }

      const limit = params.limit || 20;
      
      // For Klaviyo API V2 we need to use a different endpoint for campaigns
      const response = await axios.get(`${this.apiV2Endpoint}/campaigns`, {
        params: { 
          api_key: this.apiKey,
          count: limit
        },
        headers: {
          "Accept": "application/json"
        }
      });

      // Parse API response
      const campaigns = response.data.data || [];

      // Broadcast update to any connected WebSocket clients
      if ((global as any).broadcastKlaviyoUpdate) {
        (global as any).broadcastKlaviyoUpdate({
          campaigns,
          source: "api_update"
        });
      }

      return {
        success: true,
        data: {
          campaigns
        }
      };
    } catch (error) {
      console.error("Error getting campaigns from Klaviyo:", error);
      return {
        success: false,
        message: "Failed to get campaigns from Klaviyo",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a new campaign in Klaviyo
   */
  async createCampaign(campaign: any): Promise<KlaviyoCommandResult> {
    try {
      if (!this.apiKey) {
        throw new Error("Klaviyo API key is not set");
      }

      // For Klaviyo API V2 we need to use a different endpoint and structure for creating campaigns
      const response = await axios.post(`${this.apiV2Endpoint}/campaigns`, campaign, {
        params: { 
          api_key: this.apiKey
        },
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      // Broadcast update to any connected WebSocket clients
      if ((global as any).broadcastKlaviyoUpdate) {
        (global as any).broadcastKlaviyoUpdate({
          campaign: response.data.data,
          source: "campaign_created"
        });
      }

      return {
        success: true,
        message: "Campaign created successfully",
        data: {
          campaign: response.data.data
        }
      };
    } catch (error) {
      console.error("Error creating campaign in Klaviyo:", error);
      return {
        success: false,
        message: "Failed to create campaign in Klaviyo",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get segments from Klaviyo
   */
  async getSegments(params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      if (!this.apiKey) {
        throw new Error("Klaviyo API key is not set");
      }

      const limit = params.limit || 20;
      
      // For Klaviyo API V2 we need to use a different endpoint for segments
      const response = await axios.get(`${this.apiV2Endpoint}/lists`, {
        params: { 
          api_key: this.apiKey
        },
        headers: {
          "Accept": "application/json"
        }
      });

      // Parse API response
      let segments = response.data.data || [];
      
      // Limit segments if requested
      if (segments.length > limit) {
        segments = segments.slice(0, limit);
      }

      // Broadcast update to any connected WebSocket clients
      if ((global as any).broadcastKlaviyoUpdate) {
        (global as any).broadcastKlaviyoUpdate({
          segments,
          source: "api_update"
        });
      }

      return {
        success: true,
        data: {
          segments
        }
      };
    } catch (error) {
      console.error("Error getting segments from Klaviyo:", error);
      return {
        success: false,
        message: "Failed to get segments from Klaviyo",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get metrics from Klaviyo
   */
  async getMetrics(params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      if (!this.apiKey) {
        throw new Error("Klaviyo API key is not set");
      }

      const limit = params.limit || 20;
      
      // For Klaviyo API V2 we need to use a different endpoint for metrics
      const response = await axios.get(`${this.apiV2Endpoint}/metrics`, {
        params: { 
          api_key: this.apiKey,
          count: limit
        },
        headers: {
          "Accept": "application/json"
        }
      });

      // Parse API response
      const metrics = response.data.data || [];

      // Broadcast update to any connected WebSocket clients
      if ((global as any).broadcastKlaviyoUpdate) {
        (global as any).broadcastKlaviyoUpdate({
          metrics,
          source: "metrics_update"
        });
      }

      return {
        success: true,
        data: {
          metrics
        }
      };
    } catch (error) {
      console.error("Error getting metrics from Klaviyo:", error);
      return {
        success: false,
        message: "Failed to get metrics from Klaviyo",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get all flows
   */
  async getFlows(params: KlaviyoFlowParams = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      if (params.limit) queryParams.limit = params.limit;
      if (params.page) queryParams.page = params.page;
      if (params.cursor) queryParams['page[cursor]'] = params.cursor;
      if (params.status) queryParams.filter = `status.eq(${params.status})`;
      if (params.sort) queryParams.sort = params.sort;
      
      // Include definition if requested
      const additionalFields = params.include_definition ? ['definition'] : [];
      if (additionalFields.length > 0) {
        queryParams['additional-fields[flow]'] = additionalFields.join(',');
      }
      
      // Make API request to get flows
      const response = await this.makeApiRequest(
        'get',
        'flows',
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          flows: response.data,
          nextCursor: response.links?.next ? this.extractCursorFromUrl(response.links.next) : undefined,
          hasNextPage: !!response.links?.next
        }
      };
    } catch (error) {
      console.error("Error getting flows from Klaviyo:", error);
      return {
        success: false,
        message: "Failed to get flows from Klaviyo",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get flow by ID
   */
  async getFlow(id: string, includeDefinition: boolean = false): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Include definition if requested
      if (includeDefinition) {
        queryParams['additional-fields[flow]'] = 'definition';
      }
      
      // Make API request to get flow
      const response = await this.makeApiRequest(
        'get',
        `flows/${id}`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          flow: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting flow ${id} from Klaviyo:`, error);
      return {
        success: false,
        message: `Failed to get flow ${id} from Klaviyo`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Create a new flow
   */
  async createFlow(flowData: any): Promise<KlaviyoCommandResult> {
    try {
      // Make API request to create flow
      const response = await this.makeApiRequest(
        'post',
        'flows',
        { data: flowData },
        undefined,
        KlaviyoApiRevision.FLOWS_BETA
      );
      
      return {
        success: true,
        message: "Flow created successfully",
        data: {
          flow: response.data
        }
      };
    } catch (error) {
      console.error("Error creating flow in Klaviyo:", error);
      return {
        success: false,
        message: "Failed to create flow in Klaviyo",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get flows triggered by a metric
   */
  async getFlowsTriggeredByMetric(metricId: string): Promise<KlaviyoCommandResult> {
    try {
      // Make API request to get flows triggered by metric
      const response = await this.makeApiRequest(
        'get',
        `metrics/${metricId}/flow-triggers`,
        undefined,
        undefined,
        KlaviyoApiRevision.FLOWS_BETA
      );
      
      return {
        success: true,
        data: {
          flows: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting flows triggered by metric ${metricId}:`, error);
      return {
        success: false,
        message: `Failed to get flows triggered by metric ${metricId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get client reviews
   */
  async getClientReviews(params: KlaviyoReviewParams = {}): Promise<KlaviyoCommandResult> {
    try {
      if (!this.publicKey) {
        throw new Error("Klaviyo Public key is required for client reviews");
      }
      
      // Set up query parameters
      const queryParams: any = {};
      
      if (params.limit) queryParams.limit = params.limit;
      if (params.page) queryParams.page = params.page;
      if (params.cursor) queryParams['page[cursor]'] = params.cursor;
      if (params.filter) queryParams.filter = params.filter;
      if (params.sort) queryParams.sort = params.sort;
      
      // Make API request to get client reviews
      const response = await this.makeApiRequest(
        'get',
        'client-reviews',
        undefined,
        queryParams,
        KlaviyoApiRevision.BETA,
        true // Use client authentication
      );
      
      return {
        success: true,
        data: {
          reviews: response.data,
          nextCursor: response.links?.next ? this.extractCursorFromUrl(response.links.next) : undefined,
          hasNextPage: !!response.links?.next
        }
      };
    } catch (error) {
      console.error("Error getting client reviews from Klaviyo:", error);
      return {
        success: false,
        message: "Failed to get client reviews from Klaviyo",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Create a client review
   */
  async createClientReview(reviewData: any): Promise<KlaviyoCommandResult> {
    try {
      if (!this.publicKey) {
        throw new Error("Klaviyo Public key is required for creating client reviews");
      }
      
      // Make API request to create client review
      const response = await this.makeApiRequest(
        'post',
        'client-reviews',
        { data: reviewData },
        undefined,
        KlaviyoApiRevision.BETA,
        true // Use client authentication
      );
      
      return {
        success: true,
        message: "Client review created successfully",
        data: {
          review: response.data
        }
      };
    } catch (error) {
      console.error("Error creating client review in Klaviyo:", error);
      return {
        success: false,
        message: "Failed to create client review in Klaviyo",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get all campaign messages for a campaign (Placeholder to avoid duplicate functions)
   * Implementation moved below
   */
  
  /**
   * Get a specific campaign message by ID
   */
  async getCampaignMessage(messageId: string, params: KlaviyoMessageParams = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add field selectors if provided
      if (params.fields) {
        // Handle different field types
        const fieldTypes = ['campaign-message', 'campaign', 'image', 'template'];
        
        for (const fieldType of fieldTypes) {
          if (params.fields[fieldType] && Array.isArray(params.fields[fieldType])) {
            queryParams[`fields[${fieldType}]`] = params.fields[fieldType].join(',');
          }
        }
      }
      
      // Add includes if provided
      if (params.include && Array.isArray(params.include)) {
        queryParams.include = params.include.join(',');
      }
      
      // Make API request to get the specific campaign message
      const response = await this.makeApiRequest(
        'get',
        `campaign-messages/${messageId}`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          campaignMessages: [response.data]
        }
      };
    } catch (error) {
      console.error(`Error getting campaign message ${messageId}:`, error);
      return {
        success: false,
        message: `Failed to get campaign message ${messageId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Update a campaign message
   */
  async updateCampaignMessage(messageId: string, messageData: any): Promise<KlaviyoCommandResult> {
    try {
      // Ensure message data has correct structure
      if (!messageData.type) {
        messageData.type = 'campaign-message';
      }
      
      if (!messageData.id) {
        messageData.id = messageId;
      }
      
      // Prepare request data
      const requestData = {
        data: messageData
      };
      
      // Make API request to update the campaign message
      const response = await this.makeApiRequest(
        'patch',
        `campaign-messages/${messageId}`,
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Campaign message updated successfully",
        data: {
          campaignMessage: response.data
        }
      };
    } catch (error) {
      console.error(`Error updating campaign message ${messageId}:`, error);
      return {
        success: false,
        message: `Failed to update campaign message ${messageId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Assign a template to a campaign message
   */
  async assignTemplateToCampaignMessage(messageId: string, templateId: string): Promise<KlaviyoCommandResult> {
    try {
      // Prepare request data
      const requestData = {
        data: {
          type: 'campaign-message',
          id: messageId,
          relationships: {
            template: {
              data: {
                type: 'template',
                id: templateId
              }
            }
          }
        }
      };
      
      // Make API request to assign template to campaign message
      const response = await this.makeApiRequest(
        'post',
        'campaign-message-assign-template',
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Template assigned to campaign message successfully",
        data: {
          campaignMessages: [response.data]
        }
      };
    } catch (error) {
      console.error(`Error assigning template ${templateId} to campaign message ${messageId}:`, error);
      return {
        success: false,
        message: `Failed to assign template to campaign message`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get the campaign associated with a campaign message
   */
  async getCampaignForMessage(messageId: string, fields?: string[]): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add fields if provided
      if (fields && fields.length > 0) {
        queryParams['fields[campaign]'] = fields.join(',');
      }
      
      // Make API request to get the campaign for a message
      const response = await this.makeApiRequest(
        'get',
        `campaign-messages/${messageId}/campaign`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          campaign: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting campaign for message ${messageId}:`, error);
      return {
        success: false,
        message: `Failed to get campaign for message ${messageId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get just the ID of the campaign associated with a campaign message
   */
  async getCampaignIdForMessage(messageId: string): Promise<KlaviyoCommandResult> {
    try {
      // Make API request to get the campaign ID for a message
      const response = await this.makeApiRequest(
        'get',
        `campaign-messages/${messageId}/relationships/campaign`,
        undefined,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          campaign: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting campaign ID for message ${messageId}:`, error);
      return {
        success: false,
        message: `Failed to get campaign ID for message ${messageId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get the template associated with a campaign message
   */
  async getTemplateForMessage(messageId: string, fields?: string[]): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add fields if provided
      if (fields && fields.length > 0) {
        queryParams['fields[template]'] = fields.join(',');
      }
      
      // Make API request to get the template for a message
      const response = await this.makeApiRequest(
        'get',
        `campaign-messages/${messageId}/template`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          template: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting template for message ${messageId}:`, error);
      return {
        success: false,
        message: `Failed to get template for message ${messageId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get just the ID of the template associated with a campaign message
   */
  async getTemplateIdForMessage(messageId: string): Promise<KlaviyoCommandResult> {
    try {
      // Make API request to get the template ID for a message
      const response = await this.makeApiRequest(
        'get',
        `campaign-messages/${messageId}/relationships/template`,
        undefined,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          template: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting template ID for message ${messageId}:`, error);
      return {
        success: false,
        message: `Failed to get template ID for message ${messageId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get the image associated with a campaign message
   */
  async getImageForMessage(messageId: string, fields?: string[]): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add fields if provided
      if (fields && fields.length > 0) {
        queryParams['fields[image]'] = fields.join(',');
      }
      
      // Make API request to get the image for a message
      const response = await this.makeApiRequest(
        'get',
        `campaign-messages/${messageId}/image`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          image: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting image for message ${messageId}:`, error);
      return {
        success: false,
        message: `Failed to get image for message ${messageId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get just the ID of the image associated with a campaign message
   */
  async getImageIdForMessage(messageId: string): Promise<KlaviyoCommandResult> {
    try {
      // Make API request to get the image ID for a message
      const response = await this.makeApiRequest(
        'get',
        `campaign-messages/${messageId}/relationships/image`,
        undefined,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          image: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting image ID for message ${messageId}:`, error);
      return {
        success: false,
        message: `Failed to get image ID for message ${messageId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Update the image for a campaign message
   */
  async updateImageForMessage(messageId: string, imageId: string): Promise<KlaviyoCommandResult> {
    try {
      // Prepare request data
      const requestData = {
        data: {
          type: 'image',
          id: imageId
        }
      };
      
      // Make API request to update the image for a campaign message
      await this.makeApiRequest(
        'patch',
        `campaign-messages/${messageId}/relationships/image`,
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      // This endpoint returns 204 No Content on success
      return {
        success: true,
        message: "Campaign message image updated successfully"
      };
    } catch (error) {
      console.error(`Error updating image for message ${messageId}:`, error);
      return {
        success: false,
        message: `Failed to update image for message ${messageId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Create a campaign send job
   */
  async createCampaignSendJob(campaignId: string): Promise<KlaviyoCommandResult> {
    try {
      // Prepare request data
      const requestData = {
        data: {
          type: "campaign-send-job",
          attributes: {
            action: "schedule"
          },
          relationships: {
            campaign: {
              data: {
                type: "campaign",
                id: campaignId
              }
            }
          }
        }
      };
      
      // Make API request to create campaign send job
      const response = await this.makeApiRequest(
        'post',
        'campaign-send-jobs',
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Campaign send job created successfully",
        data: {
          campaignSendJob: response.data
        }
      };
    } catch (error) {
      console.error(`Error creating send job for campaign ${campaignId}:`, error);
      return {
        success: false,
        message: `Failed to create send job for campaign ${campaignId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get campaign send job status
   */
  async getCampaignSendJob(jobId: string): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Make API request to get campaign send job status
      const response = await this.makeApiRequest(
        'get',
        `campaign-send-jobs/${jobId}`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          campaignSendJob: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting campaign send job ${jobId}:`, error);
      return {
        success: false,
        message: `Failed to get campaign send job ${jobId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Cancel a campaign send job
   */
  async cancelCampaignSendJob(jobId: string, action: string = 'cancel'): Promise<KlaviyoCommandResult> {
    try {
      // Prepare data for cancelling a campaign send job
      const data = {
        data: {
          type: "campaign-send-job",
          id: jobId,
          attributes: {
            action: action // 'cancel' or 'revert'
          }
        }
      };
      
      // Make API request to cancel/revert the campaign send job
      await this.makeApiRequest(
        'patch',
        `campaign-send-jobs/${jobId}`,
        data,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: `Campaign send job ${action === 'cancel' ? 'cancelled' : 'reverted'} successfully`
      };
    } catch (error) {
      console.error(`Error ${action === 'cancel' ? 'cancelling' : 'reverting'} campaign send job ${jobId}:`, error);
      return {
        success: false,
        message: `Failed to ${action === 'cancel' ? 'cancel' : 'revert'} campaign send job ${jobId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Create a campaign recipient estimation job
   */
  async createCampaignRecipientEstimationJob(campaignId: string): Promise<KlaviyoCommandResult> {
    try {
      // Prepare data for creating a campaign recipient estimation job
      const data = {
        data: {
          type: "campaign-recipient-estimation-job",
          id: campaignId
        }
      };
      
      // Make API request to create a campaign recipient estimation job
      const response = await this.makeApiRequest(
        'post',
        'campaign-recipient-estimation-jobs',
        data,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Campaign recipient estimation job created successfully",
        data: {
          campaignRecipientEstimationJob: response.data
        }
      };
    } catch (error) {
      console.error(`Error creating campaign recipient estimation job for campaign ${campaignId}:`, error);
      return {
        success: false,
        message: `Failed to create campaign recipient estimation job for campaign ${campaignId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get campaign recipient estimation job status
   */
  async getCampaignRecipientEstimationJob(jobId: string): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Make API request to get campaign recipient estimation job status
      const response = await this.makeApiRequest(
        'get',
        `campaign-recipient-estimation-jobs/${jobId}`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          campaignRecipientEstimationJob: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting campaign recipient estimation job ${jobId}:`, error);
      return {
        success: false,
        message: `Failed to get campaign recipient estimation job ${jobId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get tags for a campaign
   */
  async getCampaignTags(campaignId: string): Promise<KlaviyoCommandResult> {
    try {
      // Make API request to get tags for a campaign
      const response = await this.makeApiRequest(
        'get',
        `campaigns/${campaignId}/tags`,
        undefined,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          tags: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting tags for campaign ${campaignId}:`, error);
      return {
        success: false,
        message: `Failed to get tags for campaign ${campaignId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get tag IDs for a campaign
   */
  async getCampaignTagIds(campaignId: string): Promise<KlaviyoCommandResult> {
    try {
      // Make API request to get tag IDs for a campaign
      const response = await this.makeApiRequest(
        'get',
        `campaigns/${campaignId}/relationships/tags`,
        undefined,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          tagIds: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting tag IDs for campaign ${campaignId}:`, error);
      return {
        success: false,
        message: `Failed to get tag IDs for campaign ${campaignId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get messages for a campaign
   */
  async getCampaignMessages(campaignId: string, params: KlaviyoMessageParams = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add fields if specified
      if (params.fields) {
        Object.entries(params.fields).forEach(([key, value]) => {
          if (value && value.length > 0) {
            queryParams[`fields[${key}]`] = value.join(',');
          }
        });
      }
      
      // Add includes if specified
      if (params.include && params.include.length > 0) {
        queryParams.include = params.include.join(',');
      }
      
      // Make API request to get messages for a campaign
      const response = await this.makeApiRequest(
        'get',
        `campaigns/${campaignId}/campaign-messages`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          campaignMessages: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting messages for campaign ${campaignId}:`, error);
      return {
        success: false,
        message: `Failed to get messages for campaign ${campaignId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get message IDs for a campaign
   */
  async getCampaignMessageIds(campaignId: string): Promise<KlaviyoCommandResult> {
    try {
      // Make API request to get message IDs for a campaign
      const response = await this.makeApiRequest(
        'get',
        `campaigns/${campaignId}/relationships/campaign-messages`,
        undefined,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          messageIds: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting message IDs for campaign ${campaignId}:`, error);
      return {
        success: false,
        message: `Failed to get message IDs for campaign ${campaignId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Process a Klaviyo command
   */
  async processCommand(command: string, parameters: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Normalize the command
      const normalizedCommand = command.toLowerCase().trim();

      // Process based on command
      switch (normalizedCommand) {
        // Campaign operations
        case 'get_campaigns':
          return await this.getCampaigns(parameters);
        
        case 'create_campaign':
          return await this.createCampaign(parameters.campaign);
          
        case 'get_campaign_messages':
          return await this.getCampaignMessages(parameters.campaignId);
          
        case 'get_campaign_message':
          return await this.getCampaignMessage(parameters.messageId, parameters.options);
          
        case 'update_campaign_message':
          return await this.updateCampaignMessage(parameters.messageId, parameters.messageData);
          
        case 'assign_template_to_campaign_message':
          return await this.assignTemplateToCampaignMessage(parameters.messageId, parameters.templateId);
          
        case 'get_campaign_for_message':
          return await this.getCampaignForMessage(parameters.messageId, parameters.fields);
          
        case 'get_campaign_id_for_message':
          return await this.getCampaignIdForMessage(parameters.messageId);
          
        case 'get_template_for_message':
          return await this.getTemplateForMessage(parameters.messageId, parameters.fields);
          
        case 'get_template_id_for_message':
          return await this.getTemplateIdForMessage(parameters.messageId);
          
        case 'get_image_for_message':
          return await this.getImageForMessage(parameters.messageId, parameters.fields);
          
        case 'get_image_id_for_message':
          return await this.getImageIdForMessage(parameters.messageId);
          
        case 'update_image_for_message':
          return await this.updateImageForMessage(parameters.messageId, parameters.imageId);
          
        case 'send_campaign':
          return await this.createCampaignSendJob(parameters.campaignId);
          
        case 'get_campaign_send_job':
          return await this.getCampaignSendJob(parameters.jobId);
          
        case 'cancel_campaign_send_job':
          return await this.cancelCampaignSendJob(parameters.jobId, 'cancel');
          
        case 'revert_campaign_send_job':
          return await this.cancelCampaignSendJob(parameters.jobId, 'revert');
          
        case 'create_campaign_recipient_estimation':
          return await this.createCampaignRecipientEstimationJob(parameters.campaignId);
          
        case 'get_campaign_recipient_estimation':
          return await this.getCampaignRecipientEstimationJob(parameters.jobId);
          
        case 'get_campaign_tags':
          return await this.getCampaignTags(parameters.campaignId);
          
        case 'get_campaign_tag_ids':
          return await this.getCampaignTagIds(parameters.campaignId);
          
        case 'get_campaign_message_ids':
          return await this.getCampaignMessageIds(parameters.campaignId);
        
        // Catalog item operations
        case 'get_catalog_items':
          return await this.getCatalogItems(parameters);
          
        case 'get_catalog_item':
          return await this.getCatalogItem(parameters.id, parameters.options);
          
        case 'create_catalog_item':
          return await this.createCatalogItem(parameters.item);
          
        case 'update_catalog_item':
          return await this.updateCatalogItem(parameters.id, parameters.item);
          
        case 'delete_catalog_item':
          return await this.deleteCatalogItem(parameters.id);
          
        // Catalog item bulk operations
        case 'get_catalog_item_bulk_create_jobs':
          return await this.getCatalogItemBulkCreateJobs(parameters);
          
        case 'get_catalog_item_bulk_create_job':
          return await this.getCatalogItemBulkCreateJob(parameters.jobId, parameters.options);
          
        case 'create_catalog_item_bulk_create_job':
          return await this.createCatalogItemBulkCreateJob(parameters.items);
          
        case 'get_catalog_item_bulk_update_jobs':
          return await this.getCatalogItemBulkUpdateJobs(parameters);
          
        case 'get_catalog_item_bulk_update_job':
          return await this.getCatalogItemBulkUpdateJob(parameters.jobId, parameters.options);
          
        case 'create_catalog_item_bulk_update_job':
          return await this.createCatalogItemBulkUpdateJob(parameters.items);
          
        case 'get_catalog_item_bulk_delete_jobs':
          return await this.getCatalogItemBulkDeleteJobs(parameters);
          
        case 'get_catalog_item_bulk_delete_job':
          return await this.getCatalogItemBulkDeleteJob(parameters.jobId, parameters.options);
          
        case 'create_catalog_item_bulk_delete_job':
          return await this.createCatalogItemBulkDeleteJob(parameters.items);
          
        // Catalog category operations
        case 'get_catalog_categories':
          return await this.getCatalogCategories(parameters);
          
        case 'get_catalog_category':
          return await this.getCatalogCategory(parameters.id, parameters.options);
          
        case 'create_catalog_category':
          return await this.createCatalogCategory(parameters.category);
          
        case 'update_catalog_category':
          return await this.updateCatalogCategory(parameters.id, parameters.category);
          
        case 'delete_catalog_category':
          return await this.deleteCatalogCategory(parameters.id);
          
        case 'get_catalog_category_items':
          return await this.getCatalogCategoryItems(parameters.categoryId, parameters.options);
          
        case 'get_catalog_item_category_ids':
          return await this.getCategoryIdsForCatalogItem(parameters.itemId, parameters.options);
          
        case 'add_categories_to_catalog_item':
          return await this.addCategoriesToCatalogItem(parameters.itemId, parameters.categoryIds);
          
        case 'update_catalog_item_categories':
          return await this.updateCategoriesForCatalogItem(parameters.itemId, parameters.categoryIds);
          
        case 'remove_categories_from_catalog_item':
          return await this.removeCategoriesFromCatalogItem(parameters.itemId, parameters.categoryIds);
          
        // Catalog category bulk operations
        case 'get_catalog_category_bulk_create_jobs':
          return await this.getCatalogCategoryBulkCreateJobs(parameters);
          
        case 'get_catalog_category_bulk_create_job':
          return await this.getCatalogCategoryBulkCreateJob(parameters.jobId, parameters.options);
          
        case 'create_catalog_category_bulk_create_job':
          return await this.createCatalogCategoryBulkCreateJob(parameters.categories);
          
        case 'get_catalog_category_bulk_update_jobs':
          return await this.getCatalogCategoryBulkUpdateJobs(parameters);
          
        // Subscription operations
        case 'create_back_in_stock_subscription':
          return await this.createBackInStockSubscription(parameters.subscription);
        
        // Segment operations
        case 'get_segments':
          return await this.getSegments(parameters);
        
        // Metric operations
        case 'get_metrics':
          return await this.getMetrics(parameters);
          
        // Flow operations
        case 'get_flows':
          return await this.getFlows(parameters);
          
        case 'get_flow':
          return await this.getFlow(parameters.flowId, parameters.includeDefinition);
          
        case 'create_flow':
          return await this.createFlow(parameters.flow);
          
        case 'get_flows_by_metric':
          return await this.getFlowsTriggeredByMetric(parameters.metricId);
        
        // Review operations
        case 'get_reviews':
          return await this.getClientReviews(parameters);
          
        case 'create_review':
          return await this.createClientReview(parameters.review);
          
        // Account operations
        case 'get_account_info':
          return await this.getAccountInfo();
        
        default:
          // For unknown commands, we can attempt to use OpenAI to generate a response
          if (this.openai) {
            const response = await this.openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
              messages: [
                {
                  role: "system",
                  content: "You are a helpful assistant that provides information about Klaviyo API usage."
                },
                {
                  role: "user",
                  content: `I want to ${normalizedCommand} in Klaviyo. What API endpoints and parameters should I use?`
                }
              ],
              max_tokens: 500
            });
            
            return {
              success: false,
              message: "Unsupported command. Here's some information about Klaviyo API usage:",
              data: {
                aiSuggestion: response.choices[0].message.content ?? ''
              } as KlaviyoCommandResult['data']
            };
          }
          
          return {
            success: false,
            message: `Unsupported command: ${command}`
          };
      }
    } catch (error) {
      console.error(`Error processing Klaviyo command '${command}':`, error);
      return {
        success: false,
        message: `Error processing Klaviyo command: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Get a specific catalog item by ID
   */
  async getCatalogItem(id: string, params: KlaviyoCatalogParams = {}): Promise<KlaviyoCommandResult> {
    try {
      // Validate ID parameter
      if (!id) {
        return {
          success: false,
          message: "Catalog item ID is required"
        };
      }
      
      // Set up query parameters
      const queryParams: any = {};
      
      // Add fields if specified
      if (params.fields) {
        Object.entries(params.fields).forEach(([key, value]) => {
          if (value && value.length > 0) {
            queryParams[`fields[${key}]`] = value.join(',');
          }
        });
      }
      
      // Add includes if specified
      if (params.include && params.include.length > 0) {
        queryParams.include = params.include.join(',');
      }
      
      // Make API request to get the specific catalog item
      const response = await this.makeApiRequest(
        'get',
        `catalog-items/${id}`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          catalogItem: response.data as KlaviyoCatalogItem
        }
      };
    } catch (error) {
      console.error(`Error getting catalog item ${id}:`, error);
      return {
        success: false,
        message: `Failed to get catalog item ${id}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Update a catalog item
   */
  async updateCatalogItem(id: string, itemData: KlaviyoCatalogItemUpdate): Promise<KlaviyoCommandResult> {
    try {
      // Ensure itemData has correct structure
      if (!itemData.type) {
        itemData.type = 'catalog-item';
      }
      
      if (!itemData.id) {
        itemData.id = id;
      } else if (itemData.id !== id) {
        return {
          success: false,
          message: "Item ID in the data does not match the ID in the URL"
        };
      }

      // Check if we have at least one attribute to update
      if (!itemData.attributes && !itemData.relationships) {
        return {
          success: false,
          message: "At least one attribute or relationship must be provided for update"
        };
      }
      
      // Prepare request data
      const requestData = {
        data: itemData
      };
      
      // Make API request to update the catalog item
      const response = await this.makeApiRequest(
        'patch',
        `catalog-items/${id}`,
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Catalog item updated successfully",
        data: {
          catalogItem: response.data as KlaviyoCatalogItem
        }
      };
    } catch (error) {
      console.error(`Error updating catalog item ${id}:`, error);
      return {
        success: false,
        message: `Failed to update catalog item ${id}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Delete a catalog item
   */
  async deleteCatalogItem(id: string): Promise<KlaviyoCommandResult> {
    try {
      // Make API request to delete the catalog item
      await this.makeApiRequest(
        'delete',
        `catalog-items/${id}`,
        undefined,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      // This endpoint returns 204 No Content on success
      return {
        success: true,
        message: "Catalog item deleted successfully"
      };
    } catch (error) {
      console.error(`Error deleting catalog item ${id}:`, error);
      return {
        success: false,
        message: `Failed to delete catalog item ${id}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get catalog items
   */
  async getCatalogItems(params: KlaviyoCatalogParams = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add pagination parameters
      if (params.limit) queryParams.limit = params.limit;
      if (params.cursor) queryParams['page[cursor]'] = params.cursor;
      
      // Add filtering
      if (params.filter) queryParams.filter = params.filter;
      
      // Add sorting
      if (params.sort) queryParams.sort = params.sort;
      
      // Add fields if specified
      if (params.fields) {
        Object.entries(params.fields).forEach(([key, value]) => {
          if (value && value.length > 0) {
            queryParams[`fields[${key}]`] = value.join(',');
          }
        });
      }
      
      // Add includes if specified
      if (params.include && params.include.length > 0) {
        queryParams.include = params.include.join(',');
      }
      
      // Make API request to get catalog items
      const response = await this.makeApiRequest(
        'get',
        'catalog-items',
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          catalogItems: response.data as KlaviyoCatalogItem[],
          nextCursor: response.links?.next ? this.extractCursorFromUrl(response.links.next) : undefined,
          hasNextPage: !!response.links?.next
        }
      };
    } catch (error) {
      console.error("Error getting catalog items:", error);
      return {
        success: false,
        message: "Failed to get catalog items",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Create a catalog item
   */
  async createCatalogItem(itemData: KlaviyoCatalogItemCreate): Promise<KlaviyoCommandResult> {
    try {
      // Ensure itemData has correct structure
      if (!itemData.type) {
        itemData.type = 'catalog-item';
      }
      
      // Validate required fields based on the API documentation
      if (!itemData.attributes.external_id) {
        return {
          success: false,
          message: "external_id is required in catalog item attributes"
        };
      }
      
      if (!itemData.attributes.title) {
        return {
          success: false,
          message: "title is required in catalog item attributes"
        };
      }
      
      if (!itemData.attributes.description) {
        return {
          success: false,
          message: "description is required in catalog item attributes"
        };
      }
      
      if (!itemData.attributes.url) {
        return {
          success: false,
          message: "url is required in catalog item attributes"
        };
      }
      
      // Set default values if not provided
      if (itemData.attributes.integration_type === undefined) {
        itemData.attributes.integration_type = '$custom';
      }
      
      if (itemData.attributes.catalog_type === undefined) {
        itemData.attributes.catalog_type = '$default';
      }
      
      if (itemData.attributes.published === undefined) {
        itemData.attributes.published = true;
      }
      
      // Prepare request data
      const requestData = {
        data: itemData
      };
      
      // Make API request to create catalog item
      const response = await this.makeApiRequest(
        'post',
        'catalog-items',
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Catalog item created successfully",
        data: {
          catalogItem: response.data as KlaviyoCatalogItem
        }
      };
    } catch (error) {
      console.error("Error creating catalog item:", error);
      return {
        success: false,
        message: "Failed to create catalog item",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get a specific catalog item bulk create job by ID
   */
  async getCatalogItemBulkCreateJob(jobId: string, params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add fields if specified
      if (params.fields) {
        if (params.fields['catalog-item-bulk-create-job']) {
          queryParams['fields[catalog-item-bulk-create-job]'] = params.fields['catalog-item-bulk-create-job'].join(',');
        }
        
        if (params.fields['catalog-item']) {
          queryParams['fields[catalog-item]'] = params.fields['catalog-item'].join(',');
        }
      }
      
      // Add includes if specified
      if (params.include && params.include.length > 0) {
        queryParams.include = params.include.join(',');
      }
      
      // Make API request to get the specific bulk create job
      const response = await this.makeApiRequest(
        'get',
        `catalog-item-bulk-create-jobs/${jobId}`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          bulkCreateJob: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting catalog item bulk create job ${jobId}:`, error);
      return {
        success: false,
        message: `Failed to get catalog item bulk create job ${jobId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get catalog item bulk create jobs
   */
  async getCatalogItemBulkCreateJobs(params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add pagination parameters
      if (params.cursor) queryParams['page[cursor]'] = params.cursor;
      
      // Add filtering
      if (params.filter) queryParams.filter = params.filter;
      
      // Add fields if specified
      if (params.fields && params.fields['catalog-item-bulk-create-job']) {
        queryParams['fields[catalog-item-bulk-create-job]'] = params.fields['catalog-item-bulk-create-job'].join(',');
      }
      
      // Make API request to get catalog item bulk create jobs
      const response = await this.makeApiRequest(
        'get',
        'catalog-item-bulk-create-jobs',
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          bulkCreateJobs: response.data,
          nextCursor: response.links?.next ? this.extractCursorFromUrl(response.links.next) : undefined,
          hasNextPage: !!response.links?.next
        }
      };
    } catch (error) {
      console.error("Error getting catalog item bulk create jobs:", error);
      return {
        success: false,
        message: "Failed to get catalog item bulk create jobs",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Create a catalog item bulk create job
   */
  async createCatalogItemBulkCreateJob(items: any[]): Promise<KlaviyoCommandResult> {
    try {
      // Check if the number of items is within limits
      if (items.length > 100) {
        return {
          success: false,
          message: "Maximum of 100 catalog items allowed per bulk create job"
        };
      }
      
      // Prepare request data
      const requestData = {
        data: {
          type: "catalog-item-bulk-create-job",
          attributes: {
            items: {
              data: items
            }
          }
        }
      };
      
      // Make API request to create catalog item bulk create job
      const response = await this.makeApiRequest(
        'post',
        'catalog-item-bulk-create-jobs',
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Catalog item bulk create job created successfully",
        data: {
          bulkCreateJob: response.data
        }
      };
    } catch (error) {
      console.error("Error creating catalog item bulk create job:", error);
      return {
        success: false,
        message: "Failed to create catalog item bulk create job",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Create a back in stock subscription
   */
  async createBackInStockSubscription(subscriptionData: KlaviyoBackInStockParams): Promise<KlaviyoCommandResult> {
    try {
      // Prepare request data
      const requestData = {
        data: {
          type: "back-in-stock-subscription",
          attributes: {
            channels: subscriptionData.channels
          },
          relationships: {
            profile: {
              data: {
                type: "profile",
                attributes: subscriptionData.profile
              }
            },
            variant: {
              data: {
                type: "catalog-variant",
                id: subscriptionData.variant_id
              }
            }
          }
        }
      };
      
      // Make API request to create back in stock subscription
      const response = await this.makeApiRequest(
        'post',
        'back-in-stock-subscriptions',
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Back in stock subscription created successfully",
        data: {
          subscription: response.data
        }
      };
    } catch (error) {
      console.error("Error creating back in stock subscription:", error);
      return {
        success: false,
        message: "Failed to create back in stock subscription",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get catalog item bulk update jobs
   */
  async getCatalogItemBulkUpdateJobs(params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add pagination parameters
      if (params.cursor) queryParams['page[cursor]'] = params.cursor;
      
      // Add filtering
      if (params.filter) queryParams.filter = params.filter;
      
      // Add fields if specified
      if (params.fields && params.fields['catalog-item-bulk-update-job']) {
        queryParams['fields[catalog-item-bulk-update-job]'] = params.fields['catalog-item-bulk-update-job'].join(',');
      }
      
      // Make API request to get catalog item bulk update jobs
      const response = await this.makeApiRequest(
        'get',
        'catalog-item-bulk-update-jobs',
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          bulkUpdateJobs: response.data,
          nextCursor: response.links?.next ? this.extractCursorFromUrl(response.links.next) : undefined,
          hasNextPage: !!response.links?.next
        }
      };
    } catch (error) {
      console.error("Error getting catalog item bulk update jobs:", error);
      return {
        success: false,
        message: "Failed to get catalog item bulk update jobs",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get a specific catalog item bulk update job by ID
   */
  async getCatalogItemBulkUpdateJob(jobId: string, params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add fields if specified
      if (params.fields) {
        if (params.fields['catalog-item-bulk-update-job']) {
          queryParams['fields[catalog-item-bulk-update-job]'] = params.fields['catalog-item-bulk-update-job'].join(',');
        }
        
        if (params.fields['catalog-item']) {
          queryParams['fields[catalog-item]'] = params.fields['catalog-item'].join(',');
        }
      }
      
      // Add includes if specified
      if (params.include && params.include.length > 0) {
        queryParams.include = params.include.join(',');
      }
      
      // Make API request to get the specific bulk update job
      const response = await this.makeApiRequest(
        'get',
        `catalog-item-bulk-update-jobs/${jobId}`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          bulkUpdateJob: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting catalog item bulk update job ${jobId}:`, error);
      return {
        success: false,
        message: `Failed to get catalog item bulk update job ${jobId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a catalog item bulk update job
   */
  async createCatalogItemBulkUpdateJob(items: any[]): Promise<KlaviyoCommandResult> {
    try {
      // Check if the number of items is within limits
      if (items.length > 100) {
        return {
          success: false,
          message: "Maximum of 100 catalog items allowed per bulk update job"
        };
      }
      
      // Prepare request data
      const requestData = {
        data: {
          type: "catalog-item-bulk-update-job",
          attributes: {
            items: {
              data: items
            }
          }
        }
      };
      
      // Make API request to create catalog item bulk update job
      const response = await this.makeApiRequest(
        'post',
        'catalog-item-bulk-update-jobs',
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Catalog item bulk update job created successfully",
        data: {
          bulkUpdateJob: response.data
        }
      };
    } catch (error) {
      console.error("Error creating catalog item bulk update job:", error);
      return {
        success: false,
        message: "Failed to create catalog item bulk update job",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get catalog item bulk delete jobs
   */
  async getCatalogItemBulkDeleteJobs(params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add pagination parameters
      if (params.cursor) queryParams['page[cursor]'] = params.cursor;
      
      // Add filtering
      if (params.filter) queryParams.filter = params.filter;
      
      // Add fields if specified
      if (params.fields && params.fields['catalog-item-bulk-delete-job']) {
        queryParams['fields[catalog-item-bulk-delete-job]'] = params.fields['catalog-item-bulk-delete-job'].join(',');
      }
      
      // Make API request to get catalog item bulk delete jobs
      const response = await this.makeApiRequest(
        'get',
        'catalog-item-bulk-delete-jobs',
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          bulkDeleteJobs: response.data,
          nextCursor: response.links?.next ? this.extractCursorFromUrl(response.links.next) : undefined,
          hasNextPage: !!response.links?.next
        }
      };
    } catch (error) {
      console.error("Error getting catalog item bulk delete jobs:", error);
      return {
        success: false,
        message: "Failed to get catalog item bulk delete jobs",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get a specific catalog item bulk delete job by ID
   */
  async getCatalogItemBulkDeleteJob(jobId: string, params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add fields if specified
      if (params.fields && params.fields['catalog-item-bulk-delete-job']) {
        queryParams['fields[catalog-item-bulk-delete-job]'] = params.fields['catalog-item-bulk-delete-job'].join(',');
      }
      
      // Make API request to get the specific bulk delete job
      const response = await this.makeApiRequest(
        'get',
        `catalog-item-bulk-delete-jobs/${jobId}`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          bulkDeleteJob: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting catalog item bulk delete job ${jobId}:`, error);
      return {
        success: false,
        message: `Failed to get catalog item bulk delete job ${jobId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a catalog item bulk delete job
   */
  async createCatalogItemBulkDeleteJob(items: any[]): Promise<KlaviyoCommandResult> {
    try {
      // Check if the number of items is within limits
      if (items.length > 100) {
        return {
          success: false,
          message: "Maximum of 100 catalog items allowed per bulk delete job"
        };
      }
      
      // Prepare request data
      const requestData = {
        data: {
          type: "catalog-item-bulk-delete-job",
          attributes: {
            items: {
              data: items
            }
          }
        }
      };
      
      // Make API request to create catalog item bulk delete job
      const response = await this.makeApiRequest(
        'post',
        'catalog-item-bulk-delete-jobs',
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Catalog item bulk delete job created successfully",
        data: {
          bulkDeleteJob: response.data
        }
      };
    } catch (error) {
      console.error("Error creating catalog item bulk delete job:", error);
      return {
        success: false,
        message: "Failed to create catalog item bulk delete job",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get catalog categories
   */
  async getCatalogCategories(params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add pagination parameters
      if (params.cursor) queryParams['page[cursor]'] = params.cursor;
      
      // Add filtering
      if (params.filter) queryParams.filter = params.filter;
      
      // Add sorting
      if (params.sort) queryParams.sort = params.sort;
      
      // Add fields if specified
      if (params.fields && params.fields['catalog-category']) {
        queryParams['fields[catalog-category]'] = params.fields['catalog-category'].join(',');
      }
      
      // Make API request to get catalog categories
      const response = await this.makeApiRequest(
        'get',
        'catalog-categories',
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          catalogCategories: response.data,
          nextCursor: response.links?.next ? this.extractCursorFromUrl(response.links.next) : undefined,
          hasNextPage: !!response.links?.next
        }
      };
    } catch (error) {
      console.error("Error getting catalog categories:", error);
      return {
        success: false,
        message: "Failed to get catalog categories",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get a specific catalog category by ID
   */
  async getCatalogCategory(id: string, params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add fields if specified
      if (params.fields && params.fields['catalog-category']) {
        queryParams['fields[catalog-category]'] = params.fields['catalog-category'].join(',');
      }
      
      // Make API request to get the specific catalog category
      const response = await this.makeApiRequest(
        'get',
        `catalog-categories/${id}`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          catalogCategory: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting catalog category ${id}:`, error);
      return {
        success: false,
        message: `Failed to get catalog category ${id}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a catalog category
   */
  async createCatalogCategory(categoryData: any): Promise<KlaviyoCommandResult> {
    try {
      // Prepare request data with proper typing
      const requestData: {
        data: {
          type: string;
          attributes: {
            external_id: string;
            name: string;
            integration_type: string;
            catalog_type: string;
          };
          relationships?: {
            items: {
              data: any[];
            };
          };
        };
      } = {
        data: {
          type: "catalog-category",
          attributes: {
            external_id: categoryData.external_id,
            name: categoryData.name,
            integration_type: categoryData.integration_type || "$custom",
            catalog_type: categoryData.catalog_type || "$default"
          }
        }
      };
      
      // Add relationships if provided
      if (categoryData.relationships && categoryData.relationships.items) {
        requestData.data.relationships = {
          items: {
            data: categoryData.relationships.items.data
          }
        };
      }
      
      // Make API request to create catalog category
      const response = await this.makeApiRequest(
        'post',
        'catalog-categories',
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Catalog category created successfully",
        data: {
          catalogCategory: response.data
        }
      };
    } catch (error) {
      console.error("Error creating catalog category:", error);
      return {
        success: false,
        message: "Failed to create catalog category",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update a catalog category
   */
  async updateCatalogCategory(id: string, categoryData: any): Promise<KlaviyoCommandResult> {
    try {
      // Prepare request data with proper typing
      const requestData: {
        data: {
          type: string;
          id: string;
          attributes: {
            name?: string;
          };
          relationships?: {
            items: {
              data: any[];
            };
          };
        };
      } = {
        data: {
          type: "catalog-category",
          id: id,
          attributes: {}
        }
      };
      
      // Add attributes if provided
      if (categoryData.name) {
        requestData.data.attributes.name = categoryData.name;
      }
      
      // Add relationships if provided
      if (categoryData.relationships && categoryData.relationships.items) {
        requestData.data.relationships = {
          items: {
            data: categoryData.relationships.items.data
          }
        };
      }
      
      // Make API request to update catalog category
      const response = await this.makeApiRequest(
        'patch',
        `catalog-categories/${id}`,
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Catalog category updated successfully",
        data: {
          catalogCategory: response.data
        }
      };
    } catch (error) {
      console.error(`Error updating catalog category ${id}:`, error);
      return {
        success: false,
        message: `Failed to update catalog category ${id}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Delete a catalog category
   */
  async deleteCatalogCategory(id: string): Promise<KlaviyoCommandResult> {
    try {
      // Make API request to delete catalog category
      await this.makeApiRequest(
        'delete',
        `catalog-categories/${id}`,
        undefined,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: `Catalog category ${id} deleted successfully`
      };
    } catch (error) {
      console.error(`Error deleting catalog category ${id}:`, error);
      return {
        success: false,
        message: `Failed to delete catalog category ${id}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get items for a catalog category
   */
  async getCatalogCategoryItems(categoryId: string, params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add pagination parameters
      if (params.cursor) queryParams['page[cursor]'] = params.cursor;
      
      // Add filtering
      if (params.filter) queryParams.filter = params.filter;
      
      // Add sorting
      if (params.sort) queryParams.sort = params.sort;
      
      // Add fields if specified
      if (params.fields) {
        if (params.fields['catalog-item']) {
          queryParams['fields[catalog-item]'] = params.fields['catalog-item'].join(',');
        }
        
        if (params.fields['catalog-variant']) {
          queryParams['fields[catalog-variant]'] = params.fields['catalog-variant'].join(',');
        }
      }
      
      // Add includes if specified
      if (params.include && params.include.length > 0) {
        queryParams.include = params.include.join(',');
      }
      
      // Make API request to get items for a category
      const response = await this.makeApiRequest(
        'get',
        `catalog-categories/${categoryId}/items`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          categoryItems: response.data,
          nextCursor: response.links?.next ? this.extractCursorFromUrl(response.links.next) : undefined,
          hasNextPage: !!response.links?.next
        }
      };
    } catch (error) {
      console.error(`Error getting items for catalog category ${categoryId}:`, error);
      return {
        success: false,
        message: `Failed to get items for catalog category ${categoryId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get category IDs for a catalog item
   */
  async getCategoryIdsForCatalogItem(itemId: string, params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add pagination parameters
      if (params.cursor) queryParams['page[cursor]'] = params.cursor;
      
      // Add filtering
      if (params.filter) queryParams.filter = params.filter;
      
      // Add sorting
      if (params.sort) queryParams.sort = params.sort;
      
      // Make API request to get category IDs for a catalog item
      const response = await this.makeApiRequest(
        'get',
        `catalog-items/${itemId}/relationships/categories`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          categoryIds: response.data,
          nextCursor: response.links?.next ? this.extractCursorFromUrl(response.links.next) : undefined,
          hasNextPage: !!response.links?.next
        }
      };
    } catch (error) {
      console.error(`Error getting category IDs for catalog item ${itemId}:`, error);
      return {
        success: false,
        message: `Failed to get category IDs for catalog item ${itemId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Add categories to a catalog item
   */
  async addCategoriesToCatalogItem(itemId: string, categoryIds: string[]): Promise<KlaviyoCommandResult> {
    try {
      // Prepare request data
      const data = categoryIds.map(id => ({
        type: "catalog-category",
        id
      }));
      
      // Make API request to add categories to a catalog item
      await this.makeApiRequest(
        'post',
        `catalog-items/${itemId}/relationships/categories`,
        { data },
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: `Categories added to catalog item ${itemId} successfully`
      };
    } catch (error) {
      console.error(`Error adding categories to catalog item ${itemId}:`, error);
      return {
        success: false,
        message: `Failed to add categories to catalog item ${itemId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update categories for a catalog item
   */
  async updateCategoriesForCatalogItem(itemId: string, categoryIds: string[]): Promise<KlaviyoCommandResult> {
    try {
      // Prepare request data
      const data = categoryIds.map(id => ({
        type: "catalog-category",
        id
      }));
      
      // Make API request to update categories for a catalog item
      await this.makeApiRequest(
        'patch',
        `catalog-items/${itemId}/relationships/categories`,
        { data },
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: `Categories updated for catalog item ${itemId} successfully`
      };
    } catch (error) {
      console.error(`Error updating categories for catalog item ${itemId}:`, error);
      return {
        success: false,
        message: `Failed to update categories for catalog item ${itemId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Remove categories from a catalog item
   */
  async removeCategoriesFromCatalogItem(itemId: string, categoryIds: string[]): Promise<KlaviyoCommandResult> {
    try {
      // Prepare request data
      const data = categoryIds.map(id => ({
        type: "catalog-category",
        id
      }));
      
      // Make API request to remove categories from a catalog item
      await this.makeApiRequest(
        'delete',
        `catalog-items/${itemId}/relationships/categories`,
        { data },
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: `Categories removed from catalog item ${itemId} successfully`
      };
    } catch (error) {
      console.error(`Error removing categories from catalog item ${itemId}:`, error);
      return {
        success: false,
        message: `Failed to remove categories from catalog item ${itemId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get catalog category bulk create jobs
   */
  async getCatalogCategoryBulkCreateJobs(params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add pagination parameters
      if (params.cursor) queryParams['page[cursor]'] = params.cursor;
      
      // Add filtering
      if (params.filter) queryParams.filter = params.filter;
      
      // Add fields if specified
      if (params.fields && params.fields['catalog-category-bulk-create-job']) {
        queryParams['fields[catalog-category-bulk-create-job]'] = params.fields['catalog-category-bulk-create-job'].join(',');
      }
      
      // Make API request to get catalog category bulk create jobs
      const response = await this.makeApiRequest(
        'get',
        'catalog-category-bulk-create-jobs',
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          bulkCreateJobs: response.data,
          nextCursor: response.links?.next ? this.extractCursorFromUrl(response.links.next) : undefined,
          hasNextPage: !!response.links?.next
        }
      };
    } catch (error) {
      console.error("Error getting catalog category bulk create jobs:", error);
      return {
        success: false,
        message: "Failed to get catalog category bulk create jobs",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get a specific catalog category bulk create job by ID
   */
  async getCatalogCategoryBulkCreateJob(jobId: string, params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add fields if specified
      if (params.fields) {
        if (params.fields['catalog-category-bulk-create-job']) {
          queryParams['fields[catalog-category-bulk-create-job]'] = params.fields['catalog-category-bulk-create-job'].join(',');
        }
        
        if (params.fields['catalog-category']) {
          queryParams['fields[catalog-category]'] = params.fields['catalog-category'].join(',');
        }
      }
      
      // Add includes if specified
      if (params.include && params.include.length > 0) {
        queryParams.include = params.include.join(',');
      }
      
      // Make API request to get the specific bulk create job
      const response = await this.makeApiRequest(
        'get',
        `catalog-category-bulk-create-jobs/${jobId}`,
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          bulkCreateJob: response.data
        }
      };
    } catch (error) {
      console.error(`Error getting catalog category bulk create job ${jobId}:`, error);
      return {
        success: false,
        message: `Failed to get catalog category bulk create job ${jobId}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a catalog category bulk create job
   */
  async createCatalogCategoryBulkCreateJob(categories: any[]): Promise<KlaviyoCommandResult> {
    try {
      // Check if the number of categories is within limits
      if (categories.length > 100) {
        return {
          success: false,
          message: "Maximum of 100 catalog categories allowed per bulk create job"
        };
      }
      
      // Prepare request data
      const requestData = {
        data: {
          type: "catalog-category-bulk-create-job",
          attributes: {
            categories: {
              data: categories
            }
          }
        }
      };
      
      // Make API request to create catalog category bulk create job
      const response = await this.makeApiRequest(
        'post',
        'catalog-category-bulk-create-jobs',
        requestData,
        undefined,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        message: "Catalog category bulk create job created successfully",
        data: {
          bulkCreateJob: response.data
        }
      };
    } catch (error) {
      console.error("Error creating catalog category bulk create job:", error);
      return {
        success: false,
        message: "Failed to create catalog category bulk create job",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get catalog category bulk update jobs
   */
  async getCatalogCategoryBulkUpdateJobs(params: any = {}): Promise<KlaviyoCommandResult> {
    try {
      // Set up query parameters
      const queryParams: any = {};
      
      // Add pagination parameters
      if (params.cursor) queryParams['page[cursor]'] = params.cursor;
      
      // Add filtering
      if (params.filter) queryParams.filter = params.filter;
      
      // Add fields if specified
      if (params.fields && params.fields['catalog-category-bulk-update-job']) {
        queryParams['fields[catalog-category-bulk-update-job]'] = params.fields['catalog-category-bulk-update-job'].join(',');
      }
      
      // Make API request to get catalog category bulk update jobs
      const response = await this.makeApiRequest(
        'get',
        'catalog-category-bulk-update-jobs',
        undefined,
        queryParams,
        KlaviyoApiRevision.STANDARD
      );
      
      return {
        success: true,
        data: {
          bulkUpdateJobs: response.data,
          nextCursor: response.links?.next ? this.extractCursorFromUrl(response.links.next) : undefined,
          hasNextPage: !!response.links?.next
        }
      };
    } catch (error) {
      console.error("Error getting catalog category bulk update jobs:", error);
      return {
        success: false,
        message: "Failed to get catalog category bulk update jobs",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export const klaviyoMcpClient = new KlaviyoMcpClient();