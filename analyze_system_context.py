#!/usr/bin/env python3
"""
Script to analyze system context entries and propose a categorization plan.
"""

import os
import json
from collections import defaultdict
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_to_supabase() -> Client:
    """Connect to Supabase using environment variables"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
        
    return create_client(supabase_url, supabase_key)

def analyze_system_context():
    """Analyze system context entries and propose categorization"""
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Get all entries from system_training
        result = supabase.table('system_training').select('*').execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"Error fetching system training data: {result.error}")
            return
            
        print("\n=== Current System Context Entries ===")
        for i, entry in enumerate(result.data, 1):
            print(f"\nEntry {i}:")
            print(f"Category: {entry['category']}")
            print(f"Name: {entry['name']}")
            print(f"Description: {entry['description']}")
            print("\nTags:", entry['tags'])
            print("-" * 80)
            
        print("\n=== Example of Current vs Proposed Format ===")
        print("\nCURRENT FORMAT:")
        print("""
Category: system
Name: System Guidelines
Description: System guidelines and training data for interpreting and responding to queries
Tags: ["system_context", "guidelines"]""")
        
        print("\nPROPOSED FORMAT:")
        print("""
Category: system_response
Name: System - Response Generation Guidelines
Description: Core guidelines for generating high-quality, consistent responses across all system interactions
Tags: ["system_context", "response_guidelines", "tone_standards"]""")
        
        print("\n=== Proposed Categories ===")
        print("\n1. warehouse_3pl")
        print("   - Fulfillment control")
        print("   - Inventory management")
        print("   - Status tracking")
        
        print("\n2. system_response")
        print("   - Response generation")
        print("   - Tone and style")
        print("   - Format standards")
        
        print("\n3. data_handling")
        print("   - Data validation")
        print("   - Data transformation")
        print("   - Error handling")
        
        print("\n4. api_integration")
        print("   - API authentication")
        print("   - Rate limiting")
        print("   - Response processing")
        
        print("\n5. error_handling")
        print("   - Error detection")
        print("   - Error reporting")
        print("   - Recovery procedures")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response: {e.response.text if hasattr(e.response, 'text') else e.response}")

def main():
    """Main function"""
    print("Analyzing system context entries...")
    analyze_system_context()
    print("\nAnalysis completed")

if __name__ == "__main__":
    main() 