import { createClient } from '@supabase/supabase-js';
import type { Database } from '../shared/database.types';

// Check for environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Use anon key for public access

// Initialize Supabase client with credentials
let supabaseClient = null as ReturnType<typeof createClient<Database>> | null;
if (supabaseUrl && supabaseKey) {
  console.log('Initializing Supabase client for data storage');
  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
} else {
  console.log('No Supabase credentials found, some features may be limited');
}

// Export the client
export const supabase = supabaseClient;

// Table names for Supabase queries
export const TABLES = {
  API_CONNECTIONS: 'api_connections',
  CHAT_MESSAGES: 'chat_messages',
  COMMAND_HISTORY: 'command_history',
  TRAINING_DATA: 'training_data'
};

// Helper function to check table existence
export async function checkTableExistence() {
  // If no Supabase client, skip check
  if (!supabaseClient) {
    console.log('Skipping table existence check - no Supabase client');
    return true;
  }

  try {
    // Check if api_connections table exists
    const { error: apiConnectionsError } = await supabaseClient
      .from(TABLES.API_CONNECTIONS)
      .select('*')
      .limit(1);
    
    // Check if chat_messages table exists
    const { error: chatMessagesError } = await supabaseClient
      .from(TABLES.CHAT_MESSAGES)
      .select('*')
      .limit(1);
      
    // Check if command_history table exists
    const { error: commandHistoryError } = await supabaseClient
      .from(TABLES.COMMAND_HISTORY)
      .select('*')
      .limit(1);
      
    // Check if training_data table exists
    const { error: trainingDataError } = await supabaseClient
      .from(TABLES.TRAINING_DATA)
      .select('*')
      .limit(1);
    
    // Check for existence based on error codes (42P01 = table doesn't exist)
    const apiConnectionsExists = apiConnectionsError?.code !== '42P01';
    const chatMessagesExists = chatMessagesError?.code !== '42P01';
    const commandHistoryExists = commandHistoryError?.code !== '42P01';
    const trainingDataExists = trainingDataError?.code !== '42P01';
    
    // Log detailed results for each table
    const tablesExist = {
      apiConnections: apiConnectionsExists,
      chatMessages: chatMessagesExists,
      commandHistory: commandHistoryExists,
      trainingData: trainingDataExists
    };
    
    console.log("Table existence check:", tablesExist);
    
    // All tables must exist
    return apiConnectionsExists && chatMessagesExists && commandHistoryExists && trainingDataExists;
  } catch (error) {
    console.error("Error in table existence check:", error);
    return false;
  }
}