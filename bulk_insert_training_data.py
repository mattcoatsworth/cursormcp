#!/usr/bin/env python3
"""
This script bulk inserts locally generated training data into the database directly.
It reads the JSON files stored in a specific file and inserts them
into the database using the psycopg2 library.
"""

import os
import json
import time
import argparse
import psycopg2
from datetime import datetime
from psycopg2.extras import Json

# Connect to PostgreSQL database directly
def connect_to_db():
    """Connect to PostgreSQL database using DATABASE_URL"""
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")
        
    conn = psycopg2.connect(database_url)
    return conn

def insert_training_data(conn, examples, batch_size=25):
    """Insert training data directly using SQL with batch processing for speed"""
    inserted_count = 0
    error_count = 0
    total_examples = len(examples)
    
    # Process in batches
    for i in range(0, total_examples, batch_size):
        batch = examples[i:i+batch_size]
        batch_size_actual = len(batch)
        print(f"Processing batch {i//batch_size + 1} ({i+1}-{i+batch_size_actual} of {total_examples})")
        
        # Prepare all parameter sets for this batch
        values_list = []
        ids_list = []
        
        for example in batch:
            # Store ID for logging
            ids_list.append(example["id"])
            
            # Prepare the record tuple
            values = (
                example["id"],
                example["tool"],
                example["intent"],
                example["query"],
                example["response"],
                json.dumps(example["metadata"]),
            )
            values_list.append(values)
        
        # Execute batch insert with a single transaction
        try:
            with conn.cursor() as cur:
                # Use executemany for efficient batch insertion
                cur.executemany(
                    """
                    INSERT INTO training_data (id, tool, intent, query, response, metadata, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s::jsonb, NOW(), NOW())
                    ON CONFLICT (id) DO NOTHING
                    """,
                    values_list
                )
                
                # Commit the entire batch at once
                conn.commit()
                
                inserted_count += batch_size_actual
                print(f"Successfully inserted batch of {batch_size_actual} examples")
                
        except Exception as e:
            # If batch insertion fails, try one by one
            print(f"Batch insertion failed: {e}")
            print("Falling back to individual inserts")
            
            # Create a new cursor
            with conn.cursor() as cur:
                for idx, example in enumerate(batch):
                    try:
                        # Prepare the record
                        record = (
                            example["id"],
                            example["tool"],
                            example["intent"],
                            example["query"],
                            example["response"],
                            json.dumps(example["metadata"]),
                        )
                        
                        # Insert individually
                        cur.execute(
                            """
                            INSERT INTO training_data (id, tool, intent, query, response, metadata, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s::jsonb, NOW(), NOW())
                            ON CONFLICT (id) DO NOTHING
                            """,
                            record
                        )
                        
                        # Commit each individual insert
                        conn.commit()
                        
                        inserted_count += 1
                        print(f"Successfully inserted example {example['id']}")
                        
                    except Exception as inner_e:
                        error_count += 1
                        print(f"Error inserting example {example['id']}: {inner_e}")
        
        # Brief pause between batches to allow other processes
        time.sleep(0.05)
    
    return inserted_count, error_count

def main():
    parser = argparse.ArgumentParser(description='Insert training data from JSON file')
    parser.add_argument('file', help='JSON file containing training data')
    
    args = parser.parse_args()
    
    try:
        # Load the data from the JSON file
        with open(args.file, 'r') as f:
            examples = json.load(f)
            
        print(f"Loaded {len(examples)} examples from {args.file}")
        
        # Connect to the database
        conn = connect_to_db()
        
        # Insert the data
        inserted, errors = insert_training_data(conn, examples)
        
        print(f"Insertion complete: {inserted} examples inserted, {errors} errors")
        
        # Close the connection
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
        
    return 0

if __name__ == "__main__":
    main()