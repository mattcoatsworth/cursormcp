import { apiRequest } from '@/lib/queryClient';
import { type ApiConnection } from '@shared/schema';

/**
 * API client functions for interacting with API connection endpoints.
 * These functions handle direct API calls without using React Query.
 */

/**
 * Get the current mock mode status
 * @returns Whether mock mode is enabled
 */
export async function getMockModeStatus(): Promise<{
  enabled: boolean;
  success: boolean;
  message?: string;
}> {
  try {
    const response = await apiRequest('/api/mock-mode', 'GET');
    const data = await response.json();
    return {
      success: true,
      enabled: data.enabled
    };
  } catch (error) {
    console.error('Error getting mock mode status:', error);
    return {
      success: false,
      enabled: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Toggle mock mode on or off
 * @param enabled Whether to enable mock mode
 * @returns Success status and message
 */
export async function setMockMode(enabled: boolean): Promise<{
  success: boolean;
  enabled: boolean;
  message?: string;
}> {
  try {
    const response = await apiRequest('/api/mock-mode', 'POST', { enabled });
    const data = await response.json();
    return {
      success: true,
      enabled: data.enabled,
      message: data.message
    };
  } catch (error) {
    console.error('Error setting mock mode:', error);
    return {
      success: false,
      enabled: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Create or update an API connection without reloading the page
 * @param connectionData The API connection data to create or update
 * @returns The created or updated API connection
 */
export async function createApiConnection(connectionData: Partial<ApiConnection>): Promise<{
  success: boolean;
  data?: ApiConnection;
  message?: string;
  id?: string | number;
}> {
  try {
    // Use direct API request for better error handling
    const endpoint = connectionData.type?.toLowerCase() === 'openai' 
      ? '/api/connect/openai' // Special endpoint for OpenAI
      : '/api/api-connections';
    
    const payload = connectionData.type?.toLowerCase() === 'openai'
      ? (connectionData.credentials || {}) // For OpenAI, just send credentials
      : connectionData; // For other APIs, send the full connection data

    const response = await apiRequest(endpoint, 'POST', payload);
    
    // Parse the response - we need to check response as a generic object
    const responseData = response as Record<string, any>;
    
    if (responseData && (responseData.id || responseData.success)) {
      return {
        success: true,
        data: responseData as unknown as ApiConnection,
        id: responseData.id || '',
        message: 'Successfully connected to API'
      };
    } else {
      return {
        success: false,
        message: responseData?.message || 'Failed to connect to API'
      };
    }
  } catch (error) {
    console.error(`Error creating/updating API connection:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Toggle an API connection's status
 * @param id The API connection ID
 * @param isConnected Whether the connection should be enabled or disabled
 * @param type The API connection type
 * @returns Success status and message
 */
export async function toggleApiConnection(
  id: string | number,
  isConnected: boolean,
  type: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await apiRequest(`/api/api-connections/${id}`, 'PUT', { isConnected, type });
    
    // Parse response as a generic object
    const responseData = response as Record<string, any>;
    
    if (responseData) {
      return {
        success: true,
        message: `Successfully ${isConnected ? 'enabled' : 'disabled'} ${type} connection`
      };
    } else {
      return {
        success: false,
        message: 'Failed to update connection status'
      };
    }
  } catch (error) {
    console.error(`Error toggling API connection:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}