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
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for admin access
supabase: Client = create_client(supabase_url, supabase_key)

def create_user_algorithm_table():
    """Create the user_algorithm table in Supabase."""
    try:
        # Create the user_algorithm table
        result = supabase.table('user_algorithm').select('*').limit(1).execute()
        
        if not result.data:
            # Table doesn't exist, create it
            supabase.table('user_algorithm').insert({
                'name': 'Default User Algorithm',
                'description': 'Default algorithm for processing user queries',
                'version': '1.0',
                'algorithm': 'def process_user_query(query, context=None):\n    return {"response": "Default response"}',
                'parameters': {},
                'is_active': True
            }).execute()
            
            logger.info("Created user_algorithm table with default algorithm")
        else:
            logger.info("user_algorithm table already exists")
    
    except Exception as e:
        logger.error(f"Error creating user_algorithm table: {str(e)}")
        raise

def create_training_data_algorithm_table():
    """Create the training_data_algorithm table in Supabase."""
    try:
        # Create the training_data_algorithm table
        result = supabase.table('training_data_algorithm').select('*').limit(1).execute()
        
        if not result.data:
            # Table doesn't exist, create it
            supabase.table('training_data_algorithm').insert({
                'name': 'Default Training Data Algorithm',
                'description': 'Default algorithm for generating training data',
                'version': '1.0',
                'algorithm': 'def generate_training_data(category, count=10):\n    return []',
                'parameters': {},
                'is_active': True
            }).execute()
            
            logger.info("Created training_data_algorithm table with default algorithm")
        else:
            logger.info("training_data_algorithm table already exists")
    
    except Exception as e:
        logger.error(f"Error creating training_data_algorithm table: {str(e)}")
        raise

def create_old_training_data_algorithms_table():
    """Create the old_training_data_algorithms table in Supabase."""
    try:
        # Create the old_training_data_algorithms table
        result = supabase.table('old_training_data_algorithms').select('*').limit(1).execute()
        
        if not result.data:
            # Table doesn't exist, create it
            supabase.table('old_training_data_algorithms').insert({
                'name': 'Initial Old Training Data Algorithm',
                'description': 'Initial backup of training data algorithm',
                'version': '1.0',
                'algorithm': 'def generate_training_data(category, count=10):\n    return []',
                'parameters': {},
                'is_active': False,
                'archived_date': 'now()'
            }).execute()
            
            logger.info("Created old_training_data_algorithms table with initial entry")
        else:
            logger.info("old_training_data_algorithms table already exists")
    
    except Exception as e:
        logger.error(f"Error creating old_training_data_algorithms table: {str(e)}")
        raise

def add_rating_and_feedback_to_training_data():
    """Add rating and feedback columns to the training_data table."""
    try:
        # Check if columns exist
        result = supabase.table('training_data').select('rating, feedback').limit(1).execute()
        
        if not result.data:
            # Columns don't exist, add them
            supabase.table('training_data').update({
                'rating': 0,
                'feedback': ''
            }).execute()
            
            logger.info("Added rating and feedback columns to training_data table")
        else:
            logger.info("Rating and feedback columns already exist in training_data table")
    
    except Exception as e:
        logger.error(f"Error adding rating and feedback columns: {str(e)}")
        raise

def create_system_training_table():
    """Create the system_training table in Supabase if it doesn't exist."""
    try:
        # Check if table exists
        result = supabase.table('system_training').select('*').limit(1).execute()
        
        if not result.data:
            # Table doesn't exist, create it
            supabase.table('system_training').insert({
                'category': 'default',
                'guidelines': {},
                'is_active': True
            }).execute()
            
            logger.info("Created system_training table with default entry")
        else:
            logger.info("system_training table already exists")
    
    except Exception as e:
        logger.error(f"Error creating system_training table: {str(e)}")
        raise

def main():
    """Main function to set up all algorithm tables in Supabase."""
    try:
        # Create all tables
        create_user_algorithm_table()
        create_training_data_algorithm_table()
        create_old_training_data_algorithms_table()
        add_rating_and_feedback_to_training_data()
        create_system_training_table()
        
        logger.info("Successfully set up all algorithm tables in Supabase")
    
    except Exception as e:
        logger.error(f"Error setting up algorithm tables: {str(e)}")
        raise

if __name__ == "__main__":
    main() 