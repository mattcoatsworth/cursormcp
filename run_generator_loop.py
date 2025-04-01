#!/usr/bin/env python3
"""
Script to run the small generator repeatedly until we reach 500 additional examples
"""

import os
import time
import sys
from datetime import datetime
from run_ms_generator_small import main as generate_small_batch

# How many total examples to generate
TARGET_TOTAL = 500

# Number of examples per batch
EXAMPLES_PER_BATCH = 1

# Time to sleep between batches (in seconds)
SLEEP_TIME = 60

def main():
    """Run the generator in a loop until we reach the target"""
    print(f"Starting generation loop to create {TARGET_TOTAL} examples")
    
    total_inserted = 0
    batch_num = 1
    
    while total_inserted < TARGET_TOTAL:
        print(f"\n--- Batch {batch_num} ---")
        print(f"Generated {total_inserted} of {TARGET_TOTAL} examples so far")
        
        try:
            generated = generate_small_batch()
            total_inserted += generated
            
            # Generate a unique filename for this batch
            batch_filename = f"multi_service_examples_batch_{batch_num}_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
            
            # Copy the current batch file to a uniquely named file for later bulk insertion
            os.system(f"cp multi_service_examples_small_batch.json {batch_filename}")
            print(f"Saved batch {batch_num} as {batch_filename}")
            
            print(f"Progress: {total_inserted}/{TARGET_TOTAL} examples ({total_inserted/TARGET_TOTAL*100:.1f}%)")
            
            # Break if we've reached or exceeded the target
            if total_inserted >= TARGET_TOTAL:
                break
                
            # Sleep between batches
            print(f"Sleeping for {SLEEP_TIME} seconds before next batch...")
            time.sleep(SLEEP_TIME)
            
        except Exception as e:
            print(f"Error in batch {batch_num}: {e}")
            print("Sleeping for 60 seconds to recover...")
            time.sleep(60)
        
        batch_num += 1
    
    print(f"\nGeneration complete! Generated {total_inserted} examples total.")

if __name__ == "__main__":
    main()