#!/usr/bin/env python3
"""
Monitor training data generation progress.
This script connects to Supabase and displays statistics about the training data.
"""

import os
import sys
import time
from datetime import datetime, timedelta
from tabulate import tabulate
from supabase import create_client, Client

def connect_to_supabase() -> Client:
    """Connect to Supabase using environment variables"""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
        
    return create_client(supabase_url, supabase_key)

def get_training_stats(supabase: Client):
    """Get training data statistics from Supabase"""
    try:
        # Get total count
        result = supabase.table('training_data').select('*', count='exact').execute()
        total_count = result.count if result.count is not None else 0
        
        # Get counts by tool
        tools_result = supabase.table('training_data').select('tool').execute()
        tool_counts = {}
        for record in tools_result.data:
            tool = record['tool']
            tool_counts[tool] = tool_counts.get(tool, 0) + 1
            
        # Get counts by intent
        intents_result = supabase.table('training_data').select('intent').execute()
        intent_counts = {}
        for record in intents_result.data:
            intent = record['intent']
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
            
        # Get recent additions (last 24 hours)
        one_day_ago = (datetime.now() - timedelta(days=1)).isoformat()
        recent_result = supabase.table('training_data').select('*', count='exact').gte('created_at', one_day_ago).execute()
        recent_count = recent_result.count if recent_result.count is not None else 0
        
        return {
            'total_count': total_count,
            'tool_counts': tool_counts,
            'intent_counts': intent_counts,
            'recent_count': recent_count
        }
        
    except Exception as e:
        print(f"Error getting statistics: {str(e)}")
        return None

def display_stats(stats):
    """Display training data statistics in a formatted table"""
    if not stats:
        print("No statistics available")
        return
        
    # Prepare data for display
    tool_rows = [[tool, count] for tool, count in stats['tool_counts'].items()]
    intent_rows = [[intent, count] for intent, count in stats['intent_counts'].items()]
    
    print("\nTraining Data Statistics")
    print("=" * 50)
    print(f"Total Records: {stats['total_count']}")
    print(f"Records Added in Last 24 Hours: {stats['recent_count']}")
    
    print("\nRecords by Tool")
    print(tabulate(tool_rows, headers=['Tool', 'Count'], tablefmt='grid'))
    
    print("\nRecords by Intent")
    print(tabulate(intent_rows, headers=['Intent', 'Count'], tablefmt='grid'))

def main():
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Get and display statistics
        stats = get_training_stats(supabase)
        display_stats(stats)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
        
    return 0

if __name__ == "__main__":
    sys.exit(main())