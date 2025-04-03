import os
import json
import logging
import uuid
from datetime import datetime, timezone
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

def insert_sample_data(supabase: Client):
    """Insert sample data into both training_data and user_data tables."""
    logger.info("Inserting sample data...")
    
    # Sample training data
    training_data = {
        "tool": "codebase_search",
        "intent": "find_function",
        "query": "Find functions related to user authentication",
        "response": "Found 3 relevant functions in auth.py",
        "systems": ["auth", "user_management"],
        "workflow": ["search", "analyze", "document"],
        "execution_details": {
            "search_terms": ["authentication", "login", "user"],
            "files_searched": 5,
            "matches_found": 3
        },
        "applied_guidelines": ["security", "best_practices"],
        "metadata": {
            "complexity": "medium",
            "domain": "security"
        },
        "follow_up_queries": [
            "Show me the implementation of these functions",
            "What security measures are in place?"
        ],
        "follow_up_responses": [
            "Here are the function implementations...",
            "The following security measures are implemented..."
        ],
        "follow_up_context": {
            "auth_functions": ["login", "register", "verify"],
            "security_level": "high"
        },
        "feedback_score": 5,
        "feedback_notes": "Excellent example of authentication function search",
        "is_archived": False,
        "is_active": True
    }
    
    try:
        # Insert training data
        result = supabase.table("training_data").insert(training_data).execute()
        logger.info("Inserted training data successfully")
        
    except Exception as e:
        logger.error(f"Error inserting sample data: {str(e)}")
        raise

def run_sample_queries(supabase: Client):
    """Run sample queries to demonstrate the combined view usage."""
    logger.info("Running sample queries...")
    
    try:
        # Query 1: Get all high-quality examples (feedback_score >= 4)
        result = supabase.table("combined_training_view").select("*").gte("feedback_score", 4).execute()
        logger.info(f"Found {len(result.data)} high-quality examples")
        
        # Query 2: Get examples by system
        result = supabase.table("combined_training_view").select("*").contains("systems", ["auth"]).execute()
        logger.info(f"Found {len(result.data)} examples related to auth system")
        
        # Query 3: Get recent examples with follow-up queries
        result = supabase.table("combined_training_view").select("*").not_.is_("follow_up_queries", "null").execute()
        logger.info(f"Found {len(result.data)} examples with follow-up queries")
        
        # Query 4: Get examples by workflow step
        result = supabase.table("combined_training_view").select("*").contains("workflow", ["analyze"]).execute()
        logger.info(f"Found {len(result.data)} examples with 'analyze' in workflow")
        
        # Print out some example data
        if result.data:
            logger.info("Example data from combined view:")
            for entry in result.data[:2]:  # Show first 2 entries
                logger.info(f"ID: {entry.get('id')}")
                logger.info(f"Source: {entry.get('source_type')}")
                logger.info(f"Tool: {entry.get('tool')}")
                logger.info(f"Systems: {entry.get('systems')}")
                logger.info("---")
        
    except Exception as e:
        logger.error(f"Error running sample queries: {str(e)}")
        raise

def validate_data_quality(supabase: Client):
    """Validate data quality and consistency."""
    logger.info("Validating data quality...")
    
    try:
        # Check 1: Verify required fields
        result = supabase.table("combined_training_view").select("*").is_("tool", "null").execute()
        if result.data:
            logger.warning(f"Found {len(result.data)} entries with missing tool field")
        
        # Check 2: Verify data types
        result = supabase.table("combined_training_view").select("*").not_.is_("execution_details", "null").execute()
        for entry in result.data:
            if not isinstance(entry.get("execution_details"), dict):
                logger.warning(f"Invalid execution_details format in entry {entry.get('id')}")
        
        # Check 3: Verify feedback scores are within range
        result = supabase.table("combined_training_view").select("*").lt("feedback_score", 1).execute()
        if result.data:
            logger.warning(f"Found {len(result.data)} entries with invalid feedback scores")
        
        # Check 4: Verify arrays are properly formatted
        result = supabase.table("combined_training_view").select("*").not_.is_("systems", "null").execute()
        for entry in result.data:
            if not isinstance(entry.get("systems"), list):
                logger.warning(f"Invalid systems format in entry {entry.get('id')}")
        
        logger.info("Data validation completed")
        
    except Exception as e:
        logger.error(f"Error validating data: {str(e)}")
        raise

def main():
    """Main function to run all tests."""
    try:
        supabase = get_supabase_client()
        
        # Step 1: Insert sample data
        insert_sample_data(supabase)
        
        # Step 2: Run sample queries
        run_sample_queries(supabase)
        
        # Step 3: Validate data quality
        validate_data_quality(supabase)
        
        logger.info("All tests completed successfully")
        
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        raise

if __name__ == "__main__":
    main() 