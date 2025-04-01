// This file is for reference only - we need the exact property names used in the database

export type ChatMessageDB = {
  id: number;
  role: string;
  content: string;
  metadata: any; // Changed from Record<string, any> to fix type casting issues
  created_at: Date;
};

export type CommandHistoryEntryDB = {
  id: number;
  command: string;
  result: Record<string, any>;
  status: string;
  processed_at: Date | null;
  created_at: Date;
};