import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def verify_algorithm():
    try:
        # Query the algorithms table
        response = supabase.table('algorithms').select('*').eq('is_active', True).execute()
        
        if response.data:
            algorithm = response.data[0]
            print("\nCurrent Active Algorithm:")
            print(f"Name: {algorithm['name']}")
            print(f"Version: {algorithm['version']}")
            print(f"Is Active: {algorithm['is_active']}")
            print(f"Last Updated: {algorithm['updated_at']}")
        else:
            print("No active algorithm found in the database.")
            
    except Exception as e:
        print(f"Error verifying algorithm: {str(e)}")

if __name__ == "__main__":
    verify_algorithm() 