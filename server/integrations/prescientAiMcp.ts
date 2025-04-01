import OpenAI from "openai";
import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import { storage } from "../storage";

/**
 * Prescient AI MCP Client implementation
 * Provides integration with the Prescient AI predictive analytics platform
 */
export class PrescientAiMcpClient extends BaseMcpClient {
  private apiKey: string | null = null;
  private accountId: string | null = null;
  private apiUrl: string = "https://api.prescientai.io/v1";

  constructor() {
    super("prescientai");
  }

  /**
   * Extract credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    return {
      apiKey: connectionCredentials.apiKey || null,
      accountId: connectionCredentials.accountId || null
    };
  }

  /**
   * Initialize the Prescient AI client
   */
  protected async serviceInitialize(): Promise<void> {
    this.apiKey = this.credentials.apiKey || null;
    this.accountId = this.credentials.accountId || null;

    if (!this.apiKey || !this.accountId) {
      throw new Error("Prescient AI API key and account ID are required");
    }
    
    // Basic validation
    try {
      // Attempt to get account info to verify credentials
      await this.getAccountInfo();
      console.log("Prescient AI API connection verified successfully");
    } catch (error) {
      console.error("Failed to initialize Prescient AI API:", error);
      throw new Error("Failed to connect to Prescient AI API. Please check your credentials.");
    }
  }

  /**
   * Get account information to verify API connection
   */
  async getAccountInfo(): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/accounts/${this.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get account info: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: "Successfully retrieved account information",
        data
      };
    } catch (error: any) {
      console.error("Error getting Prescient AI account info:", error);
      return {
        success: false,
        message: `Failed to retrieve account information: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get predictive models
   */
  async getModels(limit: number = 10): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/models?account_id=${this.accountId}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved ${data.models?.length || 0} predictive models`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Prescient AI models:", error);
      return {
        success: false,
        message: `Failed to retrieve models: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get product forecasts
   */
  async getProductForecasts(
    days: number = 30, 
    topN: number = 10
  ): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/forecasts/products?account_id=${this.accountId}&days=${days}&top=${topN}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get product forecasts: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved product forecasts for the next ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Prescient AI product forecasts:", error);
      return {
        success: false,
        message: `Failed to retrieve product forecasts: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get revenue forecast
   */
  async getRevenueForecasts(days: number = 90): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/forecasts/revenue?account_id=${this.accountId}&days=${days}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get revenue forecast: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved revenue forecast for the next ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Prescient AI revenue forecast:", error);
      return {
        success: false,
        message: `Failed to retrieve revenue forecast: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get inventory recommendations
   */
  async getInventoryRecommendations(): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/recommendations/inventory?account_id=${this.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get inventory recommendations: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: "Successfully retrieved inventory recommendations",
        data
      };
    } catch (error: any) {
      console.error("Error getting Prescient AI inventory recommendations:", error);
      return {
        success: false,
        message: `Failed to retrieve inventory recommendations: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get pricing recommendations
   */
  async getPricingRecommendations(topN: number = 10): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/recommendations/pricing?account_id=${this.accountId}&top=${topN}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get pricing recommendations: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved top ${topN} pricing recommendations`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Prescient AI pricing recommendations:", error);
      return {
        success: false,
        message: `Failed to retrieve pricing recommendations: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get anomaly detection
   */
  async getAnomalyDetection(days: number = 30): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/anomalies?account_id=${this.accountId}&days=${days}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get anomalies: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved anomalies for the last ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Prescient AI anomalies:", error);
      return {
        success: false,
        message: `Failed to retrieve anomalies: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get product details and forecasts
   */
  async getProductDetails(productId: string): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/products/${productId}?account_id=${this.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get product details: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: "Successfully retrieved product details and forecasts",
        data
      };
    } catch (error: any) {
      console.error("Error getting Prescient AI product details:", error);
      return {
        success: false,
        message: `Failed to retrieve product details: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get complete summary of Prescient AI insights
   */
  async getPerformanceSummary(): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // Get account info
      const accountResult = await this.getAccountInfo();
      if (!accountResult.success) {
        throw new Error("Failed to get account information");
      }

      // Get product forecasts
      const productForecastsResult = await this.getProductForecasts(30, 5);
      if (!productForecastsResult.success) {
        throw new Error("Failed to get product forecasts");
      }

      // Get revenue forecast
      const revenueForecastResult = await this.getRevenueForecasts(90);
      if (!revenueForecastResult.success) {
        throw new Error("Failed to get revenue forecast");
      }

      // Get inventory recommendations
      const inventoryRecsResult = await this.getInventoryRecommendations();
      if (!inventoryRecsResult.success) {
        throw new Error("Failed to get inventory recommendations");
      }

      // Get anomalies
      const anomaliesResult = await this.getAnomalyDetection(30);
      if (!anomaliesResult.success) {
        throw new Error("Failed to get anomalies");
      }

      // Combine the data
      const summary = {
        account: accountResult.data,
        productForecasts: productForecastsResult.data,
        revenueForecast: revenueForecastResult.data,
        inventoryRecommendations: inventoryRecsResult.data,
        anomalies: anomaliesResult.data
      };

      // Generate a text summary using OpenAI if available
      let summaryText = "Prescient AI Predictive Analytics Summary";
      
      if (this.openai) {
        try {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: "You are an analytics expert who specializes in e-commerce predictive analytics and forecasting. Summarize the provided Prescient AI data concisely."
              },
              {
                role: "user",
                content: `Summarize this Prescient AI predictive analytics data in 3-5 bullet points, focusing on the most important insights about future revenue, top products, inventory needs, and any anomalies:\n${JSON.stringify(summary)}`
              }
            ],
            max_tokens: 300,
          });
          
          summaryText = response.choices[0].message.content || summaryText;
        } catch (aiError) {
          console.warn("Failed to generate AI summary for Prescient AI data:", aiError);
          // Fall back to basic summary
          summaryText = `Prescient AI Summary for ${accountResult.data.name || "Your Store"}: ${revenueForecastResult.data.forecast?.total || "N/A"} forecasted revenue for next 90 days. ${anomaliesResult.data.anomalies?.length || 0} anomalies detected.`;
        }
      }
      
      return {
        success: true,
        message: summaryText,
        data: summary
      };
    } catch (error: any) {
      console.error("Error getting Prescient AI summary:", error);
      return {
        success: false,
        message: `Failed to retrieve summary: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }
}