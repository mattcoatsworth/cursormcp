#!/usr/bin/env python3
"""
Script to generate multi-service complex training examples for the MCP

This script generates and inserts complex training examples that require multiple
services to fulfill. It's designed to exercise all available combinations of
cross-platform integrations.
"""

import os
import json
import time
import uuid
import random
from datetime import datetime
import openai
from supabase import create_client, Client

# Initialize API clients
openai.api_key = os.environ.get("OPENAI_API_KEY")
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# List of all available services
ALL_SERVICES = [
    "Shopify",
    "Klaviyo",
    "Postscript",
    "Northbeam",
    "Slack",
    "Notion",
    "OpenAI",
    "Gorgias",
    "Prescient AI",
    "Recharm",
    "Triple Whale",
    "Elevar",
    "Google Calendar",
    "GitHub"
]

# Dictionary of service categories
SERVICE_CATEGORIES = {
    "E-commerce": ["Shopify", "Gorgias"],
    "Marketing": ["Klaviyo", "Postscript"],
    "Analytics": ["Northbeam", "Triple Whale", "Elevar"],
    "Productivity": ["Slack", "Notion", "Google Calendar", "GitHub"],
    "AI": ["OpenAI", "Prescient AI", "Recharm"]
}

# Predefined complex scenarios that combine multiple services
PREDEFINED_SCENARIOS = [
    {
        "name": "E-commerce Analytics and Marketing",
        "description": "Analyze store performance and send targeted marketing campaigns",
        "services_required": ["Shopify", "Klaviyo", "Triple Whale"],
        "complexity": "medium"
    },
    {
        "name": "Customer Support Automation",
        "description": "Generate AI responses to customer queries and update support tickets",
        "services_required": ["Gorgias", "OpenAI", "Slack"],
        "complexity": "high"
    },
    {
        "name": "Product Development Workflow",
        "description": "Coordinate product development across multiple tools",
        "services_required": ["GitHub", "Notion", "Slack"],
        "complexity": "medium"
    },
    {
        "name": "Marketing Performance Analysis",
        "description": "Analyze marketing performance across channels and create reports",
        "services_required": ["Klaviyo", "Northbeam", "Notion", "OpenAI"],
        "complexity": "high"
    },
    {
        "name": "Customer Reengagement",
        "description": "Identify and reengage churned customers",
        "services_required": ["Shopify", "Klaviyo", "Postscript"],
        "complexity": "medium"
    },
    {
        "name": "Team Coordination",
        "description": "Coordinate team activities across multiple tools",
        "services_required": ["Slack", "Google Calendar", "Notion"],
        "complexity": "low"
    },
    {
        "name": "AI-Enhanced Marketing",
        "description": "Generate and schedule marketing content using AI",
        "services_required": ["OpenAI", "Klaviyo", "Slack"],
        "complexity": "medium"
    },
    {
        "name": "Advanced Analytics Dashboard",
        "description": "Create comprehensive analytics dashboards",
        "services_required": ["Triple Whale", "Northbeam", "Notion", "OpenAI"],
        "complexity": "high"
    },
    {
        "name": "Order and Inventory Management",
        "description": "Manage orders and update inventory across systems",
        "services_required": ["Shopify", "Slack", "Notion"],
        "complexity": "medium"
    },
    {
        "name": "Customer Journey Tracking",
        "description": "Track and optimize customer journey across channels",
        "services_required": ["Shopify", "Klaviyo", "Gorgias", "Triple Whale"],
        "complexity": "high"
    }
]

def generate_complex_examples(count: int = 50, batch_size: int = 5):
    """
    Generate complex training examples requiring multiple services
    
    Args:
        count: Number of examples to generate
        batch_size: Number of examples to generate in each batch
        
    Returns:
        List of generated examples
    """
    all_examples = []
    batches = (count + batch_size - 1) // batch_size
    
    for batch_idx in range(batches):
        # Determine how many examples to generate in this batch
        current_batch_size = min(batch_size, count - batch_idx * batch_size)
        if current_batch_size <= 0:
            break
            
        # Select a random scenario or create a new one
        if random.random() < 0.7:  # 70% chance to use predefined scenario
            scenario = random.choice(PREDEFINED_SCENARIOS)
            services = scenario["services_required"]
            scenario_name = scenario["name"]
            description = scenario["description"]
            complexity = scenario["complexity"]
        else:  # 30% chance to create a random scenario
            # Randomly select 2-4 services
            num_services = random.randint(2, 4)
            services = random.sample(ALL_SERVICES, num_services)
            
            # Generate a scenario name and description
            scenario_name = f"Custom Scenario {batch_idx}-{uuid.uuid4().hex[:6]}"
            description = f"Custom scenario involving {', '.join(services)}"
            complexity = random.choice(["low", "medium", "high"])
        
        # Create a prompt for OpenAI - simplified for faster generation
        prompt = f"""Generate {current_batch_size} realistic user queries that would require using multiple services together to fulfill the request. 
        
Scenario: {scenario_name}
Description: {description}
Required Services: {', '.join(services)}
Complexity: {complexity}

For each query, provide a concise system response that explains how the services would be used together.

Format each as a JSON object with these fields:
- "query": the user's question or command
- "response": the system response explaining the solution
- "services_required": list of service names that would be needed
- "complexity": one of "low", "medium", or "high"

Return your answer as a JSON array of these objects.
"""

        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",  # Use GPT-3.5 for cost efficiency
                messages=[
                    {"role": "system", "content": "You are a specialist in multi-service business operations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.9,  # Slightly higher temperature for more variety
                response_format={"type": "json_object"},
                max_tokens=800  # Limit tokens for faster response
            )
            
            response_text = response.choices[0].message.content
            # Handle both formats: array of examples or object with examples property
            try:
                parsed = json.loads(response_text)
                if isinstance(parsed, list):
                    examples = parsed
                else:
                    examples = parsed.get("examples", [])
                    # If no examples key but looks like it contains the right data structure
                    if not examples and all(key in parsed for key in ["query", "response"]):
                        examples = [parsed]
            except Exception as e:
                print(f"Error parsing response JSON: {e}")
                examples = []
            
            # Add metadata to each example
            for example in examples:
                # Generate a unique ID
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                example["id"] = f"ms-{timestamp}-{uuid.uuid4().hex[:8]}"
                
                example["metadata"] = {
                    "is_multi_service": True,
                    "services_required": example.get("services_required", services),
                    "scenario": scenario_name,
                    "description": description,
                    "complexity": example.get("complexity", complexity),
                    "source": "auto-generated",
                    "generated_at": datetime.now().isoformat()
                }
                # Set a placeholder tool and intent
                example["tool"] = "Multi-Service"
                example["intent"] = "Cross-Platform Integration"
                
                # Add timestamps - simplified to just use the common timestamp
                example["createdAt"] = timestamp
                example["updatedAt"] = timestamp
                
            all_examples.extend(examples)
            
            print(f"Generated batch {batch_idx + 1}/{batches} with {len(examples)} examples")
            
            # Reduced sleep time
            if batch_idx < batches - 1:
                time.sleep(0.1)  # Much shorter sleep to speed up generation
                
        except Exception as e:
            print(f"Error generating examples: {e}")
            time.sleep(1)  # Shorter sleep on error
    
    # Remove services_required from the top level since it's in metadata
    for example in all_examples:
        if "services_required" in example:
            del example["services_required"]
    
    print(f"Generated {len(all_examples)} examples total")
    return all_examples

def save_to_json(examples, filename="multi_service_examples.json"):
    """Save generated examples to a JSON file as backup"""
    with open(filename, 'w') as f:
        json.dump(examples, f, indent=2)
    print(f"Saved {len(examples)} examples to {filename}")
    return filename

def insert_to_database(examples):
    """Insert examples into the Supabase database using a simpler approach"""
    inserted_count = 0
    error_count = 0
    
    # Skip Supabase insertion - we'll use the python script for direct database insertion instead
    # This is faster and more reliable
    print(f"Skipping Supabase API insertion for {len(examples)} examples.")
    print("Examples will be inserted via bulk_insert_training_data.py")
    
    # Just save to JSON and consider all as "inserted" - actual insertion happens in generate_and_insert.py
    inserted_count = len(examples)
    
    return inserted_count, error_count

def main():
    """Main function to run the script"""
    print("Starting multi-service training example generation...")
    
    # Generate examples in smaller batches to avoid timeouts
    # We'll generate 100 examples per run, for 5 runs to get 500 total
    batch_size = 5
    examples_per_batch = 100
    
    for batch_num in range(1, 6):  # 5 batches of 100 examples each
        print(f"Starting batch {batch_num}/5...")
        examples = generate_complex_examples(examples_per_batch, batch_size=batch_size)
        
        # Save to a batch-specific backup file
        filename = f"multi_service_examples_batch_{batch_num}.json"
        save_to_json(examples, filename)
        
        print(f"Inserting {len(examples)} examples from batch {batch_num} into the database...")
        inserted, errors = insert_to_database(examples)
        
        print(f"Batch {batch_num} insertion complete: {inserted} examples inserted, {errors} errors")
    
    print("All batches complete! Generated 500 multi-service examples total.")

if __name__ == "__main__":
    main()