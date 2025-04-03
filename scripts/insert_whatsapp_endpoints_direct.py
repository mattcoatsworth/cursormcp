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

def insert_whatsapp_endpoints(supabase: Client):
    """Insert WhatsApp endpoints directly using the Supabase client."""
    logger.info("Inserting WhatsApp endpoints...")
    
    # Define the endpoints to insert
    endpoints = [
        # Messaging Endpoints
        {
            "service": "whatsapp",
            "resource": "messages",
            "action": "send_text",
            "method": "POST",
            "path": "/messages",
            "parameters": {
                "to": "string", 
                "text": "string", 
                "preview_url": "boolean"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/minute"
        },
        {
            "service": "whatsapp",
            "resource": "messages",
            "action": "send_template",
            "method": "POST",
            "path": "/messages/template",
            "parameters": {
                "to": "string", 
                "template_name": "string", 
                "language_code": "string", 
                "components": "array"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/minute"
        },
        {
            "service": "whatsapp",
            "resource": "messages",
            "action": "send_image",
            "method": "POST",
            "path": "/messages/image",
            "parameters": {
                "to": "string",
                "image_url": "string",
                "caption": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/minute"
        },
        {
            "service": "whatsapp",
            "resource": "messages",
            "action": "send_document",
            "method": "POST",
            "path": "/messages/document",
            "parameters": {
                "to": "string",
                "document_url": "string",
                "caption": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/minute"
        }
    ]
    
    try:
        # Insert endpoints in batches
        batch_size = 10
        for i in range(0, len(endpoints), batch_size):
            batch = endpoints[i:i+batch_size]
            logger.info(f"Inserting batch {i//batch_size + 1} of {(len(endpoints) + batch_size - 1)//batch_size}...")
            result = supabase.table("api_endpoints").insert(batch).execute()
            logger.info(f"Inserted {len(batch)} endpoints successfully")
        
        logger.info("All WhatsApp endpoints inserted successfully")
        
    except Exception as e:
        logger.error(f"Error inserting WhatsApp endpoints: {str(e)}")
        raise

def main():
    """Main function to insert WhatsApp endpoints."""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Insert WhatsApp endpoints
        insert_whatsapp_endpoints(supabase)
        
        logger.info("Process completed successfully")
        
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        raise

if __name__ == "__main__":
    main() 