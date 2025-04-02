#!/usr/bin/env python3
"""
Unified script to generate and insert training examples in batches.

This script:
1. Generates a small batch of multi-service examples using run_ms_generator_small.py
2. Inserts them into Supabase using the Supabase Python client
3. Repeats until the target number of examples is reached
"""

import os
import json
import time
import argparse
from datetime import datetime
from supabase import create_client, Client

# Import the generate function from other script
from run_ms_generator_small import main as generate_small_batch

# Default settings
DEFAULT_TARGET = 500  # Total number of examples to generate
DEFAULT_BATCH_SIZE = 10  # Number of examples per bulk insertion
DEFAULT_SLEEP_TIME = 0.1  # Seconds to sleep between generations (much faster)

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

def main():
    parser = argparse.ArgumentParser(description='Generate and insert training data')
    parser.add_argument('--target', type=int, default=DEFAULT_TARGET, help='Target number of examples to generate')
    parser.add_argument('--batch-size', type=int, default=DEFAULT_BATCH_SIZE, help='Number of examples per batch')
    parser.add_argument('--sleep-time', type=float, default=DEFAULT_SLEEP_TIME, help='Seconds to sleep between generations')
    
    args = parser.parse_args()
    
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        total_generated = 0
        total_inserted = 0
        total_errors = 0
        start_time = time.time()
        
        while total_generated < args.target:
            # Generate a batch of examples
            print(f"\nGenerating batch of {args.batch_size} examples...")
            examples = generate_small_batch(args.batch_size)
            
            if not examples:
                print("No examples generated, stopping.")
                break
                
            total_generated += len(examples)
            print(f"Generated {len(examples)} examples (total: {total_generated}/{args.target})")
            
            # Insert the batch
            inserted, errors = insert_batch(supabase, examples, args.batch_size)
            total_inserted += inserted
            total_errors += errors
            
            # Sleep between generations
            time.sleep(args.sleep_time)
            
        end_time = time.time()
        duration = end_time - start_time
        
        print("\nGeneration and insertion complete:")
        print(f"Total examples generated: {total_generated}")
        print(f"Total examples inserted: {total_inserted}")
        print(f"Total errors: {total_errors}")
        print(f"Total time: {duration:.2f} seconds")
        print(f"Average speed: {total_generated/duration:.2f} examples/second")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
        
    return 0

if __name__ == "__main__":
    main()