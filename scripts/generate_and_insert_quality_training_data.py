import os
import logging
import argparse
from generate_quality_training_data import QualityTrainingDataGenerator
from insert_quality_training_data import insert_training_data

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def insert_into_supabase(data, table_name, batch_size=10):
    """Insert data into specified Supabase table."""
    from supabase import create_client, Client
    from dotenv import load_dotenv
    
    # Load environment variables
    load_dotenv()
    
    # Initialize Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for admin access
    supabase: Client = create_client(supabase_url, supabase_key)
    
    total_inserted = 0
    
    # Process in batches
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        logger.info(f"Inserting batch {i//batch_size + 1} of {(len(data) + batch_size - 1)//batch_size} ({len(batch)} entries) into {table_name}")
        
        try:
            # Insert batch into Supabase
            result = supabase.table(table_name).insert(batch).execute()
            
            # Count inserted records
            inserted_count = len(result.data) if result.data else 0
            total_inserted += inserted_count
            
            logger.info(f"Successfully inserted {inserted_count} records into {table_name}")
            
        except Exception as e:
            logger.error(f"Error inserting batch into {table_name}: {str(e)}")
            # Continue with next batch even if this one fails
    
    return total_inserted

def main():
    """Generate quality training data and insert it into Supabase."""
    parser = argparse.ArgumentParser(description='Generate and insert quality training data into Supabase')
    parser.add_argument('--num_queries', type=int, default=50, help='Number of queries to generate per category')
    parser.add_argument('--batch_size', type=int, default=10, help='Batch size for Supabase insertion')
    parser.add_argument('--system_training_dir', type=str, default='system_training', help='Directory containing system training data')
    parser.add_argument('--table', type=str, default='training_data', choices=['training_data', 'user_data'], help='Table to insert data into')
    args = parser.parse_args()
    
    try:
        # Initialize quality training data generator
        generator = QualityTrainingDataGenerator(args.system_training_dir)
        
        # Generate training data
        logger.info(f"Generating {args.num_queries} queries per category...")
        training_data = generator.generate_training_data(args.num_queries)
        
        # Save raw training data
        generator.save_training_data(training_data, 'raw_training_data.json')
        
        # Format for Supabase and save
        supabase_training_data = generator.format_for_supabase(training_data)
        generator.save_training_data(supabase_training_data, 'supabase_training_data.json')
        
        # Insert into Supabase
        logger.info(f"Inserting training data into {args.table} table...")
        
        if args.table == 'training_data':
            # Insert into training_data table
            total_inserted = insert_training_data(supabase_training_data, args.batch_size)
        else:
            # For user_data table, we need to transform the data
            from datetime import datetime
            user_data = []
            
            for entry in supabase_training_data:
                # Create user data entry
                user_data_entry = {
                    'user_id': 'system',  # Mark as system-generated
                    'query': entry['query'],
                    'response': entry['response'],
                    'intent': entry['intent'],
                    'tool': entry['tool'],
                    'category': entry['metadata']['category'],
                    'parameters': entry['execution_details']['parameters'],
                    'workflow': entry['workflow'],  # Already formatted as Supabase array
                    'timestamp': datetime.now().isoformat(),
                    'feedback': None,
                    'metadata': {
                        'source': 'algorithm_generated',
                        'version': '1.0'
                    }
                }
                user_data.append(user_data_entry)
            
            # Insert into user_data table
            total_inserted = insert_into_supabase(user_data, 'user_data', args.batch_size)
        
        logger.info(f"Successfully inserted {total_inserted} entries into {args.table} table")
        
    except Exception as e:
        logger.error(f"Error generating and inserting quality training data: {str(e)}")
        raise

if __name__ == "__main__":
    main() 