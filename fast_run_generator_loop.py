#!/usr/bin/env python3
"""
Script to run the generator in a parallel, high-performance loop
"""

import os
import sys
import time
import argparse
import subprocess
from datetime import datetime

def main():
    """Run the fast generator to create training data"""
    parser = argparse.ArgumentParser(description="Fast training data generator")
    parser.add_argument("--target", type=int, default=500,
                        help="Total number of examples to generate (default: 500)")
    parser.add_argument("--workers", type=int, default=4,
                        help="Number of parallel workers (default: 4)")
    parser.add_argument("--check-existing", action="store_true",
                        help="Check how many examples already exist before generating")
    parser.add_argument("--skip-existing", action="store_true",
                        help="Skip generation if target number already exists")
    
    args = parser.parse_args()
    
    existing_count = 0
    if args.check_existing or args.skip_existing:
        try:
            print("Checking existing training data count...")
            # Use the DATABASE_URL to count existing records
            import psycopg2
            
            database_url = os.environ.get("DATABASE_URL")
            if not database_url:
                print("DATABASE_URL not found, skipping existing count check")
            else:
                conn = psycopg2.connect(database_url)
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) FROM training_data")
                existing_count = cur.fetchone()[0]
                conn.close()
                
                print(f"Found {existing_count} existing training data examples")
                
                if args.skip_existing and existing_count >= args.target:
                    print(f"Target of {args.target} already met, skipping generation")
                    return 0
        except Exception as e:
            print(f"Error checking existing count: {e}")
            print("Continuing with generation")
    
    # Calculate adjusted target
    adjusted_target = max(0, args.target - existing_count)
    if adjusted_target <= 0:
        print("No additional examples needed")
        return 0
    
    print(f"Will generate {adjusted_target} additional examples")
    
    # Start timer
    start_time = time.time()
    
    # Run the fast generator script
    cmd = [
        "python", "fast_generate.py",
        "--total", str(adjusted_target),
        "--workers", str(args.workers)
    ]
    
    print(f"Running command: {' '.join(cmd)}")
    
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True
    )
    
    # Stream output in real-time
    while True:
        output = process.stdout.readline()
        if output == '' and process.poll() is not None:
            break
        if output:
            print(output.strip())
    
    # Get the return code
    return_code = process.poll()
    
    # Also capture any stderr output
    stderr = process.stderr.read()
    if stderr:
        print("ERRORS:")
        print(stderr)
    
    # Calculate elapsed time
    elapsed_time = time.time() - start_time
    
    # Print summary
    print("\n========================================")
    print(f"Fast generation completed in {elapsed_time:.1f} seconds")
    print(f"Return code: {return_code}")
    
    if return_code == 0:
        print(f"Successfully generated approximately {adjusted_target} examples")
        print(f"Total training examples: ~{existing_count + adjusted_target}")
        
        # Verify the actual count
        try:
            import psycopg2
            
            database_url = os.environ.get("DATABASE_URL")
            if database_url:
                conn = psycopg2.connect(database_url)
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) FROM training_data")
                final_count = cur.fetchone()[0]
                conn.close()
                
                print(f"Actual final count: {final_count} examples")
                print(f"Generated {final_count - existing_count} new examples")
        except Exception as e:
            print(f"Error checking final count: {e}")
    else:
        print("Fast generation completed with errors")
    
    print("========================================")
    
    return return_code

if __name__ == "__main__":
    exit(main())