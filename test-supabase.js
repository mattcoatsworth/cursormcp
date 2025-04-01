// Test script for Supabase connection

import { createClient } from '@supabase/supabase-js';

async function testSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing!');
    return;
  }
  
  console.log('Testing Supabase connection...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Try querying each table
    const tables = ['api_connections', 'chat_messages', 'command_history'];
    
    for (const table of tables) {
      console.log(`Testing table: ${table}`);
      
      // Try simple select * - this is the most basic operation
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          console.error(`Table ${table} does not exist in Supabase!`);
        } else {
          console.error(`Error querying ${table}:`, error);
        }
      } else {
        console.log(`${table} query successful. Found ${data.length} rows.`);
      }
    }
    
    // Try all Supabase system schemas
    const schemas = [
      '_auth',
      '_realtime',
      'auth',
      'graphql_public',
      'public',
      'storage'
    ];
    
    // Try to get all tables from Supabase
    console.log('\nListing all tables from all schemas...');
    const { data: tables_data, error: tables_error } = await supabase.rpc('get_all_tables');
    
    if (tables_error) {
      console.error('Could not list tables using RPC:', tables_error);
    } else {
      console.log('Tables found:', tables_data);
    }
    
  } catch (error) {
    console.error('Unexpected error during Supabase test:', error);
  }
}

// Run the test
testSupabase()
  .then(() => console.log('Supabase test completed'))
  .catch(err => console.error('Supabase test failed:', err));