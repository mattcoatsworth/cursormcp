import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create and export a single Supabase client instance for the application
// This will be used for all API interactions to ensure consistency
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials are not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  
  supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  return supabaseClient;
}

/**
 * Get training data based on filters
 * This is a specialized function to avoid the common training_data query issues
 */
export async function getTrainingData(options: { 
  tool?: string; 
  intent?: string; 
  limit?: number;
  isMultiServiceOnly?: boolean;
  searchQuery?: string;
}): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();
    const limit = options.limit || 50;
    
    console.log('Fetching training data with direct Supabase client', options);
    
    let query = supabase.from('training_data').select('*');
    
    // Apply filters
    if (options.tool && options.tool !== 'all-tools') {
      query = query.eq('tool', options.tool);
    }
    
    if (options.intent && options.intent !== 'all-intents') {
      query = query.eq('intent', options.intent);
    }
    
    if (options.isMultiServiceOnly) {
      query = query.eq('is_multi_service', true);
    }
    
    if (options.searchQuery) {
      query = query.or(`query.ilike.%${options.searchQuery}%,response.ilike.%${options.searchQuery}%`);
    }
    
    // Order and limit
    query = query.order('created_at', { ascending: false }).limit(limit);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching training data:', error);
      return [];
    }
    
    // Transform to client-expected format
    return data.map((item: any) => ({
      id: item.id || `training-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      tool: item.tool || 'Unknown',
      intent: item.intent || 'Unknown',
      query: item.query || '',
      response: item.response || '',
      metadata: item.metadata || {},
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString(),
      is_multi_service: item.is_multi_service || false
    }));
  } catch (error) {
    console.error('Error in getTrainingData:', error);
    return [];
  }
}

/**
 * Reusable function to execute SQL queries using ONLY Supabase
 * This can be imported and used by other modules in the app
 */
export async function executeSql(sql_query: string): Promise<any[]> {
  console.log('Executing SQL query through Supabase:', sql_query);
  
  // First, check if we should be restricting the query
  // For security, only allow SELECT, INSERT, UPDATE queries for specific tables
  const lowerQuery = sql_query.trim().toLowerCase();
  const isSelect = lowerQuery.startsWith('select');
  const isInsertToTrainingData = lowerQuery.startsWith('insert into training_data');
  const isUpdateTrainingData = lowerQuery.startsWith('update training_data');
  
  if (!isSelect && !isInsertToTrainingData && !isUpdateTrainingData) {
    console.warn('Attempted unauthorized query, restricting for security');
    throw new Error('Only authorized queries are allowed for security reasons');
  }
  
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    // Special case for training data - use the specialized function
    if (lowerQuery.includes('from training_data') && isSelect) {
      // Extract any filtering conditions
      const options: any = { limit: 50 };
      
      // Attempt to extract tool filter
      const toolMatch = lowerQuery.match(/tool\s*=\s*['"]([^'"]+)['"]/i);
      if (toolMatch && toolMatch[1]) {
        options.tool = toolMatch[1];
      }
      
      // Attempt to extract intent filter
      const intentMatch = lowerQuery.match(/intent\s*=\s*['"]([^'"]+)['"]/i);
      if (intentMatch && intentMatch[1]) {
        options.intent = intentMatch[1];
      }
      
      // Check for limit clause
      const limitMatch = lowerQuery.match(/limit\s+(\d+)/i);
      if (limitMatch && limitMatch[1]) {
        options.limit = parseInt(limitMatch[1], 10);
      }
      
      // Search for ILIKE clauses
      const ilikeMatch = lowerQuery.match(/query\s+ilike\s+['"]%([^%]+)%['"]/i);
      if (ilikeMatch && ilikeMatch[1]) {
        options.searchQuery = ilikeMatch[1];
      }
      
      console.log('Using specialized training data function with options:', options);
      return await getTrainingData(options);
    }
    
    // Handle INSERT and UPDATE queries directly
    if (isInsertToTrainingData || isUpdateTrainingData) {
      console.log('Handling INSERT or UPDATE for training_data');
      try {
        // Try using the RPC method first
        try {
          const { data, error } = await supabase.rpc('execute_sql', { query: sql_query });
          
          if (error) {
            console.error('RPC error:', error);
            throw error;
          }
          
          return data || [];
        } catch (rpcError) {
          console.error('RPC method failed, trying direct table operation:', rpcError);
          
          // Try direct table operation for insert
          if (isInsertToTrainingData) {
            // Parse the INSERT query to extract values
            const match = lowerQuery.match(/insert into training_data\s*\((.*?)\)\s*values\s*\((.*?)\)/is);
            if (match && match.length > 2) {
              const columns = match[1].split(',').map(col => col.trim());
              const values = match[2].split(',').map(val => {
                const trimmed = val.trim();
                // Remove quotes from string values
                if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || 
                    (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
                  return trimmed.substring(1, trimmed.length - 1);
                }
                return trimmed;
              });
              
              // Create an object from columns and values
              const insertData: Record<string, any> = {};
              columns.forEach((col, index) => {
                if (index < values.length) {
                  insertData[col] = values[index];
                }
              });
              
              console.log('Attempting direct table insert with:', insertData);
              const { data: insertResult, error: insertError } = await supabase
                .from('training_data')
                .insert([insertData])
                .select();
                
              if (insertError) {
                console.error('Direct insert error:', insertError);
                throw insertError;
              }
              
              return insertResult || [];
            }
          }
          
          throw new Error('Failed to execute direct table operation');
        }
      } catch (error) {
        console.error('Error handling INSERT/UPDATE:', error);
        throw error;
      }
    }
    
    // For other queries
    try {
      // First try RPC
      try {
        const { data, error } = await supabase.rpc('execute_sql', { query: sql_query });
        
        if (error) {
          console.error('RPC error:', error);
          throw error;
        }
        
        return data || [];
      } catch (rpcError) {
        console.error('RPC method failed, trying direct table query:', rpcError);
        
        // Try to determine the table and use direct query
        const tableName = lowerQuery.match(/from\s+([^\s,]+)/i)?.[1]?.trim();
        
        if (tableName) {
          console.log(`Querying table ${tableName} directly`);
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(100);
            
          if (error) {
            console.error('Direct table query error:', error);
            throw error;
          }
          
          return data || [];
        }
        
        throw new Error('Failed to extract table name from query');
      }
    } catch (queryError) {
      console.error('All query methods failed:', queryError);
      return [];
    }
  } catch (error) {
    console.error('Final SQL execution error:', error);
    throw error;
  }
}

/**
 * Main function to be used as a tool
 * Calls the reusable executeSql function
 */
async function execute_sql_tool({ sql_query }: { sql_query: string }): Promise<any[]> {
  return await executeSql(sql_query);
}

export default execute_sql_tool;