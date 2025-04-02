#!/usr/bin/env python3
"""
Script to insert 3PL/WMS guidelines into the training data table.
"""

import os
import json
import requests
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_TABLE = 'training_data'

def connect_to_supabase() -> Client:
    """Connect to Supabase using environment variables"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
        
    return create_client(supabase_url, supabase_key)

def create_training_examples():
    """Create training examples for 3PL/WMS operations"""
    examples = [
        {
            "tool": "ShipStation",
            "intent": "Void Shipping Label",
            "query": "Stop order #7890 from shipping",
            "response": "I've voided the shipping label for order #7890 to prevent it from shipping.",
            "systems": ["ShipStation"],
            "workflow": ["Check Shopify order status", "Check shipping label", "Void label"],
            "execution_details": {
                "steps": [
                    "Checked Shopify order #7890 - unfulfilled",
                    "Found shipping label in ShipStation",
                    "Voided shipping label successfully"
                ],
                "status": "success"
            },
            "metadata": {
                "source": "guidelines",
                "type": "warehouse_3pl",
                "scenario": "void_shipping_label"
            }
        },
        {
            "tool": "ShipStation",
            "intent": "Pause Fulfillment",
            "query": "Stop order #4556 from shipping",
            "response": "I've paused order #4556 from shipping as it was still unfulfilled.",
            "systems": ["ShipStation"],
            "workflow": ["Check Shopify order status", "Check shipping batch", "Pause order"],
            "execution_details": {
                "steps": [
                    "Checked Shopify order #4556 - unfulfilled",
                    "No shipping label found",
                    "Paused order in shipping batch"
                ],
                "status": "success"
            },
            "metadata": {
                "source": "guidelines",
                "type": "warehouse_3pl",
                "scenario": "pause_fulfillment"
            }
        },
        {
            "tool": "ShipStation",
            "intent": "Remove from Batch",
            "query": "Stop order #1234 from shipping",
            "response": "I've removed order #1234 from the shipping batch as it was still unfulfilled.",
            "systems": ["ShipStation"],
            "workflow": ["Check Shopify order status", "Check shipping batch", "Remove order"],
            "execution_details": {
                "steps": [
                    "Checked Shopify order #1234 - unfulfilled",
                    "Found order in shipping batch",
                    "Removed from batch successfully"
                ],
                "status": "success"
            },
            "metadata": {
                "source": "guidelines",
                "type": "warehouse_3pl",
                "scenario": "remove_from_batch"
            }
        },
        {
            "tool": "ShipStation",
            "intent": "Check Shipping Status",
            "query": "Stop order #9999 from shipping",
            "response": "Unfortunately, order #9999 has already shipped and is arriving on March 28th.",
            "systems": ["ShipStation"],
            "workflow": ["Check Shopify order status", "Check shipping status"],
            "execution_details": {
                "steps": [
                    "Checked Shopify order #9999 - fulfilled",
                    "Order already shipped",
                    "No action needed"
                ],
                "status": "already_shipped"
            },
            "metadata": {
                "source": "guidelines",
                "type": "warehouse_3pl",
                "scenario": "already_shipped"
            }
        },
        {
            "tool": "ShipStation",
            "intent": "Check Inventory",
            "query": "Check warehouse inventory for SKU ABC123",
            "response": "SKU ABC123 has 150 units available in the main warehouse.",
            "systems": ["ShipStation"],
            "workflow": ["Check inventory levels", "Format response"],
            "execution_details": {
                "steps": [
                    "Checked inventory in ShipStation",
                    "Found SKU ABC123",
                    "Retrieved current stock level"
                ],
                "status": "success"
            },
            "metadata": {
                "source": "guidelines",
                "type": "warehouse_3pl",
                "scenario": "check_inventory"
            }
        },
        {
            "tool": "ShipStation",
            "intent": "Void Shipping Label",
            "query": "Void shipping label for order #4567",
            "response": "I've voided the shipping label for order #4567.",
            "systems": ["ShipStation"],
            "workflow": ["Check shipping label", "Void label"],
            "execution_details": {
                "steps": [
                    "Found shipping label in ShipStation",
                    "Voided label successfully",
                    "Updated order status"
                ],
                "status": "success"
            },
            "metadata": {
                "source": "guidelines",
                "type": "warehouse_3pl",
                "scenario": "void_shipping_label"
            }
        },
        {
            "tool": "ShipStation",
            "intent": "Remove from Batch",
            "query": "Remove order #7891 from shipping batch",
            "response": "I've removed order #7891 from the shipping batch.",
            "systems": ["ShipStation"],
            "workflow": ["Check shipping batch", "Remove order"],
            "execution_details": {
                "steps": [
                    "Located order in shipping batch",
                    "Removed from batch successfully",
                    "Updated order status"
                ],
                "status": "success"
            },
            "metadata": {
                "source": "guidelines",
                "type": "warehouse_3pl",
                "scenario": "remove_from_batch"
            }
        }
    ]
    return examples

def insert_training_data(examples):
    """Insert training examples into Supabase"""
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    success_count = 0
    for example in examples:
        data = {
            'tool': example['tool'],
            'intent': example['intent'],
            'query': example['query'],
            'response': example['response'],
            'systems': example['systems'],
            'workflow': example['workflow'],
            'execution_details': example['execution_details'],
            'metadata': example['metadata']
        }
        
        try:
            response = requests.post(
                f'{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}',
                headers=headers,
                json=data
            )
            if response.status_code in [200, 201]:
                success_count += 1
            else:
                print(f"Error inserting example: {response.text}")
        except Exception as e:
            print(f"Exception while inserting example: {str(e)}")
    
    return success_count

def main():
    """Main function to insert training data"""
    print("Creating 3PL/WMS training examples...")
    examples = create_training_examples()
    
    print(f"Inserting {len(examples)} examples into Supabase...")
    success_count = insert_training_data(examples)
    
    print(f"Successfully inserted {success_count} out of {len(examples)} examples")

if __name__ == "__main__":
    main() 