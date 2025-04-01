#!/usr/bin/env python3
"""
Script to generate a small batch of multi-service examples for the MCP
"""

import os
import sys
from generate_multi_service_examples import generate_complex_examples, save_to_json, insert_to_database

def main():
    """Generate 1 example per run"""
    print("Starting small batch generation of multi-service examples...")
    
    # Generate just 1 example at a time
    examples_per_batch = 1
    batch_size = 1
    
    examples = generate_complex_examples(examples_per_batch, batch_size=batch_size)
    
    # Save to a batch-specific backup file
    filename = f"multi_service_examples_small_batch.json"
    save_to_json(examples, filename)
    
    print(f"Generated examples saved to {filename}")
    print("Use bulk_insert_training_data.py to insert directly to database")
    
    # We won't try to insert through the Supabase API anymore
    # Instead, we'll return the count of examples saved to file
    inserted = len(examples)
    print("Done!")
    
    return inserted  # Return the number of inserted examples

if __name__ == "__main__":
    main()