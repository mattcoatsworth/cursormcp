import json
import os
import logging
import time
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for admin access
supabase: Client = create_client(supabase_url, supabase_key)

def load_training_data(file_path: str = 'supabase_training_data.json') -> List[Dict[str, Any]]:
    """Load training data from a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            training_data = json.load(f)
        logger.info(f"Loaded {len(training_data)} training entries from {file_path}")
        return training_data
    except Exception as e:
        logger.error(f"Error loading training data: {str(e)}")
        raise

def insert_training_data(training_data: List[Dict[str, Any]], batch_size: int = 10) -> int:
    """Insert training data into Supabase in batches."""
    total_inserted = 0
    
    # Process in batches
    for i in range(0, len(training_data), batch_size):
        batch = training_data[i:i+batch_size]
        logger.info(f"Inserting batch {i//batch_size + 1} of {(len(training_data) + batch_size - 1)//batch_size} ({len(batch)} entries) into training_data table")
        
        try:
            # Insert batch into Supabase
            result = supabase.table('training_data').insert(batch).execute()
            
            # Count inserted records
            inserted_count = len(result.data) if result.data else 0
            total_inserted += inserted_count
            
            logger.info(f"Successfully inserted {inserted_count} records into training_data table")
            
            # Add a small delay to avoid rate limiting
            time.sleep(0.5)
            
        except Exception as e:
            logger.error(f"Error inserting batch into training_data table: {str(e)}")
            # Continue with next batch even if this one fails
    
    return total_inserted

def main():
    """Main function to insert quality training data into Supabase."""
    try:
        # Load training data
        training_data = load_training_data()
        
        # Insert training data
        total_inserted = insert_training_data(training_data)
        
        logger.info(f"Inserted a total of {total_inserted} training entries into training_data table")
        
    except Exception as e:
        logger.error(f"Error inserting quality training data: {str(e)}")
        raise

if __name__ == "__main__":
    main() 