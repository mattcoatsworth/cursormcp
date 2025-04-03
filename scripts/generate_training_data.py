import json
import re
import logging
from typing import List, Dict, Any
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def parse_questions(file_path: str) -> List[Dict[str, Any]]:
    """Parse questions from the file and extract intent information."""
    questions = []
    current_intent = None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
                
            # Check for intent headers
            if line.startswith('#'):
                current_intent = line[1:].strip()
                continue
                
            # Parse questions
            if line.startswith('-'):
                question = line[1:].strip()
                questions.append({
                    'intent': current_intent,
                    'query': question
                })
    
    return questions

def extract_parameters(query: str) -> Dict[str, Any]:
    """Extract parameters from the query."""
    params = {}
    
    # Extract phone numbers
    phone_match = re.search(r'\+(\d+)', query)
    if phone_match:
        params['phone_number'] = phone_match.group(0)
    
    # Extract order numbers
    order_match = re.search(r'order #(\d+)', query)
    if order_match:
        params['order_number'] = order_match.group(1)
    
    # Extract media IDs
    media_match = re.search(r'media_id: (media\.\d+)', query)
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
    vars_match = re.search(r'variables: ([^"]+)', query)
    if vars_match:
        vars_str = vars_match.group(1)
        params['variables'] = dict(item.split('=') for item in vars_str.split(', '))
    
    return params

def generate_response(intent: str, query: str, params: Dict[str, Any]) -> str:
    """Generate a response based on the intent and query."""
    if 'Send Text Message' in intent:
        return f"I've sent your message to {params.get('phone_number', 'the recipient')}. The message ID is wamid.{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    elif 'Template Messages' in intent:
        template_name = params.get('template_name', 'the template')
        return f"I've sent the {template_name} template to {params.get('phone_number', 'the recipient')} with the provided variables"
    
    elif 'Media Messages' in intent:
        media_type = 'media' if 'media_id' in params else 'file'
        return f"I've sent your {media_type} to {params.get('phone_number', 'the recipient')}. The media ID is {params.get('media_id', f'media.{datetime.now().strftime('%Y%m%d%H%M%S')}')}"
    
    elif 'Business Profile' in intent:
        return "I've updated your business profile with the provided information"
    
    elif 'Phone Numbers' in intent:
        return f"I've processed your request for phone number {params.get('phone_number', 'the specified number')}"
    
    elif 'Webhooks' in intent:
        return f"I've configured the webhook at {params.get('webhook_url', 'the specified URL')} to receive message events"
    
    elif 'Media Management' in intent:
        if 'upload' in query.lower():
            return f"I've uploaded the new media file. The media ID is media.{datetime.now().strftime('%Y%m%d%H%M%S')}"
        elif 'delete' in query.lower():
            return f"I've deleted the media file with ID {params.get('media_id', 'the specified ID')}"
        else:
            return "I've processed your media management request"
    
    elif 'Templates' in intent:
        if 'create' in query.lower():
            return f"I've created a new message template named '{params.get('template_name', 'the specified template')}'"
        elif 'update' in query.lower():
            return f"I've updated the template '{params.get('template_name', 'the specified template')}'"
        elif 'delete' in query.lower():
            return f"I've deleted the template '{params.get('template_name', 'the specified template')}'"
        else:
            return "I've processed your template management request"
    
    return "I've processed your WhatsApp request"

def generate_workflow_steps(intent: str, params: Dict[str, Any]) -> List[str]:
    """Generate workflow steps as text array."""
    steps = []
    
    # Add common steps
    steps.append("identify_intent")
    steps.append("validate_request")
    
    # Add intent-specific steps
    if 'Send Text Message' in intent:
        steps.extend([
            "validate_phone_number",
            "check_message_content",
            "send_whatsapp_message",
            "get_message_id"
        ])
    
    elif 'Template Messages' in intent:
        steps.extend([
            "validate_phone_number",
            "verify_template_exists",
            "validate_template_variables",
            "send_template_message",
            "get_message_id"
        ])
    
    elif 'Media Messages' in intent:
        steps.extend([
            "validate_phone_number",
            "verify_media_exists",
            "send_media_message",
            "get_message_id"
        ])
    
    elif 'Business Profile' in intent:
        steps.extend([
            "validate_profile_data",
            "update_business_profile",
            "verify_profile_update"
        ])
    
    elif 'Phone Numbers' in intent:
        steps.extend([
            "validate_phone_number",
            "check_verification_status",
            "process_verification_request"
        ])
    
    elif 'Webhooks' in intent:
        steps.extend([
            "validate_webhook_url",
            "verify_ssl_certificate",
            "configure_webhook",
            "test_webhook_connection"
        ])
    
    elif 'Media Management' in intent:
        if 'upload' in intent.lower():
            steps.extend([
                "validate_media_file",
                "upload_media",
                "get_media_id"
            ])
        elif 'delete' in intent.lower():
            steps.extend([
                "verify_media_exists",
                "delete_media"
            ])
        else:
            steps.extend([
                "check_media_status",
                "get_media_info"
            ])
    
    elif 'Templates' in intent:
        if 'create' in intent.lower():
            steps.extend([
                "validate_template_content",
                "check_template_guidelines",
                "create_template",
                "verify_template_creation"
            ])
        elif 'update' in intent.lower():
            steps.extend([
                "verify_template_exists",
                "validate_template_changes",
                "update_template",
                "verify_template_update"
            ])
        else:
            steps.extend([
                "list_templates",
                "process_template_request"
            ])
    
    # Add final steps
    steps.append("log_action")
    steps.append("return_response")
    
    return steps

def generate_training_data(questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate training data entries from questions."""
    training_data = []
    
    for q in questions:
        # Extract parameters from the query
        params = extract_parameters(q['query'])
        
        # Generate a response based on the intent and parameters
        response = generate_response(q['intent'], q['query'], params)
        
        # Generate workflow steps
        workflow = generate_workflow_steps(q['intent'], params)
        
        # Create training entry with properly formatted arrays for Supabase
        training_entry = {
            'tool': 'whatsapp',  # Default to WhatsApp since these are WhatsApp endpoints
            'intent': q['intent'],
            'query': q['query'],
            'response': response,
            'systems': ['whatsapp'],  # This will be automatically converted to JSON by Supabase
            'workflow': workflow,  # Now a text array
            'execution_details': {  # This will be automatically converted to JSON by Supabase
                'estimated_time': '2s',
                'required_permissions': ['whatsapp.send_message'],
                'parameters': params
            },
            'metadata': {  # This will be automatically converted to JSON by Supabase
                'category': 'whatsapp_api',
                'version': '1.0',
                'last_updated': datetime.now().isoformat()
            },
            'applied_guidelines': ['use_clear_language', 'maintain_professional_tone', 'include_relevant_context'],  # This will be automatically converted to JSON by Supabase
            'is_active': True,
            'source': ['manual_training'],  # Array format
            'follow_up_queries': [],  # Empty array
            'follow_up_responses': [],  # Empty array
            'follow_up_context': []  # Empty array
        }
        
        training_data.append(training_entry)
    
    return training_data

def main():
    """Main function to generate training data."""
    try:
        # Parse questions from the file
        questions = parse_questions('whatsapp_questions.txt')
        logger.info(f"Parsed {len(questions)} questions")
        
        # Generate training data
        training_data = generate_training_data(questions)
        logger.info(f"Generated {len(training_data)} training entries")
        
        # Save to file
        with open('training_data.json', 'w', encoding='utf-8') as f:
            json.dump(training_data, f, indent=2)
        logger.info("Saved training data to training_data.json")
        
    except Exception as e:
        logger.error(f"Error generating training data: {str(e)}")
        raise

if __name__ == "__main__":
    main() 