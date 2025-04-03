import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    load_dotenv()
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("Missing Supabase credentials in environment variables")
    
    return create_client(url, key)

def check_table_structure(supabase: Client):
    """Check the structure of the training_data table."""
    try:
        # Execute the SQL query
        query = """
        SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
        FROM 
            information_schema.columns 
        WHERE 
            table_schema = 'public' 
            AND table_name = 'training_data'
        ORDER BY 
            ordinal_position;
        """
        
        result = supabase.table('training_data').select("*").limit(1).execute()
        
        if hasattr(result, 'error') and result.error:
            logger.error(f"Error checking table structure: {result.error}")
        else:
            # Get the columns from the result
            if result.data:
                columns = result.data[0].keys()
                logger.info("Table structure:")
                for column in columns:
                    logger.info(f"- {column}")
            else:
                logger.info("Table exists but is empty")
        
    except Exception as e:
        logger.error(f"Error checking table structure: {str(e)}")
        raise

def main():
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Check table structure
        check_table_structure(supabase)
        
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        raise

if __name__ == '__main__':
    main() 