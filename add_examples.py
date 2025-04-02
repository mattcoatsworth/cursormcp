#!/usr/bin/env python3
"""
Script to add individual training examples to Supabase.
This script allows adding single examples or reading from a JSON file.
"""

import os
import json
import time
import argparse
from datetime import datetime
from supabase import create_client, Client

def connect_to_supabase() -> Client:
    """Connect to Supabase using environment variables"""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
        
    return create_client(supabase_url, supabase_key)

def insert_example(supabase: Client, example: dict):
    """Insert a single training example into Supabase"""
    try:
        result = supabase.table('training_data').insert(example).execute()
        
        if result.error:
            print(f"Error inserting example: {result.error}")
            return False
        else:
            print(f"Successfully inserted example with ID: {example.get('id', 'unknown')}")
            return True
            
    except Exception as e:
        print(f"Error inserting example: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Add training examples to Supabase')
    parser.add_argument('--input-file', type=str, help='Input JSON file containing training examples')
    parser.add_argument('--tool', type=str, help='Tool name for the example')
    parser.add_argument('--intent', type=str, help='Intent for the example')
    parser.add_argument('--query', type=str, help='Query text for the example')
    parser.add_argument('--response', type=str, help='Response text for the example')
    parser.add_argument('--metadata', type=str, help='JSON string of additional metadata')
    
    args = parser.parse_args()
    
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        if args.input_file:
            # Read examples from file
            print(f"Reading examples from {args.input_file}...")
            with open(args.input_file, 'r') as f:
                examples = json.load(f)
            
            if not isinstance(examples, list):
                examples = [examples]
            
            print(f"Found {len(examples)} examples to insert")
            
            success_count = 0
            error_count = 0
            
            for example in examples:
                if insert_example(supabase, example):
                    success_count += 1
                else:
                    error_count += 1
                    
                # Brief pause between inserts to avoid rate limiting
                time.sleep(0.05)
            
            print("\nInsertion Summary:")
            print(f"Total examples: {len(examples)}")
            print(f"Successfully inserted: {success_count}")
            print(f"Errors: {error_count}")
            
        else:
            # Create single example from command line arguments
            if not all([args.tool, args.intent, args.query, args.response]):
                print("Error: --tool, --intent, --query, and --response are required for single example insertion")
                return 1
            
            example = {
                'id': f'example_{int(time.time())}',
                'tool': args.tool,
                'intent': args.intent,
                'query': args.query,
                'response': args.response,
                'metadata': {
                    'generated_at': datetime.now().isoformat()
                }
            }
            
            if args.metadata:
                try:
                    additional_metadata = json.loads(args.metadata)
                    example['metadata'].update(additional_metadata)
                except json.JSONDecodeError:
                    print("Error: --metadata must be a valid JSON string")
                    return 1
            
            if insert_example(supabase, example):
                return 0
            else:
                return 1
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
        
    return 0

if __name__ == "__main__":
    main()