#!/usr/bin/env python3
"""
This script bulk inserts locally generated training data into Supabase.
It reads the JSON files stored in a specific file and inserts them
into Supabase using the Supabase Python client.
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

def main():
    parser = argparse.ArgumentParser(description="Bulk insert training data from local files to Supabase")
    parser.add_argument("--input-dir", required=True, help="Directory containing JSON files")
    parser.add_argument("--batch-size", type=int, default=100, help="Number of records to insert in each batch")
    parser.add_argument("--sleep-time", type=float, default=0.1, help="Seconds to sleep between batches")
    
    args = parser.parse_args()
    
    # Connect to Supabase
    supabase = connect_to_supabase()
    
    # Get list of JSON files
    json_files = [f for f in os.listdir(args.input_dir) if f.endswith('.json')]
    
    if not json_files:
        print(f"No JSON files found in {args.input_dir}")
        return
        
    print(f"Found {len(json_files)} JSON files to process")
    
    total_records = 0
    start_time = time.time()
    
    for json_file in json_files:
        file_path = os.path.join(args.input_dir, json_file)
        print(f"\nProcessing {json_file}...")
        
        try:
            with open(file_path, 'r') as f:
                records = json.load(f)
                
            if not records:
                print(f"No records found in {json_file}")
                continue
                
            print(f"Found {len(records)} records to insert")
            
            # Process records in batches
            for i in range(0, len(records), args.batch_size):
                batch = records[i:i + args.batch_size]
                
                try:
                    # Insert batch into Supabase
                    result = supabase.table('training_data').insert(batch).execute()
                    
                    if result.error:
                        print(f"Error inserting batch: {result.error}")
                    else:
                        print(f"Successfully inserted batch of {len(batch)} records")
                        total_records += len(batch)
                        
                except Exception as e:
                    print(f"Error inserting batch: {str(e)}")
                    
                # Sleep between batches to avoid rate limiting
                time.sleep(args.sleep_time)
                
        except Exception as e:
            print(f"Error processing {json_file}: {str(e)}")
            continue
            
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"\nMigration completed:")
    print(f"Total records inserted: {total_records}")
    print(f"Total time: {duration:.2f} seconds")
    print(f"Average speed: {total_records/duration:.2f} records/second")

if __name__ == "__main__":
    main()