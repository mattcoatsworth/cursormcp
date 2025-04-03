import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_alignment_sql():
    """Generate SQL commands for aligning data structures"""
    try:
        # Read the alignment SQL
        with open('scripts/align_data_structures.sql', 'r') as file:
            alignment_sql = file.read()
            
        # Read the setup SQL
        with open('scripts/setup_sql_function.sql', 'r') as file:
            setup_sql = file.read()
            
        # Combine the SQL commands
        combined_sql = f"""
-- First, set up the execute_sql function
{setup_sql}

-- Then, align the data structures
{alignment_sql}
"""
        
        # Write to a new file
        output_file = 'scripts/complete_alignment.sql'
        with open(output_file, 'w') as file:
            file.write(combined_sql)
            
        logger.info(f"SQL commands written to {output_file}")
        logger.info("Please run these commands in the Supabase SQL editor")
        
    except Exception as e:
        logger.error(f"Error generating SQL: {e}")
        raise

if __name__ == "__main__":
    generate_alignment_sql() 