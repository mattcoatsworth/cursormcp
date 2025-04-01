import os
import json
import time
import requests
import random
import uuid
from datetime import datetime
import openai
import logging
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("mcp_cross_service_testing.log"),
        logging.StreamHandler()
    ]
)

# Configure OpenAI API - fetch from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Supabase API headers
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# Define tools for cross-service scenarios
tool_list = [
    "Shopify", 
    "Klaviyo", 
    "Postscript", 
    "Slack", 
    "Notion", 
    "OpenAI",
    "Google Calendar",
    "Asana",
    "GitHub",
    "Figma",
    "GDrive"
]

# Define cross-service scenarios with realistic business value
cross_service_scenarios = [
    {
        "tools": ["Shopify", "Klaviyo"],
        "scenario": "Sales and marketing correlation",
        "description": "Connecting e-commerce sales data with email marketing campaigns for performance analysis and customer segmentation"
    },
    {
        "tools": ["Shopify", "Slack"],
        "scenario": "Order notifications and team collaboration",
        "description": "Alerting team members about important orders, inventory issues, or sales milestones"
    },
    {
        "tools": ["Klaviyo", "Postscript"],
        "scenario": "Multi-channel marketing coordination",
        "description": "Coordinating email and SMS marketing campaigns for consistent messaging and avoiding customer fatigue"
    },
    {
        "tools": ["Notion", "Slack"],
        "scenario": "Team documentation and communication",
        "description": "Creating and sharing project documentation while notifying team members of updates"
    },
    {
        "tools": ["Shopify", "OpenAI"],
        "scenario": "AI-enhanced e-commerce",
        "description": "Using AI to analyze product descriptions, customer reviews, or generate marketing copy"
    },
    {
        "tools": ["GitHub", "Slack"],
        "scenario": "Development workflow and notifications",
        "description": "Tracking code changes and notifying team about important updates or issues"
    },
    {
        "tools": ["Google Calendar", "Asana"],
        "scenario": "Project scheduling and task management",
        "description": "Coordinating deadlines, meetings, and task assignments across platforms"
    },
    {
        "tools": ["Figma", "Slack"],
        "scenario": "Design collaboration and feedback",
        "description": "Sharing design updates and gathering team feedback"
    },
    {
        "tools": ["GDrive", "Notion"],
        "scenario": "Document management and knowledge base",
        "description": "Organizing files and incorporating them into structured documentation"
    },
    {
        "tools": ["Shopify", "Postscript"],
        "scenario": "E-commerce and SMS marketing",
        "description": "Connecting order data with targeted SMS campaigns for abandoned carts, order updates, etc."
    },
    {
        "tools": ["Klaviyo", "OpenAI"],
        "scenario": "AI-powered email marketing",
        "description": "Using AI to analyze campaign performance and generate optimized email content"
    },
    {
        "tools": ["Shopify", "Klaviyo", "Postscript"],
        "scenario": "Omni-channel customer engagement",
        "description": "Coordinating customer touchpoints across web, email, and SMS channels"
    },
    {
        "tools": ["Shopify", "OpenAI", "Slack"],
        "scenario": "AI-enhanced sales insights with team collaboration",
        "description": "Analyzing sales data with AI and sharing insights with the team"
    }
]

def generate_cross_service_queries(scenario_obj, count, batch_size=5):
    """
    Generate queries that require multiple services to fulfill

    Args:
        scenario_obj (dict): Dictionary containing scenario information
        count (int): Number of query/response pairs to generate
        batch_size (int): Number of examples to generate in a single API call
        
    Returns:
        list: List of dictionaries containing query/response pairs
    """
    tools = scenario_obj["tools"]
    scenario = scenario_obj["scenario"]
    description = scenario_obj["description"]
    tools_str = ", ".join(tools)
    
    logging.info(f"Generating {count} cross-service queries for scenario: {scenario} ({tools_str})")
    
    # Define the prompt template for cross-service scenarios
    def create_prompt(batch_count):
        return f"""
        You are an assistant helping to generate training data for a Multi-Channel Platform (MCP) that integrates with multiple APIs.
        
        Generate {batch_count} different, realistic user queries that would require using MULTIPLE SERVICES SIMULTANEOUSLY.
        Specifically, the query should require accessing and coordinating between these services: {tools_str}
        
        SCENARIO: {scenario}
        CONTEXT: {description}
        
        For each query:
        1. The query must explicitly or implicitly require data from MULTIPLE services
        2. Include a detailed system response showing how the platform would coordinate between these services
        3. The response should clearly indicate which APIs are being called from each service
        
        IMPORTANT REQUIREMENTS:
        - Queries must be complex enough to require cross-service integration, not just mention multiple services
        - Responses should show the platform's ability to orchestrate multiple API calls across services
        - Include examples requiring data aggregation, cross-platform correlation, and sequential operations
        - Focus on high business value use cases that demonstrate the platform's multi-service capabilities
        
        Types of cross-service queries to include:
        - Data correlation (e.g., "Compare Shopify orders with Klaviyo email engagement for customers who purchased in the last 30 days")
        - Workflow automation (e.g., "When new Shopify orders come in, create a Notion page with order details and notify the team in Slack")
        - Cross-platform analytics (e.g., "Show me conversion rates from Klaviyo emails to Shopify purchases for our latest campaign")
        
        Format your response as a JSON object with an array of items:
        {{
            "items": [
                {{
                    "query": "Detailed user's cross-service request",
                    "response": "Step-by-step response showing how the platform coordinates between {tools_str}",
                    "services_required": {json.dumps(tools)}
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
            batch_id = f"cross_{'_'.join(t[:3] for t in tools)}_{batch_idx}_{uuid.uuid4().hex[:8]}"
            logging.info(f"Starting batch {batch_idx+1}/{num_batches} ({batch_count} items) [ID: {batch_id}]")
            
            system_prompt = create_prompt(batch_count)
            
            # Using GPT-4o for complex cross-service scenarios
            response = openai.chat.completions.create(
                model="gpt-4o",  # Using GPT-4o for more sophisticated cross-service understanding
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate {batch_count} cross-service queries for scenario: {scenario} with these services: {tools_str}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
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
                        "query": f"Can you coordinate between {tools_str} for {scenario}?",
                        "response": f"I'll analyze data across {tools_str} to help with {scenario}...",
                        "services_required": tools
                    } for i in range(batch_count)]
            
            # Validate items
            valid_items = []
            for item in items:
                if isinstance(item, dict) and "query" in item and "response" in item:
                    # Add services_required if not present
                    if "services_required" not in item:
                        item["services_required"] = tools
                    valid_items.append(item)
            
            if not valid_items:
                logging.warning(f"No valid items in batch {batch_id}. Using fallbacks.")
                valid_items = [{
                    "query": f"Help me coordinate {tools_str} for my {scenario} workflows",
                    "response": f"I'll help you integrate {tools_str} for {scenario}. Here's how we can approach it...",
                    "services_required": tools
                } for i in range(batch_count)]
            
            logging.info(f"Batch {batch_id} complete: {len(valid_items)} items generated")
            return valid_items
            
        except Exception as e:
            logging.error(f"Error in batch {batch_idx}: {str(e)}")
            # Return fallbacks on error
            return [{
                "query": f"How can I integrate {tools_str} for {scenario}?",
                "response": f"Here's how to integrate {tools_str} for {scenario}...",
                "services_required": tools
            } for i in range(batch_count)]
    
    # Process batches with retries
    for batch_idx in range(num_batches):
        max_retries = 3
        for retry in range(max_retries):
            try:
                batch_items = process_batch(batch_idx)
                all_items.extend(batch_items)
                # Sleep between batches to avoid rate limiting
                if batch_idx < num_batches - 1:
                    sleep_time = 2.0 + random.random()  # 2-3 second sleep (longer for GPT-4o)
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
                        "query": f"How can I use {tools_str} together for {scenario}?",
                        "response": f"Here's how to integrate {tools_str} for {scenario}...",
                        "services_required": tools
                    } for i in range(batch_count)])
    
    # Ensure we have exactly the requested number of items
    if len(all_items) > count:
        all_items = all_items[:count]
    elif len(all_items) < count:
        # Add fallback items if we're still short
        logging.warning(f"Generated only {len(all_items)}/{count} items for scenario: {scenario}. Adding fallbacks.")
        additional_needed = count - len(all_items)
        all_items.extend([{
            "query": f"How can I integrate {tools_str} for {scenario} workflow #{i}?",
            "response": f"Here's how to use {tools_str} together for {scenario}...",
            "services_required": tools
        } for i in range(additional_needed)])
    
    logging.info(f"Completed generation of {len(all_items)} items for scenario: {scenario}")
    return all_items

def insert_cross_service_data(scenario_obj, items, batch_id=None):
    """
    Insert cross-service items into Supabase database
    
    Args:
        scenario_obj (dict): Dictionary containing scenario information
        items (list): List of items to insert
        batch_id (str): Optional batch identifier for logging
        
    Returns:
        int: Number of successfully inserted items
    """
    tools = scenario_obj["tools"]
    scenario = scenario_obj["scenario"]
    description = scenario_obj["description"]
    tools_str = ", ".join(tools)
    
    success = 0
    errors = 0
    batch_info = f"batch {batch_id}" if batch_id else ""
    
    logging.info(f"Inserting {len(items)} items for cross-service scenario: {scenario} {batch_info}")
    
    for idx, item in enumerate(items):
        # For cross-service entries, we'll use the first tool as the primary
        # but include metadata about all required services
        primary_tool = tools[0]
        
        payload = {
            "tool": primary_tool,
            "intent": "Cross-Service Integration",
            "query": item["query"],
            "response": item["response"],
            "metadata": {
                "generation_date": datetime.now().isoformat(),
                "model": "gpt-4o",
                "batch_id": batch_id or f"cross_{'_'.join(t[:3] for t in tools)}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "complexity": "cross_service",
                "scenario": scenario,
                "description": description,
                "services_required": item.get("services_required", tools),
                "is_multi_service": True
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
                    if idx % 5 == 0 or idx == len(items) - 1:  # Log more frequently for cross-service
                        logging.info(f"Insertion progress: {idx+1}/{len(items)} for scenario: {scenario}")
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
    
    logging.info(f"Insertion complete: {success} successful, {errors} failed for scenario: {scenario}")
    return success

def save_to_json(all_data):
    """Save generated data to a JSON file as backup"""
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"cross_service_training_data_{timestamp}.json"
    with open(filename, "w") as f:
        json.dump(all_data, f, indent=2)
    print(f"\n📝 Saved backup to {filename}")
    return filename

def run_cross_service_generation(examples_per_scenario=5, batch_size=5, sleep_time=3, dry_run=False, specific_scenarios=None):
    """
    Run cross-service training data generation
    
    Args:
        examples_per_scenario (int): Number of examples to generate per scenario
        batch_size (int): Size of batches for generation
        sleep_time (int): Sleep time between scenarios
        dry_run (bool): If True, don't insert into database
        specific_scenarios (list): Optional list of specific scenario indexes to run
        
    Returns:
        str: Path to the saved JSON file
    """
    print(f"\n🔄 Starting cross-service training data generation with {examples_per_scenario} examples per scenario")
    print(f"📊 Total scenarios: {len(cross_service_scenarios)}")
    
    all_data = []
    total_generated = 0
    
    # Filter scenarios if specific ones are requested
    scenarios_to_process = cross_service_scenarios
    if specific_scenarios:
        scenarios_to_process = [cross_service_scenarios[i] for i in specific_scenarios if i < len(cross_service_scenarios)]
        print(f"🎯 Running only specific scenarios: {len(scenarios_to_process)} scenarios selected")
    
    # Process each scenario
    for idx, scenario in enumerate(scenarios_to_process):
        tools = scenario["tools"]
        scenario_name = scenario["scenario"]
        tools_str = ", ".join(tools)
        
        print(f"\n[{idx+1}/{len(scenarios_to_process)}] 🔄 Processing scenario: {scenario_name} ({tools_str})")
        
        try:
            # Generate cross-service queries for this scenario
            items = generate_cross_service_queries(scenario, examples_per_scenario, batch_size)
            
            # Save to all_data
            all_data.append({
                "scenario": scenario_name,
                "tools": tools,
                "description": scenario["description"],
                "items": items
            })
            
            # Insert into database unless dry_run
            if not dry_run:
                print(f"💾 Inserting {len(items)} items for scenario: {scenario_name}")
                insert_cross_service_data(scenario, items)
            else:
                print(f"🧪 Dry run - would insert {len(items)} items for scenario: {scenario_name}")
            
            total_generated += len(items)
            
            # Sleep between scenarios to avoid rate limiting
            if idx < len(scenarios_to_process) - 1:
                print(f"😴 Sleeping for {sleep_time} seconds before next scenario...")
                time.sleep(sleep_time)
                
        except Exception as e:
            logging.error(f"Error processing scenario {scenario_name}: {str(e)}")
            print(f"❌ Error processing scenario {scenario_name}: {str(e)}")
    
    # Save all generated data to JSON
    json_path = save_to_json(all_data)
    
    print(f"\n✅ Cross-service training data generation complete!")
    print(f"📊 Generated {total_generated} examples across {len(scenarios_to_process)} scenarios")
    print(f"📝 Data saved to {json_path}")
    
    return json_path

def create_custom_scenario(tools, scenario_name, description):
    """Create a custom cross-service scenario"""
    return {
        "tools": tools,
        "scenario": scenario_name,
        "description": description
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate cross-service training data for MCP")
    parser.add_argument('--count', type=int, default=5, help='Number of examples per scenario')
    parser.add_argument('--batch', type=int, default=5, help='Batch size for generation')
    parser.add_argument('--sleep', type=int, default=3, help='Sleep time between scenarios')
    parser.add_argument('--dry-run', action='store_true', help='Run without inserting into database')
    parser.add_argument('--scenarios', type=str, help='Comma-separated list of scenario indexes to run (0-based)')
    parser.add_argument('--list-scenarios', action='store_true', help='List all available scenarios and exit')
    
    args = parser.parse_args()
    
    # List scenarios if requested
    if args.list_scenarios:
        print("\n📋 Available cross-service scenarios:")
        for idx, scenario in enumerate(cross_service_scenarios):
            print(f"[{idx}] {scenario['scenario']} - Services: {', '.join(scenario['tools'])}")
            print(f"    {scenario['description']}")
        print("\nUse --scenarios to specify which ones to run (e.g., --scenarios 0,2,5)")
        exit(0)
    
    # Parse specific scenarios if provided
    specific_scenarios = None
    if args.scenarios:
        try:
            specific_scenarios = [int(i.strip()) for i in args.scenarios.split(',')]
            print(f"🎯 Running specific scenarios: {specific_scenarios}")
        except ValueError:
            print("❌ Invalid scenario indexes. Use comma-separated integers (e.g., 0,2,5)")
            exit(1)
    
    # Run with the specified parameters
    run_cross_service_generation(
        examples_per_scenario=args.count,
        batch_size=args.batch,
        sleep_time=args.sleep,
        dry_run=args.dry_run,
        specific_scenarios=specific_scenarios
    )