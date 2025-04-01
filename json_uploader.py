#!/usr/bin/env python3

import os
import sys
import json
import requests
import time
from datetime import datetime

# Configure Supabase credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Supabase API headers
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def upload_from_json(file_path):
    """
    Upload training data from a JSON file to Supabase
    
    Args:
        file_path (str): Path to the JSON file containing training data
    """
    print(f"\n{'=' * 60}")
    print(f"📂 MCP Training Data Uploader")
    print(f"{'=' * 60}")
    print(f"• Loading data from: {file_path}")
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: File not found: {file_path}")
        return
    except json.JSONDecodeError:
        print(f"❌ Error: Invalid JSON format in file: {file_path}")
        return

    total = len(data)
    print(f"• Found {total} records to upload")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.")
        return
    
    # Optional confirmation
    confirm = input(f"\nReady to upload {total} records to Supabase. Continue? [y/N]: ").lower()
    if confirm != 'y' and confirm != 'yes':
        print("❌ Upload cancelled.")
        return
    
    print(f"\n🔄 Uploading data to Supabase...")
    success = 0
    failed = 0
    
    # Progress bar setup
    bar_length = 40
    
    for i, item in enumerate(data, 1):
        # Update progress bar
        progress = i / total
        block = int(round(bar_length * progress))
        progress_text = f"[{'#' * block}{'-' * (bar_length - block)}] {i}/{total} ({progress:.1%})"
        print(f"\r{progress_text}", end="")
        
        # Create payload
        try:
            payload = {
                "tool": item["tool"],
                "intent": item["intent"],
                "query": item["query"],
                "response": item["response"],
                "metadata": item.get("metadata", {})  # Optional, fallback to empty dict
            }
            
            # Add timestamp if not present
            if "metadata" in payload and "generation_date" not in payload["metadata"]:
                payload["metadata"]["generation_date"] = datetime.now().isoformat()
                
            # Add model if not present
            if "metadata" in payload and "model" not in payload["metadata"]:
                payload["metadata"]["model"] = "imported"
            
            # Insert into Supabase
            r = requests.post(f"{SUPABASE_URL}/rest/v1/training_data", headers=HEADERS, json=payload)
            
            if r.status_code in [200, 201]:
                success += 1
            else:
                failed += 1
                # Print error but don't break the progress bar
                print(f"\n❌ Failed to upload item {i}: {r.status_code} - {r.text}")
                
            # Add a small delay to avoid rate limiting
            time.sleep(0.1)
                
        except Exception as e:
            failed += 1
            print(f"\n❌ Error processing item {i}: {str(e)}")
    
    # Complete progress bar and add newline
    print("\n")
    
    print(f"\n{'=' * 60}")
    print(f"✅ Upload Complete!")
    print(f"{'=' * 60}")
    print(f"• Total processed: {total}")
    print(f"• Successfully uploaded: {success}")
    if failed > 0:
        print(f"• Failed uploads: {failed}")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # If filename provided as command line argument
        file_path = sys.argv[1]
    else:
        # Ask for the filename
        file_path = input("Enter the path to your .json backup file: ")
    
    upload_from_json(file_path)