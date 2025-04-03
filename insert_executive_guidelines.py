#!/usr/bin/env python3
"""
Script to insert executive perspective guidelines into the system_training table.
"""

import os
import json
import uuid
from datetime import datetime
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

def insert_executive_guidelines():
    """Insert executive perspective guidelines into system_training table"""
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Prepare the executive guidelines data
        data = {
            'id': str(uuid.uuid4()),
            'category': 'executive_perspective',
            'name': 'Executive Perspective Guidelines',
            'description': 'Guidelines for maintaining executive/founder perspective in all responses',
            'guidelines': {
                'general_guidelines': [
                    'Always frame responses from the perspective of a founder, CEO, or executive',
                    'Use collective language ("we", "our") instead of individual ("I", "me")',
                    'Focus on strategic business impact rather than operational details',
                    'Emphasize ROI, growth, and business outcomes',
                    'Consider market position and competitive landscape'
                ],
                'query_transformation': {
                    'operational_indicators': [
                        'how do i', 'how to', 'what is', 'where is', 'when should i',
                        'step by step', 'tutorial', 'guide', 'instructions',
                        'help me', 'tell me how', 'show me how'
                    ],
                    'executive_indicators': [
                        'strategy', 'roi', 'cost', 'revenue', 'growth',
                        'risk', 'performance', 'metrics', 'trends',
                        'optimization', 'efficiency', 'scale', 'expansion',
                        'competitive', 'market', 'strategic', 'investment',
                        'our', 'we', 'business', 'company'
                    ],
                    'transformations': {
                        'how do i': 'how can we',
                        'what is': "what's our strategy for",
                        'how to': 'how should we approach',
                        'tell me': 'what are our options for',
                        'show me': 'how can we analyze',
                        'where is': 'how should we track',
                        'when should i': 'when should our team',
                        'help me': 'what strategies exist for',
                        'i need': 'we need',
                        'my': 'our',
                        'i want': 'we aim',
                        'can i': 'can we'
                    }
                },
                'response_examples': {
                    'operational_query': 'How do I fix inventory issues?',
                    'executive_query': 'How can we optimize our inventory management considering our financial objectives?',
                    'operational_query_2': 'What is the server status?',
                    'executive_query_2': "What's our strategy for monitoring and improving system performance to enhance our technical infrastructure?"
                }
            },
            'tags': ['executive_perspective', 'response_guidelines', 'tone_standards'],
            'source': ['system_training'],
            'version': 1,
            'is_active': True
        }
        
        # Insert the data
        result = supabase.table('system_training').insert(data).execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"Error inserting executive guidelines: {result.error}")
        else:
            print("Successfully inserted executive perspective guidelines")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response: {e.response.text if hasattr(e.response, 'text') else e.response}")

if __name__ == "__main__":
    insert_executive_guidelines() 