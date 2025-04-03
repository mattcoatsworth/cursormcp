import os
import json
import logging
from typing import Dict, Any
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

def insert_script(name: str, description: str, category: str, script_content: str, parameters: Dict[str, Any] = None) -> bool:
    """Insert a script into the scripts table."""
    try:
        script_data = {
            'name': name,
            'description': description,
            'category': category,
            'script_content': script_content,
            'parameters': parameters or {}
        }
        
        supabase.table('scripts').insert(script_data).execute()
        logger.info(f"Successfully inserted script: {name}")
        return True
    except Exception as e:
        logger.error(f"Error inserting script {name}: {str(e)}")
        return False

def read_script_file(file_path: str) -> str:
    """Read a script file and return its content."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        logger.error(f"Error reading script file {file_path}: {str(e)}")
        return ""

def main():
    """Insert the analyze_training_data script into the scripts table."""
    script_name = 'analyze_training_data'
    script_description = 'Analyze training data and update ratings/feedback'
    script_category = 'training'
    script_file_path = 'scripts/analyze_training_data.py'
    script_parameters = {
        'interactive': {'type': 'boolean', 'description': 'Run in interactive mode'},
        'training_ids': {'type': 'array', 'description': 'List of training data IDs'},
        'ratings': {'type': 'array', 'description': 'List of ratings (1-10)'},
        'feedbacks': {'type': 'array', 'description': 'List of feedback comments'}
    }
    
    script_content = read_script_file(script_file_path)
    if script_content:
        if insert_script(
            script_name,
            script_description,
            script_category,
            script_content,
            script_parameters
        ):
            logger.info(f"Successfully inserted {script_name} script")
        else:
            logger.error(f"Failed to insert {script_name} script")
    else:
        logger.error(f"Failed to read {script_file_path}")

if __name__ == "__main__":
    main() 