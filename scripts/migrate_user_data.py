#!/usr/bin/env python3
"""
Migrate existing user data to the new structure and ensure it follows the same format as the training data.
This script will:
1. Connect to Supabase
2. Fetch existing user data
3. Standardize the data to match the training data format
4. Save the standardized data back to Supabase
"""

import os
import json
import logging
import argparse
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def connect_to_supabase() -> Client:
    """Connect to Supabase with service role key"""
    load_dotenv()
    
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not service_role_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
    
    return create_client(supabase_url, service_role_key)

def fetch_user_data(supabase: Client, user_id: Optional[str] = None, limit: int = 1000) -> List[Dict[str, Any]]:
    """Fetch user data from Supabase"""
    logger.info(f"Fetching up to {limit} user data entries")
    
    query = supabase.table("user_data").select("*")
    
    if user_id:
        query = query.eq("user_id", user_id)
    
    query = query.limit(limit)
    result = query.execute()
    
    if hasattr(result, 'error') and result.error:
        logger.error(f"Error fetching user data: {result.error}")
        return []
    
    data = result.data
    logger.info(f"Found {len(data)} user data entries")
    
    return data

def fetch_system_guidelines(supabase: Client) -> Dict[str, Dict[str, Any]]:
    """Fetch system guidelines from Supabase"""
    logger.info("Fetching all guidelines from system_training table")
    
    result = supabase.table("system_training").select("*").execute()
    
    if hasattr(result, 'error') and result.error:
        logger.error(f"Error fetching system guidelines: {result.error}")
        return {}
    
    guidelines = result.data
    logger.info(f"Found {len(guidelines)} guidelines")
    
    # Create an index for faster lookups
    guidelines_index = {guideline['id']: guideline for guideline in guidelines}
    
    return guidelines_index

def standardize_endpoint(endpoint: Dict[str, Any]) -> Dict[str, Any]:
    """Standardize an endpoint to match the training data format"""
    standardized = {
        'service': endpoint.get('service', 'unknown'),
        'resource': endpoint.get('resource', 'unknown'),
        'action': endpoint.get('action', 'unknown'),
        'method': endpoint.get('method', 'GET'),
        'path': endpoint.get('path', '/unknown'),
        'parameters': endpoint.get('parameters', {}),
        'auth_type': endpoint.get('auth_type', 'none'),
        'auth_key': endpoint.get('auth_key', ''),
        'rate_limit': endpoint.get('rate_limit', 0)
    }
    
    # Ensure path starts with a forward slash
    if standardized['path'] and not standardized['path'].startswith('/'):
        standardized['path'] = '/' + standardized['path']
    
    return standardized

def standardize_applied_guidelines(applied_guidelines: Dict[str, Any], guidelines_index: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Standardize applied guidelines to match the training data format"""
    standardized = {
        'general_guidelines': [],
        'domain_guidelines': [],
        'system_guidelines': []
    }
    
    # If applied_guidelines is not a dictionary, return the default structure
    if not isinstance(applied_guidelines, dict):
        return standardized
    
    # Ensure all required categories exist
    for category in ['general_guidelines', 'domain_guidelines', 'system_guidelines']:
        if category not in applied_guidelines:
            applied_guidelines[category] = []
        elif not isinstance(applied_guidelines[category], list):
            applied_guidelines[category] = []
    
    # Validate guideline references
    for category in ['general_guidelines', 'domain_guidelines', 'system_guidelines']:
        if category in applied_guidelines and isinstance(applied_guidelines[category], list):
            valid_guidelines = []
            for guideline in applied_guidelines[category]:
                if isinstance(guideline, dict) and 'id' in guideline:
                    guideline_id = guideline['id']
                    if guideline_id in guidelines_index:
                        valid_guidelines.append(guideline)
                elif isinstance(guideline, str) and guideline in guidelines_index:
                    valid_guidelines.append({'id': guideline})
            
            standardized[category] = valid_guidelines
    
    return standardized

def standardize_user_data(entry: Dict[str, Any], guidelines_index: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Standardize user data to match the training data format"""
    standardized = entry.copy()
    
    # Standardize execution_details
    if 'execution_details' in standardized:
        if not isinstance(standardized['execution_details'], list):
            standardized['execution_details'] = []
        else:
            standardized['execution_details'] = [
                standardize_endpoint(endpoint) if isinstance(endpoint, dict) else endpoint
                for endpoint in standardized['execution_details']
            ]
    else:
        standardized['execution_details'] = []
    
    # Standardize applied_guidelines
    if 'applied_guidelines' in standardized:
        standardized['applied_guidelines'] = standardize_applied_guidelines(
            standardized['applied_guidelines'], 
            guidelines_index
        )
    else:
        standardized['applied_guidelines'] = {
            'general_guidelines': [],
            'domain_guidelines': [],
            'system_guidelines': []
        }
    
    return standardized

def update_user_data(supabase: Client, entry: Dict[str, Any]) -> bool:
    """Update user data in Supabase"""
    entry_id = entry.get('id')
    
    if not entry_id:
        logger.error("Cannot update entry without an ID")
        return False
    
    # Remove the id field for the update
    update_data = entry.copy()
    del update_data['id']
    
    result = supabase.table("user_data").update(update_data).eq("id", entry_id).execute()
    
    if hasattr(result, 'error') and result.error:
        logger.error(f"Error updating user data entry {entry_id}: {result.error}")
        return False
    
    logger.info(f"Successfully updated user data entry {entry_id}")
    return True

def migrate_user_data_to_training(supabase: Client, user_id: str, tool: str, intent: str) -> bool:
    """Migrate user data to training data"""
    logger.info(f"Migrating user data to training data for user {user_id}, tool {tool}, intent {intent}")
    
    # Call the migrate_user_data_to_training function in Supabase
    result = supabase.rpc(
        'migrate_user_data_to_training',
        {'p_user_id': user_id, 'p_tool': tool, 'p_intent': intent}
    ).execute()
    
    if hasattr(result, 'error') and result.error:
        logger.error(f"Error migrating user data to training data: {result.error}")
        return False
    
    logger.info("Successfully migrated user data to training data")
    return True

def analyze_user_data_effectiveness(supabase: Client, user_id: str) -> bool:
    """Analyze user data effectiveness"""
    logger.info(f"Analyzing user data effectiveness for user {user_id}")
    
    # Call the analyze_user_data_effectiveness function in Supabase
    result = supabase.rpc(
        'analyze_user_data_effectiveness',
        {'p_user_id': user_id}
    ).execute()
    
    if hasattr(result, 'error') and result.error:
        logger.error(f"Error analyzing user data effectiveness: {result.error}")
        return False
    
    logger.info("Successfully analyzed user data effectiveness")
    return True

def validate_user_data(supabase: Client, user_id: str) -> bool:
    """Validate user data"""
    logger.info(f"Validating user data for user {user_id}")
    
    # Call the validate_user_data function in Supabase
    result = supabase.rpc(
        'validate_user_data',
        {'p_user_id': user_id}
    ).execute()
    
    if hasattr(result, 'error') and result.error:
        logger.error(f"Error validating user data: {result.error}")
        return False
    
    logger.info("Successfully validated user data")
    return True

def main():
    """Main function to migrate user data"""
    parser = argparse.ArgumentParser(description="Migrate user data to the new structure")
    parser.add_argument("--user-id", help="User ID to migrate data for")
    parser.add_argument("--limit", type=int, default=1000, help="Maximum number of entries to process")
    parser.add_argument("--migrate-to-training", action="store_true", help="Migrate user data to training data")
    parser.add_argument("--analyze-effectiveness", action="store_true", help="Analyze user data effectiveness")
    parser.add_argument("--validate", action="store_true", help="Validate user data")
    args = parser.parse_args()
    
    try:
        logger.info("Starting user data migration")
        
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Fetch user data
        user_data = fetch_user_data(supabase, args.user_id, args.limit)
        
        if not user_data:
            logger.warning("No user data found to migrate")
            return
        
        # Fetch system guidelines
        guidelines_index = fetch_system_guidelines(supabase)
        
        # Standardize user data
        standardized_data = []
        for entry in user_data:
            standardized_entry = standardize_user_data(entry, guidelines_index)
            standardized_data.append(standardized_entry)
        
        # Update user data in Supabase
        updated_count = 0
        for entry in standardized_data:
            if update_user_data(supabase, entry):
                updated_count += 1
        
        logger.info(f"Updated {updated_count} user data entries")
        
        # Migrate user data to training data if requested
        if args.migrate_to_training and args.user_id:
            migrate_user_data_to_training(supabase, args.user_id, "all", "all")
        
        # Analyze user data effectiveness if requested
        if args.analyze_effectiveness and args.user_id:
            analyze_user_data_effectiveness(supabase, args.user_id)
        
        # Validate user data if requested
        if args.validate and args.user_id:
            validate_user_data(supabase, args.user_id)
        
        logger.info("User data migration completed successfully")
        
    except Exception as e:
        logger.error(f"Error migrating user data: {e}")
        raise

if __name__ == "__main__":
    main() 