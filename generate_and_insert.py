#!/usr/bin/env python3
"""
Unified script to generate and insert training examples in batches.

This script:
1. Generates a small batch of multi-service examples using run_ms_generator_small.py
2. Inserts them directly into the database using bulk_insert_training_data logic
3. Repeats until the target number of examples is reached
"""

import os
import json
import time
import psycopg2
import argparse
from datetime import datetime
from psycopg2.extras import Json

# Import the generate function from other script
from run_ms_generator_small import main as generate_small_batch

# Default settings
DEFAULT_TARGET = 500  # Total number of examples to generate
DEFAULT_BATCH_SIZE = 10  # Number of examples per bulk insertion
DEFAULT_SLEEP_TIME = 0.1  # Seconds to sleep between generations (much faster)

def connect_to_db():
    """Connect to PostgreSQL database using DATABASE_URL"""
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")
        
    conn = psycopg2.connect(database_url)
    return conn

def insert_training_data(conn, examples):
    """Insert training data directly using SQL"""
    inserted_count = 0
    error_count = 0
    
    # Create a cursor
    with conn.cursor() as cur:
        for example in examples:
            try:
                # Print progress
                print(f"Inserting example with ID: {example['id']}")
                
                # Prepare the record
                record = {
                    "id": example["id"],
                    "tool": example["tool"],
                    "intent": example["intent"],
                    "query": example["query"],
                    "response": example["response"],
                    "metadata": json.dumps(example["metadata"]),
                }
                
                # Insert using SQL directly
                cur.execute(
                    """
                    INSERT INTO training_data (id, tool, intent, query, response, metadata, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s::jsonb, NOW(), NOW())
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (
                        record["id"],
                        record["tool"],
                        record["intent"],
                        record["query"],
                        record["response"],
                        record["metadata"],
                    )
                )
                
                inserted_count += 1
                print(f"Successfully inserted example {example['id']}")
                
            except Exception as e:
                error_count += 1
                print(f"Error inserting example {example['id']}: {e}")
                
            # Commit after each insertion to avoid losing all on one error
            conn.commit()
    
    return inserted_count, error_count

def load_examples_from_file(filename):
    """Load examples from a JSON file"""
    try:
        with open(filename, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading examples from {filename}: {e}")
        return []

def main():
    """Generate and insert training examples in batches"""
    parser = argparse.ArgumentParser(description="Generate and insert training examples")
    parser.add_argument("--target", type=int, default=DEFAULT_TARGET, 
                        help=f"Target number of examples to generate (default: {DEFAULT_TARGET})")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE,
                        help=f"Number of examples to insert in each batch (default: {DEFAULT_BATCH_SIZE})")
    parser.add_argument("--sleep-time", type=float, default=DEFAULT_SLEEP_TIME,
                        help=f"Seconds to sleep between example generations (default: {DEFAULT_SLEEP_TIME})")
    parser.add_argument("--dry-run", action="store_true",
                        help="Generate examples but don't insert them into the database")
    
    args = parser.parse_args()
    
    print(f"Starting generation of {args.target} examples")
    print(f"Batch size: {args.batch_size}, Sleep time: {args.sleep_time} seconds")
    
    if args.dry_run:
        print("DRY RUN: Examples will be generated but not inserted into the database")
    
    # Connect to the database (only if not in dry run mode)
    conn = None
    if not args.dry_run:
        try:
            conn = connect_to_db()
            print("Connected to database")
        except Exception as e:
            print(f"Error connecting to database: {e}")
            return 1
    
    total_generated = 0
    total_inserted = 0
    batch_num = 1
    
    try:
        while total_generated < args.target:
            print(f"\n--- Batch {batch_num} ---")
            print(f"Generated {total_generated} of {args.target} examples so far")
            
            try:
                # Generate a single example
                generate_small_batch()
                total_generated += 1
                
                # Load the generated example from the file
                examples = load_examples_from_file("multi_service_examples_small_batch.json")
                if not examples:
                    print("No examples generated in this batch, skipping...")
                    continue
                    
                # Save a backup with a unique name
                backup_filename = f"multi_service_examples_batch_{batch_num}_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
                with open(backup_filename, "w") as f:
                    json.dump(examples, f, indent=2)
                print(f"Saved backup to {backup_filename}")
                
                # Insert the examples if not in dry run mode
                if not args.dry_run:
                    inserted, errors = insert_training_data(conn, examples)
                    total_inserted += inserted
                    print(f"Inserted {inserted} examples ({errors} errors)")
                
                # Print progress
                progress_pct = total_generated / args.target * 100
                print(f"Progress: {total_generated}/{args.target} examples ({progress_pct:.1f}%)")
                
                # Sleep before next generation
                if total_generated < args.target:
                    print(f"Sleeping for {args.sleep_time} seconds...")
                    time.sleep(args.sleep_time)
                
            except Exception as e:
                print(f"Error in batch {batch_num}: {e}")
                print("Sleeping for 30 seconds before retrying...")
                time.sleep(30)
            
            batch_num += 1
    
    finally:
        # Close the database connection
        if conn is not None:
            conn.close()
            print("Database connection closed")
    
    print(f"\nGeneration complete!")
    print(f"Generated {total_generated} examples total")
    if not args.dry_run:
        print(f"Inserted {total_inserted} examples into the database")
    
    return 0

if __name__ == "__main__":
    exit(main())