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

def read_script_file(file_path: str) -> str:
    """Read the contents of a script file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        logger.error(f"Error reading script file: {str(e)}")
        raise

def insert_script():
    """Insert the analysis script into the scripts table."""
    try:
        # Read the analysis script
        script_content = read_script_file('scripts/analyze_training_data.py')
        
        # Prepare the script data
        script_data = {
            'name': 'Training Data Analysis Script',
            'description': 'Analyzes training data ratings and feedback, including both old and new rating systems',
            'category': 'analysis',
            'script_content': script_content,
            'parameters': {
                'limit': {
                    'type': 'integer',
                    'default': 100,
                    'description': 'Maximum number of training data entries to analyze'
                }
            },
            'is_active': True
        }
        
        # Insert into scripts table
        result = supabase.table('scripts').insert(script_data).execute()
        
        if hasattr(result, 'error') and result.error:
            logger.error(f"Error inserting script: {result.error}")
            return False
        
        logger.info("Successfully inserted analysis script into scripts table")
        return True
        
    except Exception as e:
        logger.error(f"Error inserting script: {str(e)}")
        return False

def main():
    """Main function to insert the analysis script."""
    if insert_script():
        logger.info("Script insertion completed successfully")
    else:
        logger.error("Script insertion failed")

if __name__ == "__main__":
    main() 