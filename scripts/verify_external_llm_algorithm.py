import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def verify_algorithm_config():
    """Verify the current external LLM algorithm configuration."""
    try:
        # Get the active algorithm
        result = supabase.table("external_llm_algorithm").select("*").eq("is_active", True).execute()
        
        if not result.data:
            print("No active algorithm found")
            return
        
        algorithm = result.data[0]
        print("\nCurrent Algorithm Configuration:")
        print(f"Name: {algorithm['name']}")
        print(f"Version: {algorithm['version']}")
        print(f"Model: {algorithm['llm_model']}")
        print(f"Description: {algorithm['description']}")
        
        # Print rate limiting parameters
        parameters = algorithm.get('parameters', {})
        rate_limit = parameters.get('rate_limit', {})
        print("\nRate Limiting Parameters:")
        print(f"Batch Size: {rate_limit.get('batch_size', 'Not set')}")
        print(f"Batch Delay (seconds): {rate_limit.get('batch_delay_seconds', 'Not set')}")
        print(f"Total Count: {parameters.get('count', 'Not set')}")
        print(f"Requests per Minute: {rate_limit.get('requests_per_minute', 'Not set')}")
        print(f"Requests per Day: {rate_limit.get('requests_per_day', 'Not set')}")
        
    except Exception as e:
        print(f"Error verifying algorithm configuration: {str(e)}")

if __name__ == "__main__":
    verify_algorithm_config() 