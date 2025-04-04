import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def store_python_path():
    """Store the Python path in Supabase."""
    try:
        # Get the Python path
        python_path = "C:\\Users\\matth\\AppData\\Local\\Programs\\Python\\Python313\\python.exe"
        
        # Create or update the system_config table
        result = supabase.table("system_config").upsert({
            "key": "python_path",
            "value": python_path,
            "description": "Path to Python executable",
            "updated_at": "now()"
        }).execute()
        
        print(f"Successfully stored Python path: {python_path}")
        
        # Verify the path was stored
        verify_result = supabase.table("system_config").select("*").eq("key", "python_path").execute()
        if verify_result.data:
            print(f"Verified stored path: {verify_result.data[0]['value']}")
        else:
            print("Failed to verify stored path")
    
    except Exception as e:
        print(f"Error storing Python path: {str(e)}")

if __name__ == "__main__":
    store_python_path() 