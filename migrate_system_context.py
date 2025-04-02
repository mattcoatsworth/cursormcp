#!/usr/bin/env python3
"""
Script to migrate system context data from training_data to system_training table.
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

def is_system_context(entry: dict) -> bool:
    """Check if an entry contains system context data"""
    # Check if it's a system context entry
    if entry.get('tool', '').lower() == 'system' and entry.get('intent', '').lower() == 'context':
        return True
    
    # Check if the response contains system context information
    response = entry.get('response', '')
    if isinstance(response, str):
        return 'system context' in response.lower() or 'guidelines' in response.lower()
    
    return False

def create_system_context(entry: dict) -> dict:
    """Create system context from training data entry"""
    # Extract the system context data
    response = entry.get('response', '')
    
    # Try to parse the response as JSON if it's a string
    try:
        if isinstance(response, str):
            response_data = json.loads(response)
        else:
            response_data = response
    except json.JSONDecodeError:
        response_data = {'general_guidelines': [response]}
    
    # Create the system context entry
    return {
        'id': str(uuid.uuid4()),
        'category': 'system',
        'name': 'System Guidelines',
        'description': 'System guidelines and training data for interpreting and responding to queries',
        'guidelines': {
            'general_guidelines': response_data.get('general_guidelines', [response] if isinstance(response, str) else []),
            'allowed_operations': response_data.get('allowed_operations', []),
            'workflow_guidelines': response_data.get('workflow_guidelines', []),
            'response_examples': response_data.get('response_examples', [])
        },
        'tags': ['system_context', 'guidelines'],
        'source': [entry.get('metadata', {}).get('source', 'training_data')],
        'version': 1,
        'is_active': True
    }

def migrate_system_context():
    """Migrate system context data from training_data to system_training"""
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Get all entries from training_data
        result = supabase.table('training_data').select('*').execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"Error fetching training data: {result.error}")
            return
            
        # Process each entry
        for entry in result.data:
            # Only process system context entries
            if is_system_context(entry):
                # Create system context from the entry
                system_context = create_system_context(entry)
                
                # Insert into system_training
                insert_result = supabase.table('system_training').insert(system_context).execute()
                
                if hasattr(insert_result, 'error') and insert_result.error:
                    print(f"Error inserting system context: {insert_result.error}")
                else:
                    print(f"Successfully migrated system context from training data ID: {entry['id']}")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response: {e.response.text if hasattr(e.response, 'text') else e.response}")

def main():
    """Main function"""
    print("Starting system context migration...")
    migrate_system_context()
    print("Migration completed")

if __name__ == "__main__":
    main() 