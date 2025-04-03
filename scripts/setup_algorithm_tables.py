import os
import json
import logging
from typing import Dict, Any
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

def create_user_algorithm_table() -> bool:
    """Create the user_algorithm table in Supabase."""
    try:
        # Check if the table exists
        result = supabase.table('user_algorithm').select('*').limit(1).execute()
        
        # If the table doesn't exist, create it
        if not result.data:
            # Create the table
            supabase.table('user_algorithm').insert({
                'name': 'Default User Algorithm',
                'description': 'Default algorithm for processing user queries',
                'version': '1.0',
                'algorithm': """
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
        'greeting': ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
        'farewell': ['bye', 'goodbye', 'see you', 'farewell'],
        'help': ['help', 'assist', 'support', 'how to', 'how do i'],
        'thanks': ['thank', 'thanks', 'appreciate']
    }
    
    # Check query against intents
    query_lower = query.lower()
    for intent_name, keywords in intents.items():
        for keyword in keywords:
            if keyword in query_lower:
                intent = intent_name
                break
        if intent != 'unknown':
            break
    
    return intent, parameters

def generate_response(intent, parameters, context=None):
    # Initialize response
    response = ""
    
    # Define response templates for each intent
    response_templates = {
        'greeting': "Hello! How can I assist you today?",
        'farewell': "Goodbye! Have a great day!",
        'help': "I'm here to help. What do you need assistance with?",
        'thanks': "You're welcome! Is there anything else I can help with?",
        'unknown': "I'm not sure how to respond to that. Could you please rephrase?"
    }
    
    # Generate response using template
    if intent in response_templates:
        response = response_templates[intent]
    else:
        response = response_templates['unknown']
    
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
""",
                'parameters': {},
                'is_active': True
            }).execute()
            
            logger.info("Created user_algorithm table with default algorithm")
            return True
        else:
            logger.info("user_algorithm table already exists")
            return True
    except Exception as e:
        logger.error(f"Error creating user_algorithm table: {str(e)}")
        return False

def create_training_data_algorithm_table() -> bool:
    """Create the training_data_algorithm table in Supabase."""
    try:
        # Check if the table exists
        result = supabase.table('training_data_algorithm').select('*').limit(1).execute()
        
        # If the table doesn't exist, create it
        if not result.data:
            # Create the table
            supabase.table('training_data_algorithm').insert({
                'name': 'Default Training Data Algorithm',
                'description': 'Default algorithm for generating training data',
                'version': '1.0',
                'algorithm': """
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
        'whatsapp': {
            'intent': 'whatsapp_query',
            'query_example': 'How do I send a message on WhatsApp?',
            'response_example': 'To send a message on WhatsApp, open the app, tap on the chat you want to send a message to, type your message in the text field at the bottom, and tap the send button.',
            'workflow': '{}',
            'execution_details': {},
            'applied_guidelines': '{}'
        }
    }
    
    # Return guidelines for the specified category
    return guidelines.get(category, {})

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
""",
                'parameters': {},
                'is_active': True
            }).execute()
            
            logger.info("Created training_data_algorithm table with default algorithm")
            return True
        else:
            logger.info("training_data_algorithm table already exists")
            return True
    except Exception as e:
        logger.error(f"Error creating training_data_algorithm table: {str(e)}")
        return False

def create_old_training_data_algorithms_table() -> bool:
    """Create the old_training_data_algorithms table in Supabase."""
    try:
        # Check if the table exists
        result = supabase.table('old_training_data_algorithms').select('*').limit(1).execute()
        
        # If the table doesn't exist, create it
        if not result.data:
            # Create the table
            supabase.table('old_training_data_algorithms').insert({
                'name': 'Initial Backup',
                'description': 'Initial backup of training data algorithm',
                'version': '0.0',
                'algorithm': 'Initial backup',
                'parameters': {},
                'is_active': False,
                'archived_date': 'now()'
            }).execute()
            
            logger.info("Created old_training_data_algorithms table with initial entry")
            return True
        else:
            logger.info("old_training_data_algorithms table already exists")
            return True
    except Exception as e:
        logger.error(f"Error creating old_training_data_algorithms table: {str(e)}")
        return False

def add_rating_and_feedback_to_training_data() -> bool:
    """Add rating and feedback columns to the training_data table."""
    try:
        # Check if the columns exist
        result = supabase.table('training_data').select('rating, feedback').limit(1).execute()
        
        # If the columns don't exist, add them
        if not result.data or 'rating' not in result.data[0]:
            # Add the columns
            supabase.table('training_data').update({
                'rating': None,
                'feedback': None
            }).execute()
            
            logger.info("Added rating and feedback columns to training_data table")
            return True
        else:
            logger.info("Rating and feedback columns already exist in training_data table")
            return True
    except Exception as e:
        logger.error(f"Error adding rating and feedback columns to training_data table: {str(e)}")
        return False

def create_system_training_table() -> bool:
    """Create the system_training table in Supabase."""
    try:
        # Check if the table exists
        result = supabase.table('system_training').select('*').limit(1).execute()
        
        # If the table doesn't exist, create it
        if not result.data:
            # Create the table
            supabase.table('system_training').insert({
                'category': 'whatsapp',
                'guidelines': {
                    'intent': 'whatsapp_query',
                    'query_example': 'How do I send a message on WhatsApp?',
                    'response_example': 'To send a message on WhatsApp, open the app, tap on the chat you want to send a message to, type your message in the text field at the bottom, and tap the send button.',
                    'workflow': '{}',
                    'execution_details': {},
                    'applied_guidelines': '{}'
                },
                'is_active': True
            }).execute()
            
            logger.info("Created system_training table with default entry")
            return True
        else:
            logger.info("system_training table already exists")
            return True
    except Exception as e:
        logger.error(f"Error creating system_training table: {str(e)}")
        return False

def main():
    """Main function to set up the algorithm tables in Supabase."""
    try:
        # Create the tables
        user_algorithm_created = create_user_algorithm_table()
        training_data_algorithm_created = create_training_data_algorithm_table()
        old_training_data_algorithms_created = create_old_training_data_algorithms_table()
        
        # Add rating and feedback columns to training_data table
        rating_and_feedback_added = add_rating_and_feedback_to_training_data()
        
        # Create system_training table
        system_training_created = create_system_training_table()
        
        # Check if all operations were successful
        if (user_algorithm_created and training_data_algorithm_created and 
            old_training_data_algorithms_created and rating_and_feedback_added and 
            system_training_created):
            logger.info("Successfully set up all algorithm tables in Supabase")
        else:
            logger.error("Failed to set up some algorithm tables in Supabase")
    
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        raise

if __name__ == "__main__":
    main() 