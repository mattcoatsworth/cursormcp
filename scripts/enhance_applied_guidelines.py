#!/usr/bin/env python3
"""
Script to enhance the tracking of applied guidelines in the training data.
This ensures that all training data properly references the system_training guidelines it was based on.
"""

import os
import json
import logging
from typing import Dict, List, Any, Set
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

def get_all_guidelines(supabase: Client) -> Dict[str, Dict[str, Any]]:
    """Fetch all guidelines from system_training table and index by category"""
    logger.info("Fetching all guidelines from system_training table")
    result = supabase.table('system_training').select('*').execute()
    
    if hasattr(result, 'error') and result.error:
        raise Exception(f"Error fetching guidelines: {result.error}")
    
    # Index guidelines by category and name for easier lookup
    guidelines_index = {}
    for guideline in result.data:
        category = guideline.get('category', 'unknown')
        name = guideline.get('name', 'unknown')
        
        if category not in guidelines_index:
            guidelines_index[category] = {}
        
        guidelines_index[category][name] = guideline
    
    return guidelines_index

def get_training_data(supabase: Client, limit: int = 100) -> List[Dict[str, Any]]:
    """Fetch training data from the training_data table"""
    logger.info(f"Fetching up to {limit} training data entries")
    result = supabase.table('training_data').select('*').limit(limit).execute()
    
    if hasattr(result, 'error') and result.error:
        raise Exception(f"Error fetching training data: {result.error}")
    
    return result.data

def enhance_applied_guidelines(training_data: List[Dict[str, Any]], guidelines_index: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enhance the applied_guidelines field in training data"""
    enhanced_data = []
    
    for entry in training_data:
        enhanced_entry = entry.copy()
        
        # Initialize applied_guidelines if not present
        if 'applied_guidelines' not in enhanced_entry:
            enhanced_entry['applied_guidelines'] = {
                'general_guidelines': [],
                'domain_guidelines': []
            }
        
        # Extract systems from the entry
        systems = enhanced_entry.get('systems', [])
        
        # Extract tool and intent
        tool = enhanced_entry.get('tool', '')
        intent = enhanced_entry.get('intent', '')
        
        # Determine applicable guidelines based on systems, tool, and intent
        applicable_guidelines = determine_applicable_guidelines(systems, tool, intent, guidelines_index)
        
        # Update the applied_guidelines field
        enhanced_entry['applied_guidelines'] = {
            'general_guidelines': applicable_guidelines.get('general', []),
            'domain_guidelines': applicable_guidelines.get('domain', []),
            'system_guidelines': applicable_guidelines.get('system', []),
            'metadata': {
                'last_updated': '2025-04-01',
                'update_version': '1.0'
            }
        }
        
        enhanced_data.append(enhanced_entry)
    
    return enhanced_data

def determine_applicable_guidelines(systems: List[str], tool: str, intent: str, guidelines_index: Dict[str, Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Determine which guidelines apply to the training data entry"""
    applicable = {
        'general': [],
        'domain': [],
        'system': []
    }
    
    # Add general guidelines
    if 'general' in guidelines_index:
        for name, guideline in guidelines_index['general'].items():
            applicable['general'].append({
                'id': guideline.get('id', ''),
                'category': 'general',
                'name': name,
                'description': guideline.get('description', '')
            })
    
    # Add domain-specific guidelines based on tool
    if tool and tool.lower() in guidelines_index:
        for name, guideline in guidelines_index[tool.lower()].items():
            applicable['domain'].append({
                'id': guideline.get('id', ''),
                'category': tool.lower(),
                'name': name,
                'description': guideline.get('description', '')
            })
    
    # Add system-specific guidelines
    for system in systems:
        system_lower = system.lower()
        if system_lower in guidelines_index:
            for name, guideline in guidelines_index[system_lower].items():
                applicable['system'].append({
                    'id': guideline.get('id', ''),
                    'category': system_lower,
                    'name': name,
                    'description': guideline.get('description', '')
                })
    
    return applicable

def save_enhanced_training_data(supabase: Client, enhanced_data: List[Dict[str, Any]]) -> None:
    """Save enhanced training data back to the training_data table"""
    logger.info(f"Saving {len(enhanced_data)} enhanced training data entries")
    
    for entry in enhanced_data:
        # Extract the ID and applied_guidelines for the update
        entry_id = entry['id']
        updated_data = {
            'applied_guidelines': entry['applied_guidelines']
        }
        
        # Update the entry in the database
        result = supabase.table('training_data').update(updated_data).eq('id', entry_id).execute()
        
        if hasattr(result, 'error') and result.error:
            logger.error(f"Error updating training data entry {entry_id}: {result.error}")
        else:
            logger.info(f"Successfully updated training data entry {entry_id}")

def main():
    """Main function to enhance applied guidelines in training data"""
    try:
        logger.info("Starting applied guidelines enhancement")
        
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Get all guidelines
        guidelines_index = get_all_guidelines(supabase)
        logger.info(f"Found guidelines for {len(guidelines_index)} categories")
        
        # Get training data
        training_data = get_training_data(supabase)
        logger.info(f"Found {len(training_data)} training data entries")
        
        # Enhance applied guidelines
        enhanced_data = enhance_applied_guidelines(training_data, guidelines_index)
        
        # Save enhanced training data
        save_enhanced_training_data(supabase, enhanced_data)
        
        logger.info("Applied guidelines enhancement completed successfully")
        
    except Exception as e:
        logger.error(f"Error enhancing applied guidelines: {str(e)}")
        raise

if __name__ == "__main__":
    main() 