import os
import json
from datetime import datetime
from supabase import create_client, Client

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def generate_test_data():
    # Sample tools and intents
    tools = ["Shopify", "Klaviyo", "Warehouse", "Customer Service"]
    intents = [
        "Check Order Status",
        "Update Customer Information",
        "Process Return",
        "Check Inventory",
        "Send Marketing Email"
    ]
    
    # Sample queries and responses
    training_examples = [
        {
            "tool": "Shopify",
            "intent": "Check Order Status",
            "query": "What's the status of order #12345?",
            "response": "Order #12345 is currently being processed and is expected to ship within 24 hours. You can track its progress in your Shopify admin panel under Orders.",
            "systems": ["Shopify", "Warehouse"],
            "workflow": ["Check order status", "Verify processing stage", "Provide update"],
            "execution_details": {
                "order_id": "12345",
                "status": "processing",
                "estimated_ship_time": "24 hours"
            },
            "metadata": {
                "generation_date": datetime.now().isoformat(),
                "model": "gpt-4"
            },
            "follow_up_queries": [
                "When will it be shipped?",
                "Can I change the shipping address?"
            ],
            "follow_up_responses": [
                "The order is scheduled to ship within 24 hours. You'll receive a tracking number once it's shipped.",
                "Yes, you can change the shipping address if the order hasn't been shipped yet. Please contact customer support for assistance."
            ],
            "follow_up_context": {
                "order_status": "processing",
                "can_modify": True
            },
            "query_rating": 9,
            "query_feedback": "Clear and specific query with order number",
            "response_rating": 8,
            "response_feedback": "Informative response with next steps",
            "endpoint_rating": 9,
            "endpoint_feedback": "Efficient data retrieval and processing"
        },
        {
            "tool": "Klaviyo",
            "intent": "Send Marketing Email",
            "query": "Create a promotional email for our summer sale",
            "response": "I'll help you create a promotional email for the summer sale. The email will include:\n1. Eye-catching summer-themed header\n2. Highlighted discount codes\n3. Featured products\n4. Clear call-to-action buttons\n\nWould you like me to proceed with generating the email content?",
            "systems": ["Klaviyo", "Shopify"],
            "workflow": ["Create email template", "Add promotional content", "Set up automation"],
            "execution_details": {
                "campaign_type": "promotional",
                "theme": "summer_sale",
                "automation": True
            },
            "metadata": {
                "generation_date": datetime.now().isoformat(),
                "model": "gpt-4"
            },
            "follow_up_queries": [
                "Can you show me some template options?",
                "What's the best time to send this email?"
            ],
            "follow_up_responses": [
                "Here are three template options optimized for summer sales...",
                "Based on your audience's engagement patterns, the optimal time would be..."
            ],
            "follow_up_context": {
                "campaign_ready": False,
                "template_options": ["summer_vibes", "beach_party", "sunny_discounts"]
            },
            "query_rating": 8,
            "query_feedback": "Good intent but could be more specific about target audience",
            "response_rating": 9,
            "response_feedback": "Comprehensive response with clear structure",
            "endpoint_rating": 8,
            "endpoint_feedback": "Good integration with multiple systems"
        }
    ]
    
    return training_examples

def insert_training_data(data):
    try:
        # Insert the data into Supabase
        result = supabase.table("training_data").insert(data).execute()
        print(f"Successfully inserted {len(data)} training examples")
        return result
    except Exception as e:
        print(f"Error inserting training data: {str(e)}")
        return None

if __name__ == "__main__":
    # Generate test data
    test_data = generate_test_data()
    
    # Insert the data
    result = insert_training_data(test_data)
    
    if result:
        print("Training data generation and insertion completed successfully!")
    else:
        print("Failed to insert training data.") 