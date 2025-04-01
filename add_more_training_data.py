#!/usr/bin/env python3
"""
Script to generate a specific number of additional training examples
This script can be run multiple times to incrementally add examples without timing out
"""

import os
import sys
import json
import time
import argparse
import subprocess
import psycopg2
from datetime import datetime

def count_existing_examples():
    """Count the number of examples in the database"""
    try:
        # Use the DATABASE_URL to count existing records
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            print("DATABASE_URL not found, cannot count existing examples")
            return None
            
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM training_data")
        count = cur.fetchone()[0]
        conn.close()
        
        return count
    except Exception as e:
        print(f"Error counting examples: {e}")
        return None

def generate_examples(batch_size=10, sleep_time=0.1):
    """Generate a batch of examples using the optimized script"""
    print(f"Generating {batch_size} examples...")
    
    # Run the generate_and_insert.py script
    cmd = [
        "python", "generate_and_insert.py",
        "--target", str(batch_size),
        "--batch-size", "10",
        "--sleep-time", str(sleep_time)
    ]
    
    try:
        # Execute the process
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        # Stream output in real-time
        print("Output from generation process:")
        print("-" * 40)
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())
        
        # Get the return code
        return_code = process.poll()
        
        # Capture and print any errors
        stderr = process.stderr.read()
        if stderr:
            print("\nErrors:")
            print(stderr)
        
        if return_code == 0:
            print(f"Successfully generated batch of {batch_size} examples")
            return True
        else:
            print(f"Generation failed with return code {return_code}")
            return False
            
    except Exception as e:
        print(f"Error running generation script: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Generate additional training examples")
    parser.add_argument("--batch-size", type=int, default=10,
                        help="Number of examples to generate in this run (default: 10)")
    parser.add_argument("--target", type=int, default=500,
                        help="Target total number of examples (default: 500)")
    parser.add_argument("--sleep-time", type=float, default=0.1,
                        help="Sleep time between generations (default: 0.1)")
    
    args = parser.parse_args()
    
    # Get the current count
    start_count = count_existing_examples()
    if start_count is None:
        print("Cannot determine current example count, using batch size only")
        batch_to_generate = args.batch_size
    else:
        print(f"Current training data count: {start_count}")
        remaining = args.target - start_count
        if remaining <= 0:
            print(f"Target of {args.target} already reached!")
            return 0
            
        print(f"Need {remaining} more examples to reach target of {args.target}")
        batch_to_generate = min(args.batch_size, remaining)
        print(f"Will generate {batch_to_generate} examples in this run")
    
    # Start timer
    start_time = time.time()
    
    # Generate the examples
    success = generate_examples(batch_to_generate, args.sleep_time)
    
    # End timer
    end_time = time.time()
    duration = end_time - start_time
    
    # Get the final count
    end_count = count_existing_examples()
    if end_count is not None and start_count is not None:
        added = end_count - start_count
        print(f"Added {added} examples in {duration:.1f} seconds")
        print(f"Current total: {end_count}")
        
        if args.target > end_count:
            print(f"Still need {args.target - end_count} more examples to reach target")
            print(f"Run this script again with: python {sys.argv[0]} --batch-size {min(args.batch_size, args.target - end_count)}")
        else:
            print(f"Target of {args.target} examples reached or exceeded!")
    else:
        if success:
            print(f"Generation completed in {duration:.1f} seconds")
            print("Unable to determine exact count, but generation seems successful")
        else:
            print(f"Generation failed after {duration:.1f} seconds")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())