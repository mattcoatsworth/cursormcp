import os
import logging
from dotenv import load_dotenv
import requests

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_sql_function():
    """Set up the execute_sql function in Supabase"""
    try:
        # Load environment variables
        load_dotenv()
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        
        # Read the SQL script
        with open('scripts/setup_sql_function.sql', 'r') as file:
            sql = file.read()
        
        # Set up headers
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        
        # Remove any trailing slashes from URL
        supabase_url = supabase_url.rstrip('/')
        
        # Execute SQL using REST API
        response = requests.post(
            f"{supabase_url}/rest/v1/rpc/execute_sql",
            headers=headers,
            json={'query': sql}
        )
        
        response.raise_for_status()
        logger.info("SQL function setup successful!")
        
    except Exception as e:
        logger.error(f"Error setting up SQL function: {e}")
        raise

if __name__ == "__main__":
    setup_sql_function() 