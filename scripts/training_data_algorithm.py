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

def get_system_training_data(category: str = None) -> List[Dict[str, Any]]:
    """Get system training data from Supabase."""
    try:
        # Query system training data
        if category:
            result = supabase.table('system_training').select('*').eq('category', category).eq('is_active', True).execute()
        else:
            result = supabase.table('system_training').select('*').eq('is_active', True).execute()
        
        # Return the data
        return result.data
    except Exception as e:
        logger.error(f"Error getting system training data: {str(e)}")
        raise

def generate_training_data_algorithm(system_training_data: List[Dict[str, Any]]) -> str:
    """Generate a training data algorithm from system training data."""
    # Start with the basic algorithm structure
    algorithm = """
def generate_training_data(category, count=10):
    # Load guidelines for the category
    guidelines = load_guidelines(category)
    
    # Generate queries based on guidelines
    queries = generate_queries(guidelines, count)
    
    # Generate responses for each query
    training_data = []
    for query in queries:
        response = generate_response(query, guidelines)
        training_entry = create_training_entry(query, response, category)
        training_data.append(training_entry)
    
    return training_data

def load_guidelines(category):
    # Define guidelines for each category
    guidelines = {
"""
    
    # Add guidelines for each category
    for entry in system_training_data:
        category = entry.get('category', '')
        guidelines_data = entry.get('guidelines', {})
        
        if category and guidelines_data:
            algorithm += f"        '{category}': {{\n"
            
            # Add intent
            intent = guidelines_data.get('intent', '')
            if intent:
                algorithm += f"            'intent': '{intent}',\n"
            
            # Add query example
            query_example = guidelines_data.get('query_example', '')
            if query_example:
                algorithm += f"            'query_example': '{query_example}',\n"
            
            # Add response example
            response_example = guidelines_data.get('response_example', '')
            if response_example:
                algorithm += f"            'response_example': '{response_example}',\n"
            
            # Add workflow
            workflow = guidelines_data.get('workflow', '{}')
            if workflow:
                algorithm += f"            'workflow': {workflow},\n"
            
            # Add execution details
            execution_details = guidelines_data.get('execution_details', {})
            if execution_details:
                algorithm += f"            'execution_details': {json.dumps(execution_details)},\n"
            
            # Add applied guidelines
            applied_guidelines = guidelines_data.get('applied_guidelines', '{}')
            if applied_guidelines:
                algorithm += f"            'applied_guidelines': {applied_guidelines},\n"
            
            algorithm += "        },\n"
    
    # Close the guidelines dictionary
    algorithm += """    }
    
    # Return guidelines for the specified category
    return guidelines.get(category, {})
}

def generate_queries(guidelines, count):
    # Initialize queries
    queries = []
    
    # Get query example
    query_example = guidelines.get('query_example', '')
    
    if query_example:
        # Generate variations of the query example
        for i in range(count):
            # Simple variation (can be improved)
            query = query_example
            queries.append(query)
    
    return queries

def generate_response(query, guidelines):
    # Get response example
    response_example = guidelines.get('response_example', '')
    
    if response_example:
        # Use the response example (can be improved)
        return response_example
    
    return "I don't have a specific response for this query."

def create_training_entry(query, response, category):
    # Get guidelines for the category
    guidelines = load_guidelines(category)
    
    # Create training entry
    training_entry = {
        'tool': category.split('_')[0] if '_' in category else 'unknown',
        'intent': guidelines.get('intent', 'unknown'),
        'query': query,
        'response': response,
        'systems': '{' + category.split('_')[0] + '}' if '_' in category else '{unknown}',
        'workflow': guidelines.get('workflow', '{}'),
        'execution_details': guidelines.get('execution_details', {}),
        'metadata': {
            'category': category,
            'version': '1.0',
            'last_updated': 'now()'
        },
        'applied_guidelines': guidelines.get('applied_guidelines', '{}'),
        'is_active': True,
        'source': '{algorithm_generated}',
        'follow_up_queries': '{}',
        'follow_up_responses': '{}',
        'follow_up_context': '{}'
    }
    
    return training_entry
"""
    
    return algorithm

def archive_current_algorithm() -> bool:
    """Archive the current training data algorithm to the old_training_data_algorithms table."""
    try:
        # Get the current active algorithm
        result = supabase.table('training_data_algorithm').select('*').eq('is_active', True).execute()
        
        if result.data:
            current_algorithm = result.data[0]
            
            # Create an entry for the old_training_data_algorithms table
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
            result = supabase.table('old_training_data_algorithms').insert(old_algorithm_entry).execute()
            
            # Check if the insert was successful
            return len(result.data) > 0
        else:
            logger.warning("No active training data algorithm found to archive")
            return True
    
    except Exception as e:
        logger.error(f"Error archiving current algorithm: {str(e)}")
        raise

def update_algorithm(algorithm: str, name: str = None, description: str = None) -> bool:
    """Update the training data algorithm in Supabase."""
    try:
        # Archive the current algorithm
        archive_current_algorithm()
        
        # Get the current version
        result = supabase.table('training_data_algorithm').select('version').order('version', desc=True).limit(1).execute()
        
        if result.data:
            current_version = result.data[0].get('version', '1.0')
            # Increment the version
            major, minor = current_version.split('.')
            new_version = f"{major}.{int(minor) + 1}"
        else:
            new_version = '1.0'
        
        # Create the algorithm entry
        algorithm_entry = {
            'name': name or f'Generated Training Data Algorithm v{new_version}',
            'description': description or f'Algorithm generated from system training data',
            'version': new_version,
            'algorithm': algorithm,
            'parameters': {},
            'is_active': True
        }
        
        # Insert the algorithm
        result = supabase.table('training_data_algorithm').insert(algorithm_entry).execute()
        
        # Check if the insert was successful
        return len(result.data) > 0
    except Exception as e:
        logger.error(f"Error updating training data algorithm: {str(e)}")
        raise

def main():
    """Main function to generate training data algorithm from system training data."""
    parser = argparse.ArgumentParser(description='Generate training data algorithm from system training data')
    parser.add_argument('--category', type=str, help='Category to generate algorithm for')
    parser.add_argument('--name', type=str, help='Name of the algorithm')
    parser.add_argument('--description', type=str, help='Description of the algorithm')
    args = parser.parse_args()
    
    try:
        # Get system training data
        system_training_data = get_system_training_data(args.category)
        
        if not system_training_data:
            logger.error(f"No system training data found for category {args.category}")
            return
        
        logger.info(f"Found {len(system_training_data)} system training entries")
        
        # Generate algorithm
        algorithm = generate_training_data_algorithm(system_training_data)
        
        # Update algorithm in Supabase
        success = update_algorithm(algorithm, args.name, args.description)
        
        if success:
            logger.info("Successfully updated training data algorithm")
        else:
            logger.error("Failed to update training data algorithm")
    
    except Exception as e:
        logger.error(f"Error generating training data algorithm: {str(e)}")
        raise

if __name__ == "__main__":
    main() 