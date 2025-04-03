import os
import json
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("Missing Supabase credentials in .env file")
    return create_client(url, key)

def verify_google_workspace_endpoints(supabase: Client):
    """Verify Google Workspace endpoints in the table."""
    logger.info("Verifying Google Workspace endpoints...")
    
    try:
        # Get all Google Workspace endpoints
        result = supabase.table("api_endpoints").select("*").eq("service", "google_workspace").execute()
        
        if not result.data:
            logger.error("No Google Workspace endpoints found!")
            return
        
        # Group endpoints by resource
        resources = {}
        for endpoint in result.data:
            resource = endpoint["resource"]
            if resource not in resources:
                resources[resource] = []
            resources[resource].append(endpoint)
        
        # Print summary
        logger.info(f"\nFound {len(result.data)} Google Workspace endpoints:")
        for resource, endpoints in resources.items():
            logger.info(f"\n{resource.upper()} ({len(endpoints)} endpoints):")
            for endpoint in endpoints:
                logger.info(f"  - {endpoint['method']} {endpoint['path']}")
                logger.info(f"    Action: {endpoint['action']}")
                logger.info(f"    Parameters: {json.dumps(endpoint['parameters'], indent=2)}")
                logger.info(f"    Auth Type: {endpoint['auth_type']}")
                logger.info(f"    Rate Limit: {endpoint['rate_limit']}")
        
        logger.info("\nVerification completed successfully")
        
    except Exception as e:
        logger.error(f"Error verifying endpoints: {str(e)}")
        raise

def main():
    """Main function to verify endpoints."""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Verify Google Workspace endpoints
        verify_google_workspace_endpoints(supabase)
        
        logger.info("Process completed successfully")
        
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        raise

if __name__ == "__main__":
    main() 