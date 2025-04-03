import os
import json
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("Missing Supabase credentials in .env file")
    return create_client(url, key)

def check_table_structure(supabase: Client):
    """Check the complete structure of the api_endpoints table."""
    logger.info("Checking api_endpoints table structure...")
    
    try:
        # SQL query to get table structure
        sql_query = """
        SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'api_endpoints'
        ORDER BY ordinal_position;
        """
        
        # Execute the query
        result = supabase.rpc('execute_sql', {'sql_command': sql_query}).execute()
        
        if result.data:
            logger.info("Table structure:")
            for column in result.data:
                logger.info(f"  - {column['column_name']}:")
                logger.info(f"    Type: {column['data_type']}")
                logger.info(f"    Nullable: {column['is_nullable']}")
                logger.info(f"    Default: {column['column_default']}")
                logger.info("")
        else:
            logger.warning("No table structure information found")
        
        logger.info("Table structure check completed")
        
    except Exception as e:
        logger.error(f"Error checking table structure: {str(e)}")
        raise

def main():
    """Main function to check table structure."""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Check table structure
        check_table_structure(supabase)
        
        logger.info("Process completed successfully")
        
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        raise

if __name__ == "__main__":
    main() 