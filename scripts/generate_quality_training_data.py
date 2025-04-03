import json
import os
import logging
from typing import List, Dict, Any
from datetime import datetime
from query_generator import QueryGenerator
from response_filter import ResponseFilter

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class QualityTrainingDataGenerator:
    """Generates high-quality training data using query generator and response filter."""
    
    def __init__(self, system_training_dir: str = "system_training"):
        """Initialize the quality training data generator."""
        self.system_training_dir = system_training_dir
        self.query_generator = QueryGenerator(system_training_dir)
        self.response_filter = ResponseFilter(system_training_dir)
    
    def generate_training_data(self, count: int = 50) -> List[Dict[str, Any]]:
        """Generate high-quality training data."""
        # Generate queries using the query generator
        queries = self.query_generator.generate_queries(count=count)
        logger.info(f"Generated {len(queries)} high-quality queries")
        
        # Process each query through the response filter
        training_data = []
        for query in queries:
            # Generate response using the response filter
            response_data = self.response_filter.generate_response(query)
            
            # Create training entry
            training_entry = self._create_training_entry(response_data)
            training_data.append(training_entry)
        
        logger.info(f"Generated {len(training_data)} training entries")
        return training_data
    
    def _create_training_entry(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a training entry from response data."""
        # Extract data from response_data
        query = response_data['query']
        category = response_data['category']
        intent = response_data['intent']
        parameters = response_data['parameters']
        response = response_data['response']
        workflow = response_data['workflow']
        
        # Determine tool based on category
        tool = 'whatsapp' if 'message' in category else 'warehouse'
        
        # Format arrays for Supabase
        systems = '{' + tool + '}'  # Format as Supabase array
        applied_guidelines = '{use_clear_language,maintain_professional_tone,include_relevant_context}'  # Format as Supabase array
        source = '{algorithm_generated}'  # Format as Supabase array
        follow_up_queries = '{}'  # Format as Supabase array
        follow_up_responses = '{}'  # Format as Supabase array
        follow_up_context = '{}'  # Format as Supabase array
        
        # Create training entry with proper Supabase formatting
        training_entry = {
            'tool': tool,
            'intent': intent,
            'query': query,
            'response': response,
            'systems': systems,  # Already formatted as Supabase array
            'workflow': '{' + ','.join(workflow) + '}',  # Format as Supabase array
            'execution_details': {  # This will be automatically converted to JSON by Supabase
                'estimated_time': '2s',
                'required_permissions': [f'{tool}.{intent}'],
                'parameters': parameters
            },
            'metadata': {  # This will be automatically converted to JSON by Supabase
                'category': category,
                'version': '1.0',
                'last_updated': datetime.now().isoformat()
            },
            'applied_guidelines': applied_guidelines,  # Already formatted as Supabase array
            'is_active': True,
            'source': source,  # Already formatted as Supabase array
            'follow_up_queries': follow_up_queries,  # Already formatted as Supabase array
            'follow_up_responses': follow_up_responses,  # Already formatted as Supabase array
            'follow_up_context': follow_up_context  # Already formatted as Supabase array
        }
        
        return training_entry
    
    def save_training_data(self, training_data: List[Dict[str, Any]], file_path: str = 'quality_training_data.json'):
        """Save training data to a file."""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(training_data, f, indent=2)
        logger.info(f"Saved {len(training_data)} training entries to {file_path}")
    
    def format_for_supabase(self, training_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format training data for Supabase insertion.
        
        This method ensures that all arrays are properly formatted for Supabase.
        Supabase expects arrays to be in the format: {value1,value2,value3}
        """
        formatted_data = []
        
        for entry in training_data:
            # Create a copy of the entry
            formatted_entry = entry.copy()
            
            # Ensure arrays are properly formatted for Supabase
            # Most arrays should already be formatted correctly in _create_training_entry
            # But we'll double-check here to be safe
            
            # Format systems if needed
            if 'systems' in formatted_entry and not formatted_entry['systems'].startswith('{'):
                formatted_entry['systems'] = '{' + ','.join(formatted_entry['systems']) + '}'
            
            # Format workflow if needed
            if 'workflow' in formatted_entry and not formatted_entry['workflow'].startswith('{'):
                formatted_entry['workflow'] = '{' + ','.join(formatted_entry['workflow']) + '}'
            
            # Format applied_guidelines if needed
            if 'applied_guidelines' in formatted_entry and not formatted_entry['applied_guidelines'].startswith('{'):
                formatted_entry['applied_guidelines'] = '{' + ','.join(formatted_entry['applied_guidelines']) + '}'
            
            # Format source if needed
            if 'source' in formatted_entry and not formatted_entry['source'].startswith('{'):
                formatted_entry['source'] = '{' + ','.join(formatted_entry['source']) + '}'
            
            # Format follow_up_queries if needed
            if 'follow_up_queries' in formatted_entry and not formatted_entry['follow_up_queries'].startswith('{'):
                formatted_entry['follow_up_queries'] = '{' + ','.join(formatted_entry['follow_up_queries']) + '}'
            
            # Format follow_up_responses if needed
            if 'follow_up_responses' in formatted_entry and not formatted_entry['follow_up_responses'].startswith('{'):
                formatted_entry['follow_up_responses'] = '{' + ','.join(formatted_entry['follow_up_responses']) + '}'
            
            # Format follow_up_context if needed
            if 'follow_up_context' in formatted_entry and not formatted_entry['follow_up_context'].startswith('{'):
                formatted_entry['follow_up_context'] = '{' + ','.join(formatted_entry['follow_up_context']) + '}'
            
            # Add to formatted data
            formatted_data.append(formatted_entry)
        
        return formatted_data

def main():
    """Main function to generate quality training data."""
    try:
        # Initialize the quality training data generator
        generator = QualityTrainingDataGenerator()
        
        # Generate training data
        training_data = generator.generate_training_data(count=50)
        
        # Save raw training data
        generator.save_training_data(training_data, 'raw_training_data.json')
        
        # Format for Supabase
        supabase_formatted_data = generator.format_for_supabase(training_data)
        
        # Save Supabase formatted data
        with open('supabase_training_data.json', 'w', encoding='utf-8') as f:
            json.dump(supabase_formatted_data, f, indent=2)
        
        logger.info(f"Saved {len(supabase_formatted_data)} Supabase-formatted training entries to supabase_training_data.json")
        
    except Exception as e:
        logger.error(f"Error generating quality training data: {str(e)}")
        raise

if __name__ == "__main__":
    main() 