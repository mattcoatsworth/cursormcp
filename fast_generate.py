#!/usr/bin/env python3
"""
Script to rapidly generate training data by running multiple processes in parallel
"""

import os
import sys
import time
import subprocess
import argparse
import concurrent.futures
from datetime import datetime

def generate_in_process(process_id, count_per_process=10):
    """Generate examples in a separate process"""
    print(f"Process {process_id} starting to generate {count_per_process} examples...")
    
    # Calculate target range for this process
    start_count = 1 + (process_id - 1) * count_per_process
    end_count = start_count + count_per_process - 1
    
    print(f"Process {process_id} will generate examples {start_count} to {end_count}")
    
    # Run the generate_and_insert.py script with the appropriate arguments
    cmd = [
        "python", "generate_and_insert.py",
        "--target", str(count_per_process),
        "--batch-size", "10",
        "--sleep-time", "0.1"
    ]
    
    try:
        # Execute the process
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        # Capture output
        stdout, stderr = proc.communicate()
        
        # Log results
        with open(f"process_{process_id}_log.txt", "w") as log_file:
            log_file.write(f"STDOUT:\n{stdout}\n\nSTDERR:\n{stderr}")
        
        if proc.returncode == 0:
            print(f"Process {process_id} completed successfully")
            return True, count_per_process
        else:
            print(f"Process {process_id} failed with exit code {proc.returncode}")
            return False, 0
            
    except Exception as e:
        print(f"Error in process {process_id}: {e}")
        return False, 0

def main():
    """Run multiple generation processes in parallel"""
    parser = argparse.ArgumentParser(description="Fast multi-process training data generation")
    parser.add_argument("--workers", type=int, default=4, 
                        help="Number of parallel worker processes (default: 4)")
    parser.add_argument("--total", type=int, default=500,
                        help="Total number of examples to generate across all workers (default: 500)")
    parser.add_argument("--max-retries", type=int, default=3,
                        help="Maximum number of retries for failed processes (default: 3)")
    
    args = parser.parse_args()
    
    # Calculate examples per worker
    examples_per_worker = args.total // args.workers
    remainder = args.total % args.workers
    
    print(f"Starting fast generation with {args.workers} workers")
    print(f"Target: {args.total} examples total")
    print(f"Each worker will generate approximately {examples_per_worker} examples")
    
    start_time = time.time()
    
    # Create a list of worker assignments with adjusted counts for the remainder
    worker_assignments = []
    for i in range(1, args.workers + 1):
        # Distribute the remainder examples among the first 'remainder' workers
        count = examples_per_worker + (1 if i <= remainder else 0)
        worker_assignments.append((i, count))
    
    successful_count = 0
    failed_workers = []
    
    # First pass with all workers
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as executor:
        # Submit all workers
        future_to_worker = {
            executor.submit(generate_in_process, worker_id, count): (worker_id, count)
            for worker_id, count in worker_assignments
        }
        
        # Process results as they complete
        for future in concurrent.futures.as_completed(future_to_worker):
            worker_id, count = future_to_worker[future]
            try:
                success, generated = future.result()
                if success:
                    successful_count += generated
                    print(f"Worker {worker_id} successfully generated {generated} examples")
                else:
                    failed_workers.append((worker_id, count))
                    print(f"Worker {worker_id} failed to generate {count} examples")
            except Exception as e:
                print(f"Worker {worker_id} raised an exception: {e}")
                failed_workers.append((worker_id, count))
    
    # Handle retries for failed workers
    retry_count = 0
    while failed_workers and retry_count < args.max_retries:
        retry_count += 1
        print(f"\nRetry attempt {retry_count} for {len(failed_workers)} failed workers")
        
        retry_workers = failed_workers
        failed_workers = []
        
        with concurrent.futures.ProcessPoolExecutor(max_workers=len(retry_workers)) as executor:
            # Submit retry workers
            future_to_worker = {
                executor.submit(generate_in_process, worker_id, count): (worker_id, count)
                for worker_id, count in retry_workers
            }
            
            # Process retry results
            for future in concurrent.futures.as_completed(future_to_worker):
                worker_id, count = future_to_worker[future]
                try:
                    success, generated = future.result()
                    if success:
                        successful_count += generated
                        print(f"Retry worker {worker_id} successfully generated {generated} examples")
                    else:
                        failed_workers.append((worker_id, count))
                        print(f"Retry worker {worker_id} failed again")
                except Exception as e:
                    print(f"Retry worker {worker_id} raised an exception: {e}")
                    failed_workers.append((worker_id, count))
    
    # Calculate missing examples
    missing_examples = args.total - successful_count
    
    # Report results
    end_time = time.time()
    duration = end_time - start_time
    
    print("\n========================================")
    print("Fast Generation Complete!")
    print(f"Total time: {duration:.2f} seconds")
    print(f"Successfully generated: {successful_count} examples")
    
    if missing_examples > 0:
        print(f"Missing examples: {missing_examples}")
        print(f"Failed workers after {args.max_retries} retries: {len(failed_workers)}")
    else:
        print("All examples successfully generated!")
    
    print(f"Generation rate: {successful_count / duration:.2f} examples/second")
    print("========================================")
    
    return 0

if __name__ == "__main__":
    exit(main())