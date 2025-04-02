import os
from dotenv import load_dotenv
from supabase import create_client, Client
from api_endpoints import (
    SHOPIFY_ENDPOINTS,
    KLAVIYO_ENDPOINTS,
    TRIPLE_WHALE_ENDPOINTS,
    NORTHBEAM_ENDPOINTS,
    GORGIAS_ENDPOINTS,
    POSTSCRIPT_ENDPOINTS,
    GOOGLE_CALENDAR_ENDPOINTS,
    ASANA_ENDPOINTS,
    SLACK_ENDPOINTS,
    NOTION_ENDPOINTS,
    GOOGLE_DRIVE_ENDPOINTS,
    FIGMA_ENDPOINTS,
    ELEVAR_ENDPOINTS
)

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def store_endpoints():
    """Store all API endpoints in Supabase."""
    all_endpoints = [
        ("Shopify", SHOPIFY_ENDPOINTS),
        ("Klaviyo", KLAVIYO_ENDPOINTS),
        ("Triple Whale", TRIPLE_WHALE_ENDPOINTS),
        ("Northbeam", NORTHBEAM_ENDPOINTS),
        ("Gorgias", GORGIAS_ENDPOINTS),
        ("Postscript", POSTSCRIPT_ENDPOINTS),
        ("Google Calendar", GOOGLE_CALENDAR_ENDPOINTS),
        ("Asana", ASANA_ENDPOINTS),
        ("Slack", SLACK_ENDPOINTS),
        ("Notion", NOTION_ENDPOINTS),
        ("Google Drive", GOOGLE_DRIVE_ENDPOINTS),
        ("Figma", FIGMA_ENDPOINTS),
        ("Elevar", ELEVAR_ENDPOINTS)
    ]

    total_endpoints = 0
    for service, endpoints in all_endpoints:
        for resource, actions in endpoints.items():
            for action, details in actions.items():
                # Skip if this is a nested endpoint structure
                if not isinstance(details, dict) or "method" not in details:
                    print(f"Skipping nested endpoint: {service} - {resource} - {action}")
                    continue
                
                try:
                    endpoint_data = {
                        "service": service,
                        "resource": resource,
                        "action": action,
                        "method": details["method"],
                        "path": details["path"],
                        "parameters": details.get("parameters", {}),
                        "auth_type": details["auth"]["type"],
                        "auth_key": details["auth"]["key"],
                        "rate_limit": details["rate_limit"]
                    }
                    
                    result = supabase.table("api_endpoints").upsert(endpoint_data).execute()
                    total_endpoints += 1
                    print(f"Stored endpoint: {service} - {resource} - {action}")
                except Exception as e:
                    print(f"Error storing endpoint {service} - {resource} - {action}: {e}")

    print(f"\nTotal endpoints stored: {total_endpoints}")

def main():
    """Main function to run the migration."""
    print("Starting API endpoints migration...")
    
    # Store the endpoints
    store_endpoints()
    
    print("Migration completed!")

if __name__ == "__main__":
    main() 