#!/usr/bin/env python3
"""
Script to run regular validation of the training data.
This ensures that all training data continues to follow the standardized format
and properly references the system_training guidelines.
"""

import os
import json
import logging
import argparse
import uuid
from typing import Dict, List, Any, Tuple
from pathlib import Path
from datetime import datetime
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

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Validate training data')
    parser.add_argument('--fix', action='store_true', help='Fix issues found during validation')
    parser.add_argument('--report-only', action='store_true', help='Only generate a report, do not save to Supabase')
    parser.add_argument('--limit', type=int, default=1000, help='Limit the number of training data entries to validate')
    return parser.parse_args()

def connect_to_supabase() -> Client:
    """Connect to Supabase using environment variables"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
    
    return create_client(supabase_url, supabase_key)

def get_training_data(supabase: Client, limit: int = 1000) -> List[Dict[str, Any]]:
    """Fetch training data from the training_data table"""
    logger.info(f"Fetching up to {limit} training data entries")
    result = supabase.table('training_data').select('*').limit(limit).execute()
    
    if hasattr(result, 'error') and result.error:
        raise Exception(f"Error fetching training data: {result.error}")
    
    return result.data

def get_guidelines(supabase: Client) -> Dict[str, Dict[str, Any]]:
    """Fetch all guidelines from system_training table and index by ID"""
    logger.info("Fetching all guidelines from system_training table")
    result = supabase.table('system_training').select('*').execute()
    
    if hasattr(result, 'error') and result.error:
        raise Exception(f"Error fetching guidelines: {result.error}")
    
    # Index guidelines by ID for easier lookup
    guidelines_index = {}
    for guideline in result.data:
        guideline_id = guideline.get('id', '')
        if guideline_id:
            guidelines_index[guideline_id] = guideline
    
    return guidelines_index

def validate_training_data(training_data: List[Dict[str, Any]], guidelines_index: Dict[str, Dict[str, Any]], fix: bool = False) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Validate training data and optionally fix issues"""
    validation_results = {
        'total_entries': len(training_data),
        'valid_entries': 0,
        'invalid_entries': 0,
        'issues_by_type': {},
        'fixed_entries': 0
    }
    
    fixed_entries = []
    
    for entry in training_data:
        entry_id = entry.get('id', 'unknown')
        issues = []
        
        # Validate required fields
        required_fields = ['tool', 'intent', 'query', 'response']
        for field in required_fields:
            if field not in entry or not entry[field]:
                issues.append(f"Missing required field: {field}")
        
        # Validate execution_details
        if 'execution_details' in entry and entry['execution_details']:
            execution_details = entry['execution_details']
            
            # Check if execution_details is a list
            if not isinstance(execution_details, list):
                issues.append("execution_details should be a list")
            else:
                # Validate each endpoint in the list
                for i, endpoint in enumerate(execution_details):
                    endpoint_issues = validate_endpoint(endpoint)
                    for issue in endpoint_issues:
                        issues.append(f"Endpoint {i+1}: {issue}")
        
        # Validate applied_guidelines
        if 'applied_guidelines' in entry and entry['applied_guidelines']:
            applied_guidelines = entry['applied_guidelines']
            
            # Check if applied_guidelines has the required structure
            if not isinstance(applied_guidelines, dict):
                issues.append("applied_guidelines should be a dictionary")
            else:
                # Check for required categories
                required_categories = ['general_guidelines', 'domain_guidelines', 'system_guidelines']
                for category in required_categories:
                    if category not in applied_guidelines:
                        issues.append(f"Missing required category in applied_guidelines: {category}")
                    elif not isinstance(applied_guidelines[category], list):
                        issues.append(f"{category} should be a list")
                
                # Validate guideline references
                for category in required_categories:
                    if category in applied_guidelines and isinstance(applied_guidelines[category], list):
                        for i, guideline in enumerate(applied_guidelines[category]):
                            guideline_id = guideline.get('id', '')
                            if guideline_id and guideline_id not in guidelines_index:
                                issues.append(f"{category} {i+1}: Referenced guideline ID {guideline_id} not found in system_training")
        
        # Update validation results
        if issues:
            validation_results['invalid_entries'] += 1
            
            # Group issues by type
            for issue in issues:
                issue_type = issue.split(':')[0] if ':' in issue else 'Other'
                if issue_type not in validation_results['issues_by_type']:
                    validation_results['issues_by_type'][issue_type] = 0
                validation_results['issues_by_type'][issue_type] += 1
            
            # Fix issues if requested
            if fix:
                fixed_entry = fix_issues(entry, issues, guidelines_index)
                if fixed_entry:
                    fixed_entries.append(fixed_entry)
                    validation_results['fixed_entries'] += 1
        else:
            validation_results['valid_entries'] += 1
    
    return validation_results, fixed_entries

def validate_endpoint(endpoint: Dict[str, Any]) -> List[str]:
    """Validate an endpoint in the execution_details"""
    issues = []
    
    # Check required fields
    required_fields = ['service', 'resource', 'action', 'method', 'path']
    for field in required_fields:
        if field not in endpoint or not endpoint[field]:
            issues.append(f"Missing required field: {field}")
    
    # Validate method
    if 'method' in endpoint and endpoint['method']:
        valid_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        if endpoint['method'] not in valid_methods:
            issues.append(f"Invalid HTTP method: {endpoint['method']}")
    
    # Validate path format
    if 'path' in endpoint and endpoint['path']:
        if not endpoint['path'].startswith('/'):
            issues.append("Path should start with a forward slash")
    
    # Validate parameters if present
    if 'parameters' in endpoint and endpoint['parameters']:
        if not isinstance(endpoint['parameters'], dict):
            issues.append("Parameters should be a dictionary")
    
    return issues

def fix_issues(entry: Dict[str, Any], issues: List[str], guidelines_index: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Fix issues found during validation"""
    fixed_entry = entry.copy()
    
    # Fix missing required fields
    if "Missing required field: tool" in issues:
        fixed_entry['tool'] = 'unknown'
    
    if "Missing required field: intent" in issues:
        fixed_entry['intent'] = 'unknown'
    
    if "Missing required field: query" in issues:
        fixed_entry['query'] = 'Unknown query'
    
    if "Missing required field: response" in issues:
        fixed_entry['response'] = 'Unknown response'
    
    # Fix execution_details issues
    if 'execution_details' in fixed_entry:
        if not isinstance(fixed_entry['execution_details'], list):
            fixed_entry['execution_details'] = []
        else:
            # Fix each endpoint in the list
            for i, endpoint in enumerate(fixed_entry['execution_details']):
                if not isinstance(endpoint, dict):
                    fixed_entry['execution_details'][i] = {
                        'service': 'unknown',
                        'resource': 'unknown',
                        'action': 'unknown',
                        'method': 'GET',
                        'path': '/unknown'
                    }
                else:
                    # Add missing required fields
                    if 'service' not in endpoint or not endpoint['service']:
                        endpoint['service'] = 'unknown'
                    if 'resource' not in endpoint or not endpoint['resource']:
                        endpoint['resource'] = 'unknown'
                    if 'action' not in endpoint or not endpoint['action']:
                        endpoint['action'] = 'unknown'
                    if 'method' not in endpoint or not endpoint['method']:
                        endpoint['method'] = 'GET'
                    if 'path' not in endpoint or not endpoint['path']:
                        endpoint['path'] = '/unknown'
                    elif not endpoint['path'].startswith('/'):
                        endpoint['path'] = '/' + endpoint['path']
                    
                    # Fix parameters if present
                    if 'parameters' in endpoint and not isinstance(endpoint['parameters'], dict):
                        endpoint['parameters'] = {}
                    
                    fixed_entry['execution_details'][i] = endpoint
    
    # Fix applied_guidelines issues
    if 'applied_guidelines' not in fixed_entry or not isinstance(fixed_entry['applied_guidelines'], dict):
        fixed_entry['applied_guidelines'] = {
            'general_guidelines': [],
            'domain_guidelines': [],
            'system_guidelines': []
        }
    else:
        # Ensure all required categories exist
        required_categories = ['general_guidelines', 'domain_guidelines', 'system_guidelines']
        for category in required_categories:
            if category not in fixed_entry['applied_guidelines']:
                fixed_entry['applied_guidelines'][category] = []
            elif not isinstance(fixed_entry['applied_guidelines'][category], list):
                fixed_entry['applied_guidelines'][category] = []
    
    return fixed_entry

def save_validation_results(supabase: Client, validation_results: Dict[str, Any], report_only: bool = False) -> None:
    """Save validation results to Supabase"""
    logger.info("Saving validation results")
    
    # Create a timestamp for the report
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Create a new entry in the system_training table for the validation results
    data = {
        'id': str(uuid.uuid4()),  # Generate a proper UUID
        'category': 'validation',
        'name': f'Training Data Validation Report - {timestamp}',
        'description': 'Validation report for training data',
        'guidelines': validation_results,
        'tags': ['validation', 'training_data'],
        'source': ['system_training'],
        'version': 1,
        'is_active': True
    }
    
    if not report_only:
        result = supabase.table('system_training').insert(data).execute()
        
        if hasattr(result, 'error') and result.error:
            logger.error(f"Error saving validation results: {result.error}")
        else:
            logger.info("Successfully saved validation results")
    else:
        logger.info("Report-only mode: Not saving validation results to Supabase")

def save_fixed_entries(supabase: Client, fixed_entries: List[Dict[str, Any]]) -> None:
    """Save fixed entries back to the training_data table"""
    if not fixed_entries:
        logger.info("No fixed entries to save")
        return
    
    logger.info(f"Saving {len(fixed_entries)} fixed entries")
    
    for entry in fixed_entries:
        # Extract the ID and updated data
        entry_id = entry['id']
        updated_data = {
            'execution_details': entry.get('execution_details', []),
            'applied_guidelines': entry.get('applied_guidelines', {})
        }
        
        # Update the entry in the database
        result = supabase.table('training_data').update(updated_data).eq('id', entry_id).execute()
        
        if hasattr(result, 'error') and result.error:
            logger.error(f"Error updating training data entry {entry_id}: {result.error}")
        else:
            logger.info(f"Successfully updated training data entry {entry_id}")

def main():
    """Main function to validate training data"""
    try:
        # Parse command line arguments
        args = parse_arguments()
        
        logger.info("Starting training data validation")
        if args.fix:
            logger.info("Fix mode enabled: Will attempt to fix issues found during validation")
        if args.report_only:
            logger.info("Report-only mode enabled: Will not save validation results to Supabase")
        
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Get training data
        training_data = get_training_data(supabase, args.limit)
        logger.info(f"Found {len(training_data)} training data entries")
        
        # Get guidelines
        guidelines_index = get_guidelines(supabase)
        logger.info(f"Found {len(guidelines_index)} guidelines")
        
        # Validate training data
        validation_results, fixed_entries = validate_training_data(training_data, guidelines_index, args.fix)
        
        # Print validation results
        logger.info(f"Validation completed: {validation_results['valid_entries']} valid entries, {validation_results['invalid_entries']} invalid entries")
        if args.fix:
            logger.info(f"Fixed {validation_results['fixed_entries']} entries")
        
        # Print issues by type
        logger.info("Issues by type:")
        for issue_type, count in validation_results['issues_by_type'].items():
            logger.info(f"  {issue_type}: {count}")
        
        # Save validation results
        save_validation_results(supabase, validation_results, args.report_only)
        
        # Save fixed entries if in fix mode
        if args.fix and fixed_entries:
            save_fixed_entries(supabase, fixed_entries)
        
        logger.info("Training data validation completed successfully")
        
    except Exception as e:
        logger.error(f"Error validating training data: {str(e)}")
        raise

if __name__ == "__main__":
    main() 