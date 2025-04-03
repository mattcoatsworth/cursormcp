#!/usr/bin/env python3
"""
Script to update system_training guidelines to include standardized endpoint format references.
This ensures that all guidelines are compatible with the new standardized endpoint format.
"""

import os
import json
import logging
from typing import Dict, List, Any
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def connect_to_supabase() -> Client:
    """Connect to Supabase using environment variables"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
    
    return create_client(supabase_url, supabase_key)

def get_all_guidelines(supabase: Client) -> List[Dict[str, Any]]:
    """Fetch all guidelines from system_training table"""
    logger.info("Fetching all guidelines from system_training table")
    result = supabase.table('system_training').select('*').execute()
    
    if hasattr(result, 'error') and result.error:
        raise Exception(f"Error fetching guidelines: {result.error}")
    
    return result.data

def update_guidelines_with_endpoint_format(guidelines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Update guidelines to include standardized endpoint format references"""
    updated_guidelines = []
    
    for guideline in guidelines:
        updated_guideline = guideline.copy()
        
        # Skip if guidelines field is not present
        if 'guidelines' not in updated_guideline:
            logger.warning(f"Guideline {updated_guideline.get('id', 'unknown')} has no guidelines field")
            updated_guidelines.append(updated_guideline)
            continue
        
        # Convert guidelines to dict if it's a string
        if isinstance(updated_guideline['guidelines'], str):
            try:
                updated_guideline['guidelines'] = json.loads(updated_guideline['guidelines'])
            except json.JSONDecodeError:
                logger.error(f"Could not parse guidelines JSON for {updated_guideline.get('id', 'unknown')}")
                updated_guidelines.append(updated_guideline)
                continue
        
        # Add endpoint_format field if not present
        if 'endpoint_format' not in updated_guideline['guidelines']:
            updated_guideline['guidelines']['endpoint_format'] = {
                'required_fields': [
                    'service',
                    'resource',
                    'action',
                    'method',
                    'path',
                    'parameters',
                    'auth_type',
                    'auth_key',
                    'rate_limit'
                ],
                'example': {
                    'service': 'shopify',
                    'resource': 'orders',
                    'action': 'get',
                    'method': 'GET',
                    'path': '/admin/api/2023-01/orders/{order_id}.json',
                    'parameters': {
                        'order_id': 'string',
                        'fields': 'string'
                    },
                    'auth_type': 'oauth',
                    'auth_key': 'SHOPIFY_ACCESS_TOKEN',
                    'rate_limit': 2
                }
            }
        
        # Add endpoint_references field if not present
        if 'endpoint_references' not in updated_guideline['guidelines']:
            updated_guideline['guidelines']['endpoint_references'] = []
        
        # Add version tracking for the update
        if 'metadata' not in updated_guideline['guidelines']:
            updated_guideline['guidelines']['metadata'] = {}
        
        updated_guideline['guidelines']['metadata']['endpoint_format_version'] = '1.0'
        updated_guideline['guidelines']['metadata']['last_updated'] = '2025-04-01'
        
        updated_guidelines.append(updated_guideline)
    
    return updated_guidelines

def save_updated_guidelines(supabase: Client, updated_guidelines: List[Dict[str, Any]]) -> None:
    """Save updated guidelines back to the system_training table"""
    logger.info(f"Saving {len(updated_guidelines)} updated guidelines")
    
    for guideline in updated_guidelines:
        # Extract the ID and guidelines for the update
        guideline_id = guideline['id']
        updated_data = {
            'guidelines': guideline['guidelines']
        }
        
        # Update the guideline in the database
        result = supabase.table('system_training').update(updated_data).eq('id', guideline_id).execute()
        
        if hasattr(result, 'error') and result.error:
            logger.error(f"Error updating guideline {guideline_id}: {result.error}")
        else:
            logger.info(f"Successfully updated guideline {guideline_id}")

def main():
    """Main function to update system_training guidelines"""
    try:
        logger.info("Starting system_training guidelines update")
        
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Get all guidelines
        guidelines = get_all_guidelines(supabase)
        logger.info(f"Found {len(guidelines)} guidelines")
        
        # Update guidelines with endpoint format
        updated_guidelines = update_guidelines_with_endpoint_format(guidelines)
        
        # Save updated guidelines
        save_updated_guidelines(supabase, updated_guidelines)
        
        logger.info("System_training guidelines update completed successfully")
        
    except Exception as e:
        logger.error(f"Error updating system_training guidelines: {str(e)}")
        raise

if __name__ == "__main__":
    main() 