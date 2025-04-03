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

def check_training_data():
    """Check for training data with ratings and feedback."""
    try:
        # Get entries where either rating or feedback is not null
        result = supabase.table('training_data').select('*').or_(
            'rating.is.not.null,feedback.is.not.null'
        ).execute()
        
        if result.data:
            logger.info(f"Found {len(result.data)} training data entries with ratings or feedback:")
            for entry in result.data:
                logger.info(f"ID: {entry.get('id')}")
                logger.info(f"Rating: {entry.get('rating')}")
                logger.info(f"Feedback: {entry.get('feedback')}")
                logger.info("-" * 50)
        else:
            logger.info("No training data entries found with ratings or feedback")
    except Exception as e:
        logger.error(f"Error checking training data: {str(e)}")

if __name__ == "__main__":
    check_training_data() 