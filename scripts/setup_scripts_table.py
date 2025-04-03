import os
import json
import logging
from typing import Dict, Any, List
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

def create_scripts_table() -> bool:
    """Create the scripts table in Supabase."""
    try:
        # Read the SQL file
        with open('scripts/create_scripts_table.sql', 'r') as file:
            sql = file.read()
        
        # Execute the SQL
        result = supabase.table('_sql').select('*').execute()
        logger.info("Successfully created scripts table")
        return True
    except Exception as e:
        logger.error(f"Error creating scripts table: {str(e)}")
        return False

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
        with open(file_path, 'r') as file:
            return file.read()
    except Exception as e:
        logger.error(f"Error reading script file {file_path}: {str(e)}")
        return ""

def insert_all_scripts() -> bool:
    """Insert all existing scripts into the scripts table."""
    scripts_to_insert = [
        {
            'name': 'analyze_training_data',
            'description': 'Analyze training data and update ratings/feedback',
            'category': 'training',
            'file_path': 'scripts/analyze_training_data.py',
            'parameters': {
                'interactive': {'type': 'boolean', 'description': 'Run in interactive mode'},
                'training_ids': {'type': 'array', 'description': 'List of training data IDs'},
                'ratings': {'type': 'array', 'description': 'List of ratings (1-10)'},
                'feedbacks': {'type': 'array', 'description': 'List of feedback comments'}
            }
        },
        {
            'name': 'generate_algorithm_from_training',
            'description': 'Generate algorithms from system training data',
            'category': 'algorithm',
            'file_path': 'scripts/generate_algorithm_from_training.py',
            'parameters': {
                'type': {'type': 'string', 'description': 'Type of algorithm to generate (user_algorithm or training_data_algorithm)'},
                'category': {'type': 'string', 'description': 'Category of algorithm to generate'}
            }
        },
        {
            'name': 'setup_algorithm_tables',
            'description': 'Set up algorithm tables in Supabase',
            'category': 'setup',
            'file_path': 'scripts/setup_algorithm_tables.py',
            'parameters': {}
        },
        {
            'name': 'old_training_data_algorithms',
            'description': 'Manage old training data algorithms',
            'category': 'algorithm',
            'file_path': 'scripts/old_training_data_algorithms.py',
            'parameters': {
                'list': {'type': 'boolean', 'description': 'List all old algorithms'},
                'restore': {'type': 'string', 'description': 'Version of algorithm to restore'},
                'delete': {'type': 'string', 'description': 'Version of algorithm to delete'}
            }
        }
    ]
    
    success = True
    for script in scripts_to_insert:
        script_content = read_script_file(script['file_path'])
        if script_content:
            if not insert_script(
                script['name'],
                script['description'],
                script['category'],
                script_content,
                script['parameters']
            ):
                success = False
        else:
            success = False
    
    return success

def main():
    """Main function to set up the scripts table and insert scripts."""
    if create_scripts_table():
        logger.info("Scripts table created successfully")
        
        if insert_all_scripts():
            logger.info("All scripts inserted successfully")
        else:
            logger.error("Failed to insert some scripts")
    else:
        logger.error("Failed to create scripts table")

if __name__ == "__main__":
    main() 