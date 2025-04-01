#!/usr/bin/env python3
"""
Minimal script to add a small number of training examples to avoid timeouts
"""

import os
import sys
import json
import time
import psycopg2
from datetime import datetime

# Get the current count
def count_examples():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        return "unknown"
        
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM training_data")
        count = cur.fetchone()[0]
        conn.close()
        return count
    except Exception as e:
        return f"error: {e}"

# Generate a few examples and insert directly
def main():
    # Print the current count
    start_count = count_examples()
    print(f"Starting with {start_count} examples")
    
    # Import these functions directly to avoid subprocess issues
    from generate_multi_service_examples import generate_complex_examples, save_to_json
    from bulk_insert_training_data import connect_to_db, insert_training_data
    
    # Generate a small number of examples
    batch_size = 3
    print(f"Generating {batch_size} examples...")
    examples = generate_complex_examples(count=batch_size, batch_size=1)
    
    # Save to file as backup
    filename = f"mini_batch_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
    save_to_json(examples, filename)
    
    # Connect to database and insert
    print("Connecting to database...")
    conn = connect_to_db()
    
    # Insert the examples
    print(f"Inserting {len(examples)} examples...")
    inserted, errors = insert_training_data(conn, examples)
    conn.close()
    
    # Print the final count
    end_count = count_examples()
    print(f"Finished with {end_count} examples")
    print(f"Added {inserted} examples with {errors} errors")
    
    return 0

if __name__ == "__main__":
    try:
        exit(main())
    except Exception as e:
        print(f"Error: {e}")
        exit(1)