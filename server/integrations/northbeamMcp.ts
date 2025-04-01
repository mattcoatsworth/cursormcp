import axios from 'axios';
import OpenAI from 'openai';
import { BaseMcpClient, McpCommandResult, McpCredentials } from './baseMcp';

interface NorthbeamApiResponse {
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Northbeam MCP client implementation
 */
export class NorthbeamMcpClient extends BaseMcpClient {
  private apiKey: string = '';
  private accountId: string = '';
  private baseUrl: string = 'https://api.northbeam.io/v1';
  
  constructor() {
    super('northbeam');
  }
  
  /**
   * Extract credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    if (!connectionCredentials.apiKey) {
      throw new Error('Northbeam API Key is required');
    }
    
    if (!connectionCredentials.accountId) {
      throw new Error('Northbeam Account ID is required');
    }
    
    this.apiKey = connectionCredentials.apiKey;
    this.accountId = connectionCredentials.accountId;
    
    return {
      apiKey: this.apiKey,
      accountId: this.accountId
    };
  }
  
  /**
   * Initialize the Northbeam client
   */
  protected async serviceInitialize(): Promise<void> {
    try {
      // Verify API credentials by making a test request
      await this.makeApiRequest('/account');
      console.log('Northbeam API connection verified');
    } catch (error: any) {
      console.error('Failed to initialize Northbeam client:', error);
      throw new Error('Failed to connect to Northbeam API. Please check your credentials.');
    }
  }
  
  /**
   * Make an API request to Northbeam
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
        'X-API-KEY': this.apiKey,
        'X-ACCOUNT-ID': this.accountId
      };
      
      const response = await axios({
        method,
        url,
        headers,
        data
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Northbeam API request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Get performance metrics for a specific date range
   */
  async getPerformance(startDate: string, endDate: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const response = await this.makeApiRequest(`/metrics/performance?start_date=${startDate}&end_date=${endDate}`);
      
      if (!response.data) {
        return {
          success: false,
          message: `No performance data found for the period ${startDate} to ${endDate}`
        };
      }
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved performance data from ${startDate} to ${endDate}`
      };
    } catch (error: any) {
      console.error('Error fetching Northbeam performance:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve performance data: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get channel metrics for a specific date range
   */
  async getChannelMetrics(startDate: string, endDate: string, channel?: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      let endpoint = `/metrics/channels?start_date=${startDate}&end_date=${endDate}`;
      if (channel) {
        endpoint += `&channel=${encodeURIComponent(channel)}`;
      }
      
      const response = await this.makeApiRequest(endpoint);
      
      if (!response.data) {
        return {
          success: false,
          message: `No channel metrics found for the period ${startDate} to ${endDate}`
        };
      }
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved channel metrics${channel ? ` for ${channel}` : ''} from ${startDate} to ${endDate}`
      };
    } catch (error: any) {
      console.error('Error fetching Northbeam channel metrics:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve channel metrics: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get campaign metrics for a specific date range
   */
  async getCampaignMetrics(startDate: string, endDate: string, platform?: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      let endpoint = `/metrics/campaigns?start_date=${startDate}&end_date=${endDate}`;
      if (platform) {
        endpoint += `&platform=${encodeURIComponent(platform)}`;
      }
      
      const response = await this.makeApiRequest(endpoint);
      
      if (!response.data) {
        return {
          success: false,
          message: `No campaign metrics found for the period ${startDate} to ${endDate}`
        };
      }
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved campaign metrics${platform ? ` for ${platform}` : ''} from ${startDate} to ${endDate}`
      };
    } catch (error: any) {
      console.error('Error fetching Northbeam campaign metrics:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve campaign metrics: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get attribution data for a specific date range
   */
  async getAttribution(startDate: string, endDate: string, model: string = 'default'): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const response = await this.makeApiRequest(`/attribution?start_date=${startDate}&end_date=${endDate}&model=${model}`);
      
      if (!response.data) {
        return {
          success: false,
          message: `No attribution data found for the period ${startDate} to ${endDate}`
        };
      }
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved attribution data for model ${model} from ${startDate} to ${endDate}`
      };
    } catch (error: any) {
      console.error('Error fetching Northbeam attribution:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve attribution data: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get ROAS (Return on Ad Spend) data for a specific date range
   */
  async getRoas(startDate: string, endDate: string, channel?: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      let endpoint = `/metrics/roas?start_date=${startDate}&end_date=${endDate}`;
      if (channel) {
        endpoint += `&channel=${encodeURIComponent(channel)}`;
      }
      
      const response = await this.makeApiRequest(endpoint);
      
      if (!response.data) {
        return {
          success: false,
          message: `No ROAS data found for the period ${startDate} to ${endDate}`
        };
      }
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved ROAS data${channel ? ` for ${channel}` : ''} from ${startDate} to ${endDate}`
      };
    } catch (error: any) {
      console.error('Error fetching Northbeam ROAS:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve ROAS data: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Generate a performance summary using OpenAI
   */
  async getPerformanceSummary(days: number = 30): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Calculate date range
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Get performance metrics
      const performanceResult = await this.getPerformance(startDate, endDate);
      
      // Get channel metrics
      const channelResult = await this.getChannelMetrics(startDate, endDate);
      
      // Get ROAS data
      const roasResult = await this.getRoas(startDate, endDate);
      
      // If OpenAI is not available, return raw data
      if (!this.openai) {
        return {
          success: true,
          data: {
            performance: performanceResult.data,
            channels: channelResult.data,
            roas: roasResult.data
          },
          message: `Retrieved performance data for the last ${days} days (OpenAI summarization not available)`
        };
      }
      
      // Prepare data for OpenAI
      const performanceData = {
        performance: performanceResult.data,
        channels: channelResult.data,
        roas: roasResult.data,
        dateRange: {
          startDate,
          endDate,
          days
        }
      };
      
      // Generate a summary using OpenAI
      const prompt = `
        Analyze this marketing performance data from Northbeam and provide a concise summary:
        ${JSON.stringify(performanceData, null, 2)}
        
        Focus on:
        1. Overall performance trends over the ${days}-day period
        2. Top performing channels and campaigns
        3. ROI and ROAS analysis
        4. Areas of concern or opportunity
        5. Actionable recommendations for marketing strategy
        
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
        message: `Generated performance summary for the last ${days} days`
      };
    } catch (error: any) {
      console.error('Error generating Northbeam performance summary:', error);
      return {
        success: false,
        error,
        message: `Failed to generate performance summary: ${error.message || 'Unknown error'}`
      };
    }
  }
}

// Create a singleton instance
export const northbeamMcp = new NorthbeamMcpClient();