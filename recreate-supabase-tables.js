// Script to recreate tables in Supabase

import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Connect to PostgreSQL directly
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Connect to Supabase with admin rights
const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

async function recreateTables() {
  try {
    console.log('Starting Supabase table recreation...');
    
    // Define table structures
    const tableDefinitions = {
      chat_messages: `
        DROP TABLE IF EXISTS chat_messages;
        CREATE TABLE chat_messages (
          id SERIAL PRIMARY KEY,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
        ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
        CREATE POLICY chat_messages_policy ON chat_messages USING (true) WITH CHECK (true);
      `,
      command_history: `
        DROP TABLE IF EXISTS command_history;
        CREATE TABLE command_history (
          id SERIAL PRIMARY KEY,
          command TEXT NOT NULL,
          result JSONB NOT NULL DEFAULT '{}',
          status TEXT NOT NULL DEFAULT 'pending',
          processed_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
        ALTER TABLE command_history ENABLE ROW LEVEL SECURITY;
        CREATE POLICY command_history_policy ON command_history USING (true) WITH CHECK (true);
      `
    };
    
    // Execute SQL through Supabase's REST API using the rpc function
    for (const [tableName, sql] of Object.entries(tableDefinitions)) {
      console.log(`Recreating table: ${tableName}`);
      
      // First, let's back up any existing data
      console.log(`Backing up data from ${tableName}...`);
      const { rows: existingData } = await pool.query(`SELECT * FROM ${tableName}`);
      console.log(`Found ${existingData.length} records to back up`);
      
      // Now execute the SQL to recreate the table
      const result = await pool.query(sql);
      console.log(`Table ${tableName} recreated successfully`);
      
      // If we had data, restore it
      if (existingData.length > 0) {
        console.log(`Restoring data to ${tableName}...`);
        
        for (const row of existingData) {
          // Remove id and created_at as they'll be auto-generated
          const { id, created_at, ...data } = row;
          
          // Create columns and values strings for the INSERT
          const columns = Object.keys(data).join(', ');
          const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
          const values = Object.values(data);
          
          const insertSQL = `
            INSERT INTO ${tableName} (${columns}) 
            VALUES (${placeholders})
          `;
          
          await pool.query(insertSQL, values);
        }
        
        console.log(`Restored ${existingData.length} records to ${tableName}`);
      }
    }
    
    // Re-enable realtime for all tables
    const enableRealtimeSQL = `
      -- Enable realtime
      BEGIN;
        DROP PUBLICATION IF EXISTS supabase_realtime;
        CREATE PUBLICATION supabase_realtime;
      COMMIT;
      
      -- Add tables to publication
      ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages, command_history;
    `;
    
    await pool.query(enableRealtimeSQL);
    console.log('Realtime enabled for all tables');
    
    // Verify tables are accessible via Supabase client
    console.log('\nVerifying tables are accessible via Supabase client...');
    const tables = ['api_connections', 'chat_messages', 'command_history'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          console.error(`Error accessing ${tableName} via Supabase:`, error);
        } else {
          console.log(`✅ Table ${tableName} is properly accessible via Supabase`);
        }
      } catch (err) {
        console.error(`Error testing ${tableName}:`, err);
      }
    }
    
    console.log('\nTable recreation completed.');
    
  } catch (error) {
    console.error('Error recreating Supabase tables:', error);
  } finally {
    // Close the PostgreSQL connection
    await pool.end();
  }
}

// Run the recreation
recreateTables()
  .then(() => console.log('Completed Supabase table recreation'))
  .catch(err => console.error('Recreation failed:', err));