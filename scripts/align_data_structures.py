import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
import requests

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def connect_to_supabase() -> Client:
    """Connect to Supabase"""
    load_dotenv()
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
    
    return create_client(supabase_url, supabase_key)

def execute_sql(supabase_url: str, supabase_key: str, sql: str) -> bool:
    """Execute SQL directly using REST API"""
    try:
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
        return True
        
    except Exception as e:
        logger.error(f"Error executing SQL: {e}")
        return False

def align_data_structures(supabase: Client) -> bool:
    """Align the data structures of training_data, user_data, and system_training tables"""
    try:
        logger.info("Starting data structure alignment...")
        
        # Read the SQL script
        with open('scripts/align_data_structures.sql', 'r') as file:
            sql = file.read()
            
        # Execute the SQL
        success = execute_sql(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
            sql
        )
        
        if not success:
            raise Exception("Failed to execute SQL")
            
        logger.info("SQL executed successfully")
        
        # Verify the changes
        verify_changes(supabase)
        
        return True
        
    except Exception as e:
        logger.error(f"Error aligning data structures: {e}")
        return False

def verify_changes(supabase: Client) -> None:
    """Verify that the changes were applied correctly"""
    try:
        # Check training_data table
        result = supabase.table('training_data').select('*').limit(1).execute()
        logger.info("Training data table structure verified")
        
        # Check user_data table
        result = supabase.table('user_data').select('*').limit(1).execute()
        logger.info("User data table structure verified")
        
        # Check combined view
        result = supabase.table('combined_training_view').select('*').limit(1).execute()
        logger.info("Combined training view verified")
        
        logger.info("All data structures aligned successfully!")
        
    except Exception as e:
        logger.error(f"Error verifying changes: {e}")
        raise

def main():
    """Main function"""
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        logger.info("Connected to Supabase")
        
        # Align data structures
        success = align_data_structures(supabase)
        
        if success:
            logger.info("Data structure alignment completed successfully")
        else:
            logger.error("Data structure alignment failed")
            
    except Exception as e:
        logger.error(f"Error in main: {e}")
        raise

if __name__ == "__main__":
    main() 