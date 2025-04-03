import os
import json
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

def check_training_data_algorithm():
    """Check if there's an algorithm in the training_data_algorithm table."""
    try:
        result = supabase.table('training_data_algorithm').select('*').execute()
        if result.data:
            logger.info("Found algorithm in training_data_algorithm table:")
            for algo in result.data:
                logger.info(f"Version: {algo.get('version')}")
                logger.info(f"Name: {algo.get('name')}")
                logger.info(f"Description: {algo.get('description')}")
                logger.info(f"Is Active: {algo.get('is_active')}")
        else:
            logger.info("No algorithm found in training_data_algorithm table")
    except Exception as e:
        logger.error(f"Error checking training_data_algorithm table: {str(e)}")

if __name__ == "__main__":
    check_training_data_algorithm() 