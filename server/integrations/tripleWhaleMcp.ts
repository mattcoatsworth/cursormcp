import axios from 'axios';
import OpenAI from 'openai';
import { BaseMcpClient, McpCommandResult, McpCredentials } from './baseMcp';

interface TripleWhaleApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Triple Whale MCP client implementation
 */
export class TripleWhaleMcpClient extends BaseMcpClient {
  private apiKey: string = '';
  private pixelId: string = '';
  private baseUrl: string = 'https://api.triplewhale.com/v2';
  
  constructor() {
    super('triplewhale');
  }
  
  /**
   * Extract credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    if (!connectionCredentials.apiKey) {
      throw new Error('Triple Whale API Key is required');
    }
    
    this.apiKey = connectionCredentials.apiKey;
    this.pixelId = connectionCredentials.pixelId || '';
    
    return {
      apiKey: this.apiKey,
      pixelId: this.pixelId
    };
  }
  
  /**
   * Initialize the Triple Whale client
   */
  protected async serviceInitialize(): Promise<void> {
    try {
      // Verify API credentials by making a test request
      await this.makeApiRequest('/account/info');
      console.log('Triple Whale API connection verified');
    } catch (error) {
      console.error('Failed to initialize Triple Whale client:', error);
      throw new Error('Failed to connect to Triple Whale API. Please check your credentials.');
    }
  }
  
  /**
   * Make an API request to Triple Whale
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
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-KEY': this.apiKey
      };
      
      const response = await axios({
        method,
        url,
        headers,
        data
      });
      
      return response.data;
    } catch (error) {
      console.error(`Triple Whale API request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Get sales data for a specific period
   */
  async getSales(period: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Define the time range based on the period
      // Get the current date
      const now = new Date();
      
      // Create a new date object for today
      const today = new Date();
      today.setHours(0, 1, 0, 0);
      
      // Create a new date object for yesterday
      const yesterdayStart = new Date();
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      yesterdayStart.setHours(0, 1, 0, 0);
      
      const yesterdayEnd = new Date();
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
      yesterdayEnd.setHours(23, 59, 59, 999);
      
      // Create a new date object for the start of the week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 1, 0, 0);
      
      // Create a new date object for the start of the month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 1, 0, 0);
      
      const timeRanges: Record<string, { from: Date, to: Date }> = {
        today: {
          from: today,
          to: now
        },
        yesterday: {
          from: yesterdayStart,
          to: yesterdayEnd
        },
        week: {
          from: weekStart,
          to: now
        },
        month: {
          from: monthStart,
          to: now
        }
      };
      
      const range = timeRanges[period.toLowerCase()] || timeRanges.today;
      
      // Format dates for API request
      const from = range.from.toISOString().split('T')[0];
      const to = range.to.toISOString().split('T')[0];
      
      // Fetch sales data
      const response = await this.makeApiRequest(`/analytics/sales?from=${from}&to=${to}`);
      
      if (!response.data) {
        return {
          success: false,
          message: `No sales data found for ${period}`
        };
      }
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved ${period} sales data from Triple Whale`
      };
    } catch (error: any) {
      console.error('Error fetching Triple Whale sales:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve sales data: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get attribution data
   */
  async getAttribution(source?: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const endpoint = source 
        ? `/attribution/sources/${source}`
        : '/attribution/overview';
      
      const response = await this.makeApiRequest(endpoint);
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved attribution data${source ? ` for ${source}` : ''}`
      };
    } catch (error: any) {
      console.error('Error fetching Triple Whale attribution:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve attribution data: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get campaign performance data
   */
  async getCampaigns(platform?: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const endpoint = platform 
        ? `/campaigns/${platform.toLowerCase()}`
        : '/campaigns';
      
      const response = await this.makeApiRequest(endpoint);
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved campaign data${platform ? ` for ${platform}` : ''}`
      };
    } catch (error) {
      console.error('Error fetching Triple Whale campaigns:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve campaign data: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get cohort analysis data
   */
  async getCohorts(period?: string): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Default to 30 days if not specified
      const days = period ? parseInt(period) : 30;
      
      const response = await this.makeApiRequest(`/cohorts/analysis?days=${days}`);
      
      return {
        success: true,
        data: response.data,
        message: `Successfully retrieved cohort analysis for the last ${days} days`
      };
    } catch (error) {
      console.error('Error fetching Triple Whale cohorts:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve cohort data: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Get customer lifetime value data
   */
  async getLtv(): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const response = await this.makeApiRequest('/customers/ltv');
      
      return {
        success: true,
        data: response.data,
        message: 'Successfully retrieved customer lifetime value data'
      };
    } catch (error) {
      console.error('Error fetching Triple Whale LTV:', error);
      return {
        success: false,
        error,
        message: `Failed to retrieve LTV data: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Generate a summary of store performance using OpenAI
   */
  async getPerformanceSummary(): Promise<McpCommandResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Get sales data for different periods
      const today = await this.getSales('today');
      const yesterday = await this.getSales('yesterday');
      const week = await this.getSales('week');
      const month = await this.getSales('month');
      
      // If OpenAI is not available, return raw data
      if (!this.openai) {
        return {
          success: true,
          data: {
            today: today.data,
            yesterday: yesterday.data,
            week: week.data,
            month: month.data
          },
          message: 'Retrieved performance data (OpenAI summarization not available)'
        };
      }
      
      // Prepare data for OpenAI
      const performanceData = {
        today: today.data,
        yesterday: yesterday.data,
        week: week.data,
        month: month.data
      };
      
      // Generate a summary using OpenAI
      const prompt = `
        Analyze this e-commerce performance data from Triple Whale and provide a concise summary:
        ${JSON.stringify(performanceData, null, 2)}
        
        Focus on:
        1. Today's performance compared to yesterday
        2. Weekly trends
        3. Monthly performance
        4. Key metrics to pay attention to
        5. Actionable insights for the business
        
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
        message: 'Generated performance summary from Triple Whale data'
      };
    } catch (error) {
      console.error('Error generating Triple Whale performance summary:', error);
      return {
        success: false,
        error,
        message: `Failed to generate performance summary: ${error.message || 'Unknown error'}`
      };
    }
  }
}

// Create a singleton instance
export const tripleWhaleMcp = new TripleWhaleMcpClient();