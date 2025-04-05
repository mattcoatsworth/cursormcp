"""
Test script to verify Supabase and Together AI connections
"""
import os
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv

def test_connections():
    # Load environment variables
    load_dotenv()
    
    print("Testing connections...")
    print("=====================")
    
    # Test Supabase connection
    print("\nTesting Supabase connection:")
    try:
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials not found in .env file")
            
        supabase = create_client(supabase_url, supabase_key)
        
        # Try to get count from training_data table
        result = supabase.table('training_data').select('*', count='exact').execute()
        count = result.count if hasattr(result, 'count') else 0
        
        print("[SUCCESS] Successfully connected to Supabase")
        print(f"[SUCCESS] Found {count} records in training_data table")
        
    except Exception as e:
        print(f"[ERROR] Supabase connection failed: {str(e)}")
        
    # Test Together AI connection
    print("\nTesting Together AI connection:")
    try:
        together_api_key = os.getenv('TOGETHER_API_KEY')
        
        if not together_api_key:
            raise ValueError("Together AI API key not found in .env file")
            
        client = OpenAI(
            api_key=together_api_key,
            base_url="https://api.together.xyz/v1"
        )
        
        # Try a simple completion
        response = client.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello!"}
            ],
            max_tokens=10
        )
        
        print("[SUCCESS] Successfully connected to Together AI")
        print(f"[SUCCESS] Model response: {response.choices[0].message.content}")
        
    except Exception as e:
        print(f"[ERROR] Together AI connection failed: {str(e)}")
        
    print("\n=====================")

if __name__ == "__main__":
    test_connections()
