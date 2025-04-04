import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# The training data generation algorithm
ALGORITHM = """
def generate_training_data():
    # Expanded tools and intents
    tools = [
        "Shopify", "Klaviyo", "Warehouse", "Customer Service",
        "Inventory", "Marketing", "Analytics", "CRM",
        "Email Service", "Social Media", "Payment Gateway",
        "Shipping", "Returns", "Loyalty Program"
    ]
    
    intents = [
        "Check Order Status", "Update Customer Information",
        "Process Return", "Check Inventory", "Send Marketing Email",
        "Generate Report", "Update Product", "Process Payment",
        "Track Shipment", "Create Campaign", "Analyze Performance",
        "Update Pricing", "Manage Inventory", "Handle Complaint",
        "Process Refund", "Create Discount", "Update Settings",
        "Generate Analytics", "Send Notification", "Update Profile"
    ]

    # Generate 25 diverse training examples
    training_examples = [
        # Order Management Examples
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
            }
        },
        {
            "tool": "Shipping",
            "intent": "Track Shipment",
            "query": "Where is my package with tracking number TRK789?",
            "response": "Package TRK789 is currently in transit and was last scanned at the regional distribution center. Expected delivery is tomorrow by 5 PM.",
            "systems": ["Shipping", "Warehouse"],
            "workflow": ["Track package", "Check location", "Provide ETA"],
            "execution_details": {
                "tracking_number": "TRK789",
                "current_location": "Regional Distribution Center",
                "estimated_delivery": "Tomorrow by 5 PM"
            },
            "follow_up_queries": [
                "Can I change the delivery address?",
                "What happens if I'm not home?"
            ],
            "follow_up_responses": [
                "You can request a delivery address change through our shipping portal.",
                "The carrier will leave a notice and attempt redelivery the next business day."
            ],
            "follow_up_context": {
                "in_transit": True,
                "delivery_attempts": 1
            }
        },
        # Marketing Examples
        {
            "tool": "Klaviyo",
            "intent": "Create Campaign",
            "query": "Set up a welcome email series for new subscribers",
            "response": "I'll help you create a 3-email welcome series:\\n1. Welcome email with discount\\n2. Product showcase\\n3. Social proof and CTA\\n\\nWould you like to customize the content?",
            "systems": ["Klaviyo", "Marketing"],
            "workflow": ["Create campaign", "Design emails", "Set up automation"],
            "execution_details": {
                "campaign_type": "welcome_series",
                "email_count": 3,
                "automation": True
            },
            "follow_up_queries": [
                "What should the discount be?",
                "Can we add product recommendations?"
            ],
            "follow_up_responses": [
                "A 10% discount is standard for welcome emails, but we can adjust this.",
                "Yes, we can add personalized product recommendations based on their interests."
            ],
            "follow_up_context": {
                "campaign_ready": False,
                "personalization_enabled": True
            }
        },
        {
            "tool": "Social Media",
            "intent": "Create Campaign",
            "query": "Launch a Facebook ad campaign for our new product",
            "response": "I'll help you set up a Facebook ad campaign targeting:\\n1. Lookalike audiences\\n2. Interest-based targeting\\n3. Retargeting website visitors\\n\\nWould you like to set the budget and schedule?",
            "systems": ["Social Media", "Marketing"],
            "workflow": ["Create ad set", "Define audience", "Set budget"],
            "execution_details": {
                "platform": "Facebook",
                "campaign_type": "product_launch",
                "targeting_methods": ["lookalike", "interest", "retargeting"]
            },
            "follow_up_queries": [
                "What's the recommended budget?",
                "How long should the campaign run?"
            ],
            "follow_up_responses": [
                "For optimal results, we recommend starting with $500-1000 per week.",
                "A 4-week campaign duration is ideal for gathering sufficient data."
            ],
            "follow_up_context": {
                "campaign_ready": False,
                "budget_set": False
            }
        },
        # Inventory Management Examples
        {
            "tool": "Inventory",
            "intent": "Check Inventory",
            "query": "What's the stock level for product SKU123?",
            "response": "Product SKU123 currently has 45 units in stock, with 15 units on order. The reorder point is 20 units.",
            "systems": ["Inventory", "Warehouse"],
            "workflow": ["Check stock", "Verify orders", "Check reorder point"],
            "execution_details": {
                "sku": "SKU123",
                "current_stock": 45,
                "on_order": 15,
                "reorder_point": 20
            },
            "follow_up_queries": [
                "When is the next shipment arriving?",
                "Should we place a new order?"
            ],
            "follow_up_responses": [
                "The next shipment is expected in 3 business days.",
                "Yes, we should place a new order as we're approaching the reorder point."
            ],
            "follow_up_context": {
                "stock_status": "healthy",
                "needs_reorder": False
            }
        },
        {
            "tool": "Warehouse",
            "intent": "Manage Inventory",
            "query": "Update stock levels after receiving shipment #SHIP456",
            "response": "I'll help you process shipment #SHIP456. Please provide the received quantities for each SKU.",
            "systems": ["Warehouse", "Inventory"],
            "workflow": ["Receive shipment", "Count items", "Update system"],
            "execution_details": {
                "shipment_id": "SHIP456",
                "status": "pending_receipt",
                "expected_items": ["SKU123", "SKU456", "SKU789"]
            },
            "follow_up_queries": [
                "How do I enter the quantities?",
                "What if there are discrepancies?"
            ],
            "follow_up_responses": [
                "You can enter quantities in the warehouse management system under 'Receive Shipment'.",
                "Please document any discrepancies and notify the purchasing department immediately."
            ],
            "follow_up_context": {
                "shipment_received": False,
                "verification_needed": True
            }
        },
        # Customer Service Examples
        {
            "tool": "Customer Service",
            "intent": "Handle Complaint",
            "query": "Customer #CUST789 is reporting a damaged product",
            "response": "I'll help you process the complaint for customer #CUST789. Please provide:\\n1. Order number\\n2. Product details\\n3. Photos of damage\\n\\nWould you like to initiate a return?",
            "systems": ["Customer Service", "Returns"],
            "workflow": ["Document complaint", "Verify details", "Process return"],
            "execution_details": {
                "customer_id": "CUST789",
                "issue_type": "damaged_product",
                "status": "pending_details"
            },
            "follow_up_queries": [
                "What's our return policy?",
                "Should we offer a replacement?"
            ],
            "follow_up_responses": [
                "Our return policy allows for free returns within 30 days of receipt.",
                "Yes, we can offer a replacement if the item is in stock."
            ],
            "follow_up_context": {
                "return_initiated": False,
                "replacement_available": True
            }
        },
        {
            "tool": "CRM",
            "intent": "Update Customer Information",
            "query": "Update contact details for customer #CUST123",
            "response": "I'll help you update the contact details for customer #CUST123. Please provide the new information.",
            "systems": ["CRM", "Customer Service"],
            "workflow": ["Verify customer", "Update details", "Confirm changes"],
            "execution_details": {
                "customer_id": "CUST123",
                "update_type": "contact_details",
                "verification_required": True
            },
            "follow_up_queries": [
                "What information needs verification?",
                "How do I confirm the changes?"
            ],
            "follow_up_responses": [
                "We need to verify the email address and phone number.",
                "Changes will be confirmed via email to the new address."
            ],
            "follow_up_context": {
                "updates_pending": True,
                "verification_sent": False
            }
        },
        # Analytics Examples
        {
            "tool": "Analytics",
            "intent": "Generate Report",
            "query": "Create a sales performance report for Q2 2024",
            "response": "I'll generate a comprehensive sales report including:\\n1. Revenue by product category\\n2. Sales trends\\n3. Customer acquisition metrics\\n4. Return on ad spend\\n\\nWould you like to customize the metrics?",
            "systems": ["Analytics", "Marketing"],
            "workflow": ["Gather data", "Process metrics", "Generate report"],
            "execution_details": {
                "report_type": "sales_performance",
                "period": "Q2 2024",
                "metrics": ["revenue", "trends", "acquisition", "roas"]
            },
            "follow_up_queries": [
                "Can we compare with Q1?",
                "What's the best format for presentation?"
            ],
            "follow_up_responses": [
                "Yes, I can add a quarter-over-quarter comparison.",
                "I recommend a PDF report with interactive charts for the presentation."
            ],
            "follow_up_context": {
                "report_ready": False,
                "comparison_enabled": True
            }
        },
        {
            "tool": "Marketing",
            "intent": "Analyze Performance",
            "query": "Analyze the performance of our recent email campaign",
            "response": "I'll analyze the campaign metrics including:\\n1. Open rates\\n2. Click-through rates\\n3. Conversion rates\\n4. Revenue generated\\n\\nWould you like to see the detailed breakdown?",
            "systems": ["Marketing", "Analytics"],
            "workflow": ["Pull metrics", "Analyze performance", "Generate insights"],
            "execution_details": {
                "analysis_type": "campaign_performance",
                "metrics": ["open_rate", "ctr", "conversion", "revenue"],
                "timeframe": "last_30_days"
            },
            "follow_up_queries": [
                "How does this compare to industry benchmarks?",
                "What recommendations do you have?"
            ],
            "follow_up_responses": [
                "Your open rates are 15% above industry average.",
                "I recommend A/B testing subject lines and optimizing send times."
            ],
            "follow_up_context": {
                "analysis_complete": True,
                "recommendations_ready": True
            }
        },
        # Payment and Refund Examples
        {
            "tool": "Payment Gateway",
            "intent": "Process Payment",
            "query": "Process a refund for order #ORD456",
            "response": "I'll help you process the refund for order #ORD456. Please confirm:\\n1. Refund amount\\n2. Reason for refund\\n3. Payment method to refund to",
            "systems": ["Payment Gateway", "Customer Service"],
            "workflow": ["Verify order", "Process refund", "Send confirmation"],
            "execution_details": {
                "order_id": "ORD456",
                "refund_type": "full_refund",
                "status": "pending_details"
            },
            "follow_up_queries": [
                "How long will the refund take?",
                "Should we notify the customer?"
            ],
            "follow_up_responses": [
                "Refunds typically process within 3-5 business days.",
                "Yes, I'll send an automated email notification once processed."
            ],
            "follow_up_context": {
                "refund_initiated": False,
                "notification_ready": True
            }
        },
        {
            "tool": "Loyalty Program",
            "intent": "Update Settings",
            "query": "Modify the points redemption rules",
            "response": "I'll help you update the loyalty program rules. Current settings:\\n1. 100 points = $1 discount\\n2. Minimum redemption: 500 points\\n3. Points expire after 12 months\\n\\nWhat changes would you like to make?",
            "systems": ["Loyalty Program", "CRM"],
            "workflow": ["Review current rules", "Apply changes", "Update system"],
            "execution_details": {
                "update_type": "redemption_rules",
                "current_settings": {
                    "points_to_dollars": 100,
                    "minimum_redemption": 500,
                    "expiry_period": 12
                }
            },
            "follow_up_queries": [
                "Can we add tiered rewards?",
                "Should we change the expiration period?"
            ],
            "follow_up_responses": [
                "Yes, we can implement bronze, silver, and gold tiers.",
                "We can adjust the expiration period based on tier level."
            ],
            "follow_up_context": {
                "changes_pending": True,
                "tier_system_available": True
            }
        },
        # Email Service Examples
        {
            "tool": "Email Service",
            "intent": "Send Notification",
            "query": "Send a shipping confirmation email for order #ORD789",
            "response": "I'll help you send a shipping confirmation email including:\\n1. Order details\\n2. Tracking information\\n3. Estimated delivery date\\n4. Return policy information\\n\\nWould you like to customize the template?",
            "systems": ["Email Service", "Shipping"],
            "workflow": ["Prepare email", "Add tracking", "Send notification"],
            "execution_details": {
                "order_id": "ORD789",
                "email_type": "shipping_confirmation",
                "template": "standard_shipping"
            },
            "follow_up_queries": [
                "Can we add product images?",
                "Should we include upsell offers?"
            ],
            "follow_up_responses": [
                "Yes, I can add product thumbnails to the email.",
                "We can include related product recommendations."
            ],
            "follow_up_context": {
                "email_ready": False,
                "personalization_enabled": True
            }
        },
        {
            "tool": "Returns",
            "intent": "Process Return",
            "query": "Initiate a return for order #ORD123",
            "response": "I'll help you process the return for order #ORD123. Please provide:\\n1. Reason for return\\n2. Items being returned\\n3. Preferred refund method\\n\\nWould you like to generate a return label?",
            "systems": ["Returns", "Customer Service"],
            "workflow": ["Create return", "Generate label", "Process refund"],
            "execution_details": {
                "order_id": "ORD123",
                "return_type": "standard_return",
                "status": "pending_details"
            },
            "follow_up_queries": [
                "What's the return window?",
                "Are there any restocking fees?"
            ],
            "follow_up_responses": [
                "Returns are accepted within 30 days of delivery.",
                "No restocking fees for standard returns."
            ],
            "follow_up_context": {
                "return_initiated": False,
                "label_ready": False
            }
        }
    ]
    return training_examples
"""

def setup_algorithm():
    """Set up the training data algorithm in Supabase."""
    try:
        # First, get the current highest version
        result = supabase.table("training_data_algorithm").select("version").order("version", desc=True).limit(1).execute()
        
        if result.data:
            current_version = result.data[0].get("version", "1.0.0")
            # Split version into major.minor.patch
            major, minor, patch = map(int, current_version.split("."))
            # Increment patch version
            new_version = f"{major}.{minor}.{patch + 1}"
        else:
            new_version = "1.0.0"
        
        # Deactivate any existing active algorithms
        supabase.table("training_data_algorithm").update({"is_active": False}).eq("is_active", True).execute()
        
        # Create new algorithm entry
        algorithm_data = {
            "name": "Training Data Generation Algorithm",
            "description": "Algorithm for generating high-quality training data with proper Python syntax",
            "version": new_version,
            "algorithm": ALGORITHM,
            "parameters": {},
            "is_active": True
        }
        
        # Insert the algorithm
        result = supabase.table("training_data_algorithm").insert(algorithm_data).execute()
        print("Successfully set up training data algorithm")
        
        # Verify the algorithm was inserted correctly
        verify_result = supabase.table("training_data_algorithm").select("*").eq("is_active", True).execute()
        if verify_result.data:
            print("\nVerification of inserted algorithm:")
            print(f"Name: {verify_result.data[0].get('name')}")
            print(f"Version: {verify_result.data[0].get('version')}")
            print(f"Is Active: {verify_result.data[0].get('is_active')}")
            print("\nAlgorithm code:")
            print(verify_result.data[0].get('algorithm'))
        else:
            print("Warning: Could not verify algorithm insertion")
        
        return True
    except Exception as e:
        print(f"Error setting up algorithm: {str(e)}")
        return False

if __name__ == "__main__":
    success = setup_algorithm()
    if success:
        print("Algorithm setup completed successfully!")
    else:
        print("Failed to set up algorithm") 