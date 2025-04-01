/**
 * Mock API Wrapper
 * 
 * This module intercepts API calls and returns mock data instead when mock mode is enabled.
 * It works as a layer between the actual API clients and the application.
 */

import { MockDataProvider } from './mockDataProvider';
import { storage } from '../storage';

/**
 * Global mock mode setting
 */
let mockModeEnabled = false;

/**
 * Get the current mock mode status
 */
export function isMockModeEnabled(): boolean {
  return mockModeEnabled;
}

/**
 * Enable or disable mock mode
 */
export function setMockMode(enabled: boolean): void {
  mockModeEnabled = enabled;
  console.log(`Mock mode ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Reset all API connections to mock/real state based on mock mode
 */
export async function resetApiConnectionsForMockMode(userId: string = 'system'): Promise<void> {
  if (!mockModeEnabled) {
    // When disabling mock mode, just set isMock to false on all connections
    // but preserve their credentials for when they might be needed again
    const connections = await storage.getApiConnections();
    for (const connection of connections) {
      if (connection.isMock) {
        await storage.updateApiConnection(connection.id, {
          isMock: false,
          isConnected: false // Mark as disconnected since mock credentials won't work
        });
      }
    }
    return;
  }

  // When enabling mock mode, create mock connections for all service types
  const serviceTypes = [
    'shopify', 'klaviyo', 'slack', 'notion', 'postscript', 
    'northbeam', 'triplewhale', 'gorgias', 'recharm', 'prescientai',
    'elevar', 'google_calendar', 'asana', 'gdrive', 'figma', 'github'
  ];

  for (const apiType of serviceTypes) {
    const existingConnection = await storage.getApiConnectionByType(apiType);
    
    if (existingConnection) {
      // Update to mock version if it exists
      await storage.updateApiConnection(existingConnection.id, {
        isConnected: true,
        isMock: true,
        credentials: MockDataProvider.createMockConnection(apiType).credentials
      });
    } else {
      // Create a new mock connection
      const mockConnection = MockDataProvider.createMockConnection(apiType);
      await storage.createApiConnection({
        name: mockConnection.name,
        type: mockConnection.type,
        userId,
        isConnected: true,
        isMock: true,
        credentials: mockConnection.credentials
      });
    }
  }

  console.log(`Created/updated mock connections for ${serviceTypes.length} services`);
}

/**
 * Process a command with mock data instead of actual API call
 */
export function processMockCommand(service: string, command: string, params: any = {}): any {
  if (!mockModeEnabled) {
    throw new Error('Mock mode is not enabled');
  }

  console.log(`Processing mock command: ${service} - ${command}`);
  return MockDataProvider.getMockData(service, command, params);
}

/**
 * Check if a service should use mock data
 */
export async function shouldUseMockForService(service: string): Promise<boolean> {
  if (!mockModeEnabled) {
    return false;
  }

  const connection = await storage.getApiConnectionByType(service);
  return connection?.isMock === true;
}

/**
 * Mock API wrapper function
 * This function takes a real API function and returns a mock wrapper that 
 * will use mock data when mock mode is enabled
 */
export function createMockApiWrapper<T extends (...args: any[]) => Promise<any>>(
  service: string,
  command: string,
  realApiFunction: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      const shouldUseMock = await shouldUseMockForService(service);
      
      if (shouldUseMock) {
        // Use mock data
        const mockResult = processMockCommand(service, command, args[0] || {});
        return mockResult as ReturnType<T>;
      } else {
        // Use real API function
        return await realApiFunction(...args);
      }
    } catch (error) {
      console.error(`Error in mock API wrapper for ${service}.${command}:`, error);
      throw error;
    }
  }) as T;
}