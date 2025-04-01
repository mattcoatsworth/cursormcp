import { apiRequest } from "./queryClient";
import { type ChatMessage, type ApiConnection, type CommandHistoryEntry } from "@shared/schema";

/**
 * Get all messages from the chat history
 */
export async function getMessages(limit?: number): Promise<ChatMessage[]> {
  const url = limit ? `/api/messages?limit=${limit}` : '/api/messages';
  const response = await apiRequest('GET', url);
  return response.json();
}

/**
 * Send a new message to the chat
 */
export async function sendMessage(content: string): Promise<ChatMessage> {
  const response = await apiRequest('POST', '/api/messages', {
    role: 'user',
    content,
    metadata: {}
  });
  return response.json();
}

/**
 * Get all API connections
 */
export async function getApiConnections(): Promise<ApiConnection[]> {
  const response = await apiRequest('GET', '/api/api-connections');
  return response.json();
}

/**
 * Toggle the connection status of an API
 */
export async function toggleApiConnection(id: number, isConnected: boolean): Promise<ApiConnection> {
  const response = await apiRequest('PUT', `/api/api-connections/${id}`, { isConnected });
  return response.json();
}

/**
 * Get command history
 */
export async function getCommandHistory(limit?: number): Promise<CommandHistoryEntry[]> {
  const url = limit ? `/api/commands?limit=${limit}` : '/api/commands';
  const response = await apiRequest('GET', url);
  return response.json();
}
