#!/usr/bin/env python3
"""
Script to remove all non-system context entries from the system_training table.
"""

import os
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

def cleanup_system_training():
    """Remove all non-system context entries from system_training table"""
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Delete all entries that are not system context
        result = supabase.table('system_training').delete().neq('category', 'system').execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"Error cleaning up system_training table: {result.error}")
        else:
            print("Successfully removed all non-system context entries")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response: {e.response.text if hasattr(e.response, 'text') else e.response}")

def main():
    """Main function"""
    print("Starting system_training table cleanup...")
    cleanup_system_training()
    print("Cleanup completed")

if __name__ == "__main__":
    main() 