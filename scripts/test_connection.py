#!/usr/bin/env python3
"""
Simple script to test Supabase connection
"""

import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_connection():
    """Test Supabase connection"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get Supabase credentials
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        
        logger.info(f"Connecting to Supabase at {supabase_url}")
        
        # Create Supabase client with the correct key format
        supabase = create_client(
            supabase_url=supabase_url,
            supabase_key=supabase_key
        )
        
        # Try to query the user_data table
        logger.info("Testing connection by querying user_data table...")
        result = supabase.table("user_data").select("count").execute()
        
        logger.info("Connection successful!")
        logger.info(f"Result: {result}")
        
    except Exception as e:
        logger.error(f"Connection failed: {e}")
        raise

if __name__ == "__main__":
    test_connection() 