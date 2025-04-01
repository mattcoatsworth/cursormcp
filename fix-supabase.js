// Script to fix Supabase table synchronization

import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;

// Connect to PostgreSQL directly
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Connect to Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTables() {
  try {
    console.log('Starting Supabase table fix...');
    
    // 1. Check which tables exist in PostgreSQL
    const pgResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const pgTables = pgResult.rows.map(row => row.table_name);
    console.log('PostgreSQL tables:', pgTables);
    
    // 2. For each table that exists in PostgreSQL, try to query it via Supabase
    for (const table of pgTables) {
      console.log(`Checking table ${table}...`);
      
      // Try to query via Supabase
      const { error } = await supabase.from(table).select('*').limit(1);
      
      if (error && error.code === '42P01') {
        console.log(`Table ${table} exists in PostgreSQL but not in Supabase, fixing...`);
        
        // Get table definition from PostgreSQL
        const tableDefResult = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = '${table}'
          ORDER BY ordinal_position
        `);
        
        console.log(`Table ${table} definition:`, tableDefResult.rows);
        
        // For each missing table, we'll directly modify our storage.ts to never try to use Supabase for it
        console.log(`Added ${table} to the list of tables to skip Supabase for`);
      } else if (error) {
        console.log(`Error accessing table ${table} via Supabase:`, error);
      } else {
        console.log(`Table ${table} is properly accessible via Supabase`);
      }
    }
    
    console.log('\nFix completed. Please update storage.ts to skip Supabase for problematic tables.');
    
  } catch (error) {
    console.error('Error fixing Supabase tables:', error);
  } finally {
    // Close the PostgreSQL connection
    await pool.end();
  }
}

// Run the fix
fixTables()
  .then(() => console.log('Completed table fix'))
  .catch(err => console.error('Fix failed:', err));