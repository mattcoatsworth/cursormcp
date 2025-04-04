import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def setup_llm_algorithm():
    """Set up the external LLM algorithm in Supabase."""
    try:
        # First, get the current highest version
        result = supabase.table("external_llm_algorithm").select("version").order("version", desc=True).limit(1).execute()
        
        if result.data:
            current_version = result.data[0].get("version", "1.0.0")
            # Split version into major.minor.patch
            major, minor, patch = map(int, current_version.split("."))
            # Increment patch version
            new_version = f"{major}.{minor}.{patch + 1}"
        else:
            new_version = "1.0.0"
        
        # Deactivate any existing active algorithms
        supabase.table("external_llm_algorithm").update({"is_active": False}).eq("is_active", True).execute()
        
        # Create new algorithm entry
        algorithm_data = {
            "name": "External LLM Training Data Generator",
            "description": "Algorithm using GPT-4o-mini to generate high-quality training data with efficient rate limiting",
            "version": new_version,
            "llm_provider": "openai",
            "llm_model": "gpt-4o-mini",
            "prompt_template": """
            Generate high-quality training examples for a customer service AI system.
            Each example should include:
            1. A tool (e.g., Shopify, Klaviyo, Warehouse)
            2. An intent (e.g., Check Order Status, Process Return)
            3. A realistic user query
            4. A detailed, helpful response
            5. Relevant systems involved
            6. A workflow for handling the request
            7. Execution details
            8. Follow-up queries and responses
            9. Context information
            """,
            "parameters": {
                "temperature": 0.7,
                "max_tokens": 2000,
                "count": 14,  # Number of examples to generate total
                "rate_limit": {
                    "requests_per_minute": 400,  # Stay under 500 RPM limit
                    "requests_per_day": 9000,    # Stay under 10,000 RPD limit
                    "batch_size": 7,             # Number of examples to process in each batch
                    "batch_delay_seconds": 2     # 2-second delay between batches
                }
            },
            "is_active": True
        }
        
        # Insert the algorithm
        result = supabase.table("external_llm_algorithm").insert(algorithm_data).execute()
        print("Successfully set up external LLM algorithm")
        
        # Verify the algorithm was inserted correctly
        verify_result = supabase.table("external_llm_algorithm").select("*").eq("is_active", True).execute()
        if verify_result.data:
            print(f"Active algorithm: {verify_result.data[0]['name']} v{verify_result.data[0]['version']}")
        else:
            print("Failed to verify algorithm setup")
    
    except Exception as e:
        print(f"Error setting up external LLM algorithm: {str(e)}")

if __name__ == "__main__":
    setup_llm_algorithm() 