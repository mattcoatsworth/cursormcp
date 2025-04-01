import OpenAI from "openai";
import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import { storage } from "../storage";

/**
 * Gorgias MCP Client implementation
 * Provides integration with the Gorgias helpdesk system
 */
export class GorgiasMcpClient extends BaseMcpClient {
  private apiKey: string | null = null;
  private subdomain: string | null = null;
  private apiUrl: string | null = null;

  constructor() {
    super("gorgias");
  }

  /**
   * Extract credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    return {
      apiKey: connectionCredentials.apiKey || null,
      subdomain: connectionCredentials.subdomain || null
    };
  }

  /**
   * Initialize the Gorgias client
   */
  protected async serviceInitialize(): Promise<void> {
    this.apiKey = this.credentials.apiKey || null;
    this.subdomain = this.credentials.subdomain || null;

    if (!this.apiKey || !this.subdomain) {
      throw new Error("Gorgias API key and subdomain are required");
    }

    this.apiUrl = `https://${this.subdomain}.gorgias.com/api`;
    
    // Basic validation
    try {
      // Attempt to get account info to verify credentials
      await this.getAccountInfo();
      console.log("Gorgias API connection verified successfully");
    } catch (error) {
      console.error("Failed to initialize Gorgias API:", error);
      throw new Error("Failed to connect to Gorgias API. Please check your credentials.");
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

      const response = await fetch(`${this.apiUrl}/account`, {
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
      console.error("Error getting Gorgias account info:", error);
      return {
        success: false,
        message: `Failed to retrieve account information: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get tickets from Gorgias
   */
  async getTickets(limit: number = 20, offset: number = 0, status?: string): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      let url = `${this.apiUrl}/tickets?limit=${limit}&offset=${offset}`;
      
      // Add status filter if provided
      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get tickets: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved ${data.count || 0} tickets`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Gorgias tickets:", error);
      return {
        success: false,
        message: `Failed to retrieve tickets: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get a single ticket by ID
   */
  async getTicket(id: string): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await fetch(`${this.apiUrl}/tickets/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get ticket: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: "Successfully retrieved ticket",
        data
      };
    } catch (error: any) {
      console.error("Error getting Gorgias ticket:", error);
      return {
        success: false,
        message: `Failed to retrieve ticket: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Create a new ticket
   */
  async createTicket(
    subject: string, 
    message: string, 
    customerEmail: string, 
    priority?: string
  ): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const ticketData = {
        subject,
        messages: [
          {
            channel: "email",
            from_email: customerEmail,
            body_text: message
          }
        ],
        customer: {
          email: customerEmail
        },
        priority: priority || "normal"
      };

      const response = await fetch(`${this.apiUrl}/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create ticket: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: "Successfully created ticket",
        data
      };
    } catch (error: any) {
      console.error("Error creating Gorgias ticket:", error);
      return {
        success: false,
        message: `Failed to create ticket: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get customer information
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
      console.error("Error getting Gorgias customer:", error);
      return {
        success: false,
        message: `Failed to retrieve customer: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId: string, status: string): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const updateData = {
        status
      };

      const response = await fetch(`${this.apiUrl}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update ticket: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully updated ticket status to ${status}`,
        data
      };
    } catch (error: any) {
      console.error("Error updating Gorgias ticket:", error);
      return {
        success: false,
        message: `Failed to update ticket: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(days: number = 30): Promise<McpCommandResult> {
    try {
      // Check if not initialized
      if (!this.initialized) {
        await this.initialize();
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(`${this.apiUrl}/analytics/satisfaction?start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get metrics: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully retrieved performance metrics for last ${days} days`,
        data
      };
    } catch (error: any) {
      console.error("Error getting Gorgias metrics:", error);
      return {
        success: false,
        message: `Failed to retrieve metrics: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Get summary of current helpdesk status
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

      // Get open tickets
      const openTicketsResult = await this.getTickets(5, 0, "open");
      if (!openTicketsResult.success) {
        throw new Error("Failed to get open tickets");
      }

      // Get performance metrics
      const metricsResult = await this.getPerformanceMetrics(7);
      if (!metricsResult.success) {
        throw new Error("Failed to get performance metrics");
      }

      // Combine the data
      const summary = {
        account: accountResult.data,
        openTickets: openTicketsResult.data,
        metrics: metricsResult.data
      };

      // Generate a text summary using OpenAI if available
      let summaryText = "Gorgias Helpdesk Summary";
      
      if (this.openai) {
        try {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: "You are an analytics expert who specializes in customer support metrics. Summarize the provided Gorgias helpdesk data concisely."
              },
              {
                role: "user",
                content: `Summarize this Gorgias helpdesk data in 3-4 bullet points, focusing on the most important insights:\n${JSON.stringify(summary)}`
              }
            ],
            max_tokens: 300,
          });
          
          summaryText = response.choices[0].message.content || summaryText;
        } catch (aiError) {
          console.warn("Failed to generate AI summary for Gorgias data:", aiError);
          // Fall back to basic summary
          summaryText = `Gorgias Summary: ${openTicketsResult.data.count || 0} open tickets. Account: ${accountResult.data.name || "Unknown"}`;
        }
      }
      
      return {
        success: true,
        message: summaryText,
        data: summary
      };
    } catch (error: any) {
      console.error("Error getting Gorgias summary:", error);
      return {
        success: false,
        message: `Failed to retrieve summary: ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error"
      };
    }
  }
}