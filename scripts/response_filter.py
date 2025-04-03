import json
import os
import re
from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ResponseFilter:
    """Filters user prompts through system training guidelines to generate acceptable responses."""
    
    def __init__(self, system_training_dir: str = "system_training"):
        """Initialize the response filter with system training data."""
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
    
    def identify_intent(self, query: str) -> Tuple[str, str]:
        """Identify the intent and category of a query."""
        # Extract keywords from the query
        keywords = query.lower().split()
        
        # Define intent categories and their keywords
        intent_categories = {
            'warehouse_3pl_operations': [
                'void', 'shipping', 'label', 'batch', 'pause', 'fulfillment', 
                'remove', 'inventory', 'warehouse', 'location', '3pl'
            ],
            'message_operations': [
                'send', 'message', 'text', 'template', 'media', 'whatsapp',
                'phone', 'number', 'recipient', 'webhook', 'business', 'profile'
            ]
        }
        
        # Count keyword matches for each category
        category_scores = {}
        for category, category_keywords in intent_categories.items():
            score = sum(1 for keyword in keywords if any(k in keyword for k in category_keywords))
            category_scores[category] = score
        
        # Find the best matching category
        best_category = max(category_scores.items(), key=lambda x: x[1])[0]
        
        # Identify specific intent within the category
        specific_intent = self._identify_specific_intent(query, best_category)
        
        return best_category, specific_intent
    
    def _identify_specific_intent(self, query: str, category: str) -> str:
        """Identify the specific intent within a category."""
        query_lower = query.lower()
        
        if category == 'warehouse_3pl_operations':
            if 'void' in query_lower and 'label' in query_lower:
                return 'void_label'
            elif 'pause' in query_lower and 'fulfillment' in query_lower:
                return 'pause_fulfillment'
            elif 'remove' in query_lower and 'batch' in query_lower:
                return 'remove_from_batch'
            elif 'inventory' in query_lower:
                return 'check_inventory'
            elif 'location' in query_lower:
                return 'manage_location'
            else:
                return 'warehouse_operation'
        
        elif category == 'message_operations':
            if 'template' in query_lower:
                return 'send_template'
            elif 'media' in query_lower:
                return 'send_media'
            elif 'webhook' in query_lower:
                return 'configure_webhook'
            elif 'profile' in query_lower:
                return 'manage_profile'
            else:
                return 'send_text'
        
        return 'generic_operation'
    
    def extract_parameters(self, query: str, intent: str) -> Dict[str, Any]:
        """Extract parameters from the query based on the intent."""
        params = {}
        
        # Extract order numbers
        order_match = re.search(r'order #?(\d+)', query, re.IGNORECASE)
        if order_match:
            params['order_number'] = order_match.group(1)
        
        # Extract phone numbers
        phone_match = re.search(r'\+?(\d{10,})', query)
        if phone_match:
            params['phone_number'] = '+' + phone_match.group(1)
        
        # Extract media IDs
        media_match = re.search(r'media_id:?\s*(media\.\d+)', query, re.IGNORECASE)
        if media_match:
            params['media_id'] = media_match.group(1)
        
        # Extract template names
        template_match = re.search(r'template "([^"]+)"', query)
        if template_match:
            params['template_name'] = template_match.group(1)
        
        # Extract webhook URLs
        webhook_match = re.search(r'https://[^\s]+', query)
        if webhook_match:
            params['webhook_url'] = webhook_match.group(0)
        
        # Extract variables
        vars_match = re.search(r'variables:?\s*([^"]+)', query, re.IGNORECASE)
        if vars_match:
            vars_str = vars_match.group(1)
            try:
                params['variables'] = dict(item.split('=') for item in vars_str.split(', '))
            except:
                params['variables'] = vars_str
        
        # Extract SKUs
        sku_match = re.search(r'SKU:?\s*([A-Za-z0-9]+)', query, re.IGNORECASE)
        if sku_match:
            params['sku'] = sku_match.group(1)
        
        return params
    
    def get_response_format(self, category: str, intent: str) -> Optional[str]:
        """Get the response format for a specific intent."""
        for filename, data in self.guidelines.items():
            if 'guidelines' in data:
                for cat, details in data['guidelines'].items():
                    if cat == category and 'response_format' in details:
                        return details['response_format'].get(intent)
        return None
    
    def get_workflow_steps(self, category: str, intent: str) -> List[str]:
        """Get the workflow steps for a specific intent."""
        for filename, data in self.guidelines.items():
            if 'guidelines' in data and 'workflow' in data['guidelines']:
                workflow = data['guidelines']['workflow']
                if intent in workflow:
                    return workflow[intent]
        return []
    
    def apply_response_rules(self, response: str) -> str:
        """Apply response rules to ensure the response follows guidelines."""
        # Get response rules from all guidelines
        always_include = []
        never_include = []
        format_guidelines = {}
        
        for filename, data in self.guidelines.items():
            if 'response_rules' in data:
                rules = data['response_rules']
                if 'always_include' in rules:
                    always_include.extend(rules['always_include'])
                if 'never_include' in rules:
                    never_include.extend(rules['never_include'])
                if 'format_guidelines' in rules:
                    format_guidelines.update(rules['format_guidelines'])
        
        # Check if response includes required elements
        for requirement in always_include:
            if requirement.lower() not in response.lower():
                logger.warning(f"Response missing required element: {requirement}")
        
        # Check if response includes forbidden elements
        for forbidden in never_include:
            if forbidden.lower() in response.lower():
                logger.warning(f"Response includes forbidden element: {forbidden}")
                # Remove or replace forbidden elements
                response = response.replace(forbidden, '')
        
        return response
    
    def handle_error(self, category: str, intent: str, error_type: str) -> str:
        """Generate an error response based on the error type."""
        for filename, data in self.guidelines.items():
            if 'error_handling' in data:
                error_handling = data['error_handling']
                if error_type in error_handling:
                    return error_handling[error_type]
        
        # Default error response
        return "I encountered an error processing your request. Please try again or contact support."
    
    def generate_response(self, query: str) -> Dict[str, Any]:
        """Generate a response for a user query based on the guidelines."""
        # Identify intent and category
        category, intent = self.identify_intent(query)
        logger.info(f"Identified intent: {intent} in category: {category}")
        
        # Extract parameters
        params = self.extract_parameters(query, intent)
        logger.info(f"Extracted parameters: {params}")
        
        # Get response format
        response_format = self.get_response_format(category, intent)
        
        # Generate response
        if response_format:
            # Replace placeholders in the response format
            response = response_format
            for key, value in params.items():
                placeholder = f"[{key}]"
                if placeholder in response:
                    response = response.replace(placeholder, str(value))
            
            # Replace remaining placeholders with default values
            response = self._replace_remaining_placeholders(response)
        else:
            # Generate a generic response
            response = self._generate_generic_response(category, intent, params)
        
        # Apply response rules
        response = self.apply_response_rules(response)
        
        # Get workflow steps
        workflow = self.get_workflow_steps(category, intent)
        
        # Return the complete response data
        return {
            'query': query,
            'category': category,
            'intent': intent,
            'parameters': params,
            'response': response,
            'workflow': workflow,
            'timestamp': datetime.now().isoformat()
        }
    
    def _replace_remaining_placeholders(self, response: str) -> str:
        """Replace any remaining placeholders in the response."""
        # Replace order numbers
        if '[number]' in response:
            response = response.replace('[number]', '12345')
        
        # Replace dates
        if '[date]' in response:
            from datetime import datetime, timedelta
            future_date = datetime.now() + timedelta(days=3)
            response = response.replace('[date]', future_date.strftime('%B %d'))
        
        # Replace message IDs
        if '[message_id]' in response:
            response = response.replace('[message_id]', f"wamid.{datetime.now().strftime('%Y%m%d%H%M%S')}")
        
        # Replace media IDs
        if '[media_id]' in response:
            response = response.replace('[media_id]', f"media.{datetime.now().strftime('%Y%m%d%H%M%S')}")
        
        # Replace template names
        if '[template_name]' in response:
            response = response.replace('[template_name]', 'order_confirmation')
        
        # Replace webhook URLs
        if '[webhook_url]' in response:
            response = response.replace('[webhook_url]', 'https://api.example.com/webhook')
        
        # Replace recipients
        if '[recipient]' in response:
            response = response.replace('[recipient]', '+1234567890')
        
        return response
    
    def _generate_generic_response(self, category: str, intent: str, params: Dict[str, Any]) -> str:
        """Generate a generic response when no specific format is available."""
        if category == 'warehouse_3pl_operations':
            if 'order_number' in params:
                return f"I've processed your request for order #{params['order_number']}."
            else:
                return "I've processed your warehouse operation request."
        
        elif category == 'message_operations':
            if 'phone_number' in params:
                return f"I've sent your message to {params['phone_number']}."
            else:
                return "I've processed your messaging request."
        
        return "I've processed your request."

def main():
    """Main function to test the response filter."""
    try:
        # Initialize the response filter
        filter = ResponseFilter()
        
        # Test queries
        test_queries = [
            "Can you void the shipping label for order #12345?",
            "Send a message to +1987654321 saying 'Your order has been shipped'",
            "Update the business profile description",
            "Configure a webhook at https://api.example.com/webhook",
            "Check the inventory level for SKU ABC123"
        ]
        
        # Process each query
        for query in test_queries:
            logger.info(f"Processing query: {query}")
            response_data = filter.generate_response(query)
            logger.info(f"Generated response: {response_data['response']}")
            logger.info(f"Workflow steps: {response_data['workflow']}")
            logger.info("---")
        
    except Exception as e:
        logger.error(f"Error testing response filter: {str(e)}")
        raise

if __name__ == "__main__":
    main() 