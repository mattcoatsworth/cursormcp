import os
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_key():
    """Verify Supabase API key format"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get Supabase credentials
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        
        logger.info(f"Supabase URL: {supabase_url}")
        
        # Safely print first few characters of key
        if len(supabase_key) > 8:
            logger.info(f"Key starts with: {supabase_key[:8]}...")
            logger.info(f"Key length: {len(supabase_key)} characters")
        else:
            logger.error("Key is too short - should be a long string")
            
        # Check if key starts with expected format
        if not supabase_key.startswith("eyJ"):
            logger.warning("Key does not start with expected 'eyJ' prefix")
        
        # Check for common issues
        if " " in supabase_key:
            logger.warning("Key contains spaces - this may cause issues")
        if "\n" in supabase_key:
            logger.warning("Key contains newlines - this may cause issues")
            
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        raise

if __name__ == "__main__":
    verify_key() 