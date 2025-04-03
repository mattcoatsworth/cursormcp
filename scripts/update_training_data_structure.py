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

def execute_sql_file(file_path: str) -> bool:
    """Execute SQL commands from a file."""
    try:
        with open(file_path, 'r') as file:
            sql_commands = file.read()
        
        # Split the SQL commands by semicolon
        commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip()]
        
        for command in commands:
            try:
                supabase.rpc('execute_sql', {'sql': command}).execute()
                logger.info(f"Successfully executed SQL command: {command[:50]}...")
            except Exception as e:
                logger.error(f"Error executing SQL command: {str(e)}")
                return False
        
        return True
    except Exception as e:
        logger.error(f"Error reading SQL file: {str(e)}")
        return False

def main():
    """Main function to update the training_data table structure."""
    sql_file = 'scripts/add_training_data_columns.sql'
    if execute_sql_file(sql_file):
        logger.info("Successfully updated training_data table structure")
    else:
        logger.error("Failed to update training_data table structure")

if __name__ == "__main__":
    main() 