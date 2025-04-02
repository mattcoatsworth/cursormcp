#!/usr/bin/env python3
"""
Script to reformat system context entries according to the new categorization plan.
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

def categorize_guidelines(entry):
    """Determine the appropriate category and format for an entry"""
    # Keep warehouse/3PL entry as is
    if entry['category'] == 'warehouse_3pl':
        return entry
        
    # Analyze content to determine category
    guidelines = entry.get('guidelines', {})
    general_guidelines = guidelines.get('general_guidelines', [])
    
    # Determine category based on content
    if any('response' in str(g).lower() or 'tone' in str(g).lower() for g in general_guidelines):
        return {
            'category': 'system_response',
            'name': 'System - Response Generation Guidelines',
            'description': 'Core guidelines for generating high-quality, consistent responses across all system interactions, including tone, structure, and content standards',
            'tags': ['system_context', 'response_guidelines', 'tone_standards']
        }
    elif any('data' in str(g).lower() or 'validation' in str(g).lower() for g in general_guidelines):
        return {
            'category': 'data_handling',
            'name': 'System - Data Processing Guidelines',
            'description': 'Guidelines for handling and processing data across the system, including validation, transformation, and error handling procedures',
            'tags': ['system_context', 'data_guidelines', 'validation']
        }
    elif any('api' in str(g).lower() or 'endpoint' in str(g).lower() for g in general_guidelines):
        return {
            'category': 'api_integration',
            'name': 'System - API Interaction Guidelines',
            'description': 'Guidelines for interacting with external APIs, including authentication, rate limiting, and response handling',
            'tags': ['system_context', 'api_guidelines', 'integration']
        }
    elif any('error' in str(g).lower() or 'exception' in str(g).lower() for g in general_guidelines):
        return {
            'category': 'error_handling',
            'name': 'System - Error Handling Guidelines',
            'description': 'Guidelines for detecting, reporting, and handling errors across the system, including recovery procedures',
            'tags': ['system_context', 'error_guidelines', 'recovery']
        }
    else:
        # Default to system response if no specific category is determined
        return {
            'category': 'system_response',
            'name': 'System - Response Generation Guidelines',
            'description': 'Core guidelines for generating high-quality, consistent responses across all system interactions',
            'tags': ['system_context', 'response_guidelines']
        }

def reformat_system_context():
    """Reformat all system context entries according to the new categorization plan"""
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Get all entries from system_training
        result = supabase.table('system_training').select('*').execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"Error fetching system training data: {result.error}")
            return
            
        # Process each entry
        for entry in result.data:
            # Skip if already properly categorized
            if entry['category'] in ['warehouse_3pl', 'system_response', 'data_handling', 'api_integration', 'error_handling']:
                continue
                
            # Determine new category and format
            new_format = categorize_guidelines(entry)
            
            # Update the entry
            update_data = {
                'category': new_format['category'],
                'name': new_format['name'],
                'description': new_format['description'],
                'tags': new_format['tags']
            }
            
            # Keep existing guidelines and other fields
            update_data['guidelines'] = entry['guidelines']
            update_data['source'] = entry.get('source', ['system_training'])
            update_data['version'] = entry.get('version', 1)
            update_data['is_active'] = entry.get('is_active', True)
            
            # Update the entry in Supabase
            update_result = supabase.table('system_training').update(update_data).eq('id', entry['id']).execute()
            
            if hasattr(update_result, 'error') and update_result.error:
                print(f"Error updating entry {entry['id']}: {update_result.error}")
            else:
                print(f"Successfully reformatted entry {entry['id']} to category: {new_format['category']}")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response: {e.response.text if hasattr(e.response, 'text') else e.response}")

def main():
    """Main function"""
    print("Reformatting system context entries...")
    reformat_system_context()
    print("\nReformatting completed")

if __name__ == "__main__":
    main() 