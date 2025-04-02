import { supabase } from '../supabase.js';
import { storeEndpointsInSupabase } from './api_endpoints.js';
import type { Database } from '../../shared/database.types.js';

declare const process: {
  exit: (code: number) => never;
};

async function createApiEndpointsTable() {
  const { error } = await supabase.rpc('create_api_endpoints_table', {
    sql: `
      CREATE TABLE IF NOT EXISTS api_endpoints (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        service TEXT NOT NULL,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        parameters JSONB DEFAULT '{}',
        auth_type TEXT NOT NULL,
        auth_key TEXT NOT NULL,
        rate_limit TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
        UNIQUE(service, resource, action)
      );

      CREATE INDEX IF NOT EXISTS idx_api_endpoints_service ON api_endpoints(service);
      CREATE INDEX IF NOT EXISTS idx_api_endpoints_resource ON api_endpoints(resource);
      CREATE INDEX IF NOT EXISTS idx_api_endpoints_action ON api_endpoints(action);
    `
  });

  if (error) {
    throw error;
  }
}

async function migrateEndpoints() {
  try {
    console.log('Creating api_endpoints table...');
    await createApiEndpointsTable();

    console.log('Storing endpoints in Supabase...');
    await storeEndpointsInSupabase(supabase);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  migrateEndpoints()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateEndpoints }; 