#!/usr/bin/env python3
"""
Fast training data generator loop that generates and inserts examples continuously.
This script is optimized for speed and uses batch processing.
"""

import os
import json
import time
import argparse
from datetime import datetime
from supabase import create_client, Client

# Connect to Supabase
def connect_to_supabase() -> Client:
    """Connect to Supabase using environment variables"""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
        
    return create_client(supabase_url, supabase_key)

def insert_batch(supabase: Client, examples: list, batch_size: int = 25):
    """Insert training data into Supabase with batch processing for speed"""
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

def generate_example(i: int) -> dict:
    """Generate a single training example"""
    return {
        'id': f'example_{i}_{int(time.time())}',
        'tool': 'example_tool',
        'intent': 'example_intent',
        'query': f'Example query {i}',
        'response': f'Example response {i}',
        'metadata': {
            'generated_at': datetime.now().isoformat()
        }
    }

def main():
    parser = argparse.ArgumentParser(description='Fast training data generator loop')
    parser.add_argument('--batch-size', type=int, default=25, help='Number of examples per batch')
    parser.add_argument('--sleep-time', type=float, default=0.1, help='Seconds to sleep between batches')
    parser.add_argument('--output-file', type=str, default='generated_examples.json', help='Output JSON file')
    
    args = parser.parse_args()
    
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        total_generated = 0
        total_inserted = 0
        total_errors = 0
        start_time = time.time()
        
        while True:
            try:
                # Generate a batch of examples
                examples = []
                for i in range(args.batch_size):
                    example = generate_example(total_generated + i)
                    examples.append(example)
                
                # Save progress to file
                with open(args.output_file, 'w') as f:
                    json.dump(examples, f, indent=2)
                
                # Insert batch into Supabase
                inserted, errors = insert_batch(supabase, examples, args.batch_size)
                total_generated += len(examples)
                total_inserted += inserted
                total_errors += errors
                
                # Print progress
                duration = time.time() - start_time
                print(f"\nProgress:")
                print(f"Generated: {total_generated}")
                print(f"Inserted: {total_inserted}")
                print(f"Errors: {total_errors}")
                print(f"Time: {duration:.2f} seconds")
                print(f"Rate: {total_generated/duration:.2f} examples/second")
                
                # Sleep before next batch
                time.sleep(args.sleep_time)
                
            except KeyboardInterrupt:
                print("\nStopping generator...")
                break
            except Exception as e:
                print(f"Error in batch: {str(e)}")
                time.sleep(5)  # Wait a bit longer on error
                continue
        
    except Exception as e:
        print(f"Fatal error: {str(e)}")
        return 1
        
    return 0

if __name__ == "__main__":
    main()