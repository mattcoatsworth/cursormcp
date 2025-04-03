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

def verify_tables():
    """Verify that all required tables exist in Supabase."""
    tables = [
        'user_algorithm',
        'training_data_algorithm',
        'old_training_data_algorithms',
        'system_training'
    ]
    
    all_tables_exist = True
    
    for table in tables:
        try:
            # Try to select from the table
            result = supabase.table(table).select('*').limit(1).execute()
            logger.info(f"✅ Table '{table}' exists")
        except Exception as e:
            logger.error(f"❌ Table '{table}' does not exist: {str(e)}")
            all_tables_exist = False
    
    # Check if training_data table has rating and feedback columns
    try:
        result = supabase.table('training_data').select('rating,feedback').limit(1).execute()
        logger.info("✅ 'training_data' table has 'rating' and 'feedback' columns")
    except Exception as e:
        logger.error(f"❌ 'training_data' table does not have 'rating' and 'feedback' columns: {str(e)}")
        all_tables_exist = False
    
    if all_tables_exist:
        logger.info("✅ All required tables exist in Supabase")
    else:
        logger.error("❌ Some tables are missing. Please check the logs above.")
    
    return all_tables_exist

if __name__ == "__main__":
    verify_tables() 