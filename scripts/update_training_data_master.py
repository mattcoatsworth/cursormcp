#!/usr/bin/env python3
"""
Master script to run all steps in sequence to update and standardize training data.
This script orchestrates the entire process of updating system_training guidelines,
standardizing training data, enhancing applied guidelines tracking, analyzing effectiveness,
and validating the results.
"""

import os
import sys
import logging
import argparse
import subprocess
from typing import List, Dict, Any
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Update and standardize training data')
    parser.add_argument('--skip-standardization', action='store_true', help='Skip the standardization step')
    parser.add_argument('--skip-enhancement', action='store_true', help='Skip the enhancement step')
    parser.add_argument('--skip-analysis', action='store_true', help='Skip the analysis step')
    parser.add_argument('--skip-validation', action='store_true', help='Skip the validation step')
    parser.add_argument('--fix-validation', action='store_true', help='Fix issues found during validation')
    parser.add_argument('--report-only', action='store_true', help='Only generate reports, do not save to Supabase')
    return parser.parse_args()

def run_script(script_name: str, args: List[str] = None) -> bool:
    """Run a Python script and return True if successful"""
    logger.info(f"Running script: {script_name}")
    
    # Build the command
    command = [sys.executable, script_name]
    if args:
        command.extend(args)
    
    # Run the command
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        logger.info(f"Script {script_name} completed successfully")
        logger.debug(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Script {script_name} failed with exit code {e.returncode}")
        logger.error(e.stdout)
        logger.error(e.stderr)
        return False

def main():
    """Main function to run all steps in sequence"""
    try:
        # Parse command line arguments
        args = parse_arguments()
        
        logger.info("Starting training data update process")
        
        # Step 1: Update system_training guidelines
        logger.info("Step 1: Updating system_training guidelines")
        if not run_script("scripts/update_system_training_guidelines.py"):
            logger.error("Failed to update system_training guidelines")
            return
        
        # Step 2: Standardize training data
        if not args.skip_standardization:
            logger.info("Step 2: Standardizing training data")
            if not run_script("scripts/standardize_training_data.py"):
                logger.error("Failed to standardize training data")
                return
        else:
            logger.info("Skipping standardization step")
        
        # Step 3: Enhance applied guidelines tracking
        if not args.skip_enhancement:
            logger.info("Step 3: Enhancing applied guidelines tracking")
            if not run_script("scripts/enhance_applied_guidelines.py"):
                logger.error("Failed to enhance applied guidelines tracking")
                return
        else:
            logger.info("Skipping enhancement step")
        
        # Step 4: Analyze guideline effectiveness
        if not args.skip_analysis:
            logger.info("Step 4: Analyzing guideline effectiveness")
            if not run_script("scripts/analyze_guideline_effectiveness.py"):
                logger.error("Failed to analyze guideline effectiveness")
                return
        else:
            logger.info("Skipping analysis step")
        
        # Step 5: Validate training data
        if not args.skip_validation:
            logger.info("Step 5: Validating training data")
            validation_args = []
            if args.fix_validation:
                validation_args.append("--fix")
            if args.report_only:
                validation_args.append("--report-only")
            
            if not run_script("scripts/validate_training_data_regular.py", validation_args):
                logger.error("Failed to validate training data")
                return
        else:
            logger.info("Skipping validation step")
        
        logger.info("Training data update process completed successfully")
        logger.info("Next steps:")
        logger.info("1. Review the validation report in the system_training table")
        logger.info("2. Update the system_training guidelines based on the effectiveness analysis")
        logger.info("3. Run the validation script regularly to ensure data quality")
        
    except Exception as e:
        logger.error(f"Error in training data update process: {str(e)}")
        raise

if __name__ == "__main__":
    main() 