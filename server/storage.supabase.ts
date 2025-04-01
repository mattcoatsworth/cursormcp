import { 
  type ApiConnection, 
  type InsertApiConnection,
  type ChatMessage, 
  type InsertChatMessage,
  type CommandHistoryEntry, 
  type InsertCommandHistoryEntry,
  type TrainingData,
  type InsertTrainingData,
  apiConnections,
  chatMessages,
  commandHistory,
  trainingData
} from '../shared/schema';
import { supabase, TABLES } from './supabase';
import { IStorage } from './storage';
import { PostgrestError } from '@supabase/supabase-js';
import { type ChatMessageDB, type CommandHistoryEntryDB } from '../copy-from-db-storage';

/**
 * Interface for Supabase API Connection format - represents the actual table schema in Supabase
 */
interface SupabaseApiConnection {
  id?: string;
  user_id: string;
  api_name: string;
  is_connected: boolean;
  updated_at: string;
  created_at?: string;
  credentials?: Record<string, any>;
}

/**
 * Implementation of IStorage using Supabase
 */
export class SupabaseStorage implements IStorage {
  constructor() {
    this.initializeSupabaseTables();
  }
  
  /**
   * Helper method to sanitize connection data before updating
   * Prevents data format issues that could corrupt credentials
   */
  sanitizeConnectionData(connection: Partial<ApiConnection>, isToggleOnly: boolean): Partial<ApiConnection> {
    // Create a clean copy of the connection data
    const sanitized: Partial<ApiConnection> = {};
    
    // Only include fields that are explicitly provided and valid
    if (connection.hasOwnProperty('isConnected')) {
      sanitized.isConnected = Boolean(connection.isConnected);
    }
    
    if (!isToggleOnly) {
      // Only include name if it's a valid string
      if (connection.name && typeof connection.name === 'string') {
        sanitized.name = connection.name;
      }
      
      // Only include type if it's a valid string
      if (connection.type && typeof connection.type === 'string') {
        sanitized.type = connection.type;
      }
      
      // Only include credentials if they're a valid object
      if (connection.credentials && typeof connection.credentials === 'object') {
        // Deep clone to prevent reference issues
        sanitized.credentials = JSON.parse(JSON.stringify(connection.credentials));
      }
    }
    
    return sanitized;
  }
  
  /**
   * Recovery method to restore credentials if they're lost during an update
   */
  async recoverCredentials(id: string | number, credentialBackup: any): Promise<boolean> {
    try {
      console.log(`Attempting to recover credentials for connection ${id}`);
      
      // Only proceed if we have actual credential data to restore
      if (!credentialBackup || Object.keys(credentialBackup).length === 0) {
        console.log(`No credential backup available for recovery for connection ${id}`);
        return false;
      }
      
      // Attempt to update just the credentials field
      const { error } = await supabase
        .from(TABLES.API_CONNECTIONS)
        .update({
          credentials: credentialBackup
        })
        .eq('id', id.toString());
        
      if (error) {
        console.error(`Failed to recover credentials for connection ${id}:`, error);
        return false;
      }
      
      console.log(`Successfully recovered credentials for connection ${id}`);
      return true;
    } catch (error) {
      console.error(`Error in recoverCredentials for ${id}:`, error);
      return false;
    }
  }

  /**
   * Initialize Supabase tables and seed with default data if needed
   */
  public async initializeSupabaseTables() {
    try {
      console.log('Checking Supabase tables...');
      
      // Create API connections table if not exists
      await this.createTableIfNotExists(
        TABLES.API_CONNECTIONS,
        `
        CREATE TABLE "${TABLES.API_CONNECTIONS}" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "is_connected" BOOLEAN NOT NULL DEFAULT false,
          "credentials" JSONB NOT NULL DEFAULT '{}',
          "last_connected" TIMESTAMP,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
        `
      );

      // Create chat messages table if not exists
      await this.createTableIfNotExists(
        TABLES.CHAT_MESSAGES,
        `
        CREATE TABLE "${TABLES.CHAT_MESSAGES}" (
          "id" SERIAL PRIMARY KEY,
          "role" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "metadata" JSONB NOT NULL DEFAULT '{}',
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
        `
      );

      // Create command history table if not exists
      await this.createTableIfNotExists(
        TABLES.COMMAND_HISTORY,
        `
        CREATE TABLE "${TABLES.COMMAND_HISTORY}" (
          "id" SERIAL PRIMARY KEY,
          "command" TEXT NOT NULL,
          "result" JSONB NOT NULL DEFAULT '{}',
          "status" TEXT NOT NULL DEFAULT 'pending',
          "processed_at" TIMESTAMP,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
        `
      );
      
      // Create training data table if not exists
      await this.createTableIfNotExists(
        TABLES.TRAINING_DATA,
        `
        CREATE TABLE "${TABLES.TRAINING_DATA}" (
          "id" TEXT PRIMARY KEY,
          "tool" TEXT NOT NULL,
          "intent" TEXT NOT NULL,
          "query" TEXT NOT NULL,
          "response" TEXT NOT NULL,
          "metadata" JSONB NOT NULL DEFAULT '{}',
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_training_data_tool ON "${TABLES.TRAINING_DATA}" (tool);
        CREATE INDEX IF NOT EXISTS idx_training_data_intent ON "${TABLES.TRAINING_DATA}" (intent);
        CREATE INDEX IF NOT EXISTS idx_training_data_tool_intent ON "${TABLES.TRAINING_DATA}" (tool, intent);
        `
      );
      
      // Fix the 'credentials' column if it doesn't exist
      await this.ensureCredentialsColumnExists();

      // Seed default data if tables are empty
      await this.seedDefaultData();

    } catch (error) {
      console.error('Error initializing Supabase tables:', error);
    }
  }

  /**
   * Create a table in Supabase if it doesn't exist
   * This method is enhanced for mobile app compatibility to ensure tables are always accessible through Supabase
   */
  private async createTableIfNotExists(tableName: string, createTableSQL: string) {
    try {
      // Check if table exists by attempting to query it
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error && error.code === '42P01') { // Table doesn't exist according to Supabase
        console.log(`Creating table ${tableName} for mobile compatibility...`);
        
        try {
          // Use Supabase's RPC functions for SQL execution
          // We can execute SQL through Supabase RPC
          console.log('Using Supabase for table creation...');
          
          try {
            // Check if the table exists in PostgreSQL first
            try {
              // Try to query the table directly in Supabase
              const { error } = await supabase.from(tableName).select('*').limit(1);
              const tableExists = !error || error.code !== '42P01'; // Error code 42P01 means relation doesn't exist
              
              if (tableExists) {
                console.log(`Table ${tableName} already exists in Supabase, skipping recreation`);
                // Try to ensure RLS is enabled but preserve the data
              } else {
                // Create the table using Supabase SQL RPC
                await supabase.rpc('execute_sql', { query: createTableSQL });
                console.log(`Table ${tableName} created successfully in Supabase!`);
              }
            } catch (err) {
              console.error(`Error checking/creating table ${tableName}:`, err);
              
              // Try a more direct approach as fallback
              try {
                await supabase.rpc('execute_sql', { query: createTableSQL });
                console.log(`Table ${tableName} created with fallback method in Supabase!`);
              } catch (fallbackErr) {
                console.error(`Failed to create table ${tableName} with fallback:`, fallbackErr);
                throw new Error(`Failed to create table ${tableName}`);
              }
            }
            
            // Create RLS policy for the table
            const policySQL = `
              ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;
              DO $$
              BEGIN
                  IF NOT EXISTS (
                      SELECT 1 FROM pg_policies 
                      WHERE tablename = '${tableName}' 
                      AND policyname = '${tableName}_policy'
                  ) THEN
                      EXECUTE 'CREATE POLICY ${tableName}_policy ON "${tableName}" USING (true) WITH CHECK (true)';
                  END IF;
              END
              $$;
            `;
            
            try {
              await supabase.rpc('execute_sql', { query: policySQL });
              console.log(`RLS policy created for ${tableName}`);
            } catch (rls_err) {
              console.error(`Failed to create RLS policy for ${tableName}:`, rls_err);
              // Continue anyway - the table exists
            }
            
            // Register table with Supabase realtime
            const realtimeSQL = `
              -- Enable realtime for this table
              BEGIN;
                DROP PUBLICATION IF EXISTS supabase_realtime;
                CREATE PUBLICATION supabase_realtime;
              COMMIT;
              
              -- Add table to publication
              ALTER PUBLICATION supabase_realtime ADD TABLE "${tableName}";
              
              -- Configure realtime 
              COMMENT ON TABLE "${tableName}" IS 'This table is tracked by Supabase realtime for mobile compatibility';
            `;
            
            try {
              await supabase.rpc('execute_sql', { query: realtimeSQL });
              console.log(`Registered ${tableName} with Supabase realtime`);
            } catch (rt_err) {
              console.error(`Failed to register ${tableName} with Supabase realtime:`, rt_err);
              // Continue anyway - the table exists
            }
            
          } catch (createError: any) {
            // Check if the error is because the table already exists
            if (createError.code === '42P07') { // Relation already exists
              console.log(`Table ${tableName} already exists in the database.`);
              // This is actually a success case
              return;
            } else {
              // Some other error occurred - but we'll continue anyway
              console.error(`Error while creating ${tableName}:`, createError);
              console.log(`Will continue trying to use table ${tableName} despite errors`);
            }
          }
          
          // Wait a moment for Supabase to recognize the table
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify table was created by trying to query it again
          const { error: verifyError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (verifyError && verifyError.code === '42P01') {
            console.warn(`Table ${tableName} was created but Supabase still can't see it. The mobile app will need to handle this.`);
            console.warn(`This will require schema refresh on Supabase or the iOS app should be updated to handle missing tables.`);
          } else {
            console.log(`Table ${tableName} is now accessible via Supabase!`);
          }
          
          return;
        } catch (pgError) {
          console.error('Failed to create or verify table:', pgError);
          console.log(`Will continue trying to use table ${tableName} despite errors`);
          // Don't throw error, continue execution
        }
      } else {
        console.log(`Table ${tableName} already exists and is accessible via Supabase.`);
      }
    } catch (error) {
      console.error(`Error working with table ${tableName}:`, error);
      console.log(`Will continue trying to use table ${tableName} despite errors`);
      // Don't throw error, continue execution
    }
  }

  /**
   * Ensure the credentials column exists in the api_connections table
   * This fixes the common "Could not find the 'credentials' column of 'api_connections'" error
   */
  private async ensureCredentialsColumnExists() {
    try {
      // Check if we can access the credentials column by testing with a query
      const { data, error } = await supabase
        .from(TABLES.API_CONNECTIONS)
        .select('credentials')
        .limit(1);
      
      if (error && (error.message?.includes("column") || error.message?.includes("credentials"))) {
        console.log('Adding credentials column to api_connections table...');
        
        // Add the credentials column with a default value
        const addCredentialsColumnSQL = `
          ALTER TABLE "${TABLES.API_CONNECTIONS}" 
          ADD COLUMN IF NOT EXISTS "credentials" JSONB DEFAULT '{}';
        `;
        
        try {
          await supabase.rpc('execute_sql', { query: addCredentialsColumnSQL });
          console.log('credentials column added successfully to api_connections table');
        } catch (alterError) {
          console.error('Error adding credentials column:', alterError);
        }
      } else {
        console.log('credentials column exists in api_connections table');
      }
    } catch (error) {
      console.error('Error checking credentials column:', error);
    }
  }

  /**
   * Seed default data if tables are empty
   */
  private async seedDefaultData() {
    try {
      // Check the API connections table structure
      const { data: connections, error: connectionsError } = await supabase
        .from(TABLES.API_CONNECTIONS)
        .select('*');
      
      if (connectionsError) {
        console.error('Error checking API connections:', connectionsError);
        return;
      }

      // Check if we have the right columns
      const sampleConnection = connections && connections.length > 0 ? connections[0] : null;
      
      // Check if a credentials column exists
      const hasCredentialsColumn = sampleConnection && 'credentials' in sampleConnection;
      
      if (!hasCredentialsColumn && sampleConnection) {
        // The Supabase table does not have a credentials column
        console.log('The api_connections table in Supabase is missing the credentials column. Will add it.');
        try {
          // Add the credentials column using RPC
          const { error: alterError } = await supabase.rpc('execute_sql', { 
            query: `ALTER TABLE ${TABLES.API_CONNECTIONS} ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '{}'::jsonb` 
          });
          
          if (alterError) {
            console.error('Failed to add credentials column:', alterError);
            console.log('Will continue with existing structure');
          } else {
            console.log('Successfully added credentials column to api_connections table');
          }
        } catch (alterErr) {
          console.error('Error when trying to alter table:', alterErr);
        }
      }
      
      // Map existing connections by their name
      const existingConnectionTypes = connections.map(conn => {
        if ('type' in conn) return conn.type.toLowerCase();
        if ('api_name' in conn) return conn.api_name.toLowerCase();
        return '';
      });

      console.log('Existing connection types:', existingConnectionTypes);
      
      // Initialize with all required API connections
      const requiredApis = [
        { name: "Shopify", type: "shopify", isConnected: true },
        { name: "Klaviyo", type: "klaviyo", isConnected: true },
        { name: "Postscript", type: "postscript", isConnected: true },
        { name: "Northbeam", type: "northbeam", isConnected: true },
        { name: "Slack", type: "slack", isConnected: true },
        { name: "Notion", type: "notion", isConnected: true },
        { name: "OpenAI", type: "openai", isConnected: true },
        { name: "Triple Whale", type: "triplewhale", isConnected: true },
        { name: "Gorgias", type: "gorgias", isConnected: true },
        { name: "Recharm", type: "recharm", isConnected: true },
        { name: "Prescient AI", type: "prescientai", isConnected: true },
        { name: "Elevar", type: "elevar", isConnected: true },
        { name: "GitHub", type: "github", isConnected: true },
        { name: "Google Calendar", type: "googlecalendar", isConnected: true }
      ];

      // Add missing connections
      console.log('Checking for missing API connections to add...');
      for (const api of requiredApis) {
        const apiType = api.type.toLowerCase();
        const exists = existingConnectionTypes.some(type => type.toLowerCase() === apiType);
        
        if (!exists) {
          console.log(`Adding missing API connection: ${api.name}`);
          try {
            // Get the user_id from an existing connection if available
            const userId = sampleConnection && 'user_id' in sampleConnection ? sampleConnection.user_id : 'a6cd4585-9ae0-430d-a24c-2fd8ef96bd50'; // Use a default ID if none found
            
            // Insert directly using the Supabase format we know from the actual table structure
            const insertData: SupabaseApiConnection = {
              user_id: userId,
              api_name: api.name,
              is_connected: api.isConnected,
              updated_at: new Date().toISOString()
            };
            
            // Add credentials only if the column exists
            if (hasCredentialsColumn) {
              insertData.credentials = {};
            }
            
            const { data, error } = await supabase
              .from(TABLES.API_CONNECTIONS)
              .insert(insertData)
              .select()
              .single();

            if (error) {
              console.error(`Failed to add ${api.name}:`, error);
            } else {
              console.log(`Added ${api.name} successfully`);
            }
          } catch (error) {
            console.error(`Error adding API connection for ${api.name}:`, error);
          }
        }
      }

      // Check if we need to add welcome message
      const { data: messages, error: messagesError } = await supabase
        .from(TABLES.CHAT_MESSAGES)
        .select('*')
        .limit(1);
        
      if (messagesError) {
        console.error('Error checking chat messages:', messagesError);
      } else if (!messages || messages.length === 0) {
        console.log('Adding welcome message...');
        // Initialize with welcome message
        await this.createChatMessage({
          role: "assistant",
          content: "Welcome to your Multi-Channel Platform! I can help you execute commands across all your connected services. Try asking me to:\n- Get sales data from Shopify for the last 7 days\n- Create a new email campaign in Klaviyo\n- Send a message to #marketing channel in Slack\n- Update inventory for product SKU-12345",
          metadata: {}
        });
      }
    } catch (error) {
      console.error('Error seeding default data:', error);
    }
  }

  /**
   * Get all API connections
   */
  async getApiConnections(): Promise<ApiConnection[]> {
    const { data, error } = await supabase
      .from(TABLES.API_CONNECTIONS)
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching API connections:', error);
      throw new Error(`Failed to get API connections: ${error.message}`);
    }

    // Transform data to match expected schema
    return (data || []).map(item => {
      // If we already have the right schema, just return as is
      if ('type' in item) {
        return item as ApiConnection;
      }

      // Map from Supabase format to our schema format
      return {
        id: item.id,
        name: item.api_name || '',
        type: item.api_name ? item.api_name.toLowerCase() : '',
        isConnected: item.is_connected || false,
        credentials: item.credentials || {},
        lastConnected: item.updated_at || null,
        createdAt: item.created_at || new Date().toISOString()
      } as ApiConnection;
    });
  }

  /**
   * Get an API connection by type
   */
  async getApiConnectionByType(type: string): Promise<ApiConnection | undefined> {
    try {
      // For Supabase format, search by api_name first
      // Note: we normalize to lowercase for comparison but keep the original case for display
      const normalizedType = type.toLowerCase();
      
      // First try to find by api_name using ilike for case-insensitive matching
      const { data: apiNameData, error: apiNameError } = await supabase
        .from(TABLES.API_CONNECTIONS)
        .select('*')
        .ilike('api_name', type) // Exact match but case-insensitive
        .limit(1);

      // If we found an exact match by api_name
      if (!apiNameError && apiNameData && apiNameData.length > 0) {
        const connection = apiNameData[0];
        console.log(`Found API connection for ${type} by exact api_name match`);
        
        // Map from Supabase format to our schema format
        return {
          id: connection.id,
          name: connection.api_name || '',
          type: connection.api_name ? connection.api_name.toLowerCase() : '',
          isConnected: connection.is_connected || false,
          credentials: connection.credentials || {},
          lastConnected: connection.updated_at || null,
          createdAt: connection.created_at || new Date().toISOString()
        } as ApiConnection;
      }
      
      // Try matching by lowercase partial names
      const { data: allConnections, error: allError } = await supabase
        .from(TABLES.API_CONNECTIONS)
        .select('*');

      if (allError) {
        console.error('Error fetching all API connections for fallback search:', allError);
        return undefined;
      }

      // Try different matching strategies:
      // 1. Direct lowercase match on api_name (e.g., "Shopify" to "shopify")
      // 2. Match where lowercase api_name contains the normalized type (e.g., "Triple Whale" contains "triplewhale" or "triple")
      // 3. Match where normalized type contains lowercase api_name (e.g., "triplewhale" contains "whale")
      const matchingConnection = (allConnections || []).find(conn => {
        const apiName = (conn.api_name || '').toLowerCase();
        
        // Direct lowercase match (most specific)
        if (apiName === normalizedType) {
          return true;
        }
        
        // Make normalized versions with spaces removed
        const normalizedApiName = apiName.replace(/\s+/g, '');
        const normalizedTypeNoSpaces = normalizedType.replace(/\s+/g, '');
        
        // Check if the API name contains the type (e.g., "Triple Whale" contains "triple")
        if (normalizedApiName.includes(normalizedTypeNoSpaces)) {
          return true;
        }
        
        // Check if the type contains the API name (e.g., "triplewhale" contains "whale")
        if (normalizedTypeNoSpaces.includes(normalizedApiName)) {
          return true;
        }
        
        return false;
      });

      if (matchingConnection) {
        console.log(`Found API connection for ${type} by fuzzy match: ${matchingConnection.api_name}`);
        
        // Map from Supabase format to our schema format
        return {
          id: matchingConnection.id,
          name: matchingConnection.api_name || '',
          type: matchingConnection.api_name ? matchingConnection.api_name.toLowerCase() : '',
          isConnected: matchingConnection.is_connected || false,
          credentials: matchingConnection.credentials || {},
          lastConnected: matchingConnection.updated_at || null,
          createdAt: matchingConnection.created_at || new Date().toISOString()
        } as ApiConnection;
      }

      console.log(`No API connection found for type: ${type}`);
      return undefined;
    } catch (error) {
      console.error('Unexpected error in getApiConnectionByType:', error);
      return undefined;
    }
  }

  /**
   * Create a new API connection
   */
  async createApiConnection(connection: InsertApiConnection): Promise<ApiConnection> {
    try {
      // First try to see which fields the table has by getting one record
      const { data: sample, error: sampleError } = await supabase
        .from(TABLES.API_CONNECTIONS)
        .select('*')
        .limit(1);

      // Determine which format to use based on what fields exist
      const hasDrizzleFormat = sample && sample.length > 0 && 'type' in sample[0];
      const hasSupabaseFormat = sample && sample.length > 0 && 'api_name' in sample[0];

      // If we can't determine format, use Drizzle format as the default
      const useSupabaseFormat = hasSupabaseFormat && !hasDrizzleFormat;

      let insertData;
      
      if (useSupabaseFormat) {
        // Use Supabase format
        insertData = {
          api_name: connection.name,
          is_connected: connection.isConnected,
          credentials: connection.credentials,
          updated_at: new Date().toISOString() // For lastConnected
        };
      } else {
        // Use our Drizzle schema format
        insertData = connection;
      }

      // Insert using the appropriate format
      const { data, error } = await supabase
        .from(TABLES.API_CONNECTIONS)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating API connection:', error);
        throw new Error(`Failed to create API connection: ${error.message}`);
      }

      // If we already have the right schema, just return as is
      if ('type' in data) {
        return data as ApiConnection;
      }

      // Transform from Supabase format to our schema format
      return {
        id: data.id,
        name: data.api_name || connection.name,
        type: data.api_name ? data.api_name.toLowerCase() : connection.type,
        isConnected: data.is_connected || connection.isConnected,
        credentials: data.credentials || connection.credentials,
        lastConnected: data.updated_at || null,
        createdAt: data.created_at || new Date().toISOString()
      } as ApiConnection;
    } catch (error) {
      console.error('Error in createApiConnection:', error);
      throw new Error(`Failed to create API connection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update an API connection with enhanced safeguards
   */
  async updateApiConnection(id: number | string, connection: Partial<ApiConnection>): Promise<ApiConnection | undefined> {
    try {
      // First check if the record exists and which format it uses
      const { data: existingData, error: existingError } = await supabase
        .from(TABLES.API_CONNECTIONS)
        .select('*')
        .eq('id', id.toString())
        .single();

      if (existingError) {
        if (existingError.code === 'PGRST116') {
          console.error(`API connection with id ${id} not found`);
          return undefined;
        }
        throw existingError;
      }

      console.log(`Updating API connection ${id}, isToggleOnly: ${Object.keys(connection).length === 1 && 'isConnected' in connection}`);
      
      // Create a backup of the existing credentials
      const existingCredentials = 
        'credentials' in existingData ? existingData.credentials : 
        'type' in existingData ? existingData.credentials : 
        {};
      
      console.log(`Found existing credentials for ${id}: ${existingCredentials ? 'YES' : 'NO'}`);
      
      // BACKUP SAFEGUARD: Store the credential backup in memory during this operation
      const credentialBackup = JSON.parse(JSON.stringify(existingCredentials || {}));
      
      // MODIFICATION SAFEGUARD: Check if this is just a toggle operation
      const isToggleOnly = Object.keys(connection).length === 1 && 'isConnected' in connection;
      
      // FORMAT SAFEGUARD: Sanitize connection data to prevent any malformed data
      connection = this.sanitizeConnectionData(connection, isToggleOnly);
      
      let updateData;
      const hasDrizzleFormat = 'type' in existingData;
      const hasSupabaseFormat = 'api_name' in existingData;

      if (hasSupabaseFormat && !hasDrizzleFormat) {
        // Translate from our schema to Supabase schema
        updateData = {
          api_name: connection.name || undefined,
          is_connected: connection.isConnected,
          // CREDENTIAL PRESERVATION SAFEGUARD:
          // Only include credentials in update if they're explicitly provided AND not empty
          credentials: isToggleOnly ? undefined : 
                      (connection.credentials && Object.keys(connection.credentials).length > 0) ? 
                        connection.credentials : undefined,
          updated_at: new Date().toISOString()
        };
        
        // TOGGLE SAFEGUARD: For toggle operations, never update the credentials
        if (isToggleOnly) {
          console.log(`Toggle-only operation detected for connection ${id}, preserving existing credentials`);
          delete updateData.credentials;
        }
        
        // ADDITIONAL SAFEGUARD: Never allow empty credential objects
        if (updateData.credentials && Object.keys(updateData.credentials).length === 0) {
          console.log(`Empty credentials detected in update - removing from update operation`);
          delete updateData.credentials;
        }
      } else {
        // Use our schema format with the same safeguards
        updateData = { ...connection };
        
        // TOGGLE SAFEGUARD: For toggle operations, never update the credentials
        if (isToggleOnly) {
          console.log(`Toggle-only operation detected for connection ${id}, preserving existing credentials`);
          delete updateData.credentials;
        }
        
        // ADDITIONAL SAFEGUARD: Never allow empty credential objects
        if (updateData.credentials && Object.keys(updateData.credentials).length === 0) {
          console.log(`Empty credentials detected in update - removing from update operation`);
          delete updateData.credentials;
        }
      }

      console.log(`Final update data for connection ${id}:`, JSON.stringify({
        ...updateData,
        credentials: updateData.credentials ? 'PRESENT' : 'PRESERVED'
      }));

      // Update using the appropriate format
      const { data, error } = await supabase
        .from(TABLES.API_CONNECTIONS)
        .update(updateData)
        .eq('id', id.toString())
        .select()
        .single();

      if (error) {
        console.error('Error updating API connection:', error);
        
        // RECOVERY SAFEGUARD: If update failed, attempt to restore the credentials
        console.log(`Update failed, attempting credential recovery for connection ${id}`);
        try {
          await this.recoverCredentials(id, credentialBackup);
        } catch (recoveryError) {
          console.error(`Failed to recover credentials after update error:`, recoveryError);
        }
        
        throw new Error(`Failed to update API connection: ${error.message}`);
      }

      // VERIFICATION SAFEGUARD: Verify the credentials are still intact after update
      const updatedCredentials = 
        'credentials' in data ? data.credentials : 
        'type' in data ? data.credentials : 
        null;
        
      if (!updatedCredentials && existingCredentials && Object.keys(existingCredentials).length > 0) {
        console.warn(`Credentials appear to be lost after update for connection ${id}, attempting recovery`);
        try {
          await this.recoverCredentials(id, credentialBackup);
          
          // Refetch the data after recovery
          const { data: recoveredData } = await supabase
            .from(TABLES.API_CONNECTIONS)
            .select('*')
            .eq('id', id.toString())
            .single();
            
          if (recoveredData) {
            console.log(`Successfully recovered credentials for connection ${id}`);
            data.credentials = recoveredData.credentials;
          }
        } catch (recoveryError) {
          console.error(`Failed to recover credentials:`, recoveryError);
        }
      }
      
      // If we already have the right schema, just return as is
      if ('type' in data) {
        return data as ApiConnection;
      }

      // Transform from Supabase format to our schema format
      return {
        id: data.id,
        name: data.api_name || '',
        type: data.api_name ? data.api_name.toLowerCase() : '',
        isConnected: data.is_connected || false,
        credentials: data.credentials || {},
        lastConnected: data.updated_at || null,
        createdAt: data.created_at || new Date().toISOString()
      } as ApiConnection;
    } catch (error) {
      console.error('Error in updateApiConnection:', error);
      throw new Error(`Failed to update API connection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get chat messages
   */
  async getChatMessages(limit?: number): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from(TABLES.CHAT_MESSAGES)
        .select('*')
        .order('id', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist, attempt to create it
        if (error.code === '42P01') {
          console.log('Chat messages table not accessible via Supabase, attempting to recreate it...');
          await this.createTableIfNotExists(
            TABLES.CHAT_MESSAGES,
            `
            CREATE TABLE "${TABLES.CHAT_MESSAGES}" (
              "id" SERIAL PRIMARY KEY,
              "role" TEXT NOT NULL,
              "content" TEXT NOT NULL,
              "metadata" JSONB NOT NULL DEFAULT '{}',
              "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
            );
            `
          );
          
          // Try again
          const retryQuery = supabase
            .from(TABLES.CHAT_MESSAGES)
            .select('*')
            .order('id', { ascending: true });
            
          if (limit) {
            retryQuery.limit(limit);
          }
          
          const { data: retryData, error: retryError } = await retryQuery;
          
          if (retryError) {
            console.error('Failed to get chat messages even after table recreation:', retryError);
            return [];
          }
          
          return retryData?.map(item => {
            return {
              id: item.id,
              role: item.role || '',
              content: item.content || '',
              metadata: item.metadata || {},
              createdAt: item.created_at || new Date().toISOString()
            } as ChatMessage;
          }) || [];
        }
        
        console.error('Error fetching chat messages:', error);
        return [];
      }

      // Transform to match expected schema
      return (data || []).map(item => {
        return {
          id: item.id,
          role: item.role || '',
          content: item.content || '',
          metadata: item.metadata || {},
          createdAt: item.created_at || new Date().toISOString()
        } as ChatMessage;
      });
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      return [];
    }
  }

  /**
   * Create a new chat message
   */
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHAT_MESSAGES)
        .insert({
          role: message.role,
          content: message.content,
          metadata: message.metadata || {}
        })
        .select()
        .single();

      if (error) {
        // If table doesn't exist, attempt to create it
        if (error.code === '42P01') {
          console.log('Chat messages table not accessible via Supabase, attempting to recreate it...');
          await this.createTableIfNotExists(
            TABLES.CHAT_MESSAGES,
            `
            CREATE TABLE "${TABLES.CHAT_MESSAGES}" (
              "id" SERIAL PRIMARY KEY,
              "role" TEXT NOT NULL,
              "content" TEXT NOT NULL,
              "metadata" JSONB NOT NULL DEFAULT '{}',
              "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
            );
            `
          );
          
          // Try again
          const { data: retryData, error: retryError } = await supabase
            .from(TABLES.CHAT_MESSAGES)
            .insert({
              role: message.role,
              content: message.content,
              metadata: message.metadata || {}
            })
            .select()
            .single();
            
          if (retryError) {
            console.error('Failed to create chat message even after table recreation:', retryError);
            // Return a fallback message so the UI doesn't break
            const dbMessage: ChatMessageDB = {
              id: 0, // Fallback ID
              role: message.role,
              content: message.content,
              metadata: message.metadata || {},
              created_at: new Date()
            };
            
            return {
              id: dbMessage.id,
              role: dbMessage.role,
              content: dbMessage.content,
              metadata: dbMessage.metadata,
              createdAt: new Date(dbMessage.created_at)
            } as unknown as ChatMessage;
          }
          
          // Return transformed data
          return {
            id: retryData.id,
            role: retryData.role,
            content: retryData.content,
            metadata: retryData.metadata || {},
            createdAt: retryData.created_at
          } as ChatMessage;
        }
        
        console.error('Error creating chat message:', error);
        // Return a fallback message so the UI doesn't break
        const dbMessage: ChatMessageDB = {
          id: 0, // Fallback ID
          role: message.role,
          content: message.content,
          metadata: message.metadata || {},
          created_at: new Date()
        };
        
        return {
          id: dbMessage.id,
          role: dbMessage.role,
          content: dbMessage.content,
          metadata: dbMessage.metadata,
          createdAt: new Date(dbMessage.created_at)
        } as unknown as ChatMessage;
      }

      // Transform to match expected schema
      return {
        id: data.id,
        role: data.role,
        content: data.content,
        metadata: data.metadata || {},
        createdAt: data.created_at
      } as ChatMessage;
    } catch (error) {
      console.error('Error in createChatMessage:', error);
      // Return a fallback message so the UI doesn't break
      const dbMessage: ChatMessageDB = {
        id: 0, // Fallback ID
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        created_at: new Date()
      };
      
      return {
        id: dbMessage.id,
        role: dbMessage.role,
        content: dbMessage.content,
        metadata: dbMessage.metadata,
        createdAt: new Date(dbMessage.created_at)
      } as unknown as ChatMessage;
    }
  }

  /**
   * Update a chat message
   */
  async updateChatMessage(id: number, message: Partial<ChatMessage>): Promise<ChatMessage | undefined> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHAT_MESSAGES)
        .update({
          role: message.role,
          content: message.content,
          metadata: message.metadata
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat message:', error);
        return undefined;
      }

      // Transform to match expected schema
      return {
        id: data.id,
        role: data.role,
        content: data.content,
        metadata: data.metadata || {},
        createdAt: data.created_at
      } as ChatMessage;
    } catch (error) {
      console.error('Error in updateChatMessage:', error);
      return undefined;
    }
  }

  /**
   * Get command history
   */
  async getCommandHistory(limit?: number): Promise<CommandHistoryEntry[]> {
    try {
      let query = supabase
        .from(TABLES.COMMAND_HISTORY)
        .select('*')
        .order('id', { ascending: false }); // Latest first

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist, attempt to create it
        if (error.code === '42P01') {
          console.log('Command history table not accessible via Supabase, attempting to recreate it...');
          await this.createTableIfNotExists(
            TABLES.COMMAND_HISTORY,
            `
            CREATE TABLE "${TABLES.COMMAND_HISTORY}" (
              "id" SERIAL PRIMARY KEY,
              "command" TEXT NOT NULL,
              "result" JSONB NOT NULL DEFAULT '{}',
              "status" TEXT NOT NULL DEFAULT 'pending',
              "processed_at" TIMESTAMP,
              "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
            );
            `
          );
          
          // Try again
          const retryQuery = supabase
            .from(TABLES.COMMAND_HISTORY)
            .select('*')
            .order('id', { ascending: false });
            
          if (limit) {
            retryQuery.limit(limit);
          }
          
          const { data: retryData, error: retryError } = await retryQuery;
          
          if (retryError) {
            console.error('Failed to get command history even after table recreation:', retryError);
            return [];
          }
          
          return retryData?.map(item => {
            return {
              id: item.id,
              command: item.command || '',
              result: item.result || {},
              status: item.status || 'pending',
              processedAt: item.processed_at ? new Date(item.processed_at).toISOString() : null,
              createdAt: item.created_at || new Date().toISOString()
            } as CommandHistoryEntry;
          }) || [];
        }
        
        console.error('Error fetching command history:', error);
        return [];
      }

      // Transform to match expected schema
      return (data || []).map(item => {
        return {
          id: item.id,
          command: item.command || '',
          result: item.result || {},
          status: item.status || 'pending',
          processedAt: item.processed_at ? new Date(item.processed_at).toISOString() : null,
          createdAt: item.created_at || new Date().toISOString()
        } as CommandHistoryEntry;
      });
    } catch (error) {
      console.error('Error in getCommandHistory:', error);
      return [];
    }
  }

  /**
   * Get a command history entry by ID
   */
  async getCommandHistoryEntry(id: number): Promise<CommandHistoryEntry | undefined> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMMAND_HISTORY)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching command history entry:', error);
        return undefined;
      }

      // Transform to match expected schema
      return {
        id: data.id,
        command: data.command || '',
        result: data.result || {},
        status: data.status || 'pending',
        processedAt: data.processed_at ? new Date(data.processed_at).toISOString() : null,
        createdAt: data.created_at || new Date().toISOString()
      } as CommandHistoryEntry;
    } catch (error) {
      console.error('Error in getCommandHistoryEntry:', error);
      return undefined;
    }
  }

  /**
   * Create a new command history entry
   */
  async createCommandHistoryEntry(entry: InsertCommandHistoryEntry): Promise<CommandHistoryEntry> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMMAND_HISTORY)
        .insert({
          command: entry.command,
          result: entry.result || {},
          status: entry.status || 'pending',
          processed_at: entry.processedAt ? new Date(entry.processedAt) : null
        })
        .select()
        .single();

      if (error) {
        // If table doesn't exist, attempt to create it
        if (error.code === '42P01') {
          console.log('Command history table not accessible via Supabase, attempting to recreate it...');
          await this.createTableIfNotExists(
            TABLES.COMMAND_HISTORY,
            `
            CREATE TABLE "${TABLES.COMMAND_HISTORY}" (
              "id" SERIAL PRIMARY KEY,
              "command" TEXT NOT NULL,
              "result" JSONB NOT NULL DEFAULT '{}',
              "status" TEXT NOT NULL DEFAULT 'pending',
              "processed_at" TIMESTAMP,
              "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
            );
            `
          );
          
          // Try again
          const { data: retryData, error: retryError } = await supabase
            .from(TABLES.COMMAND_HISTORY)
            .insert({
              command: entry.command,
              result: entry.result || {},
              status: entry.status || 'pending',
              processed_at: entry.processedAt ? new Date(entry.processedAt) : null
            })
            .select()
            .single();
            
          if (retryError) {
            console.error('Failed to create command history entry even after table recreation:', retryError);
            // Return a fallback entry so the UI doesn't break
            const dbEntry: CommandHistoryEntryDB = {
              id: 0, // Fallback ID
              command: entry.command,
              result: entry.result || {},
              status: entry.status || 'pending',
              processed_at: entry.processedAt ? new Date(entry.processedAt) : null,
              created_at: new Date()
            };
            
            return {
              id: dbEntry.id,
              command: dbEntry.command,
              result: dbEntry.result,
              status: dbEntry.status,
              processedAt: dbEntry.processed_at ? dbEntry.processed_at.toISOString() : null,
              createdAt: dbEntry.created_at.toISOString()
            } as CommandHistoryEntry;
          }
          
          // Return transformed data
          return {
            id: retryData.id,
            command: retryData.command,
            result: retryData.result || {},
            status: retryData.status || 'pending',
            processedAt: retryData.processed_at ? new Date(retryData.processed_at).toISOString() : null,
            createdAt: retryData.created_at
          } as CommandHistoryEntry;
        }
        
        console.error('Error creating command history entry:', error);
        // Return a fallback entry so the UI doesn't break
        const dbEntry: CommandHistoryEntryDB = {
          id: 0, // Fallback ID
          command: entry.command,
          result: entry.result || {},
          status: entry.status || 'pending',
          processed_at: entry.processedAt ? new Date(entry.processedAt) : null,
          created_at: new Date()
        };
        
        return {
          id: dbEntry.id,
          command: dbEntry.command,
          result: dbEntry.result,
          status: dbEntry.status,
          processedAt: dbEntry.processed_at ? dbEntry.processed_at.toISOString() : null,
          createdAt: dbEntry.created_at.toISOString()
        } as CommandHistoryEntry;
      }

      // Transform to match expected schema
      return {
        id: data.id,
        command: data.command,
        result: data.result || {},
        status: data.status || 'pending',
        processedAt: data.processed_at ? new Date(data.processed_at).toISOString() : null,
        createdAt: data.created_at
      } as CommandHistoryEntry;
    } catch (error) {
      console.error('Error in createCommandHistoryEntry:', error);
      // Return a fallback entry so the UI doesn't break
      const dbEntry: CommandHistoryEntryDB = {
        id: 0, // Fallback ID
        command: entry.command,
        result: entry.result || {},
        status: entry.status || 'pending',
        processed_at: entry.processedAt ? new Date(entry.processedAt) : null,
        created_at: new Date()
      };
      
      return {
        id: dbEntry.id,
        command: dbEntry.command,
        result: dbEntry.result,
        status: dbEntry.status,
        processedAt: dbEntry.processed_at ? dbEntry.processed_at.toISOString() : null,
        createdAt: dbEntry.created_at.toISOString()
      } as CommandHistoryEntry;
    }
  }

  /**
   * Update a command history entry
   */
  async updateCommandHistoryEntry(id: number, entry: Partial<CommandHistoryEntry>): Promise<CommandHistoryEntry | undefined> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMMAND_HISTORY)
        .update({
          result: entry.result,
          status: entry.status,
          processed_at: entry.processedAt ? new Date(entry.processedAt) : null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating command history entry:', error);
        return undefined;
      }

      // Transform to match expected schema
      return {
        id: data.id,
        command: data.command,
        result: data.result || {},
        status: data.status || 'pending',
        processedAt: data.processed_at ? new Date(data.processed_at).toISOString() : null,
        createdAt: data.created_at
      } as CommandHistoryEntry;
    } catch (error) {
      console.error('Error in updateCommandHistoryEntry:', error);
      return undefined;
    }
  }

  /**
   * Get training data with optional filters
   */
  async getTrainingData(options?: { tool?: string; intent?: string; limit?: number }): Promise<TrainingData[]> {
    try {
      // Only use Supabase client - no fallbacks to direct SQL
      let query = supabase
        .from(TABLES.TRAINING_DATA)
        .select('*');
      
      // Apply filters if provided
      if (options?.tool) {
        query = query.eq('tool', options.tool);
      }
      
      if (options?.intent) {
        query = query.eq('intent', options.intent);
      }
      
      // Apply limit if provided
      if (options?.limit) {
        query = query.limit(options.limit);
      } else {
        query = query.limit(50); // Default limit
      }
      
      // Order by created_at descending (newest first)
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error getting training data from Supabase:', error);
        return [];
      }
      
      if (!data || !Array.isArray(data)) {
        console.warn('No training data returned from Supabase or invalid format');
        return [];
      }
      
      console.log(`Retrieved ${data.length} training data records from Supabase`);
      
      // Transform to match expected schema
      return data.map(item => ({
        id: item.id,
        tool: item.tool,
        intent: item.intent,
        query: item.query,
        response: item.response,
        metadata: item.metadata || {},
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Error in getTrainingData:', error);
      return [];
    }
  }

  /**
   * Create a new training data entry
   */
  async createTrainingData(entry: InsertTrainingData): Promise<TrainingData> {
    try {
      // Generate a UUID for the id
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Only use Supabase for data storage, no direct SQL
      const { data, error } = await supabase
        .from(TABLES.TRAINING_DATA)
        .insert({
          id: id,
          tool: entry.tool,
          intent: entry.intent,
          query: entry.query,
          response: entry.response,
          metadata: entry.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating training data:', error);
        throw new Error(`Failed to create training data: ${error.message}`);
      }
      
      console.log('Successfully inserted training data with ID:', id);
      
      // Transform to match expected schema
      return {
        id: data.id,
        tool: data.tool,
        intent: data.intent,
        query: data.query,
        response: data.response,
        metadata: data.metadata || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error in createTrainingData:', error);
      throw new Error(`Failed to create training data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Search training data using text search
   */
  async searchTrainingData(query: string, limit?: number): Promise<TrainingData[]> {
    try {
      // If the query is empty, return an empty array
      if (!query || query.trim() === '') {
        return [];
      }
      
      console.log(`Searching training data for query: "${query}"`);
      
      // Using Supabase's built-in text search capabilities
      const { data, error } = await supabase
        .from(TABLES.TRAINING_DATA)
        .select('*')
        .or(`tool.ilike.%${query}%,intent.ilike.%${query}%,query.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit || 50);
      
      if (error) {
        console.error('Error searching training data:', error);
        return [];
      }
      
      console.log(`Search found ${data?.length || 0} results`);
      
      // Transform to match expected schema
      return (data || []).map(item => ({
        id: item.id,
        tool: item.tool,
        intent: item.intent,
        query: item.query,
        response: item.response,
        metadata: item.metadata || {},
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Error in searchTrainingData:', error);
      return [];
    }
  }
}