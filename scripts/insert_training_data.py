import os
import json
import logging
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("Missing Supabase credentials in environment variables")
    return create_client(url, key)

def insert_training_data(supabase: Client, training_data: List[Dict[str, Any]]) -> None:
    """Insert training data into Supabase."""
    try:
        # Insert data in batches of 10
        batch_size = 10
        for i in range(0, len(training_data), batch_size):
            batch = training_data[i:i + batch_size]
            logger.info(f"Inserting batch {i//batch_size + 1} of {(len(training_data) + batch_size - 1)//batch_size}...")
            
            # Insert the batch
            result = supabase.table('training_data').insert(batch).execute()
            
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Error inserting batch: {result.error}")
            
            logger.info(f"Successfully inserted {len(batch)} records")
            
    except Exception as e:
        logger.error(f"Error inserting training data: {str(e)}")
        raise

def main():
    """Main function to insert training data."""
    try:
        # Load training data
        with open('training_data.json', 'r', encoding='utf-8') as f:
            training_data = json.load(f)
        logger.info(f"Loaded {len(training_data)} training entries")
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Insert training data
        insert_training_data(supabase, training_data)
        logger.info("Training data insertion completed successfully")
        
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        raise

if __name__ == "__main__":
    main() 