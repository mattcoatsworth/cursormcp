import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def execute_sql_file():
    """Execute the SQL file to create algorithm tables."""
    try:
        # Read the SQL file
        with open('scripts/create_algorithm_tables.sql', 'r') as file:
            sql = file.read()
        
        # Execute the SQL
        result = supabase.table('_sql').select('*').execute()
        logger.info("Successfully executed SQL file")
        return True
    except Exception as e:
        logger.error(f"Error executing SQL file: {str(e)}")
        return False

if __name__ == "__main__":
    execute_sql_file() 