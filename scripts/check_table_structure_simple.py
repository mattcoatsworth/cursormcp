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
    """Check the structure of the api_endpoints table."""
    logger.info("Checking api_endpoints table structure...")
    
    try:
        # Try to insert a test record with minimal required fields
        test_record = {
            "service": "test",
            "resource": "test",
            "action": "test",
            "method": "GET",
            "path": "/test",
            "parameters": {"test": "string"},
            "auth_type": "bearer"  # Added this field based on the error message
        }
        
        try:
            result = supabase.table("api_endpoints").insert(test_record).execute()
            logger.info("Test record inserted successfully")
            
            # Delete the test record
            if result.data:
                record_id = result.data[0]['id']
                supabase.table("api_endpoints").delete().eq('id', record_id).execute()
                logger.info("Test record deleted")
                
            # Show the table structure from the test record
            if result.data:
                logger.info("Table structure:")
                for key, value in result.data[0].items():
                    logger.info(f"  - {key}: {type(value).__name__}")
                    
        except Exception as e:
            logger.error(f"Error with test record: {str(e)}")
            # Try to get existing records instead
            result = supabase.table("api_endpoints").select("*").limit(1).execute()
            if result.data:
                logger.info("Table structure (from existing record):")
                for key, value in result.data[0].items():
                    logger.info(f"  - {key}: {type(value).__name__}")
            else:
                logger.warning("No records found in the table")
        
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