import os
from dotenv import load_dotenv
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Get or create a Supabase client instance."""
    load_dotenv()
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials are not configured.")
    
    return create_client(supabase_url, supabase_key)

def remove_zoom_endpoints() -> None:
    """Remove all Zoom endpoints from the api_endpoints table."""
    try:
        print("\n=== Removing Zoom Endpoints ===\n")
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Delete all Zoom endpoints
        result = supabase.table('api_endpoints').delete().eq('service', 'Zoom').execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"❌ Error removing Zoom endpoints: {result.error}")
        else:
            print("✅ Successfully removed all Zoom endpoints")
        
        print("\n=== Zoom Endpoints Removal Complete ===\n")
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print("\n=== Endpoint Removal Failed ===\n")

if __name__ == "__main__":
    remove_zoom_endpoints() 