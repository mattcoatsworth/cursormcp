import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')  # Use anon key first

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase credentials")

logging.info(f"Connecting to Supabase at {supabase_url}")
supabase: Client = create_client(supabase_url, supabase_key)

# Test data
test_data = {
    "tool": "Shopify",
    "intent": "Check Order Status",
    "query": "What's the status of order #1234?",
    "response": "Order #1234 is currently being processed.",
    "systems": ["Shopify"],
    "workflow": ["Check Order Status"],
    "execution_details": {
        "steps": ["Query order status", "Format response"],
        "status": "completed"
    },
    "metadata": {
        "source": "test_script",
        "generated_at": datetime.now().isoformat()
    }
}

try:
    # First, verify we can read from the table
    logging.info("Testing table read...")
    result = supabase.table('training_data').select("count").limit(1).execute()
    logging.info(f"Current row count: {result.data[0]['count'] if result.data else 0}")

    # Now try to insert the test data
    logging.info("Attempting to insert test data...")
    result = supabase.table('training_data').insert(test_data).execute()
    logging.info("Successfully inserted test data!")
    logging.info(f"Insert result: {result}")

    # Verify the insertion by reading again
    result = supabase.table('training_data').select("count").limit(1).execute()
    logging.info(f"New row count: {result.data[0]['count'] if result.data else 0}")

except Exception as e:
    logging.error(f"Error: {str(e)}")
    if hasattr(e, 'response'):
        logging.error(f"Response: {e.response.text if hasattr(e.response, 'text') else e.response}") 