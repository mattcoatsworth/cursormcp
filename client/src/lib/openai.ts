import { apiRequest } from "./queryClient";

/**
 * Process a command through the server-side OpenAI integration
 */
export async function processCommand(command: string): Promise<any> {
  const response = await apiRequest('POST', '/api/messages', {
    role: 'user',
    content: command,
    metadata: {}
  });
  return response.json();
}

/**
 * Get command suggestions based on current context
 */
export async function getCommandSuggestions(): Promise<string[]> {
  return [
    "Get sales data from Shopify for the last 7 days",
    "Create a new email campaign in Klaviyo",
    "Send a message to #marketing channel in Slack",
    "Update inventory for product SKU-12345",
    "Create a new Notion page with today's sales summary",
    "Generate a report of top-selling products this month",
    "Show me conversion rates from Northbeam"
  ];
}
