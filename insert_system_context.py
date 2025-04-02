#!/usr/bin/env python3
"""
Script to insert system training guidelines into the system_training table.
"""

import os
import json
import uuid
from datetime import datetime
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

def insert_system_context():
    """Insert system context for warehouse/3PL operations"""
    try:
        # Load the system context file
        with open('system_training/warehouse_3pl_context.json', 'r') as f:
            context = json.load(f)
            
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Prepare the data
        data = {
            'id': str(uuid.uuid4()),
            'category': 'warehouse_3pl',
            'name': 'Warehouse and 3PL Operations Guidelines',
            'description': 'Guidelines for handling warehouse and 3PL operations, including fulfillment control and inventory management',
            'guidelines': {
                'general_guidelines': context['response']['general_guidelines'],
                'allowed_operations': context['response']['allowed_operations'],
                'workflow_guidelines': context['response']['workflow_guidelines'],
                'response_examples': context['response']['response_examples']
            },
            'tags': context['tags'],
            'source': context['source'],
            'version': 1,
            'is_active': True
        }
        
        # Insert the data
        result = supabase.table('system_training').insert(data).execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"Error inserting system context: {result.error}")
        else:
            print("Successfully inserted warehouse/3PL system guidelines")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response: {e.response.text if hasattr(e.response, 'text') else e.response}")

def main():
    """Main function"""
    print("Inserting warehouse/3PL system guidelines...")
    insert_system_context()

if __name__ == "__main__":
    main() 