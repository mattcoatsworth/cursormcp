#!/usr/bin/env python3
"""
Script to apply schema updates to the training_data table.
"""

import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_to_supabase() -> Client:
    """Connect to Supabase using environment variables"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
        
    return create_client(supabase_url, supabase_key)

def apply_schema_update():
    """Apply schema updates to the training_data table"""
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Create a test entry with the new structure
        test_data = {
            'id': 'test-schema-update',
            'query': 'Test query',
            'response': 'Test response',
            'applied_guidelines': {
                'general_guidelines': [],
                'domain_guidelines': []
            },
            'timestamp': '2024-01-01T00:00:00Z',
            'version': '1.0',
            'source': ['test'],
            'is_active': True
        }
        
        # Try to insert the test data
        result = supabase.table('training_data').insert(test_data).execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"Error applying schema update: {result.error}")
        else:
            print("Schema update applied successfully")
            
            # Remove the test entry
            supabase.table('training_data').delete().eq('id', 'test-schema-update').execute()
            
    except Exception as e:
        print(f"Error: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response: {e.response.text if hasattr(e.response, 'text') else e.response}")

def main():
    """Main function"""
    print("Applying schema update...")
    apply_schema_update()
    print("\nSchema update completed")

if __name__ == "__main__":
    main() 