import os
import json
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("Missing Supabase credentials in .env file")
    return create_client(url, key)

def read_sql_file(file_path):
    """Read SQL file content."""
    with open(file_path, 'r') as file:
        return file.read()

def execute_sql_commands(supabase: Client, sql_commands: str):
    """Execute SQL commands using Supabase client."""
    logger.info("Executing SQL commands...")
    
    try:
        # Split the SQL commands by semicolon to execute them separately
        commands = sql_commands.split(';')
        
        for command in commands:
            command = command.strip()
            if command:
                logger.info(f"Executing command: {command[:100]}...")
                result = supabase.rpc('execute_sql', {'sql_command': command}).execute()
                logger.info(f"Command executed successfully: {result}")
        
        logger.info("All SQL commands executed successfully")
        
    except Exception as e:
        logger.error(f"Error executing SQL commands: {str(e)}")
        raise

def main():
    """Main function to insert WhatsApp endpoints."""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Read SQL file
        sql_file_path = os.path.join('scripts', 'insert_whatsapp_endpoints.sql')
        sql_commands = read_sql_file(sql_file_path)
        
        # Execute SQL commands
        execute_sql_commands(supabase, sql_commands)
        
        logger.info("WhatsApp endpoints inserted successfully")
        
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        raise

if __name__ == "__main__":
    main() 