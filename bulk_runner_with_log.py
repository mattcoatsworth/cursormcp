import os
import json
import time
import requests
import random
import uuid
from datetime import datetime
import openai
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("mcp_testing.log"),
        logging.StreamHandler()
    ]
)

# Configure OpenAI API - fetch from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Define all tool intents combinations we want to generate data for
# Full version (commented out for quick demo)
"""
tool_intents = {
    "Shopify": [
        "Check Order Status", 
        "Update Inventory", 
        "View Sales Report", 
        "Customer Lookup", 
        "Product Search",
        "Create Discount",
        "Publish Product",
        "Process Refund",
        "Update Shipping",
        "Add Product Tag"
    ],
    "Klaviyo": [
        "Create Email Flow", 
        "Get Open Rates", 
        "Segment Analytics", 
        "Campaign Performance", 
        "List Management",
        "Create Campaign",
        "Subscription Management",
        "Trigger Email",
        "A/B Test Setup",
        "View Unsubscribe Rate"
    ],
    "Postscript": [
        "Send SMS Campaign", 
        "Check SMS Performance", 
        "Manage SMS Templates", 
        "Subscriber Analytics",
        "Schedule Message",
        "Create Automation",
        "View Click Rates",
        "Manage Compliance",
        "Subscription Tier Analysis"
    ],
    "Slack": [
        "Send Message", 
        "Create Channel", 
        "Search Messages", 
        "Set Reminder",
        "Share File",
        "Schedule Message",
        "Archive Channel",
        "Add User To Channel",
        "Update Status"
    ],
    "Notion": [
        "Create Page", 
        "Update Database", 
        "Search Documents", 
        "Create Template",
        "Add Comment",
        "Share Page",
        "Create Calendar",
        "Link Pages",
        "Add Table"
    ],
    "OpenAI": [
        "Generate Content",
        "Summarize Text",
        "Answer Question",
        "Translate Language",
        "Analyze Sentiment",
        "Generate Image",
        "Extract Data",
        "Code Completion",
        "Explain Concept"
    ]
}
"""

# Full version for comprehensive testing 
tool_intents = {
    "Shopify": [
        "Check Order Status", 
        "Update Inventory", 
        "View Sales Report", 
        "Customer Lookup", 
        "Product Search",
        "Create Discount",
        "Publish Product",
        "Process Refund",
        "Update Shipping",
        "Add Product Tag"
    ],
    "Klaviyo": [
        "Create Email Flow", 
        "Get Open Rates", 
        "Segment Analytics", 
        "Campaign Performance", 
        "List Management",
        "Create Campaign",
        "Subscription Management",
        "Trigger Email",
        "A/B Test Setup",
        "View Unsubscribe Rate"
    ],
    "Postscript": [
        "Send SMS Campaign", 
        "Check SMS Performance", 
        "Manage SMS Templates", 
        "Subscriber Analytics",
        "Schedule Message",
        "Create Automation",
        "View Click Rates",
        "Manage Compliance",
        "Subscription Tier Analysis"
    ],
    "Slack": [
        "Send Message", 
        "Create Channel", 
        "Search Messages", 
        "Set Reminder",
        "Share File",
        "Schedule Message",
        "Archive Channel",
        "Add User To Channel",
        "Update Status"
    ],
    "Notion": [
        "Create Page", 
        "Update Database", 
        "Search Documents", 
        "Create Template",
        "Add Comment",
        "Share Page",
        "Create Calendar",
        "Link Pages",
        "Add Table"
    ],
    "OpenAI": [
        "Generate Content",
        "Summarize Text",
        "Answer Question",
        "Translate Language",
        "Analyze Sentiment",
        "Generate Image",
        "Extract Data",
        "Code Completion",
        "Explain Concept"
    ]
}

# Supabase API headers
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def generate_queries(tool, intent, count, batch_size=50):
    """
    Generate a specified number of realistic user queries with system responses
    for a given tool and intent using OpenAI's GPT model.
    
    Args:
        tool (str): The e-commerce tool (e.g., Shopify, Klaviyo)
        intent (str): The specific intent within that tool
        count (int): Number of query/response pairs to generate
        batch_size (int): Number of examples to generate in a single API call
        
    Returns:
        list: List of dictionaries containing {"query": "...", "response": "..."}
    """
    logging.info(f"Generating {count} {tool} query/response pairs for intent: {intent}")
    
    # Define the prompt template
    def create_prompt(batch_count):
        return f"""
        You are an assistant helping to generate training data for an e-commerce AI platform.
        Generate {batch_count} different, realistic user queries that someone might ask about {tool} 
        with the intent to {intent}.
        
        For each query, also include a detailed and helpful MCP system response that addresses the query.
        
        Make the queries diverse in phrasing, complexity, and specificity. Include both:
        - Direct commands (e.g., "Show me all orders from last week")
        - Natural questions (e.g., "Can you tell me how my sales are doing?")
        
        The queries should reflect real-world complexity and include:
        - Simple queries (e.g., "How many orders did I get today?")
        - Medium complexity queries (e.g., "Show me all orders from customers in California who spent over $100 last month")
        - Complex queries (e.g., "Compare my sales this quarter to last quarter, broken down by product category and customer demographic")
        
        Format your response as a JSON object with an array of items:
        {{
            "items": [
                {{
                    "query": "User's question or command",
                    "response": "Detailed system response"
                }},
                ...
            ]
        }}
        """
    
    all_items = []
    
    # Calculate number of batches needed
    num_batches = (count + batch_size - 1) // batch_size  # Ceiling division
    items_in_last_batch = count % batch_size or batch_size
    
    # Function to process a single batch
    def process_batch(batch_idx):
        batch_count = items_in_last_batch if batch_idx == num_batches - 1 else batch_size
        
        try:
            # Create a unique batch ID for logging
            batch_id = f"{tool}_{intent}_{batch_idx}_{uuid.uuid4().hex[:8]}"
            logging.info(f"Starting batch {batch_idx+1}/{num_batches} ({batch_count} items) [ID: {batch_id}]")
            
            system_prompt = create_prompt(batch_count)
            
            # Call GPT-3.5-turbo instead of GPT-4o (cheaper for mass generation)
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",  # Using 3.5 for cost efficiency with large-scale generation
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate {batch_count} realistic {tool} query/response pairs for intent: {intent}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.8  # Slightly higher temperature for more variety
            )
            
            try:
                result = json.loads(response.choices[0].message.content)
            except json.JSONDecodeError as e:
                logging.error(f"JSON decode error for batch {batch_id}: {e}")
                logging.error(f"Raw content: {response.choices[0].message.content[:500]}...")
                return []
                
            # Extract and validate items
            if "items" in result:
                items = result["items"]
            else:
                # If the model didn't use the "items" key, try to find the first array
                for key, value in result.items():
                    if isinstance(value, list) and len(value) > 0:
                        items = value
                        break
                else:
                    logging.warning(f"Unexpected response format for batch {batch_id}. Using fallback.")
                    items = [{
                        "query": f"Tell me about {tool} {intent} #{batch_idx}-{i}",
                        "response": f"Here's information about {tool} {intent}..."
                    } for i in range(batch_count)]
            
            # Validate items
            valid_items = []
            for item in items:
                if isinstance(item, dict) and "query" in item and "response" in item:
                    valid_items.append(item)
            
            if not valid_items:
                logging.warning(f"No valid items in batch {batch_id}. Using fallbacks.")
                valid_items = [{
                    "query": f"Help me with {tool} {intent} #{batch_idx}-{i}",
                    "response": f"I'd be happy to help with {tool} {intent}. Here's what you need to know..."
                } for i in range(batch_count)]
            
            logging.info(f"Batch {batch_id} complete: {len(valid_items)} items generated")
            return valid_items
            
        except Exception as e:
            logging.error(f"Error in batch {batch_idx}: {str(e)}")
            # Return fallbacks on error
            return [{
                "query": f"Help me with {tool} {intent} (batch {batch_idx}, item {i})",
                "response": f"I'd be happy to help with {tool} {intent}. Here's what you need to know..."
            } for i in range(batch_count)]
    
    # Process batches sequentially, with retry logic
    for batch_idx in range(num_batches):
        max_retries = 3
        for retry in range(max_retries):
            try:
                batch_items = process_batch(batch_idx)
                all_items.extend(batch_items)
                # Sleep between batches to avoid rate limiting
                if batch_idx < num_batches - 1:
                    sleep_time = 1.0 + random.random()  # 1-2 second sleep
                    time.sleep(sleep_time)
                break  # Success, exit retry loop
            except Exception as e:
                if retry < max_retries - 1:
                    logging.warning(f"Batch {batch_idx} failed (attempt {retry+1}/{max_retries}): {e}")
                    time.sleep(5)  # Wait 5 seconds before retry
                else:
                    logging.error(f"Batch {batch_idx} failed after {max_retries} attempts: {e}")
                    # Add fallback items for the failed batch
                    batch_count = items_in_last_batch if batch_idx == num_batches - 1 else batch_size
                    all_items.extend([{
                        "query": f"Help me with {tool} {intent} (recovery item {i})",
                        "response": f"I'd be happy to help with {tool} {intent}. Here's what you need to know..."
                    } for i in range(batch_count)])
    
    # Ensure we have exactly the requested number of items
    if len(all_items) > count:
        all_items = all_items[:count]
    elif len(all_items) < count:
        # Add fallback items if we're still short
        logging.warning(f"Generated only {len(all_items)}/{count} items for {tool}/{intent}. Adding fallbacks.")
        additional_needed = count - len(all_items)
        all_items.extend([{
            "query": f"Help me with {tool} {intent} (supplementary item {i})",
            "response": f"I'd be happy to help with {tool} {intent}. Here's what you need to know..."
        } for i in range(additional_needed)])
    
    logging.info(f"Completed generation of {len(all_items)} items for {tool}/{intent}")
    return all_items

def insert_to_supabase(tool, intent, items, batch_id=None):
    """
    Insert items into Supabase database through the API
    
    Args:
        tool (str): The tool name
        intent (str): The intent
        items (list): List of items to insert
        batch_id (str): Optional batch identifier for logging
        
    Returns:
        int: Number of successfully inserted items
    """
    success = 0
    errors = 0
    batch_info = f"batch {batch_id}" if batch_id else ""
    
    logging.info(f"Inserting {len(items)} items for {tool}/{intent} {batch_info}")
    
    for idx, item in enumerate(items):
        payload = {
            "tool": tool,
            "intent": intent,
            "query": item["query"],
            "response": item["response"],
            "metadata": {
                "generation_date": datetime.now().isoformat(),
                "model": "gpt-3.5-turbo",  # Using 3.5 for large-scale generation
                "batch_id": batch_id or f"{tool}_{intent}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "complexity": "auto_generated"
            }
        }
        
        # Use exponential backoff for API requests
        max_retries = 3
        for retry in range(max_retries):
            try:
                # Use our API endpoint instead of direct Supabase access
                r = requests.post("http://localhost:5000/api/training", json=payload, timeout=10)
                
                if r.status_code in [200, 201]:
                    success += 1
                    # Log progress periodically
                    if idx % 10 == 0 or idx == len(items) - 1:
                        logging.info(f"Insertion progress: {idx+1}/{len(items)} for {tool}/{intent}")
                    break  # Success, exit retry loop
                else:
                    logging.warning(f"API error: {r.status_code} - {r.text[:100]}...")
                    if retry < max_retries - 1:
                        wait_time = (2 ** retry) + random.random()  # Exponential backoff with jitter
                        logging.info(f"Retrying in {wait_time:.1f}s (attempt {retry+1}/{max_retries})")
                        time.sleep(wait_time)
                    else:
                        errors += 1
                        logging.error(f"Failed to insert item {idx} after {max_retries} attempts")
            except Exception as e:
                logging.error(f"Exception during insertion: {str(e)}")
                if retry < max_retries - 1:
                    wait_time = (2 ** retry) + random.random()
                    logging.info(f"Retrying in {wait_time:.1f}s (attempt {retry+1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    errors += 1
    
    logging.info(f"Insertion complete: {success} successful, {errors} failed for {tool}/{intent}")
    return success

def save_to_json(all_data):
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"training_data_{timestamp}.json"
    with open(filename, "w") as f:
        json.dump(all_data, f, indent=2)
    print(f"\n📝 Saved backup to {filename}")
    return filename

# Calculate distribution of examples across tools and intents for a total target
def calculate_distribution(target_count, tools_intents):
    """
    Calculate how many examples to generate for each intent to reach a target total
    
    Args:
        target_count (int): The target total number of examples
        tools_intents (dict): Dictionary mapping tools to lists of intents
        
    Returns:
        dict: Dictionary mapping (tool, intent) tuples to counts
    """
    # Count total number of tool-intent combinations
    total_intents = sum(len(intents) for intents in tools_intents.values())
    
    # Base count per intent (ensure we get at least the target total)
    base_count = target_count // total_intents
    
    # Distribute remainder to reach or exceed the target
    remainder = target_count % total_intents
    
    # Create distribution dictionary
    distribution = {}
    current_intent_idx = 0
    
    for tool, intents in tools_intents.items():
        for intent in intents:
            # Add one extra to the first 'remainder' intents
            extra = 1 if current_intent_idx < remainder else 0
            distribution[(tool, intent)] = base_count + extra
            current_intent_idx += 1
    
    # Verify the total equals or exceeds the target
    total = sum(distribution.values())
    logging.info(f"Distribution created: {total} examples across {len(distribution)} tool-intent pairs")
    
    return distribution

# Main runner with scaling capabilities
def run_bulk(count_per_intent=10, total_target=None, batch_size=50, sleep_time=2, dry_run=False):
    """
    Run the bulk generation process
    
    Args:
        count_per_intent (int): Number of examples to generate per intent if total_target is None
        total_target (int): Target total number of examples to generate across all intents
        batch_size (int): Number of examples to generate in a single API call
        sleep_time (float): Time to sleep between batches
        dry_run (bool): If True, don't insert into database
        
    Returns:
        str: Path to the saved JSON file
    """
    start_time = datetime.now()
    total_inserted = 0
    all_data = []
    
    # Set up distribution of examples
    if total_target is not None:
        # Distribute examples to reach total_target
        distribution = calculate_distribution(total_target, tool_intents)
        total_to_generate = sum(distribution.values())
    else:
        # Use fixed count_per_intent for all intents
        distribution = {(tool, intent): count_per_intent 
                       for tool, intents in tool_intents.items() 
                       for intent in intents}
        total_to_generate = count_per_intent * sum(len(intents) for tool, intents in tool_intents.items())
    
    logging.info(f"{'=' * 60}")
    logging.info(f"🚀 Starting MCP Training Data Generator")
    logging.info(f"{'=' * 60}")
    logging.info(f"• Mode: {'DRY RUN (no database insertions)' if dry_run else 'LIVE RUN'}")
    logging.info(f"• Target: {total_to_generate} examples")
    logging.info(f"• Total intents: {sum(len(intents) for intents in tool_intents.values())}")
    if total_target:
        logging.info(f"• Distribution: ~{total_to_generate // len(distribution)} per intent (varied)")
    else:
        logging.info(f"• Distribution: {count_per_intent} examples per intent (fixed)")
    logging.info(f"{'=' * 60}\n")
    
    print(f"{'=' * 60}")
    print(f"🚀 Starting MCP Training Data Generator")
    print(f"{'=' * 60}")
    print(f"• Mode: {'DRY RUN (no database insertions)' if dry_run else 'LIVE RUN'}")
    print(f"• Target: {total_to_generate} examples across {len(distribution)} tool-intent pairs")
    print(f"• Total intents: {len(distribution)}")
    print(f"{'=' * 60}\n")
    
    # Process tools and intents
    for (tool, intent), count in distribution.items():
        batch_id = f"{tool}_{intent}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        logging.info(f"\n📊 Processing: {tool} - {intent} ({count} examples)")
        print(f"\n📊 Tool: {tool} - {intent}")
        print(f"{'=' * 40}")
        
        # Generate queries in batches
        items = generate_queries(tool, intent, count, batch_size)
        
        if items:
            # Add to the all_data collection with proper metadata
            for item in items:
                all_data.append({
                    "tool": tool,
                    "intent": intent,
                    "query": item["query"],
                    "response": item["response"],
                    "metadata": {
                        "generation_date": datetime.now().isoformat(),
                        "model": "gpt-3.5-turbo",
                        "batch_id": batch_id,
                        "complexity": "auto_generated"
                    }
                })
            
            # Insert into database if not dry run
            if not dry_run:
                inserted = insert_to_supabase(tool, intent, items, batch_id)
                total_inserted += inserted
                print(f"✅ Inserted {inserted}/{len(items)} records")
            else:
                print(f"✓ Generated {len(items)} examples (not inserted in dry run)")
            
            # Sample output
            if len(items) > 0:
                print(f"📝 Sample: \"{items[0]['query']}\" → \"{items[0]['response'][:60]}...\"")
            
            # Regular JSON backups
            if len(all_data) % 1000 == 0:
                interim_filename = save_to_json(all_data)
                logging.info(f"Interim backup saved to {interim_filename}")
            
            # Sleep to avoid overwhelming the system
            if sleep_time > 0:
                time.sleep(sleep_time)
    
    # Final JSON backup
    filename = save_to_json(all_data)
    
    # Calculate time taken
    end_time = datetime.now()
    duration = end_time - start_time
    hours, remainder = divmod(duration.total_seconds(), 3600)
    minutes, seconds = divmod(remainder, 60)
    
    print(f"\n{'=' * 60}")
    print(f"🎉 Generation Complete!")
    print(f"{'=' * 60}")
    print(f"• Total generated: {len(all_data)} examples")
    if not dry_run:
        print(f"• Total inserted into database: {total_inserted}")
    print(f"• Backup saved to: {filename}")
    print(f"• Time taken: {int(hours)}h {int(minutes)}m {int(seconds)}s")
    print(f"{'=' * 60}")
    
    logging.info(f"\n{'=' * 60}")
    logging.info(f"🎉 Generation Complete!")
    logging.info(f"{'=' * 60}")
    logging.info(f"• Total generated: {len(all_data)} examples")
    if not dry_run:
        logging.info(f"• Total inserted into database: {total_inserted}")
    logging.info(f"• Backup saved to: {filename}")
    logging.info(f"• Time taken: {int(hours)}h {int(minutes)}m {int(seconds)}s")
    logging.info(f"{'=' * 60}")
    
    return filename

if __name__ == "__main__":
    import sys
    import argparse
    
    # Set up argument parser
    parser = argparse.ArgumentParser(description="MCP Training Data Generator")
    
    # Define arguments
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--count", type=int, default=20, 
                       help="Number of examples to generate per intent")
    group.add_argument("--total", type=int, 
                       help="Total number of examples to generate across all intents")
    
    parser.add_argument("--batch-size", type=int, default=50,
                        help="Number of examples to generate in a single API call")
    parser.add_argument("--sleep", type=float, default=1.0,
                        help="Sleep time between batches in seconds")
    parser.add_argument("--tools", nargs="+", 
                        help="Only generate for specific tools (space-separated)")
    parser.add_argument("--live", action="store_true", 
                        help="Run in live mode (will insert into database)")
    parser.add_argument("--quick-test", action="store_true", 
                        help="Run a small quick test with minimal examples")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Set default values
    dry_run = not args.live
    
    # Quick test mode
    if args.quick_test:
        # Override for quick test - just a couple examples per intent
        count_per_intent = 2
        test_tool_intents = {
            "Shopify": ["Check Order Status", "View Sales Report"],
            "Slack": ["Send Message"]
        }
        
        # Replace the tool_intents with the test subset
        # Use nonlocal approach instead of global
        tool_intents.clear()
        tool_intents.update(test_tool_intents)
        
        print("⚡ QUICK TEST MODE ENABLED")
        print("Using a small subset of tools and intents")
    else:
        # Normal mode
        count_per_intent = args.count
        
        # Filter tools if specified
        if args.tools:
            filtered_tool_intents = {}
            for tool in args.tools:
                if tool in tool_intents:
                    filtered_tool_intents[tool] = tool_intents[tool]
            
            if filtered_tool_intents:
                # Clear and update instead of reassignment
                tool_intents.clear()
                tool_intents.update(filtered_tool_intents)
                print(f"Filtered to {len(filtered_tool_intents)} tools: {', '.join(filtered_tool_intents.keys())}")
            else:
                print(f"Warning: None of the specified tools found. Using all tools.")
    
    # Setup logging with more detail in quick test mode
    log_level = logging.DEBUG if args.quick_test else logging.INFO
    for handler in logging.root.handlers:
        handler.setLevel(log_level)
    
    # Print configuration
    print("\nMCP Training Data Generator Configuration")
    print("----------------------------------------")
    
    if args.total:
        print(f"• Total target: {args.total} examples")
        print(f"• Tool-intent pairs: {sum(len(intents) for tool, intents in tool_intents.items())}")
        print(f"• Average per intent: ~{args.total // sum(len(intents) for tool, intents in tool_intents.items())}")
    else:
        print(f"• Examples per intent: {count_per_intent}")
        total_estimate = count_per_intent * sum(len(intents) for tool, intents in tool_intents.items())
        print(f"• Total estimate: ~{total_estimate} examples")
    
    print(f"• Batch size: {args.batch_size}")
    print(f"• Mode: {'LIVE RUN' if not dry_run else 'DRY RUN (no database insertions)'}")
    print("----------------------------------------")
    
    # Confirm before proceeding with live run for large generations
    total_estimate = args.total or (count_per_intent * sum(len(intents) for tool, intents in tool_intents.items()))
    if not dry_run and total_estimate > 100 and not args.quick_test:
        confirm = input(f"You're about to insert approximately {total_estimate} records into the database. Continue? [y/N] ").lower()
        if not (confirm == 'y' or confirm == 'yes'):
            print("Switching to dry run mode for safety.")
            dry_run = True
    
    # Run the generator
    if args.total:
        # Run with total target distribution
        run_bulk(total_target=args.total, batch_size=args.batch_size, sleep_time=args.sleep, dry_run=dry_run)
    else:
        # Run with fixed per-intent count
        run_bulk(count_per_intent=count_per_intent, batch_size=args.batch_size, sleep_time=args.sleep, dry_run=dry_run)