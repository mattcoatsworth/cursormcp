import OpenAI from "openai";
import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import { storage } from "../storage";

/**
 * Recharm MCP Client implementation
 * Provides integration with the Recharm retention platform
 */
export class RecharmMcpClient extends BaseMcpClient {
  private apiKey: string | null = null;
  private apiUrl: string = "https://api.recharm.com/v1";

  constructor() {
    super("recharm");
  }

  /**
   * Extract credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    return {
      apiKey: connectionCredentials.apiKey || null
    };
  }

  /**
   * Initialize the Recharm client
   */
  protected async serviceInitialize(): Promise<void> {
    this.apiKey = this.credentials.apiKey || null;

    if (!this.apiKey) {
      throw new Error("Recharm API key is required");
    }
    
    // Basic validation
    try {
      // Attempt to get store info to verify credentials
      await this.getStoreInfo();
      console.log("Recharm API connection verified successfully");
    } catch (error) {
      console.error("Failed to initialize Recharm API:", error);
      throw new Error("Failed to connect to Recharm API. Please check your credentials.");
    }
  }

  /**
   * Get store information to verify API connection
   */
  async getStoreInfo(): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/store`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get store info: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: "Successfully retrieved store information",
        data
      };
    } catch (error: any) {
      console.error("Error getting Recharm store info:", error);
      return {
        success: false,
        message: `Failed to retrieve store information: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get campaign data
   */
  async getCampaigns(limit: number = 20, offset: number = 0): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/campaigns?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get campaigns: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved ${data.campaigns?.length || 0} campaigns`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Recharm campaigns:", error);
      return {
        success: false,
        message: `Failed to retrieve campaigns: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(id: string): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/campaigns/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get campaign: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: "Successfully retrieved campaign",
        data
      };
    } catch (error: any) {
      console.error("Error getting Recharm campaign:", error);
      return {
        success: false,
        message: `Failed to retrieve campaign: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get abandonment stats for a specific period
   */
  async getAbandonmentStats(days: number = 30): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(`${this.apiUrl}/analytics/abandonment?start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get abandonment stats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved abandonment stats for last ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Recharm abandonment stats:", error);
      return {
        success: false,
        message: `Failed to retrieve abandonment stats: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get recovery stats
   */
  async getRecoveryStats(days: number = 30): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(`${this.apiUrl}/analytics/recovery?start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get recovery stats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved recovery stats for last ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Recharm recovery stats:", error);
      return {
        success: false,
        message: `Failed to retrieve recovery stats: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get customer data by email
   */
  async getCustomer(email: string): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/customers?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get customer: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: "Successfully retrieved customer information",
        data
      };
    } catch (error: any) {
      console.error("Error getting Recharm customer:", error);
      return {
        success: false,
        message: `Failed to retrieve customer: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get abandoned carts
   */
  async getAbandonedCarts(limit: number = 10, page: number = 1): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/abandoned-carts?limit=${limit}&page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get abandoned carts: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved ${data.carts?.length || 0} abandoned carts`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Recharm abandoned carts:", error);
      return {
        success: false,
        message: `Failed to retrieve abandoned carts: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Create a recovery campaign
   */
  async createCampaign(
    name: string, 
    type: string, 
    message: string, 
    triggerDelay: number = 60
  ): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const campaignData = {
        name,
        type, // 'email', 'sms', etc.
        message,
        trigger_delay_minutes: triggerDelay,
        active: true
      };

      const response = await fetch(`${this.apiUrl}/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create campaign: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: "Successfully created recovery campaign",
        data
      };
    } catch (error: any) {
      console.error("Error creating Recharm campaign:", error);
      return {
        success: false,
        message: `Failed to create campaign: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get revenue impact over time
   */
  async getRevenueImpact(days: number = 30): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(`${this.apiUrl}/analytics/revenue-impact?start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get revenue impact: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved revenue impact for last ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Recharm revenue impact:", error);
      return {
        success: false,
        message: `Failed to retrieve revenue impact: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get complete summary of Recharm performance
   */
  async getPerformanceSummary(): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // Get store info
      const storeResult = await this.getStoreInfo();
      if (!storeResult.success) {
        throw new Error("Failed to get store information");
      }

      // Get abandonment stats for last 30 days
      const abandonmentResult = await this.getAbandonmentStats(30);
      if (!abandonmentResult.success) {
        throw new Error("Failed to get abandonment stats");
      }

      // Get recovery stats for last 30 days
      const recoveryResult = await this.getRecoveryStats(30);
      if (!recoveryResult.success) {
        throw new Error("Failed to get recovery stats");
      }

      // Get revenue impact
      const revenueResult = await this.getRevenueImpact(30);
      if (!revenueResult.success) {
        throw new Error("Failed to get revenue impact");
      }

      // Combine the data
      const summary = {
        store: storeResult.data,
        abandonment: abandonmentResult.data,
        recovery: recoveryResult.data,
        revenueImpact: revenueResult.data
      };

      // Generate a text summary using OpenAI if available
      let summaryText = "Recharm Performance Summary";
      
      if (this.openai) {
        try {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: "You are an analytics expert who specializes in e-commerce cart abandonment and recovery metrics. Summarize the provided Recharm data concisely."
              },
              {
                role: "user",
                content: `Summarize this Recharm cart recovery data in 3-4 bullet points, focusing on the most important metrics and insights:\n${JSON.stringify(summary)}`
              }
            ],
            max_tokens: 300,
          });
          
          summaryText = response.choices[0].message.content || summaryText;
        } catch (aiError) {
          console.warn("Failed to generate AI summary for Recharm data:", aiError);
          // Fall back to basic summary
          summaryText = `Recharm Summary for ${storeResult.data.store_name || "Your Store"}: Recovery rate: ${recoveryResult.data.recovery_rate || "N/A"}%, Revenue impact: ${revenueResult.data.total_recovered_revenue || "N/A"}`;
        }
      }
      
      return {
        success: true,
        message: summaryText,
        data: summary
      };
    } catch (error: any) {
      console.error("Error getting Recharm summary:", error);
      return {
        success: false,
        message: `Failed to retrieve summary: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }
}