#!/usr/bin/env python3
"""
Script to generate training data responses following system_training guidelines,
track applied guidelines, and store everything in the training_data table.
"""

import os
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_to_supabase() -> Client:
    """Connect to Supabase using environment variables"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
        
    return create_client(supabase_url, supabase_key)

def get_system_guidelines(supabase: Client) -> Dict[str, Any]:
    """Fetch all system training guidelines"""
    print("\nFetching system guidelines...")
    result = supabase.table('system_training').select('*').execute()
    
    if hasattr(result, 'error') and result.error:
        raise Exception(f"Error fetching system guidelines: {result.error}")
        
    guidelines = {}
    for entry in result.data:
        # Skip duplicate system entries
        if entry['category'] == 'system' and 'system' in guidelines:
            continue
        guidelines[entry['category']] = entry
        print(f"Found guidelines for category: {entry['category']}")
    return guidelines

def determine_applicable_guidelines(query: str, guidelines: Dict[str, Any]) -> Dict[str, Any]:
    """Determine which guidelines apply to the query"""
    print(f"\nAnalyzing query: {query}")
    applicable = {
        'general_guidelines': [],
        'domain_guidelines': []
    }
    
    # Always apply system response guidelines
    applicable['general_guidelines'].append({
        'category': 'system',
        'name': guidelines.get('system', {}).get('name', 'System Guidelines'),
        'applied_rules': ['tone', 'format', 'structure']
    })
    print("Applied system response guidelines")
    
    # Check for domain-specific guidelines
    query_lower = query.lower()
    
    # Check warehouse/3PL guidelines
    if any(term in query_lower for term in ['warehouse', '3pl', 'fulfillment', 'inventory', 'shipping']):
        if 'warehouse_3pl' in guidelines:
            applicable['domain_guidelines'].append({
                'category': 'warehouse_3pl',
                'name': guidelines['warehouse_3pl'].get('name', 'Warehouse/3PL Guidelines'),
                'applied_rules': ['fulfillment_control', 'inventory_management']
            })
            print("Applied warehouse/3PL guidelines")
    
    # Check data handling guidelines
    if any(term in query_lower for term in ['data', 'validation', 'process', 'transform']):
        applicable['domain_guidelines'].append({
            'category': 'data_handling',
            'name': guidelines.get('data_handling', {}).get('name', 'Data Processing Guidelines'),
            'applied_rules': ['validation', 'transformation']
        })
        print("Applied data handling guidelines")
    
    # Check API integration guidelines
    if any(term in query_lower for term in ['api', 'endpoint', 'integration', 'connect']):
        applicable['domain_guidelines'].append({
            'category': 'api_integration',
            'name': guidelines.get('api_integration', {}).get('name', 'API Integration Guidelines'),
            'applied_rules': ['authentication', 'rate_limiting']
        })
        print("Applied API integration guidelines")
    
    # Check error handling guidelines
    if any(term in query_lower for term in ['error', 'exception', 'fail', 'issue']):
        applicable['domain_guidelines'].append({
            'category': 'error_handling',
            'name': guidelines.get('error_handling', {}).get('name', 'Error Handling Guidelines'),
            'applied_rules': ['detection', 'recovery']
        })
        print("Applied error handling guidelines")
    
    return applicable

def generate_response(query: str, applicable_guidelines: Dict[str, Any], guidelines: Dict[str, Any]) -> str:
    """Generate a response following the applicable guidelines"""
    print("\nGenerating response...")
    response_parts = []
    
    # Apply general response guidelines
    if applicable_guidelines['general_guidelines']:
        system_guidelines = guidelines.get('system', {}).get('guidelines', {})
        if isinstance(system_guidelines, dict) and 'response_examples' in system_guidelines:
            if isinstance(system_guidelines['response_examples'], list):
                if system_guidelines['response_examples']:
                    response_parts.append(system_guidelines['response_examples'][0])
            elif isinstance(system_guidelines['response_examples'], dict):
                example = next(iter(system_guidelines['response_examples'].values()))
                response_parts.append(example)
        if not response_parts:
            response_parts.append("I'll help you with that.")
        print("Applied general response format")
    
    # Apply domain-specific guidelines
    for domain in applicable_guidelines['domain_guidelines']:
        domain_guidelines = guidelines.get(domain['category'], {}).get('guidelines', {})
        
        # Add relevant response examples
        if isinstance(domain_guidelines, dict) and 'response_examples' in domain_guidelines:
            if isinstance(domain_guidelines['response_examples'], dict):
                # Handle structured response examples
                for key, example in domain_guidelines['response_examples'].items():
                    if key in query.lower():
                        formatted_example = (example.replace('[number]', '12345')  # Example order number
                                                 .replace('[date]', '2024-04-10')   # Example date
                                                 .replace('[SKU]', 'ABC123')        # Example SKU
                                                 .replace('[quantity]', '50')       # Example quantity
                                                 .replace('[location]', 'Warehouse A')  # Example location
                                                 .replace('[action]', 'processed')      # Example action
                                                 .replace('[reason/explanation]', 'as requested')) # Example reason
                        response_parts.append(formatted_example)
                        print(f"Added response example for {key}")
            elif isinstance(domain_guidelines['response_examples'], list) and domain_guidelines['response_examples']:
                response_parts.append(domain_guidelines['response_examples'][0])
                print(f"Added response example for {domain['category']}")
    
    # Combine response parts
    response = " ".join(response_parts)
    
    # Ensure response follows general guidelines
    if not response:
        response = "I understand your query. Let me help you with that following the appropriate guidelines."
        print("Using default response format")
    
    return response

def store_training_data(supabase: Client, query: str, response: str, 
                       applicable_guidelines: Dict[str, Any], version: str = "1.0") -> None:
    """Store the generated response and metadata in training_data table"""
    print("\nStoring training data...")
    
    # Determine primary category from guidelines
    category = "system"
    if applicable_guidelines['domain_guidelines']:
        category = applicable_guidelines['domain_guidelines'][0]['category']
    
    training_data = {
        'id': str(uuid.uuid4()),
        'tool': 'system',  # All responses use the system tool
        'intent': 'response',  # All entries are responses
        'query': query,
        'response': response,
        'applied_guidelines': applicable_guidelines,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'version': version,
        'source': ['system_generated'],
        'is_active': True
    }
    
    print("Training data to store:")
    print(json.dumps(training_data, indent=2))
    
    result = supabase.table('training_data').insert(training_data).execute()
    
    if hasattr(result, 'error') and result.error:
        raise Exception(f"Error storing training data: {result.error}")
    print("Successfully stored training data")

def process_training_query(query: str, version: str = "1.0"):
    """Process a training query and store the result"""
    try:
        print(f"\n{'='*50}")
        print(f"Processing query: {query}")
        print(f"{'='*50}")
        
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Get system guidelines
        guidelines = get_system_guidelines(supabase)
        
        # Determine applicable guidelines
        applicable_guidelines = determine_applicable_guidelines(query, guidelines)
        
        # Generate response
        response = generate_response(query, applicable_guidelines, guidelines)
        
        # Store in training_data table
        store_training_data(supabase, query, response, applicable_guidelines, version)
        
        print("\nSummary:")
        print(f"Query: {query}")
        print(f"Response: {response}")
        print("Applied guidelines:")
        print(json.dumps(applicable_guidelines, indent=2))
        print(f"{'='*50}\n")
        
    except Exception as e:
        print(f"\nError processing query: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response: {e.response.text if hasattr(e.response, 'text') else e.response}")

def main():
    """Main function"""
    # Example queries to process
    example_queries = [
        "How do I check warehouse inventory levels?",
        "What's the process for handling API rate limits?",
        "How should I validate customer data?",
        "What's the error handling procedure for failed orders?"
    ]
    
    print("Starting training data generation...")
    for query in example_queries:
        process_training_query(query)
    print("\nProcessing completed")

if __name__ == "__main__":
    main() 