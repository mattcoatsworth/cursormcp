import os
import json
import logging
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
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def get_system_training_data() -> List[Dict[str, Any]]:
    """Get all active system training data."""
    try:
        result = supabase.table('system_training').select('*').eq('is_active', True).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error getting system training data: {str(e)}")
        return []

def analyze_guidelines(system_training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze system training data to generate algorithm guidelines."""
    guidelines = {
        'query_patterns': {},
        'response_patterns': {},
        'category_patterns': {},
        'common_phrases': [],
        'response_structures': [],
        'quality_indicators': {
            'high_quality': [],
            'low_quality': []
        }
    }
    
    for entry in system_training_data:
        category = entry.get('category', 'general')
        guidelines_data = entry.get('guidelines', {})
        
        # Analyze query patterns
        query = guidelines_data.get('query', '')
        if query:
            if category not in guidelines['query_patterns']:
                guidelines['query_patterns'][category] = []
            guidelines['query_patterns'][category].append(query)
        
        # Analyze response patterns
        response = guidelines_data.get('response', '')
        if response:
            if category not in guidelines['response_patterns']:
                guidelines['response_patterns'][category] = []
            guidelines['response_patterns'][category].append(response)
        
        # Track category patterns
        if category not in guidelines['category_patterns']:
            guidelines['category_patterns'][category] = 0
        guidelines['category_patterns'][category] += 1
        
        # Extract common phrases
        words = response.lower().split()
        guidelines['common_phrases'].extend(words)
        
        # Analyze response structure
        response_structure = {
            'length': len(response),
            'has_examples': 'example' in response.lower(),
            'has_steps': any(word in response.lower() for word in ['step', 'first', 'next', 'then', 'finally']),
            'has_bullet_points': any(char in response for char in ['•', '-', '*'])
        }
        guidelines['response_structures'].append(response_structure)
        
        # Track quality indicators
        rating = guidelines_data.get('rating', 0)
        if rating >= 8:
            guidelines['quality_indicators']['high_quality'].append({
                'query': query,
                'response': response,
                'rating': rating
            })
        elif rating <= 5:
            guidelines['quality_indicators']['low_quality'].append({
                'query': query,
                'response': response,
                'rating': rating
            })
    
    return guidelines

def generate_algorithm(guidelines: Dict[str, Any]) -> str:
    """Generate an algorithm from the analyzed guidelines."""
    algorithm = {
        'version': '1.0.0',
        'name': 'Training Data Generation Algorithm',
        'description': 'Algorithm for generating high-quality training data based on system guidelines',
        'guidelines': guidelines,
        'rules': {
            'query_generation': {
                'patterns': guidelines['query_patterns'],
                'categories': guidelines['category_patterns']
            },
            'response_generation': {
                'patterns': guidelines['response_patterns'],
                'structures': guidelines['response_structures'],
                'quality_indicators': guidelines['quality_indicators']
            },
            'quality_assurance': {
                'min_length': 50,
                'max_length': 1000,
                'required_elements': ['clear explanation', 'relevant examples', 'structured format'],
                'common_phrases': list(set(guidelines['common_phrases']))
            }
        }
    }
    
    return json.dumps(algorithm, indent=2)

def store_algorithm(algorithm: str) -> bool:
    """Store the generated algorithm in the training_data_algorithm table."""
    try:
        algorithm_data = {
            'version': '1.0.0',
            'name': 'Training Data Generation Algorithm',
            'description': 'Algorithm for generating high-quality training data based on system guidelines',
            'algorithm': algorithm,
            'is_active': True
        }
        
        supabase.table('training_data_algorithm').insert(algorithm_data).execute()
        logger.info("Successfully stored algorithm in training_data_algorithm table")
        return True
    except Exception as e:
        logger.error(f"Error storing algorithm: {str(e)}")
        return False

def main():
    """Main function to generate and store the algorithm."""
    # Get system training data
    system_training_data = get_system_training_data()
    if not system_training_data:
        logger.error("No system training data found")
        return
    
    # Analyze guidelines
    guidelines = analyze_guidelines(system_training_data)
    
    # Generate algorithm
    algorithm = generate_algorithm(guidelines)
    
    # Store algorithm
    if store_algorithm(algorithm):
        logger.info("Algorithm generation and storage completed successfully")
    else:
        logger.error("Failed to store algorithm")

if __name__ == "__main__":
    main() 