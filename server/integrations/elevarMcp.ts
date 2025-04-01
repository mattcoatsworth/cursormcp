import OpenAI from "openai";
import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import { storage } from "../storage";

/**
 * Elevar MCP Client implementation
 * Provides integration with the Elevar analytics platform
 */
export class ElevarMcpClient extends BaseMcpClient {
  private apiKey: string | null = null;
  private shopId: string | null = null;
  private apiUrl: string = "https://api.getelevar.com/v1";

  constructor() {
    super("elevar");
  }

  /**
   * Extract credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    return {
      apiKey: connectionCredentials.apiKey || null,
      shopId: connectionCredentials.shopId || null
    };
  }

  /**
   * Initialize the Elevar client
   */
  protected async serviceInitialize(): Promise<void> {
    this.apiKey = this.credentials.apiKey || null;
    this.shopId = this.credentials.shopId || null;

    if (!this.apiKey || !this.shopId) {
      throw new Error("Elevar API key and shop ID are required");
    }
    
    // Basic validation
    try {
      // Attempt to get shop info to verify credentials
      await this.getShopInfo();
      console.log("Elevar API connection verified successfully");
    } catch (error) {
      console.error("Failed to initialize Elevar API:", error);
      throw new Error("Failed to connect to Elevar API. Please check your credentials.");
    }
  }

  /**
   * Get shop information to verify API connection
   */
  async getShopInfo(): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/shops/${this.shopId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get shop info: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: "Successfully retrieved shop information",
        data
      };
    } catch (error: any) {
      console.error("Error getting Elevar shop info:", error);
      return {
        success: false,
        message: `Failed to retrieve shop information: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get tracking issues for a given period
   */
  async getTrackingIssues(
    days: number = 7, 
    severity: string = "all"
  ): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let url = `${this.apiUrl}/tracking/issues?shop_id=${this.shopId}&start_date=${startDate}&end_date=${endDate}`;
      
      if (severity !== "all") {
        url += `&severity=${severity}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get tracking issues: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved tracking issues for the last ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Elevar tracking issues:", error);
      return {
        success: false,
        message: `Failed to retrieve tracking issues: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get analytics overview for a given period
   */
  async getAnalyticsOverview(days: number = 30): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(`${this.apiUrl}/analytics/overview?shop_id=${this.shopId}&start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get analytics overview: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved analytics overview for the last ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Elevar analytics overview:", error);
      return {
        success: false,
        message: `Failed to retrieve analytics overview: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get attribution data for a given period
   */
  async getAttribution(days: number = 30): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(`${this.apiUrl}/attribution?shop_id=${this.shopId}&start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get attribution data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved attribution data for the last ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Elevar attribution data:", error);
      return {
        success: false,
        message: `Failed to retrieve attribution data: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get data quality report
   */
  async getDataQualityReport(): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/monitoring/data-quality?shop_id=${this.shopId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get data quality report: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: "Successfully retrieved data quality report",
        data
      };
    } catch (error: any) {
      console.error("Error getting Elevar data quality report:", error);
      return {
        success: false,
        message: `Failed to retrieve data quality report: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(
    days: number = 30, 
    platform: string = "all"
  ): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let url = `${this.apiUrl}/campaigns/performance?shop_id=${this.shopId}&start_date=${startDate}&end_date=${endDate}`;
      
      if (platform !== "all") {
        url += `&platform=${platform}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get campaign performance: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved campaign performance for the last ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Elevar campaign performance:", error);
      return {
        success: false,
        message: `Failed to retrieve campaign performance: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get channel performance
   */
  async getChannelPerformance(days: number = 30): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(`${this.apiUrl}/channels/performance?shop_id=${this.shopId}&start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get channel performance: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved channel performance for the last ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Elevar channel performance:", error);
      return {
        success: false,
        message: `Failed to retrieve channel performance: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(days: number = 30): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(`${this.apiUrl}/analytics/funnel?shop_id=${this.shopId}&start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get conversion funnel: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved conversion funnel for the last ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Elevar conversion funnel:", error);
      return {
        success: false,
        message: `Failed to retrieve conversion funnel: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get complete summary of Elevar metrics and insights
   */
  async getPerformanceSummary(): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // Get shop info
      const shopResult = await this.getShopInfo();
      if (!shopResult.success) {
        throw new Error("Failed to get shop information");
      }

      // Get analytics overview
      const analyticsResult = await this.getAnalyticsOverview(30);
      if (!analyticsResult.success) {
        throw new Error("Failed to get analytics overview");
      }

      // Get attribution data
      const attributionResult = await this.getAttribution(30);
      if (!attributionResult.success) {
        throw new Error("Failed to get attribution data");
      }

      // Get channel performance
      const channelResult = await this.getChannelPerformance(30);
      if (!channelResult.success) {
        throw new Error("Failed to get channel performance");
      }

      // Get tracking issues
      const issuesResult = await this.getTrackingIssues(7, "high");
      if (!issuesResult.success) {
        throw new Error("Failed to get tracking issues");
      }

      // Combine the data
      const summary = {
        shop: shopResult.data,
        analytics: analyticsResult.data,
        attribution: attributionResult.data,
        channels: channelResult.data,
        issues: issuesResult.data
      };

      // Generate a text summary using OpenAI if available
      let summaryText = "Elevar Analytics Summary";
      
      if (this.openai) {
        try {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: "You are an analytics expert who specializes in e-commerce tracking, attribution, and marketing analytics. Summarize the provided Elevar data concisely."
              },
              {
                role: "user",
                content: `Summarize this Elevar analytics data in 3-5 bullet points, focusing on the most important insights about channel performance, attribution, tracking issues and overall performance metrics:\n${JSON.stringify(summary)}`
              }
            ],
            max_tokens: 300,
          });
          
          summaryText = response.choices[0].message.content || summaryText;
        } catch (aiError) {
          console.warn("Failed to generate AI summary for Elevar data:", aiError);
          // Fall back to basic summary
          summaryText = `Elevar Summary for ${shopResult.data.name || "Your Store"}: Revenue: ${analyticsResult.data.total_revenue || "N/A"}, Conversion rate: ${analyticsResult.data.conversion_rate || "N/A"}%. ${issuesResult.data.issues?.length || 0} high-severity tracking issues.`;
        }
      }
      
      return {
        success: true,
        message: summaryText,
        data: summary
      };
    } catch (error: any) {
      console.error("Error getting Elevar summary:", error);
      return {
        success: false,
        message: `Failed to retrieve summary: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }
}