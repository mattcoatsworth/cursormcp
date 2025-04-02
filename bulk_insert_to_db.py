#!/usr/bin/env python3
"""
Script to bulk insert training data into Supabase.
This script reads from a JSON file and inserts the data in batches.
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

def main():
    parser = argparse.ArgumentParser(description='Bulk insert training data into Supabase')
    parser.add_argument('--input-file', type=str, required=True, help='Input JSON file containing training data')
    parser.add_argument('--batch-size', type=int, default=25, help='Number of examples per batch')
    parser.add_argument('--output-file', type=str, help='Output JSON file for failed inserts')
    
    args = parser.parse_args()
    
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Read input file
        print(f"Reading training data from {args.input_file}...")
        with open(args.input_file, 'r') as f:
            examples = json.load(f)
        
        if not isinstance(examples, list):
            examples = [examples]
        
        print(f"Found {len(examples)} examples to insert")
        
        # Insert data in batches
        inserted, errors = insert_batch(supabase, examples, args.batch_size)
        
        # Print summary
        print("\nInsertion Summary:")
        print(f"Total examples: {len(examples)}")
        print(f"Successfully inserted: {inserted}")
        print(f"Errors: {errors}")
        
        # Save failed inserts if any
        if errors > 0 and args.output_file:
            failed_examples = examples[inserted:]
            print(f"\nSaving {len(failed_examples)} failed examples to {args.output_file}...")
            with open(args.output_file, 'w') as f:
                json.dump(failed_examples, f, indent=2)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
        
    return 0

if __name__ == "__main__":
    main()