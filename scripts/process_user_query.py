import argparse
import json
import logging
from response_filter import ResponseFilter

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def process_query(query: str, save_response: bool = False, output_file: str = 'user_response.json'):
    """Process a user query through the response filter algorithm."""
    try:
        # Initialize the response filter
        filter = ResponseFilter()
        
        # Generate response
        logger.info(f"Processing query: {query}")
        response_data = filter.generate_response(query)
        
        # Log the response
        logger.info(f"Generated response: {response_data['response']}")
        logger.info(f"Identified intent: {response_data['intent']} in category: {response_data['category']}")
        logger.info(f"Workflow steps: {response_data['workflow']}")
        
        # Save response to file if requested
        if save_response:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(response_data, f, indent=2)
            logger.info(f"Saved response to {output_file}")
        
        return response_data
    
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise

def main():
    """Main function to process user queries."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Process a user query through the response filter algorithm.')
    parser.add_argument('query', help='The user query to process')
    parser.add_argument('--save', action='store_true', help='Save the response to a file')
    parser.add_argument('--output', default='user_response.json', help='Output file path')
    args = parser.parse_args()
    
    # Process the query
    process_query(args.query, args.save, args.output)

if __name__ == "__main__":
    main() 