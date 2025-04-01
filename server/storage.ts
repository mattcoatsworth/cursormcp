import {
  type ApiConnection,
  type InsertApiConnection,
  type ChatMessage,
  type InsertChatMessage,
  type CommandHistoryEntry,
  type InsertCommandHistoryEntry,
  type TrainingData,
  type InsertTrainingData
} from "@shared/schema";
import { SupabaseStorage } from './storage.supabase';

export interface IStorage {
  // API Connection methods
  getApiConnections(): Promise<ApiConnection[]>;
  getApiConnectionByType(type: string): Promise<ApiConnection | undefined>;
  createApiConnection(connection: InsertApiConnection): Promise<ApiConnection>;
  updateApiConnection(id: number | string, connection: Partial<ApiConnection>): Promise<ApiConnection | undefined>;

  // Chat Message methods
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  updateChatMessage(id: number, message: Partial<ChatMessage>): Promise<ChatMessage | undefined>;
  
  // Command History methods
  getCommandHistory(limit?: number): Promise<CommandHistoryEntry[]>;
  getCommandHistoryEntry(id: number): Promise<CommandHistoryEntry | undefined>;
  createCommandHistoryEntry(entry: InsertCommandHistoryEntry): Promise<CommandHistoryEntry>;
  updateCommandHistoryEntry(id: number, entry: Partial<CommandHistoryEntry>): Promise<CommandHistoryEntry | undefined>;
  
  // Training Data methods
  getTrainingData(options?: { tool?: string; intent?: string; limit?: number }): Promise<TrainingData[]>;
  createTrainingData(entry: InsertTrainingData): Promise<TrainingData>;
  searchTrainingData(query: string, limit?: number): Promise<TrainingData[]>;
}

// Create the storage instance using Supabase only
console.log('Using Supabase for all data storage for mobile app compatibility');
const supabaseStorage = new SupabaseStorage();

// Immediately initialize the storage
async function initStorage() {
  try {
    // Verify Supabase connection
    try {
      const testConnection = await supabaseStorage.getApiConnections();
      console.log('Supabase connection verified successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Supabase connection test failed:', errorMessage);
      console.error('Please check your Supabase credentials');
      // This is a critical error as we're only using Supabase
      throw new Error('Could not connect to Supabase - check credentials');
    }
  } catch (error) {
    console.error('Critical error initializing storage:', error);
    // Still continue with the app but log the error
  }
}

// Start initialization but don't block the export
initStorage().then(() => {
  console.log('Storage initialization complete');
}).catch(error => {
  console.error('Failed to initialize storage properly:', error);
});

// Export the Supabase storage implementation directly
export const storage = supabaseStorage;
