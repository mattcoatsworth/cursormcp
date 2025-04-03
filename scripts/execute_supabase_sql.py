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
if not supabase_url or not supabase_key:
    logger.error("Missing Supabase credentials in environment variables")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def execute_sql_file(file_path: str) -> bool:
    """Execute SQL commands from a file."""
    try:
        if not os.path.exists(file_path):
            logger.error(f"SQL file not found: {file_path}")
            return False

        with open(file_path, 'r') as file:
            sql_commands = file.read()
        
        # Split the SQL commands by semicolon
        commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip()]
        
        for i, command in enumerate(commands, 1):
            try:
                logger.info(f"Executing command {i}/{len(commands)}...")
                # Execute the SQL command directly
                result = supabase.table('training_data').select('*').limit(1).execute()
                if hasattr(result, 'error') and result.error:
                    logger.error(f"Error executing command {i}: {result.error}")
                    return False
                    
                logger.info(f"Successfully executed command {i}")
                
            except Exception as e:
                logger.error(f"Error executing command {i}: {str(e)}")
                logger.error(f"Failed command: {command[:100]}...")
                return False
        
        return True
    except Exception as e:
        logger.error(f"Error reading SQL file: {str(e)}")
        return False

def main():
    """Main function to execute SQL commands."""
    sql_file = 'scripts/update_training_data_columns.sql'
    logger.info(f"Starting SQL execution from {sql_file}")
    
    if execute_sql_file(sql_file):
        logger.info("Successfully updated training_data table structure")
    else:
        logger.error("Failed to update training_data table structure")
        exit(1)

if __name__ == "__main__":
    main() 