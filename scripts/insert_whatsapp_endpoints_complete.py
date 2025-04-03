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
        },
        {
            "service": "whatsapp",
            "resource": "messages",
            "action": "send_video",
            "method": "POST",
            "path": "/messages/video",
            "parameters": {
                "to": "string",
                "video_url": "string",
                "caption": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/minute"
        },
        {
            "service": "whatsapp",
            "resource": "messages",
            "action": "send_location",
            "method": "POST",
            "path": "/messages/location",
            "parameters": {
                "to": "string",
                "latitude": "number",
                "longitude": "number",
                "name": "string",
                "address": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/minute"
        },
        {
            "service": "whatsapp",
            "resource": "messages",
            "action": "send_contact",
            "method": "POST",
            "path": "/messages/contact",
            "parameters": {
                "to": "string",
                "contacts": "array"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/minute"
        },
        {
            "service": "whatsapp",
            "resource": "messages",
            "action": "send_interactive",
            "method": "POST",
            "path": "/messages/interactive",
            "parameters": {
                "to": "string",
                "type": "string",
                "action": "object",
                "body": "object",
                "footer": "object",
                "header": "object"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/minute"
        },
        {
            "service": "whatsapp",
            "resource": "messages",
            "action": "mark_as_read",
            "method": "POST",
            "path": "/messages/read",
            "parameters": {
                "message_id": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/minute"
        },
        
        # Media Endpoints
        {
            "service": "whatsapp",
            "resource": "media",
            "action": "upload_media",
            "method": "POST",
            "path": "/media",
            "parameters": {
                "file": "file",
                "type": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/day"
        },
        {
            "service": "whatsapp",
            "resource": "media",
            "action": "get_media",
            "method": "GET",
            "path": "/media/{media_id}",
            "parameters": {
                "media_id": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/day"
        },
        {
            "service": "whatsapp",
            "resource": "media",
            "action": "delete_media",
            "method": "DELETE",
            "path": "/media/{media_id}",
            "parameters": {
                "media_id": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "100/day"
        },
        
        # Template Endpoints
        {
            "service": "whatsapp",
            "resource": "templates",
            "action": "list_templates",
            "method": "GET",
            "path": "/templates",
            "parameters": {},
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "50/day"
        },
        {
            "service": "whatsapp",
            "resource": "templates",
            "action": "create_template",
            "method": "POST",
            "path": "/templates",
            "parameters": {
                "name": "string",
                "language": "string",
                "category": "string",
                "components": "array"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "50/day"
        },
        
        # Business Profile Endpoints
        {
            "service": "whatsapp",
            "resource": "business_profile",
            "action": "get_profile",
            "method": "GET",
            "path": "/business_profile",
            "parameters": {},
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "50/day"
        },
        {
            "service": "whatsapp",
            "resource": "business_profile",
            "action": "update_profile",
            "method": "POST",
            "path": "/business_profile",
            "parameters": {
                "profile": "object"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "50/day"
        },
        
        # Phone Number Endpoints
        {
            "service": "whatsapp",
            "resource": "phone_numbers",
            "action": "list_numbers",
            "method": "GET",
            "path": "/phone_numbers",
            "parameters": {},
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "50/day"
        },
        {
            "service": "whatsapp",
            "resource": "phone_numbers",
            "action": "get_number",
            "method": "GET",
            "path": "/phone_numbers/{phone_number_id}",
            "parameters": {
                "phone_number_id": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "50/day"
        },
        {
            "service": "whatsapp",
            "resource": "phone_numbers",
            "action": "request_verification",
            "method": "POST",
            "path": "/phone_numbers/request_verification",
            "parameters": {
                "phone_number": "string",
                "code_method": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "50/day"
        },
        {
            "service": "whatsapp",
            "resource": "phone_numbers",
            "action": "verify_code",
            "method": "POST",
            "path": "/phone_numbers/verify_code",
            "parameters": {
                "phone_number": "string",
                "code": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "50/day"
        },
        
        # Webhook Endpoints
        {
            "service": "whatsapp",
            "resource": "webhooks",
            "action": "get_webhook",
            "method": "GET",
            "path": "/webhooks",
            "parameters": {},
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "50/day"
        },
        {
            "service": "whatsapp",
            "resource": "webhooks",
            "action": "subscribe_webhook",
            "method": "POST",
            "path": "/webhooks",
            "parameters": {
                "url": "string",
                "verify_token": "string"
            },
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "50/day"
        },
        {
            "service": "whatsapp",
            "resource": "webhooks",
            "action": "unsubscribe_webhook",
            "method": "DELETE",
            "path": "/webhooks",
            "parameters": {},
            "auth_type": "bearer",
            "auth_key": "whatsapp_api_key",
            "rate_limit": "50/day"
        }
    ]
    
    try:
        # First, get existing WhatsApp endpoints
        logger.info("Checking existing WhatsApp endpoints...")
        result = supabase.table("api_endpoints").select("service,resource,action").eq("service", "whatsapp").execute()
        
        # Create a set of existing endpoint keys
        existing_endpoints = set()
        for endpoint in result.data:
            key = (endpoint["service"], endpoint["resource"], endpoint["action"])
            existing_endpoints.add(key)
        
        # Filter out endpoints that already exist
        new_endpoints = []
        for endpoint in endpoints:
            key = (endpoint["service"], endpoint["resource"], endpoint["action"])
            if key not in existing_endpoints:
                new_endpoints.append(endpoint)
        
        logger.info(f"Found {len(existing_endpoints)} existing endpoints and {len(new_endpoints)} new endpoints to add")
        
        if not new_endpoints:
            logger.info("No new endpoints to add")
            return
        
        # Insert new endpoints in batches
        batch_size = 10
        for i in range(0, len(new_endpoints), batch_size):
            batch = new_endpoints[i:i+batch_size]
            logger.info(f"Inserting batch {i//batch_size + 1} of {(len(new_endpoints) + batch_size - 1)//batch_size}...")
            result = supabase.table("api_endpoints").insert(batch).execute()
            logger.info(f"Inserted {len(batch)} endpoints successfully")
        
        logger.info("All new WhatsApp endpoints inserted successfully")
        
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