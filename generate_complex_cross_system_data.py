#!/usr/bin/env python3
"""
Script to generate complex cross-system training examples and insert them into Supabase.
This script generates examples that involve multiple tools and complex interactions.
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

def insert_batch(supabase: Client, examples: list, batch_size: int = 25):
    """Insert training data into Supabase with batch processing"""
    inserted_count = 0
    error_count = 0
    total_examples = len(examples)
    
    # Process in batches
    for i in range(0, total_examples, batch_size):
        batch = examples[i:i+batch_size]
        batch_size_actual = len(batch)
        print(f"Processing batch {i//batch_size + 1} ({i+1}-{i+batch_size_actual} of {total_examples})")
        
        try:
            # Insert batch into Supabase
            result = supabase.table('training_data').insert(batch).execute()
            
            if result.error:
                print(f"Error inserting batch: {result.error}")
                error_count += batch_size_actual
            else:
                inserted_count += batch_size_actual
                print(f"Successfully inserted batch of {batch_size_actual} examples")
                
        except Exception as e:
            print(f"Error inserting batch: {str(e)}")
            error_count += batch_size_actual
            
        # Brief pause between batches to avoid rate limiting
        time.sleep(0.05)
    
    return inserted_count, error_count

def generate_complex_example(i: int) -> dict:
    """Generate a complex cross-system training example"""
    # Example of a complex interaction involving multiple tools
    example = {
        'id': f'complex_example_{i}_{int(time.time())}',
        'tool': 'complex_interaction',
        'intent': 'multi_step_task',
        'query': f'Complex query {i} involving multiple steps',
        'response': f'Complex response {i} with multiple tool interactions',
        'metadata': {
            'generated_at': datetime.now().isoformat(),
            'complexity': 'high',
            'involved_tools': ['tool1', 'tool2', 'tool3'],
            'steps': [
                {'tool': 'tool1', 'action': 'initial_action'},
                {'tool': 'tool2', 'action': 'secondary_action'},
                {'tool': 'tool3', 'action': 'final_action'}
            ]
        }
    }
    return example

def main():
    parser = argparse.ArgumentParser(description='Generate complex cross-system training examples')
    parser.add_argument('--count', type=int, default=10, help='Number of examples to generate')
    parser.add_argument('--batch-size', type=int, default=25, help='Number of examples per batch')
    parser.add_argument('--output-file', type=str, help='Output JSON file to save examples')
    
    args = parser.parse_args()
    
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Generate examples
        print(f"Generating {args.count} complex examples...")
        examples = []
        for i in range(args.count):
            example = generate_complex_example(i)
            examples.append(example)
        
        # Save to file if specified
        if args.output_file:
            print(f"Saving examples to {args.output_file}...")
            with open(args.output_file, 'w') as f:
                json.dump(examples, f, indent=2)
        
        # Insert into Supabase
        print("\nInserting examples into Supabase...")
        inserted, errors = insert_batch(supabase, examples, args.batch_size)
        
        # Print summary
        print("\nGeneration and Insertion Summary:")
        print(f"Total examples generated: {len(examples)}")
        print(f"Successfully inserted: {inserted}")
        print(f"Errors: {errors}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
        
    return 0

if __name__ == "__main__":
    main()