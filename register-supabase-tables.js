// Script to register all tables properly in Supabase

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

async function registerTables() {
  try {
    console.log('Starting Supabase table registration...');

    // First, check which tables exist in the database
    const { rows: existingTables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Existing tables in PostgreSQL:', existingTables.map(t => t.table_name));
    
    // We need to ensure these tables exist and are registered with Supabase
    const tablesNeeded = ['api_connections', 'chat_messages', 'command_history'];
    
    for (const tableName of tablesNeeded) {
      console.log(`Processing table: ${tableName}`);
      
      // Check if table exists in PostgreSQL
      const tableExists = existingTables.some(t => t.table_name === tableName);
      
      if (!tableExists) {
        console.log(`Table ${tableName} doesn't exist yet, creating it...`);
        
        // Create the table based on the schema
        let createTableSQL = '';
        
        if (tableName === 'api_connections') {
          createTableSQL = `
            CREATE TABLE IF NOT EXISTS api_connections (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              type TEXT NOT NULL,
              credentials JSONB NOT NULL DEFAULT '{}',
              is_connected BOOLEAN NOT NULL DEFAULT false,
              created_at TIMESTAMP NOT NULL DEFAULT now(),
              updated_at TIMESTAMP
            );
          `;
        } else if (tableName === 'chat_messages') {
          createTableSQL = `
            CREATE TABLE IF NOT EXISTS chat_messages (
              id SERIAL PRIMARY KEY,
              role TEXT NOT NULL,
              content TEXT NOT NULL,
              metadata JSONB NOT NULL DEFAULT '{}',
              created_at TIMESTAMP NOT NULL DEFAULT now()
            );
          `;
        } else if (tableName === 'command_history') {
          createTableSQL = `
            CREATE TABLE IF NOT EXISTS command_history (
              id SERIAL PRIMARY KEY,
              command TEXT NOT NULL,
              result JSONB NOT NULL DEFAULT '{}',
              status TEXT NOT NULL DEFAULT 'pending',
              processed_at TIMESTAMP,
              created_at TIMESTAMP NOT NULL DEFAULT now()
            );
          `;
        }
        
        if (createTableSQL) {
          await pool.query(createTableSQL);
          console.log(`Created table ${tableName}`);
        }
      } else {
        console.log(`Table ${tableName} already exists in PostgreSQL`);
      }
      
      // Enable RLS (Row Level Security) for the table
      const enableRlsSQL = `
        ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
      `;
      
      try {
        await pool.query(enableRlsSQL);
        console.log(`Enabled RLS for table ${tableName}`);
      } catch (err) {
        console.log(`Note: RLS might already be enabled for ${tableName} - ${err.message}`);
      }
      
      // Create policies to allow access
      const createPolicySQL = `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = '${tableName}' 
                AND policyname = '${tableName}_policy'
            ) THEN
                EXECUTE 'CREATE POLICY ${tableName}_policy ON ${tableName} USING (true) WITH CHECK (true)';
            END IF;
        END
        $$;
      `;
      
      try {
        await pool.query(createPolicySQL);
        console.log(`Created/ensured policy for table ${tableName}`);
      } catch (err) {
        console.log(`Note: Policy creation error for ${tableName} - ${err.message}`);
      }
      
      // Track the table in Supabase
      const trackTableSQL = `
        -- Enable realtime for this table
        BEGIN;
          DROP PUBLICATION IF EXISTS supabase_realtime;
          CREATE PUBLICATION supabase_realtime;
        COMMIT;
        
        -- Add table to publication
        ALTER PUBLICATION supabase_realtime ADD TABLE ${tableName};
        
        -- Configure realtime 
        COMMENT ON TABLE ${tableName} IS 'This table is tracked by Supabase realtime';
      `;
      
      try {
        await pool.query(trackTableSQL);
        console.log(`Tracked table ${tableName} in Supabase realtime`);
      } catch (err) {
        console.log(`Note: Table tracking error for ${tableName} - ${err.message}`);
      }
    }
    
    console.log('\nVerifying tables are accessible via Supabase client...');
    
    // Verify tables are accessible via Supabase client
    for (const tableName of tablesNeeded) {
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
    
    console.log('\nTable registration completed.');
    
  } catch (error) {
    console.error('Error registering Supabase tables:', error);
  } finally {
    // Close the PostgreSQL connection
    await pool.end();
  }
}

// Run the registration
registerTables()
  .then(() => console.log('Completed Supabase table registration'))
  .catch(err => console.error('Registration failed:', err));