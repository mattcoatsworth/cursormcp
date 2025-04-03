import logging
import subprocess
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_script(script_name: str) -> bool:
    """Run a Python script and return whether it succeeded."""
    try:
        logger.info(f"Running {script_name}...")
        result = subprocess.run(
            ["python", script_name],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.error(f"Error running {script_name}:")
            logger.error(result.stderr)
            return False
            
        logger.info(f"Successfully completed {script_name}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to run {script_name}: {str(e)}")
        return False

def main():
    scripts_dir = Path("scripts")
    
    # Step 1: Standardize existing training data
    if not run_script(str(scripts_dir / "standardize_training_data.py")):
        logger.error("Failed to standardize training data. Aborting.")
        return
    
    # Step 2: Update training data generation code
    # Note: This step requires manual review of the changes
    logger.info("\nPlease review the changes to parallel_training_generator.py")
    logger.info("After reviewing, press Enter to continue...")
    input()
    
    # Step 3: Validate all training data
    if not run_script(str(scripts_dir / "validate_training_data.py")):
        logger.error("Validation failed. Please check the validation results.")
        return
    
    logger.info("\nAll steps completed successfully!")
    logger.info("Next steps:")
    logger.info("1. Review the standardized training data")
    logger.info("2. Test the updated training data generation")
    logger.info("3. Commit the changes to version control")

if __name__ == "__main__":
    main() 