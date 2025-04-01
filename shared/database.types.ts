import { 
  ApiConnection, 
  ChatMessage, 
  CommandHistoryEntry,
  TrainingData
} from './schema';

// Define our Supabase database types
export type Database = {
  public: {
    Tables: {
      api_connections: {
        Row: ApiConnection;
        Insert: Omit<ApiConnection, 'id'>;
        Update: Partial<ApiConnection>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, 'id' | 'created_at'>;
        Update: Partial<ChatMessage>;
      };
      command_history: {
        Row: CommandHistoryEntry;
        Insert: Omit<CommandHistoryEntry, 'id' | 'created_at'>;
        Update: Partial<CommandHistoryEntry>;
      };
      training_data: {
        Row: TrainingData;
        Insert: Omit<TrainingData, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<TrainingData>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};