import os
from dotenv import load_dotenv
import requests
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_rest():
    """Test Supabase REST API directly"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get Supabase credentials
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        
        # Remove any trailing slashes from URL
        supabase_url = supabase_url.rstrip('/')
        
        # Set up headers
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}'
        }
        
        # Test endpoint
        endpoint = f"{supabase_url}/rest/v1/user_data?select=count"
        logger.info(f"Testing REST API at: {endpoint}")
        
        # Make request
        response = requests.get(endpoint, headers=headers)
        
        # Log response details
        logger.info(f"Status code: {response.status_code}")
        logger.info(f"Response headers: {dict(response.headers)}")
        logger.info(f"Response body: {response.text}")
        
        # Check if successful
        response.raise_for_status()
        logger.info("REST API test successful!")
        
    except requests.exceptions.RequestException as e:
        logger.error(f"REST API test failed: {e}")
        if hasattr(e, 'response'):
            logger.error(f"Response status: {e.response.status_code}")
            logger.error(f"Response body: {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"Test failed: {e}")
        raise

if __name__ == "__main__":
    test_rest() 