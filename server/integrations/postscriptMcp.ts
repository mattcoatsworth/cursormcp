import axios from 'axios';
import OpenAI from 'openai';
import { BaseMcpClient, McpCommandResult, McpCredentials } from './baseMcp';

interface PostscriptApiResponse {
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Postscript MCP client implementation
 */
export class PostscriptMcpClient extends BaseMcpClient {
  private apiKey: string = '';
  private baseUrl: string = 'https://api.postscript.io/v1';
  
  constructor() {
    super('postscript');
  }
  
  /**
   * Extract credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    if (!connectionCredentials.apiKey) {
      throw new Error('Postscript API Key is required');
    }
    
    this.apiKey = connectionCredentials.apiKey;
    
    return {
      apiKey: this.apiKey
    };
  }
  
  /**
   * Initialize the Postscript client
   */
  protected async serviceInitialize(): Promise<void> {
    try {
      // Verify API credentials by making a test request
      await this.makeApiRequest('/account');
      console.log('Postscript API connection verified');
    } catch (error) {
      console.error('Failed to initialize Postscript client:', error);
      throw new Error('Failed to connect to Postscript API. Please check your credentials.');
    }
  }
  
  /**
   * Make an API request to Postscript
   */
  private async makeApiRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };
      
      const response = await axios({
        method,
        url,
        headers,
        data
      });
      
      return response.data;
    } catch (error) {
      console.error(`Postscript API request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Get subscriber information
   */
  async getSubscribers(limit: number = 20, page: number = 1): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const response = await this.makeApiRequest(`/subscribers?limit=${limit}&page=${page}`);
      
      if (!response.data || !response.data.subscribers) {
        return {
          success: false,
          message: 'No subscriber data found'
        };
      }
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved ${response.data.subscribers.length} subscribers`
      };
    } catch (error) {
      console.error('Error fetching Postscript subscribers:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve subscribers: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Search for a specific subscriber by phone number
   */
  async searchSubscriber(phoneNumber: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Format phone number for API request
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      const response = await this.makeApiRequest(`/subscribers/search?phone=${formattedPhone}`);
      
      if (!response.data || !response.data.subscriber) {
        return {
          success: false,
          message: `No subscriber found with phone number ${phoneNumber}`
        };
      }
      
      return {
        success: true,
        data: response.data.subscriber,
        message: `Successfully found subscriber with phone ${phoneNumber}`
      };
    } catch (error) {
      console.error('Error searching Postscript subscriber:', error);
      return {
        success: false,
        error,
        message: `Failed to search for subscriber: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get campaign information
   */
  async getCampaigns(limit: number = 20, page: number = 1): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const response = await this.makeApiRequest(`/campaigns?limit=${limit}&page=${page}`);
      
      if (!response.data || !response.data.campaigns) {
        return {
          success: false,
          message: 'No campaign data found'
        };
      }
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved ${response.data.campaigns.length} campaigns`
      };
    } catch (error) {
      console.error('Error fetching Postscript campaigns:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve campaigns: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get specific campaign details
   */
  async getCampaignDetails(campaignId: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const response = await this.makeApiRequest(`/campaigns/${campaignId}`);
      
      if (!response.data || !response.data.campaign) {
        return {
          success: false,
          message: `No campaign found with ID ${campaignId}`
        };
      }
      
      return {
        success: true,
        data: response.data.campaign,
        message: `Successfully retrieved details for campaign ${campaignId}`
      };
    } catch (error) {
      console.error('Error fetching Postscript campaign details:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve campaign details: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get analytics for the account
   */
  async getAnalytics(period: string = '30d'): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Valid periods: 7d, 30d, 90d, 365d
      const validPeriods = ['7d', '30d', '90d', '365d'];
      const requestPeriod = validPeriods.includes(period) ? period : '30d';
      
      const response = await this.makeApiRequest(`/analytics?period=${requestPeriod}`);
      
      if (!response.data) {
        return {
          success: false,
          message: `No analytics data found for period ${requestPeriod}`
        };
      }
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved analytics for the last ${requestPeriod}`
      };
    } catch (error) {
      console.error('Error fetching Postscript analytics:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve analytics: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Send a transactional SMS message
   */
  async sendSms(phoneNumber: string, message: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Format phone number for API request
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      const data = {
        phone: formattedPhone,
        message: message,
        type: 'transactional'
      };
      
      const response = await this.makeApiRequest('/messages', 'POST', data);
      
      return {
        success: true,
        data: response.data,
        message: `Successfully sent SMS to ${phoneNumber}`
      };
    } catch (error) {
      console.error('Error sending Postscript SMS:', error);
      return {
        success: false,
        error,
        message: `Failed to send SMS: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Create a new SMS campaign
   */
  async createCampaign(name: string, message: string, audienceId?: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const data: any = {
        name,
        message
      };
      
      if (audienceId) {
        data.audience_id = audienceId;
      }
      
      const response = await this.makeApiRequest('/campaigns', 'POST', data);
      
      return {
        success: true,
        data: response.data,
        message: `Successfully created SMS campaign: ${name}`
      };
    } catch (error) {
      console.error('Error creating Postscript campaign:', error);
      return {
        success: false,
        error,
        message: `Failed to create campaign: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get all audiences
   */
  async getAudiences(limit: number = 20, page: number = 1): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const response = await this.makeApiRequest(`/audiences?limit=${limit}&page=${page}`);
      
      if (!response.data || !response.data.audiences) {
        return {
          success: false,
          message: 'No audience data found'
        };
      }
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved ${response.data.audiences.length} audiences`
      };
    } catch (error) {
      console.error('Error fetching Postscript audiences:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve audiences: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Generate a performance summary using OpenAI
   */
  async getPerformanceSummary(): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Get analytics data
      const analyticsResult = await this.getAnalytics('30d');
      
      // Get campaign data
      const campaignsResult = await this.getCampaigns(10, 1);
      
      // If OpenAI is not available, return raw data
      if (!this.openai) {
        return {
          success: true,
          data: {
            analytics: analyticsResult.data,
            campaigns: campaignsResult.data
          },
          message: 'Retrieved performance data (OpenAI summarization not available)'
        };
      }
      
      // Prepare data for OpenAI
      const performanceData = {
        analytics: analyticsResult.data,
        campaigns: campaignsResult.data
      };
      
      // Generate a summary using OpenAI
      const prompt = `
        Analyze this SMS marketing performance data from Postscript and provide a concise summary:
        ${JSON.stringify(performanceData, null, 2)}
        
        Focus on:
        1. Overall performance metrics (CTR, conversion rate, revenue)
        2. Top performing campaigns
        3. Growth in subscriber count
        4. Areas for improvement
        5. Actionable recommendations for SMS marketing strategy
        
        Format your response as a structured report with sections.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });
      
      const summary = response.choices[0].message.content;
      
      return {
        success: true,
        data: {
          summary,
          raw: performanceData
        },
        message: 'Generated performance summary from Postscript data'
      };
    } catch (error) {
      console.error('Error generating Postscript performance summary:', error);
      return {
        success: false,
        error,
        message: `Failed to generate performance summary: ${error.message || 'Unknown error'}`
      };
    }
  }
}

// Create a singleton instance
export const postscriptMcp = new PostscriptMcpClient();