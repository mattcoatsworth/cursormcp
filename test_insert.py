import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

# Create a single test example with all required fields
test_example = {
    "tool": "Shopify",
    "intent": "Check Order Status",
    "query": "What's the status of order #12345?",
    "response": "Order #12345 is currently being processed and will be shipped tomorrow.",
    "systems": ["Shopify"],
    "workflow": ["Check Order Status"],
    "execution_details": {
        "steps": ["Query order status", "Format response"],
        "status": "completed"
    },
    "metadata": {
        "source": "test_insert",
        "generated_at": datetime.now().isoformat()
    }
}

try:
    # Insert the example
    result = supabase.table('training_data').insert(test_example).execute()
    print("Successfully inserted test example!")
    print(f"Result: {result}")
except Exception as e:
    print(f"Error inserting example: {str(e)}") 