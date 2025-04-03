import json
import os
import random
from typing import List, Dict, Any, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class QueryGenerator:
    """Generates high-quality queries based on system training data."""
    
    def __init__(self, system_training_dir: str = "system_training"):
        """Initialize the query generator with system training data."""
        self.system_training_dir = system_training_dir
        self.guidelines = {}
        self.context = {}
        self.load_training_data()
    
    def load_training_data(self):
        """Load all training data from the system_training directory."""
        try:
            # Load all JSON files from the system_training directory
            for filename in os.listdir(self.system_training_dir):
                if filename.endswith('.json'):
                    file_path = os.path.join(self.system_training_dir, filename)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        
                        # Store guidelines files
                        if 'guidelines' in data:
                            self.guidelines[filename] = data
                        
                        # Store context files
                        if 'type' in data and data['type'] == 'SYSTEM_CONTEXT':
                            self.context[filename] = data
            
            logger.info(f"Loaded {len(self.guidelines)} guideline files and {len(self.context)} context files")
        except Exception as e:
            logger.error(f"Error loading training data: {str(e)}")
            raise
    
    def extract_operations(self) -> Dict[str, List[str]]:
        """Extract all allowed operations from the guidelines."""
        operations = {}
        
        for filename, data in self.guidelines.items():
            if 'guidelines' in data:
                for category, details in data['guidelines'].items():
                    if 'allowed_operations' in details:
                        operations[category] = details['allowed_operations']
        
        return operations
    
    def extract_response_formats(self) -> Dict[str, Dict[str, str]]:
        """Extract all response formats from the guidelines."""
        response_formats = {}
        
        for filename, data in self.guidelines.items():
            if 'guidelines' in data:
                for category, details in data['guidelines'].items():
                    if 'response_format' in details:
                        response_formats[category] = details['response_format']
        
        return response_formats
    
    def extract_examples(self) -> Dict[str, Dict[str, List[str]]]:
        """Extract all examples from the guidelines."""
        examples = {}
        
        for filename, data in self.guidelines.items():
            if 'guidelines' in data:
                for category, details in data['guidelines'].items():
                    if 'examples' in details:
                        examples[category] = details['examples']
        
        return examples
    
    def extract_workflows(self) -> Dict[str, Dict[str, List[str]]]:
        """Extract all workflows from the guidelines."""
        workflows = {}
        
        for filename, data in self.guidelines.items():
            if 'guidelines' in data and 'workflow' in data['guidelines']:
                workflows[filename] = data['guidelines']['workflow']
        
        return workflows
    
    def generate_queries(self, count: int = 10, category: Optional[str] = None) -> List[str]:
        """Generate high-quality queries based on the training data."""
        queries = []
        operations = self.extract_operations()
        examples = self.extract_examples()
        
        # If a specific category is requested, filter operations
        if category and category in operations:
            categories = {category: operations[category]}
        else:
            categories = operations
        
        # Generate queries for each category
        for cat, ops in categories.items():
            for _ in range(count // len(categories) + 1):
                if len(queries) >= count:
                    break
                
                # Select a random operation
                operation = random.choice(ops)
                
                # Generate a query based on the operation and examples
                query = self._generate_query_for_operation(cat, operation, examples)
                if query:
                    queries.append(query)
        
        # Shuffle and limit to requested count
        random.shuffle(queries)
        return queries[:count]
    
    def _generate_query_for_operation(self, category: str, operation: str, examples: Dict[str, Dict[str, List[str]]]) -> str:
        """Generate a specific query for an operation based on examples."""
        # Check if we have examples for this category
        if category in examples and 'good' in examples[category]:
            # Use an example as a template
            template = random.choice(examples[category]['good'])
            
            # Replace placeholders with realistic values
            query = self._replace_placeholders(template, operation)
            return query
        
        # If no examples, generate a generic query
        return self._generate_generic_query(operation)
    
    def _replace_placeholders(self, template: str, operation: str) -> str:
        """Replace placeholders in a template with realistic values."""
        # Replace order numbers
        if '[number]' in template:
            template = template.replace('[number]', str(random.randint(1000, 9999)))
        
        # Replace dates
        if '[date]' in template:
            from datetime import datetime, timedelta
            future_date = datetime.now() + timedelta(days=random.randint(1, 14))
            template = template.replace('[date]', future_date.strftime('%B %d'))
        
        # Replace actions
        if '[action]' in template:
            action_words = {
                'Voiding shipping labels': 'voided the shipping label for',
                'Managing shipping batches': 'updated the shipping batch for',
                'Pausing fulfillment': 'paused fulfillment for',
                'Removing orders from shipping batches': 'removed from the shipping batch',
                'Checking warehouse inventory levels': 'checked inventory for',
                'Managing warehouse locations': 'updated the warehouse location for',
                'Sending text messages': 'sent a message to',
                'Sending template messages': 'sent a template message to',
                'Sending media messages': 'sent a media message to',
                'Managing message templates': 'created a new template named',
                'Configuring webhooks': 'configured a webhook at',
                'Managing business profile': 'updated the business profile'
            }
            action = action_words.get(operation, operation.lower())
            template = template.replace('[action]', action)
        
        return template
    
    def _generate_generic_query(self, operation: str) -> str:
        """Generate a generic query for an operation."""
        # Generate a generic query based on the operation
        if 'void' in operation.lower():
            return f"Can you void the shipping label for order #{random.randint(1000, 9999)}?"
        elif 'pause' in operation.lower():
            return f"Can you pause fulfillment for order #{random.randint(1000, 9999)}?"
        elif 'remove' in operation.lower():
            return f"Can you remove order #{random.randint(1000, 9999)} from the shipping batch?"
        elif 'check' in operation.lower():
            return f"Can you check the inventory level for SKU ABC{random.randint(100, 999)}?"
        elif 'manage' in operation.lower():
            return f"Can you update the warehouse location for SKU XYZ{random.randint(100, 999)}?"
        elif 'send' in operation.lower():
            return f"Can you send a message to +1{random.randint(200, 999)}{random.randint(200, 999)}{random.randint(1000, 9999)}?"
        elif 'template' in operation.lower():
            return f"Can you create a new template named 'order_update_{random.randint(1, 100)}'?"
        elif 'webhook' in operation.lower():
            return f"Can you configure a webhook at https://api.example.com/webhook_{random.randint(1, 100)}?"
        elif 'profile' in operation.lower():
            return f"Can you update the business profile description?"
        else:
            return f"Can you help me with {operation.lower()}?"

def main():
    """Main function to generate queries."""
    try:
        # Initialize the query generator
        generator = QueryGenerator()
        
        # Generate queries for each category
        categories = generator.extract_operations().keys()
        all_queries = []
        
        for category in categories:
            logger.info(f"Generating queries for category: {category}")
            queries = generator.generate_queries(count=5, category=category)
            all_queries.extend(queries)
        
        # Save queries to file
        with open('generated_queries.txt', 'w', encoding='utf-8') as f:
            for query in all_queries:
                f.write(f"{query}\n")
        
        logger.info(f"Generated {len(all_queries)} queries and saved to generated_queries.txt")
        
    except Exception as e:
        logger.error(f"Error generating queries: {str(e)}")
        raise

if __name__ == "__main__":
    main() 