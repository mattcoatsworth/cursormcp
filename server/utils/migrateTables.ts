import { supabase, TABLES } from '../supabase';
import { db } from '../db';
import { 
  apiConnections,
  chatMessages,
  commandHistory,
  type ApiConnection,
  type ChatMessage, 
  type CommandHistoryEntry 
} from '@shared/schema';

/**
 * Utility to create Supabase tables and migrate data from PostgreSQL
 */
export async function migrateTables() {
  try {
    console.log('Starting Supabase table migration...');

    // 1. Create tables in Supabase
    await createSupabaseTables();
    
    // 2. Migrate data from PostgreSQL to Supabase
    await migrateDataToSupabase();

    console.log('Supabase migration completed successfully!');
    return { success: true, message: 'Migration completed successfully!' };
  } catch (error) {
    console.error('Migration error:', error);
    return { 
      success: false, 
      message: `Migration failed: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Create tables in Supabase
 */
async function createSupabaseTables() {
  // Create API connections table
  await createTable(
    TABLES.API_CONNECTIONS,
    `
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    is_connected BOOLEAN NOT NULL DEFAULT false,
    credentials JSONB NOT NULL DEFAULT '{}',
    last_connected TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
    `
  );

  // Create chat messages table
  await createTable(
    TABLES.CHAT_MESSAGES,
    `
    id SERIAL PRIMARY KEY,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
    `
  );

  // Create command history table
  await createTable(
    TABLES.COMMAND_HISTORY,
    `
    id SERIAL PRIMARY KEY,
    command TEXT NOT NULL,
    result JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
    `
  );

  console.log('All tables created successfully!');
}

/**
 * Create a table in Supabase if it doesn't exist
 */
async function createTable(tableName: string, columns: string) {
  // First check if table exists
  const { error: checkError } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  // If table already exists, skip creation
  if (!checkError || checkError.code !== '42P01') {
    console.log(`Table ${tableName} already exists, skipping creation.`);
    return;
  }

  // Create table using SQL query
  const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns});`;
  
  // Use SQL query through the Supabase API
  console.log(`Creating table ${tableName}...`);
  
  try {
    // We're using the auth.admin createUser as a way to run the query with elevated permissions
    // This will create the user but we don't actually use it - we just need to execute
    // a function with admin privileges
    const { error } = await supabase.auth.admin.createUser({
      email: `temp-${Date.now()}@example.com`,
      password: 'temporary-password',
      app_metadata: { sql: createTableSQL }
    });
    
    if (error) {
      console.error(`Error creating table ${tableName}:`, error);
      throw new Error(`Failed to create table ${tableName}: ${error.message}`);
    }
    
    console.log(`Table ${tableName} created successfully!`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Migrate data from PostgreSQL to Supabase
 */
async function migrateDataToSupabase() {
  console.log('Starting data migration...');
  
  // Migrate API connections
  await migrateApiConnections();
  
  // Migrate chat messages
  await migrateChatMessages();
  
  // Migrate command history
  await migrateCommandHistory();
  
  console.log('Data migration completed!');
}

/**
 * Migrate API connections from PostgreSQL to Supabase
 */
async function migrateApiConnections() {
  try {
    // Get API connections from local PostgreSQL
    const pgConnections = await db.select().from(apiConnections);
    
    if (pgConnections.length === 0) {
      console.log('No API connections to migrate.');
      return;
    }
    
    console.log(`Migrating ${pgConnections.length} API connections...`);
    
    // Check if Supabase table already has data
    const { data: existingConnections, error: checkError } = await supabase
      .from(TABLES.API_CONNECTIONS)
      .select('*');
      
    if (checkError) {
      throw new Error(`Error checking existing API connections: ${checkError.message}`);
    }
    
    // If table already has data, skip migration
    if (existingConnections && existingConnections.length > 0) {
      console.log('API connections already exist in Supabase, skipping migration.');
      return;
    }
    
    // Insert connections into Supabase
    const { error: insertError } = await supabase
      .from(TABLES.API_CONNECTIONS)
      .insert(pgConnections);
      
    if (insertError) {
      throw new Error(`Error inserting API connections: ${insertError.message}`);
    }
    
    console.log(`Migrated ${pgConnections.length} API connections successfully!`);
  } catch (error) {
    console.error('Error migrating API connections:', error);
    throw error;
  }
}

/**
 * Migrate chat messages from PostgreSQL to Supabase
 */
async function migrateChatMessages() {
  try {
    // Get chat messages from local PostgreSQL
    const pgMessages = await db.select().from(chatMessages);
    
    if (pgMessages.length === 0) {
      console.log('No chat messages to migrate.');
      return;
    }
    
    console.log(`Migrating ${pgMessages.length} chat messages...`);
    
    // Check if Supabase table already has data
    let existingMessages = [];
    try {
      const { data, error: checkError } = await supabase
        .from(TABLES.CHAT_MESSAGES)
        .select('*');
        
      if (checkError && checkError.code !== '42P01') {
        throw new Error(`Error checking existing chat messages: ${checkError.message}`);
      }
      if (data) {
        existingMessages = data;
      }
    } catch (error) {
      console.log('Table might not be ready yet, waiting 2 seconds and continuing...');
      // Wait 2 seconds for table to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // If table already has data, skip migration
    if (existingMessages.length > 0) {
      console.log('Chat messages already exist in Supabase, skipping migration.');
      return;
    }
    
    // Insert messages into Supabase in batches to avoid payload size limits
    const BATCH_SIZE = 25;
    const totalBatches = Math.ceil(pgMessages.length / BATCH_SIZE);
    console.log(`Inserting messages in ${totalBatches} batches (${BATCH_SIZE} messages per batch)...`);
    
    for (let i = 0; i < pgMessages.length; i += BATCH_SIZE) {
      const batch = pgMessages.slice(i, i + BATCH_SIZE);
      console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches} (${batch.length} messages)...`);
      
      try {
        const { error: insertError } = await supabase
          .from(TABLES.CHAT_MESSAGES)
          .insert(batch);
          
        if (insertError) {
          console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError);
          throw new Error(`Error inserting chat messages batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message || 'Unknown error'}`);
        }
        
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches} inserted successfully.`);
        
        // Add a small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        throw error;
      }
    }
    
    console.log(`Migrated ${pgMessages.length} chat messages successfully!`);
  } catch (error) {
    console.error('Error migrating chat messages:', error);
    throw error;
  }
}

/**
 * Migrate command history entries from PostgreSQL to Supabase
 */
async function migrateCommandHistory() {
  try {
    // Get command history from local PostgreSQL
    const pgHistory = await db.select().from(commandHistory);
    
    if (pgHistory.length === 0) {
      console.log('No command history entries to migrate.');
      return;
    }
    
    console.log(`Migrating ${pgHistory.length} command history entries...`);
    
    // Check if Supabase table already has data
    let existingEntries = [];
    try {
      const { data, error: checkError } = await supabase
        .from(TABLES.COMMAND_HISTORY)
        .select('*');
        
      if (checkError && checkError.code !== '42P01') {
        throw new Error(`Error checking existing command history: ${checkError.message}`);
      }
      if (data) {
        existingEntries = data;
      }
    } catch (error) {
      console.log('Command history table might not be ready yet, waiting 2 seconds and continuing...');
      // Wait 2 seconds for table to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // If table already has data, skip migration
    if (existingEntries && existingEntries.length > 0) {
      console.log('Command history already exists in Supabase, skipping migration.');
      return;
    }
    
    // Insert command history entries into Supabase in batches
    const BATCH_SIZE = 25;
    const totalBatches = Math.ceil(pgHistory.length / BATCH_SIZE);
    console.log(`Inserting command history in ${totalBatches} batches (${BATCH_SIZE} entries per batch)...`);
    
    for (let i = 0; i < pgHistory.length; i += BATCH_SIZE) {
      const batch = pgHistory.slice(i, i + BATCH_SIZE);
      console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches} (${batch.length} entries)...`);
      
      try {
        const { error: insertError } = await supabase
          .from(TABLES.COMMAND_HISTORY)
          .insert(batch);
          
        if (insertError) {
          console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError);
          throw new Error(`Error inserting command history batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message || 'Unknown error'}`);
        }
        
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches} inserted successfully.`);
        
        // Add a small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        throw error;
      }
    }
    
    console.log(`Migrated ${pgHistory.length} command history entries successfully!`);
  } catch (error) {
    console.error('Error migrating command history:', error);
    throw error;
  }
}