"""
Parallel training data generator for MCP

This script runs multiple worker processes in parallel to generate
training data much faster than sequential approaches. Each worker:
1. Generates examples for specific tool/intent combinations
2. Stores examples in local files to minimize DB writes
3. Combines and batch inserts results at the end

Usage:
    python parallel_training_generator.py --workers 4 --examples 1000 --batch-size 50
"""

import os
import json
import time
import random
import argparse
import multiprocessing
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor, as_completed
import openai
import psycopg2
from psycopg2.extras import execute_values

# Tool intents mapping - all the different combinations we can generate examples for
TOOL_INTENTS = {
    "Shopify": [
        "Check Order Status", "Update Inventory", "View Sales Report", 
        "Customer Lookup", "Product Search", "Create Discount",
        "Publish Product", "Process Refund", "Update Shipping", "Add Product Tag"
    ],
    "Klaviyo": [
        "Create Email Flow", "Get Open Rates", "Segment Analytics", 
        "Campaign Performance", "List Management", "Create Campaign",
        "Subscription Management", "Trigger Email", "A/B Test Setup", 
        "View Unsubscribe Rate"
    ],
    "Postscript": [
        "Send SMS Campaign", "Check SMS Performance", "Manage SMS Templates", 
        "Subscriber Analytics", "Schedule Message", "Create Automation",
        "View Click Rates", "Manage Compliance", "Subscription Tier Analysis"
    ],
    "Slack": [
        "Send Message", "Create Channel", "Search Messages", "Set Reminder",
        "Share File", "Schedule Message", "Archive Channel", "Add User To Channel",
        "Update Status"
    ],
    "Notion": [
        "Create Page", "Update Database", "Search Documents", "Create Template",
        "Add Comment", "Share Page", "Create Calendar", "Link Pages", "Add Table"
    ],
    "OpenAI": [
        "Generate Content", "Summarize Text", "Answer Question", "Translate Language",
        "Analyze Sentiment", "Generate Image", "Extract Data", "Code Completion",
        "Explain Concept"
    ],
    "Triple Whale": [
        "Check Ad Performance", "View ROAS", "Analyze Campaign", 
        "Review Metrics", "Generate Report", "Compare Periods"
    ],
    "GitHub": [
        "Create Pull Request", "Review Code", "Merge Branch", 
        "Check Issues", "Add Collaborator", "Clone Repository"
    ],
    "Google Calendar": [
        "Schedule Meeting", "Create Event", "Check Availability", 
        "Set Reminder", "Reschedule Appointment", "Add Participants"
    ]
}

# Cross-service scenarios for more complex examples
CROSS_SERVICE_SCENARIOS = [
    {
        "name": "E-commerce Campaign Analysis",
        "tools": ["Shopify", "Klaviyo", "Triple Whale"],
        "description": "Analyze marketing campaign performance across Shopify orders, Klaviyo email engagement, and Triple Whale ad metrics."
    },
    {
        "name": "Development Project Management", 
        "tools": ["GitHub", "Notion", "Slack"],
        "description": "Coordinate development tasks between GitHub repositories, Notion project docs, and Slack team communication."
    },
    {
        "name": "Marketing Campaign Planning",
        "tools": ["Klaviyo", "Postscript", "Google Calendar"],
        "description": "Plan and schedule marketing campaigns across email (Klaviyo), SMS (Postscript), and team calendars."
    },
    {
        "name": "Content Creation Workflow",
        "tools": ["OpenAI", "Notion", "Slack"],
        "description": "Generate content with AI, organize in Notion, and share with team via Slack."
    }
]

def setup_api_key():
    """Set up OpenAI API key from environment variable"""
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    openai.api_key = api_key
    return api_key

def connect_to_db():
    """Connect to PostgreSQL database using DATABASE_URL"""
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set")
    return psycopg2.connect(db_url)

def generate_examples_batch(tool, intent, count, batch_size=25, worker_id=0):
    """
    Generate a batch of examples for a specific tool/intent combination
    
    Args:
        tool (str): The service tool (e.g., Shopify, Klaviyo)
        intent (str): The specific intent
        count (int): Number of examples to generate
        batch_size (int): Number of examples to generate in a single API call
        worker_id (int): ID of the worker process for logging
        
    Returns:
        list: The generated examples
    """
    all_examples = []
    model = "gpt-3.5-turbo"  # Always use ChatGPT 3.5 for training data generation as required
    
    # Calculate number of batches needed
    num_batches = (count + batch_size - 1) // batch_size
    
    for batch_idx in range(num_batches):
        # Calculate actual batch size (might be smaller for last batch)
        current_batch_size = min(batch_size, count - batch_idx * batch_size)
        
        # Create the prompt for this batch
        system_prompt = f"""
        You are helping generate realistic training data for an e-commerce assistant.
        Generate {current_batch_size} different realistic user queries related to {tool} with the intent of {intent}.
        
        For each query, also provide a professional, helpful response that addresses the query.
        Format your response as a JSON array where each item has "query" and "response" fields.
        
        Make sure each query is unique and represents how a real user might ask for help with {intent} in {tool}.
        The queries should have diverse wording, specificity, and complexity.
        """
        
        try:
            # Call OpenAI API
            response = openai.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate {current_batch_size} user queries and responses for {tool} - {intent}."}
                ],
                temperature=0.8,
                max_tokens=2500,
                response_format={"type": "json_object"}
            )
            
            # Parse response
            content = response.choices[0].message.content
            examples_json = json.loads(content)
            
            # Extract examples
            if "examples" in examples_json:
                batch_examples = examples_json["examples"]
            else:
                # Sometimes the model returns an array directly
                batch_examples = examples_json.get("data", [])
                if not batch_examples and isinstance(examples_json, list):
                    batch_examples = examples_json
            
            # Add metadata
            for example in batch_examples:
                example["tool"] = tool
                example["intent"] = intent
                example["created_at"] = datetime.now().isoformat()
            
            all_examples.extend(batch_examples)
            
            print(f"Worker {worker_id}: Generated {len(batch_examples)} examples for {tool} - {intent} (Batch {batch_idx+1}/{num_batches})")
            
            # Small pause to avoid rate limits
            time.sleep(0.2)
            
        except Exception as e:
            print(f"Worker {worker_id}: Error generating examples for {tool} - {intent} (Batch {batch_idx+1}): {str(e)}")
            time.sleep(1)  # Wait a bit longer on error
    
    return all_examples

def generate_cross_service_examples(scenario, count, batch_size=10, worker_id=0):
    """
    Generate examples for cross-service scenarios
    
    Args:
        scenario (dict): The scenario information
        count (int): Number of examples to generate
        batch_size (int): Number of examples per batch
        worker_id (int): ID of the worker process
        
    Returns:
        list: The generated examples
    """
    all_examples = []
    model = "gpt-3.5-turbo"  # Always use ChatGPT 3.5 for training data generation as required
    tools_str = ", ".join(scenario["tools"])
    
    # Calculate number of batches needed
    num_batches = (count + batch_size - 1) // batch_size
    
    for batch_idx in range(num_batches):
        # Calculate actual batch size (might be smaller for last batch)
        current_batch_size = min(batch_size, count - batch_idx * batch_size)
        
        system_prompt = f"""
        You are helping generate realistic training data for a multi-service assistant.
        Generate {current_batch_size} different realistic user queries that require using multiple services: {tools_str}.
        These queries should be for the scenario: {scenario["name"]} - {scenario["description"]}
        
        For each query, also provide a professional, helpful response that addresses the query.
        Format your response as a JSON array where each item has "query" and "response" fields.
        
        Make sure each query explicitly mentions at least 2 of these services: {tools_str}.
        The queries should have diverse wording, specificity, and complexity.
        """
        
        try:
            # Call OpenAI API
            response = openai.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate {current_batch_size} cross-service queries for scenario: {scenario['name']}"}
                ],
                temperature=0.8,
                max_tokens=2500,
                response_format={"type": "json_object"}
            )
            
            # Parse response
            content = response.choices[0].message.content
            examples_json = json.loads(content)
            
            # Extract examples
            if "examples" in examples_json:
                batch_examples = examples_json["examples"]
            else:
                # Sometimes the model returns an array directly
                batch_examples = examples_json.get("data", [])
                if not batch_examples and isinstance(examples_json, list):
                    batch_examples = examples_json
            
            # Add metadata
            for example in batch_examples:
                example["scenario"] = scenario["name"]
                example["tools"] = scenario["tools"]
                example["created_at"] = datetime.now().isoformat()
                example["is_multi_service"] = True
            
            all_examples.extend(batch_examples)
            
            print(f"Worker {worker_id}: Generated {len(batch_examples)} examples for scenario {scenario['name']} (Batch {batch_idx+1}/{num_batches})")
            
            # Small pause to avoid rate limits
            time.sleep(0.2)
            
        except Exception as e:
            print(f"Worker {worker_id}: Error generating examples for scenario {scenario['name']} (Batch {batch_idx+1}): {str(e)}")
            time.sleep(1)  # Wait a bit longer on error
    
    return all_examples

def worker_process(worker_id, work_items, examples_per_item, batch_size, output_dir):
    """
    Worker process that generates examples for assigned work items
    
    Args:
        worker_id (int): ID of this worker process
        work_items (list): List of (tool, intent) tuples or scenario dicts to process
        examples_per_item (int): Number of examples to generate per work item
        batch_size (int): Batch size for API calls
        output_dir (str): Directory to save output files
        
    Returns:
        int: Count of examples generated
    """
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Setup API key for this process
    setup_api_key()
    
    total_examples = 0
    
    # Process each assigned work item
    for idx, item in enumerate(work_items):
        examples = []
        
        if isinstance(item, tuple):
            # Single-service example
            tool, intent = item
            print(f"Worker {worker_id}: Starting generation for {tool} - {intent} ({idx+1}/{len(work_items)})")
            examples = generate_examples_batch(
                tool, intent, examples_per_item, batch_size, worker_id
            )
            
            # Save to a tool-intent specific file
            if examples:
                output_file = os.path.join(output_dir, f"worker{worker_id}_{tool}_{intent.replace(' ', '_')}_{len(examples)}.json")
                with open(output_file, 'w') as f:
                    json.dump(examples, f, indent=2)
                
                total_examples += len(examples)
        else:
            # Cross-service example
            scenario = item
            print(f"Worker {worker_id}: Starting generation for scenario {scenario['name']} ({idx+1}/{len(work_items)})")
            examples = generate_cross_service_examples(
                scenario, examples_per_item, batch_size, worker_id
            )
            
            # Save to a scenario-specific file
            if examples:
                output_file = os.path.join(output_dir, f"worker{worker_id}_scenario_{scenario['name'].replace(' ', '_')}_{len(examples)}.json")
                with open(output_file, 'w') as f:
                    json.dump(examples, f, indent=2)
                
                total_examples += len(examples)
        
        # Small delay between work items to avoid rate limits
        time.sleep(0.5)
    
    return total_examples

def insert_examples_to_db(examples, conn=None):
    """
    Insert examples into the database in a single batch operation
    
    Args:
        examples (list): List of examples to insert
        conn: Database connection (will create one if None)
        
    Returns:
        int: Number of examples inserted
    """
    close_conn = False
    if conn is None:
        conn = connect_to_db()
        close_conn = True
    
    try:
        with conn.cursor() as cur:
            # Check if the training_data table exists
            cur.execute("SELECT to_regclass('public.training_data')")
            table_exists = cur.fetchone()[0]
            
            if not table_exists:
                # Create the table if it doesn't exist
                print("Creating training_data table...")
                cur.execute("""
                CREATE TABLE IF NOT EXISTS training_data (
                    id SERIAL PRIMARY KEY,
                    query TEXT NOT NULL,
                    response TEXT NOT NULL,
                    tool VARCHAR(255),
                    intent VARCHAR(255),
                    scenario VARCHAR(255),
                    tools JSONB,
                    is_multi_service BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
                """)
                conn.commit()
            
            # Prepare data for insertion
            values = []
            for ex in examples:
                values.append((
                    ex["query"],
                    ex["response"],
                    ex.get("tool"),
                    ex.get("intent"),
                    ex.get("scenario"),
                    json.dumps(ex.get("tools", [])) if ex.get("tools") else None,
                    ex.get("is_multi_service", False),
                    datetime.now()
                ))
            
            # Perform batch insert
            execute_values(
                cur,
                """
                INSERT INTO training_data 
                (query, response, tool, intent, scenario, tools, is_multi_service, created_at)
                VALUES %s
                """,
                values
            )
            
            conn.commit()
            return len(examples)
    
    except Exception as e:
        print(f"Database error: {str(e)}")
        conn.rollback()
        return 0
    
    finally:
        if close_conn:
            conn.close()

def process_output_files(output_dir):
    """
    Process all output files and insert them into the database
    
    Args:
        output_dir (str): Directory containing output files
        
    Returns:
        int: Total number of examples inserted
    """
    total_inserted = 0
    conn = connect_to_db()
    
    try:
        # Get all JSON files in the output directory
        json_files = [f for f in os.listdir(output_dir) if f.endswith('.json')]
        print(f"Found {len(json_files)} output files to process")
        
        # Process each file
        for file_name in json_files:
            file_path = os.path.join(output_dir, file_name)
            try:
                with open(file_path, 'r') as f:
                    examples = json.load(f)
                
                # Insert examples from this file
                inserted = insert_examples_to_db(examples, conn)
                total_inserted += inserted
                
                print(f"Inserted {inserted} examples from {file_name}")
                
                # Optionally move or delete the file after processing
                # os.rename(file_path, os.path.join(output_dir, "processed", file_name))
                
            except Exception as e:
                print(f"Error processing file {file_name}: {str(e)}")
        
        return total_inserted
    
    finally:
        conn.close()

def distribute_work(num_workers, include_cross_service=True):
    """
    Distribute work items among workers
    
    Args:
        num_workers (int): Number of worker processes
        include_cross_service (bool): Whether to include cross-service scenarios
        
    Returns:
        list: List of work items for each worker
    """
    # Create a list of all possible (tool, intent) combinations
    single_service_work = []
    for tool, intents in TOOL_INTENTS.items():
        for intent in intents:
            single_service_work.append((tool, intent))
    
    # Shuffle to distribute work evenly
    random.shuffle(single_service_work)
    
    # Add cross-service scenarios if requested
    all_work = single_service_work.copy()
    if include_cross_service:
        all_work.extend(CROSS_SERVICE_SCENARIOS)
        random.shuffle(all_work)
    
    # Distribute work among workers
    work_per_worker = []
    for i in range(num_workers):
        # Each worker gets approximately the same number of items
        worker_items = [item for idx, item in enumerate(all_work) if idx % num_workers == i]
        work_per_worker.append(worker_items)
    
    return work_per_worker

def main():
    """Main function to orchestrate parallel training data generation"""
    parser = argparse.ArgumentParser(description="Generate training data in parallel")
    parser.add_argument("--workers", type=int, default=4, help="Number of worker processes")
    parser.add_argument("--examples", type=int, default=10, help="Number of examples per tool/intent")
    parser.add_argument("--batch-size", type=int, default=10, help="Batch size for API calls")
    parser.add_argument("--output-dir", type=str, default="training_data_output", help="Output directory")
    parser.add_argument("--no-cross-service", action="store_true", help="Skip cross-service scenarios")
    
    args = parser.parse_args()
    
    # Ensure API key is set
    setup_api_key()
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Distribute work among workers
    work_distribution = distribute_work(args.workers, not args.no_cross_service)
    
    # Print work distribution summary
    for worker_id, work_items in enumerate(work_distribution):
        single_service = sum(1 for item in work_items if isinstance(item, tuple))
        cross_service = len(work_items) - single_service
        print(f"Worker {worker_id}: {len(work_items)} items ({single_service} single-service, {cross_service} cross-service)")
    
    # Start worker processes
    start_time = time.time()
    total_examples = 0
    
    with ProcessPoolExecutor(max_workers=args.workers) as executor:
        futures = []
        
        for worker_id, work_items in enumerate(work_distribution):
            future = executor.submit(
                worker_process, 
                worker_id, 
                work_items, 
                args.examples, 
                args.batch_size, 
                args.output_dir
            )
            futures.append(future)
        
        # Process results as they complete
        for future in as_completed(futures):
            worker_examples = future.result()
            total_examples += worker_examples
            print(f"Worker completed, generated {worker_examples} examples")
    
    generation_time = time.time() - start_time
    print(f"All generation workers completed in {generation_time:.2f} seconds")
    print(f"Generated approximately {total_examples} examples")
    
    # Process and insert all generated examples
    print("\nInserting examples into database...")
    db_start_time = time.time()
    inserted = process_output_files(args.output_dir)
    db_time = time.time() - db_start_time
    
    print(f"\nInserted {inserted} examples into database in {db_time:.2f} seconds")
    print(f"Total time: {(generation_time + db_time):.2f} seconds")
    print(f"Generation rate: {inserted / (generation_time + db_time):.2f} examples per second")

if __name__ == "__main__":
    main()