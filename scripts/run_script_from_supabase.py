import os
import sys
import json
import logging
import argparse
import tempfile
import subprocess
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

def get_script(name: str, category: str = None) -> Dict[str, Any]:
    """Get a script from the scripts table."""
    try:
        query = supabase.table('scripts').select('*').eq('name', name)
        if category:
            query = query.eq('category', category)
        
        result = query.execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        else:
            logger.error(f"Script not found: {name}" + (f" in category {category}" if category else ""))
            return None
    except Exception as e:
        logger.error(f"Error getting script: {str(e)}")
        return None

def list_scripts(category: str = None) -> List[Dict[str, Any]]:
    """List all scripts in the scripts table."""
    try:
        query = supabase.table('scripts').select('*')
        if category:
            query = query.eq('category', category)
        
        result = query.execute()
        return result.data
    except Exception as e:
        logger.error(f"Error listing scripts: {str(e)}")
        return []

def run_script(script: Dict[str, Any], args: List[str] = None) -> bool:
    """Run a script from the scripts table."""
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix='.py', delete=False) as temp_file:
            # Write the script content to the temporary file
            temp_file.write(script['script_content'].encode('utf-8'))
            temp_file_path = temp_file.name
        
        # Build the command
        cmd = [sys.executable, temp_file_path]
        if args:
            cmd.extend(args)
        
        # Run the script
        logger.info(f"Running script: {script['name']}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # Print the output
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        
        # Clean up
        os.unlink(temp_file_path)
        
        return result.returncode == 0
    except Exception as e:
        logger.error(f"Error running script: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Run a script from the Supabase scripts table')
    parser.add_argument('--list', action='store_true', help='List all available scripts')
    parser.add_argument('--category', type=str, help='Category of scripts to list or run')
    parser.add_argument('--name', type=str, help='Name of the script to run')
    parser.add_argument('args', nargs=argparse.REMAINDER, help='Arguments to pass to the script')
    
    args = parser.parse_args()
    
    if args.list:
        # List all scripts
        scripts = list_scripts(args.category)
        if scripts:
            print("\nAvailable scripts:")
            print("-" * 80)
            for script in scripts:
                print(f"Name: {script['name']}")
                print(f"Category: {script['category']}")
                print(f"Description: {script['description']}")
                print("-" * 80)
        else:
            print("No scripts found.")
    elif args.name:
        # Run a specific script
        script = get_script(args.name, args.category)
        if script:
            run_script(script, args.args)
        else:
            print(f"Script not found: {args.name}")
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 