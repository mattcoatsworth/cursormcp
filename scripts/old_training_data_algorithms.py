import os
import json
import logging
import argparse
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

def get_old_algorithms(limit: int = 10) -> List[Dict[str, Any]]:
    """Get old training data algorithms from Supabase."""
    try:
        # Query old algorithms
        result = supabase.table('old_training_data_algorithms').select('*').order('archived_date', desc=True).limit(limit).execute()
        
        # Return the data
        return result.data
    except Exception as e:
        logger.error(f"Error getting old algorithms: {str(e)}")
        raise

def get_algorithm_by_version(version: str) -> Dict[str, Any]:
    """Get a specific old algorithm by version."""
    try:
        # Query the algorithm
        result = supabase.table('old_training_data_algorithms').select('*').eq('version', version).execute()
        
        # Return the algorithm if found
        if result.data:
            return result.data[0]
        else:
            logger.warning(f"No algorithm found with version {version}")
            return {}
    except Exception as e:
        logger.error(f"Error getting algorithm by version: {str(e)}")
        raise

def restore_algorithm(version: str) -> bool:
    """Restore an old algorithm to the training_data_algorithm table."""
    try:
        # Get the old algorithm
        old_algorithm = get_algorithm_by_version(version)
        
        if not old_algorithm:
            logger.error(f"Cannot restore algorithm: No algorithm found with version {version}")
            return False
        
        # Get the current active algorithm
        result = supabase.table('training_data_algorithm').select('*').eq('is_active', True).execute()
        
        if result.data:
            current_algorithm = result.data[0]
            
            # Archive the current algorithm
            old_algorithm_entry = {
                'name': current_algorithm.get('name', ''),
                'description': current_algorithm.get('description', ''),
                'version': current_algorithm.get('version', ''),
                'algorithm': current_algorithm.get('algorithm', ''),
                'parameters': current_algorithm.get('parameters', {}),
                'is_active': False,
                'archived_date': 'now()'
            }
            
            # Insert into old_training_data_algorithms
            supabase.table('old_training_data_algorithms').insert(old_algorithm_entry).execute()
        
        # Create the restored algorithm entry
        restored_algorithm_entry = {
            'name': old_algorithm.get('name', ''),
            'description': old_algorithm.get('description', ''),
            'version': old_algorithm.get('version', ''),
            'algorithm': old_algorithm.get('algorithm', ''),
            'parameters': old_algorithm.get('parameters', {}),
            'is_active': True
        }
        
        # Insert into training_data_algorithm
        result = supabase.table('training_data_algorithm').insert(restored_algorithm_entry).execute()
        
        # Check if the insert was successful
        return len(result.data) > 0
    except Exception as e:
        logger.error(f"Error restoring algorithm: {str(e)}")
        raise

def delete_old_algorithm(version: str) -> bool:
    """Delete an old algorithm from the old_training_data_algorithms table."""
    try:
        # Delete the algorithm
        result = supabase.table('old_training_data_algorithms').delete().eq('version', version).execute()
        
        # Check if the delete was successful
        return len(result.data) > 0
    except Exception as e:
        logger.error(f"Error deleting old algorithm: {str(e)}")
        raise

def list_old_algorithms():
    """List all old algorithms."""
    try:
        # Get old algorithms
        old_algorithms = get_old_algorithms(limit=100)
        
        if not old_algorithms:
            logger.info("No old algorithms found")
            return
        
        # Display the algorithms
        print("\nOld Training Data Algorithms:")
        print("=" * 80)
        for algorithm in old_algorithms:
            print(f"Version: {algorithm.get('version', '')}")
            print(f"Name: {algorithm.get('name', '')}")
            print(f"Description: {algorithm.get('description', '')}")
            print(f"Archived Date: {algorithm.get('archived_date', '')}")
            print("-" * 80)
    
    except Exception as e:
        logger.error(f"Error listing old algorithms: {str(e)}")
        raise

def main():
    """Main function to manage old training data algorithms."""
    parser = argparse.ArgumentParser(description='Manage old training data algorithms')
    parser.add_argument('--list', action='store_true', help='List all old algorithms')
    parser.add_argument('--restore', type=str, help='Restore an old algorithm by version')
    parser.add_argument('--delete', type=str, help='Delete an old algorithm by version')
    args = parser.parse_args()
    
    try:
        if args.list:
            # List all old algorithms
            list_old_algorithms()
        elif args.restore:
            # Restore an old algorithm
            success = restore_algorithm(args.restore)
            
            if success:
                logger.info(f"Successfully restored algorithm version {args.restore}")
            else:
                logger.error(f"Failed to restore algorithm version {args.restore}")
        elif args.delete:
            # Delete an old algorithm
            success = delete_old_algorithm(args.delete)
            
            if success:
                logger.info(f"Successfully deleted algorithm version {args.delete}")
            else:
                logger.error(f"Failed to delete algorithm version {args.delete}")
        else:
            logger.error("Either --list, --restore, or --delete must be provided")
    
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        raise

if __name__ == "__main__":
    main() 