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

def insert_google_workspace_endpoints(supabase: Client):
    """Insert Google Workspace MCP Server endpoints directly using the Supabase client."""
    logger.info("Inserting Google Workspace MCP Server endpoints...")
    
    # Define the endpoints to insert
    endpoints = [
        # Gmail Endpoints
        {
            "service": "google_workspace",
            "resource": "gmail",
            "action": "list_messages",
            "method": "GET",
            "path": "/gmail/messages",
            "parameters": {
                "maxResults": "number",
                "q": "string",
                "labelIds": "array"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "250/day"
        },
        {
            "service": "google_workspace",
            "resource": "gmail",
            "action": "get_message",
            "method": "GET",
            "path": "/gmail/messages/{messageId}",
            "parameters": {
                "messageId": "string",
                "format": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "250/day"
        },
        {
            "service": "google_workspace",
            "resource": "gmail",
            "action": "send_message",
            "method": "POST",
            "path": "/gmail/messages/send",
            "parameters": {
                "to": "string",
                "subject": "string",
                "body": "string",
                "attachments": "array"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "250/day"
        },
        {
            "service": "google_workspace",
            "resource": "gmail",
            "action": "list_labels",
            "method": "GET",
            "path": "/gmail/labels",
            "parameters": {},
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "250/day"
        },
        {
            "service": "google_workspace",
            "resource": "gmail",
            "action": "modify_message",
            "method": "POST",
            "path": "/gmail/messages/{messageId}/modify",
            "parameters": {
                "messageId": "string",
                "addLabelIds": "array",
                "removeLabelIds": "array"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "250/day"
        },
        {
            "service": "google_workspace",
            "resource": "gmail",
            "action": "trash_message",
            "method": "POST",
            "path": "/gmail/messages/{messageId}/trash",
            "parameters": {
                "messageId": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "250/day"
        },
        {
            "service": "google_workspace",
            "resource": "gmail",
            "action": "untrash_message",
            "method": "POST",
            "path": "/gmail/messages/{messageId}/untrash",
            "parameters": {
                "messageId": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "250/day"
        },
        {
            "service": "google_workspace",
            "resource": "gmail",
            "action": "create_draft",
            "method": "POST",
            "path": "/gmail/drafts",
            "parameters": {
                "to": "string",
                "subject": "string",
                "body": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "250/day"
        },
        
        # Drive Endpoints
        {
            "service": "google_workspace",
            "resource": "drive",
            "action": "list_files",
            "method": "GET",
            "path": "/drive/files",
            "parameters": {
                "q": "string",
                "pageSize": "number",
                "pageToken": "string",
                "fields": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "1000/day"
        },
        {
            "service": "google_workspace",
            "resource": "drive",
            "action": "get_file",
            "method": "GET",
            "path": "/drive/files/{fileId}",
            "parameters": {
                "fileId": "string",
                "fields": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "1000/day"
        },
        {
            "service": "google_workspace",
            "resource": "drive",
            "action": "create_folder",
            "method": "POST",
            "path": "/drive/folders",
            "parameters": {
                "name": "string",
                "parentId": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "1000/day"
        },
        {
            "service": "google_workspace",
            "resource": "drive",
            "action": "upload_file",
            "method": "POST",
            "path": "/drive/files/upload",
            "parameters": {
                "name": "string",
                "mimeType": "string",
                "parentId": "string",
                "file": "file"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "1000/day"
        },
        
        # Docs Endpoints
        {
            "service": "google_workspace",
            "resource": "docs",
            "action": "get_document",
            "method": "GET",
            "path": "/docs/{documentId}",
            "parameters": {
                "documentId": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "300/day"
        },
        {
            "service": "google_workspace",
            "resource": "docs",
            "action": "create_document",
            "method": "POST",
            "path": "/docs",
            "parameters": {
                "title": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "300/day"
        },
        {
            "service": "google_workspace",
            "resource": "docs",
            "action": "append_text",
            "method": "POST",
            "path": "/docs/{documentId}/append",
            "parameters": {
                "documentId": "string",
                "text": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "300/day"
        },
        
        # Sheets Endpoints
        {
            "service": "google_workspace",
            "resource": "sheets",
            "action": "get_values",
            "method": "GET",
            "path": "/sheets/{spreadsheetId}/values/{range}",
            "parameters": {
                "spreadsheetId": "string",
                "range": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "500/day"
        },
        {
            "service": "google_workspace",
            "resource": "sheets",
            "action": "update_values",
            "method": "PUT",
            "path": "/sheets/{spreadsheetId}/values/{range}",
            "parameters": {
                "spreadsheetId": "string",
                "range": "string",
                "values": "array"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "500/day"
        },
        {
            "service": "google_workspace",
            "resource": "sheets",
            "action": "create_spreadsheet",
            "method": "POST",
            "path": "/sheets",
            "parameters": {
                "title": "string",
                "sheets": "array"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "500/day"
        },
        
        # Slides Endpoints
        {
            "service": "google_workspace",
            "resource": "slides",
            "action": "create_presentation",
            "method": "POST",
            "path": "/slides",
            "parameters": {
                "title": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "300/day"
        },
        {
            "service": "google_workspace",
            "resource": "slides",
            "action": "get_presentation",
            "method": "GET",
            "path": "/slides/{presentationId}",
            "parameters": {
                "presentationId": "string"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "300/day"
        },
        {
            "service": "google_workspace",
            "resource": "slides",
            "action": "create_slide",
            "method": "POST",
            "path": "/slides/{presentationId}/slides",
            "parameters": {
                "presentationId": "string",
                "layout": "string",
                "content": "object"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "300/day"
        },
        
        # Calendar Endpoints
        {
            "service": "google_workspace",
            "resource": "calendar",
            "action": "list_events",
            "method": "GET",
            "path": "/calendar/events",
            "parameters": {
                "calendarId": "string",
                "timeMin": "string",
                "timeMax": "string",
                "maxResults": "number"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "1000/day"
        },
        {
            "service": "google_workspace",
            "resource": "calendar",
            "action": "create_event",
            "method": "POST",
            "path": "/calendar/events",
            "parameters": {
                "calendarId": "string",
                "summary": "string",
                "description": "string",
                "start": "object",
                "end": "object",
                "attendees": "array"
            },
            "auth_type": "oauth2",
            "auth_key": "google_oauth2",
            "rate_limit": "1000/day"
        },
        
        # Authentication Endpoints
        {
            "service": "google_workspace",
            "resource": "auth",
            "action": "generate_auth_url",
            "method": "GET",
            "path": "/auth/url",
            "parameters": {
                "redirectUri": "string",
                "scope": "array"
            },
            "auth_type": "none",
            "auth_key": "none",
            "rate_limit": "100/day"
        },
        {
            "service": "google_workspace",
            "resource": "auth",
            "action": "exchange_code_for_tokens",
            "method": "POST",
            "path": "/auth/token",
            "parameters": {
                "code": "string",
                "redirectUri": "string"
            },
            "auth_type": "none",
            "auth_key": "none",
            "rate_limit": "100/day"
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
        
        logger.info("All Google Workspace endpoints inserted successfully")
        
    except Exception as e:
        logger.error(f"Error inserting Google Workspace endpoints: {str(e)}")
        raise

def main():
    """Main function to insert Google Workspace endpoints."""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Insert Google Workspace endpoints
        insert_google_workspace_endpoints(supabase)
        
        logger.info("Process completed successfully")
        
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        raise

if __name__ == "__main__":
    main() 