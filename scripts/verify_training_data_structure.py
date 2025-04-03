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

def verify_table_structure():
    """Verify that the training_data table has the correct structure."""
    try:
        # Get table information
        response = supabase.table('training_data').select('*').limit(1).execute()
        
        if not response.data:
            logger.info("No data found in training_data table")
            return False
        
        # Check for required columns
        required_columns = [
            'query_rating', 'query_feedback',
            'response_rating', 'response_feedback',
            'endpoint_rating', 'endpoint_feedback'
        ]
        
        sample_row = response.data[0]
        missing_columns = [col for col in required_columns if col not in sample_row]
        
        if missing_columns:
            logger.error(f"Missing columns in training_data table: {missing_columns}")
            return False
        
        logger.info("All required columns are present in training_data table")
        return True
    except Exception as e:
        logger.error(f"Error verifying table structure: {str(e)}")
        return False

def verify_data():
    """Verify that the data in the training_data table is accessible."""
    try:
        # Get a sample of data
        response = supabase.table('training_data').select('*').limit(5).execute()
        
        if not response.data:
            logger.info("No data found in training_data table")
            return False
        
        logger.info("Sample data from training_data table:")
        for row in response.data:
            logger.info(f"ID: {row.get('id')}")
            logger.info(f"Query Rating: {row.get('query_rating')}")
            logger.info(f"Query Feedback: {row.get('query_feedback')}")
            logger.info(f"Response Rating: {row.get('response_rating')}")
            logger.info(f"Response Feedback: {row.get('response_feedback')}")
            logger.info(f"Endpoint Rating: {row.get('endpoint_rating')}")
            logger.info(f"Endpoint Feedback: {row.get('endpoint_feedback')}")
            logger.info("-" * 50)
        
        return True
    except Exception as e:
        logger.error(f"Error verifying data: {str(e)}")
        return False

def main():
    """Main function to verify the training data structure and data."""
    logger.info("Verifying training_data table structure...")
    structure_ok = verify_table_structure()
    
    if structure_ok:
        logger.info("Verifying training_data table data...")
        data_ok = verify_data()
        
        if data_ok:
            logger.info("Verification completed successfully")
        else:
            logger.error("Data verification failed")
    else:
        logger.error("Structure verification failed")

if __name__ == "__main__":
    main() 