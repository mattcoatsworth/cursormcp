#!/usr/bin/env python3
"""
Monitor training data generation progress.
This script connects to the database and displays statistics about the training data.
"""

import os
import sys
import time
import psycopg2
from datetime import datetime, timedelta
from tabulate import tabulate

def connect_to_db():
    """Connect to the database using DATABASE_URL environment variable"""
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set")
    return psycopg2.connect(db_url)

def get_training_data_stats(conn):
    """Get statistics about the training data"""
    with conn.cursor() as cur:
        # Check if table exists
        cur.execute("SELECT to_regclass('public.training_data')")
        if not cur.fetchone()[0]:
            return None
        
        # Get total count
        cur.execute("SELECT COUNT(*) FROM training_data")
        total_count = cur.fetchone()[0]
        
        # Get count by tool
        cur.execute("""
            SELECT tool, COUNT(*) 
            FROM training_data 
            WHERE tool IS NOT NULL 
            GROUP BY tool 
            ORDER BY COUNT(*) DESC
        """)
        tool_counts = cur.fetchall()
        
        # Get count of multi-service examples
        cur.execute("SELECT COUNT(*) FROM training_data WHERE is_multi_service = TRUE")
        multi_service_count = cur.fetchone()[0]
        
        # Get examples created in the last hour
        cur.execute("""
            SELECT COUNT(*) 
            FROM training_data 
            WHERE created_at > %s
        """, (datetime.now() - timedelta(hours=1),))
        recent_count = cur.fetchone()[0]
        
        # Get examples created today
        cur.execute("""
            SELECT COUNT(*) 
            FROM training_data 
            WHERE DATE(created_at) = CURRENT_DATE
        """)
        today_count = cur.fetchone()[0]
        
        # Get top 5 intents
        cur.execute("""
            SELECT intent, COUNT(*) 
            FROM training_data 
            WHERE intent IS NOT NULL 
            GROUP BY intent 
            ORDER BY COUNT(*) DESC 
            LIMIT 5
        """)
        top_intents = cur.fetchall()
        
        # Get creation rate per hour for the last 24 hours
        cur.execute("""
            SELECT 
                DATE_TRUNC('hour', created_at) AS hour, 
                COUNT(*) 
            FROM training_data 
            WHERE created_at > %s
            GROUP BY hour 
            ORDER BY hour DESC
        """, (datetime.now() - timedelta(hours=24),))
        hourly_rates = cur.fetchall()
        
        return {
            "total_count": total_count,
            "tool_counts": tool_counts,
            "multi_service_count": multi_service_count,
            "recent_count": recent_count,
            "today_count": today_count,
            "top_intents": top_intents,
            "hourly_rates": hourly_rates
        }

def print_stats(stats):
    """Print statistics in a readable format"""
    if not stats:
        print("Training data table does not exist yet.")
        return
    
    print("\n========== TRAINING DATA STATISTICS ==========")
    print(f"Total examples: {stats['total_count']}")
    print(f"Multi-service examples: {stats['multi_service_count']} ({stats['multi_service_count']/stats['total_count']*100:.1f}%)")
    print(f"Examples added in the last hour: {stats['recent_count']}")
    print(f"Examples added today: {stats['today_count']}")
    
    print("\n--- TOOLS BREAKDOWN ---")
    tool_table = [[tool, count, f"{count/stats['total_count']*100:.1f}%"] for tool, count in stats['tool_counts']]
    print(tabulate(tool_table, headers=["Tool", "Count", "Percentage"], tablefmt="simple"))
    
    print("\n--- TOP 5 INTENTS ---")
    intent_table = [[intent, count, f"{count/stats['total_count']*100:.1f}%"] for intent, count in stats['top_intents']]
    print(tabulate(intent_table, headers=["Intent", "Count", "Percentage"], tablefmt="simple"))
    
    if stats['hourly_rates']:
        print("\n--- RECENT GENERATION RATES ---")
        hourly_table = [[hour.strftime("%Y-%m-%d %H:00"), count, f"{count/60:.1f}/min"] for hour, count in stats['hourly_rates']]
        print(tabulate(hourly_table, headers=["Hour", "Count", "Rate"], tablefmt="simple"))
    
    print("\n--- GENERATION PROJECTIONS ---")
    if stats['recent_count'] > 0:
        rate_per_hour = stats['recent_count']
        print(f"Current rate: ~{rate_per_hour} examples per hour")
        print(f"Projected time to 10,000 examples: {(10000-stats['total_count'])/rate_per_hour:.1f} hours")
        print(f"Projected time to 50,000 examples: {(50000-stats['total_count'])/rate_per_hour:.1f} hours")
        print(f"Projected time to 100,000 examples: {(100000-stats['total_count'])/rate_per_hour:.1f} hours")
    else:
        print("Not enough recent data to calculate projections.")
    
    print("==============================================\n")

def monitor(interval=60):
    """Monitor the training data statistics at regular intervals"""
    try:
        while True:
            conn = connect_to_db()
            stats = get_training_data_stats(conn)
            conn.close()
            
            # Clear screen
            os.system('cls' if os.name == 'nt' else 'clear')
            
            print_stats(stats)
            print(f"Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Refreshing in {interval} seconds... (Ctrl+C to exit)")
            
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\nMonitoring stopped.")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Install tabulate if needed
    try:
        import tabulate
    except ImportError:
        print("Installing required package: tabulate")
        os.system(f"{sys.executable} -m pip install tabulate")
        from tabulate import tabulate
    
    # Parse arguments
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        interval = int(sys.argv[1])
    else:
        interval = 60
    
    monitor(interval)