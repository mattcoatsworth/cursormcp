#!/usr/bin/env python3
"""
Generate complex cross-system training data for multi-step API operations.

This script creates specialized training examples that involve:
1. Multiple systems/services in a single query
2. Sequential API calls that depend on each other
3. Complex workflows that require data from one system to be used in another
4. Decision-making based on multiple data sources

These examples simulate real-world complex tasks where a user wants to accomplish
something that requires multiple API calls across different platforms.
"""

#!/usr/bin/env python3

import os
import json
import time
import random
import argparse
from datetime import datetime
import openai
import psycopg2
from psycopg2.extras import execute_values

# Define complex multi-system scenarios with sequential dependencies covering all 13 integrations
COMPLEX_SCENARIOS = [
    # Shopify + Klaviyo integrations
    {
        "name": "Email Campaign Based on Order Data",
        "systems": ["Shopify", "Klaviyo"],
        "description": "Create and send an email campaign to customers who purchased specific products",
        "workflow": [
            "Fetch recent orders from Shopify",
            "Filter orders by product or category",
            "Extract customer emails from filtered orders",
            "Create a segment in Klaviyo with these emails",
            "Design and send an email campaign to this segment"
        ]
    },
    
    # Shopify + Triple Whale + Slack integrations
    {
        "name": "Inventory Planning with Sales Analysis",
        "systems": ["Shopify", "Triple Whale", "Slack"],
        "description": "Analyze product performance and share restock recommendations with team",
        "workflow": [
            "Get inventory levels from Shopify",
            "Pull sales velocity data from Triple Whale",
            "Calculate restock needs based on inventory and sales velocity",
            "Send restock recommendations to a specific Slack channel",
            "Create a detailed report and post it to team channel"
        ]
    },
    
    # Shopify + Gorgias + Slack integrations
    {
        "name": "Customer Support Ticket Processing",
        "systems": ["Shopify", "Gorgias", "Slack"],
        "description": "Process customer support tickets about orders and coordinate with fulfillment team",
        "workflow": [
            "Find open tickets in Gorgias related to order issues",
            "For each ticket, look up the order in Shopify",
            "Update ticket with order status information",
            "For delayed orders, notify the fulfillment team via Slack",
            "Update the customer with estimated delivery date"
        ]
    },
    
    # Klaviyo + Triple Whale + Shopify + Notion integrations
    {
        "name": "Marketing Campaign ROI Analysis",
        "systems": ["Klaviyo", "Triple Whale", "Shopify", "Notion"],
        "description": "Analyze the ROI of marketing campaigns and document findings",
        "workflow": [
            "Pull campaign performance data from Klaviyo",
            "Get associated revenue data from Triple Whale",
            "Verify order count from Shopify for the campaign period",
            "Calculate campaign ROI using the gathered data",
            "Document findings in a Notion page for the marketing team"
        ]
    },
    
    # Shopify + Slack + Klaviyo + Google Calendar integrations
    {
        "name": "Product Launch Coordination",
        "systems": ["Shopify", "Slack", "Klaviyo", "Google Calendar"],
        "description": "Coordinate a new product launch across multiple teams",
        "workflow": [
            "Create new product in Shopify but keep as draft",
            "Schedule a team review meeting in Google Calendar",
            "Send notification to product team channel in Slack",
            "Set up a pre-launch email sequence in Klaviyo",
            "After approval, publish the product and activate the email sequence"
        ]
    },
    
    # OpenAI + Notion + Slack + Shopify integrations
    {
        "name": "Content Creation and Publishing",
        "systems": ["OpenAI", "Notion", "Slack", "Shopify"],
        "description": "Generate product descriptions, save to Notion, get approval, and update Shopify",
        "workflow": [
            "Generate product descriptions using OpenAI",
            "Save draft descriptions to a Notion database",
            "Notify content team on Slack for review",
            "Once approved, update the products in Shopify with new descriptions",
            "Send confirmation of updates to the marketing channel"
        ]
    },
    
    # Shopify + Klaviyo + Postscript integrations
    {
        "name": "Customer Win-Back Campaign",
        "systems": ["Shopify", "Klaviyo", "Postscript"],
        "description": "Identify and re-engage inactive customers through email and SMS",
        "workflow": [
            "Query Shopify for customers who haven't purchased in 90+ days",
            "Create a segment in Klaviyo for email campaign",
            "Set up a win-back email sequence with discount code",
            "Create a complementary SMS campaign in Postscript",
            "Track redemption rates across both channels"
        ]
    },
    
    # GitHub + Notion + Slack + Google Calendar integrations
    {
        "name": "Development Sprint Planning",
        "systems": ["GitHub", "Notion", "Slack", "Google Calendar"],
        "description": "Organize development sprint from GitHub issues to team schedule",
        "workflow": [
            "Pull open issues from GitHub repository",
            "Organize and prioritize issues in a Notion sprint planning board",
            "Schedule sprint kickoff meeting in Google Calendar",
            "Send sprint plan to development team via Slack",
            "Tag issues for the sprint in GitHub"
        ]
    },
    
    # Shopify + Triple Whale + Northbeam + Notion integrations
    {
        "name": "Sales and Ad Spend Correlation Analysis",
        "systems": ["Shopify", "Triple Whale", "Northbeam", "Notion"],
        "description": "Analyze relationship between ad spend and sales across platforms",
        "workflow": [
            "Retrieve daily sales data from Shopify for the last 30 days",
            "Get ad spend data from Triple Whale by platform",
            "Pull ROAS metrics from Northbeam for comparison",
            "Calculate correlations between spend and sales with time lag consideration",
            "Document findings with charts in a Notion analytics page"
        ]
    },
    
    # Gorgias + Slack + OpenAI + Notion integrations
    {
        "name": "Customer Feedback Collection and Analysis",
        "systems": ["Gorgias", "Slack", "OpenAI", "Notion"],
        "description": "Gather customer feedback, analyze sentiment, and document insights",
        "workflow": [
            "Extract customer comments and reviews from Gorgias",
            "Use OpenAI to perform sentiment analysis on the feedback",
            "Categorize feedback by product and issue type",
            "Share critical issues with relevant teams in Slack",
            "Create a feedback analysis report in Notion"
        ]
    },
    
    # Elevar + Triple Whale + Northbeam + Shopify integrations
    {
        "name": "Cross-Platform Analytics Comparison",
        "systems": ["Elevar", "Triple Whale", "Northbeam", "Shopify"],
        "description": "Compare analytics data across multiple platforms and reconcile differences",
        "workflow": [
            "Pull conversion tracking data from Elevar",
            "Get attribution data from Triple Whale",
            "Extract ROAS calculations from Northbeam",
            "Verify actual order data in Shopify",
            "Identify and resolve discrepancies between platforms"
        ]
    },
    
    # Recharm + Shopify + Klaviyo + Postscript integrations
    {
        "name": "Abandoned Cart Recovery Strategy",
        "systems": ["Recharm", "Shopify", "Klaviyo", "Postscript"],
        "description": "Implement a multi-channel abandoned cart recovery strategy",
        "workflow": [
            "Use Recharm to identify abandoned cart patterns",
            "Pull cart details from Shopify",
            "Set up email recovery sequence in Klaviyo",
            "Create SMS follow-up campaign in Postscript",
            "Track recovery rates across channels"
        ]
    },
    
    # Northbeam + Slack + Notion + Triple Whale integrations
    {
        "name": "Weekly Marketing Performance Report",
        "systems": ["Northbeam", "Slack", "Notion", "Triple Whale"],
        "description": "Create and distribute weekly marketing performance reports",
        "workflow": [
            "Pull attribution data from Northbeam",
            "Get campaign performance metrics from Triple Whale",
            "Compile findings into a structured Notion document",
            "Create visualizations and highlight key insights",
            "Share report with marketing team via Slack"
        ]
    },
    
    # Prescient AI + Shopify + Klaviyo + Slack integrations
    {
        "name": "Predictive Inventory Management",
        "systems": ["Prescient AI", "Shopify", "Klaviyo", "Slack"],
        "description": "Use AI predictions to optimize inventory and notify customers of restocks",
        "workflow": [
            "Get current inventory levels from Shopify",
            "Use Prescient AI to forecast demand and recommend restock quantities",
            "Create purchase orders based on predictions",
            "Set up Klaviyo email notifications for product restocks",
            "Alert inventory team to expected arrival dates via Slack"
        ]
    },
    
    # Shopify + Triple Whale + GitHub + Notion integrations
    {
        "name": "Store Performance Optimization",
        "systems": ["Shopify", "Triple Whale", "GitHub", "Notion"],
        "description": "Identify store performance issues and implement technical improvements",
        "workflow": [
            "Analyze store performance data from Shopify",
            "Review conversion metrics from Triple Whale",
            "Create technical improvement tickets in GitHub",
            "Document optimization strategy in Notion",
            "Track implementation and measure impact"
        ]
    },
    
    # All E-commerce integrations combo
    {
        "name": "Full E-commerce Stack Analysis",
        "systems": ["Shopify", "Klaviyo", "Postscript", "Triple Whale", "Northbeam", "Gorgias"],
        "description": "Perform a comprehensive analysis of the entire e-commerce operation",
        "workflow": [
            "Pull orders and customer data from Shopify",
            "Analyze email performance from Klaviyo",
            "Review SMS campaign metrics from Postscript",
            "Get advertising performance from Triple Whale and Northbeam",
            "Examine customer support metrics from Gorgias",
            "Create a comprehensive health dashboard"
        ]
    },
    
    # Productivity tools combo
    {
        "name": "Team Collaboration Workflow",
        "systems": ["Slack", "Notion", "GitHub", "Google Calendar"],
        "description": "Set up a complete team collaboration workflow for a project",
        "workflow": [
            "Create a project roadmap in Notion",
            "Set up code repository and project management in GitHub",
            "Schedule recurring team meetings in Google Calendar",
            "Create dedicated Slack channels for project communication",
            "Configure integrations between all platforms for automated updates"
        ]
    },
    
    # AI + E-commerce tools
    {
        "name": "AI-Enhanced Customer Experience",
        "systems": ["OpenAI", "Shopify", "Gorgias", "Klaviyo"],
        "description": "Use AI to enhance customer experience across touchpoints",
        "workflow": [
            "Generate personalized product recommendations with OpenAI",
            "Update product pages in Shopify with AI-generated content",
            "Create AI-powered response templates in Gorgias",
            "Design personalized email flows in Klaviyo using AI-generated segments",
            "Measure impact on customer satisfaction and sales"
        ]
    }
]

def setup_openai():
    """Set up OpenAI API with key from environment variables"""
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

def generate_complex_example(scenario, temperature=0.8):
    """
    Generate a complex cross-system example with sequential API calls
    
    Args:
        scenario (dict): The scenario to generate an example for
        temperature (float): Creativity level for generation
        
    Returns:
        dict: Generated example with query and response
    """
    systems_str = ", ".join(scenario["systems"])
    workflow_steps = "\n".join([f"{i+1}. {step}" for i, step in enumerate(scenario["workflow"])])
    
    system_prompt = f"""
    You are helping generate training data for a multi-service AI assistant that can perform complex tasks across multiple systems.
    
    Create a realistic user query that requires using multiple systems: {systems_str} in sequence.
    This query should be for the scenario: {scenario["name"]} - {scenario["description"]}
    
    The query should require the assistant to perform these steps in sequence:
    {workflow_steps}
    
    Also provide a professional, detailed response that shows how the assistant would:
    1. Understand the multi-step nature of the request
    2. Break down the task into the steps shown above
    3. Execute each step in the correct order
    4. Use output from earlier steps as input to later steps
    5. Provide a complete solution that addresses all parts of the request
    
    Format your response as JSON with "query" and "response" fields.
    Make sure the query explicitly mentions at least 2 of these systems: {systems_str}.
    The query should be realistic, as if from a user who knows what they want but doesn't know the exact technical steps.
    """
    
    try:
        # Use ChatGPT 3.5 as required
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate a complex multi-step query and response for the scenario: {scenario['name']}"}
            ],
            temperature=temperature,
            max_tokens=2500,
            response_format={"type": "json_object"}
        )
        
        # Parse response
        content = response.choices[0].message.content
        example_json = json.loads(content)
        
        # Add metadata
        example_json["scenario"] = scenario["name"]
        example_json["systems"] = scenario["systems"]
        example_json["created_at"] = datetime.now().isoformat()
        example_json["is_complex_multi_system"] = True
        example_json["workflow_steps"] = scenario["workflow"]
        
        return example_json
    
    except Exception as e:
        print(f"Error generating example for scenario {scenario['name']}: {str(e)}")
        time.sleep(1)  # Wait a bit on error
        return None

def insert_examples_to_db(examples, conn=None):
    """
    Insert examples into the database
    
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
                    scenario VARCHAR(255),
                    systems JSONB,
                    workflow_steps JSONB,
                    is_complex_multi_system BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
                """)
                conn.commit()
            
            # Check if the columns for complex scenarios exist
            cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'training_data' AND column_name = 'workflow_steps'
            """)
            has_workflow_column = cur.fetchone() is not None
            
            if not has_workflow_column:
                # Add the columns if they don't exist
                print("Adding necessary columns for complex scenarios...")
                cur.execute("ALTER TABLE training_data ADD COLUMN IF NOT EXISTS workflow_steps JSONB")
                cur.execute("ALTER TABLE training_data ADD COLUMN IF NOT EXISTS is_complex_multi_system BOOLEAN DEFAULT FALSE")
                conn.commit()
            
            # Prepare data for insertion
            values = []
            for ex in examples:
                values.append((
                    ex["query"],
                    ex["response"],
                    ex.get("scenario"),
                    json.dumps(ex.get("systems", [])),
                    json.dumps(ex.get("workflow_steps", [])),
                    ex.get("is_complex_multi_system", False),
                    datetime.now()
                ))
            
            # Perform batch insert
            execute_values(
                cur,
                """
                INSERT INTO training_data 
                (query, response, scenario, systems, workflow_steps, is_complex_multi_system, created_at)
                VALUES %s
                RETURNING id
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

def generate_batch(batch_size=5, examples_per_scenario=1, temperature=0.8):
    """
    Generate a batch of complex cross-system examples
    
    Args:
        batch_size (int): Number of scenarios to include in a batch
        examples_per_scenario (int): Number of examples to generate per scenario
        temperature (float): Creativity level for generation (0.0-1.0)
        
    Returns:
        list: Generated examples
    """
    # Choose random scenarios for this batch
    scenarios = random.sample(COMPLEX_SCENARIOS, min(batch_size, len(COMPLEX_SCENARIOS)))
    
    all_examples = []
    for scenario in scenarios:
        print(f"Generating examples for scenario: {scenario['name']}")
        
        for i in range(examples_per_scenario):
            example = generate_complex_example(scenario, temperature)
            if example:
                print(f"  Generated example {i+1}/{examples_per_scenario}")
                all_examples.append(example)
            else:
                print(f"  Failed to generate example {i+1}/{examples_per_scenario}")
            
            # Small pause to avoid rate limits
            time.sleep(0.5)
    
    return all_examples

def save_examples_to_file(examples, filename=None):
    """
    Save examples to a JSON file
    
    Args:
        examples (list): List of examples to save
        filename (str): Optional filename, if None a timestamped name is generated
        
    Returns:
        str: Path to the saved file
    """
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"complex_cross_system_examples_{timestamp}.json"
    
    os.makedirs("training_data_output", exist_ok=True)
    file_path = os.path.join("training_data_output", filename)
    
    with open(file_path, 'w') as f:
        json.dump(examples, f, indent=2)
    
    print(f"Saved {len(examples)} examples to {file_path}")
    return file_path

def main():
    """Main function to orchestrate complex cross-system training data generation"""
    parser = argparse.ArgumentParser(description="Generate complex cross-system training data")
    parser.add_argument("--batch-size", type=int, default=5, help="Number of scenarios to include in a batch")
    parser.add_argument("--examples-per-scenario", type=int, default=2, help="Number of examples to generate per scenario")
    parser.add_argument("--temperature", type=float, default=0.8, help="Creativity level (0.0-1.0)")
    parser.add_argument("--batches", type=int, default=1, help="Number of batches to generate")
    parser.add_argument("--skip-db", action="store_true", help="Skip database insertion")
    
    args = parser.parse_args()
    
    # Setup OpenAI
    setup_openai()
    
    # Generate batches
    all_examples = []
    for batch in range(args.batches):
        print(f"\nGenerating batch {batch+1}/{args.batches}...")
        batch_examples = generate_batch(
            batch_size=args.batch_size,
            examples_per_scenario=args.examples_per_scenario,
            temperature=args.temperature
        )
        all_examples.extend(batch_examples)
        
        # Save and insert each batch immediately
        if batch_examples:
            save_examples_to_file(batch_examples, f"complex_cross_system_batch_{batch+1}_{datetime.now().strftime('%Y%m%d%H%M%S')}.json")
            
            if not args.skip_db:
                inserted = insert_examples_to_db(batch_examples)
                print(f"Inserted {inserted} examples into database")
        
        # Pause between batches
        if batch < args.batches - 1:
            print(f"Pausing before next batch...")
            time.sleep(2)
    
    # Print summary
    print(f"\nGeneration complete!")
    print(f"Generated {len(all_examples)} complex cross-system examples total")
    
    # Create an example command for running in different configurations
    print("\nExample commands for different use cases:")
    print("  # Generate a small test batch (10 examples):")
    print("  python generate_complex_cross_system_data.py --batch-size 5 --examples-per-scenario 2")
    print("\n  # Generate a large set (100 examples):")
    print("  python generate_complex_cross_system_data.py --batch-size 10 --examples-per-scenario 2 --batches 5")
    print("\n  # Generate more creative variations:")
    print("  python generate_complex_cross_system_data.py --temperature 1.0")

if __name__ == "__main__":
    main()