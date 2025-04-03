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

def update_script(name: str, description: str, category: str, script_content: str, parameters: Dict[str, Any] = None) -> bool:
    """Update a script in the scripts table."""
    try:
        script_data = {
            'description': description,
            'script_content': script_content,
            'parameters': parameters or {}
        }
        
        # Update the script based on name and category
        supabase.table('scripts').update(script_data).eq('name', name).eq('category', category).execute()
        logger.info(f"Successfully updated script: {name}")
        return True
    except Exception as e:
        logger.error(f"Error updating script {name}: {str(e)}")
        return False

def read_script_file(file_path: str) -> str:
    """Read a script file and return its content."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        logger.error(f"Error reading script file {file_path}: {str(e)}")
        return ""

def update_all_scripts() -> bool:
    """Update all existing scripts in the scripts table."""
    scripts_to_update = [
        {
            'name': 'run_script_from_supabase',
            'description': 'Run scripts stored in the Supabase scripts table',
            'category': 'utility',
            'file_path': 'scripts/run_script_from_supabase.py',
            'parameters': {
                'list': {'type': 'boolean', 'description': 'List all available scripts'},
                'name': {'type': 'string', 'description': 'Name of the script to run'},
                'category': {'type': 'string', 'description': 'Category of the script to run'},
                'args': {'type': 'array', 'description': 'Arguments to pass to the script'}
            }
        },
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
    for script in scripts_to_update:
        script_content = read_script_file(script['file_path'])
        if script_content:
            if not update_script(
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
    """Main function to update scripts in the scripts table."""
    if update_all_scripts():
        logger.info("All scripts updated successfully")
    else:
        logger.error("Failed to update some scripts")

if __name__ == "__main__":
    main() 