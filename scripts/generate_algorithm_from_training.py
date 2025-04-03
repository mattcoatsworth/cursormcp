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

def generate_user_algorithm(system_training_data: List[Dict[str, Any]]) -> str:
    """Generate a user algorithm from system training data."""
    # Start with the basic algorithm structure
    algorithm = """
def process_user_query(query, context=None):
    # Extract intent and parameters
    intent, parameters = identify_intent_and_parameters(query)
    
    # Generate response based on intent and parameters
    response = generate_response(intent, parameters, context)
    
    # Apply response rules
    response = apply_response_rules(response)
    
    return {
        'intent': intent,
        'parameters': parameters,
        'response': response
    }

def identify_intent_and_parameters(query):
    # Initialize intent and parameters
    intent = 'unknown'
    parameters = {}
    
    # Define intents and their keywords
    intents = {
"""
    
    # Add intents and keywords from system training data
    intents_dict = {}
    for entry in system_training_data:
        category = entry.get('category', '')
        guidelines = entry.get('guidelines', {})
        intent_name = guidelines.get('intent', '')
        
        if intent_name and intent_name not in intents_dict:
            intents_dict[intent_name] = []
            
            # Extract keywords from query example
            query_example = guidelines.get('query_example', '')
            if query_example:
                # Simple keyword extraction (can be improved)
                keywords = [word.lower() for word in query_example.split() if len(word) > 3]
                intents_dict[intent_name].extend(keywords)
    
    # Add intents to the algorithm
    for intent_name, keywords in intents_dict.items():
        algorithm += f"        '{intent_name}': {keywords},\n"
    
    # Close the intents dictionary
    algorithm += """    }
    
    # Check query against intents
    query_lower = query.lower()
    for intent_name, keywords in intents.items():
        for keyword in keywords:
            if keyword in query_lower:
                intent = intent_name
                break
        if intent != 'unknown':
            break
    
    # Extract parameters based on intent
    if intent != 'unknown':
        # Extract parameters using regex patterns
        import re
        
        # Define parameter patterns for each intent
        parameter_patterns = {
"""
    
    # Add parameter patterns for each intent
    for entry in system_training_data:
        guidelines = entry.get('guidelines', {})
        intent_name = guidelines.get('intent', '')
        
        if intent_name:
            # Extract parameters from execution_details
            execution_details = guidelines.get('execution_details', {})
            param_details = execution_details.get('parameters', {})
            
            if param_details:
                algorithm += f"            '{intent_name}': {{\n"
                
                for param_name, param_info in param_details.items():
                    # Define regex pattern based on parameter type
                    if isinstance(param_info, dict) and 'type' in param_info:
                        param_type = param_info.get('type', 'string')
                        
                        if param_type == 'string':
                            pattern = r'\\b\\w+\\b'
                        elif param_type == 'number':
                            pattern = r'\\d+'
                        elif param_type == 'date':
                            pattern = r'\\d{{1,2}}[/-]\\d{{1,2}}[/-]\\d{{2,4}}'
                        else:
                            pattern = r'\\b\\w+\\b'
                        
                        algorithm += f"                '{param_name}': r'{pattern}',\n"
                
                algorithm += "            },\n"
    
    # Close the parameter patterns dictionary
    algorithm += """        }
        
        # Extract parameters using patterns
        if intent in parameter_patterns:
            for param_name, pattern in parameter_patterns[intent].items():
                match = re.search(pattern, query_lower)
                if match:
                    parameters[param_name] = match.group(0)
    
    return intent, parameters

def generate_response(intent, parameters, context=None):
    # Initialize response
    response = ""
    
    # Define response templates for each intent
    response_templates = {
"""
    
    # Add response templates for each intent
    for entry in system_training_data:
        guidelines = entry.get('guidelines', {})
        intent_name = guidelines.get('intent', '')
        
        if intent_name:
            # Get response example
            response_example = guidelines.get('response_example', '')
            
            if response_example:
                # Create a template from the response example
                template = response_example
                
                # Replace parameters with placeholders
                execution_details = guidelines.get('execution_details', {})
                param_details = execution_details.get('parameters', {})
                
                for param_name in param_details:
                    template = template.replace(f"{{{param_name}}}", f"{{parameters.get('{param_name}', '')}}")
                
                algorithm += f"        '{intent_name}': "{template}",\n"
    
    # Close the response templates dictionary
    algorithm += """    }
    
    # Generate response using template
    if intent in response_templates:
        response = response_templates[intent].format(parameters=parameters)
    else:
        response = f"I don't have a specific response for the intent '{intent}'."
    
    return response

def apply_response_rules(response):
    # Apply response rules
    # 1. Ensure response is not too long
    if len(response) > 500:
        response = response[:497] + "..."
    
    # 2. Ensure response ends with a period
    if response and not response.endswith('.'):
        response += '.'
    
    return response
"""
    
    return algorithm

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

def archive_current_algorithm(algorithm_type: str) -> bool:
    """Archive the current algorithm to the old_training_data_algorithms table."""
    try:
        # Get the current active algorithm
        result = supabase.table(algorithm_type).select('*').eq('is_active', True).execute()
        
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
            logger.warning(f"No active {algorithm_type} found to archive")
            return True
    
    except Exception as e:
        logger.error(f"Error archiving current algorithm: {str(e)}")
        raise

def update_algorithm(algorithm: str, algorithm_type: str, name: str = None, description: str = None) -> bool:
    """Update the algorithm in Supabase."""
    try:
        # Archive the current algorithm
        archive_current_algorithm(algorithm_type)
        
        # Get the current version
        result = supabase.table(algorithm_type).select('version').order('version', desc=True).limit(1).execute()
        
        if result.data:
            current_version = result.data[0].get('version', '1.0')
            # Increment the version
            major, minor = current_version.split('.')
            new_version = f"{major}.{int(minor) + 1}"
        else:
            new_version = '1.0'
        
        # Create the algorithm entry
        algorithm_entry = {
            'name': name or f'Generated {algorithm_type} v{new_version}',
            'description': description or f'Algorithm generated from system training data',
            'version': new_version,
            'algorithm': algorithm,
            'parameters': {},
            'is_active': True
        }
        
        # Insert the algorithm
        result = supabase.table(algorithm_type).insert(algorithm_entry).execute()
        
        # Check if the insert was successful
        return len(result.data) > 0
    except Exception as e:
        logger.error(f"Error updating {algorithm_type}: {str(e)}")
        raise

def main():
    """Main function to generate algorithm from system training data."""
    parser = argparse.ArgumentParser(description='Generate algorithm from system training data')
    parser.add_argument('--type', type=str, choices=['user_algorithm', 'training_data_algorithm'], required=True, help='Type of algorithm to generate')
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
        if args.type == 'user_algorithm':
            algorithm = generate_user_algorithm(system_training_data)
        else:
            algorithm = generate_training_data_algorithm(system_training_data)
        
        # Update algorithm in Supabase
        success = update_algorithm(algorithm, args.type, args.name, args.description)
        
        if success:
            logger.info(f"Successfully updated {args.type}")
        else:
            logger.error(f"Failed to update {args.type}")
    
    except Exception as e:
        logger.error(f"Error generating algorithm: {str(e)}")
        raise

if __name__ == "__main__":
    main() 