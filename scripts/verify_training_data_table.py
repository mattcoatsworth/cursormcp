import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

def verify_training_data_table():
    """Verify and update the training_data table structure."""
    try:
        # First, check if we can access the table
        result = supabase.table("training_data").select("*").limit(1).execute()
        
        if result.data:
            print("\nTraining data table exists. Sample entry:")
            entry = result.data[0]
            for key, value in entry.items():
                print(f"{key}: {value}")
            
            # Check for required columns
            required_columns = {
                'tool', 'intent', 'query', 'response', 'systems', 'workflow',
                'execution_details', 'follow_up_queries', 'follow_up_responses',
                'follow_up_context', 'is_active', 'version'
            }
            
            existing_columns = set(entry.keys())
            missing_columns = required_columns - existing_columns
            
            if missing_columns:
                print("\nMissing columns detected:")
                for col in missing_columns:
                    print(f"- {col}")
                print("\nPlease run the SQL script to add these columns.")
            else:
                print("\nAll required columns are present.")
        else:
            print("\nTraining data table exists but no data found.")
            
    except Exception as e:
        print(f"Error verifying table structure: {str(e)}")

if __name__ == "__main__":
    verify_training_data_table() 