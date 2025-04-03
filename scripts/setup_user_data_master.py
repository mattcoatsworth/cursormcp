#!/usr/bin/env python3
"""
Master script to set up and manage user data.
This script will:
1. Create the necessary tables in Supabase
2. Migrate existing user data to the new structure
3. Set up validation and analysis functions
4. Provide a unified interface for managing user data
"""

import os
import sys
import logging
import argparse
import subprocess
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_script(script_name: str, args: list = None) -> bool:
    """Run a Python script and return True if successful"""
    if args is None:
        args = []
    
    logger.info(f"Running script: {script_name}")
    
    try:
        result = subprocess.run(
            [sys.executable, script_name] + args,
            check=True,
            capture_output=True,
            text=True
        )
        logger.info(f"Script {script_name} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Script {script_name} failed with exit code {e.returncode}")
        logger.error("")
        logger.error(e.stdout)
        logger.error(e.stderr)
        return False

def main():
    """Main function to set up and manage user data"""
    parser = argparse.ArgumentParser(description="Set up and manage user data")
    parser.add_argument("--user-id", help="User ID to process data for")
    parser.add_argument("--skip-tables", action="store_true", help="Skip creating tables")
    parser.add_argument("--skip-migration", action="store_true", help="Skip migrating user data")
    parser.add_argument("--skip-validation", action="store_true", help="Skip validating user data")
    parser.add_argument("--skip-analysis", action="store_true", help="Skip analyzing user data")
    parser.add_argument("--migrate-to-training", action="store_true", help="Migrate user data to training data")
    args = parser.parse_args()
    
    try:
        logger.info("Starting user data setup process")
        
        # Step 1: Create tables in Supabase
        if not args.skip_tables:
            logger.info("Step 1: Creating tables in Supabase")
            if not run_script("scripts/create_tables.py"):
                logger.error("Failed to create tables")
                return
        
        # Step 2: Migrate existing user data
        if not args.skip_migration:
            logger.info("Step 2: Migrating existing user data")
            migration_args = []
            if args.user_id:
                migration_args.extend(["--user-id", args.user_id])
            
            if not run_script("scripts/migrate_user_data.py", migration_args):
                logger.error("Failed to migrate user data")
                return
        
        # Step 3: Validate user data
        if not args.skip_validation and args.user_id:
            logger.info("Step 3: Validating user data")
            if not run_script("scripts/migrate_user_data.py", ["--user-id", args.user_id, "--validate"]):
                logger.error("Failed to validate user data")
                return
        
        # Step 4: Analyze user data effectiveness
        if not args.skip_analysis and args.user_id:
            logger.info("Step 4: Analyzing user data effectiveness")
            if not run_script("scripts/migrate_user_data.py", ["--user-id", args.user_id, "--analyze-effectiveness"]):
                logger.error("Failed to analyze user data effectiveness")
                return
        
        # Step 5: Migrate user data to training data
        if args.migrate_to_training and args.user_id:
            logger.info("Step 5: Migrating user data to training data")
            if not run_script("scripts/migrate_user_data.py", ["--user-id", args.user_id, "--migrate-to-training"]):
                logger.error("Failed to migrate user data to training data")
                return
        
        logger.info("User data setup process completed successfully")
        logger.info("Next steps:")
        logger.info("1. Review the validation report in the user_validation_reports table")
        logger.info("2. Review the effectiveness analysis in the user_effectiveness_analysis table")
        logger.info("3. Run the validation script regularly to ensure data quality")
        
    except Exception as e:
        logger.error(f"Error setting up user data: {e}")
        raise

if __name__ == "__main__":
    main() 