import os
import json
import logging
import argparse
from datetime import datetime
from process_user_query import process_query
from insert_quality_training_data import insert_training_data

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def format_response_for_training_data(response_data):
    """Format response data for training_data table in Supabase."""
    # Extract relevant fields from response data
    query = response_data.get('query', '')
    category = response_data.get('category', '')
    intent = response_data.get('intent', '')
    parameters = response_data.get('parameters', {})
    response = response_data.get('response', '')
    workflow_steps = response_data.get('workflow_steps', [])
    
    # Determine tool based on category
    tool = 'whatsapp' if 'whatsapp' in category.lower() else 'warehouse' if 'warehouse' in category.lower() else 'unknown'
    
    # Create training entry
    training_entry = {
        'tool': tool,
        'intent': intent,
        'query': query,
        'response': response,
        'systems': '{' + tool + '}',  # Format as Supabase array
        'workflow': '{' + ','.join(workflow_steps) + '}',  # Format as Supabase array
        'execution_details': {
            'estimated_time': '1-2 minutes',
            'required_permissions': ['read', 'write'] if tool == 'whatsapp' else ['read'],
            'parameters': parameters
        },
        'metadata': {
            'category': category,
            'version': '1.0',
            'timestamp': response_data.get('timestamp', datetime.now().isoformat())
        },
        'applied_guidelines': '{response_format,workflow_steps,error_handling}',  # Format as Supabase array
        'source': '{user_query}',  # Format as Supabase array
        'follow_up_queries': '{}',  # Format as Supabase array
        'follow_up_responses': '{}',  # Format as Supabase array
        'follow_up_context': '{}'  # Format as Supabase array
    }
    
    return training_entry

def format_response_for_user_data(response_data):
    """Format response data for user_data table in Supabase."""
    # Extract relevant fields from response data
    query = response_data.get('query', '')
    category = response_data.get('category', '')
    intent = response_data.get('intent', '')
    parameters = response_data.get('parameters', {})
    response = response_data.get('response', '')
    workflow_steps = response_data.get('workflow_steps', [])
    
    # Determine tool based on category
    tool = 'whatsapp' if 'whatsapp' in category.lower() else 'warehouse' if 'warehouse' in category.lower() else 'unknown'
    
    # Create user data entry
    user_data_entry = {
        'user_id': 'anonymous',  # Can be updated with actual user ID if available
        'query': query,
        'response': response,
        'intent': intent,
        'tool': tool,
        'category': category,
        'parameters': parameters,
        'workflow': '{' + ','.join(workflow_steps) + '}',  # Format as Supabase array
        'timestamp': datetime.now().isoformat(),
        'feedback': None,  # Can be updated later if user provides feedback
        'metadata': {
            'source': 'user_query',
            'version': '1.0'
        }
    }
    
    return user_data_entry

def insert_into_supabase(data, table_name, batch_size=1):
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
    """Process a user query and insert the result into Supabase."""
    parser = argparse.ArgumentParser(description='Process a user query and insert the result into Supabase')
    parser.add_argument('query', type=str, help='User query to process')
    parser.add_argument('--save_response', action='store_true', help='Save response to file')
    parser.add_argument('--output_file', type=str, default='user_query_response.json', help='Output file for response')
    parser.add_argument('--user_id', type=str, default='anonymous', help='User ID for the query')
    parser.add_argument('--insert_into_training', action='store_true', help='Also insert into training_data table')
    args = parser.parse_args()
    
    try:
        # Process query
        logger.info(f"Processing query: {args.query}")
        response_data = process_query(args.query, args.save_response, args.output_file)
        
        # Add user_id to response data
        response_data['user_id'] = args.user_id
        
        # Format for user_data table
        user_data_entry = format_response_for_user_data(response_data)
        
        # Insert into user_data table
        logger.info("Inserting response into user_data table...")
        total_inserted = insert_into_supabase([user_data_entry], 'user_data', batch_size=1)
        
        logger.info(f"Successfully inserted {total_inserted} entry into user_data table")
        
        # Optionally insert into training_data table
        if args.insert_into_training:
            # Format for training_data table
            training_entry = format_response_for_training_data(response_data)
            
            # Insert into training_data table
            logger.info("Inserting response into training_data table...")
            total_inserted = insert_into_supabase([training_entry], 'training_data', batch_size=1)
            
            logger.info(f"Successfully inserted {total_inserted} entry into training_data table")
        
    except Exception as e:
        logger.error(f"Error processing and inserting user query: {str(e)}")
        raise

if __name__ == "__main__":
    main() 